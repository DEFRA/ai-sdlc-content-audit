import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATUS_META, STATUS_ORDER } from './constants.js'

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
const pageAggregations = load('page-aggregations.json')
const pageAnalytics = load('page-analytics.json')
const subjectSummaries = load('subject-summary.json')
const pageRelevance = load('page-relevance.json')
const pageReadingAge = load('pages-reading-age.json')

const subjectSummaryByCategory = new Map(
  subjectSummaries.map((s) => [s.category_id, s])
)
const relevanceByCategoryPage = new Map(
  pageRelevance.map((r) => [`${r.category_id}:${r.page_id}`, r.relevance_score])
)

const legislationById = new Map(legislation.map((l) => [l.id, l]))
const legislationPropositionById = new Map(
  legislationPropositions.map((lp) => [lp.id, lp])
)
const pageById = new Map(pages.map((p) => [p.id, p]))
const pageAggregationById = new Map(pageAggregations.map((a) => [a.page_id, a]))
const pageAnalyticsById = new Map(pageAnalytics.map((a) => [a.page_id, a]))
const readingAgeByPageId = new Map(pageReadingAge.map((r) => [r.page_id, r]))

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

function pageIdsForCategory(categoryId) {
  return pages.filter((p) => p.category_id === categoryId).map((p) => p.id)
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

function getLawsForSubject(categoryId) {
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

  const lawsForCategory =
    categoryId == null
      ? legislation
      : legislation.filter((l) => l.category_id === categoryId)

  return lawsForCategory.map((law) => {
    const props = propositionsByLaw.get(law.id) ?? []
    let propsWithGuidance = 0
    let conflictsCount = 0

    for (const prop of props) {
      const matches = matchesByLawPropositionId.get(prop.id) ?? []
      let hasGuidance = false
      for (const m of matches) {
        if (m.match_status !== 'GUIDANCE_MISSING') hasGuidance = true
        if (m.match_status === 'CONFLICTS') conflictsCount++
      }
      if (hasGuidance) propsWithGuidance++
    }

    return {
      id: law.id,
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
    if (m.legislation_proposition_id == null) continue
    const lp = legislationPropositionById.get(m.legislation_proposition_id)
    if (!lp) continue
    const law = legislationById.get(lp.legislation_id)
    if (law && law.category_id !== categoryId) continue
    missingLawIds.add(lp.legislation_id)
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
  const agg = pageAggregationById.get(pageId)
  return {
    id: page.id,
    url: page.url,
    title: page.title,
    correctness: agg?.quality_score?.correctness ?? null,
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
    lawText,
    explanation: match.explanation ?? null,
    confidence: match.confidence ?? null,
    correctnessScore: match.correctness_score ?? null
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

  // GUIDANCE_MISSING is a subject-level concern (no per-page link), so show
  // the union for the subject under the page detail, scoped to the page's
  // own category.
  const missingLaws = missingMatches
    .map((m) => {
      if (m.legislation_proposition_id == null) return null
      const lp = legislationPropositionById.get(m.legislation_proposition_id)
      if (!lp) return null
      const law = legislationById.get(lp.legislation_id)
      if (
        law &&
        page.category_id != null &&
        law.category_id !== page.category_id
      ) {
        return null
      }
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
    statements,
    missingLaws
  }
}

function getDashboardPages(categoryId = null) {
  const source = categoryId
    ? pages.filter((p) => p.category_id === categoryId)
    : pages
  const rows = source.map((p) => {
    const agg = pageAggregationById.get(p.id)
    const analytics = pageAnalyticsById.get(p.id)
    const reading = readingAgeByPageId.get(p.id)
    return {
      id: p.id,
      categoryId: p.category_id,
      title: p.title,
      url: p.url,
      correctness: agg?.quality_score?.correctness ?? null,
      conflictsCount: conflictsCountForPage(p.id),
      lastUpdated: analytics?.last_updated_date ?? null,
      views: analytics?.view_count_period ?? null,
      relevanceScore:
        relevanceByCategoryPage.get(`${p.category_id}:${p.id}`) ?? null,
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
