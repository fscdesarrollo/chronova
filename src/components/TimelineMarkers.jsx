import { formatDay } from '../utils/dates'

export function TodayHeaderMarker({ left }) {
  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left, top: 0 }}
      aria-hidden
    >
      <div className="absolute left-0 -translate-x-1/2 rounded-full bg-sky-500 px-1.5 py-px text-[9px] font-semibold uppercase leading-tight text-white shadow-sm">
        TODAY
      </div>
    </div>
  )
}

export function TodayBodyLine({ left }) {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{ left, top: 0, bottom: 0 }}
      aria-hidden
    >
      <div className="absolute bottom-0 left-0 top-0 w-0.5 -translate-x-1/2 bg-sky-500/80" />
    </div>
  )
}

export function TimelineMarkerHeader({ marker, left, stackIndex = 0 }) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left, top: 4 + stackIndex * 18 }}
      aria-hidden
    >
      <div
        className="absolute left-0 max-w-[140px] -translate-x-1/2 truncate rounded px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: marker.color }}
        title={`${marker.label} — ${formatDay(marker.date)}`}
      >
        <span className="block truncate">{marker.label}</span>
        <span className="block text-[8px] font-normal opacity-90">{formatDay(marker.date)}</span>
      </div>
    </div>
  )
}

export function GroupedMarkerHeader({ group, expanded, onToggle }) {
  if (group.count === 1) {
    return <TimelineMarkerHeader marker={group.markers[0]} left={group.left} />
  }

  return (
    <div className="absolute z-30" style={{ left: group.left, top: 2 }}>
      <button
        type="button"
        onClick={onToggle}
        className="absolute left-0 max-w-[140px] -translate-x-1/2 truncate rounded px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm hover:brightness-110"
        style={{ backgroundColor: group.dominantColor }}
        title={group.markers.map((m) => m.label).join(', ')}
        aria-expanded={expanded}
      >
        <span className="block truncate">{group.label}</span>
        <span className="block text-[8px] font-normal opacity-90">{formatDay(group.date)}</span>
      </button>

      {expanded && (
        <div className="absolute left-0 top-full z-50 mt-1 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {group.markers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: m.color }}
              />
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-800">{m.label}</div>
                <div className="text-[10px] text-gray-400">{formatDay(m.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function TimelineMarkerBodyLine({ color, left }) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left, top: 0, bottom: 0 }}
      aria-hidden
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-0.5 -translate-x-1/2 opacity-80"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
