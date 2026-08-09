import { Compass } from 'lucide-react'

export default function TourCtaHighlight({ onClick }) {
  return (
    <div className="tour-cta-highlight relative">
      <span className="tour-cta-highlight__badge" aria-hidden="true">
        Start here
      </span>

      <span className="tour-cta-highlight__ring tour-cta-highlight__ring--outer" aria-hidden="true" />
      <span className="tour-cta-highlight__ring tour-cta-highlight__ring--inner" aria-hidden="true" />
      <span className="tour-cta-highlight__scan" aria-hidden="true" />

      <button
        type="button"
        onClick={onClick}
        className="tour-cta-highlight__btn relative z-10 flex items-center gap-2 rounded-lg border border-violet-300/50 bg-violet-500/20 px-5 py-2.5 text-sm font-medium text-violet-50 shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-colors hover:bg-violet-500/30"
      >
        <Compass size={16} className="tour-cta-highlight__icon" />
        Take a tour
      </button>
    </div>
  )
}
