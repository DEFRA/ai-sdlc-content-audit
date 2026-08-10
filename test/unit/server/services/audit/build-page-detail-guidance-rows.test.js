import { describe, expect, test } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import {
  buildPageDetailGuidanceRows,
  countGuidanceRowsByStatus,
  guidanceRowMatchesStatus,
  wrapLegacyStatementsAsGuidanceRows
} from '../../../../../src/server/services/audit/build-page-detail-guidance-rows.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'
import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'
import { baseGuidanceComparisonPresentation } from './fixtures/guidance-comparison.fixture.js'
import { DISPLAYED_STATUSES } from '../../../../../src/server/services/feedback/constants.js'

const CATEGORY = 'slurry'
const PAGE = 'cid-a'

function legislationForCategory(_categoryId, sourceRecordId) {
  if (sourceRecordId === 'lex-1') {
    return { name: 'Act 1', url: 'https://leg/1', source_record_id: 'lex-1' }
  }
  return null
}

function rowsFromFixture(overrides = {}, statusFilter = null) {
  const presentation = baseGuidanceComparisonPresentation(overrides)
  const service = createAuditService(presentation)
  return buildPageDetailGuidanceRows({
    categoryId: CATEGORY,
    pageId: PAGE,
    guidanceComparisons: service.getGuidanceComparisons(),
    legislationForCategory,
    statusFilter
  })
}

describe('buildPageDetailGuidanceRows', () => {
  test('rolls multi-hit GP to conflict_found with severity-ordered pair chips', () => {
    const row = rowsFromFixture().find((r) => r.guidanceText === 'Do multi.')
    expect(row).toMatchObject({
      id: 'g-multi',
      aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryLabel: 'Conflict found',
      primaryTone: 'red',
      pairCount: 3,
      rowKind: 'comparison',
      unassessedCount: 0
    })
    // Pair-level statuses stay on comparisons/chips — separate from aggregate.
    expect(row.comparisons.map((c) => c.status).sort()).toEqual([
      'CONFLICTS',
      'GROUNDED',
      'GUIDANCE_INCOMPLETE'
    ])
    expect(row.chips.map((c) => c.status)).toEqual([
      'CONFLICTS',
      'GUIDANCE_INCOMPLETE',
      'GROUNDED'
    ])
    expect(row.chips.map((c) => c.count)).toEqual([1, 1, 1])
    expect(row.comparisons.map((c) => c.id)).toEqual([
      'm-gm-l2',
      'm-gm-l3',
      'm-gm-l1'
    ])
  })

  test('green pair overrides yellow when rolling up aggregate', () => {
    const rows = rowsFromFixture({
      guidance_propositions: [
        {
          id: 'g-gy',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Green and yellow.'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-gy',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          candidate_count: 2,
          reportable_comparison_count: 2,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-gy-g',
          category: 'slurry',
          guidance_proposition_id: 'g-gy',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED',
          confidence: 'high',
          bert_score_f1: null,
          cosine_score: 0.9,
          explanation: 'green'
        },
        {
          id: 'm-gy-y',
          category: 'slurry',
          guidance_proposition_id: 'g-gy',
          law_proposition_id: 'prop:law2',
          relationship: 'GUIDANCE_INCOMPLETE',
          confidence: 'high',
          bert_score_f1: null,
          cosine_score: 0.8,
          explanation: 'yellow'
        }
      ]
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryLabel: 'Supporting law found',
      primaryTone: 'green'
    })
  })

  test('omits chips for single-pair GPs', () => {
    const row = rowsFromFixture().find((r) => r.guidanceText === 'Do grounded.')
    expect(row.pairCount).toBe(1)
    expect(row.chips).toEqual([])
    expect(row.aggregateOutcome).toBe(AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND)
    expect(row.primaryStatus).toBe(AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND)
  })

  test('renders fallback rows with processing primary and not_assessed aggregate', () => {
    const row = rowsFromFixture().find((r) => r.guidanceText === 'Do empty.')
    expect(row).toMatchObject({
      aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
      primaryStatus: FALLBACK_KIND.NO_CANDIDATES_FOUND,
      pairCount: 0,
      rowKind: 'fallback',
      chips: [],
      comparisons: []
    })
  })

  test('dims non-matching pairs when a status filter is active', () => {
    const row = rowsFromFixture({}, 'CONFLICTS').find(
      (r) => r.guidanceText === 'Do multi.'
    )
    expect(
      row.comparisons.map((c) => ({ id: c.id, dimmed: c.dimmed }))
    ).toEqual([
      { id: 'm-gm-l2', dimmed: false },
      { id: 'm-gm-l3', dimmed: true },
      { id: 'm-gm-l1', dimmed: true }
    ])
  })

  test('sorts rows by primary severity then emission order', () => {
    const texts = rowsFromFixture()
      .filter((r) =>
        ['Do multi.', 'Do grounded.', 'Do mixed.', 'Do empty.'].includes(
          r.guidanceText
        )
      )
      .map((r) => r.guidanceText)

    // CONFLICT_FOUND (multi, 1) before NO_CONFIRMED_SUPPORT (mixed/broader, 3)
    // before NO_CANDIDATES_FOUND (empty fallback, 4) before SUPPORTING_LAW_FOUND
    // (grounded, 7).
    expect(texts).toEqual([
      'Do multi.',
      'Do mixed.',
      'Do empty.',
      'Do grounded.'
    ])
  })

  test('scopes rows to the selected page and category', () => {
    const rows = rowsFromFixture({
      guidance_propositions: [
        {
          id: 'g-here',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Here.'
        },
        {
          id: 'g-other-page',
          content_id: 'cid-other',
          category: 'slurry',
          proposition_text: 'Other page.'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-here',
          assessment_status: 'COMPLETE',
          coverage_result: 'NO_CANDIDATES_FOUND',
          candidate_count: 0,
          reportable_comparison_count: 0,
          ungrounded_candidate_count: 0
        },
        {
          guidance_proposition_id: 'g-other-page',
          assessment_status: 'COMPLETE',
          coverage_result: 'NO_CANDIDATES_FOUND',
          candidate_count: 0,
          reportable_comparison_count: 0,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: []
    })
    expect(rows.map((r) => r.guidanceText)).toEqual(['Here.'])
  })
})

describe('guidanceRowMatchesStatus / countGuidanceRowsByStatus', () => {
  test('multi-relationship GP matches each relationship filter once', () => {
    const row = rowsFromFixture().find((r) => r.guidanceText === 'Do multi.')
    expect(guidanceRowMatchesStatus(row, 'CONFLICTS')).toBe(true)
    expect(guidanceRowMatchesStatus(row, 'GROUNDED')).toBe(true)
    expect(guidanceRowMatchesStatus(row, 'GUIDANCE_BROADER')).toBe(false)
  })

  test('counts distinct GPs per status not pair rows', () => {
    const counts = countGuidanceRowsByStatus(
      rowsFromFixture(),
      DISPLAYED_STATUSES
    )
    expect(counts.CONFLICTS).toBe(1)
    expect(counts.GROUNDED).toBe(2) // g-grounded + g-multi
    expect(counts.GUIDANCE_INCOMPLETE).toBe(1)
    expect(counts.GUIDANCE_BROADER).toBe(1)
    expect(counts.NO_CANDIDATES_FOUND).toBe(1)
    expect(counts.ONLY_UNGROUNDED_CANDIDATES).toBe(1)
  })
})

describe('wrapLegacyStatementsAsGuidanceRows', () => {
  test('wraps each legacy statement as a single-comparison row', () => {
    const rows = wrapLegacyStatementsAsGuidanceRows([
      {
        id: 'm-top',
        status: 'GROUNDED',
        guidanceText: 'Legacy.',
        statusLabel: 'Matches the law',
        statusMeaning: 'ok',
        statusTone: 'green',
        severity: 7,
        order: 0
      }
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'legacy-m-top',
      aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      pairCount: 1,
      chips: [],
      comparisons: [expect.objectContaining({ id: 'm-top', dimmed: false })]
    })
  })
})

describe('getPageGuidanceRows', () => {
  test('returns aggregated rows for guidance-comparison categories', () => {
    const service = createAuditService(baseGuidanceComparisonPresentation())
    const rows = service.getPageGuidanceRows('slurry', 'cid-a')
    const multi = rows.find((r) => r.guidanceText === 'Do multi.')
    expect(multi.aggregateOutcome).toBe(AGGREGATE_OUTCOME.CONFLICT_FOUND)
    expect(multi.primaryStatus).toBe(AGGREGATE_OUTCOME.CONFLICT_FOUND)
    expect(multi.pairCount).toBe(3)
  })

  test('wraps legacy top-match statements when summaries are absent', () => {
    const service = createAuditService(
      baseGuidanceComparisonPresentation({
        guidance_proposition_match_summaries: [],
        guidance_proposition_law_comparisons: []
      })
    )
    const rows = service.getPageGuidanceRows('slurry', 'cid-a')
    const multi = rows.find((r) => r.guidanceText === 'Do multi.')
    expect(multi).toMatchObject({
      pairCount: 1,
      aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      comparisons: [expect.objectContaining({ id: 'm-top-multi' })]
    })
  })
})
