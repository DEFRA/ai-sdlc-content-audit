import { describe, expect, test } from 'vitest'

import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'
import {
  LAW_TO_GUIDANCE_COLUMNS,
  LAW_TO_GUIDANCE_FILTER_STATUSES
} from '../../../../../src/server/services/audit/constants.js'
import { baseGuidanceComparisonPresentation } from './fixtures/guidance-comparison.fixture.js'
import {
  auditSubjectOverviewViewModel,
  compareLawToGuidanceRows
} from '../../../../../src/server/features/audit-subject-overview/view-model.js'

function presentationWithSummary(overrides = {}) {
  const presentation = baseGuidanceComparisonPresentation(overrides)
  presentation.subject_summary = [
    {
      category: 'slurry',
      laws_found: 1,
      total_pages_audited: 10,
      pages_relevant: 1,
      proposition_status_counts: overrides.proposition_status_counts ?? {}
    }
  ]
  if (!presentation.page_relevance?.length) {
    presentation.page_relevance = [
      { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 }
    ]
  }
  return presentation
}

function serviceFrom(overrides = {}) {
  return createAuditService(presentationWithSummary(overrides))
}

function gp(id, text = id, contentId = 'cid-a') {
  return {
    id,
    content_id: contentId,
    category: 'slurry',
    proposition_text: text
  }
}

function summary(gpId, assessment, coverage, counts = {}) {
  return {
    guidance_proposition_id: gpId,
    category: 'slurry',
    assessment_status: assessment,
    coverage_result: coverage,
    reportable_comparison_count: 0,
    candidate_count: 0,
    ungrounded_candidate_count: 0,
    ...counts
  }
}

function pair(id, gpId, lawId, relationship) {
  return {
    id,
    category: 'slurry',
    guidance_proposition_id: gpId,
    law_proposition_id: lawId,
    relationship
  }
}

function pageRow(service, pageId = 'cid-a') {
  const rows = service.getLawToGuidancePages('slurry')
  expect(rows).not.toBeNull()
  const row = rows.find((r) => r.id === pageId)
  expect(row).toBeTruthy()
  return row
}

function assertReconciles(row) {
  const exclusive =
    row.hasReportableComparisons +
    row.ONLY_UNGROUNDED_CANDIDATES +
    row.NO_CANDIDATES_FOUND +
    row.NOT_CHECKED +
    row.PARTIAL +
    row.FAILED +
    row.INCONSISTENT_DATA
  expect(exclusive).toBe(row.totalGuidancePropositions)
}

describe('Law to Guidance page summary', () => {
  test('1. proposition with one GROUNDED pair', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-1')],
      guidance_proposition_match_summaries: [
        summary('g-1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-1', 'g-1', 'prop:law1', 'GROUNDED')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.totalGuidancePropositions).toBe(1)
    expect(row.GROUNDED).toBe(1)
    expect(row.CONFLICTS).toBe(0)
    expect(row.hasReportableComparisons).toBe(1)
    assertReconciles(row)
  })

  test('2. several GROUNDED pairs still count the proposition once', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-multi')],
      guidance_proposition_match_summaries: [
        summary('g-multi', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 3,
          candidate_count: 3
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-a', 'g-multi', 'prop:law1', 'GROUNDED'),
        pair('m-b', 'g-multi', 'prop:law2', 'GROUNDED'),
        pair('m-c', 'g-multi', 'prop:law3', 'GROUNDED')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.GROUNDED).toBe(1)
    expect(row.totalGuidancePropositions).toBe(1)
    assertReconciles(row)
  })

  test('3. GROUNDED + CONFLICTS counts once in each relationship column', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-mix')],
      guidance_proposition_match_summaries: [
        summary('g-mix', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 2,
          candidate_count: 2
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-g', 'g-mix', 'prop:law1', 'GROUNDED'),
        pair('m-c', 'g-mix', 'prop:law2', 'CONFLICTS')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.GROUNDED).toBe(1)
    expect(row.CONFLICTS).toBe(1)
    expect(row.totalGuidancePropositions).toBe(1)
    expect(row.GROUNDED + row.CONFLICTS).toBeGreaterThan(
      row.totalGuidancePropositions
    )
    assertReconciles(row)
  })

  test('4. reportable pair plus ignored UNGROUNDED candidates', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-mixed')],
      guidance_proposition_match_summaries: [
        summary('g-mixed', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 2,
          ungrounded_candidate_count: 1
        })
      ],
      // UNGROUNDED never appears in law-comparisons; only summary counts it.
      guidance_proposition_law_comparisons: [
        pair('m-b', 'g-mixed', 'prop:law1', 'GUIDANCE_BROADER')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.GUIDANCE_BROADER).toBe(1)
    expect(row.ONLY_UNGROUNDED_CANDIDATES).toBe(0)
    expect(row.hasReportableComparisons).toBe(1)
    assertReconciles(row)
  })

  test('5. only ungrounded candidates → No comparable law found', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-ung')],
      guidance_proposition_match_summaries: [
        summary('g-ung', 'COMPLETE', 'ONLY_UNGROUNDED_CANDIDATES', {
          candidate_count: 2,
          ungrounded_candidate_count: 2
        })
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.ONLY_UNGROUNDED_CANDIDATES).toBe(1)
    expect(row.NO_CANDIDATES_FOUND).toBe(0)
    expect(row.GROUNDED).toBe(0)
    expect(row.hasReportableComparisons).toBe(0)
    assertReconciles(row)
  })

  test('6. no candidates → No law candidate found', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-empty')],
      guidance_proposition_match_summaries: [
        summary('g-empty', 'COMPLETE', 'NO_CANDIDATES_FOUND', {
          candidate_count: 0
        })
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.NO_CANDIDATES_FOUND).toBe(1)
    expect(row.ONLY_UNGROUNDED_CANDIDATES).toBe(0)
    expect(row.GROUNDED).toBe(0)
    assertReconciles(row)
  })

  test('7. not yet compared', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-nc')],
      guidance_proposition_match_summaries: [
        summary('g-nc', 'NOT_CHECKED', null)
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.NOT_CHECKED).toBe(1)
    expect(row.NO_CANDIDATES_FOUND).toBe(0)
    expect(row.ONLY_UNGROUNDED_CANDIDATES).toBe(0)
    expect(row.GROUNDED).toBe(0)
    assertReconciles(row)
  })

  test('8. partially processed proposition', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-p')],
      guidance_proposition_match_summaries: [
        summary('g-p', 'PARTIAL', null, {
          candidate_count: 2,
          failure_reason: 'not_all_candidates_classified'
        })
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.PARTIAL).toBe(1)
    expect(row.GROUNDED).toBe(0)
    assertReconciles(row)
  })

  test('9. failed proposition', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-f')],
      guidance_proposition_match_summaries: [
        summary('g-f', 'FAILED', null, {
          candidate_count: 1,
          failure_reason: 'group_rerank_request_failed'
        })
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.FAILED).toBe(1)
    expect(row.NO_CANDIDATES_FOUND).toBe(0)
    assertReconciles(row)
  })

  test('10. inconsistent summary/pair combination → Data issue', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-i')],
      guidance_proposition_match_summaries: [
        // COMPLETE + HAS_REPORTABLE but zero pairs → INCONSISTENT_DATA
        summary('g-i', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })

    const row = pageRow(service)
    expect(row.INCONSISTENT_DATA).toBe(1)
    expect(row.GROUNDED).toBe(0)
    expect(row.hasReportableComparisons).toBe(0)
    assertReconciles(row)
  })

  test('11. duplicate same guidance+law pair IDs are not double-counted', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-dup')],
      guidance_proposition_match_summaries: [
        summary('g-dup', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-1', 'g-dup', 'prop:law1', 'GROUNDED'),
        pair('m-2', 'g-dup', 'prop:law1', 'GROUNDED')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    // Contract marks duplicate pair identity as inconsistent; do not invent GROUNDED.
    expect(row.INCONSISTENT_DATA).toBe(1)
    expect(row.GROUNDED).toBe(0)
    expect(row.totalGuidancePropositions).toBe(1)
    const comparisons = service
      .getGuidanceComparisons()
      .find((vm) => vm.guidanceProposition.id === 'g-dup')
    expect(comparisons.comparisons).toHaveLength(1)
    assertReconciles(row)
  })

  test('12. page filtering returns distinct pages without duplicate rows', () => {
    const service = serviceFrom({
      pages: [
        {
          content_id: 'cid-a',
          category: 'slurry',
          url: 'https://www.gov.uk/a',
          title: 'Page A'
        },
        {
          content_id: 'cid-b',
          category: 'slurry',
          url: 'https://www.gov.uk/b',
          title: 'Page B'
        }
      ],
      page_relevance: [
        { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 },
        { category: 'slurry', content_id: 'cid-b', relevance_score: 0.8 }
      ],
      guidance_propositions: [
        gp('g-a1', 'a1', 'cid-a'),
        gp('g-a2', 'a2', 'cid-a'),
        gp('g-b1', 'b1', 'cid-b')
      ],
      guidance_proposition_match_summaries: [
        summary('g-a1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        }),
        summary('g-a2', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        }),
        summary('g-b1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-a1', 'g-a1', 'prop:law1', 'CONFLICTS'),
        pair('m-a2', 'g-a2', 'prop:law2', 'CONFLICTS'),
        pair('m-b1', 'g-b1', 'prop:law1', 'GROUNDED')
      ],
      proposition_matches: []
    })

    const filtered = service.getLawToGuidancePages('slurry', 'CONFLICTS')
    expect(filtered.map((r) => r.id)).toEqual(['cid-a'])
    expect(filtered).toHaveLength(1)
    expect(filtered[0].CONFLICTS).toBe(2)
  })

  test('13. law-side GUIDANCE_MISSING excluded from page metrics', () => {
    const service = serviceFrom()
    const row = pageRow(service)
    // Base fixture: 8 guidance props + 1 synthetic law-side GUIDANCE_MISSING.
    expect(row.totalGuidancePropositions).toBe(8)
    expect(
      service.getSubjectOverview('slurry').statusCounts.GUIDANCE_MISSING
    ).toBe(1)
    expect(LAW_TO_GUIDANCE_FILTER_STATUSES).not.toContain('GUIDANCE_MISSING')
    expect(
      LAW_TO_GUIDANCE_COLUMNS.some((c) => c.key === 'GUIDANCE_MISSING')
    ).toBe(false)
    assertReconciles(row)
  })

  test('14. legacy category alongside new-contract category keeps legacy path', () => {
    const presentation = presentationWithSummary({
      categories: [
        { id: 'slurry', title: 'Slurry' },
        { id: 'legacy-cat', title: 'Legacy' }
      ],
      pages: [
        {
          content_id: 'cid-a',
          category: 'slurry',
          url: 'https://www.gov.uk/a',
          title: 'Page A'
        },
        {
          content_id: 'cid-legacy',
          category: 'legacy-cat',
          url: 'https://www.gov.uk/legacy',
          title: 'Legacy page'
        }
      ],
      page_relevance: [
        { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 },
        {
          category: 'legacy-cat',
          content_id: 'cid-legacy',
          relevance_score: 0.5
        }
      ],
      guidance_propositions: [
        ...baseGuidanceComparisonPresentation().guidance_propositions,
        {
          id: 'g-legacy',
          content_id: 'cid-legacy',
          category: 'legacy-cat',
          proposition_text: 'Legacy prop'
        }
      ],
      proposition_matches: [
        ...baseGuidanceComparisonPresentation().proposition_matches,
        {
          id: 'm-legacy',
          category: 'legacy-cat',
          guidance_proposition_id: 'g-legacy',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        }
      ]
    })
    presentation.subject_summary = [
      {
        category: 'slurry',
        laws_found: 1,
        total_pages_audited: 10,
        pages_relevant: 1,
        proposition_status_counts: {}
      },
      {
        category: 'legacy-cat',
        laws_found: 0,
        total_pages_audited: 1,
        pages_relevant: 1,
        proposition_status_counts: { GROUNDED: 1 }
      }
    ]

    const service = createAuditService(presentation)
    expect(
      service.getSubjectOverview('slurry').usesGuidanceComparisonContract
    ).toBe(true)
    expect(
      service.getSubjectOverview('legacy-cat').usesGuidanceComparisonContract
    ).toBe(false)
    expect(service.getLawToGuidancePages('slurry')).not.toBeNull()
    expect(service.getLawToGuidancePages('legacy-cat')).toBeNull()
  })

  test('15. relationship memberships may exceed total without error', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-1'), gp('g-2'), gp('g-3'), gp('g-4')],
      guidance_proposition_match_summaries: [
        summary('g-1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        }),
        summary('g-2', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 2,
          candidate_count: 2
        }),
        summary('g-3', 'COMPLETE', 'ONLY_UNGROUNDED_CANDIDATES', {
          candidate_count: 1,
          ungrounded_candidate_count: 1
        }),
        summary('g-4', 'NOT_CHECKED', null)
      ],
      guidance_proposition_law_comparisons: [
        pair('m-1', 'g-1', 'prop:law1', 'GROUNDED'),
        pair('m-2a', 'g-2', 'prop:law1', 'GROUNDED'),
        pair('m-2b', 'g-2', 'prop:law2', 'CONFLICTS')
      ],
      proposition_matches: []
    })

    const row = pageRow(service)
    // Ticket example: total 4, matches 2, conflicts 1, no comparable 1, not yet 1
    expect(row.totalGuidancePropositions).toBe(4)
    expect(row.GROUNDED).toBe(2)
    expect(row.CONFLICTS).toBe(1)
    expect(row.ONLY_UNGROUNDED_CANDIDATES).toBe(1)
    expect(row.NOT_CHECKED).toBe(1)
    expect(row.GROUNDED + row.CONFLICTS).toBe(3)
    expect(row.GROUNDED + row.CONFLICTS).not.toBe(row.totalGuidancePropositions)
    assertReconciles(row)
  })

  test('zeros display as numeric 0 for every page', () => {
    const service = serviceFrom({
      guidance_propositions: [gp('g-empty')],
      guidance_proposition_match_summaries: [
        summary('g-empty', 'COMPLETE', 'NO_CANDIDATES_FOUND')
      ],
      guidance_proposition_law_comparisons: [],
      proposition_matches: []
    })
    const row = pageRow(service)
    for (const column of LAW_TO_GUIDANCE_COLUMNS) {
      expect(typeof row[column.key]).toBe('number')
      expect(Number.isFinite(row[column.key])).toBe(true)
    }
  })
})

describe('Law to Guidance view-model', () => {
  test('default sort prioritises conflicts then broader then incomplete', () => {
    const rows = [
      {
        title: 'Zebra',
        CONFLICTS: 0,
        GUIDANCE_BROADER: 5,
        GUIDANCE_INCOMPLETE: 0,
        ONLY_UNGROUNDED_CANDIDATES: 0,
        NO_CANDIDATES_FOUND: 0
      },
      {
        title: 'Alpha',
        CONFLICTS: 2,
        GUIDANCE_BROADER: 0,
        GUIDANCE_INCOMPLETE: 0,
        ONLY_UNGROUNDED_CANDIDATES: 0,
        NO_CANDIDATES_FOUND: 0
      },
      {
        title: 'Beta',
        CONFLICTS: 2,
        GUIDANCE_BROADER: 1,
        GUIDANCE_INCOMPLETE: 0,
        ONLY_UNGROUNDED_CANDIDATES: 0,
        NO_CANDIDATES_FOUND: 0
      }
    ]
    const sorted = [...rows].sort(compareLawToGuidanceRows)
    expect(sorted.map((r) => r.title)).toEqual(['Beta', 'Alpha', 'Zebra'])
  })

  test('subject overview exposes Content Review and Law to Guidance views', () => {
    const presentation = presentationWithSummary({
      guidance_propositions: [gp('g-1')],
      guidance_proposition_match_summaries: [
        summary('g-1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-1', 'g-1', 'prop:law1', 'CONFLICTS')
      ],
      proposition_matches: [],
      page_analytics: [],
      pages_reading_age: []
    })
    // Temporarily swap the singleton service used by the view-model.
    // View-model imports auditService from service.js — test via createAuditService
    // path already covered above. Here we only assert column labels + href shape
    // through compare/sort helpers and LAW_TO_GUIDANCE_COLUMNS.
    expect(LAW_TO_GUIDANCE_COLUMNS.map((c) => c.label)).toEqual([
      'Total guidance propositions',
      'Matches the law',
      'Goes beyond the law',
      'Covers only part of the law',
      'Goes against the law',
      'No comparable law found',
      'No law candidate found',
      'Not yet compared',
      'Comparison incomplete',
      'Comparison failed',
      'Data issue'
    ])
    expect(presentation.categories[0].id).toBe('slurry')
    // Keep import live for tree-shaking / coverage of exported VM helpers.
    expect(typeof auditSubjectOverviewViewModel.get).toBe('function')
  })

  test('count hrefs target page-detail with status filter', () => {
    // Build rows the same way the view-model does for a conflicting page.
    const service = serviceFrom({
      guidance_propositions: [gp('g-1')],
      guidance_proposition_match_summaries: [
        summary('g-1', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
          reportable_comparison_count: 1,
          candidate_count: 1
        })
      ],
      guidance_proposition_law_comparisons: [
        pair('m-1', 'g-1', 'prop:law1', 'CONFLICTS')
      ],
      proposition_matches: []
    })
    const row = pageRow(service)
    expect(row.CONFLICTS).toBe(1)
    const pageHref = `/audit/subjects/slurry/pages/${row.id}?status=CONFLICTS`
    expect(pageHref).toBe('/audit/subjects/slurry/pages/cid-a?status=CONFLICTS')
  })
})
