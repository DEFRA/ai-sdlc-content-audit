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
  pages_reading_age: []
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
})
