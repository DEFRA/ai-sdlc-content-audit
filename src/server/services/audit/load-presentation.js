import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const PRESENTATION_KEYS = [
  'categories',
  'legislation',
  'legislation_propositions',
  'pages',
  'guidance_propositions',
  'proposition_matches',
  'page_analytics',
  'subject_summary',
  'page_relevance',
  'pages_reading_age'
]

const FLAT_FILES = {
  categories: 'categories.json',
  legislation: 'legislation.json',
  legislation_propositions: 'legislation-propositions.json',
  pages: 'pages.json',
  guidance_propositions: 'guidance-propositions.json',
  proposition_matches: 'proposition-matches.json',
  page_analytics: 'page-analytics.json',
  subject_summary: 'subject-summary.json',
  page_relevance: 'page-relevance.json',
  pages_reading_age: 'pages-reading-age.json'
}

function emptyPresentation() {
  return Object.fromEntries(PRESENTATION_KEYS.map((key) => [key, []]))
}

function mergePresentation(target, source) {
  for (const key of PRESENTATION_KEYS) {
    const rows = source[key]
    if (rows == null) {
      throw new Error(`Presentation bundle missing key: ${key}`)
    }
    target[key].push(...rows)
  }
}

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function listRunIds(runsDir) {
  if (!existsSync(runsDir)) return []

  return readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((runId) => {
      const outputPath = join(runsDir, runId, 'output.json')
      return existsSync(outputPath) && statSync(outputPath).isFile()
    })
    .sort()
}

function stampCategory(rows, category) {
  return rows.map((row) => (row.category != null ? row : { ...row, category }))
}

function loadRunEnvelope(outputPath) {
  const envelope = loadJson(outputPath)
  if (envelope.presentation == null) {
    throw new Error(`Esther run at ${outputPath} is missing presentation`)
  }

  const presentation = { ...envelope.presentation }

  if (envelope.category != null) {
    presentation.guidance_propositions = stampCategory(
      presentation.guidance_propositions ?? [],
      envelope.category
    )
  }

  return presentation
}

export function loadPresentationFromRuns(runsDir) {
  const merged = emptyPresentation()
  const runIds = listRunIds(runsDir)

  for (const runId of runIds) {
    const presentation = loadRunEnvelope(join(runsDir, runId, 'output.json'))
    mergePresentation(merged, presentation)
  }

  return { merged, runIds }
}

export function loadPresentationFromFlatDir(dataDir) {
  const merged = emptyPresentation()

  for (const key of PRESENTATION_KEYS) {
    merged[key] = loadJson(join(dataDir, FLAT_FILES[key]))
  }

  return { merged, runIds: [] }
}

export function loadAuditPresentation({ runsDir, dataDir }) {
  const runIds = listRunIds(runsDir)
  if (runIds.length > 0) {
    return loadPresentationFromRuns(runsDir)
  }
  return loadPresentationFromFlatDir(dataDir)
}
