export function initStickyTableScrolls() {
  const scrolls = document.querySelectorAll('.app-table-scroll')
  for (const scroll of scrolls) {
    const shadow = scroll.previousElementSibling
    if (!shadow || !shadow.classList.contains('app-table-shadow-scroll')) {
      continue
    }
    const inner = shadow.querySelector('.app-table-shadow-scroll__inner')
    const table = scroll.querySelector('table')
    if (!inner || !table) continue

    const sync = () => {
      inner.style.width = `${table.scrollWidth}px`
    }
    sync()

    if (window.ResizeObserver) {
      new window.ResizeObserver(sync).observe(table)
    } else {
      window.addEventListener('resize', sync)
    }

    let lockShadow = false
    let lockMain = false
    scroll.addEventListener('scroll', () => {
      if (lockMain) {
        lockMain = false
        return
      }
      lockShadow = true
      shadow.scrollLeft = scroll.scrollLeft
    })
    shadow.addEventListener('scroll', () => {
      if (lockShadow) {
        lockShadow = false
        return
      }
      lockMain = true
      scroll.scrollLeft = shadow.scrollLeft
    })
  }
}
