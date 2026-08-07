import { formatDay } from '../utils/dates'

export function TodayHeaderMarker({ left }) {
  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left, top: 0 }}
      aria-hidden
    >
      <div className="absolute left-0 -translate-x-1/2 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white shadow-sm">
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
      style={{ left, top: 4 + stackIndex * 22 }}
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

export function TimelineMarkerBodyLine({ marker, left }) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left, top: 0, bottom: 0 }}
      aria-hidden
    >
      <div
        className="absolute bottom-0 left-0 top-0 w-0.5 -translate-x-1/2 opacity-80"
        style={{ backgroundColor: marker.color }}
      />
    </div>
  )
}
