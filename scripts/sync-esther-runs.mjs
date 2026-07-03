#!/usr/bin/env node
/**
 * Copy Esther run envelopes from content-audit-data-assets into this app.
 *
 * Usage:
 *   npm run sync:esther-runs
 *   ESTHER_DATA_ASSETS=/path/to/content-audit-data-assets npm run sync:esther-runs
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dataAssetsRoot = resolve(
  process.env.ESTHER_DATA_ASSETS ??
    join(appRoot, '../content-audit-data-assets')
)
const sourceRunsDir = join(dataAssetsRoot, 'steps/esther/runs')
const targetRunsDir = join(appRoot, 'src/server/services/audit/runs')

if (!existsSync(sourceRunsDir)) {
  console.error(`Esther runs not found: ${sourceRunsDir}`)
  console.error('Set ESTHER_DATA_ASSETS to your content-audit-data-assets checkout.')
  process.exit(1)
}

mkdirSync(targetRunsDir, { recursive: true })

const runIds = readdirSync(sourceRunsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

if (runIds.length === 0) {
  console.error(`No runs under ${sourceRunsDir}`)
  process.exit(1)
}

for (const runId of runIds) {
  const sourceRunDir = join(sourceRunsDir, runId)
  const targetRunDir = join(targetRunsDir, runId)
  rmSync(targetRunDir, { recursive: true, force: true })
  mkdirSync(targetRunDir, { recursive: true })

  for (const filename of ['output.json', 'MODEL.md']) {
    const sourcePath = join(sourceRunDir, filename)
    if (existsSync(sourcePath)) {
      cpSync(sourcePath, join(targetRunDir, filename))
    }
  }

  console.log(`Synced ${runId}`)
}

console.log(`Done — ${runIds.length} run(s) in ${targetRunsDir}`)
