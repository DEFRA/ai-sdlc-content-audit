import { describe, expect, test } from 'vitest'

import {
  AGGREGATE_OUTCOME,
  AGGREGATE_OUTCOME_META,
  aggregateGuidanceOutcome,
  lineItemOutcomeBucket,
  presentAggregateOutcome
} from '../../../../../src/server/services/audit/aggregate-guidance-outcome.js'

/** Pair-level relationship enums used as assessed line-item outcomes. */
const RED = 'CONFLICTS'
const GREEN = 'GROUNDED'
const YELLOW = 'GUIDANCE_INCOMPLETE'
const UNASSESSED = null

describe('aggregateGuidanceOutcome', () => {
  test.each([
    {
      name: 'red only → conflict_found',
      outcomes: [RED],
      expected: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount: 0
    },
    {
      name: 'red + green → conflict_found',
      outcomes: [RED, GREEN],
      expected: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount: 0
    },
    {
      name: 'red + yellow → conflict_found',
      outcomes: [RED, YELLOW],
      expected: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount: 0
    },
    {
      name: 'red + green + yellow → conflict_found',
      outcomes: [RED, GREEN, YELLOW],
      expected: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount: 0
    },
    {
      name: 'green only → supporting_law_found',
      outcomes: [GREEN],
      expected: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      unassessedCount: 0
    },
    {
      name: 'green + yellow → supporting_law_found (green overrides yellow)',
      outcomes: [GREEN, YELLOW],
      expected: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      unassessedCount: 0
    },
    {
      name: 'yellow only → no_confirmed_support',
      outcomes: [YELLOW],
      expected: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      unassessedCount: 0
    },
    {
      name: 'yellow + yellow → no_confirmed_support',
      outcomes: [YELLOW, YELLOW],
      expected: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      unassessedCount: 0
    },
    {
      name: 'empty → not_assessed',
      outcomes: [],
      expected: AGGREGATE_OUTCOME.NOT_ASSESSED,
      unassessedCount: 0
    },
    {
      name: 'unassessed only → not_assessed',
      outcomes: [UNASSESSED],
      expected: AGGREGATE_OUTCOME.NOT_ASSESSED,
      unassessedCount: 1
    },
    {
      name: 'green + unassessed → supporting_law_found',
      outcomes: [GREEN, UNASSESSED],
      expected: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      unassessedCount: 1
    },
    {
      name: 'yellow + unassessed → no_confirmed_support',
      outcomes: [YELLOW, UNASSESSED],
      expected: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      unassessedCount: 1
    },
    {
      name: 'red + unassessed → conflict_found',
      outcomes: [RED, UNASSESSED],
      expected: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      unassessedCount: 1
    },
    {
      name: 'GUIDANCE_BROADER alone is assessed yellow-bucket → no_confirmed_support',
      outcomes: ['GUIDANCE_BROADER'],
      expected: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      unassessedCount: 0
    },
    {
      name: 'unknown relationship is unassessed, not yellow',
      outcomes: ['NOT_A_RELATIONSHIP'],
      expected: AGGREGATE_OUTCOME.NOT_ASSESSED,
      unassessedCount: 1
    }
  ])('$name', ({ outcomes, expected, unassessedCount }) => {
    expect(aggregateGuidanceOutcome(outcomes)).toEqual({
      outcome: expected,
      unassessedCount
    })
  })
})

describe('lineItemOutcomeBucket', () => {
  test('maps pair relationships to traffic-light buckets', () => {
    expect(lineItemOutcomeBucket('CONFLICTS')).toBe('red')
    expect(lineItemOutcomeBucket('GROUNDED')).toBe('green')
    expect(lineItemOutcomeBucket('GUIDANCE_INCOMPLETE')).toBe('yellow')
    expect(lineItemOutcomeBucket('GUIDANCE_BROADER')).toBe('yellow')
    expect(lineItemOutcomeBucket(null)).toBeNull()
    expect(lineItemOutcomeBucket(undefined)).toBeNull()
    expect(lineItemOutcomeBucket('UNGROUNDED')).toBeNull()
  })
})

describe('presentAggregateOutcome', () => {
  test.each([
    {
      outcome: AGGREGATE_OUTCOME.CONFLICT_FOUND,
      label: 'Conflict found',
      tone: 'red'
    },
    {
      outcome: AGGREGATE_OUTCOME.SUPPORTING_LAW_FOUND,
      label: 'Supporting law found',
      tone: 'green'
    },
    {
      outcome: AGGREGATE_OUTCOME.NO_CONFIRMED_SUPPORT,
      label: 'No confirmed support found',
      tone: 'yellow'
    },
    {
      outcome: AGGREGATE_OUTCOME.NOT_ASSESSED,
      label: 'Not assessed',
      tone: 'grey'
    }
  ])(
    'maps $outcome to label "$label" and GOV.UK tone "$tone"',
    ({ outcome, label, tone }) => {
      expect(presentAggregateOutcome(outcome)).toEqual({
        status: outcome,
        label,
        tone,
        severity: AGGREGATE_OUTCOME_META[outcome].severity
      })
    }
  )
})
