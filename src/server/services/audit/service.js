import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATUS_META, STATUS_ORDER } from './constants.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), 'data')

function load(name) {
  return JSON.parse(readFileSync(join(dataDir, name), 'utf8'))
}

// Pipeline-native shapes (Esther output). Entities are keyed by their natural
// pipeline ids: pages by content_id, legislation by source_record_id, law
// propositions by `prop:` id, guidance propositions by `g-` id, matches by a
// derived `m-` id. No synthetic integer surrogate keys.
const categories = load('categories.json')
const legislation = load('legislation.json')
const legislationPropositions = load('legislation-propositions.json')
const pages = load('pages.json')
const guidancePropositions = load('guidance-propositions.json')
const propositionMatches = load('proposition-matches.json')
const pageAnalytics = load('page-analytics.json')
const subjectSummaries = load('subject-summary.json')
const pageRelevance = load('page-relevance.json')
const pageReadingAge = load('pages-reading-age.json')

const subjectSummaryByCategory = new Map(
  subjectSummaries.map((s) => [s.category, s])
)
const relevanceByCategoryPage = new Map(
  pageRelevance.map((r) => [`${r.category}:${r.content_id}`, r.relevance_score])
)

const legislationById = new Map(legislation.map((l) => [l.source_record_id, l]))
const legislationPropositionById = new Map(
  legislationPropositions.map((lp) => [lp.id, lp])
)
const pageById = new Map(pages.map((p) => [p.content_id, p]))
const pageAnalyticsById = new Map(pageAnalytics.map((a) => [a.content_id, a]))
const readingAgeByPageId = new Map(pageReadingAge.map((r) => [r.content_id, r]))

const guidancePropositionsByPage = new Map()
for (const gp of guidancePropositions) {
  if (!guidancePropositionsByPage.has(gp.content_id)) {
    guidancePropositionsByPage.set(gp.content_id, [])
  }
  guidancePropositionsByPage.get(gp.content_id).push(gp)
}

const matchByGuidanceId = new Map()
for (const m of propositionMatches) {
  if (m.guidance_proposition_id != null) {
    matchByGuidanceId.set(m.guidance_proposition_id, m)
  }
}

const missingMatches = propositionMatches.filter(
  (m) => m.relationship === 'GUIDANCE_MISSING'
)

function pageIdsForCategory(categoryId) {
  return pages.filter((p) => p.category === categoryId).map((p) => p.content_id)
}

function conflictsCountForPage(pageId) {
  const gps = guidancePropositionsByPage.get(pageId) ?? []
  let n = 0
  for (const gp of gps) {
    const m = matchByGuidanceId.get(gp.id)
    if (m && m.relationship === 'CONFLICTS') n++
  }
  return n
}

function statusForPage(pageId) {
  const gps = guidancePropositionsByPage.get(pageId) ?? []
  const set = new Set()
  for (const gp of gps) {
    const m = matchByGuidanceId.get(gp.id)
    if (m) set.add(m.relationship)
  }
  return set
}

function getCategory(categoryId) {
  return categories.find((c) => c.id === categoryId) ?? null
}

function getAllCategories() {
  return categories
}

function getLawsForSubject(categoryId) {
  const propositionsByLaw = new Map()
  for (const lp of legislationPropositions) {
    if (!propositionsByLaw.has(lp.source_record_id)) {
      propositionsByLaw.set(lp.source_record_id, [])
    }
    propositionsByLaw.get(lp.source_record_id).push(lp)
  }

  const matchesByLawPropositionId = new Map()
  for (const m of propositionMatches) {
    if (m.law_proposition_id == null) continue
    if (!matchesByLawPropositionId.has(m.law_proposition_id)) {
      matchesByLawPropositionId.set(m.law_proposition_id, [])
    }
    matchesByLawPropositionId.get(m.law_proposition_id).push(m)
  }

  const lawsForCategory =
    categoryId == null
      ? legislation
      : legislation.filter((l) => l.category === categoryId)

  return lawsForCategory.map((law) => {
    const props = propositionsByLaw.get(law.source_record_id) ?? []
    let propsWithGuidance = 0
    let conflictsCount = 0

    for (const prop of props) {
      const matches = matchesByLawPropositionId.get(prop.id) ?? []
      let hasGuidance = false
      for (const m of matches) {
        if (m.relationship !== 'GUIDANCE_MISSING') hasGuidance = true
        if (m.relationship === 'CONFLICTS') conflictsCount++
      }
      if (hasGuidance) propsWithGuidance++
    }

    return {
      id: law.source_record_id,
      name: law.name,
      url: law.url,
      propositionCount: props.length,
      propositionsWithGuidance: propsWithGuidance,
      conflictsCount
    }
  })
}

function getSubjectOverview(categoryId) {
  const category = getCategory(categoryId)
  if (!category) return null

  const summary = subjectSummaryByCategory.get(categoryId)
  if (!summary) return null

  const pageIds = pageIdsForCategory(categoryId)
  const pagesByStatus = {}
  for (const status of STATUS_ORDER) pagesByStatus[status] = 0
  for (const pid of pageIds) {
    for (const s of statusForPage(pid)) {
      if (pagesByStatus[s] != null) pagesByStatus[s] += 1
    }
  }

  const missingLawIds = new Set()
  for (const m of missingMatches) {
    if (m.law_proposition_id == null) continue
    const lp = legislationPropositionById.get(m.law_proposition_id)
    if (!lp) continue
    const law = legislationById.get(lp.source_record_id)
    if (law && law.category !== categoryId) continue
    missingLawIds.add(lp.source_record_id)
  }

  return {
    category,
    lawsFound: summary.laws_found,
    totalPagesAudited: summary.total_pages_audited,
    pagesInCategory: pageIds.length,
    statusCounts: summary.proposition_status_counts,
    pagesByStatus,
    lawsMissingGuidance: missingLawIds.size
  }
}

function decoratePage(pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  return {
    id: page.content_id,
    url: page.url,
    title: page.title,
    conflictsCount: conflictsCountForPage(pageId)
  }
}

function getRelevantPages(categoryId, statusFilter = null) {
  const pageIds = pageIdsForCategory(categoryId)
  let rows = pageIds.map(decoratePage).filter(Boolean)

  if (statusFilter) {
    rows = rows.filter((row) => statusForPage(row.id).has(statusFilter))
  }

  return rows
}

function buildStatement(guidanceProp, match) {
  const meta = STATUS_META[match.relationship]
  let lawName = null
  let lawUrl = null
  let lawText = null

  if (match.law_proposition_id != null) {
    const lp = legislationPropositionById.get(match.law_proposition_id)
    if (lp) {
      const law = legislationById.get(lp.source_record_id)
      lawName = law?.name ?? null
      lawUrl = law?.url ?? null
      lawText = lp.proposition_text
    }
  }

  return {
    id: match.id,
    status: match.relationship,
    guidanceText: guidanceProp.proposition_text,
    statusLabel: meta.label,
    statusMeaning: meta.meaning,
    statusTone: meta.tone,
    severity: meta.severity,
    lawName,
    lawUrl,
    lawText,
    explanation: match.explanation ?? null,
    confidence: match.confidence ?? null
  }
}

function getMatchStatus(propositionMatchId) {
  const match = propositionMatches.find((m) => m.id === propositionMatchId)
  return match ? match.relationship : null
}

function getPageDetail(pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  const gps = guidancePropositionsByPage.get(pageId) ?? []

  const statements = gps
    .map((gp) => {
      const match = matchByGuidanceId.get(gp.id)
      if (!match) return null
      return buildStatement(gp, match)
    })
    .filter(Boolean)
    .sort((a, b) => a.severity - b.severity)

  // GUIDANCE_MISSING is a subject-level concern (no per-page link), so show
  // the union for the subject under the page detail, scoped to the page's
  // own category.
  const missingLaws = missingMatches
    .map((m) => {
      if (m.law_proposition_id == null) return null
      const lp = legislationPropositionById.get(m.law_proposition_id)
      if (!lp) return null
      const law = legislationById.get(lp.source_record_id)
      if (law && page.category != null && law.category !== page.category) {
        return null
      }
      return {
        lawName: law?.name ?? null,
        lawUrl: law?.url ?? null,
        lawText: lp.proposition_text
      }
    })
    .filter(Boolean)

  return {
    page,
    statements,
    missingLaws
  }
}

function getDashboardPages(categoryId = null) {
  const source = categoryId
    ? pages.filter((p) => p.category === categoryId)
    : pages
  const rows = source.map((p) => {
    const analytics = pageAnalyticsById.get(p.content_id)
    const reading = readingAgeByPageId.get(p.content_id)
    return {
      id: p.content_id,
      categoryId: p.category,
      title: p.title,
      url: p.url,
      conflictsCount: conflictsCountForPage(p.content_id),
      lastUpdated: analytics?.last_updated_date ?? null,
      views: analytics?.view_count_period ?? null,
      relevanceScore:
        relevanceByCategoryPage.get(`${p.category}:${p.content_id}`) ?? null,
      wordCount: reading?.word_count ?? null,
      readingAge: reading?.reading_age ?? null
    }
  })

  rows.sort((a, b) => a.title.localeCompare(b.title))
  return rows
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
