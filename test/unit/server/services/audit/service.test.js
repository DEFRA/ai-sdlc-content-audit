import { describe, expect, test } from 'vitest'

import { createAuditService } from '../../../../../src/server/services/audit/create-audit-service.js'

const SHARED_LEX_ID = 'lex-shared'
const DISTINCT_LEX_A = 'lex-a'
const DISTINCT_LEX_B = 'lex-b'

function emptyPresentation(overrides = {}) {
  return {
    categories: [],
    legislation: [],
    legislation_propositions: [],
    pages: [],
    guidance_propositions: [],
    proposition_matches: [],
    page_analytics: [],
    subject_summary: [],
    page_relevance: [],
    pages_reading_age: [],
    ...overrides
  }
}

function collidingCategoriesPresentation() {
  return emptyPresentation({
    categories: [
      { id: 'slurry', title: 'Slurry' },
      { id: 'ssafo-nitrates', title: 'Ssafo nitrates' }
    ],
    legislation: [
      {
        source_record_id: SHARED_LEX_ID,
        category: 'slurry',
        name: 'Shared Law',
        url: 'https://example.test/shared'
      },
      {
        source_record_id: SHARED_LEX_ID,
        category: 'ssafo-nitrates',
        name: 'Shared Law',
        url: 'https://example.test/shared'
      }
    ],
    legislation_propositions: [
      {
        id: 'prop:slurry-1',
        category: 'slurry',
        source_record_id: SHARED_LEX_ID,
        proposition_text: 'Slurry rule one'
      },
      {
        id: 'prop:slurry-2',
        category: 'slurry',
        source_record_id: SHARED_LEX_ID,
        proposition_text: 'Slurry rule two'
      },
      {
        id: 'prop:ssafo-1',
        category: 'ssafo-nitrates',
        source_record_id: SHARED_LEX_ID,
        proposition_text: 'Ssafo rule one'
      }
    ],
    proposition_matches: [
      {
        id: 'm-slurry-missing',
        category: 'slurry',
        guidance_proposition_id: null,
        law_proposition_id: 'prop:slurry-1',
        relationship: 'GUIDANCE_MISSING'
      },
      {
        id: 'm-ssafo-missing',
        category: 'ssafo-nitrates',
        guidance_proposition_id: null,
        law_proposition_id: 'prop:ssafo-1',
        relationship: 'GUIDANCE_MISSING'
      }
    ],
    subject_summary: [
      {
        category: 'slurry',
        laws_found: 1,
        total_pages_audited: 10,
        pages_relevant: 0,
        proposition_status_counts: {}
      },
      {
        category: 'ssafo-nitrates',
        laws_found: 1,
        total_pages_audited: 3,
        pages_relevant: 0,
        proposition_status_counts: {}
      }
    ]
  })
}

function distinctCategoriesPresentation() {
  return emptyPresentation({
    categories: [
      { id: 'slurry', title: 'Slurry' },
      { id: 'fish', title: 'Fish' }
    ],
    legislation: [
      {
        source_record_id: DISTINCT_LEX_A,
        category: 'slurry',
        name: 'Slurry Law',
        url: 'https://example.test/slurry'
      },
      {
        source_record_id: DISTINCT_LEX_B,
        category: 'fish',
        name: 'Fish Law',
        url: 'https://example.test/fish'
      }
    ],
    legislation_propositions: [
      {
        id: 'prop:a',
        category: 'slurry',
        source_record_id: DISTINCT_LEX_A,
        proposition_text: 'Slurry only'
      },
      {
        id: 'prop:b1',
        category: 'fish',
        source_record_id: DISTINCT_LEX_B,
        proposition_text: 'Fish one'
      },
      {
        id: 'prop:b2',
        category: 'fish',
        source_record_id: DISTINCT_LEX_B,
        proposition_text: 'Fish two'
      }
    ],
    proposition_matches: [],
    subject_summary: [
      {
        category: 'slurry',
        laws_found: 1,
        total_pages_audited: 1,
        pages_relevant: 0,
        proposition_status_counts: {}
      },
      {
        category: 'fish',
        laws_found: 1,
        total_pages_audited: 1,
        pages_relevant: 0,
        proposition_status_counts: {}
      }
    ]
  })
}

describe('createAuditService', () => {
  test("does not count another category's law propositions on the laws list when source_record_ids collide", () => {
    const service = createAuditService(collidingCategoriesPresentation())

    const slurryLaws = service.getLawsForSubject('slurry')
    const ssafoLaws = service.getLawsForSubject('ssafo-nitrates')

    expect(slurryLaws).toEqual([
      expect.objectContaining({
        id: SHARED_LEX_ID,
        propositionCount: 2
      })
    ])
    expect(ssafoLaws).toEqual([
      expect.objectContaining({
        id: SHARED_LEX_ID,
        propositionCount: 1
      })
    ])
  })

  test('scopes guidance-missing law counts to the requested category when source_record_ids collide', () => {
    const service = createAuditService(collidingCategoriesPresentation())

    const slurryOverview = service.getSubjectOverview('slurry')
    const ssafoOverview = service.getSubjectOverview('ssafo-nitrates')

    expect(slurryOverview.lawsMissingGuidance).toBe(1)
    expect(ssafoOverview.lawsMissingGuidance).toBe(1)
  })

  test('still returns the correct laws list when categories use distinct source_record_ids', () => {
    const service = createAuditService(distinctCategoriesPresentation())

    const slurryLaws = service.getLawsForSubject('slurry')
    const fishLaws = service.getLawsForSubject('fish')

    expect(slurryLaws).toEqual([
      expect.objectContaining({
        id: DISTINCT_LEX_A,
        propositionCount: 1
      })
    ])
    expect(fishLaws).toEqual([
      expect.objectContaining({
        id: DISTINCT_LEX_B,
        propositionCount: 2
      })
    ])
  })
})
