/**
 * Route/view-model smoke for the guidance–law comparison contract.
 *
 * Covers overview → pages-list → page-detail navigation parameters and
 * labels without duplicating service-level unit cases.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createAuditService } from '../../../../src/server/services/audit/create-audit-service.js'
import { STATEMENT_STATUS_META } from '../../../../src/server/services/audit/constants.js'
import { baseGuidanceComparisonPresentation } from '../services/audit/fixtures/guidance-comparison.fixture.js'

const getCategory = vi.fn()
const getSubjectOverview = vi.fn()
const getRelevantPages = vi.fn()
const getPageDetail = vi.fn()
const getDashboardPages = vi.fn()
const findByMatchIds = vi.fn()

vi.mock('../../../../src/server/services/audit/service.js', () => ({
  auditService: {
    getCategory: (...args) => getCategory(...args),
    getSubjectOverview: (...args) => getSubjectOverview(...args),
    getRelevantPages: (...args) => getRelevantPages(...args),
    getPageDetail: (...args) => getPageDetail(...args),
    getDashboardPages: (...args) => getDashboardPages(...args)
  }
}))

vi.mock('../../../../src/server/services/feedback/service.js', () => ({
  feedbackService: {
    findByMatchIds: (...args) => findByMatchIds(...args)
  }
}))

const { auditPropositionsOverviewViewModel } =
  await import('../../../../src/server/features/audit-propositions-overview/view-model.js')
const { auditPagesListViewModel } =
  await import('../../../../src/server/features/audit-pages-list/view-model.js')
const { auditPageDetailViewModel } =
  await import('../../../../src/server/features/audit-page-detail/view-model.js')

function presentationWithSummary(overrides = {}) {
  const presentation = baseGuidanceComparisonPresentation(overrides)
  presentation.subject_summary = [
    {
      category: 'slurry',
      laws_found: 1,
      total_pages_audited: 10,
      pages_relevant: 1,
      proposition_status_counts: {}
    }
  ]
  presentation.page_relevance = [
    { category: 'slurry', content_id: 'cid-a', relevance_score: 0.9 }
  ]
  return presentation
}

function wireService(presentation, runIds = ['fixture-new']) {
  const service = createAuditService(presentation, runIds)
  getCategory.mockImplementation((id) => service.getCategory(id))
  getSubjectOverview.mockImplementation((id) => service.getSubjectOverview(id))
  getRelevantPages.mockImplementation((id, status) =>
    service.getRelevantPages(id, status)
  )
  getPageDetail.mockImplementation((categoryId, pageId) =>
    service.getPageDetail(categoryId, pageId)
  )
  getDashboardPages.mockImplementation((id) => service.getDashboardPages(id))
  return service
}

describe('guidance comparison route smoke', () => {
  beforeEach(() => {
    getCategory.mockReset()
    getSubjectOverview.mockReset()
    getRelevantPages.mockReset()
    getPageDetail.mockReset()
    getDashboardPages.mockReset()
    findByMatchIds.mockReset()
    findByMatchIds.mockResolvedValue(new Map())
  })

  test('new-contract run loads propositions overview with proposition-level keys', () => {
    wireService(presentationWithSummary())
    const vm = auditPropositionsOverviewViewModel.get('slurry')

    expect(vm).toBeTruthy()
    expect(vm.breakdownBoxes.map((b) => b.status)).toEqual(
      expect.arrayContaining([
        'GROUNDED',
        'GUIDANCE_BROADER',
        'CONFLICTS',
        'NO_CANDIDATES_FOUND',
        'ONLY_UNGROUNDED_CANDIDATES',
        'NOT_CHECKED',
        'GUIDANCE_MISSING'
      ])
    )
    expect(vm.breakdownBoxes.map((b) => b.status)).not.toContain('UNGROUNDED')
    expect(vm.breakdownBoxes.map((b) => b.status)).not.toContain('NO_MATCH')

    const grounded = vm.breakdownBoxes.find((b) => b.status === 'GROUNDED')
    expect(grounded.title).toBe('Matches the law')
    expect(grounded.href).toBe('/audit/subjects/slurry/pages?status=GROUNDED')

    const broader = vm.breakdownBoxes.find(
      (b) => b.status === 'GUIDANCE_BROADER'
    )
    expect(broader.title).toBe('Goes beyond the law')
    expect(broader.href).toBe(
      '/audit/subjects/slurry/pages?status=GUIDANCE_BROADER'
    )

    const onlyU = vm.breakdownBoxes.find(
      (b) => b.status === 'ONLY_UNGROUNDED_CANDIDATES'
    )
    expect(onlyU.title).toBe('No comparable law found')
    expect(onlyU.href).toBe(
      '/audit/subjects/slurry/pages?status=ONLY_UNGROUNDED_CANDIDATES'
    )

    const missing = vm.breakdownBoxes.find(
      (b) => b.status === 'GUIDANCE_MISSING'
    )
    expect(missing.href).toBe('/audit/subjects/slurry/laws')
  })

  test('following a relationship tile produces the expected pages-list filter', () => {
    wireService(presentationWithSummary())
    const pages = auditPagesListViewModel.get('slurry', 'GROUNDED')

    expect(pages.activeOption.key).toBe('GROUNDED')
    expect(pages.activeOption.label).toBe('Matches the law')
    expect(pages.tableRows).toHaveLength(1)
    expect(pages.tableRows[0].detailHref).toBe(
      '/audit/subjects/slurry/pages/cid-a?status=GROUNDED'
    )
  })

  test('following a fallback tile produces the expected pages-list filter', () => {
    wireService(presentationWithSummary())
    const pages = auditPagesListViewModel.get(
      'slurry',
      'ONLY_UNGROUNDED_CANDIDATES'
    )

    expect(pages.activeOption.key).toBe('ONLY_UNGROUNDED_CANDIDATES')
    expect(pages.activeOption.label).toBe(
      STATEMENT_STATUS_META.ONLY_UNGROUNDED_CANDIDATES.label
    )
    expect(pages.tableRows).toHaveLength(1)
    expect(pages.tableRows[0].detailHref).toContain(
      'status=ONLY_UNGROUNDED_CANDIDATES'
    )
  })

  test('opening a multi-hit page produces all expected pair rows', async () => {
    wireService(presentationWithSummary())
    const detail = await auditPageDetailViewModel.get('slurry', 'cid-a', {})

    const multiRows = detail.pending.filter((s) =>
      ['m-gm-l1', 'm-gm-l2', 'm-gm-l3'].includes(s.id)
    )
    expect(multiRows).toHaveLength(3)
    expect(multiRows.map((s) => s.status)).toEqual([
      'GROUNDED',
      'CONFLICTS',
      'GUIDANCE_INCOMPLETE'
    ])
    // Legacy top match id must not duplicate the first full-comparison row.
    expect(detail.pending.filter((s) => s.id === 'm-top-multi')).toHaveLength(0)
  })

  test('legacy run continues to render without new-contract tiles', () => {
    const legacy = {
      categories: [{ id: 'slurry', title: 'Slurry' }],
      legislation: [
        {
          source_record_id: 'lex-1',
          category: 'slurry',
          name: 'Act',
          url: 'https://leg/1'
        }
      ],
      legislation_propositions: [
        {
          id: 'prop:law1',
          category: 'slurry',
          source_record_id: 'lex-1',
          proposition_text: 'Law'
        }
      ],
      pages: [
        {
          content_id: 'cid-a',
          category: 'slurry',
          url: 'https://www.gov.uk/a',
          title: 'Page A'
        }
      ],
      guidance_propositions: [
        {
          id: 'g-1',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Do'
        }
      ],
      proposition_matches: [
        {
          id: 'm-1',
          category: 'slurry',
          guidance_proposition_id: 'g-1',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED'
        },
        {
          id: 'm-missing',
          category: 'slurry',
          guidance_proposition_id: null,
          law_proposition_id: 'prop:law1',
          relationship: 'GUIDANCE_MISSING'
        }
      ],
      guidance_proposition_match_summaries: [],
      guidance_proposition_law_comparisons: [],
      page_analytics: [],
      subject_summary: [
        {
          category: 'slurry',
          laws_found: 1,
          total_pages_audited: 1,
          pages_relevant: 1,
          proposition_status_counts: { GROUNDED: 1, GUIDANCE_MISSING: 1 }
        }
      ],
      page_relevance: [
        { category: 'slurry', content_id: 'cid-a', relevance_score: 1 }
      ],
      pages_reading_age: []
    }

    const service = wireService(legacy, ['legacy-run'])
    const overview = service.getSubjectOverview('slurry')
    expect(overview.usesGuidanceComparisonContract).toBe(false)

    const vm = auditPropositionsOverviewViewModel.get('slurry')
    expect(vm.breakdownBoxes.map((b) => b.status)).toContain('GROUNDED')
    expect(vm.breakdownBoxes.map((b) => b.status)).toContain('GUIDANCE_MISSING')
    expect(vm.breakdownBoxes.map((b) => b.status)).not.toContain(
      'ONLY_UNGROUNDED_CANDIDATES'
    )
    expect(vm.breakdownBoxes.map((b) => b.status)).not.toContain(
      'NO_CANDIDATES_FOUND'
    )

    const missing = vm.breakdownBoxes.find(
      (b) => b.status === 'GUIDANCE_MISSING'
    )
    expect(missing.href).toBe('/audit/subjects/slurry/laws')
    expect(overview.lawsMissingGuidance).toBe(1)
  })

  test('law-side missing guidance remains separate from guidance totals', () => {
    const service = wireService(presentationWithSummary())
    const overview = service.getSubjectOverview('slurry')

    expect(overview.lawsMissingGuidance).toBe(1)
    expect(overview.statusCounts.GUIDANCE_MISSING).toBe(1)
    expect(overview.totalGuidancePropositions).toBe(8)
    const sumTiles = Object.entries(overview.statusCounts)
      .filter(([k]) => k !== 'GUIDANCE_MISSING')
      .reduce((n, [, v]) => n + v, 0)
    expect(sumTiles).toBeGreaterThan(overview.totalGuidancePropositions)
  })

  test('merged new-contract + legacy categories keep separate paths', async () => {
    const modern = presentationWithSummary()
    const merged = {
      categories: [...modern.categories, { id: 'legacy-cat', title: 'Legacy' }],
      legislation: [
        ...modern.legislation,
        {
          source_record_id: 'lex-legacy',
          category: 'legacy-cat',
          name: 'Legacy Act',
          url: 'https://leg/legacy'
        }
      ],
      legislation_propositions: [
        ...modern.legislation_propositions,
        {
          id: 'prop:legacy',
          category: 'legacy-cat',
          source_record_id: 'lex-legacy',
          proposition_text: 'Legacy law'
        }
      ],
      pages: [
        ...modern.pages,
        {
          content_id: 'cid-legacy',
          category: 'legacy-cat',
          url: 'https://www.gov.uk/legacy',
          title: 'Legacy page'
        }
      ],
      guidance_propositions: [
        ...modern.guidance_propositions,
        {
          id: 'g-legacy',
          content_id: 'cid-legacy',
          category: 'legacy-cat',
          proposition_text: 'Legacy guidance'
        }
      ],
      proposition_matches: [
        ...modern.proposition_matches,
        {
          id: 'm-legacy',
          category: 'legacy-cat',
          guidance_proposition_id: 'g-legacy',
          law_proposition_id: 'prop:legacy',
          relationship: 'GROUNDED'
        }
      ],
      guidance_proposition_match_summaries:
        modern.guidance_proposition_match_summaries,
      guidance_proposition_law_comparisons:
        modern.guidance_proposition_law_comparisons,
      page_analytics: [],
      subject_summary: [
        ...modern.subject_summary,
        {
          category: 'legacy-cat',
          laws_found: 1,
          total_pages_audited: 1,
          pages_relevant: 1,
          proposition_status_counts: { GROUNDED: 1 }
        }
      ],
      page_relevance: [
        ...modern.page_relevance,
        { category: 'legacy-cat', content_id: 'cid-legacy', relevance_score: 1 }
      ],
      pages_reading_age: []
    }

    const service = wireService(merged, ['modern', 'legacy'])
    expect(
      service.getSubjectOverview('slurry').usesGuidanceComparisonContract
    ).toBe(true)
    expect(
      service.getSubjectOverview('legacy-cat').usesGuidanceComparisonContract
    ).toBe(false)

    const legacyDetail = await auditPageDetailViewModel.get(
      'legacy-cat',
      'cid-legacy',
      {}
    )
    expect(legacyDetail.pending.map((s) => s.id)).toContain('m-legacy')
    expect(legacyDetail.pending.map((s) => s.status)).toContain('GROUNDED')
    expect(legacyDetail.pending.map((s) => s.status)).not.toContain(
      'INCONSISTENT_DATA'
    )
  })
})
