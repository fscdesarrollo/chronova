import { useMemo } from 'react'

const BARS = [
  { y: 28, x: 8, w: 22, delay: 0, color: 'rgba(139, 92, 246, 0.55)' },
  { y: 42, x: 35, w: 18, delay: 1.2, color: 'rgba(99, 102, 241, 0.45)' },
  { y: 56, x: 18, w: 28, delay: 2.4, color: 'rgba(167, 139, 250, 0.4)' },
  { y: 70, x: 52, w: 20, delay: 0.8, color: 'rgba(129, 140, 248, 0.5)' },
  { y: 84, x: 12, w: 14, delay: 3.1, color: 'rgba(196, 181, 253, 0.35)' },
]

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  top: 15 + (i * 4.7) % 70,
  left: (i * 11.3) % 95,
  size: 1.5 + (i % 3),
  delay: (i * 0.35) % 5,
  duration: 6 + (i % 4),
}))

export default function TimeHorizon() {
  const bars = useMemo(() => BARS, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0f18] via-[#12182a] to-[#1a1033]" />

      <div
        className="time-horizon-motion absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          animation: 'horizon-grid-drift 24s linear infinite',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_90%,rgba(99,102,241,0.12),transparent_45%)]" />

      <div
        className="absolute bottom-0 left-0 right-0 h-[42%] opacity-80"
        style={{
          background:
            'linear-gradient(to top, rgba(139, 92, 246, 0.06) 0%, transparent 100%)',
        }}
      />

      <div className="absolute inset-x-[18%] top-[12%] bottom-[8%]">
        <div
          className="time-horizon-motion absolute bottom-0 top-0 w-px bg-violet-400/40"
          style={{
            left: '58%',
            boxShadow: '0 0 24px rgba(167, 139, 250, 0.5)',
            animation: 'horizon-today-pulse 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-0 top-0 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent"
          style={{ left: '58%' }}
        />
        <span
          className="time-horizon-motion absolute -top-6 left-[58%] -translate-x-1/2 rounded-full border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-violet-300/80"
          style={{ animation: 'horizon-today-pulse 3s ease-in-out infinite' }}
        >
          Today
        </span>

        {bars.map((bar, i) => (
          <div
            key={i}
            className="time-horizon-motion absolute h-2 rounded-full backdrop-blur-sm"
            style={{
              top: `${bar.y}%`,
              left: `${bar.x}%`,
              width: `${bar.w}%`,
              backgroundColor: bar.color,
              boxShadow: `0 0 12px ${bar.color}`,
              animation: `horizon-bar-float 8s ease-in-out ${bar.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="time-horizon-motion absolute rounded-full bg-violet-300/60"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animation: `horizon-particle ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
    </div>
  )
}
