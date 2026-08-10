import { describe, expect, test } from 'vitest'

import { buildStatementsFromGuidanceComparisons } from '../../../../../src/server/services/audit/build-page-detail-statements.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'
import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'
import { baseGuidanceComparisonPresentation } from './fixtures/guidance-comparison.fixture.js'

const CATEGORY = 'slurry'
const PAGE = 'cid-a'

function legislationForCategory(_categoryId, sourceRecordId) {
  if (sourceRecordId === 'lex-1') {
    return { name: 'Act 1', url: 'https://leg/1', source_record_id: 'lex-1' }
  }
  return null
}

function statementsFromFixture(overrides = {}) {
  const presentation = baseGuidanceComparisonPresentation(overrides)
  const service = createAuditService(presentation)
  return buildStatementsFromGuidanceComparisons({
    categoryId: CATEGORY,
    pageId: PAGE,
    guidanceComparisons: service.getGuidanceComparisons(),
    legislationForCategory
  })
}

describe('buildStatementsFromGuidanceComparisons', () => {
  test('renders one GROUNDED pair row with no fallback', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do grounded.'
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'm-g1-l1',
      status: 'GROUNDED',
      statusLabel: 'Matches the law',
      lawText: 'Law one.',
      lawName: 'Act 1',
      lawUrl: 'https://leg/1',
      feedbackEnabled: true,
      rowKind: 'comparison'
    })
  })

  test('prefers law proposition provision_url over instrument url', () => {
    const rows = statementsFromFixture({
      legislation_propositions: [
        {
          id: 'prop:law1',
          category: 'slurry',
          source_record_id: 'lex-1',
          proposition_text: 'Law one.',
          fragment_locator: 'regulation:4:paragraph:1',
          provision_url:
            'https://www.legislation.gov.uk/uksi/2015/668/regulation/4/1'
        },
        {
          id: 'prop:law2',
          category: 'slurry',
          source_record_id: 'lex-1',
          proposition_text: 'Law two.'
        },
        {
          id: 'prop:law3',
          category: 'slurry',
          source_record_id: 'lex-1',
          proposition_text: 'Law three.'
        }
      ]
    }).filter((s) => s.guidanceText === 'Do grounded.')

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      lawUrl: 'https://www.legislation.gov.uk/uksi/2015/668/regulation/4/1',
      sourceLocator: 'regulation:4:paragraph:1'
    })
  })

  test('renders every distinct reportable comparison in backend order without legacy top-match duplication', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do multi.'
    )
    expect(rows.map((r) => r.id)).toEqual(['m-gm-l1', 'm-gm-l2', 'm-gm-l3'])
    expect(rows.map((r) => r.status)).toEqual([
      'GROUNDED',
      'CONFLICTS',
      'GUIDANCE_INCOMPLETE'
    ])
    expect(rows.every((r) => r.id !== 'm-top-multi')).toBe(true)
    expect(new Set(rows.map((r) => r.id)).size).toBe(3)
  })

  test('renders GUIDANCE_BROADER with existing beyond-the-law label', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do mixed.'
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('GUIDANCE_BROADER')
    expect(rows[0].statusLabel).toBe('Goes beyond the law')
  })

  test('renders NO_CANDIDATES_FOUND fallback with no pair rows', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do empty.'
    )
    expect(rows).toEqual([
      expect.objectContaining({
        status: FALLBACK_KIND.NO_CANDIDATES_FOUND,
        statusLabel: 'No law candidate found',
        lawText: null,
        feedbackEnabled: false,
        rowKind: 'fallback'
      })
    ])
  })

  test('renders ONLY_UNGROUNDED_CANDIDATES fallback without rejected pairs', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do ungrounded.'
    )
    expect(rows).toEqual([
      expect.objectContaining({
        status: FALLBACK_KIND.ONLY_UNGROUNDED_CANDIDATES,
        statusLabel: 'No comparable law found',
        feedbackEnabled: false
      })
    ])
    expect(rows.every((r) => r.status !== 'UNGROUNDED')).toBe(true)
  })

  test('renders NOT_CHECKED without a no-law conclusion', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do unchecked.'
    )
    expect(rows[0].statusLabel).toBe('Not yet compared')
    expect(rows[0].status).toBe(FALLBACK_KIND.NOT_CHECKED)
    expect(rows[0].status).not.toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
  })

  test('renders PARTIAL processing state', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do partial.'
    )
    expect(rows[0].statusLabel).toBe('Comparison incomplete')
  })

  test('renders FAILED processing state', () => {
    const rows = statementsFromFixture().filter(
      (s) => s.guidanceText === 'Do failed.'
    )
    expect(rows[0].statusLabel).toBe('Comparison failed')
  })

  test('renders INCONSISTENT_DATA as a safe unavailable state', () => {
    const rows = statementsFromFixture({
      guidance_propositions: [
        {
          id: 'g-bad',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Broken.'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-bad',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 2,
          candidate_count: 2,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-only',
          guidance_proposition_id: 'g-bad',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED',
          explanation: 'one'
        }
      ]
    }).filter((s) => s.guidanceText === 'Broken.')

    expect(rows[0].status).toBe(FALLBACK_KIND.INCONSISTENT_DATA)
    expect(rows[0].statusLabel).toBe('Comparison unavailable')
    expect(rows[0].feedbackEnabled).toBe(false)
  })

  test('scopes statements to the selected page and category', () => {
    const presentation = baseGuidanceComparisonPresentation({
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
        },
        {
          id: 'g-other-cat',
          content_id: 'cid-a',
          category: 'fish',
          proposition_text: 'Other category.'
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
        },
        {
          guidance_proposition_id: 'g-other-cat',
          assessment_status: 'COMPLETE',
          coverage_result: 'NO_CANDIDATES_FOUND',
          candidate_count: 0,
          reportable_comparison_count: 0,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: []
    })
    const service = createAuditService(presentation)
    const rows = buildStatementsFromGuidanceComparisons({
      categoryId: 'slurry',
      pageId: 'cid-a',
      guidanceComparisons: service.getGuidanceComparisons(),
      legislationForCategory
    })
    expect(rows.map((r) => r.guidanceText)).toEqual(['Here.'])
  })
})

describe('getPageDetail with guidance-comparison contract', () => {
  test('uses comparison rows and keeps synthetic law-side GUIDANCE_MISSING separate', () => {
    const service = createAuditService(baseGuidanceComparisonPresentation())
    const detail = service.getPageDetail('slurry', 'cid-a')

    const multi = detail.statements.filter(
      (s) => s.guidanceText === 'Do multi.'
    )
    expect(multi).toHaveLength(3)
    expect(detail.statements.some((s) => s.id === 'm-top-multi')).toBe(false)
    expect(detail.statements.some((s) => s.id === 'm-law-missing')).toBe(false)
    expect(detail.missingLaws.some((row) => row.lawText === 'Law three.')).toBe(
      true
    )
  })

  test('resolves feedback status for full-comparison pair ids', () => {
    const service = createAuditService(baseGuidanceComparisonPresentation())
    expect(service.getMatchStatus('m-gm-l2')).toBe('CONFLICTS')
    expect(service.getMatchStatus('m-top-grounded')).toBe('GROUNDED')
    expect(service.getMatchStatus('fb-g-empty-NO_CANDIDATES_FOUND')).toBeNull()
  })

  test('keeps legacy top-match statements when summaries are absent', () => {
    const service = createAuditService(
      baseGuidanceComparisonPresentation({
        guidance_proposition_match_summaries: [],
        guidance_proposition_law_comparisons: []
      })
    )
    const detail = service.getPageDetail('slurry', 'cid-a')
    expect(detail.statements.some((s) => s.id === 'm-top-grounded')).toBe(true)
    expect(
      detail.statements.filter((s) => s.guidanceText === 'Do multi.')
    ).toEqual([
      expect.objectContaining({
        id: 'm-top-multi',
        status: 'GROUNDED'
      })
    ])
  })
})
