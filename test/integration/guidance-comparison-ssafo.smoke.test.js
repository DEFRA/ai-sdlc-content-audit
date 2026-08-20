/**
 * Integration smoke against the rebuilt ssafo-nitrates run envelope.
 * Exercises overview → pages-list → page-detail HTML routes.
 */

import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterAll, beforeAll, describe, expect, test } from 'vitest'

import { createServer } from '../../src/server/server.js'

const auditDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../src/server/services/audit'
)

describe('ssafo-nitrates guidance comparison smoke', () => {
  let server
  let pageId

  beforeAll(async () => {
    const envelope = JSON.parse(
      readFileSync(join(auditDir, 'runs/ssafo-nitrates/output.json'), 'utf8')
    )
    expect(
      envelope.presentation.guidance_proposition_match_summaries?.length
    ).toBeGreaterThan(0)
    expect(
      envelope.presentation.guidance_proposition_law_comparisons?.length
    ).toBeGreaterThan(0)
    pageId = envelope.presentation.pages[0].content_id

    server = await createServer()
    await server.initialize()
  }, 60_000)

  afterAll(async () => {
    if (server) await server.stop({ timeout: 0 })
  })

  test('propositions overview renders new-contract labels and links', async () => {
    const { statusCode, payload } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/ssafo-nitrates/propositions'
    })
    expect(statusCode).toBe(200)
    expect(payload).toContain('Matches the law')
    expect(payload).toContain('Goes beyond the law')
    expect(payload).toContain('Goes against the law')
    expect(payload).toContain('No comparable law found')
    expect(payload).toContain('No law candidate found')
    expect(payload).toContain(
      '/audit/subjects/ssafo-nitrates/pages?status=GROUNDED'
    )
    expect(payload).toContain(
      '/audit/subjects/ssafo-nitrates/pages?status=ONLY_UNGROUNDED_CANDIDATES'
    )
    expect(payload).toContain('/audit/subjects/ssafo-nitrates/laws')
    expect(payload).not.toContain('status=UNGROUNDED')
    expect(payload).not.toContain('status=NO_MATCH')
  })

  test('pages-list keeps status filter and does not duplicate pages', async () => {
    const { statusCode, payload } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/ssafo-nitrates/pages?status=CONFLICTS'
    })
    expect(statusCode).toBe(200)
    expect(payload).toContain('Goes against the law')
    const detailLinks = [
      ...payload.matchAll(
        /href="(\/audit\/subjects\/ssafo-nitrates\/pages\/[^"]+)"/g
      )
    ].map((m) => m[1])
    const filtered = detailLinks.filter((href) =>
      href.includes('status=CONFLICTS')
    )
    expect(filtered.length).toBeGreaterThan(0)
    expect(new Set(filtered).size).toBe(filtered.length)
  })

  test('page-detail shows multi-hit pairs for a page with conflicts', async () => {
    const { statusCode, payload } = await server.inject({
      method: 'GET',
      url: `/audit/subjects/ssafo-nitrates/pages/${pageId}?status=CONFLICTS`
    })
    expect(statusCode).toBe(200)
    expect(payload).toContain('Goes against the law')
  })

  test('legacy meadow-verdict still loads', async () => {
    const { statusCode, payload } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/slurry/propositions'
    })
    expect(statusCode).toBe(200)
    expect(payload).toContain('Matches the law')
  })

  test('subject overview offers a CSV download when pairs.csv is present', async () => {
    const { statusCode, payload } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/ssafo-nitrates'
    })
    expect(statusCode).toBe(200)
    expect(payload).toContain('Download results (CSV)')
    expect(payload).toContain('/audit/subjects/ssafo-nitrates/pairs.csv')
  })

  test('GET pairs.csv attaches the prebuilt extract', async () => {
    const { statusCode, headers, payload } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/ssafo-nitrates/pairs.csv'
    })
    expect(statusCode).toBe(200)
    expect(headers['content-type']).toMatch(/text\/csv/)
    expect(headers['content-disposition']).toBe(
      'attachment; filename="ssafo-nitrates-pairs.csv"'
    )
    expect(payload).toMatch(/^category,/)
    expect(payload).toContain('ssafo-nitrates')
  })

  test('GET pairs.csv returns 404 when the category has no CSV', async () => {
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/audit/subjects/slurry/pairs.csv'
    })
    expect(statusCode).toBe(404)
  })
})
