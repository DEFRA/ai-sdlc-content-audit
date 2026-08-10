import { buildGuidanceOverviewModel } from './build-guidance-overview-model.js'
import { buildStatementsFromGuidanceComparisons } from './build-page-detail-statements.js'
import {
  buildPageDetailGuidanceRows,
  wrapLegacyStatementsAsGuidanceRows
} from './build-page-detail-guidance-rows.js'
import {
  LEGACY_OVERVIEW_STATUS_ORDER,
  OVERVIEW_STATUS_ORDER,
  STATUS_META,
  STATUS_ORDER
} from './constants.js'
import { buildGuidanceComparisonViewModels } from './create-guidance-comparison-view-model.js'

function categoryKey(categoryId, id) {
  return `${categoryId}:${id}`
}

export function createAuditService(presentation, loadedRunIds = []) {
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

  const legislationByCategoryId = new Map(
    legislation.map((l) => [categoryKey(l.category, l.source_record_id), l])
  )
  const legislationPropositionByCategoryId = new Map(
    legislationPropositions.map((lp) => [categoryKey(lp.category, lp.id), lp])
  )
  const pageById = new Map(pages.map((p) => [p.content_id, p]))
  const pageAnalyticsById = new Map(pageAnalytics.map((a) => [a.content_id, a]))
  const readingAgeByPageId = new Map(
    pageReadingAge.map((r) => [r.content_id, r])
  )

  const guidancePropositionById = new Map(
    guidancePropositions.map((gp) => [gp.id, gp])
  )

  const guidancePropositionsByCategoryPage = new Map()
  for (const gp of guidancePropositions) {
    const key = `${gp.category}:${gp.content_id}`
    if (!guidancePropositionsByCategoryPage.has(key)) {
      guidancePropositionsByCategoryPage.set(key, [])
    }
    guidancePropositionsByCategoryPage.get(key).push(gp)
  }

  const matchByCategoryGuidanceId = new Map()
  for (const m of propositionMatches) {
    if (m.guidance_proposition_id == null) continue
    if (m.category == null) continue
    matchByCategoryGuidanceId.set(
      categoryKey(m.category, m.guidance_proposition_id),
      m
    )
  }

  // Legacy page-detail path: all GUIDANCE_MISSING rows in proposition-matches
  // (includes synthetic law-side gaps). Do not feed guidance-side top matches
  // from this file into the new guidance comparison view-model.
  const missingMatches = propositionMatches.filter(
    (m) => m.relationship === 'GUIDANCE_MISSING'
  )

  const guidanceComparisonBundle =
    buildGuidanceComparisonViewModels(presentation)

  function pageIdsForCategory(categoryId) {
    return pageIdsByCategory.get(categoryId) ?? []
  }

  function guidanceForCategoryPage(categoryId, pageId) {
    return (
      guidancePropositionsByCategoryPage.get(`${categoryId}:${pageId}`) ?? []
    )
  }

  function matchForGuidance(categoryId, guidancePropositionId) {
    return (
      matchByCategoryGuidanceId.get(
        categoryKey(categoryId, guidancePropositionId)
      ) ?? null
    )
  }

  function legislationForCategory(categoryId, sourceRecordId) {
    return (
      legislationByCategoryId.get(categoryKey(categoryId, sourceRecordId)) ??
      null
    )
  }

  function legislationPropositionForCategory(categoryId, propositionId) {
    return (
      legislationPropositionByCategoryId.get(
        categoryKey(categoryId, propositionId)
      ) ?? null
    )
  }

  /**
   * New guidance-comparison contract is evaluated per category.
   * A rebuilt run with summaries must not force legacy sibling categories
   * (no summaries) onto the new path — that would mark every legacy GP
   * INCONSISTENT_DATA when runs are merged.
   */
  function hasGuidanceComparisonContract(categoryId) {
    const summaries = presentation.guidance_proposition_match_summaries ?? []
    if (summaries.length === 0) return false
    if (categoryId == null) return true
    for (const summary of summaries) {
      if (summary.category === categoryId) return true
      const gp = guidancePropositionById.get(summary.guidance_proposition_id)
      if (gp?.category === categoryId) return true
    }
    return false
  }

  function overviewModelForCategory(categoryId) {
    return buildGuidanceOverviewModel({
      categoryId,
      guidanceComparisons: guidanceComparisonBundle.guidanceComparisons,
      pageIds: pageIdsForCategory(categoryId),
      lawSideMissingGuidance: guidanceComparisonBundle.lawSideMissingGuidance,
      legislationPropositionForCategory,
      overviewStatusKeys: OVERVIEW_STATUS_ORDER
    })
  }

  function conflictsCountForPage(categoryId, pageId) {
    // Unit: distinct guidance propositions on the page with a CONFLICTS pair.
    if (hasGuidanceComparisonContract(categoryId)) {
      return (
        overviewModelForCategory(categoryId).conflictsCountByPage.get(pageId) ??
        0
      )
    }
    const gps = guidanceForCategoryPage(categoryId, pageId)
    let n = 0
    for (const gp of gps) {
      const m = matchForGuidance(categoryId, gp.id)
      if (m && m.relationship === 'CONFLICTS') n++
    }
    return n
  }

  function statusForPage(categoryId, pageId) {
    if (hasGuidanceComparisonContract(categoryId)) {
      return (
        overviewModelForCategory(categoryId).pageStatusSets.get(pageId) ??
        new Set()
      )
    }
    // Legacy: Map-of-one top-match relationships only.
    const gps = guidanceForCategoryPage(categoryId, pageId)
    const set = new Set()
    for (const gp of gps) {
      const m = matchForGuidance(categoryId, gp.id)
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
      if (categoryId != null && lp.category !== categoryId) continue
      if (!propositionsByLaw.has(lp.source_record_id)) {
        propositionsByLaw.set(lp.source_record_id, [])
      }
      propositionsByLaw.get(lp.source_record_id).push(lp)
    }

    const matchesByLawPropositionId = new Map()
    for (const m of propositionMatches) {
      if (m.law_proposition_id == null) continue
      if (categoryId != null && m.category !== categoryId) continue
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

    if (hasGuidanceComparisonContract(categoryId)) {
      const model = overviewModelForCategory(categoryId)
      return {
        category,
        lawsFound: summary.laws_found,
        totalPagesAudited: summary.total_pages_audited,
        pagesInCategory: pageIds.length,
        // Distinct guidance propositions per status (GUIDANCE_MISSING = law-side rows).
        statusCounts: model.statusCounts,
        // Distinct pages per guidance-side status.
        pagesByStatus: model.pagesByStatus,
        // Distinct law instruments with synthetic missing-guidance rows.
        lawsMissingGuidance: model.lawsMissingGuidance,
        totalGuidancePropositions: model.totalGuidancePropositions,
        overviewStatusOrder: OVERVIEW_STATUS_ORDER,
        usesGuidanceComparisonContract: true
      }
    }

    // Legacy path: assembler subject_summary + Map-of-one page membership.
    const pagesByStatus = {}
    for (const status of LEGACY_OVERVIEW_STATUS_ORDER) {
      pagesByStatus[status] = 0
    }
    for (const pid of pageIds) {
      for (const s of statusForPage(categoryId, pid)) {
        if (pagesByStatus[s] != null) pagesByStatus[s] += 1
      }
    }

    const missingLawIds = new Set()
    for (const m of missingMatches) {
      if (m.category !== categoryId) continue
      if (m.law_proposition_id == null) continue
      const lp = legislationPropositionForCategory(
        categoryId,
        m.law_proposition_id
      )
      if (!lp) continue
      missingLawIds.add(lp.source_record_id)
    }

    return {
      category,
      lawsFound: summary.laws_found,
      totalPagesAudited: summary.total_pages_audited,
      pagesInCategory: pageIds.length,
      statusCounts: summary.proposition_status_counts,
      pagesByStatus,
      lawsMissingGuidance: missingLawIds.size,
      overviewStatusOrder: LEGACY_OVERVIEW_STATUS_ORDER,
      usesGuidanceComparisonContract: false
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

  /**
   * Page-level Law to Guidance comparison summaries (new contract only).
   * Pair columns = distinct GPs with ≥1 reportable pair of that relationship.
   * Fallback columns = mutually exclusive proposition-level outcomes.
   * Law-side GUIDANCE_MISSING is excluded.
   *
   * @param {string} categoryId
   * @param {string|null} [statusFilter]
   * @returns {Array<object>|null} null when category lacks the new contract
   */
  function getLawToGuidancePages(categoryId, statusFilter = null) {
    if (!hasGuidanceComparisonContract(categoryId)) return null

    const model = overviewModelForCategory(categoryId)
    const pageIds = pageIdsForCategory(categoryId)
    let rows = pageIds
      .map((pageId) => {
        const page = pageById.get(pageId)
        if (!page) return null
        const summary = model.pageComparisonSummaries.get(pageId) ?? {
          pageId,
          totalGuidancePropositions: 0,
          hasReportableComparisons: 0,
          GROUNDED: 0,
          GUIDANCE_BROADER: 0,
          GUIDANCE_INCOMPLETE: 0,
          CONFLICTS: 0,
          ONLY_UNGROUNDED_CANDIDATES: 0,
          NO_CANDIDATES_FOUND: 0,
          NOT_CHECKED: 0,
          PARTIAL: 0,
          FAILED: 0,
          INCONSISTENT_DATA: 0
        }
        return {
          id: page.content_id,
          title: page.title,
          url: page.url,
          ...summary
        }
      })
      .filter(Boolean)

    if (statusFilter) {
      rows = rows.filter((row) =>
        statusForPage(categoryId, row.id).has(statusFilter)
      )
    }

    return rows
  }

  function buildStatement(categoryId, guidanceProp, match) {
    const meta = STATUS_META[match.relationship]
    let lawName = null
    let lawUrl = null
    let lawText = null

    if (match.law_proposition_id != null) {
      const lp = legislationPropositionForCategory(
        categoryId,
        match.law_proposition_id
      )
      if (lp) {
        const law = legislationForCategory(categoryId, lp.source_record_id)
        lawName = law?.name ?? null
        lawUrl = lp.provision_url ?? law?.url ?? null
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
    const legacy = propositionMatches.find((m) => m.id === propositionMatchId)
    if (legacy) return legacy.relationship

    // Multi-hit reportable pairs live in the full-comparisons file; IDs are
    // pair-specific (m-{sha8(gp,law)}) so feedback can target each hit.
    const comparisons = presentation.guidance_proposition_law_comparisons ?? []
    const comparison = comparisons.find((m) => m.id === propositionMatchId)
    return comparison ? comparison.relationship : null
  }

  function buildLegacyStatements(categoryId, pageId) {
    const gps = guidanceForCategoryPage(categoryId, pageId)
    return gps
      .map((gp) => {
        const match = matchForGuidance(categoryId, gp.id)
        if (!match) return null
        const statement = buildStatement(categoryId, gp, match)
        return {
          ...statement,
          feedbackEnabled: true,
          rowKind: 'comparison',
          accessibleName: `${statement.statusLabel}: ${statement.guidanceText}`,
          order: 0
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.severity - b.severity)
      .map((statement, index) => ({ ...statement, order: index }))
  }

  function getPageDetail(categoryId, pageId) {
    const page = pageById.get(pageId)
    if (!page) return null
    if (!pageIdsForCategory(categoryId).includes(pageId)) return null

    // Prefer guidance-comparison contract when this category has summaries.
    // Sibling legacy categories (no summaries) keep the top-match projection.
    const statements = hasGuidanceComparisonContract(categoryId)
      ? buildStatementsFromGuidanceComparisons({
          categoryId,
          pageId,
          guidanceComparisons: guidanceComparisonBundle.guidanceComparisons,
          legislationForCategory
        })
      : buildLegacyStatements(categoryId, pageId)

    const missingLaws = missingMatches
      .map((m) => {
        if (m.category !== categoryId) return null
        if (m.law_proposition_id == null) return null
        const lp = legislationPropositionForCategory(
          categoryId,
          m.law_proposition_id
        )
        if (!lp) return null
        const law = legislationForCategory(categoryId, lp.source_record_id)
        return {
          lawName: law?.name ?? null,
          lawUrl: lp.provision_url ?? law?.url ?? null,
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

  /**
   * Aggregated guidance-proposition rows for the default page-detail view.
   * @param {string} categoryId
   * @param {string} pageId
   * @param {string|null} [statusFilter]
   */
  function getPageGuidanceRows(categoryId, pageId, statusFilter = null) {
    const page = pageById.get(pageId)
    if (!page) return null
    if (!pageIdsForCategory(categoryId).includes(pageId)) return null

    if (hasGuidanceComparisonContract(categoryId)) {
      return buildPageDetailGuidanceRows({
        categoryId,
        pageId,
        guidanceComparisons: guidanceComparisonBundle.guidanceComparisons,
        legislationForCategory,
        statusFilter
      })
    }

    return wrapLegacyStatementsAsGuidanceRows(
      buildLegacyStatements(categoryId, pageId),
      statusFilter
    )
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

  /**
   * Guidance-side comparison view-models for the later UI increment.
   * Built from match-summaries + law-comparisons only — not from
   * proposition-matches top-match rows.
   */
  function getGuidanceComparisons() {
    return guidanceComparisonBundle.guidanceComparisons
  }

  /** Synthetic law-side GUIDANCE_MISSING rows (legacy compatibility path). */
  function getLawSideMissingGuidance() {
    return guidanceComparisonBundle.lawSideMissingGuidance
  }

  function getGuidanceComparisonDiagnostics() {
    return guidanceComparisonBundle.diagnostics
  }

  return {
    STATUS_META,
    STATUS_ORDER,
    loadedRunIds,
    getCategory,
    getAllCategories,
    getSubjectOverview,
    getRelevantPages,
    getLawToGuidancePages,
    getPageDetail,
    getPageGuidanceRows,
    getDashboardPages,
    getLawsForSubject,
    getMatchStatus,
    getGuidanceComparisons,
    getLawSideMissingGuidance,
    getGuidanceComparisonDiagnostics
  }
}
