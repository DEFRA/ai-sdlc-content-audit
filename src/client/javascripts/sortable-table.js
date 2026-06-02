function getSortValue(cell, type) {
  const raw = cell.getAttribute('data-sort-value')
  if (type === 'number') {
    const n = Number(raw ?? cell.textContent.trim())
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY
  }
  return (raw ?? cell.textContent).trim().toLowerCase()
}

function compareRows(a, b, columnIndex, type, direction) {
  const av = getSortValue(a.children[columnIndex], type)
  const bv = getSortValue(b.children[columnIndex], type)
  if (av < bv) return direction === 'ascending' ? -1 : 1
  if (av > bv) return direction === 'ascending' ? 1 : -1
  return 0
}

function buildIcon() {
  const icon = document.createElement('span')
  icon.className = 'app-sortable-table__sort-icon'
  icon.setAttribute('aria-hidden', 'true')
  const up = document.createElement('span')
  up.className = 'app-sortable-table__sort-icon-up'
  const down = document.createElement('span')
  down.className = 'app-sortable-table__sort-icon-down'
  icon.append(up, down)
  return icon
}

function initSortableTable(table) {
  const headers = table.querySelectorAll('th[data-sortable]')
  const tbody = table.querySelector('tbody')
  if (!tbody) return

  headers.forEach((header) => {
    const columnIndex = Array.from(header.parentNode.children).indexOf(header)
    const type = header.getAttribute('data-sort-type') || 'string'

    const label = header.textContent.trim()
    header.textContent = ''

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'app-sortable-table__button'

    const labelEl = document.createElement('span')
    labelEl.className = 'app-sortable-table__label'
    labelEl.textContent = label

    button.append(labelEl, buildIcon())
    header.appendChild(button)
    header.setAttribute('aria-sort', 'none')

    button.addEventListener('click', () => {
      const current = header.getAttribute('aria-sort')
      const next = current === 'ascending' ? 'descending' : 'ascending'

      headers.forEach((h) => h.setAttribute('aria-sort', 'none'))
      header.setAttribute('aria-sort', next)

      const rows = Array.from(tbody.querySelectorAll('tr'))
      rows.sort((a, b) => compareRows(a, b, columnIndex, type, next))
      const fragment = document.createDocumentFragment()
      rows.forEach((row) => fragment.appendChild(row))
      tbody.appendChild(fragment)
    })
  })
}

export function initSortableTables() {
  document
    .querySelectorAll('[data-module="app-sortable-table"]')
    .forEach(initSortableTable)
}
