/**
 * Small presentation fixture for guidance-comparison view-model tests.
 *
 * Covers: single GROUNDED, multi-hit, reportable+ungrounded (summary only),
 * ONLY_UNGROUNDED, NO_CANDIDATES, NOT_CHECKED, PARTIAL, FAILED,
 * synthetic law-side GUIDANCE_MISSING, and optional inconsistent overlays.
 */

const CATEGORY = 'slurry'

export function baseGuidanceComparisonPresentation(overrides = {}) {
  return {
    categories: [{ id: CATEGORY, title: 'Slurry' }],
    legislation: [
      {
        source_record_id: 'lex-1',
        category: CATEGORY,
        name: 'Act 1',
        url: 'https://leg/1'
      }
    ],
    legislation_propositions: [
      {
        id: 'prop:law1',
        category: CATEGORY,
        source_record_id: 'lex-1',
        proposition_text: 'Law one.'
      },
      {
        id: 'prop:law2',
        category: CATEGORY,
        source_record_id: 'lex-1',
        proposition_text: 'Law two.'
      },
      {
        id: 'prop:law3',
        category: CATEGORY,
        source_record_id: 'lex-1',
        proposition_text: 'Law three.'
      }
    ],
    pages: [
      {
        content_id: 'cid-a',
        category: CATEGORY,
        url: 'https://www.gov.uk/a',
        title: 'Page A'
      }
    ],
    guidance_propositions: [
      gp('g-grounded', 'Do grounded.'),
      gp('g-multi', 'Do multi.'),
      gp('g-mixed-summary', 'Do mixed.'),
      gp('g-ungrounded', 'Do ungrounded.'),
      gp('g-empty', 'Do empty.'),
      gp('g-unchecked', 'Do unchecked.'),
      gp('g-partial', 'Do partial.'),
      gp('g-failed', 'Do failed.')
    ],
    // Legacy compatibility file: top matches + synthetic law-side gap.
    // Must not be merged into guidance comparisons[].
    proposition_matches: [
      {
        id: 'm-top-grounded',
        category: CATEGORY,
        guidance_proposition_id: 'g-grounded',
        law_proposition_id: 'prop:law1',
        relationship: 'GROUNDED',
        confidence: 'high',
        cosine_score: 0.91,
        explanation: 'top grounded'
      },
      {
        id: 'm-top-multi',
        category: CATEGORY,
        guidance_proposition_id: 'g-multi',
        law_proposition_id: 'prop:law1',
        relationship: 'GROUNDED',
        confidence: 'high',
        cosine_score: 0.9,
        explanation: 'top of multi — must not duplicate'
      },
      {
        id: 'm-law-missing',
        category: CATEGORY,
        guidance_proposition_id: null,
        law_proposition_id: 'prop:law3',
        relationship: 'GUIDANCE_MISSING',
        confidence: null,
        cosine_score: null,
        explanation: null
      }
    ],
    guidance_proposition_match_summaries: [
      summary('g-grounded', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
        candidate_count: 1,
        reportable_comparison_count: 1,
        ungrounded_candidate_count: 0
      }),
      summary('g-multi', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
        candidate_count: 3,
        reportable_comparison_count: 3,
        ungrounded_candidate_count: 0
      }),
      summary('g-mixed-summary', 'COMPLETE', 'HAS_REPORTABLE_COMPARISON', {
        candidate_count: 2,
        reportable_comparison_count: 1,
        ungrounded_candidate_count: 1
      }),
      summary('g-ungrounded', 'COMPLETE', 'ONLY_UNGROUNDED_CANDIDATES', {
        candidate_count: 1,
        reportable_comparison_count: 0,
        ungrounded_candidate_count: 1
      }),
      summary('g-empty', 'COMPLETE', 'NO_CANDIDATES_FOUND', {
        candidate_count: 0,
        reportable_comparison_count: 0,
        ungrounded_candidate_count: 0
      }),
      summary('g-unchecked', 'NOT_CHECKED', null, {
        candidate_count: null,
        reportable_comparison_count: 0,
        ungrounded_candidate_count: 0
      }),
      summary('g-partial', 'PARTIAL', null, {
        candidate_count: 2,
        reportable_comparison_count: 0,
        ungrounded_candidate_count: 1,
        failure_reason: 'not_all_candidates_classified'
      }),
      summary('g-failed', 'FAILED', null, {
        candidate_count: 2,
        reportable_comparison_count: 0,
        ungrounded_candidate_count: 0,
        failure_reason: 'group_rerank_request_failed'
      })
    ],
    guidance_proposition_law_comparisons: [
      pair('m-g1-l1', 'g-grounded', 'prop:law1', 'GROUNDED', {
        cosine_score: 0.91,
        explanation: 'grounded pair'
      }),
      pair('m-gm-l1', 'g-multi', 'prop:law1', 'GROUNDED', {
        cosine_score: 0.9,
        explanation: 'multi-a'
      }),
      pair('m-gm-l2', 'g-multi', 'prop:law2', 'CONFLICTS', {
        cosine_score: 0.85,
        explanation: 'multi-b'
      }),
      pair('m-gm-l3', 'g-multi', 'prop:law3', 'GUIDANCE_INCOMPLETE', {
        cosine_score: 0.8,
        explanation: 'multi-c'
      }),
      pair('m-mixed-l1', 'g-mixed-summary', 'prop:law1', 'GUIDANCE_BROADER', {
        cosine_score: 0.88,
        explanation: 'broader'
      })
    ],
    page_analytics: [],
    subject_summary: [],
    page_relevance: [{ category: CATEGORY, content_id: 'cid-a' }],
    pages_reading_age: [],
    ...overrides
  }
}

function gp(id, text) {
  return {
    id,
    content_id: 'cid-a',
    category: CATEGORY,
    proposition_text: text,
    source_paragraphs: [],
    section_locator: ''
  }
}

function summary(gpId, assessmentStatus, coverageResult, counts = {}) {
  return {
    guidance_proposition_id: gpId,
    category: CATEGORY,
    assessment_status: assessmentStatus,
    coverage_result: coverageResult,
    ...counts
  }
}

function pair(id, gpId, lawId, relationship, extras = {}) {
  return {
    id,
    category: CATEGORY,
    guidance_proposition_id: gpId,
    law_proposition_id: lawId,
    relationship,
    confidence: 'high',
    bert_score_f1: null,
    ...extras
  }
}
