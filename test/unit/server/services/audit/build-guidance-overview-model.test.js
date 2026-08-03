import { describe, expect, test } from 'vitest'

import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'
import {
  PAGE_FILTER_STATUSES,
  STATEMENT_STATUS_META
} from '../../../../../src/server/services/audit/constants.js'
import { baseGuidanceComparisonPresentation } from './fixtures/guidance-comparison.fixture.js'

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
  presentation.page_relevance = [
    { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 }
  ]
  return presentation
}

function serviceFrom(overrides = {}) {
  return createAuditService(presentationWithSummary(overrides))
}

describe('guidance overview model (new contract)', () => {
  test('counts one grounded proposition and one page', () => {
    const service = serviceFrom({
      guidance_propositions: [
        {
          id: 'g-1',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'A'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-1',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 1,
          candidate_count: 1,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-1',
          guidance_proposition_id: 'g-1',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        }
      ],
      proposition_matches: []
    })

    const overview = service.getSubjectOverview('slurry')
    expect(overview.usesGuidanceComparisonContract).toBe(true)
    expect(overview.statusCounts.GROUNDED).toBe(1)
    expect(overview.pagesByStatus.GROUNDED).toBe(1)
    expect(overview.totalGuidancePropositions).toBe(1)
  })

  test('several grounded hits for one proposition still count once', () => {
    const service = serviceFrom({
      guidance_propositions: [
        {
          id: 'g-multi',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Multi'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-multi',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 3,
          candidate_count: 3,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-a',
          guidance_proposition_id: 'g-multi',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        },
        {
          id: 'm-b',
          guidance_proposition_id: 'g-multi',
          law_proposition_id: 'prop:law2',
          relationship: 'GROUNDED'
        },
        {
          id: 'm-c',
          guidance_proposition_id: 'g-multi',
          law_proposition_id: 'prop:law3',
          relationship: 'GROUNDED'
        }
      ],
      proposition_matches: [
        {
          id: 'm-top',
          category: 'slurry',
          guidance_proposition_id: 'g-multi',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        }
      ]
    })

    const overview = service.getSubjectOverview('slurry')
    expect(overview.statusCounts.GROUNDED).toBe(1)
    expect(overview.pagesByStatus.GROUNDED).toBe(1)
    expect(overview.totalGuidancePropositions).toBe(1)
    expect(
      service
        .getPageDetail('slurry', 'cid-a')
        .statements.filter((s) => s.status === 'GROUNDED')
    ).toHaveLength(3)
  })

  test('several grounded propositions on one page: proposition count 3, page count 1', () => {
    const gps = ['g-a', 'g-b', 'g-c'].map((id) => ({
      id,
      content_id: 'cid-a',
      category: 'slurry',
      proposition_text: id
    }))
    const service = serviceFrom({
      guidance_propositions: gps,
      guidance_proposition_match_summaries: gps.map((gp) => ({
        guidance_proposition_id: gp.id,
        assessment_status: 'COMPLETE',
        coverage_result: 'HAS_REPORTABLE_COMPARISON',
        reportable_comparison_count: 1,
        candidate_count: 1,
        ungrounded_candidate_count: 0
      })),
      guidance_proposition_law_comparisons: gps.map((gp, i) => ({
        id: `m-${i}`,
        guidance_proposition_id: gp.id,
        law_proposition_id: 'prop:law1',
        relationship: 'GROUNDED'
      })),
      proposition_matches: []
    })

    const overview = service.getSubjectOverview('slurry')
    expect(overview.statusCounts.GROUNDED).toBe(3)
    expect(overview.pagesByStatus.GROUNDED).toBe(1)
  })

  test('multi-relationship proposition belongs once to each filter; total stays 1', () => {
    const service = serviceFrom({
      guidance_propositions: [
        {
          id: 'g-mix',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Mix'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-mix',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 2,
          candidate_count: 2,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-g',
          guidance_proposition_id: 'g-mix',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        },
        {
          id: 'm-c',
          guidance_proposition_id: 'g-mix',
          law_proposition_id: 'prop:law2',
          relationship: 'CONFLICTS'
        }
      ],
      proposition_matches: []
    })

    const overview = service.getSubjectOverview('slurry')
    expect(overview.statusCounts.GROUNDED).toBe(1)
    expect(overview.statusCounts.CONFLICTS).toBe(1)
    expect(overview.totalGuidancePropositions).toBe(1)
    expect(
      overview.statusCounts.GROUNDED + overview.statusCounts.CONFLICTS
    ).not.toBe(overview.totalGuidancePropositions)
  })

  test('GUIDANCE_BROADER appears under Goes beyond the law and pages filter', () => {
    const service = serviceFrom({
      guidance_propositions: [
        {
          id: 'g-b',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Broader'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-b',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 1,
          candidate_count: 1,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-b',
          guidance_proposition_id: 'g-b',
          law_proposition_id: 'prop:law1',
          relationship: 'GUIDANCE_BROADER'
        }
      ],
      proposition_matches: []
    })

    expect(
      service.getSubjectOverview('slurry').statusCounts.GUIDANCE_BROADER
    ).toBe(1)
    expect(
      service.getRelevantPages('slurry', 'GUIDANCE_BROADER').map((p) => p.id)
    ).toEqual(['cid-a'])
    expect(STATEMENT_STATUS_META.GUIDANCE_BROADER.label).toBe(
      'Goes beyond the law'
    )
  })

  test('fallback states are mutually exclusive and distinct', () => {
    const cases = [
      ['g-empty', 'COMPLETE', 'NO_CANDIDATES_FOUND'],
      ['g-ung', 'COMPLETE', 'ONLY_UNGROUNDED_CANDIDATES'],
      ['g-nc', 'NOT_CHECKED', null],
      ['g-p', 'PARTIAL', null],
      ['g-f', 'FAILED', null],
      ['g-i', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON']
    ]

    const guidancePropositions = cases.map(([id]) => ({
      id,
      content_id: 'cid-a',
      category: 'slurry',
      proposition_text: id
    }))
    const matchSummaries = cases.map(([id, assessment, coverage]) => ({
      guidance_proposition_id: id,
      assessment_status: assessment,
      coverage_result: coverage,
      reportable_comparison_count: id === 'g-i' ? 2 : 0,
      candidate_count: id === 'g-empty' ? 0 : 1,
      ungrounded_candidate_count: id === 'g-ung' ? 1 : 0
    }))
    const lawComparisons = [
      {
        id: 'm-i',
        guidance_proposition_id: 'g-i',
        law_proposition_id: 'prop:law1',
        relationship: 'GROUNDED'
      }
    ]

    const service = serviceFrom({
      guidance_propositions: guidancePropositions,
      guidance_proposition_match_summaries: matchSummaries,
      guidance_proposition_law_comparisons: lawComparisons,
      proposition_matches: []
    })
    const overview = service.getSubjectOverview('slurry')

    expect(overview.statusCounts.NO_CANDIDATES_FOUND).toBe(1)
    expect(overview.statusCounts.ONLY_UNGROUNDED_CANDIDATES).toBe(1)
    expect(overview.statusCounts.NOT_CHECKED).toBe(1)
    expect(overview.statusCounts.PARTIAL).toBe(1)
    expect(overview.statusCounts.FAILED).toBe(1)
    expect(overview.statusCounts.INCONSISTENT_DATA).toBe(1)
    expect(overview.statusCounts.GROUNDED).toBe(0)
    expect(overview.pagesByStatus.FAILED).toBe(1)
  })

  test('mixed page appears once in each applicable filter', () => {
    const service = serviceFrom({
      guidance_propositions: [
        {
          id: 'g-ok',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'ok'
        },
        {
          id: 'g-none',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'none'
        },
        {
          id: 'g-fail',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'fail'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-ok',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 1,
          candidate_count: 1,
          ungrounded_candidate_count: 0
        },
        {
          guidance_proposition_id: 'g-none',
          assessment_status: 'COMPLETE',
          coverage_result: 'NO_CANDIDATES_FOUND',
          reportable_comparison_count: 0,
          candidate_count: 0,
          ungrounded_candidate_count: 0
        },
        {
          guidance_proposition_id: 'g-fail',
          assessment_status: 'FAILED',
          coverage_result: null,
          reportable_comparison_count: 0,
          candidate_count: 2,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-ok',
          guidance_proposition_id: 'g-ok',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        }
      ],
      proposition_matches: []
    })

    for (const status of ['GROUNDED', 'NO_CANDIDATES_FOUND', 'FAILED']) {
      const pages = service.getRelevantPages('slurry', status)
      expect(pages).toHaveLength(1)
      expect(pages[0].id).toBe('cid-a')
    }
  })

  test('law-side GUIDANCE_MISSING stays separate from guidance totals', () => {
    const service = serviceFrom()
    const overview = service.getSubjectOverview('slurry')
    expect(overview.statusCounts.GUIDANCE_MISSING).toBe(1)
    expect(overview.lawsMissingGuidance).toBe(1)
    expect(overview.totalGuidancePropositions).toBe(8)
    expect(service.getRelevantPages('slurry', 'GUIDANCE_MISSING')).toHaveLength(
      0
    )
  })

  test('does not expose UNGROUNDED as an overview or page-filter status', () => {
    expect(PAGE_FILTER_STATUSES).not.toContain('UNGROUNDED')
    const overview = serviceFrom().getSubjectOverview('slurry')
    expect(overview.overviewStatusOrder).not.toContain('UNGROUNDED')
    expect(overview.statusCounts.ONLY_UNGROUNDED_CANDIDATES).toBe(1)
  })

  test('new-run path ignores legacy top-match duplication', () => {
    const overview = serviceFrom().getSubjectOverview('slurry')
    // g-grounded + g-multi (both have GROUNDED); legacy top-match must not add more.
    expect(overview.statusCounts.GROUNDED).toBe(2)
    expect(overview.statusCounts.CONFLICTS).toBe(1)
    expect(overview.statusCounts.GUIDANCE_BROADER).toBe(1)
  })

  test('fallback and relationship labels match page-detail terminology', () => {
    expect(STATEMENT_STATUS_META.NO_CANDIDATES_FOUND.label).toBe(
      'No law candidate found'
    )
    expect(STATEMENT_STATUS_META.ONLY_UNGROUNDED_CANDIDATES.label).toBe(
      'No comparable law found'
    )
    expect(STATEMENT_STATUS_META.NOT_CHECKED.label).toBe('Not yet compared')
    expect(STATEMENT_STATUS_META.PARTIAL.label).toBe('Comparison incomplete')
    expect(STATEMENT_STATUS_META.FAILED.label).toBe('Comparison failed')
    expect(STATEMENT_STATUS_META.INCONSISTENT_DATA.label).toBe(
      'Comparison unavailable'
    )
    expect(PAGE_FILTER_STATUSES).toEqual(
      expect.arrayContaining([
        'NO_CANDIDATES_FOUND',
        'ONLY_UNGROUNDED_CANDIDATES',
        'NOT_CHECKED',
        'PARTIAL',
        'FAILED',
        'INCONSISTENT_DATA',
        'GUIDANCE_BROADER',
        'NO_MATCH',
        'GROUNDED'
      ])
    )
    expect(PAGE_FILTER_STATUSES).not.toContain('GUIDANCE_MISSING')
  })
})

describe('legacy overview path', () => {
  test('uses proposition_matches / NO_MATCH when summaries are absent', () => {
    const presentation = baseGuidanceComparisonPresentation({
      guidance_proposition_match_summaries: [],
      guidance_proposition_law_comparisons: [],
      proposition_matches: [
        {
          id: 'm-nomatch',
          category: 'slurry',
          guidance_proposition_id: 'g-unchecked',
          law_proposition_id: null,
          relationship: 'NO_MATCH'
        },
        {
          id: 'm-law-missing',
          category: 'slurry',
          guidance_proposition_id: null,
          law_proposition_id: 'prop:law3',
          relationship: 'GUIDANCE_MISSING'
        }
      ]
    })
    presentation.subject_summary = [
      {
        category: 'slurry',
        laws_found: 1,
        total_pages_audited: 10,
        pages_relevant: 1,
        proposition_status_counts: {
          NO_MATCH: 1,
          GUIDANCE_MISSING: 1
        }
      }
    ]
    presentation.page_relevance = [
      { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 }
    ]

    const legacy = createAuditService(presentation)
    const overview = legacy.getSubjectOverview('slurry')
    expect(overview.usesGuidanceComparisonContract).toBe(false)
    expect(overview.statusCounts.NO_MATCH).toBe(1)
    expect(overview.pagesByStatus.NO_MATCH).toBe(1)
    expect(overview.lawsMissingGuidance).toBe(1)
    expect(overview.overviewStatusOrder).toContain('NO_MATCH')
    expect(overview.overviewStatusOrder).toContain('UNGROUNDED')
  })
})
