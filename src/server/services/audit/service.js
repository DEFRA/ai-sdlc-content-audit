import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { RELEVANCE_THRESHOLD, STATUS_META, STATUS_ORDER } from './constants.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

const categories = load('categories.json')
const legislation = load('legislation.json')
const legislationPropositions = load('legislation-propositions.json')
const pages = load('pages.json')
const guidancePropositions = load('guidance-propositions.json')
const propositionMatches = load('proposition-matches.json')
const semanticSimilarity = load('semantic-similarity.json')
const pageAggregations = load('page-aggregations.json')
const pageAnalytics = load('page-analytics.json')
const subjectSummary = load('subject-summary.json')

const legislationById = new Map(legislation.map((l) => [l.id, l]))
const legislationPropositionById = new Map(
  legislationPropositions.map((lp) => [lp.id, lp])
)
const pageById = new Map(pages.map((p) => [p.id, p]))
const pageAggregationById = new Map(pageAggregations.map((a) => [a.page_id, a]))
const pageAnalyticsById = new Map(pageAnalytics.map((a) => [a.page_id, a]))

const guidancePropositionsByPage = new Map()
for (const gp of guidancePropositions) {
  if (!guidancePropositionsByPage.has(gp.page_id)) {
    guidancePropositionsByPage.set(gp.page_id, [])
  }
  guidancePropositionsByPage.get(gp.page_id).push(gp)
}

const matchByGuidanceId = new Map()
for (const m of propositionMatches) {
  if (m.guidance_proposition_id != null) {
    matchByGuidanceId.set(m.guidance_proposition_id, m)
  }
}

const missingMatches = propositionMatches.filter(
  (m) => m.match_status === 'GUIDANCE_MISSING'
)

function relevantPageIdsForCategory(categoryId) {
  return semanticSimilarity
    .filter(
      (s) => s.category_id === categoryId && s.llm_score >= RELEVANCE_THRESHOLD
    )
    .map((s) => s.page_id)
}

function conflictsCountForPage(pageId) {
  const gps = guidancePropositionsByPage.get(pageId) ?? []
  let n = 0
  for (const gp of gps) {
    const m = matchByGuidanceId.get(gp.id)
    if (m && m.match_status === 'CONFLICTS') n++
  }
  return n
}

function statusForPage(pageId) {
  // returns a set of all match_status values present on this page's guidance propositions
  const gps = guidancePropositionsByPage.get(pageId) ?? []
  const set = new Set()
  for (const gp of gps) {
    const m = matchByGuidanceId.get(gp.id)
    if (m) set.add(m.match_status)
  }
  return set
}

function getCategory(categoryId) {
  return categories.find((c) => c.id === categoryId) ?? null
}

function getAllCategories() {
  return categories
}

const COVERAGE_WEIGHTS = {
  GROUNDED: 1,
  GUIDANCE_BROADER: 1,
  GUIDANCE_INCOMPLETE: 0.5,
  GUIDANCE_MISSING: 0,
  CONFLICTS: 0,
  UNGROUNDED: 0
}

function getLawsForSubject() {
  // We have only one category, so propositions for every law in the dataset are
  // in-scope for the subject. Group matches by the law a legislation_proposition
  // belongs to and compute a coverage score from match statuses.
  const propositionsByLaw = new Map()
  for (const lp of legislationPropositions) {
    if (!propositionsByLaw.has(lp.legislation_id)) {
      propositionsByLaw.set(lp.legislation_id, [])
    }
    propositionsByLaw.get(lp.legislation_id).push(lp)
  }

  const matchesByLawPropositionId = new Map()
  for (const m of propositionMatches) {
    if (m.legislation_proposition_id == null) continue
    if (!matchesByLawPropositionId.has(m.legislation_proposition_id)) {
      matchesByLawPropositionId.set(m.legislation_proposition_id, [])
    }
    matchesByLawPropositionId.get(m.legislation_proposition_id).push(m)
  }

  return legislation.map((law) => {
    const props = propositionsByLaw.get(law.id) ?? []
    let scoreSum = 0
    let propsWithGuidance = 0
    let conflictsCount = 0

    for (const prop of props) {
      const matches = matchesByLawPropositionId.get(prop.id) ?? []
      if (matches.length === 0) {
        // proposition with no matches at all — counts as missing
        scoreSum += 0
        continue
      }

      // best status for this proposition wins (any GROUNDED beats incomplete)
      let bestWeight = 0
      let hasGuidance = false
      for (const m of matches) {
        const w = COVERAGE_WEIGHTS[m.match_status] ?? 0
        if (w > bestWeight) bestWeight = w
        if (m.match_status !== 'GUIDANCE_MISSING') hasGuidance = true
        if (m.match_status === 'CONFLICTS') conflictsCount++
      }
      scoreSum += bestWeight
      if (hasGuidance) propsWithGuidance++
    }

    const propositionCount = props.length
    const coverage = propositionCount > 0 ? scoreSum / propositionCount : 0

    return {
      id: law.id,
      name: law.name,
      url: law.url,
      propositionCount,
      propositionsWithGuidance: propsWithGuidance,
      conflictsCount,
      coverage
    }
  })
}

function getSubjectOverview(categoryId) {
  const category = getCategory(categoryId)
  if (!category) return null

  const pageIds = relevantPageIdsForCategory(categoryId)
  const pagesByStatus = {}
  for (const status of STATUS_ORDER) pagesByStatus[status] = 0
  for (const pid of pageIds) {
    for (const s of statusForPage(pid)) {
      if (pagesByStatus[s] != null) pagesByStatus[s] += 1
    }
  }

  const missingLawIds = new Set()
  for (const m of missingMatches) {
    if (m.legislation_proposition_id == null) continue
    const lp = legislationPropositionById.get(m.legislation_proposition_id)
    if (lp) missingLawIds.add(lp.legislation_id)
  }

  return {
    category,
    lawsFound: subjectSummary.laws_found,
    totalPagesAudited: subjectSummary.total_pages_audited,
    pagesRelevant: subjectSummary.pages_relevant,
    relevanceThreshold: subjectSummary.relevance_threshold,
    statusCounts: subjectSummary.proposition_status_counts,
    pagesByStatus,
    lawsMissingGuidance: missingLawIds.size
  }
}

function decoratePage(pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  const agg = pageAggregationById.get(pageId)
  return {
    id: page.id,
    url: page.url,
    title: page.title,
    correctness: agg?.quality_score?.correctness ?? null,
    completeness: agg?.quality_score?.completeness ?? null,
    conflictsCount: conflictsCountForPage(pageId)
  }
}

function getRelevantPages(categoryId, statusFilter = null) {
  const pageIds = relevantPageIdsForCategory(categoryId)
  let rows = pageIds.map(decoratePage).filter(Boolean)

  if (statusFilter) {
    rows = rows.filter((row) => statusForPage(row.id).has(statusFilter))
  }

  return rows
}

function buildStatement(guidanceProp, match) {
  const meta = STATUS_META[match.match_status]
  let lawName = null
  let lawUrl = null
  let lawText = null

  if (match.legislation_proposition_id != null) {
    const lp = legislationPropositionById.get(match.legislation_proposition_id)
    if (lp) {
      const law = legislationById.get(lp.legislation_id)
      lawName = law?.name ?? null
      lawUrl = law?.url ?? null
      lawText = lp.text
    }
  }

  return {
    id: match.id,
    status: match.match_status,
    guidanceText: guidanceProp.text,
    statusLabel: meta.label,
    statusMeaning: meta.meaning,
    statusTone: meta.tone,
    severity: meta.severity,
    lawName,
    lawUrl,
    lawText
  }
}

function getMatchStatus(propositionMatchId) {
  const match = propositionMatches.find((m) => m.id === propositionMatchId)
  return match ? match.match_status : null
}

function getPageDetail(pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  const agg = pageAggregationById.get(pageId)
  const gps = guidancePropositionsByPage.get(pageId) ?? []

  const statements = gps
    .map((gp) => {
      const match = matchByGuidanceId.get(gp.id)
      if (!match) return null
      return buildStatement(gp, match)
    })
    .filter(Boolean)
    .sort((a, b) => a.severity - b.severity)

  // Laws-with-no-guidance: GUIDANCE_MISSING entries — context-level only (no per-page link),
  // so show the union for the subject under the page detail.
  const missingLaws = missingMatches
    .map((m) => {
      if (m.legislation_proposition_id == null) return null
      const lp = legislationPropositionById.get(m.legislation_proposition_id)
      if (!lp) return null
      const law = legislationById.get(lp.legislation_id)
      return {
        lawName: law?.name ?? null,
        lawUrl: law?.url ?? null,
        lawText: lp.text
      }
    })
    .filter(Boolean)

  return {
    page,
    correctness: agg?.quality_score?.correctness ?? null,
    completeness: agg?.quality_score?.completeness ?? null,
    statements,
    missingLaws
  }
}

function suggestedAction(p) {
  if (p.views >= 200000 && (p.correctness ?? 1) < 0.7) return 'Rework'
  if ((p.correctness ?? 1) < 0.6) return 'Consider deleting'
  if (p.conflictsCount > 0) return 'Rework'
  if ((p.correctness ?? 1) < 0.75) return 'Rework'
  return 'Rework'
}

function getDashboardPages() {
  // Flag a page if correctness < 0.75, completeness < 0.7, or any conflicts.
  const flagged = pages
    .map((p) => {
      const agg = pageAggregationById.get(p.id)
      const analytics = pageAnalyticsById.get(p.id)
      const correctness = agg?.quality_score?.correctness ?? null
      const completeness = agg?.quality_score?.completeness ?? null
      const conflictsCount = conflictsCountForPage(p.id)
      return {
        id: p.id,
        title: p.title,
        url: p.url,
        correctness,
        completeness,
        conflictsCount,
        lastUpdated: analytics?.last_updated_date ?? null,
        views: analytics?.view_count_period ?? null
      }
    })
    .filter(
      (r) =>
        (r.correctness != null && r.correctness < 0.75) ||
        (r.completeness != null && r.completeness < 0.7) ||
        r.conflictsCount > 0
    )

  const scored = flagged.map((p) => {
    const correctnessPenalty = (1 - (p.correctness ?? 1)) * 100
    const completenessPenalty = (1 - (p.completeness ?? 1)) * 40
    const conflictPenalty = p.conflictsCount * 80
    const viewWeight = (p.views ?? 0) / 100000
    const ageDays = p.lastUpdated
      ? (Date.now() - new Date(p.lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
      : 0
    const agePenalty = Math.min(ageDays / 365, 5) * 5

    const attentionScore =
      correctnessPenalty +
      completenessPenalty +
      conflictPenalty +
      viewWeight +
      agePenalty
    return {
      ...p,
      attentionScore,
      suggestedAction: suggestedAction(p)
    }
  })

  scored.sort((a, b) => b.attentionScore - a.attentionScore)
  return scored
}

export const auditService = {
  STATUS_META,
  STATUS_ORDER,
  getCategory,
  getAllCategories,
  getSubjectOverview,
  getRelevantPages,
  getPageDetail,
  getDashboardPages,
  getLawsForSubject,
  getMatchStatus
}
