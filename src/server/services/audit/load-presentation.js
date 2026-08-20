import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Required presentation arrays (always present in Esther / flat data).
 * Optional keys are listed separately — older runs omit the guidance-comparison
 * files until Audit Assembler is re-run.
 */
export const REQUIRED_PRESENTATION_KEYS = [
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

/** New guidance-comparison contract (optional until all runs are rebuilt). */
export const OPTIONAL_PRESENTATION_KEYS = [
  'guidance_proposition_match_summaries',
  'guidance_proposition_law_comparisons'
]

export const PRESENTATION_KEYS = [
  ...REQUIRED_PRESENTATION_KEYS,
  ...OPTIONAL_PRESENTATION_KEYS
]

const OPTIONAL_PRESENTATION_KEY_SET = new Set(OPTIONAL_PRESENTATION_KEYS)

export const PAIRS_CSV_FILENAME = 'pairs.csv'

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
  pages_reading_age: 'pages-reading-age.json',
  guidance_proposition_match_summaries:
    'guidance-proposition-match-summaries.json',
  guidance_proposition_law_comparisons:
    'guidance-proposition-law-comparisons.json'
}

const ENVELOPE_STAMP_KEYS = [
  'legislation',
  'legislation_propositions',
  'pages',
  'guidance_propositions',
  'proposition_matches',
  'page_relevance',
  'subject_summary',
  'guidance_proposition_match_summaries',
  'guidance_proposition_law_comparisons'
]

function emptyPresentation() {
  return Object.fromEntries(PRESENTATION_KEYS.map((key) => [key, []]))
}

function mergePresentation(target, source) {
  for (const key of PRESENTATION_KEYS) {
    const rows = source[key]
    if (rows == null) {
      if (OPTIONAL_PRESENTATION_KEY_SET.has(key)) {
        continue
      }
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

export function stampCategory(rows, category) {
  return rows.map((row) => (row.category != null ? row : { ...row, category }))
}

function stampEnvelopeCategory(presentation, category) {
  for (const key of ENVELOPE_STAMP_KEYS) {
    presentation[key] = stampCategory(presentation[key] ?? [], category)
  }
}

function stampRowsViaGuidanceProposition(
  rows,
  contentIdByGuidanceId,
  categoryByContentId
) {
  return rows.map((row) => {
    if (row.category != null) return row
    if (row.guidance_proposition_id == null) return row
    const contentId = contentIdByGuidanceId.get(row.guidance_proposition_id)
    const category =
      contentId != null ? categoryByContentId.get(contentId) : undefined
    return category != null ? { ...row, category } : row
  })
}

function deriveFlatDirCategories(presentation) {
  const categoryBySourceRecordId = new Map()
  for (const law of presentation.legislation) {
    if (law.category != null && law.source_record_id != null) {
      categoryBySourceRecordId.set(law.source_record_id, law.category)
    }
  }

  presentation.legislation_propositions =
    presentation.legislation_propositions.map((row) => {
      if (row.category != null) return row
      const category = categoryBySourceRecordId.get(row.source_record_id)
      return category != null ? { ...row, category } : row
    })

  const categoryByLawPropositionId = new Map()
  for (const prop of presentation.legislation_propositions) {
    if (prop.category != null) {
      categoryByLawPropositionId.set(prop.id, prop.category)
    }
  }

  const contentIdByGuidanceId = new Map()
  for (const gp of presentation.guidance_propositions) {
    if (gp.id != null && gp.content_id != null) {
      contentIdByGuidanceId.set(gp.id, gp.content_id)
    }
  }

  const categoryByContentId = new Map()
  for (const page of presentation.pages) {
    if (page.content_id != null && page.category != null) {
      categoryByContentId.set(page.content_id, page.category)
    }
  }

  presentation.proposition_matches = presentation.proposition_matches.map(
    (row) => {
      if (row.category != null) return row
      if (row.law_proposition_id != null) {
        const category = categoryByLawPropositionId.get(row.law_proposition_id)
        return category != null ? { ...row, category } : row
      }
      if (row.guidance_proposition_id != null) {
        const contentId = contentIdByGuidanceId.get(row.guidance_proposition_id)
        const category =
          contentId != null ? categoryByContentId.get(contentId) : undefined
        return category != null ? { ...row, category } : row
      }
      return row
    }
  )

  presentation.guidance_proposition_match_summaries =
    stampRowsViaGuidanceProposition(
      presentation.guidance_proposition_match_summaries,
      contentIdByGuidanceId,
      categoryByContentId
    )

  presentation.guidance_proposition_law_comparisons =
    stampRowsViaGuidanceProposition(
      presentation.guidance_proposition_law_comparisons,
      contentIdByGuidanceId,
      categoryByContentId
    )
}

function loadRunEnvelope(outputPath) {
  const envelope = loadJson(outputPath)
  if (envelope.presentation == null) {
    throw new Error(`Esther run at ${outputPath} is missing presentation`)
  }

  const presentation = { ...envelope.presentation }

  if (envelope.category != null) {
    stampEnvelopeCategory(presentation, envelope.category)
  }

  const category =
    typeof envelope.category === 'string' && envelope.category
      ? envelope.category
      : null

  return { presentation, category }
}

function isPairsCsvFile(csvPath) {
  return existsSync(csvPath) && statSync(csvPath).isFile()
}

function indexPairsCsvForRun(runsDir, runId, category, pairsCsvByCategory) {
  const csvPath = join(runsDir, runId, PAIRS_CSV_FILENAME)
  if (!isPairsCsvFile(csvPath) || category == null) return
  if (pairsCsvByCategory[category] == null) {
    pairsCsvByCategory[category] = csvPath
  }
}

function loadPairsCsvByCategoryFromFlatDir(dataDir) {
  const csvPath = join(dataDir, PAIRS_CSV_FILENAME)
  if (!isPairsCsvFile(csvPath)) return {}

  const categoriesPath = join(dataDir, FLAT_FILES.categories)
  if (!existsSync(categoriesPath)) return {}
  const categories = loadJson(categoriesPath)
  if (!Array.isArray(categories) || categories.length !== 1) return {}
  const categoryId = categories[0]?.id
  if (typeof categoryId !== 'string' || !categoryId) return {}
  return { [categoryId]: csvPath }
}

export function loadPresentationFromRuns(runsDir) {
  const merged = emptyPresentation()
  const runIds = listRunIds(runsDir)
  const pairsCsvByCategory = {}

  for (const runId of runIds) {
    const { presentation, category } = loadRunEnvelope(
      join(runsDir, runId, 'output.json')
    )
    mergePresentation(merged, presentation)
    indexPairsCsvForRun(runsDir, runId, category, pairsCsvByCategory)
  }

  return { merged, runIds, pairsCsvByCategory }
}

export function loadPresentationFromFlatDir(dataDir) {
  const merged = emptyPresentation()

  for (const key of PRESENTATION_KEYS) {
    const filePath = join(dataDir, FLAT_FILES[key])
    if (!existsSync(filePath)) {
      if (OPTIONAL_PRESENTATION_KEY_SET.has(key)) {
        merged[key] = []
        continue
      }
      throw new Error(`Missing presentation file: ${filePath}`)
    }
    merged[key] = loadJson(filePath)
  }

  deriveFlatDirCategories(merged)

  return {
    merged,
    runIds: [],
    pairsCsvByCategory: loadPairsCsvByCategoryFromFlatDir(dataDir)
  }
}

export function loadAuditPresentation({ runsDir, dataDir }) {
  const runIds = listRunIds(runsDir)
  if (runIds.length > 0) {
    return loadPresentationFromRuns(runsDir)
  }
  return loadPresentationFromFlatDir(dataDir)
}
