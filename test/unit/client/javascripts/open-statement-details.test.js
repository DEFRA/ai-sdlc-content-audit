import { describe, expect, test } from 'vitest'

import {
  findAncestorDetails,
  openDetailsForHash
} from '../../../../src/client/javascripts/open-statement-details.js'

/**
 * Minimal DOM tree for hash/details behaviour — avoids a browser test runner.
 */
function createNode(tagName, { id, children = [] } = {}) {
  const node = {
    tagName: tagName.toUpperCase(),
    id: id ?? null,
    open: false,
    parentElement: null,
    children,
    scrollIntoViewCalls: 0,
    scrollIntoView() {
      this.scrollIntoViewCalls += 1
    }
  }
  for (const child of children) {
    child.parentElement = node
  }
  return node
}

function createRoot(tree) {
  const byId = new Map()

  function index(node) {
    if (node.id) byId.set(node.id, node)
    for (const child of node.children ?? []) index(child)
  }
  index(tree)

  return {
    querySelector(selector) {
      if (!selector.startsWith('#')) return null
      const id = selector.slice(1)
      if (!id || /[\s"']/.test(id)) {
        throw new Error(`Invalid selector: ${selector}`)
      }
      return byId.get(id) ?? null
    }
  }
}

describe('findAncestorDetails', () => {
  test('collects every ancestor details element from the target upward', () => {
    const target = createNode('div', { id: 'statement-m-1' })
    const inner = createNode('details', { children: [target] })
    const outer = createNode('details', { children: [inner] })
    createNode('article', { children: [outer] })

    expect(findAncestorDetails(target)).toEqual([inner, outer])
  })
})

describe('openDetailsForHash', () => {
  test('opens ancestor details for a supported statement hash and scrolls to it', () => {
    const target = createNode('div', { id: 'statement-m-1' })
    const details = createNode('details', { children: [target] })
    const root = createRoot(createNode('main', { children: [details] }))

    const matched = openDetailsForHash('#statement-m-1', root)

    expect(matched).toBe(target)
    expect(details.open).toBe(true)
    expect(target.scrollIntoViewCalls).toBe(1)
  })

  test('returns null for unrelated hashes without throwing', () => {
    const target = createNode('div', { id: 'statement-m-1' })
    const details = createNode('details', { children: [target] })
    const root = createRoot(createNode('main', { children: [details] }))

    expect(openDetailsForHash('#guidance-g-1', root)).toBeNull()
    expect(openDetailsForHash('', root)).toBeNull()
    expect(details.open).toBe(false)
  })

  test('fails safely when the statement id is missing', () => {
    const root = createRoot(createNode('main', { children: [] }))
    expect(openDetailsForHash('#statement-missing', root)).toBeNull()
  })

  test('fails safely for an invalid hash selector', () => {
    const root = createRoot(createNode('main', { children: [] }))
    expect(openDetailsForHash('#statement-bad"id', root)).toBeNull()
  })

  test('opens multiple ancestor details when nested', () => {
    const target = createNode('div', { id: 'statement-nested' })
    const inner = createNode('details', { children: [target] })
    const outer = createNode('details', { children: [inner] })
    const root = createRoot(createNode('main', { children: [outer] }))

    openDetailsForHash('#statement-nested', root)

    expect(inner.open).toBe(true)
    expect(outer.open).toBe(true)
  })
})
