import { getDateTimelinePosition } from './weekCalendar'

/** Group markers by date; one body line per date (dominant = first marker color). */
export function buildGroupedMarkerLayout(markers, weeks, weekWidth) {
  const withPos = markers
    .map((marker) => ({
      marker,
      left: getDateTimelinePosition(weeks, weekWidth, marker.date),
    }))
    .filter((item) => item.left != null)
    .sort((a, b) => a.left - b.left || a.marker.label.localeCompare(b.marker.label))

  const byDate = new Map()
  for (const item of withPos) {
    const key = item.marker.date
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, left: item.left, markers: [], dominantColor: item.marker.color })
    }
    byDate.get(key).markers.push(item.marker)
  }

  return [...byDate.values()].map((group) => ({
    ...group,
    count: group.markers.length,
    label: group.count === 1 ? group.markers[0].label : `${group.count} markers`,
  }))
}
