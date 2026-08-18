import { fileURLToPath } from 'node:url'
import path from 'path'

import { load } from 'cheerio'
import nunjucks from 'nunjucks'
import { describe, expect, test } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import { FALLBACK_KIND } from '../../../../../src/server/services/audit/guidance-comparison-constants.js'
import { presentGuidanceRow } from '../../../../../src/server/features/audit-page-detail/present-guidance-row.js'
import { presentComparisonCard } from '../../../../../src/server/features/audit-page-detail/present-comparison-card.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const nunjucksEnv = nunjucks.configure(
  [
    path.resolve(dirname, '../../../../../node_modules/govuk-frontend/dist/'),
    path.resolve(dirname, '../../../../../src/server')
  ],
  {
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true
  }
)

const DISTINCTIVE_GUIDANCE =
  'UNIQUE-GUIDANCE-TEXT-do-not-spread-on-frozen-ground-XYZ'
const GUIDANCE_PROPOSITION_ID = 'susan-41dbc58cc6ea1113-42'
const LAW_PROPOSITION_ID_CONFLICT = 'bcand:1a3b4db1707f8376'
const LAW_PROPOSITION_ID_GROUNDED = 'bcand:297badcb25473d76'

function renderGuidanceRow(row, options = {}) {
  const presented = presentGuidanceRow(row, options)
  const html = nunjucksEnv.renderString(
    `{%- from "features/audit-page-detail/_guidance-row.njk" import guidanceRow -%}{{- guidanceRow(row) -}}`,
    { row: presented }
  )
  return { $: load(html), presented, html }
}

function renderStatementCard(comparison, options = {}) {
  const presented = presentComparisonCard(comparison, options)
  const html = nunjucksEnv.renderString(
    `{%- from "features/audit-page-detail/_statement-card.njk" import statementCard -%}{{- statementCard(s) -}}`,
    { s: presented }
  )
  return { $: load(html), presented, html }
}

describe('guidanceRow template', () => {
  test('renders a distinguishing h3 heading and parent-level guidance text', () => {
    const { $ } = renderGuidanceRow(
      {
        id: 'g-multi',
        guidancePropositionId: GUIDANCE_PROPOSITION_ID,
        guidanceText: DISTINCTIVE_GUIDANCE,
        aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
        primaryLabel: 'Conflict found',
        primaryTone: 'red',
        rowKind: 'comparison',
        comparisons: [
          {
            id: 'm-c',
            status: 'CONFLICTS',
            statusLabel: 'Goes against the law',
            statusTone: 'red',
            guidanceText: DISTINCTIVE_GUIDANCE,
            lawName: 'Act 1',
            lawUrl: 'https://leg/1',
            lawText: 'Law conflict text.',
            explanation: 'Conflicts with the exception.',
            rowKind: 'comparison'
          },
          {
            id: 'm-g',
            status: 'GROUNDED',
            statusLabel: 'Matches the law',
            statusTone: 'green',
            guidanceText: DISTINCTIVE_GUIDANCE,
            lawName: 'Act 1',
            lawUrl: 'https://leg/1',
            lawText: 'Law grounded text.',
            explanation: 'Supports the restriction.',
            rowKind: 'comparison'
          }
        ],
        chips: []
      },
      { statementNumber: 12 }
    )

    const heading = $('#guidance-heading-g-multi')
    expect(heading).toHaveLength(1)
    expect(heading.is('h3')).toBe(true)
    expect(heading.text()).toContain('Guidance statement 12')
    expect(heading.find('.audit-proposition-id').text().trim()).toBe(
      GUIDANCE_PROPOSITION_ID
    )
    expect($('article#guidance-g-multi').attr('aria-labelledby')).toBe(
      'guidance-heading-g-multi'
    )
    expect($('article > p.govuk-body').first().text()).toBe(
      DISTINCTIVE_GUIDANCE
    )
    expect($('article.audit-guidance-row.govuk-summary-card')).toHaveLength(0)
  })

  test('does not repeat parent guidance wording inside comparison cards', () => {
    const { html, $ } = renderGuidanceRow({
      id: 'g-multi',
      guidanceText: DISTINCTIVE_GUIDANCE,
      aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryLabel: 'Conflict found',
      primaryTone: 'red',
      rowKind: 'comparison',
      comparisons: [
        {
          id: 'm-c',
          status: 'CONFLICTS',
          statusLabel: 'Goes against the law',
          statusTone: 'red',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law conflict text.',
          explanation: 'Conflicts with the exception.',
          rowKind: 'comparison'
        },
        {
          id: 'm-g',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law grounded text.',
          explanation: 'Supports the restriction.',
          rowKind: 'comparison'
        }
      ],
      chips: []
    })

    const occurrences = html.split(DISTINCTIVE_GUIDANCE).length - 1
    expect(occurrences).toBe(1)
    expect($('.audit-statement-card').text()).not.toContain(
      DISTINCTIVE_GUIDANCE
    )
    expect($('.audit-statement-card').text()).not.toContain(
      'This guidance says'
    )
  })

  test('renders comparison hierarchy with law content, assessment and source link', () => {
    const { $ } = renderGuidanceRow({
      id: 'g-multi',
      guidanceText: DISTINCTIVE_GUIDANCE,
      aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryLabel: 'Conflict found',
      primaryTone: 'red',
      rowKind: 'comparison',
      comparisons: [
        {
          id: 'm-c',
          status: 'CONFLICTS',
          statusLabel: 'Goes against the law',
          statusTone: 'red',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Nitrate Pollution Prevention Regulations 2015',
          lawUrl: 'https://leg/1',
          lawText: 'Do not spread when frozen.',
          lawPropositionId: LAW_PROPOSITION_ID_CONFLICT,
          sourceLocator: 'Regulation 18(3)',
          explanation: 'The guidance omits the statutory exception.',
          rowKind: 'comparison'
        },
        {
          id: 'm-g',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law grounded text.',
          lawPropositionId: LAW_PROPOSITION_ID_GROUNDED,
          explanation: null,
          rowKind: 'comparison'
        }
      ],
      chips: []
    })

    expect($('#comparison-heading-m-c').is('h4')).toBe(true)
    expect($('#comparison-heading-m-c').text()).toContain('Law comparison 1')
    expect(
      $('#comparison-heading-m-c').find('.audit-proposition-id').text().trim()
    ).toBe(LAW_PROPOSITION_ID_CONFLICT)
    expect($('#comparison-heading-m-g').text()).toContain('Law comparison 2')
    expect(
      $('#comparison-heading-m-g').find('.audit-proposition-id').text().trim()
    ).toBe(LAW_PROPOSITION_ID_GROUNDED)

    const conflictCard = $('#statement-m-c')
    expect(conflictCard.find('.govuk-tag .govuk-visually-hidden').text()).toBe(
      'Law comparison outcome: Goes against the law'
    )
    expect(conflictCard.find('.govuk-tag').closest('a, button')).toHaveLength(0)
    expect(conflictCard.text()).toContain(
      'Nitrate Pollution Prevention Regulations 2015'
    )
    expect(conflictCard.text()).toContain('Regulation 18(3)')
    expect(conflictCard.text()).toContain('Legal proposition')
    expect(conflictCard.text()).toContain('Do not spread when frozen.')
    expect(conflictCard.text()).toContain('Assessment')
    expect(conflictCard.text()).toContain(
      'The guidance omits the statutory exception.'
    )
    expect(conflictCard.text()).not.toContain('CONFLICT_FOUND')
    expect(conflictCard.text()).not.toContain('Conflict found')

    const sourceLink = conflictCard.find('a.govuk-link')
    expect(sourceLink.attr('href')).toBe('https://leg/1')
    expect(sourceLink.text()).toBe(
      'View Regulation 18(3) in the source legislation (opens in new tab)'
    )
    expect(sourceLink.attr('target')).toBe('_blank')
    expect(conflictCard.find('h5')).toHaveLength(0)

    expect($('#statement-m-g').text()).toContain(
      'No assessment explanation is available for this comparison.'
    )
    expect($('#guidance-comparisons-g-multi #statement-m-c')).toHaveLength(1)
    expect($('details details')).toHaveLength(0)
  })

  test('exposes one stable Review summary label with no nested controls', () => {
    const { $, html } = renderGuidanceRow({
      id: 'g-details',
      guidanceText: DISTINCTIVE_GUIDANCE,
      aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryLabel: 'Conflict found',
      primaryTone: 'red',
      rowKind: 'comparison',
      comparisons: [
        {
          id: 'm-1',
          status: 'CONFLICTS',
          statusLabel: 'Goes against the law',
          statusTone: 'red',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law text.',
          explanation: 'Conflicts.',
          rowKind: 'comparison'
        },
        {
          id: 'm-2',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law grounded.',
          explanation: 'Supports.',
          rowKind: 'comparison'
        }
      ],
      chips: []
    })

    expect($('details')).toHaveLength(1)
    expect($('summary a, summary button, summary input')).toHaveLength(0)
    expect($('.govuk-details__summary-text').text().trim()).toBe(
      'Review 2 law comparisons'
    )
    expect(html).not.toContain('Hide ')
    expect(html).not.toContain('audit-guidance-row__control-closed')
    expect(html).not.toContain('audit-guidance-row__control-open')
    expect($('.audit-guidance-row__comparison-count')).toHaveLength(0)
    expect($('#guidance-comparisons-g-details #statement-m-1')).toHaveLength(1)
  })

  test('keeps aggregate and pair outcome announcements distinct without raw enums', () => {
    const { $ } = renderGuidanceRow({
      id: 'g-a11y',
      guidanceText: DISTINCTIVE_GUIDANCE,
      aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      primaryLabel: 'Conflict found',
      primaryTone: 'red',
      rowKind: 'comparison',
      comparisons: [
        {
          id: 'm-c',
          status: 'CONFLICTS',
          statusLabel: 'Goes against the law',
          statusTone: 'red',
          guidanceText: DISTINCTIVE_GUIDANCE,
          lawName: 'Act 1',
          lawUrl: 'https://leg/1',
          lawText: 'Law text.',
          explanation: 'Conflicts.',
          rowKind: 'comparison'
        }
      ],
      chips: []
    })

    const aggregateHidden = $(
      '.audit-guidance-row__status .govuk-visually-hidden'
    ).text()
    const pairHidden = $('#statement-m-c .govuk-visually-hidden').text()
    expect(aggregateHidden).toBe('Overall guidance outcome: Conflict found')
    expect(pairHidden).toBe('Law comparison outcome: Goes against the law')
    expect($('.audit-guidance-row__status [aria-hidden="true"]').text()).toBe(
      'Conflict found'
    )
    expect($('#statement-m-c [aria-hidden="true"]').first().text()).toBe(
      'Goes against the law'
    )
    expect($.text()).not.toContain('CONFLICT_FOUND')
    expect($.text()).not.toContain('CONFLICTS')
  })

  test('renders NOT_ASSESSED with processing explanation and no comparison action', () => {
    const { $ } = renderGuidanceRow({
      id: 'g-empty',
      guidanceText: 'Do empty.',
      aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
      primaryStatus: FALLBACK_KIND.NO_CANDIDATES_FOUND,
      primaryLabel: 'No law candidate found',
      primaryTone: 'grey',
      primaryMeaning:
        'The comparison process completed, but no candidate law proposition was found.',
      rowKind: 'fallback',
      comparisons: [],
      chips: []
    })

    const aggregateTags = $('.audit-guidance-row__status .govuk-tag')
    expect(aggregateTags).toHaveLength(1)
    expect(aggregateTags.hasClass('govuk-tag--grey')).toBe(true)
    expect(aggregateTags.text()).toContain('Not assessed')
    expect($('.audit-guidance-row__explanation').text()).toContain(
      'no candidate law proposition'
    )
    expect($('.audit-guidance-row__comparison-count')).toHaveLength(0)
    expect($('details')).toHaveLength(0)
  })
})

describe('guidanceRow restored coverage', () => {
  test('keeps unique heading and comparison ids across a multi-row fixture', () => {
    const first = renderGuidanceRow(
      {
        id: 'g-a',
        guidanceText: 'A.',
        aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        primaryLabel: 'Supporting law found',
        primaryTone: 'green',
        rowKind: 'comparison',
        comparisons: [
          {
            id: 'm-a',
            status: 'GROUNDED',
            statusLabel: 'Matches the law',
            statusTone: 'green',
            guidanceText: 'A.',
            lawText: 'Law A.',
            explanation: 'ok',
            rowKind: 'comparison'
          }
        ],
        chips: []
      },
      { statementNumber: 1 }
    )
    const second = renderGuidanceRow(
      {
        id: 'g-b',
        guidanceText: 'B.',
        aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
        primaryLabel: 'Supporting law found',
        primaryTone: 'green',
        rowKind: 'comparison',
        comparisons: [
          {
            id: 'm-b',
            status: 'GROUNDED',
            statusLabel: 'Matches the law',
            statusTone: 'green',
            guidanceText: 'B.',
            lawText: 'Law B.',
            explanation: 'ok',
            rowKind: 'comparison'
          }
        ],
        chips: []
      },
      { statementNumber: 2 }
    )

    const combinedHtml = first.html + second.html
    const ids = [...combinedHtml.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])
    expect(new Set(ids).size).toBe(ids.length)

    expect(first.presented.headingId).not.toBe(second.presented.headingId)
    expect(first.presented.comparisonContainerId).not.toBe(
      second.presented.comparisonContainerId
    )
    expect(first.$('#guidance-heading-g-a').is('h3')).toBe(true)
    expect(second.$('#guidance-heading-g-b').is('h3')).toBe(true)
    expect(first.$('#comparison-heading-m-a').is('h4')).toBe(true)
    expect(second.$('#comparison-heading-m-b').is('h4')).toBe(true)
    expect(first.$('#guidance-comparisons-g-a')).toHaveLength(1)
    expect(second.$('#guidance-comparisons-g-b')).toHaveLength(1)
  })

  test('SUPPORTING_LAW_FOUND explanation does not claim every comparison is green', () => {
    const { $ } = renderGuidanceRow({
      id: 'g-gy',
      guidanceText: 'Green and yellow.',
      aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryStatus: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      primaryLabel: 'Supporting law found',
      primaryTone: 'green',
      rowKind: 'comparison',
      comparisons: [
        {
          id: 'm-g',
          status: 'GROUNDED',
          statusLabel: 'Matches the law',
          statusTone: 'green',
          guidanceText: 'Green and yellow.',
          lawText: 'Law grounded.',
          explanation: 'Supports.',
          rowKind: 'comparison'
        },
        {
          id: 'm-y',
          status: 'GUIDANCE_INCOMPLETE',
          statusLabel: 'Only part of the law',
          statusTone: 'yellow',
          guidanceText: 'Green and yellow.',
          lawText: 'Law incomplete.',
          explanation: 'Partial.',
          rowKind: 'comparison'
        }
      ],
      chips: []
    })

    expect($('.audit-guidance-row__status .govuk-tag').text()).toContain(
      'Supporting law found'
    )
    expect($('.audit-guidance-row__explanation').text()).toContain(
      'inconclusive'
    )
    expect($('.audit-guidance-row__explanation').text()).not.toMatch(
      /all|passed|correct|no issues/i
    )
  })
})

describe('statementCard shared template', () => {
  test('still renders guidance text when showGuidanceText is true', () => {
    const { $, html } = renderStatementCard(
      {
        id: 'm-pair',
        status: 'GROUNDED',
        statusLabel: 'Matches the law',
        statusTone: 'green',
        guidanceText: DISTINCTIVE_GUIDANCE,
        lawName: 'Act 1',
        lawUrl: 'https://leg/1',
        lawText: 'Law text.',
        explanation: 'Supports the restriction.',
        rowKind: 'comparison'
      },
      { showGuidanceText: true, headingLevel: 3, displayNumber: 1 }
    )

    expect(html.split(DISTINCTIVE_GUIDANCE).length - 1).toBe(1)
    expect($.text()).toContain('This guidance says')
    expect($.text()).toContain(DISTINCTIVE_GUIDANCE)
    expect($('h3').first().text().trim()).toBe('Law comparison 1')
  })

  test('omits empty source links when no URL is available', () => {
    const { $ } = renderStatementCard({
      id: 'm-x',
      status: 'GROUNDED',
      statusLabel: 'Matches the law',
      statusTone: 'green',
      guidanceText: 'Guidance.',
      lawName: 'Act 1',
      lawUrl: null,
      lawText: 'Law text.',
      explanation: 'ok',
      rowKind: 'comparison'
    })

    expect($('a.govuk-link')).toHaveLength(0)
  })
})
