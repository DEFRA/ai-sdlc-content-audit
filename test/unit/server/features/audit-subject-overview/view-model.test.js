import { beforeEach, describe, expect, test, vi } from 'vitest'

const getSubjectOverview = vi.fn()
const getPairsCsv = vi.fn()
const getDashboardPages = vi.fn()
const getLawToGuidancePages = vi.fn()

vi.mock('../../../../../src/server/services/audit/service.js', () => ({
  auditService: {
    getSubjectOverview: (...args) => getSubjectOverview(...args),
    getPairsCsv: (...args) => getPairsCsv(...args),
    getDashboardPages: (...args) => getDashboardPages(...args),
    getLawToGuidancePages: (...args) => getLawToGuidancePages(...args)
  }
}))

const { auditSubjectOverviewViewModel } =
  await import('../../../../../src/server/features/audit-subject-overview/view-model.js')

const CATEGORY_ID = 'ssafo-nitrates'
const OVERVIEW = {
  category: {
    id: CATEGORY_ID,
    title: 'Nitrates',
    description: 'Nitrate guidance.'
  },
  lawsFound: 2,
  totalPagesAudited: 10,
  pagesInCategory: 3,
  usesGuidanceComparisonContract: true
}

describe('auditSubjectOverviewViewModel', () => {
  beforeEach(() => {
    getSubjectOverview.mockReset()
    getPairsCsv.mockReset()
    getDashboardPages.mockReset()
    getLawToGuidancePages.mockReset()
    getDashboardPages.mockReturnValue([])
    getLawToGuidancePages.mockReturnValue([])
    getSubjectOverview.mockReturnValue(OVERVIEW)
  })

  test('includes pairsCsvHref when a prebuilt CSV exists for the category', () => {
    getPairsCsv.mockReturnValue({
      path: '/tmp/ssafo-nitrates/pairs.csv',
      filename: 'ssafo-nitrates-pairs.csv'
    })

    const vm = auditSubjectOverviewViewModel.get(CATEGORY_ID)

    expect(vm.pairsCsvHref).toBe(`/audit/subjects/${CATEGORY_ID}/pairs.csv`)
  })

  test('omits pairsCsvHref when the category has no CSV', () => {
    getPairsCsv.mockReturnValue(null)

    const vm = auditSubjectOverviewViewModel.get(CATEGORY_ID)

    expect(vm.pairsCsvHref).toBeNull()
  })

  test('getPairsCsv delegates to the audit service', () => {
    const payload = {
      path: '/tmp/ssafo-nitrates/pairs.csv',
      filename: 'ssafo-nitrates-pairs.csv'
    }
    getPairsCsv.mockReturnValue(payload)

    expect(auditSubjectOverviewViewModel.getPairsCsv(CATEGORY_ID)).toEqual(
      payload
    )
    expect(getPairsCsv).toHaveBeenCalledWith(CATEGORY_ID)
  })
})
