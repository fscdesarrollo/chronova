import { useCallback, useEffect, useState } from 'react'
import { LEFT_COL_MAX_WIDTH, LEFT_COL_MIN_WIDTH } from '../constants'

/**
 * Drag the split between feature panel and timeline.
 * Below LEFT_COL_MIN_WIDTH → collapse. Uses split container edge, not scroll position.
 */
export function useLeftColResize({ onWidthChange, onCollapsedChange }) {
  const [resizing, setResizing] = useState(false)

  const startResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
  }, [])

  useEffect(() => {
    if (!resizing) return

    const onMove = (e) => {
      const split = document.querySelector('[data-timeline-split]')
      if (!split) return
      const raw = e.clientX - split.getBoundingClientRect().left

      if (raw < LEFT_COL_MIN_WIDTH) {
        onCollapsedChange(true)
        return
      }

      onCollapsedChange(false)
      onWidthChange(Math.min(LEFT_COL_MAX_WIDTH, raw))
    }

    const onUp = () => setResizing(false)

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing, onWidthChange, onCollapsedChange])

  return { startResize, resizing }
}
