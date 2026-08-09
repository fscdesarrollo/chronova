import { ArrowRight, FolderCog, Sparkles } from 'lucide-react'
import {
  APP_ELEVATOR_PITCH,
  APP_SLOGAN,
  APP_TAGLINE,
  BRAND_PILLARS,
} from '../../brand'
import BrandWordmark from '../BrandWordmark'
import TimeHorizon from '../TimeHorizon'

export default function HomePage({ activeProject, onOpenTimeline, onConfigureProject }) {
  const projectLabel = activeProject?.name

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
      <TimeHorizon />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-10 md:py-14">
        <div className="mb-8 flex items-center gap-2 text-violet-300/80">
          <Sparkles size={16} className="shrink-0" />
          <span className="text-xs font-medium uppercase tracking-[0.2em]">{APP_TAGLINE}</span>
        </div>

        <h2 className="mb-4">
          <BrandWordmark className="text-4xl md:text-5xl" />
        </h2>

        <p className="mb-2 text-lg font-medium italic text-violet-200/90 md:text-xl">
          {APP_SLOGAN}
        </p>

        <p className="mb-10 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
          {APP_ELEVATOR_PITCH}
        </p>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {BRAND_PILLARS.map(({ title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm transition-colors hover:border-violet-500/30 hover:bg-white/[0.05]"
            >
              <p className="mb-1.5 text-sm font-semibold text-violet-200">{title}</p>
              <p className="text-xs leading-relaxed text-gray-500">{description}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-300/70">
            The name
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            <span className="font-medium text-violet-200">Chrono</span> — time, sequence, the
            history of the plan.{' '}
            <span className="font-medium text-violet-200">Nova</span> — renewal, a new reading of
            the future. You cannot stop time or rewrite the past, but you can make it visible and
            adapt what comes next.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenTimeline}
            className="group flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/40 transition-all hover:bg-violet-500 hover:shadow-violet-800/50"
          >
            Open Timeline
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>

          <button
            type="button"
            onClick={onConfigureProject}
            className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-200 backdrop-blur-sm transition-colors hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
          >
            <FolderCog size={16} />
            {projectLabel ? 'Configure project' : 'Set up your first project'}
          </button>
        </div>

        {projectLabel && (
          <p className="mt-4 text-xs text-gray-600">
            Active project:{' '}
            <span className="text-gray-500">{projectLabel}</span>
          </p>
        )}
      </div>
    </div>
  )
}
