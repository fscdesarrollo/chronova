const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

export function parseDisplayDate(str, yearRef) {
  const [mon, day] = str.split(' ')
  const month = MONTHS[mon]
  if (month < yearRef.lastMonth) {
    yearRef.year += 1
  }
  yearRef.lastMonth = month
  return new Date(yearRef.year, month, parseInt(day, 10))
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(iso) {
  const date = parseISO(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`
}

export function addDays(iso, days) {
  const date = parseISO(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function addWeeks(iso, weeks) {
  return addDays(iso, weeks * 7)
}
