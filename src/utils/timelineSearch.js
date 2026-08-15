export function featureMatchesSearch(feature, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    feature.name.toLowerCase().includes(q) ||
    String(feature.id).toLowerCase().includes(q)
  )
}

/**
 * Filter timeline rows by feature name or id. Hides empty sections and forces
 * sections with matches to render expanded (collapsed: false).
 */
export function filterTimelineRowsBySearch(rows, query) {
  const q = query.trim()
  if (!q) return rows

  const hasSections = rows.some((row) => row.type === 'section')
  if (!hasSections) {
    return rows.filter((row) => row.type === 'feature' && featureMatchesSearch(row.feature, q))
  }

  const result = []
  let currentSection = null
  let matchingFeatures = []

  const flushSection = () => {
    if (currentSection && matchingFeatures.length) {
      result.push({
        ...currentSection,
        count: matchingFeatures.length,
        collapsed: false,
      })
      result.push(...matchingFeatures)
    }
    currentSection = null
    matchingFeatures = []
  }

  for (const row of rows) {
    if (row.type === 'section') {
      flushSection()
      currentSection = row
    } else if (featureMatchesSearch(row.feature, q)) {
      matchingFeatures.push(row)
    }
  }
  flushSection()

  return result
}
