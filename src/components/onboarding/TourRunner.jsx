import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { getTour } from '../../tours/registry'

const POLL_MS = 80
const MAX_POLL_ATTEMPTS = 25

function useTargetRect(selector, active) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!active || !selector) {
      setRect(null)
      return undefined
    }

    let attempts = 0
    let timer

    const measure = () => {
      const el = document.querySelector(selector)
      if (el) {
        setRect(el.getBoundingClientRect())
        return
      }
      attempts += 1
      if (attempts < MAX_POLL_ATTEMPTS) {
        timer = window.setTimeout(measure, POLL_MS)
      } else {
        setRect(null)
      }
    }

    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [selector, active])

  return rect
}

export default function TourRunner({
  tourId,
  open,
  currentPage,
  onNavigate,
  onClose,
  onComplete,
  onRequestSetup,
}) {
  const tour = getTour(tourId)
  const [stepIndex, setStepIndex] = useState(0)

  const steps = tour?.steps ?? []
  const step = steps[stepIndex]
  const isActionStep = step?.type === 'action'
  const needsTarget = Boolean(step?.target) && !isActionStep

  useEffect(() => {
    if (open) setStepIndex(0)
  }, [open, tourId])

  useEffect(() => {
    if (!open || !step?.page || step.page === currentPage) return
    onNavigate(step.page)
  }, [open, step, currentPage, onNavigate])

  const rect = useTargetRect(needsTarget ? step.target : null, open && needsTarget)

  const finishTour = useCallback(() => {
    onComplete?.()
    onClose?.()
  }, [onComplete, onClose])

  const goNext = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finishTour()
      return
    }
    setStepIndex((prev) => prev + 1)
  }, [stepIndex, steps.length, finishTour])

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1))
  }, [])

  if (!open || !tour || !step) return null

  const tooltipStyle = rect
    ? {
        top: Math.min(rect.bottom + 12, window.innerHeight - 220),
        left: Math.min(Math.max(16, rect.left), window.innerWidth - 340),
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} aria-hidden="true" />

      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-violet-400 ring-offset-2 ring-offset-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      <div
        className="absolute z-10 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#12182a] p-4 text-white shadow-2xl"
        style={tooltipStyle}
        role="dialog"
        aria-label={step.title}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-violet-300/80">
              {tour.label} · {stepIndex + 1}/{steps.length}
            </p>
            <h3 className="text-sm font-semibold text-white">{step.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="Close tour"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-gray-300">{step.body}</p>

        {isActionStep && step.action === 'setup-prompt' ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onRequestSetup?.()
                finishTour()
              }}
              className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Set up your project
            </button>
            <button
              type="button"
              onClick={finishTour}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
            >
              Skip setup for now
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
                >
                  <ArrowLeft size={12} />
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
              >
                {stepIndex >= steps.length - 1 ? 'Done' : 'Next'}
                {stepIndex < steps.length - 1 && <ArrowRight size={12} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
