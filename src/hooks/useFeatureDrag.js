import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BAR_PADDING,
  LEFT_COL_WIDTH,
  ROW_HEIGHT,
  WEEK_WIDTH,
  clampWeek,
} from '../constants'
import { TOTAL_WEEKS, weekCalendar } from '../data'
import { weekIndexToDates } from '../utils/weekCalendar'
import {
  rowHeightFor,
  visualRowIndexFromY,
  visualRowTop,
} from '../utils/timelineLayout'

const DRAG_THRESHOLD = 4
const BAR_HEIGHT = 28
const RESIZE_HANDLE_WIDTH = 8

function barWidthPx(duration) {
  return duration * WEEK_WIDTH - BAR_PADDING * 2
}

function barLeftPx(startWeek) {
  return startWeek * WEEK_WIDTH + BAR_PADDING
}

function clampVisualRow(row, rowCount) {
  return Math.max(0, Math.min(row, rowCount - 1))
}

function barFixedStyle(rects, startWeek, visualRowIndex, duration, timelineRows, leftColWidth) {
  const rowTop = visualRowTop(timelineRows, visualRowIndex)
  const left = rects.gridRect.left + leftColWidth + barLeftPx(startWeek) - rects.scrollLeft
  const top =
    rects.gridRect.top +
    rects.rowsOffsetTop +
    rowTop +
    (rowHeightFor(timelineRows[visualRowIndex] ?? { type: 'feature' }) - BAR_HEIGHT) / 2 -
    rects.scrollTop

  return {
    position: 'fixed',
    left,
    top,
    width: barWidthPx(duration),
    height: BAR_HEIGHT,
    zIndex: 9999,
  }
}

function getDragMode(e, barElement) {
  if (!barElement) return 'bar'
  const rect = barElement.getBoundingClientRect()
  const relX = e.clientX - rect.left
  if (relX <= RESIZE_HANDLE_WIDTH) return 'resize-start'
  if (relX >= rect.width - RESIZE_HANDLE_WIDTH) return 'resize-end'
  return 'bar'
}

export function useFeatureDrag(timelineRows, onMove, leftColWidth = LEFT_COL_WIDTH) {
  const gridRef = useRef(null)
  const rowsRef = useRef(null)
  const pendingRef = useRef(null)
  const [drag, setDrag] = useState(null)

  const featureRows = timelineRows.filter((r) => r.type === 'feature')
  const rowCount = timelineRows.length

  const getRects = useCallback(() => {
    const grid = gridRef.current
    const rows = rowsRef.current
    if (!grid || !rows) return null
    const gridRect = grid.getBoundingClientRect()
    return {
      gridRect,
      rowsOffsetTop: rows.offsetTop,
      timelineLeft: gridRect.left + leftColWidth,
      scrollTop: grid.scrollTop,
      scrollLeft: grid.scrollLeft,
    }
  }, [leftColWidth])

  const pointerYToVisualRow = useCallback(
    (clientY) => {
      const rects = getRects()
      if (!rects) return 0
      const y =
        clientY - rects.gridRect.top + rects.scrollTop - rects.rowsOffsetTop
      return visualRowIndexFromY(timelineRows, y)
    },
    [getRects, timelineRows],
  )

  const computeSnap = useCallback(
    (clientX, clientY, feature, mode, origin) => {
      const rects = getRects()
      const duration = feature.duration
      const originVisualRow = origin?.originVisualRowIndex ?? 0
      const fallbackVisualRow = originVisualRow

      if (!rects || !origin) {
        return {
          startWeek: feature.startWeek,
          endWeek: feature.startWeek + duration - 1,
          visualRowIndex: fallbackVisualRow,
        }
      }

      const pointerWeek = Math.round(
        (clientX - rects.timelineLeft + rects.scrollLeft - BAR_PADDING) / WEEK_WIDTH,
      )

      if (mode === 'row') {
        const targetRow = pointerYToVisualRow(clientY)
        return {
          startWeek: origin.originStartWeek,
          endWeek: origin.originEndWeek,
          visualRowIndex: clampVisualRow(targetRow, rowCount),
        }
      }

      if (mode === 'resize-start') {
        const endWeek = origin.originEndWeek
        const startWeek = Math.max(0, Math.min(pointerWeek, endWeek))
        return { startWeek, endWeek, visualRowIndex: origin.originVisualRowIndex }
      }

      if (mode === 'resize-end') {
        const startWeek = origin.originStartWeek
        const endWeek = Math.max(startWeek, Math.min(pointerWeek, TOTAL_WEEKS - 1))
        return { startWeek, endWeek, visualRowIndex: origin.originVisualRowIndex }
      }

      const deltaWeeks = Math.round((clientX - origin.startClientX) / WEEK_WIDTH)
      const targetRow = pointerYToVisualRow(clientY)
      const startWeek = clampWeek(
        origin.originStartWeek + deltaWeeks,
        duration,
        TOTAL_WEEKS,
      )
      return {
        startWeek,
        endWeek: startWeek + duration - 1,
        visualRowIndex: clampVisualRow(targetRow, rowCount),
      }
    },
    [getRects, pointerYToVisualRow, rowCount],
  )

  const beginDrag = useCallback(
    (e, featureId, mode, barElement) => {
      if (e.button !== 0) return

      const featureRow = featureRows.find((r) => r.feature.id === featureId)
      if (!featureRow) return

      const feature = featureRow.feature
      const visualRowIndex = timelineRows.findIndex(
        (r) => r.type === 'feature' && r.feature.id === featureId,
      )
      const resolvedMode = mode === 'bar' ? getDragMode(e, barElement ?? e.currentTarget) : mode

      pendingRef.current = {
        featureId,
        mode: resolvedMode,
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originStartWeek: feature.startWeek,
        originEndWeek: feature.startWeek + feature.duration - 1,
        originVisualRowIndex: visualRowIndex,
        feature,
      }
    },
    [featureRows, timelineRows],
  )

  const buildDragState = useCallback(
    (base, clientX, clientY) => {
      const snap = computeSnap(clientX, clientY, base.feature, base.mode, base)
      const duration = snap.endWeek - snap.startWeek + 1
      const rects = getRects()
      return {
        ...base,
        clientX,
        clientY,
        snapStartWeek: snap.startWeek,
        snapEndWeek: snap.endWeek,
        snapVisualRowIndex: snap.visualRowIndex,
        snapDuration: duration,
        barStyle: rects
          ? barFixedStyle(
              rects,
              snap.startWeek,
              snap.visualRowIndex,
              duration,
              timelineRows,
              leftColWidth,
            )
          : null,
      }
    },
    [computeSnap, getRects, leftColWidth, timelineRows],
  )

  useEffect(() => {
    const onPointerMove = (e) => {
      const pending = pendingRef.current

      if (!drag && pending) {
        if (e.pointerId !== pending.pointerId) return

        const dx = e.clientX - pending.startClientX
        const dy = e.clientY - pending.startClientY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return

        setDrag(buildDragState(pending, e.clientX, e.clientY))
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
        return
      }

      if (!drag || e.pointerId !== drag.pointerId) return
      setDrag(buildDragState(drag, e.clientX, e.clientY))
    }

    const finishDrag = (e) => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      if (drag && e.pointerId === drag.pointerId) {
        const {
          featureId,
          originStartWeek,
          originEndWeek,
          originVisualRowIndex,
          snapStartWeek,
          snapEndWeek,
          snapVisualRowIndex,
        } = drag

        const { startDate, targetDate } = weekIndexToDates(
          weekCalendar,
          snapStartWeek,
          snapEndWeek,
        )

        const positionChanged =
          snapStartWeek !== originStartWeek || snapEndWeek !== originEndWeek
        const rowChanged = snapVisualRowIndex !== originVisualRowIndex

        if (positionChanged || rowChanged) {
          onMove(featureId, startDate, targetDate, rowChanged ? snapVisualRowIndex : null)
        }

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
  }, [drag, onMove, buildDragState])

  return { gridRef, rowsRef, drag, beginDrag, BAR_HEIGHT }
}

export { LEFT_COL_WIDTH, ROW_HEIGHT, TOTAL_WEEKS, WEEK_WIDTH, BAR_HEIGHT }
