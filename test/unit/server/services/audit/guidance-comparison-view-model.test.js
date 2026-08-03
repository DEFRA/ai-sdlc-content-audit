import { describe, expect, test } from 'vitest'

import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'
import {
  buildGuidanceComparisonViewModels,
  extractLawSideMissingGuidance
} from '../../../../../src/server/services/audit/create-guidance-comparison-view-model.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'
import { baseGuidanceComparisonPresentation } from './fixtures/guidance-comparison.fixture.js'

function byGpId(viewModels) {
  return new Map(viewModels.map((vm) => [vm.guidanceProposition.id, vm]))
}

describe('guidance comparison view-model', () => {
  test('builds exactly one view-model per guidance proposition', () => {
    const presentation = baseGuidanceComparisonPresentation()
    const { guidanceComparisons } =
      buildGuidanceComparisonViewModels(presentation)

    expect(guidanceComparisons).toHaveLength(
      presentation.guidance_propositions.length
    )
    expect(guidanceComparisons.map((vm) => vm.guidanceProposition.id)).toEqual(
      presentation.guidance_propositions.map((gp) => gp.id)
    )
  })

  test('joins one GROUNDED comparison with fallbackKind NONE', () => {
    const { guidanceComparisons } = buildGuidanceComparisonViewModels(
      baseGuidanceComparisonPresentation()
    )
    const vm = byGpId(guidanceComparisons).get('g-grounded')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.NONE)
    expect(vm.comparisons).toHaveLength(1)
    expect(vm.comparisons[0].relationship).toBe('GROUNDED')
    expect(vm.comparisons[0].lawProposition.id).toBe('prop:law1')
    expect(vm.comparisons[0].lawProposition.proposition_text).toBe('Law one.')
    expect(vm.comparisons[0].cosineScore).toBe(0.91)
    expect(vm.comparisons[0].explanation).toBe('grounded pair')
  })

  test('retains every distinct reportable comparison in backend order without legacy top-match duplication', () => {
    const presentation = baseGuidanceComparisonPresentation()
    const { guidanceComparisons } =
      buildGuidanceComparisonViewModels(presentation)
    const vm = byGpId(guidanceComparisons).get('g-multi')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.NONE)
    expect(vm.comparisons.map((c) => c.id)).toEqual([
      'm-gm-l1',
      'm-gm-l2',
      'm-gm-l3'
    ])
    expect(vm.comparisons.map((c) => c.relationship)).toEqual([
      'GROUNDED',
      'CONFLICTS',
      'GUIDANCE_INCOMPLETE'
    ])
    expect(vm.reportableComparisonCount).toBe(3)
    // Legacy top-match id must not appear as a second copy.
    expect(vm.comparisons.filter((c) => c.id === 'm-top-multi')).toHaveLength(0)
    expect(vm.comparisons).toHaveLength(3)
  })

  test('maps ONLY_UNGROUNDED_CANDIDATES with empty comparisons', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-ungrounded')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.ONLY_UNGROUNDED_CANDIDATES)
    expect(vm.comparisons).toEqual([])
    expect(vm.ungroundedCandidateCount).toBe(1)
  })

  test('maps NO_CANDIDATES_FOUND with empty comparisons', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-empty')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
    expect(vm.comparisons).toEqual([])
    expect(vm.candidateCount).toBe(0)
  })

  test('maps NOT_CHECKED without treating it as a no-law fallback', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-unchecked')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.NOT_CHECKED)
    expect(vm.fallbackKind).not.toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
    expect(vm.fallbackKind).not.toBe(FALLBACK_KIND.ONLY_UNGROUNDED_CANDIDATES)
  })

  test('maps PARTIAL without a conclusive no-candidate state', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-partial')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.PARTIAL)
    expect(vm.fallbackKind).not.toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
  })

  test('maps FAILED without a conclusive no-candidate state', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-failed')

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.FAILED)
    expect(vm.fallbackKind).not.toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
  })

  test('keeps synthetic law-side GUIDANCE_MISSING off the guidance-side view-model', () => {
    const presentation = baseGuidanceComparisonPresentation()
    const { guidanceComparisons, lawSideMissingGuidance } =
      buildGuidanceComparisonViewModels(presentation)

    expect(extractLawSideMissingGuidance(presentation)).toEqual([
      expect.objectContaining({
        id: 'm-law-missing',
        guidance_proposition_id: null,
        law_proposition_id: 'prop:law3',
        relationship: 'GUIDANCE_MISSING'
      })
    ])
    expect(lawSideMissingGuidance).toHaveLength(1)

    for (const vm of guidanceComparisons) {
      expect(vm.comparisons.every((c) => c.id !== 'm-law-missing')).toBe(true)
      expect(vm.fallbackKind).not.toBe('GUIDANCE_MISSING')
    }
  })

  test('marks summary count mismatch as INCONSISTENT_DATA with diagnostics', () => {
    const presentation = baseGuidanceComparisonPresentation({
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-grounded',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 2,
          candidate_count: 2,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_propositions: [
        {
          id: 'g-grounded',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Do grounded.'
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-only-one',
          guidance_proposition_id: 'g-grounded',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED',
          confidence: 'high',
          cosine_score: 0.9,
          explanation: 'only one'
        }
      ]
    })

    const vm =
      buildGuidanceComparisonViewModels(presentation).guidanceComparisons[0]

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.INCONSISTENT_DATA)
    expect(vm.diagnostics.some((d) => d.includes('count mismatch'))).toBe(true)
    expect(vm.diagnostics.some((d) => d.includes('g-grounded'))).toBe(true)
    expect(vm.fallbackKind).not.toBe(FALLBACK_KIND.NONE)
  })

  test('marks unknown law proposition as INCONSISTENT_DATA with diagnostic', () => {
    const presentation = baseGuidanceComparisonPresentation({
      guidance_propositions: [
        {
          id: 'g-grounded',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Do grounded.'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-grounded',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 1,
          candidate_count: 1,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-missing-law',
          guidance_proposition_id: 'g-grounded',
          law_proposition_id: 'prop:does-not-exist',
          relationship: 'GROUNDED',
          confidence: 'high',
          cosine_score: 0.9,
          explanation: 'orphan law'
        }
      ]
    })

    const vm =
      buildGuidanceComparisonViewModels(presentation).guidanceComparisons[0]

    expect(vm.fallbackKind).toBe(FALLBACK_KIND.INCONSISTENT_DATA)
    expect(
      vm.diagnostics.some((d) => d.includes('unknown law proposition'))
    ).toBe(true)
    expect(vm.comparisons[0].lawProposition).toBeNull()
  })

  test('dedupes duplicate pair identity and marks INCONSISTENT_DATA', () => {
    const presentation = baseGuidanceComparisonPresentation({
      guidance_propositions: [
        {
          id: 'g-grounded',
          content_id: 'cid-a',
          category: 'slurry',
          proposition_text: 'Do grounded.'
        }
      ],
      guidance_proposition_match_summaries: [
        {
          guidance_proposition_id: 'g-grounded',
          assessment_status: 'COMPLETE',
          coverage_result: 'HAS_REPORTABLE_COMPARISON',
          reportable_comparison_count: 1,
          candidate_count: 1,
          ungrounded_candidate_count: 0
        }
      ],
      guidance_proposition_law_comparisons: [
        {
          id: 'm-first',
          guidance_proposition_id: 'g-grounded',
          law_proposition_id: 'prop:law1',
          relationship: 'GROUNDED',
          explanation: 'first'
        },
        {
          id: 'm-dup',
          guidance_proposition_id: 'g-grounded',
          law_proposition_id: 'prop:law1',
          relationship: 'CONFLICTS',
          explanation: 'duplicate'
        }
      ]
    })

    const vm =
      buildGuidanceComparisonViewModels(presentation).guidanceComparisons[0]

    expect(vm.comparisons).toHaveLength(1)
    expect(vm.comparisons[0].id).toBe('m-first')
    expect(vm.comparisons[0].relationship).toBe('GROUNDED')
    expect(vm.fallbackKind).toBe(FALLBACK_KIND.INCONSISTENT_DATA)
    expect(vm.diagnostics.some((d) => d.includes('duplicate comparison'))).toBe(
      true
    )
  })

  test('preserves GUIDANCE_BROADER relationship without renaming', () => {
    const vm = byGpId(
      buildGuidanceComparisonViewModels(baseGuidanceComparisonPresentation())
        .guidanceComparisons
    ).get('g-mixed-summary')

    expect(vm.comparisons[0].relationship).toBe('GUIDANCE_BROADER')
    expect(vm.fallbackKind).toBe(FALLBACK_KIND.NONE)
    expect(vm.ungroundedCandidateCount).toBe(1)
  })

  test('audit service exposes guidance comparisons without changing law-side gaps', () => {
    const service = createAuditService(baseGuidanceComparisonPresentation())
    const comparisons = service.getGuidanceComparisons()
    const lawSide = service.getLawSideMissingGuidance()

    expect(comparisons).toHaveLength(8)
    expect(lawSide).toEqual([expect.objectContaining({ id: 'm-law-missing' })])

    const detail = service.getPageDetail('slurry', 'cid-a')
    expect(detail.missingLaws.some((row) => row.lawText === 'Law three.')).toBe(
      true
    )
  })
})
