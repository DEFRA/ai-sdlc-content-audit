export function highlightPlaceholders(text) {
  if (!text) {
    return text
  }

  return text.replace(
    /\[([A-Z][A-Z0-9_]*)\]/g,
    '<mark class="defra-placeholder">[$1]</mark>'
  )
}
