/**
 * Open ancestor <details> when the URL hash targets a nested statement card
 * (e.g. feedback redirect to #statement-{matchId}).
 */
export function initOpenStatementDetails() {
  openDetailsForHash()
  window.addEventListener('hashchange', openDetailsForHash)
}

/**
 * @param {string} [hash]
 * @param {ParentNode} [root]
 * @returns {Element|null} the matched statement target, if any
 */
export function openDetailsForHash(
  hash = typeof window !== 'undefined' ? window.location.hash : '',
  root = typeof document !== 'undefined' ? document : null
) {
  if (!hash || !hash.startsWith('#statement-') || root == null) return null

  let target
  try {
    target = root.querySelector(hash)
  } catch {
    // Invalid selector / ID — fail safely.
    return null
  }
  if (!target) return null

  for (const details of findAncestorDetails(target)) {
    details.open = true
  }

  if (typeof target.scrollIntoView === 'function') {
    target.scrollIntoView({ block: 'nearest' })
  }

  return target
}

/**
 * @param {Element} element
 * @returns {HTMLDetailsElement[]}
 */
export function findAncestorDetails(element) {
  /** @type {HTMLDetailsElement[]} */
  const ancestors = []
  let node = element.parentElement
  while (node) {
    if (node.tagName === 'DETAILS') {
      ancestors.push(/** @type {HTMLDetailsElement} */ (node))
    }
    node = node.parentElement
  }
  return ancestors
}
