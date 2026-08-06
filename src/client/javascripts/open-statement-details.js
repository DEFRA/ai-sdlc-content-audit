/**
 * Open ancestor <details> when the URL hash targets a nested statement card
 * (e.g. feedback redirect to #statement-{matchId}).
 */
export function initOpenStatementDetails() {
  openDetailsForHash()
  window.addEventListener('hashchange', openDetailsForHash)
}

function openDetailsForHash() {
  const hash = window.location.hash
  if (!hash || !hash.startsWith('#statement-')) return

  const target = document.querySelector(hash)
  if (!target) return

  let node = target.parentElement
  while (node) {
    if (node.tagName === 'DETAILS') {
      node.open = true
    }
    node = node.parentElement
  }

  target.scrollIntoView({ block: 'nearest' })
}
