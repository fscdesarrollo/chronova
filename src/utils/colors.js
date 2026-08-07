export function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function normalizeHex(hex) {
  if (!hex) return '#6B7280'
  const h = hex.startsWith('#') ? hex : `#${hex}`
  return isValidHex(h) ? h.toUpperCase() : '#6B7280'
}

export function textColorForBg(hex) {
  const h = normalizeHex(hex).slice(1)
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#111827' : '#FFFFFF'
}
