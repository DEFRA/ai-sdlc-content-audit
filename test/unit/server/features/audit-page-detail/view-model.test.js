import { describe, expect, test, vi } from 'vitest'

vi.mock('../../../../../src/server/services/audit/service.js', async () => {
  const { createAuditService } =
    await import('../../../../../src/server/services/audit/create-audit-service.js')
  const { baseGuidanceComparisonPresentation } =
    await import('../../../../../test/unit/server/services/audit/fixtures/guidance-comparison.fixture.js')
  return {
    auditService: createAuditService(baseGuidanceComparisonPresentation())
  }
})

const { auditPageDetailViewModel } =
  await import('../../../../../src/server/features/audit-page-detail/view-model.js')

describe('auditPageDetailViewModel', () => {
  test('returns aggregated guidance rows with GP filter counts', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a')
    expect(vm).not.toBeNull()
    expect(vm.hasGuidanceRows).toBe(true)

    const multi = vm.guidanceRows.find((r) => r.guidanceText === 'Do multi.')
    expect(multi.primaryStatus).toBe('CONFLICTS')
    expect(multi.pairCount).toBe(3)
    expect(multi.chips.length).toBeGreaterThan(0)

    const conflictsOption = vm.filterOptions.find((o) => o.key === 'CONFLICTS')
    expect(conflictsOption.count).toBe(1)

    const groundedOption = vm.filterOptions.find((o) => o.key === 'GROUNDED')
    // g-grounded + g-multi
    expect(groundedOption.count).toBe(2)

    expect(vm.pairsHref).toBe('/audit/subjects/slurry/pages/cid-a/pairs')
  })

  test('filters to matching GPs and dims non-matching pairs', async () => {
    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a', {
      status: 'CONFLICTS'
    })
    expect(
      vm.guidanceRows.every(
        (r) =>
          r.primaryStatus === 'CONFLICTS' ||
          r.comparisons.some((c) => c.status === 'CONFLICTS')
      )
    ).toBe(true)

    const multi = vm.guidanceRows.find((r) => r.guidanceText === 'Do multi.')
    expect(multi.comparisons.some((c) => c.dimmed)).toBe(true)
    expect(
      multi.comparisons.some((c) => !c.dimmed && c.status === 'CONFLICTS')
    ).toBe(true)
    expect(vm.pairsHref).toContain('status=CONFLICTS')
  })
})
