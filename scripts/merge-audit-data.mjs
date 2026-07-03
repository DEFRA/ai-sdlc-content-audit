#!/usr/bin/env node
/**
 * Merge audit JSON from an external data repo into src/server/services/audit/data/.
 *
 * Usage: node scripts/merge-audit-data.mjs [path-to-data-repo]
 *
 * Default path: ../ai-sdlc-content-audit-data
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appDataDir = join(scriptDir, '../src/server/services/audit/data')
const externalDataDir =
  process.argv[2] ??
  join(scriptDir, '../../ai-sdlc-content-audit-data/src/server/services/audit/data')

function load(dir, name) {
  return JSON.parse(readFileSync(join(dir, name), 'utf8'))
}

function save(name, data) {
  writeFileSync(join(appDataDir, name), `${JSON.stringify(data, null, 2)}\n`)
}

function dedupeByKey(rows, key) {
  const seen = new Map()
  for (const row of rows) {
    if (!seen.has(row[key])) seen.set(row[key], row)
  }
  return [...seen.values()]
}

function mergePages(slurryPages, fishPages) {
  return dedupeByKey(
    [...slurryPages, ...fishPages].map(({ category: _category, ...page }) => page),
    'content_id'
  )
}

function mergeGuidancePropositions(slurryRows, fishRows) {
  const slurryIds = new Set(slurryRows.map((row) => row.id))
  const collidingIds = new Set(
    fishRows.filter((row) => slurryIds.has(row.id)).map((row) => row.id)
  )

  function namespacedId(id, category) {
    return collidingIds.has(id) ? `${category}:${id}` : id
  }

  const merged = [
    ...slurryRows.map((row) => ({
      ...row,
      category: 'slurry',
      id: namespacedId(row.id, 'slurry')
    })),
    ...fishRows.map((row) => ({
      ...row,
      category: 'fish',
      id: namespacedId(row.id, 'fish')
    }))
  ]

  return { merged, collidingIds }
}

function mergePropositionMatches(slurryRows, fishRows, collidingIds) {
  function namespacedGuidanceId(id, category) {
    if (id == null) return id
    return collidingIds.has(id) ? `${category}:${id}` : id
  }

  return [
    ...slurryRows.map((row) => ({
      ...row,
      guidance_proposition_id: namespacedGuidanceId(
        row.guidance_proposition_id,
        'slurry'
      )
    })),
    ...fishRows.map((row) => ({
      ...row,
      guidance_proposition_id: namespacedGuidanceId(
        row.guidance_proposition_id,
        'fish'
      )
    }))
  ]
}

const slurryCategories = load(appDataDir, 'categories.json')
const fishCategories = load(externalDataDir, 'categories.json')

const slurryGuidance = load(appDataDir, 'guidance-propositions.json')
const fishGuidance = load(externalDataDir, 'guidance-propositions.json')
const { merged: guidancePropositions, collidingIds } = mergeGuidancePropositions(
  slurryGuidance,
  fishGuidance
)

save('categories.json', [...slurryCategories, ...fishCategories])
save('subject-summary.json', [
  ...load(appDataDir, 'subject-summary.json'),
  ...load(externalDataDir, 'subject-summary.json')
])
save('legislation.json', [
  ...load(appDataDir, 'legislation.json'),
  ...load(externalDataDir, 'legislation.json')
])
save('legislation-propositions.json', [
  ...load(appDataDir, 'legislation-propositions.json'),
  ...load(externalDataDir, 'legislation-propositions.json')
])
save('pages.json', mergePages(load(appDataDir, 'pages.json'), load(externalDataDir, 'pages.json')))
save('page-relevance.json', [
  ...load(appDataDir, 'page-relevance.json'),
  ...load(externalDataDir, 'page-relevance.json')
])
save('page-analytics.json', dedupeByKey(
  [...load(appDataDir, 'page-analytics.json'), ...load(externalDataDir, 'page-analytics.json')],
  'content_id'
))
save('pages-reading-age.json', dedupeByKey(
  [...load(appDataDir, 'pages-reading-age.json'), ...load(externalDataDir, 'pages-reading-age.json')],
  'content_id'
))
save('guidance-propositions.json', guidancePropositions)
save(
  'proposition-matches.json',
  mergePropositionMatches(
    load(appDataDir, 'proposition-matches.json'),
    load(externalDataDir, 'proposition-matches.json'),
    collidingIds
  )
)

console.log(`Merged data from ${externalDataDir}`)
console.log(`Categories: ${slurryCategories.length + fishCategories.length}`)
console.log(`Guidance proposition id collisions namespaced: ${collidingIds.size}`)
