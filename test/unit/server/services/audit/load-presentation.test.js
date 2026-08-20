import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, test } from 'vitest'

import {
  loadAuditPresentation,
  loadPresentationFromFlatDir,
  loadPresentationFromRuns
} from '../../../../../src/server/services/audit/load-presentation.js'

const emptyPresentationKeys = {
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
  guidance_proposition_match_summaries: [],
  guidance_proposition_law_comparisons: []
}

describe('load-presentation', () => {
  test('merges presentation arrays from multiple Esther run envelopes', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'esther-runs-'))

    try {
      const writeRun = (runId, category) => {
        const runDir = join(runsDir, runId)
        mkdirSync(runDir, { recursive: true })
        writeFileSync(
          join(runDir, 'output.json'),
          JSON.stringify({
            schema_version: '1',
            run_id: runId,
            category,
            provenance: {},
            presentation: {
              categories: [{ id: category, title: category }],
              legislation: [{ source_record_id: `lex-${category}`, category }],
              legislation_propositions: [],
              pages: [
                { content_id: `page-${category}`, url: 'https://example.test' }
              ],
              guidance_propositions: [],
              proposition_matches: [],
              page_analytics: [],
              subject_summary: [{ category, laws_found: 1 }],
              page_relevance: [{ category, content_id: `page-${category}` }],
              pages_reading_age: []
            }
          })
        )
      }

      writeRun('meadow-verdict', 'slurry')
      writeRun('harbour-perch', 'fish')

      const { merged, runIds } = loadPresentationFromRuns(runsDir)

      expect(runIds).toEqual(['harbour-perch', 'meadow-verdict'])
      expect(merged.categories.map((row) => row.id)).toEqual(['fish', 'slurry'])
      expect(merged.legislation).toHaveLength(2)
      expect(merged.pages).toHaveLength(2)
    } finally {
      rmSync(runsDir, { recursive: true, force: true })
    }
  })

  test('prefers runs over the legacy flat data directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'esther-load-'))

    try {
      const runsDir = join(root, 'runs')
      const dataDir = join(root, 'data')
      mkdirSync(join(runsDir, 'only-run'), { recursive: true })
      mkdirSync(dataDir, { recursive: true })

      writeFileSync(
        join(runsDir, 'only-run/output.json'),
        JSON.stringify({
          presentation: {
            categories: [{ id: 'from-run' }],
            legislation: [],
            legislation_propositions: [],
            pages: [],
            guidance_propositions: [],
            proposition_matches: [],
            page_analytics: [],
            subject_summary: [],
            page_relevance: [],
            pages_reading_age: []
          }
        })
      )

      writeFileSync(
        join(dataDir, 'categories.json'),
        JSON.stringify([{ id: 'from-flat' }])
      )
      for (const file of [
        'legislation.json',
        'legislation-propositions.json',
        'pages.json',
        'guidance-propositions.json',
        'proposition-matches.json',
        'page-analytics.json',
        'subject-summary.json',
        'page-relevance.json',
        'pages-reading-age.json'
      ]) {
        writeFileSync(join(dataDir, file), '[]')
      }

      const { merged, runIds } = loadAuditPresentation({ runsDir, dataDir })

      expect(runIds).toEqual(['only-run'])
      expect(merged.categories).toEqual([{ id: 'from-run' }])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('stamps category onto legislation propositions and matches from the envelope', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'esther-stamp-'))

    try {
      const runDir = join(runsDir, 'ssafo-nitrates')
      mkdirSync(runDir, { recursive: true })
      writeFileSync(
        join(runDir, 'output.json'),
        JSON.stringify({
          schema_version: '1',
          run_id: 'ssafo-nitrates',
          category: 'ssafo-nitrates',
          presentation: {
            ...emptyPresentationKeys,
            categories: [{ id: 'ssafo-nitrates', title: 'Nitrates' }],
            legislation: [
              { source_record_id: 'lex-shared', name: 'Shared Law' }
            ],
            legislation_propositions: [
              { id: 'prop:1', source_record_id: 'lex-shared' }
            ],
            proposition_matches: [
              {
                id: 'm-1',
                guidance_proposition_id: null,
                law_proposition_id: 'prop:1',
                relationship: 'GUIDANCE_MISSING'
              }
            ],
            subject_summary: [{ laws_found: 1 }],
            page_relevance: [{ content_id: 'page-1' }],
            pages: [{ content_id: 'page-1', url: 'https://example.test' }]
          }
        })
      )

      const { merged } = loadPresentationFromRuns(runsDir)

      expect(merged.legislation_propositions[0].category).toBe('ssafo-nitrates')
      expect(merged.proposition_matches[0].category).toBe('ssafo-nitrates')
      expect(merged.legislation[0].category).toBe('ssafo-nitrates')
      expect(merged.pages[0].category).toBe('ssafo-nitrates')
      expect(merged.page_relevance[0].category).toBe('ssafo-nitrates')
      expect(merged.subject_summary[0].category).toBe('ssafo-nitrates')
    } finally {
      rmSync(runsDir, { recursive: true, force: true })
    }
  })

  test('derives category for flat-dir law propositions from legislation rows', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'esther-flat-'))

    try {
      const write = (name, data) =>
        writeFileSync(join(dataDir, name), JSON.stringify(data))

      write('categories.json', [{ id: 'slurry', title: 'Slurry' }])
      write('legislation.json', [
        { source_record_id: 'lex-1', category: 'slurry', name: 'Law A' }
      ])
      write('legislation-propositions.json', [
        { id: 'prop:1', source_record_id: 'lex-1' }
      ])
      write('proposition-matches.json', [
        {
          id: 'm-1',
          guidance_proposition_id: null,
          law_proposition_id: 'prop:1',
          relationship: 'GUIDANCE_MISSING'
        }
      ])
      write('pages.json', [])
      write('guidance-propositions.json', [])
      write('page-analytics.json', [])
      write('subject-summary.json', [])
      write('page-relevance.json', [])
      write('pages-reading-age.json', [])

      const { merged } = loadPresentationFromFlatDir(dataDir)

      expect(merged.legislation_propositions[0].category).toBe('slurry')
      expect(merged.proposition_matches[0].category).toBe('slurry')
    } finally {
      rmSync(dataDir, { recursive: true, force: true })
    }
  })

  test('derives category for flat-dir NO_MATCH rows via guidance → page', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'esther-flat-nomatch-'))

    try {
      const write = (name, data) =>
        writeFileSync(join(dataDir, name), JSON.stringify(data))

      write('categories.json', [{ id: 'slurry', title: 'Slurry' }])
      write('legislation.json', [])
      write('legislation-propositions.json', [])
      write('pages.json', [
        {
          content_id: 'cid-a',
          category: 'slurry',
          url: 'https://www.gov.uk/a',
          title: 'Page A'
        }
      ])
      write('guidance-propositions.json', [
        {
          id: 'susan-1',
          content_id: 'cid-a',
          proposition_text: 'Do X.'
        }
      ])
      write('proposition-matches.json', [
        {
          id: 'm-nomatch',
          guidance_proposition_id: 'susan-1',
          law_proposition_id: null,
          relationship: 'NO_MATCH'
        }
      ])
      write('page-analytics.json', [])
      write('subject-summary.json', [])
      write('page-relevance.json', [])
      write('pages-reading-age.json', [])

      const { merged } = loadPresentationFromFlatDir(dataDir)

      expect(merged.proposition_matches[0].category).toBe('slurry')
    } finally {
      rmSync(dataDir, { recursive: true, force: true })
    }
  })

  test('loads optional guidance-comparison files when present and defaults when absent', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'esther-flat-gc-'))

    try {
      const write = (name, data) =>
        writeFileSync(join(dataDir, name), JSON.stringify(data))

      write('categories.json', [{ id: 'slurry', title: 'Slurry' }])
      write('legislation.json', [
        { source_record_id: 'lex-1', category: 'slurry', name: 'Law A' }
      ])
      write('legislation-propositions.json', [
        { id: 'prop:1', source_record_id: 'lex-1' }
      ])
      write('pages.json', [
        {
          content_id: 'cid-a',
          category: 'slurry',
          url: 'https://www.gov.uk/a',
          title: 'Page A'
        }
      ])
      write('guidance-propositions.json', [
        { id: 'susan-1', content_id: 'cid-a', proposition_text: 'Do X.' }
      ])
      write('proposition-matches.json', [])
      write('page-analytics.json', [])
      write('subject-summary.json', [])
      write('page-relevance.json', [])
      write('pages-reading-age.json', [])

      const withoutOptional = loadPresentationFromFlatDir(dataDir)
      expect(
        withoutOptional.merged.guidance_proposition_match_summaries
      ).toEqual([])
      expect(
        withoutOptional.merged.guidance_proposition_law_comparisons
      ).toEqual([])

      write('guidance-proposition-match-summaries.json', [
        {
          guidance_proposition_id: 'susan-1',
          assessment_status: 'COMPLETE',
          coverage_result: 'NO_CANDIDATES_FOUND',
          candidate_count: 0,
          reportable_comparison_count: 0,
          ungrounded_candidate_count: 0
        }
      ])
      write('guidance-proposition-law-comparisons.json', [])

      const withOptional = loadPresentationFromFlatDir(dataDir)
      expect(
        withOptional.merged.guidance_proposition_match_summaries
      ).toHaveLength(1)
      expect(
        withOptional.merged.guidance_proposition_match_summaries[0].category
      ).toBe('slurry')
    } finally {
      rmSync(dataDir, { recursive: true, force: true })
    }
  })

  test('allows Esther envelopes to omit optional guidance-comparison keys', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'esther-runs-optional-'))

    try {
      const runDir = join(runsDir, 'legacy-run')
      mkdirSync(runDir, { recursive: true })
      writeFileSync(
        join(runDir, 'output.json'),
        JSON.stringify({
          category: 'slurry',
          presentation: {
            categories: [{ id: 'slurry' }],
            legislation: [],
            legislation_propositions: [],
            pages: [],
            guidance_propositions: [],
            proposition_matches: [],
            page_analytics: [],
            subject_summary: [],
            page_relevance: [],
            pages_reading_age: []
          }
        })
      )

      const { merged } = loadPresentationFromRuns(runsDir)
      expect(merged.guidance_proposition_match_summaries).toEqual([])
      expect(merged.guidance_proposition_law_comparisons).toEqual([])
    } finally {
      rmSync(runsDir, { recursive: true, force: true })
    }
  })

  test('indexes pairs.csv from a run envelope by category', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'esther-pairs-run-'))

    try {
      const runDir = join(runsDir, 'ssafo-nitrates')
      mkdirSync(runDir, { recursive: true })
      writeFileSync(
        join(runDir, 'output.json'),
        JSON.stringify({
          category: 'ssafo-nitrates',
          presentation: {
            ...emptyPresentationKeys,
            categories: [{ id: 'ssafo-nitrates', title: 'Nitrates' }]
          }
        })
      )
      writeFileSync(join(runDir, 'pairs.csv'), 'category\nssafo-nitrates\n')

      const { pairsCsvByCategory } = loadPresentationFromRuns(runsDir)
      expect(pairsCsvByCategory).toEqual({
        'ssafo-nitrates': join(runDir, 'pairs.csv')
      })
    } finally {
      rmSync(runsDir, { recursive: true, force: true })
    }
  })

  test('indexes pairs.csv from a single-category flat dest', () => {
    const dataDir = mkdtempSync(join(tmpdir(), 'esther-pairs-flat-'))

    try {
      const write = (name, data) =>
        writeFileSync(join(dataDir, name), JSON.stringify(data))

      write('categories.json', [{ id: 'slurry', title: 'Slurry' }])
      write('legislation.json', [])
      write('legislation-propositions.json', [])
      write('pages.json', [])
      write('guidance-propositions.json', [])
      write('proposition-matches.json', [])
      write('page-analytics.json', [])
      write('subject-summary.json', [])
      write('page-relevance.json', [])
      write('pages-reading-age.json', [])
      writeFileSync(join(dataDir, 'pairs.csv'), 'category\nslurry\n')

      const { pairsCsvByCategory } = loadPresentationFromFlatDir(dataDir)
      expect(pairsCsvByCategory).toEqual({
        slurry: join(dataDir, 'pairs.csv')
      })
    } finally {
      rmSync(dataDir, { recursive: true, force: true })
    }
  })

  test('omits pairs.csv index when the file is absent', () => {
    const runsDir = mkdtempSync(join(tmpdir(), 'esther-pairs-missing-'))

    try {
      const runDir = join(runsDir, 'legacy-run')
      mkdirSync(runDir, { recursive: true })
      writeFileSync(
        join(runDir, 'output.json'),
        JSON.stringify({
          category: 'slurry',
          presentation: {
            ...emptyPresentationKeys,
            categories: [{ id: 'slurry' }]
          }
        })
      )

      const { pairsCsvByCategory } = loadPresentationFromRuns(runsDir)
      expect(pairsCsvByCategory).toEqual({})
    } finally {
      rmSync(runsDir, { recursive: true, force: true })
    }
  })
})
