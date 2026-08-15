import { isOnGantt } from './migration'

export function featuresOnDate(features, projectId, isoDate) {
  if (!isoDate || !projectId) return []
  return features.filter((feature) => {
    if (feature.projectId !== projectId) return false
    if (!isOnGantt(feature)) return false
    if (!feature.startDate || !feature.targetDate) return false
    return feature.startDate <= isoDate && feature.targetDate >= isoDate
  })
}

export function dayColumnTooltip(features, projectId, isoDate) {
  const matches = featuresOnDate(features, projectId, isoDate)
  if (!matches.length) return ''

  if (matches.length === 1) return matches[0].name

  const preview = matches
    .slice(0, 3)
    .map((feature) => feature.name)
    .join('\n')
  const suffix = matches.length > 3 ? `\n+${matches.length - 3} more` : ''
  return `${matches.length} features\n${preview}${suffix}`
}
