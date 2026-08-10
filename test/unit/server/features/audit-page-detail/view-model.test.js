import { describe, expect, test, vi } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'

vi.mock('../../../../../src/server/services/audit/service.js', async () => {
  const { createAuditService } =
    await import('../../../../../src/server/services/audit/create-audit-service.js')
  const { baseGuidanceComparisonPresentation } =
    await import('../../../../../test/unit/server/services/audit/fixtures/guidance-comparison.fixture.js')
  return {
    auditService: createAuditService(baseGuidanceComparisonPresentation())
  }
})

const { auditPageDetailViewModel, presentGuidanceAggregateOutcome } =
  await import('../../../../../src/server/features/audit-page-detail/view-model.js')

describe('presentGuidanceAggregateOutcome', () => {
  test.each([
    {
      outcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      label: 'Conflict found',
      tone: 'red',
      govukTagClass: 'govuk-tag--red'
    },
    {
      outcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      label: 'Supporting law found',
      tone: 'green',
      govukTagClass: 'govuk-tag--green'
    },
    {
      outcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      label: 'No confirmed support found',
      tone: 'yellow',
      govukTagClass: 'govuk-tag--yellow'
    },
    {
      outcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
      label: 'Not assessed',
      tone: 'grey',
      govukTagClass: 'govuk-tag--grey'
    }
  ])(
    'maps $outcome to label, tone and GOV.UK tag class',
    ({ outcome, label, tone, govukTagClass }) => {
      expect(presentGuidanceAggregateOutcome(outcome)).toEqual({
        label,
        tone,
        govukTagClass,
        accessibleLabel: `Overall guidance outcome: ${label}`
      })
    }
  )
})

describe('auditPageDetailViewModel', () => {
  test('summarises each guidance proposition once by aggregate outcome', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a')
    expect(vm).not.toBeNull()
    expect(vm.hasGuidanceRows).toBe(true)
    expect(vm.hasGuidanceData).toBe(true)

    // Fixture: 1 conflict, 1 no-confirmed-support, 1 supporting, 5 not assessed.
    expect(vm.summary.totalGuidanceCount).toBe(8)
    expect(vm.summary.aggregateOutcomeCounts).toEqual({
      CONFLICT_FOUND: 1,
      NO_CONFIRMED_SUPPORT: 1,
      SUPPORTING_LAW_FOUND: 1,
      NOT_ASSESSED: 5
    })
    expect(
      Object.values(vm.summary.aggregateOutcomeCounts).reduce(
        (sum, n) => sum + n,
        0
      )
    ).toBe(vm.summary.totalGuidanceCount)
    expect(vm.visibleCountText).toBe('8 guidance statements')
    expect(vm.summary.outcomeItems.map((i) => i.value)).toEqual([
      AGGREGATE_OUTCOME.CONFLICT_FOUND,
      AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      AGGREGATE_OUTCOME.NOT_ASSESSED
    ])

    const multi = vm.guidanceRows.find((r) => r.guidanceText === 'Do multi.')
    expect(multi.aggregateOutcome).toBe(AGGREGATE_OUTCOME.CONFLICT_FOUND)
    expect(multi.compositionText).toBe('1 conflict · 1 incomplete · 1 grounded')
    expect(multi.comparisons.every((c) => c.showGuidanceText === false)).toBe(
      true
    )

    const empty = vm.guidanceRows.find((r) => r.guidanceText === 'Do empty.')
    expect(empty.aggregateOutcome).toBe(AGGREGATE_OUTCOME.NOT_ASSESSED)
    expect(empty.primaryStatus).toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)

    expect(vm.filters.active).toBe(false)
    expect(vm.filters.activeItems).toEqual([])
    expect(vm.filters.checkboxItems.every((item) => !item.checked)).toBe(true)
    expect(vm.pairsHref).toBe('/audit/subjects/slurry/pages/cid-a/pairs')
  })

  test('filters guidance rows by semantic aggregate outcomes with OR logic', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a', {
      outcome: ['conflict_found', 'supporting_law_found', 'red']
    })

    expect(vm.filters.active).toBe(true)
    expect(vm.filters.selectedOutcomes).toEqual([
      AGGREGATE_OUTCOME.CONFLICT_FOUND,
      AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND
    ])
    expect(vm.visibleGuidanceCount).toBe(2)
    expect(vm.summary.totalGuidanceCount).toBe(8)
    expect(vm.visibleCountText).toBe('Showing 2 of 8 guidance statements')
    expect(
      vm.guidanceRows.every((r) =>
        [
          AGGREGATE_OUTCOME.CONFLICT_FOUND,
          AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND
        ].includes(r.aggregateOutcome)
      )
    ).toBe(true)
    expect(vm.filters.activeItems.map((i) => i.label)).toEqual([
      'Conflict found',
      'Supporting law found'
    ])
    expect(vm.filters.clearHref).toBe('/audit/subjects/slurry/pages/cid-a')
    // Unknown colour query values must not surface in the UI.
    expect(JSON.stringify(vm.filters)).not.toContain('red')
  })

  test('preserves pages-list status only for navigation, not aggregate filtering', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a', {
      status: 'CONFLICTS'
    })
    expect(vm.guidanceRows).toHaveLength(8)
    expect(vm.filters.active).toBe(false)
    expect(vm.backHref).toContain('status=CONFLICTS')
    expect(vm.pairsHref).toContain('status=CONFLICTS')
  })

  test('filters to a single aggregate outcome without changing roll-up semantics', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a', {
      outcome: 'conflict_found'
    })
    expect(vm.hasGuidanceData).toBe(true)
    expect(vm.hasGuidanceRows).toBe(true)
    expect(vm.hasFilteredResults).toBe(true)
    expect(vm.guidanceRows).toHaveLength(1)
    expect(vm.guidanceRows[0].aggregateOutcome).toBe(
      AGGREGATE_OUTCOME.CONFLICT_FOUND
    )
    expect(vm.guidanceRows[0].comparisons.map((c) => c.status).sort()).toEqual([
      'CONFLICTS',
      'GROUNDED',
      'GUIDANCE_INCOMPLETE'
    ])
  })
})
