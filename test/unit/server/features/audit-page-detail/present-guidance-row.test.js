import { describe, expect, test } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'
import {
  buildAggregateCompositionText,
  buildAggregateExplanation,
  buildComparisonControlText,
  buildComparisonCountText,
  buildProcessingExplanation,
  presentGuidanceAggregateOutcome,
  presentGuidanceRow
} from '../../../../../src/server/features/audit-page-detail/present-guidance-row.js'

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

describe('buildAggregateCompositionText', () => {
  test('builds plain-text composition from pair outcomes', () => {
    expect(
      buildAggregateCompositionText([
        { status: 'CONFLICTS' },
        { status: 'GROUNDED' },
        { status: 'GROUNDED' },
        { status: 'GUIDANCE_INCOMPLETE' }
      ])
    ).toBe('1 conflict · 1 incomplete · 2 grounded')
  })

  test('includes unassessed count when present', () => {
    expect(
      buildAggregateCompositionText(
        [{ status: 'GROUNDED' }, { status: 'GROUNDED' }],
        1
      )
    ).toBe('2 grounded · 1 unassessed')
  })

  test('returns null when there is nothing to summarise', () => {
    expect(buildAggregateCompositionText([])).toBeNull()
    expect(buildAggregateCompositionText([], 0)).toBeNull()
  })
})

describe('buildAggregateExplanation', () => {
  test('uses singular conflict wording for one CONFLICTS pair', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        comparisons: [{ status: 'CONFLICTS' }, { status: 'GROUNDED' }]
      })
    ).toBe('1 matched law proposition conflicts with this guidance.')
  })

  test('uses plural conflict wording for multiple CONFLICTS pairs', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        comparisons: [{ status: 'CONFLICTS' }, { status: 'CONFLICTS' }]
      })
    ).toBe('2 matched law propositions conflict with this guidance.')
  })

  test('SUPPORTING_LAW_FOUND does not claim every comparison is green', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        comparisons: [{ status: 'GROUNDED' }, { status: 'GUIDANCE_INCOMPLETE' }]
      })
    ).toBe('Supporting law was found; 1 other comparison remains inconclusive.')
  })

  test('SUPPORTING_LAW_FOUND with only grounded pairs omits inconclusive clause', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        comparisons: [{ status: 'GROUNDED' }, { status: 'GROUNDED' }]
      })
    ).toBe(
      'Supporting law was found and no conflicting comparison was identified.'
    )
  })

  test('NO_CONFIRMED_SUPPORT distinguishes no conflict from no support', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
        comparisons: [{ status: 'GUIDANCE_INCOMPLETE' }]
      })
    ).toBe(
      'No conflicting law was identified, but no supporting comparison was confirmed.'
    )
  })

  test('NOT_ASSESSED reuses processing explanation without a second sentence', () => {
    expect(
      buildAggregateExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
        comparisons: [],
        processingExplanation:
          'The comparison process completed, but no candidate law proposition was found.'
      })
    ).toBe(
      'The comparison process completed, but no candidate law proposition was found.'
    )
  })
})

describe('buildComparisonCountText / buildComparisonControlText', () => {
  test('uses singular and plural comparison copy', () => {
    expect(buildComparisonCountText(1)).toBe('1 law comparison')
    expect(buildComparisonCountText(3)).toBe('3 law comparisons')
    expect(buildComparisonCountText(0)).toBeNull()
  })

  test('builds a stable Review control label from the rendered count', () => {
    expect(buildComparisonControlText(1)).toBe('Review 1 law comparison')
    expect(buildComparisonControlText(3)).toBe('Review 3 law comparisons')
    expect(buildComparisonControlText(0)).toBeNull()
  })
})

describe('buildProcessingExplanation', () => {
  test('uses fallback meaning for NOT_ASSESSED processing rows', () => {
    expect(
      buildProcessingExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
        rowKind: 'fallback',
        primaryMeaning:
          'The comparison process completed, but no candidate law proposition was found.',
        pairCount: 0
      })
    ).toBe(
      'The comparison process completed, but no candidate law proposition was found.'
    )
  })

  test('returns null when the aggregate is assessed', () => {
    expect(
      buildProcessingExplanation({
        aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        rowKind: 'comparison',
        primaryMeaning: 'ignored',
        pairCount: 2
      })
    ).toBeNull()
  })
})

describe('presentGuidanceRow', () => {
  test('builds heading, explanation and comparison controls for overview scanning', () => {
    const presented = presentGuidanceRow(
      {
        id: 'g-multi',
        guidancePropositionId: 'susan-41dbc58cc6ea1113-42',
        guidanceText: 'Do multi.',
        aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        primaryLabel: 'Conflict found',
        primaryTone: 'red',
        rowKind: 'comparison',
        pairCount: 2,
        unassessedCount: 0,
        comparisons: [
          {
            id: 'm-c',
            status: 'CONFLICTS',
            statusLabel: 'Goes against the law',
            statusTone: 'red',
            lawText: 'Law conflict.',
            lawPropositionId: 'bcand:1a3b4db1707f8376',
            explanation: 'Conflicts.',
            rowKind: 'comparison'
          },
          {
            id: 'm-g',
            status: 'GROUNDED',
            statusLabel: 'Matches the law',
            statusTone: 'green',
            lawText: 'Law grounded.',
            explanation: 'Supports.',
            rowKind: 'comparison'
          }
        ],
        chips: []
      },
      { statementNumber: 12 }
    )

    expect(presented.heading).toBe('Guidance statement 12')
    expect(presented.headingId).toBe('guidance-heading-g-multi')
    expect(presented.propositionId).toBe('susan-41dbc58cc6ea1113-42')
    expect(presented.aggregateLabel).toBe('Conflict found')
    expect(presented.compositionText).toBe('1 conflict · 1 grounded')
    expect(presented.aggregateExplanation).toBe(
      '1 matched law proposition conflicts with this guidance.'
    )
    expect(presented.comparisonCount).toBe(2)
    expect(presented.comparisonCountText).toBe('2 law comparisons')
    expect(presented.comparisonControlText).toBe('Review 2 law comparisons')
    expect(presented.comparisonContainerId).toBe('guidance-comparisons-g-multi')
    expect(presented.comparisons[0]).toMatchObject({
      heading: 'Law comparison 1',
      showGuidanceText: false,
      headingLevel: 4,
      propositionId: 'bcand:1a3b4db1707f8376'
    })
    expect(presented.comparisons[1].heading).toBe('Law comparison 2')
  })

  test('prefers aggregateOutcome over processing primaryStatus for the main tag', () => {
    const presented = presentGuidanceRow({
      id: 'g-empty',
      guidanceText: 'Do empty.',
      aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
      primaryStatus: FALLBACK_KIND.NO_CANDIDATES_FOUND,
      primaryLabel: 'No law candidate found',
      primaryTone: 'grey',
      primaryMeaning:
        'The comparison process completed, but no candidate law proposition was found.',
      rowKind: 'fallback',
      pairCount: 0,
      unassessedCount: 0,
      comparisons: [],
      chips: []
    })

    expect(presented.propositionId).toBeNull()
    expect(presented.aggregateLabel).toBe('Not assessed')
    expect(presented.aggregateTone).toBe('grey')
    expect(presented.aggregateGovukTagClass).toBe('govuk-tag--grey')
    expect(presented.aggregateExplanation).toContain('no candidate law')
    expect(presented.comparisonCount).toBe(0)
    expect(presented.comparisonCountText).toBeNull()
    expect(presented.comparisonControlText).toBeNull()
    expect(presented.primaryStatus).toBe(FALLBACK_KIND.NO_CANDIDATES_FOUND)
  })

  test('green aggregate with yellow pair keeps both in composition', () => {
    const presented = presentGuidanceRow({
      id: 'g-gy',
      guidanceText: 'Green and yellow.',
      aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryLabel: 'Supporting law found',
      primaryTone: 'green',
      rowKind: 'comparison',
      pairCount: 2,
      unassessedCount: 0,
      comparisons: [
        {
          id: 'm-g',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green'
        },
        {
          id: 'm-y',
          status: 'GUIDANCE_INCOMPLETE',
          statusLabel: 'Only part of the law',
          statusTone: 'yellow'
        }
      ],
      chips: []
    })

    expect(presented.aggregateLabel).toBe('Supporting law found')
    expect(presented.aggregateGovukTagClass).toBe('govuk-tag--green')
    expect(presented.compositionText).toBe('1 incomplete · 1 grounded')
    expect(presented.aggregateExplanation).toBe(
      'Supporting law was found; 1 other comparison remains inconclusive.'
    )
    expect(presented.comparisons.map((c) => c.status)).toEqual([
      'GROUNDED',
      'GUIDANCE_INCOMPLETE'
    ])
  })
})
