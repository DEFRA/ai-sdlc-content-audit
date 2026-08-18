import { describe, expect, test } from 'vitest'

import {
  presentComparisonCard,
  presentPairComparisonOutcome
} from '../../../../../src/server/features/audit-page-detail/present-comparison-card.js'

describe('presentPairComparisonOutcome', () => {
  test('builds pair accessible label from STATUS_META', () => {
    expect(presentPairComparisonOutcome({ status: 'CONFLICTS' })).toEqual({
      pairStatusLabel: 'Goes against the law',
      pairGovukTagClass: 'govuk-tag--red',
      pairAccessibleLabel: 'Law comparison outcome: Goes against the law'
    })
  })
})

describe('presentComparisonCard', () => {
  test('numbers comparisons and hides guidance text for the aggregated view', () => {
    const presented = presentComparisonCard(
      {
        id: 'm-c',
        status: 'CONFLICTS',
        statusLabel: 'Goes against the law',
        statusTone: 'red',
        guidanceText: 'Do not spread on frozen ground.',
        lawName: 'Nitrate Pollution Prevention Regulations 2015',
        lawUrl: 'https://leg/1',
        lawText: 'Do not spread nitrogen fertiliser when frozen.',
        lawPropositionId: 'bcand:1a3b4db1707f8376',
        sourceLocator: 'Regulation 18(3)',
        explanation: 'The guidance omits the statutory exception.',
        rowKind: 'comparison',
        order: 0
      },
      {
        displayNumber: 1,
        showGuidanceText: false,
        headingLevel: 4
      }
    )

    expect(presented).toMatchObject({
      heading: 'Law comparison 1',
      headingId: 'comparison-heading-m-c',
      headingLevel: 4,
      showGuidanceText: false,
      sourceTitle: 'Nitrate Pollution Prevention Regulations 2015',
      sourceLocator: 'Regulation 18(3)',
      lawContentLabel: 'Legal proposition',
      lawContent: 'Do not spread nitrogen fertiliser when frozen.',
      propositionId: 'bcand:1a3b4db1707f8376',
      assessmentHeading: 'Assessment',
      assessmentText: 'The guidance omits the statutory exception.',
      sourceUrl: 'https://leg/1',
      sourceLinkText:
        'View Regulation 18(3) in the source legislation (opens in new tab)',
      pairAccessibleLabel: 'Law comparison outcome: Goes against the law'
    })
  })

  test('uses assessment fallback when explanation is missing', () => {
    const presented = presentComparisonCard({
      id: 'm-g',
      status: 'GROUNDED',
      statusLabel: 'Matches the law',
      statusTone: 'green',
      guidanceText: 'Guidance.',
      lawName: 'Act 1',
      lawUrl: 'https://leg/1',
      lawText: 'Law text.',
      explanation: null,
      rowKind: 'comparison'
    })

    expect(presented.assessmentText).toBe(
      'No assessment explanation is available for this comparison.'
    )
    expect(presented.propositionId).toBeNull()
    expect(presented.sourceLinkText).toBe('View source law (opens in new tab)')
  })

  test('keeps guidance text available for focused pair-review presentation', () => {
    const presented = presentComparisonCard(
      {
        id: 'm-g',
        status: 'GROUNDED',
        statusLabel: 'Matches the law',
        statusTone: 'green',
        guidanceText: 'Keep this guidance text.',
        lawText: 'Law text.',
        lawName: 'Act 1',
        lawUrl: 'https://leg/1',
        explanation: 'Supports the restriction.',
        rowKind: 'comparison'
      },
      { showGuidanceText: true, headingLevel: 3, displayNumber: 2 }
    )

    expect(presented.showGuidanceText).toBe(true)
    expect(presented.guidanceText).toBe('Keep this guidance text.')
    expect(presented.heading).toBe('Law comparison 2')
    expect(presented.headingLevel).toBe(3)
  })

  test('does not invent a source link when no URL is available', () => {
    const presented = presentComparisonCard({
      id: 'm-x',
      status: 'GROUNDED',
      statusLabel: 'Matches the law',
      statusTone: 'green',
      lawName: 'Act 1',
      lawUrl: null,
      lawText: 'Law text.',
      explanation: 'ok',
      rowKind: 'comparison'
    })

    expect(presented.sourceUrl).toBeNull()
    expect(presented.sourceLinkText).toBeNull()
  })
})
