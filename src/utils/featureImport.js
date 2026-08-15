export const MAX_IMPORT_ROWS = 500

export const IMPORT_PRODUCT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#FB923C',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F59E0B',
  '#6366F1',
]

export const DATE_FORMATS = [
  { id: 'ymd', label: 'YYYY-MM-DD', example: '2026-08-15' },
  { id: 'dmy', label: 'DD/MM/YYYY', example: '15/08/2026' },
  { id: 'mdy', label: 'MM/DD/YYYY', example: '08/15/2026' },
]

export const IMPORT_FIELDS = [
  { id: 'name', label: 'Feature name', required: true },
  { id: 'product', label: 'Product', required: true },
  { id: 'team', label: 'Team', required: false },
  { id: 'startDate', label: 'Start date', required: false },
  { id: 'targetDate', label: 'Target date', required: false },
  { id: 'notes', label: 'Notes', required: false },
]

const FIELD_ALIASES = {
  name: ['feature name', 'feature', 'name', 'nombre', 'title', 'titulo', 'feature title'],
  product: ['product', 'producto', 'product name', 'nombre producto'],
  team: ['team', 'equipo', 'team name', 'squad'],
  startDate: ['start date', 'start', 'inicio', 'start_date', 'startdate', 'begin'],
  targetDate: ['target date', 'target', 'end date', 'end', 'fin', 'target_date', 'due date', 'due'],
  notes: ['notes', 'note', 'notas', 'description', 'desc', 'comment', 'comments'],
}

import exampleCsv from '../../docs/feature-import-example.csv?raw'

export const FEATURE_IMPORT_TEMPLATE_CSV = exampleCsv.replace(/^\uFEFF/, '').replace(/\s+$/, '')

export function downloadFeatureImportTemplate() {
  const blob = new Blob([`\uFEFF${FEATURE_IMPORT_TEMPLATE_CSV}\n`], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'chronova-feature-import-example.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function isSpreadsheetFileName(name = '') {
  return /\.(xlsx|xls|ods)$/i.test(name)
}

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

export function detectDelimiter(text) {
  let inQuotes = false
  let commas = 0
  let semis = 0
  let tabs = 0
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (inQuotes) continue
    if (c === '\n' || c === '\r') break
    if (c === ',') commas += 1
    else if (c === ';') semis += 1
    else if (c === '\t') tabs += 1
  }
  if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

export function parseDelimitedTable(text) {
  const source = String(text ?? '').replace(/^\uFEFF/, '')
  if (!source.trim()) {
    return { headers: [], rows: [], delimiter: ',', truncated: false, totalRows: 0 }
  }

  const delimiter = detectDelimiter(source)
  const records = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushRow = () => {
    if (row.some((cell) => String(cell).trim() !== '')) {
      records.push(row)
    }
    row = []
  }

  for (let i = 0; i < source.length; i += 1) {
    const c = source[i]
    const next = source[i + 1]
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"'
        i += 1
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === delimiter) {
      row.push(field)
      field = ''
      continue
    }
    if (c === '\n') {
      row.push(field)
      field = ''
      pushRow()
      continue
    }
    if (c === '\r') {
      row.push(field)
      field = ''
      pushRow()
      if (next === '\n') i += 1
      continue
    }
    field += c
  }
  row.push(field)
  pushRow()

  const headers = (records[0] ?? []).map((h) => String(h).replace(/^\uFEFF/, '').trim())
  const dataRows = records.slice(1).map((cells) => {
    const padded = [...cells]
    while (padded.length < headers.length) padded.push('')
    return padded.map((cell) => String(cell ?? '').trim())
  })
  const truncated = dataRows.length > MAX_IMPORT_ROWS
  return {
    headers,
    rows: truncated ? dataRows.slice(0, MAX_IMPORT_ROWS) : dataRows,
    delimiter,
    truncated,
    totalRows: dataRows.length,
  }
}

export function suggestColumnMap(headers) {
  const map = {}
  for (const field of IMPORT_FIELDS) {
    map[field.id] = -1
  }
  const used = new Set()
  for (const field of IMPORT_FIELDS) {
    const aliases = FIELD_ALIASES[field.id]
    const index = headers.findIndex((header, i) => {
      if (used.has(i)) return false
      const normalized = normalizeHeader(header)
      return aliases.includes(normalized)
    })
    if (index >= 0) {
      map[field.id] = index
      used.add(index)
    }
  }
  return map
}

export function cellAt(row, index) {
  if (index == null || index < 0) return ''
  return String(row[index] ?? '').trim()
}

function isValidIsoDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function parseImportDate(value, formatId = 'ymd') {
  const raw = String(value ?? '').trim()
  if (!raw) return { iso: null, ok: true, empty: true }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return isValidIsoDate(raw) ? { iso: raw, ok: true, empty: false } : { iso: null, ok: false, empty: false }
  }

  const parts = raw.split(/[/.]/)
  if (parts.length !== 3) return { iso: null, ok: false, empty: false }

  const nums = parts.map((p) => parseInt(p, 10))
  if (nums.some((n) => Number.isNaN(n))) return { iso: null, ok: false, empty: false }

  let year
  let month
  let day
  if (formatId === 'mdy') {
    ;[month, day, year] = nums
  } else {
    ;[day, month, year] = nums
  }
  if (year < 100) year += 2000
  const iso = `${year}-${pad2(month)}-${pad2(day)}`
  return isValidIsoDate(iso) ? { iso, ok: true, empty: false } : { iso: null, ok: false, empty: false }
}

export function guessDateFormat(values) {
  let sawDmy = false
  let sawMdy = false
  let sawYmd = false
  for (const value of values) {
    const raw = String(value ?? '').trim()
    if (!raw) continue
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      sawYmd = true
      continue
    }
    const parts = raw.split(/[/.]/)
    if (parts.length !== 3) continue
    const a = parseInt(parts[0], 10)
    const b = parseInt(parts[1], 10)
    if (Number.isNaN(a) || Number.isNaN(b)) continue
    if (a > 12) sawDmy = true
    if (b > 12) sawMdy = true
  }
  if (sawDmy && !sawMdy) return 'dmy'
  if (sawMdy && !sawDmy) return 'mdy'
  if (sawYmd) return 'ymd'
  return 'ymd'
}

export function uniqueColumnValues(rows, columnIndex) {
  if (columnIndex < 0) return []
  const seen = new Map()
  for (const row of rows) {
    const value = cellAt(row, columnIndex)
    if (!value) continue
    const key = value.toLowerCase()
    if (!seen.has(key)) seen.set(key, value)
  }
  return [...seen.values()]
}

export function findByName(items, name) {
  const needle = String(name ?? '').trim().toLowerCase()
  if (!needle) return null
  return items.find((item) => item.name.trim().toLowerCase() === needle) ?? null
}

export function buildProductResolutions(names, products, projectProducts, projectId) {
  const assigned = new Set(
    projectProducts.filter((pp) => pp.projectId === projectId).map((pp) => pp.productId),
  )
  return names.map((name, index) => {
    const match = findByName(products, name)
    if (!match) {
      return {
        name,
        key: name.trim().toLowerCase(),
        action: 'create',
        productId: null,
        color: IMPORT_PRODUCT_COLORS[index % IMPORT_PRODUCT_COLORS.length],
      }
    }
    return {
      name,
      key: name.trim().toLowerCase(),
      action: assigned.has(match.id) ? 'use' : 'assign',
      productId: match.id,
      color: match.color,
    }
  })
}

export function buildTeamResolutions(names, teams, projectTeams, projectId) {
  const assigned = new Set(
    projectTeams.filter((pt) => pt.projectId === projectId).map((pt) => pt.teamId),
  )
  return names.map((name) => {
    const match = findByName(teams, name)
    if (!match) {
      return {
        name,
        key: name.trim().toLowerCase(),
        action: 'backlog',
        teamId: null,
      }
    }
    return {
      name,
      key: name.trim().toLowerCase(),
      action: assigned.has(match.id) ? 'use' : 'assign',
      teamId: match.id,
    }
  })
}

export function productActionLabel(resolution, products) {
  if (resolution.action === 'skip') return 'Skip these rows'
  if (resolution.action === 'create') return `Create "${resolution.name}"`
  const product = products.find((p) => p.id === resolution.productId)
  const label = product?.name ?? resolution.name
  if (resolution.action === 'assign') return `Assign "${label}" to this project`
  return `Use "${label}"`
}

export function teamActionLabel(resolution) {
  if (resolution.action === 'backlog') {
    return resolution.teamId ? 'Import as backlog' : `Unknown team — import as backlog`
  }
  if (resolution.action === 'assign') return `Assign "${resolution.name}" to this project`
  return `Use "${resolution.name}"`
}

export function buildImportPreview({
  rows,
  columnMap,
  dateFormat,
  productResolutions,
  teamResolutions,
  forceBacklog = false,
}) {
  const productByKey = new Map(productResolutions.map((item) => [item.key, item]))
  const teamByKey = new Map(teamResolutions.map((item) => [item.key, item]))

  const previewRows = rows.map((row, index) => {
    const name = cellAt(row, columnMap.name)
    const productName = cellAt(row, columnMap.product)
    const teamName = cellAt(row, columnMap.team)
    const notes = cellAt(row, columnMap.notes)
    const startParsed = parseImportDate(cellAt(row, columnMap.startDate), dateFormat)
    const targetParsed = parseImportDate(cellAt(row, columnMap.targetDate), dateFormat)
    const issues = []
    let status = 'ok'
    let include = true

    if (!name) {
      issues.push('Missing feature name')
      status = 'skip'
      include = false
    }
    if (!productName) {
      issues.push('Missing product')
      status = 'skip'
      include = false
    }

    const product = productByKey.get(productName.toLowerCase())
    if (productName && product?.action === 'skip') {
      issues.push('Product skipped')
      status = 'skip'
      include = false
    }

    if (columnMap.startDate >= 0 && !startParsed.ok) {
      issues.push('Invalid start date')
      status = include ? 'warning' : status
    }
    if (columnMap.targetDate >= 0 && !targetParsed.ok) {
      issues.push('Invalid target date')
      status = include ? 'warning' : status
    }

    let startDate = startParsed.ok ? startParsed.iso : null
    let targetDate = targetParsed.ok ? targetParsed.iso : null
    if (startDate && targetDate && targetDate < startDate) {
      issues.push('Target date is before start date — dates omitted')
      startDate = null
      targetDate = null
      if (status === 'ok') status = 'warning'
    }

    const team = teamName ? teamByKey.get(teamName.toLowerCase()) : null
    if (teamName && team?.action === 'backlog' && !team.teamId) {
      issues.push(`Unknown team "${teamName}" — importing as backlog`)
      if (status === 'ok') status = 'warning'
    }

    const teamId = forceBacklog ? null : (team?.action === 'backlog' ? null : (team?.teamId ?? null))
    const planningStatus = teamId ? 'planned' : 'backlog'

    return {
      rowIndex: index + 2,
      name,
      productName,
      teamName,
      notes,
      startDate,
      targetDate,
      status,
      include,
      issues,
      productKey: product?.key ?? productName.trim().toLowerCase(),
      productId: product?.action === 'create' || product?.action === 'skip' ? null : (product?.productId ?? null),
      teamId,
      planningStatus,
    }
  })

  const included = previewRows.filter((row) => row.include)
  const usedProductKeys = new Set(included.map((row) => row.productKey))
  const usedTeamIds = new Set(included.map((row) => row.teamId).filter(Boolean))
  const productsToCreate = productResolutions.filter(
    (item) => item.action === 'create' && usedProductKeys.has(item.key),
  )
  const productsToAssign = productResolutions.filter(
    (item) => item.action === 'assign' && item.productId && usedProductKeys.has(item.key),
  )
  const teamsToAssign = forceBacklog
    ? []
    : teamResolutions.filter(
        (item) => item.action === 'assign' && item.teamId && usedTeamIds.has(item.teamId),
      )

  const applyPlan = {
    productsToCreate: productsToCreate.map((item) => ({
      key: item.key,
      name: item.name,
      color: item.color,
    })),
    productsToAssign: productsToAssign.map((item) => item.productId),
    teamsToAssign: teamsToAssign.map((item) => item.teamId),
    features: included.map((row) => ({
      name: row.name,
      productKey: row.productKey,
      productId: row.productId,
      teamId: row.teamId,
      startDate: row.startDate,
      targetDate: row.targetDate,
      notes: row.notes,
    })),
  }

  return {
    rows: previewRows,
    applyPlan,
    summary: {
      total: previewRows.length,
      included: included.length,
      skipped: previewRows.length - included.length,
      warnings: previewRows.filter((row) => row.status === 'warning').length,
      planned: included.filter((row) => row.planningStatus === 'planned').length,
      backlog: included.filter((row) => row.planningStatus === 'backlog').length,
      productsToCreate: productsToCreate.length,
      productsToAssign: productsToAssign.length,
      teamsToAssign: teamsToAssign.length,
    },
  }
}
