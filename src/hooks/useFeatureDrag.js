import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BAR_PADDING,
  LEFT_COL_WIDTH,
  ROW_HEIGHT,
  WEEK_WIDTH,
  rowFromPointerY,
  weekFromPointerX,
} from '../constants'
import { TOTAL_WEEKS } from '../data'

const DRAG_THRESHOLD = 4
const BAR_HEIGHT = 28

function barWidth(duration) {
  return duration * WEEK_WIDTH - BAR_PADDING * 2
}

function barLeft(startWeek) {
  return startWeek * WEEK_WIDTH + BAR_PADDING
}

function snapToViewport(rects, snapStartWeek, snapRowIndex, duration) {
  const contentLeft = LEFT_COL_WIDTH + barLeft(snapStartWeek)
  const contentTop = snapRowIndex * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2

  return {
    left: rects.gridRect.left + contentLeft - rects.scrollLeft,
    top: rects.gridRect.top + contentTop - rects.scrollTop,
    width: barWidth(duration),
    height: BAR_HEIGHT,
  }
}

export function useFeatureDrag(features, setFeatures) {
  const gridRef = useRef(null)
  const pendingRef = useRef(null)
  const [drag, setDrag] = useState(null)

  const getRects = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return null
    const gridRect = grid.getBoundingClientRect()
    return {
      gridRect,
      timelineLeft: gridRect.left + LEFT_COL_WIDTH,
      scrollTop: grid.scrollTop,
      scrollLeft: grid.scrollLeft,
    }
  }, [])

  const computeSnap = useCallback(
    (clientX, clientY, feature, mode) => {
      const rects = getRects()
      const rowIndex = features.findIndex((f) => f.id === feature.id)

      if (!rects) {
        return { startWeek: feature.startWeek, rowIndex }
      }

      const snappedRow = rowFromPointerY(
        clientY,
        rects.gridRect,
        rects.scrollTop,
        features.length,
      )

      const snappedWeek =
        mode === 'bar'
          ? weekFromPointerX(
              clientX,
              { left: rects.timelineLeft },
              rects.scrollLeft,
              feature.duration,
              TOTAL_WEEKS,
            )
          : feature.startWeek

      return { startWeek: snappedWeek, rowIndex: snappedRow }
    },
    [features, getRects],
  )

  const beginDrag = useCallback(
    (e, featureId, mode) => {
      if (e.button !== 0) return

      const feature = features.find((f) => f.id === featureId)
      if (!feature) return

      const rowIndex = features.findIndex((f) => f.id === featureId)
      const targetRect = e.currentTarget.getBoundingClientRect()

      pendingRef.current = {
        featureId,
        mode,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        grabOffsetX: e.clientX - targetRect.left,
        grabOffsetY: e.clientY - targetRect.top,
        originStartWeek: feature.startWeek,
        originRowIndex: rowIndex,
        feature,
      }
    },
    [features],
  )

  useEffect(() => {
    const onPointerMove = (e) => {
      const pending = pendingRef.current

      if (!drag && pending) {
        if (e.pointerId !== pending.pointerId) return

        const dx = e.clientX - pending.startClientX
        const dy = e.clientY - pending.startClientY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return

        const snap = computeSnap(e.clientX, e.clientY, pending.feature, pending.mode)
        const rects = getRects()
        setDrag({
          ...pending,
          clientX: e.clientX,
          clientY: e.clientY,
          snapStartWeek: snap.startWeek,
          snapRowIndex: snap.rowIndex,
          snapViewport: rects
            ? snapToViewport(rects, snap.startWeek, snap.rowIndex, pending.feature.duration)
            : null,
        })
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        return
      }

      if (!drag || e.pointerId !== drag.pointerId) return

      const snap = computeSnap(e.clientX, e.clientY, drag.feature, drag.mode)
      const rects = getRects()
      setDrag((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              snapStartWeek: snap.startWeek,
              snapRowIndex: snap.rowIndex,
              snapViewport: rects
                ? snapToViewport(rects, snap.startWeek, snap.rowIndex, prev.feature.duration)
                : null,
            }
          : null,
      )
    }

    const finishDrag = (e) => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      if (drag && e.pointerId === drag.pointerId) {
        const { featureId, mode, originStartWeek, originRowIndex, feature } = drag
        const snap = computeSnap(e.clientX, e.clientY, feature, mode)
        const moved =
          snap.startWeek !== originStartWeek || snap.rowIndex !== originRowIndex

        setFeatures((prev) => {
          const next = [...prev]
          const fromIndex = next.findIndex((f) => f.id === featureId)
          if (fromIndex === -1) return prev

          const updated = {
            ...next[fromIndex],
            startWeek: snap.startWeek,
            ...(moved
              ? {
                  moved: true,
                  deviation:
                    next[fromIndex].deviation ??
                    Math.max(1, Math.abs(snap.startWeek - originStartWeek)),
                }
              : {}),
          }

          next.splice(fromIndex, 1)
          const insertAt = Math.max(0, Math.min(snap.rowIndex, next.length))
          next.splice(insertAt, 0, updated)
          return next
        })

        setDrag(null)
        pendingRef.current = null
        return
      }

      const pending = pendingRef.current
      if (pending && e.pointerId === pending.pointerId) {
        pendingRef.current = null
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
    }
  }, [drag, computeSnap, setFeatures, getRects])

  return { gridRef, drag, beginDrag, barWidth, barLeft, BAR_HEIGHT }
}

export { LEFT_COL_WIDTH, ROW_HEIGHT, TOTAL_WEEKS, WEEK_WIDTH, BAR_HEIGHT }
