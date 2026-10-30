const DATA_TABLE_SELECTOR = '.record-table, .data-table, .grid-table'
const ACTION_HEADER_PATTERN = /^(action|actions|manage|options|select|open|view|edit|delete)$/i
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function headerLabel(header) {
  return (header.dataset.sortLabel || header.textContent || '').replace(/\s+/g, ' ').trim()
}

function isSortableHeader(header) {
  const label = headerLabel(header)
  return Boolean(
    label &&
    !header.hasAttribute('data-sort-disabled') &&
    !header.hasAttribute('colspan') &&
    !ACTION_HEADER_PATTERN.test(label) &&
    !header.querySelector('input, select, button, a')
  )
}

function parseCellValue(cell) {
  const raw = (cell?.dataset.sortValue ?? cell?.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!raw || raw === '—' || raw === '-') return { type: 'empty', value: '' }

  const numericText = raw
    .replace(/^(INR|USD|EUR|GBP)\s*/i, '')
    .replace(/[₹$€£,%]/g, '')
    .replace(/,/g, '')
    .trim()

  if (/^[+-]?\d+(?:\.\d+)?$/.test(numericText) && /^(?:INR|USD|EUR|GBP|[₹$€£])|%$|^[+-]?[\d,.]+$/i.test(raw)) {
    return { type: 'number', value: Number(numericText) }
  }

  const looksLikeIsoDate = /^\d{4}-\d{2}-\d{2}(?:\s|T|$)/.test(raw)
  const looksLikeNamedDate = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(raw)
  if (looksLikeIsoDate || looksLikeNamedDate) {
    const timestamp = Date.parse(raw.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/, '$1T$2'))
    if (!Number.isNaN(timestamp)) return { type: 'date', value: timestamp }
  }

  return { type: 'text', value: raw }
}

function compareValues(left, right) {
  if (left.type === 'empty' && right.type === 'empty') return 0
  if (left.type === 'empty') return 1
  if (right.type === 'empty') return -1
  if (left.type === right.type && (left.type === 'number' || left.type === 'date')) return left.value - right.value
  return collator.compare(String(left.value), String(right.value))
}

function tableRowsForSort(table, columnCount) {
  const body = table.tBodies?.[0]
  if (!body) return null
  const rows = Array.from(body.rows)
  if (rows.length < 2) return null
  if (rows.some(row => row.cells.length !== columnCount || row.querySelector('td[colspan]'))) return null
  return { body, rows }
}

function applySort(table, columnIndex, direction) {
  const headers = Array.from(table.tHead?.rows?.[0]?.cells || [])
  const rowSet = tableRowsForSort(table, headers.length)
  if (!rowSet || table.dataset.crmApplyingSort === 'true') return false

  table.dataset.crmApplyingSort = 'true'
  const multiplier = direction === 'descending' ? -1 : 1
  rowSet.rows.forEach((row, index) => {
    if (!row.dataset.crmOriginalOrder) row.dataset.crmOriginalOrder = String(index)
  })

  rowSet.rows
    .map(row => ({ row, parsed: parseCellValue(row.cells[columnIndex]) }))
    .sort((left, right) => {
      const comparison = compareValues(left.parsed, right.parsed) * multiplier
      if (comparison !== 0) return comparison
      return Number(left.row.dataset.crmOriginalOrder) - Number(right.row.dataset.crmOriginalOrder)
    })
    .forEach(({ row }) => rowSet.body.appendChild(row))

  table.dataset.sortColumn = String(columnIndex)
  table.dataset.sortDirection = direction
  table.dispatchEvent(new CustomEvent('crm-table-sorted', {
    bubbles: true,
    detail: { columnIndex, direction, label: headerLabel(headers[columnIndex]) }
  }))

  requestAnimationFrame(() => { delete table.dataset.crmApplyingSort })
  return true
}

function updateHeaderState(table, activeHeader, direction) {
  table.querySelectorAll('thead th.crm-sortable-header').forEach(header => {
    const isActive = header === activeHeader
    const nextDirection = isActive && direction === 'ascending' ? 'descending' : 'ascending'
    header.setAttribute('aria-sort', isActive ? direction : 'none')
    header.setAttribute('aria-label', `${headerLabel(header)}: activate to sort ${nextDirection}`)
    header.dataset.sortDirection = isActive ? direction : 'none'
  })
}

function activateHeader(table, header, columnIndex) {
  const currentColumn = Number(table.dataset.sortColumn)
  const currentDirection = table.dataset.sortDirection
  const direction = currentColumn === columnIndex && currentDirection === 'ascending'
    ? 'descending'
    : 'ascending'

  if (applySort(table, columnIndex, direction)) updateHeaderState(table, header, direction)
}

function enhanceTable(table) {
  if (!(table instanceof HTMLTableElement) || table.dataset.crmDataTableReady === 'true') return
  const headerRow = table.tHead?.rows?.[0]
  if (!headerRow) return

  table.dataset.crmDataTableReady = 'true'
  Array.from(headerRow.cells).forEach((header, columnIndex) => {
    if (!isSortableHeader(header)) {
      header.classList.add('crm-static-header')
      return
    }

    const label = headerLabel(header)
    header.classList.add('crm-sortable-header')
    header.dataset.sortDirection = 'none'
    header.tabIndex = 0
    header.setAttribute('role', 'button')
    header.setAttribute('aria-sort', 'none')
    header.setAttribute('aria-label', `${label}: activate to sort ascending`)
    header.title = `Sort by ${label}`

    header.addEventListener('click', event => {
      if (event.target.closest('button, a, input, select')) return
      activateHeader(table, header, columnIndex)
    })
    header.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      activateHeader(table, header, columnIndex)
    })
  })
}

function enhanceWithin(root = document) {
  if (root instanceof Element && root.matches(DATA_TABLE_SELECTOR)) enhanceTable(root)
  root.querySelectorAll?.(DATA_TABLE_SELECTOR).forEach(enhanceTable)
}

export function installDataTableEnhancements() {
  enhanceWithin(document)

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node instanceof Element) enhanceWithin(node)
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}

export const dataTableValue = parseCellValue
export const compareDataTableValues = compareValues
