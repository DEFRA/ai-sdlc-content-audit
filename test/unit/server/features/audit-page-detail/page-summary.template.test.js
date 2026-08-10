import { fileURLToPath } from 'node:url'
import path from 'path'

import { load } from 'cheerio'
import nunjucks from 'nunjucks'
import { describe, expect, test } from 'vitest'

import { AGGREGATE_OUTCOME } from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'
import {
  buildGuidanceCountText,
  presentPageSummaryAndFilters
} from '../../../../../src/server/features/audit-page-detail/present-page-summary.js'

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

function renderPageRegions({
  allRows,
  selectedOutcomes = [],
  guidanceRows = [],
  pageBaseHref = '/audit/subjects/slurry/pages/cid-a'
}) {
  const { summary, filters } = presentPageSummaryAndFilters({
    allRows,
    selectedOutcomes,
    pageBaseHref
  })
  const totalGuidanceCount = summary.totalGuidanceCount
  const visibleGuidanceCount = guidanceRows.length
  const visibleCountText = buildGuidanceCountText(
    totalGuidanceCount,
    visibleGuidanceCount,
    filters.active
  )

  const html = nunjucksEnv.renderString(
    `
    {% from "govuk/components/checkboxes/macro.njk" import govukCheckboxes %}
    {% from "govuk/components/button/macro.njk" import govukButton %}
    <section class="audit-page-summary" aria-labelledby="guidance-summary-heading">
      <h2 id="guidance-summary-heading" class="govuk-heading-m">Guidance review summary</h2>
      <p class="govuk-body">{{ summary.totalCountText }}</p>
      <ul class="govuk-list">
        {% for item in summary.outcomeItems %}
          <li>{{ item.summaryText }}</li>
        {% endfor %}
      </ul>
    </section>
    <section class="audit-page-filters" aria-labelledby="guidance-filters-heading">
      <h2 id="guidance-filters-heading" class="govuk-heading-m">Filter guidance statements</h2>
      <form method="get" action="{{ filters.formAction }}" aria-labelledby="guidance-filters-heading">
        {{ govukCheckboxes({
          name: "outcome",
          fieldset: {
            legend: { text: "Overall guidance outcome", classes: "govuk-fieldset__legend--s" }
          },
          items: filters.checkboxItems
        }) }}
        {{ govukButton({ text: "Apply filters" }) }}
      </form>
    </section>
    {% if filters.active %}
      <section class="audit-active-filters" aria-labelledby="active-filters-heading">
        <h2 id="active-filters-heading" class="govuk-heading-s">Active filters</h2>
        <ul class="govuk-list">
          {% for item in filters.activeItems %}
            <li>
              {{ item.label }}
              <a class="govuk-link" href="{{ item.removeHref }}">
                <span class="govuk-visually-hidden">{{ item.removeAccessibleName }}</span>
                <span aria-hidden="true">Remove</span>
              </a>
            </li>
          {% endfor %}
        </ul>
        <a class="govuk-link" href="{{ filters.clearHref }}">Clear filters</a>
      </section>
    {% endif %}
    <p class="visible-count">{{ visibleCountText }}</p>
    {% if guidanceRows.length %}
      <p>results</p>
    {% elif summary.totalGuidanceCount > 0 and filters.active %}
      <p class="filtered-empty">No guidance statements match these filters.</p>
      <a class="govuk-link clear-empty" href="{{ filters.clearHref }}">Clear filters</a>
    {% else %}
      <p class="no-data">No guidance statements are available.</p>
    {% endif %}
    `,
    { summary, filters, visibleCountText, guidanceRows }
  )
  return load(html)
}

describe('page summary and filter template regions', () => {
  const allRows = [
    { aggregateOutcome: AGGREGATE_OUTCOME.CONFLICT_FOUND },
    { aggregateOutcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT },
    { aggregateOutcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND },
    { aggregateOutcome: AGGREGATE_OUTCOME.NOT_ASSESSED }
  ]

  test('keeps static summary distinct from checkbox filters', () => {
    const $ = renderPageRegions({ allRows, guidanceRows: allRows })

    expect($('#guidance-summary-heading').text()).toBe(
      'Guidance review summary'
    )
    expect($('#guidance-filters-heading').text()).toBe(
      'Filter guidance statements'
    )
    expect($('.audit-page-summary').text()).toContain('1 conflict found')
    expect($('.audit-page-summary a')).toHaveLength(0)
    expect($('.audit-page-summary .govuk-tag')).toHaveLength(0)

    expect($('form').attr('method')).toBe('get')
    expect($('form').attr('aria-labelledby')).toBe('guidance-filters-heading')
    expect($('fieldset')).toHaveLength(1)
    expect($('fieldset legend').text()).toContain('Overall guidance outcome')
    expect($('input[type="checkbox"][name="outcome"]')).toHaveLength(4)
    expect($('button[type="submit"]').text()).toContain('Apply filters')
    expect($('.audit-page-filters .govuk-tag')).toHaveLength(0)
    expect($('.audit-active-filters')).toHaveLength(0)

    const firstCheckboxId = $('input[type="checkbox"][name="outcome"]')
      .first()
      .attr('id')
    expect(firstCheckboxId).toBeTruthy()
    expect($(`label[for="${firstCheckboxId}"]`)).toHaveLength(1)
    expect($(`label[for="${firstCheckboxId}"]`).text()).toContain(
      'Conflict found'
    )
    expect($(`label[for="${firstCheckboxId}"]`).text()).toContain(
      '1 guidance statement'
    )
    expect($(`label[for="${firstCheckboxId}"] .govuk-tag`)).toHaveLength(0)
  })

  test('shows active filters and filtered empty state', () => {
    const $ = renderPageRegions({
      allRows,
      selectedOutcomes: [
        AGGREGATE_OUTCOME.CONFLICT_FOUND,
        AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT
      ],
      guidanceRows: []
    })

    expect($('.visible-count').text()).toBe(
      'Showing 0 of 4 guidance statements'
    )
    expect($('.audit-active-filters')).toHaveLength(1)
    expect($('.audit-active-filters').text()).toContain('Conflict found')
    expect(
      $('.audit-active-filters .govuk-visually-hidden').first().text()
    ).toBe('Remove filter: Conflict found')
    expect($('.audit-active-filters a[href]').length).toBeGreaterThan(0)
    expect($('.filtered-empty').text()).toContain(
      'No guidance statements match these filters'
    )
    expect($('.clear-empty').attr('href')).toBe(
      '/audit/subjects/slurry/pages/cid-a'
    )
    expect($('.no-data')).toHaveLength(0)
    expect($('input[value="conflict_found"]').attr('checked')).toBeDefined()
  })

  test('shows no-data empty state when the page has no guidance', () => {
    const $ = renderPageRegions({ allRows: [], guidanceRows: [] })
    expect($('.no-data')).toHaveLength(1)
    expect($('.filtered-empty')).toHaveLength(0)
    expect($('.audit-active-filters')).toHaveLength(0)
  })
})
