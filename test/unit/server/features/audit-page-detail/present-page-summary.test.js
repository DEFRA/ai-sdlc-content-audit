import { describe, expect, test } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import {
  buildGuidanceCountText,
  buildOutcomeFilterHref,
  countGuidanceRowsByAggregateOutcome,
  guidanceRowMatchesAggregateOutcomes,
  parseAggregateOutcomeFilters,
  presentPageSummaryAndFilters
} from '../../../../../src/server/features/audit-page-detail/present-page-summary.js'

describe('countGuidanceRowsByAggregateOutcome', () => {
  test('counts each guidance proposition once by aggregate outcome', () => {
    const counts = countGuidanceRowsByAggregateOutcome([
      { aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND },
      { aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND },
      { aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND },
      { aggregateOutcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT },
      { aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED },
      { aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED }
    ])

    expect(counts).toEqual({
      CONFLICT_FOUND: 2,
      NO_CONFIRMED_SUPPORT: 1,
      SUPPORTING_LAW_FOUND: 1,
      NOT_ASSESSED: 2
    })
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(6)
  })
})

describe('parseAggregateOutcomeFilters', () => {
  test('accepts semantic query values and ignores unknown values', () => {
    expect(
      parseAggregateOutcomeFilters({
        outcome: ['conflict_found', 'red', 'not_assessed', 'conflict_found']
      })
    ).toEqual([
      AGGREGATE_OUTCOME.CONFLICT_FOUND,
      AGGREGATE_OUTCOME.NOT_ASSESSED
    ])
  })

  test('accepts a single outcome string', () => {
    expect(
      parseAggregateOutcomeFilters({ outcome: 'supporting_law_found' })
    ).toEqual([AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND])
  })

  test('returns no selection when outcome is absent', () => {
    expect(parseAggregateOutcomeFilters({})).toEqual([])
    expect(parseAggregateOutcomeFilters({ status: 'CONFLICTS' })).toEqual([])
  })
})

describe('guidanceRowMatchesAggregateOutcomes', () => {
  test('uses OR logic across selected outcomes', () => {
    const row = { aggregateOutcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT }
    expect(
      guidanceRowMatchesAggregateOutcomes(row, [
        AGGREGATE_OUTCOME.CONFLICT_FOUND,
        AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT
      ])
    ).toBe(true)
    expect(
      guidanceRowMatchesAggregateOutcomes(row, [
        AGGREGATE_OUTCOME.CONFLICT_FOUND
      ])
    ).toBe(false)
    expect(guidanceRowMatchesAggregateOutcomes(row, [])).toBe(true)
  })
})

describe('buildGuidanceCountText', () => {
  test('describes unfiltered and filtered totals', () => {
    expect(buildGuidanceCountText(24, 24, false)).toBe('24 guidance statements')
    expect(buildGuidanceCountText(1, 1, false)).toBe('1 guidance statement')
    expect(buildGuidanceCountText(24, 4, true)).toBe(
      'Showing 4 of 24 guidance statements'
    )
    expect(buildGuidanceCountText(1, 0, true)).toBe(
      'Showing 0 of 1 guidance statement'
    )
  })
})

describe('presentPageSummaryAndFilters', () => {
  test('builds summary and checkbox items in task-priority order', () => {
    const presented = presentPageSummaryAndFilters({
      allRows: [
        { aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND },
        { aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND },
        { aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED },
        { aggregateOutcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT }
      ],
      selectedOutcomes: [AGGREGATE_OUTCOME.CONFLICT_FOUND],
      pageBaseHref: '/audit/subjects/slurry/pages/cid-a'
    })

    expect(presented.summary.totalGuidanceCount).toBe(4)
    expect(presented.summary.totalCountText).toBe('4 guidance statements')
    expect(presented.summary.outcomeItems.map((i) => i.value)).toEqual([
      AGGREGATE_OUTCOME.CONFLICT_FOUND,
      AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      AGGREGATE_OUTCOME.NOT_ASSESSED
    ])
    expect(presented.summary.outcomeItems[0]).toMatchObject({
      summaryText: '1 conflict found',
      checkboxLabel: 'Conflict found (1)',
      selected: true,
      queryValue: 'conflict_found'
    })
    expect(presented.summary.outcomeItems[0].checkboxHtml).toContain(
      'Conflict found'
    )
    expect(presented.summary.outcomeItems[0].checkboxHtml).toContain(
      'aria-hidden="true"'
    )
    expect(presented.summary.outcomeItems[0].checkboxHtml).toContain(
      '1 guidance statement'
    )
    expect(presented.filters.checkboxItems[0]).toMatchObject({
      value: 'conflict_found',
      checked: true
    })
    expect(presented.filters.checkboxItems[0].html).toContain(
      '1 guidance statement'
    )
    expect(presented.filters.checkboxItems[0].text).toBeUndefined()
    expect(presented.filters.active).toBe(true)
    expect(presented.filters.activeItems).toEqual([
      {
        value: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        label: 'Conflict found',
        removeHref: '/audit/subjects/slurry/pages/cid-a',
        removeAccessibleName: 'Remove filter: Conflict found'
      }
    ])
    expect(presented.filters.clearHref).toBe(
      '/audit/subjects/slurry/pages/cid-a'
    )
  })

  test('builds multi-select remove and clear hrefs', () => {
    expect(
      buildOutcomeFilterHref('/page', [
        AGGREGATE_OUTCOME.CONFLICT_FOUND,
        AGGREGATE_OUTCOME.NOT_ASSESSED
      ])
    ).toBe('/page?outcome=conflict_found&outcome=not_assessed')

    const presented = presentPageSummaryAndFilters({
      allRows: [
        { aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND },
        { aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED }
      ],
      selectedOutcomes: [
        AGGREGATE_OUTCOME.CONFLICT_FOUND,
        AGGREGATE_OUTCOME.NOT_ASSESSED
      ],
      pageBaseHref: '/page'
    })

    expect(presented.filters.activeItems[0].removeHref).toBe(
      '/page?outcome=not_assessed'
    )
  })
})
