import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureBarRow, FeatureLabelRow } from './FeatureRow'
import FeaturePanelHeader from './FeaturePanelHeader'
import TeamSectionHeader from './TeamSectionHeader'
import TimelineHeader from './TimelineHeader'
import { TodayBodyLine, TimelineMarkerBodyLine } from './TimelineMarkers'
import { useFeatureDrag, ROW_HEIGHT } from '../hooks/useFeatureDrag'
import { useLeftColResize } from '../hooks/useLeftColResize'
import { CURRENT_PI_START_WEEK, TOTAL_WEEKS, weekCalendar } from '../data'
import { LEFT_COL_COLLAPSED_WIDTH, SECTION_ROW_HEIGHT, WEEK_WIDTH } from '../constants'
import { loadTimelineView, saveTimelineView } from '../utils/storage'
import {
  getDateTimelinePosition,
  getTodayTimelinePosition,
  scrollLeftForToday,
} from '../utils/weekCalendar'
import { rowHeightFor } from '../utils/timelineLayout'
import { buildGroupedMarkerLayout } from '../utils/markerGroups'
import { evaluateFormattingRules } from '../utils/formattingRules'
import { getDependencyRelatedIds } from '../utils/dependencies'

function rowHeight(row) {
  return rowHeightFor(row)
}

export default function TimelineGrid({
  projectId,
  timelineRows,
  allFeatures = [],
  markers = [],
  formattingRules = [],
  scrollToDate,
  onScrollToDateHandled,
  leftColWidth,
  leftColCollapsed,
  onLeftColWidthChange,
  onToggleLeftColCollapsed,
  onToggleSectionCollapsed,
  onCollapseAllSections,
  onExpandAllSections,
  onMove,
  selectedFeatureId,
  onSelectFeature,
  onDeselectFeature,
}) {
  const effectiveColWidth = leftColCollapsed ? LEFT_COL_COLLAPSED_WIDTH : leftColWidth
  const leftBodyRef = useRef(null)
  const headerScrollRef = useRef(null)
  const scrollSyncRef = useRef(false)
  const scrollInitializedRef = useRef(false)
  const suppressScrollTrackingRef = useRef(false)
  const shouldPersistViewRef = useRef(false)
  const scrollPositionRef = useRef({ scrollLeft: 0, scrollTop: 0 })
  const [expandedMarkerDates, setExpandedMarkerDates] = useState(() => new Set())

  const { gridRef, rowsRef, drag, beginDrag } = useFeatureDrag(timelineRows, onMove, 0)
  const { startResize } = useLeftColResize({
    onWidthChange: onLeftColWidthChange,
    onCollapsedChange: (next) => {
      if (next) onToggleLeftColCollapsed(true)
      else onToggleLeftColCollapsed(false)
    },
  })

  const todayPosition = useMemo(
    () => getTodayTimelinePosition(weekCalendar, WEEK_WIDTH),
    [],
  )

  const markerGroups = useMemo(
    () => buildGroupedMarkerLayout(markers, weekCalendar, WEEK_WIDTH),
    [markers],
  )

  const dependencyFocusIds = useMemo(() => {
    if (!selectedFeatureId) return null
    return getDependencyRelatedIds(selectedFeatureId, allFeatures)
  }, [selectedFeatureId, allFeatures])

  const toggleMarkerGroup = useCallback((date) => {
    setExpandedMarkerDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }, [])

  const syncHeaderScrollLeft = useCallback((scrollLeft) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft
    }
  }, [])

  const applyScroll = useCallback((scrollLeft, scrollTop) => {
    const grid = gridRef.current
    const leftBody = leftBodyRef.current
    if (!grid) return

    suppressScrollTrackingRef.current = true
    grid.scrollLeft = scrollLeft
    grid.scrollTop = scrollTop
    syncHeaderScrollLeft(scrollLeft)
    if (leftBody) leftBody.scrollTop = scrollTop
    scrollPositionRef.current = { scrollLeft, scrollTop }

    requestAnimationFrame(() => {
      suppressScrollTrackingRef.current = false
    })
  }, [gridRef, syncHeaderScrollLeft])

  const scrollToDatePosition = useCallback(
    (isoDate) => {
      const grid = gridRef.current
      if (!grid || !isoDate) return
      const pos = getDateTimelinePosition(weekCalendar, WEEK_WIDTH, isoDate)
      if (pos == null) return
      applyScroll(Math.max(0, pos - grid.clientWidth / 2), grid.scrollTop)
      shouldPersistViewRef.current = true
    },
    [applyScroll, gridRef],
  )

  useEffect(() => {
    scrollInitializedRef.current = false
    shouldPersistViewRef.current = false
    scrollPositionRef.current = { scrollLeft: 0, scrollTop: 0 }
    setExpandedMarkerDates(new Set())
  }, [projectId])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || scrollInitializedRef.current) return

    const saved = loadTimelineView(projectId)
    if (saved) {
      shouldPersistViewRef.current = true
      applyScroll(saved.scrollLeft, saved.scrollTop)
    } else {
      const fallback = CURRENT_PI_START_WEEK * WEEK_WIDTH
      const scrollLeft = scrollLeftForToday(
        weekCalendar,
        WEEK_WIDTH,
        grid.clientWidth,
        fallback,
      )
      applyScroll(scrollLeft, 0)
    }

    scrollInitializedRef.current = true
  }, [projectId, applyScroll, gridRef])

  useEffect(() => {
    if (!scrollToDate) return
    scrollToDatePosition(scrollToDate)
    onScrollToDateHandled?.()
  }, [scrollToDate, scrollToDatePosition, onScrollToDateHandled])

  useEffect(() => {
    return () => {
      if (!shouldPersistViewRef.current) return
      saveTimelineView(projectId, scrollPositionRef.current)
    }
  }, [projectId])

  const syncScrollTop = useCallback((source, target) => {
    if (!source || !target || scrollSyncRef.current) return
    scrollSyncRef.current = true
    target.scrollTop = source.scrollTop
    scrollSyncRef.current = false
  }, [])

  const handleLeftScroll = useCallback(() => {
    syncScrollTop(leftBodyRef.current, gridRef.current)
  }, [gridRef, syncScrollTop])

  const handleRightScroll = useCallback(() => {
    const grid = gridRef.current
    if (grid) {
      scrollPositionRef.current = {
        scrollLeft: grid.scrollLeft,
        scrollTop: grid.scrollTop,
      }
      syncHeaderScrollLeft(grid.scrollLeft)
    }

    if (!suppressScrollTrackingRef.current) {
      shouldPersistViewRef.current = true
    }

    syncScrollTop(gridRef.current, leftBodyRef.current)
  }, [gridRef, syncScrollTop, syncHeaderScrollLeft])

  const handleBackgroundPointerDown = useCallback(
    (e) => {
      if (drag) return
      if (e.target.closest('[data-feature-interactive]')) return
      if (e.target.closest('[role="separator"]')) return
      if (selectedFeatureId) onDeselectFeature?.()
    },
    [drag, selectedFeatureId, onDeselectFeature],
  )

  const showFullNames = !leftColCollapsed && leftColWidth >= 340
  const timelineWidth = TOTAL_WEEKS * WEEK_WIDTH
  const bodyMinHeight = timelineRows.reduce((sum, row) => sum + rowHeight(row), 0)

  const getRowVisualState = (featureId) => {
    if (!dependencyFocusIds) return { isDimmed: false }
    return { isDimmed: !dependencyFocusIds.has(featureId) }
  }

  return (
    <div data-timeline-split className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-stretch">
        <div style={{ width: effectiveColWidth }}>
          <FeaturePanelHeader
            collapsed={leftColCollapsed}
            onToggle={() => onToggleLeftColCollapsed()}
            onCollapseAll={onCollapseAllSections}
            onExpandAll={onExpandAllSections}
          />
        </div>
        <div
          ref={headerScrollRef}
          className="min-w-0 flex-1 overflow-hidden"
          aria-hidden
        >
          <TimelineHeader
            todayPosition={todayPosition}
            markerGroups={markerGroups}
            expandedMarkerDates={expandedMarkerDates}
            onToggleMarkerGroup={toggleMarkerGroup}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          data-feature-panel
          className="relative flex shrink-0 flex-col bg-white"
          style={{ width: effectiveColWidth }}
          onPointerDown={handleBackgroundPointerDown}
        >
          <div
            ref={leftBodyRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            onScroll={handleLeftScroll}
          >
            <div style={{ minHeight: bodyMinHeight }}>
              {timelineRows.map((row) => {
                if (row.type === 'section') {
                  if (leftColCollapsed) {
                    return (
                      <div
                        key={row.id}
                        className="border-b border-r border-gray-200 bg-gray-50"
                        style={{ height: SECTION_ROW_HEIGHT }}
                      />
                    )
                  }
                  return (
                    <TeamSectionHeader
                      key={row.id}
                      label={row.label}
                      count={row.count}
                      alert={row.alert}
                      collapsed={row.collapsed}
                      onToggle={() => onToggleSectionCollapsed?.(row.id)}
                    />
                  )
                }

                const feature = row.feature
                const { isDimmed } = getRowVisualState(feature.id)
                const formatting = evaluateFormattingRules(formattingRules, feature)

                return (
                  <FeatureLabelRow
                    key={feature.id}
                    feature={feature}
                    collapsed={leftColCollapsed}
                    showFullName={showFullNames}
                    isSelected={selectedFeatureId === feature.id}
                    isDragging={drag?.featureId === feature.id}
                    isDimmed={isDimmed}
                    formatting={formatting}
                    onRowPointerDown={(e) => beginDrag(e, feature.id, 'row')}
                    onSelect={() => onSelectFeature(feature.id)}
                  />
                )
              })}
            </div>
          </div>
        </div>

        <div
          ref={gridRef}
          data-timeline-grid
          className="min-w-0 flex-1 overflow-auto bg-white"
          onScroll={handleRightScroll}
          onPointerDown={handleBackgroundPointerDown}
        >
          <div className="relative" style={{ width: timelineWidth, minHeight: bodyMinHeight }}>
            {todayPosition != null && <TodayBodyLine left={todayPosition} />}
            {markerGroups.map((group) => (
              <TimelineMarkerBodyLine
                key={group.date}
                color={group.dominantColor}
                left={group.left}
              />
            ))}

            <div ref={rowsRef} className="relative">
              {timelineRows.map((row) => {
                if (row.type === 'section') {
                  return (
                    <div
                      key={row.id}
                      className="border-b border-gray-200 bg-gray-50"
                      style={{ height: SECTION_ROW_HEIGHT }}
                    />
                  )
                }

                const feature = row.feature
                const { isDimmed } = getRowVisualState(feature.id)
                const formatting = evaluateFormattingRules(formattingRules, feature)

                return (
                  <FeatureBarRow
                    key={feature.id}
                    feature={feature}
                    isSelected={selectedFeatureId === feature.id}
                    isDragging={drag?.featureId === feature.id}
                    isDimmed={isDimmed}
                    formatting={formatting}
                    dragStyle={drag?.featureId === feature.id ? drag.barStyle : null}
                    onBarPointerDown={(e) => beginDrag(e, feature.id, 'bar', e.currentTarget)}
                    onSelect={() => onSelectFeature(feature.id)}
                  />
                )
              })}

              {timelineRows.filter((r) => r.type === 'feature').length === 0 && (
                <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                  No features yet. Use &quot;Add Feature&quot; to get started.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize feature panel"
        onPointerDown={startResize}
        className="absolute bottom-0 top-0 z-30 w-2 -translate-x-1/2 cursor-col-resize hover:bg-violet-400/40 active:bg-violet-500/50"
        style={{ left: effectiveColWidth }}
      />
    </div>
  )
}
