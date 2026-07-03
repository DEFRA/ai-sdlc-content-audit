import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { STATUS_META, STATUS_ORDER } from './constants.js'
import { loadAuditPresentation } from './load-presentation.js'

const auditDir = dirname(fileURLToPath(import.meta.url))
const runsDir = join(auditDir, 'runs')
const dataDir = join(auditDir, 'data')

// Pipeline-native shapes (Esther output). Loaded from one envelope per category
// under runs/<run-id>/output.json (preferred), or the legacy flat data/ dir.
const { merged: presentation, runIds: loadedRunIds } = loadAuditPresentation({
  runsDir,
  dataDir
})

const categories = presentation.categories
const legislation = presentation.legislation
const legislationPropositions = presentation.legislation_propositions
const pages = presentation.pages
const guidancePropositions = presentation.guidance_propositions
const propositionMatches = presentation.proposition_matches
const pageAnalytics = presentation.page_analytics
const subjectSummaries = presentation.subject_summary
const pageRelevance = presentation.page_relevance
const pageReadingAge = presentation.pages_reading_age

const subjectSummaryByCategory = new Map(
  subjectSummaries.map((s) => [s.category, s])
)
const pageIdsByCategory = new Map()
for (const { category, content_id: contentId } of pageRelevance) {
  if (!pageIdsByCategory.has(category)) pageIdsByCategory.set(category, [])
  pageIdsByCategory.get(category).push(contentId)
}

const legislationById = new Map(legislation.map((l) => [l.source_record_id, l]))
const legislationPropositionById = new Map(
  legislationPropositions.map((lp) => [lp.id, lp])
)
const pageById = new Map(pages.map((p) => [p.content_id, p]))
const pageAnalyticsById = new Map(pageAnalytics.map((a) => [a.content_id, a]))
const readingAgeByPageId = new Map(pageReadingAge.map((r) => [r.content_id, r]))

const guidancePropositionsByCategoryPage = new Map()
for (const gp of guidancePropositions) {
  const key = `${gp.category}:${gp.content_id}`
  if (!guidancePropositionsByCategoryPage.has(key)) {
    guidancePropositionsByCategoryPage.set(key, [])
  }
  guidancePropositionsByCategoryPage.get(key).push(gp)
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
  return pageIdsByCategory.get(categoryId) ?? []
}

function guidanceForCategoryPage(categoryId, pageId) {
  return guidancePropositionsByCategoryPage.get(`${categoryId}:${pageId}`) ?? []
}

function conflictsCountForPage(categoryId, pageId) {
  const gps = guidanceForCategoryPage(categoryId, pageId)
  let n = 0
  for (const gp of gps) {
    const m = matchByGuidanceId.get(gp.id)
    if (m && m.relationship === 'CONFLICTS') n++
  }
  return n
}

function statusForPage(categoryId, pageId) {
  const gps = guidanceForCategoryPage(categoryId, pageId)
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
    for (const s of statusForPage(categoryId, pid)) {
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

function decoratePage(categoryId, pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  return {
    id: page.content_id,
    url: page.url,
    title: page.title,
    conflictsCount: conflictsCountForPage(categoryId, pageId)
  }
}

function getRelevantPages(categoryId, statusFilter = null) {
  const pageIds = pageIdsForCategory(categoryId)
  let rows = pageIds
    .map((pageId) => decoratePage(categoryId, pageId))
    .filter(Boolean)

  if (statusFilter) {
    rows = rows.filter((row) =>
      statusForPage(categoryId, row.id).has(statusFilter)
    )
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

function getPageDetail(categoryId, pageId) {
  const page = pageById.get(pageId)
  if (!page) return null
  if (!pageIdsForCategory(categoryId).includes(pageId)) return null
  const gps = guidanceForCategoryPage(categoryId, pageId)

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
      if (law && law.category !== categoryId) {
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
  const relevanceRows = categoryId
    ? pageRelevance.filter((row) => row.category === categoryId)
    : pageRelevance

  const rows = relevanceRows
    .map((row) => {
      const page = pageById.get(row.content_id)
      if (!page) return null
      const analytics = pageAnalyticsById.get(row.content_id)
      const reading = readingAgeByPageId.get(row.content_id)
      return {
        id: row.content_id,
        categoryId: row.category,
        title: page.title,
        url: page.url,
        conflictsCount: conflictsCountForPage(row.category, row.content_id),
        lastUpdated: analytics?.last_updated_date ?? null,
        views: analytics?.view_count_period ?? null,
        relevanceScore: row.relevance_score ?? null,
        wordCount: reading?.word_count ?? null,
        readingAge: reading?.reading_age ?? null
      }
    })
    .filter(Boolean)

  rows.sort((a, b) => a.title.localeCompare(b.title))
  return rows
}

export const auditService = {
  STATUS_META,
  STATUS_ORDER,
  loadedRunIds,
  getCategory,
  getAllCategories,
  getSubjectOverview,
  getRelevantPages,
  getPageDetail,
  getDashboardPages,
  getLawsForSubject,
  getMatchStatus
}
