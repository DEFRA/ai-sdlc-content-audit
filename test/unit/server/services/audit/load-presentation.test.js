import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import { describe, expect, test } from 'vitest'

import {
  loadAuditPresentation,
  loadPresentationFromRuns
} from '../../../../../src/server/services/audit/load-presentation.js'

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
      writeRun('net-herring', 'fish')

      const { merged, runIds } = loadPresentationFromRuns(runsDir)

      expect(runIds).toEqual(['meadow-verdict', 'net-herring'])
      expect(merged.categories.map((row) => row.id)).toEqual(['slurry', 'fish'])
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
})
