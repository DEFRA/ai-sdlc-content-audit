import { beforeEach, describe, expect, test, vi } from 'vitest'

const getPageDetail = vi.fn()
const getCategory = vi.fn()
const findByMatchIds = vi.fn()

vi.mock('../../../../../src/server/services/audit/service.js', () => ({
  auditService: {
    getCategory: (...args) => getCategory(...args),
    getPageDetail: (...args) => getPageDetail(...args)
  }
}))

vi.mock('../../../../../src/server/services/feedback/service.js', () => ({
  feedbackService: {
    findByMatchIds: (...args) => findByMatchIds(...args)
  }
}))

const { auditPageDetailViewModel } =
  await import('../../../../../src/server/features/audit-page-detail/view-model.js')

describe('auditPageDetailViewModel', () => {
  beforeEach(() => {
    getCategory.mockReset()
    getPageDetail.mockReset()
    findByMatchIds.mockReset()
    getCategory.mockReturnValue({ id: 'slurry', title: 'Slurry' })
    findByMatchIds.mockResolvedValue(new Map())
  })

  test('keeps multi-hit comparison order and skips feedback lookup for fallbacks', async () => {
    getPageDetail.mockReturnValue({
      page: {
        content_id: 'cid-a',
        title: 'Page A',
        url: 'https://www.gov.uk/a'
      },
      statements: [
        {
          id: 'm-1',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green',
          guidanceText: 'Do multi.',
          feedbackEnabled: true,
          order: 0
        },
        {
          id: 'm-2',
          status: 'CONFLICTS',
          statusLabel: 'Goes against the law',
          statusTone: 'red',
          guidanceText: 'Do multi.',
          feedbackEnabled: true,
          order: 1
        },
        {
          id: 'fb-g-empty-NO_CANDIDATES_FOUND',
          status: 'NO_CANDIDATES_FOUND',
          statusLabel: 'No law candidate found',
          statusTone: 'grey',
          guidanceText: 'Do empty.',
          feedbackEnabled: false,
          order: 2
        }
      ],
      missingLaws: []
    })

    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a')

    expect(findByMatchIds).toHaveBeenCalledWith(['m-1', 'm-2'])
    expect(vm.pending.map((s) => s.id)).toEqual([
      'm-1',
      'm-2',
      'fb-g-empty-NO_CANDIDATES_FOUND'
    ])
    expect(vm.filterOptions.some((o) => o.key === 'GUIDANCE_BROADER')).toBe(
      false
    )
    expect(vm.filterOptions.some((o) => o.key === 'NO_CANDIDATES_FOUND')).toBe(
      true
    )
  })

  test('includes GUIDANCE_BROADER in filter options when present', async () => {
    getPageDetail.mockReturnValue({
      page: {
        content_id: 'cid-a',
        title: 'Page A',
        url: 'https://www.gov.uk/a'
      },
      statements: [
        {
          id: 'm-broad',
          status: 'GUIDANCE_BROADER',
          statusLabel: 'Goes beyond the law',
          statusTone: 'blue',
          guidanceText: 'Extra.',
          feedbackEnabled: true,
          order: 0
        }
      ],
      missingLaws: []
    })

    const vm = await auditPageDetailViewModel.get('slurry', 'cid-a')
    const broader = vm.filterOptions.find((o) => o.key === 'GUIDANCE_BROADER')
    expect(broader).toMatchObject({
      label: 'Goes beyond the law',
      count: 1
    })
  })
})
