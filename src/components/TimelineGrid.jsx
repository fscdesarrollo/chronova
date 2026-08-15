import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeatureBarRow, FeatureLabelRow } from './FeatureRow'
import FeaturePanelHeader from './FeaturePanelHeader'
import TeamSectionHeader from './TeamSectionHeader'
import TimelineHeader from './TimelineHeader'
import { TodayBodyLine, TimelineMarkerBodyLine } from './TimelineMarkers'
import { useFeatureDrag, ROW_HEIGHT } from '../hooks/useFeatureDrag'
import { useLeftColResize } from '../hooks/useLeftColResize'
import { DAY_WIDTH, LEFT_COL_COLLAPSED_WIDTH, SECTION_ROW_HEIGHT, WEEK_WIDTH } from '../constants'
import { loadTimelineView, saveTimelineView } from '../utils/storage'
import {
  getDateTimelinePosition,
  getTodayTimelinePosition,
  scrollLeftForToday,
} from '../utils/weekCalendar'
import { daysBetween, DYNAMIC_CALENDAR } from '../utils/dynamicCalendar'
import { rowHeightFor } from '../utils/timelineLayout'
import { buildGroupedMarkerLayout } from '../utils/markerGroups'
import { evaluateFormattingRules } from '../utils/formattingRules'
import { getDependencyRelatedIds } from '../utils/dependencies'
import { filterTimelineRowsBySearch } from '../utils/timelineSearch'

function rowHeight(row) {
  return rowHeightFor(row)
}

export default function TimelineGrid({
  projectId,
  calendar,
  timelineRows,
  timelineRowsExpanded = timelineRows,
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
  highlightProductId = null,
  emptyMessage = 'No features yet. Use "Add Feature" to get started.',
  onExtendRange,
}) {
  const weekCalendar = calendar?.weeks ?? []
  const totalWeeks = calendar?.totalWeeks ?? 0
  const totalWidth = calendar?.totalWidth
    ?? weekCalendar.reduce((s, w) => s + (w.width ?? WEEK_WIDTH), 0)
  const effectiveColWidth = leftColCollapsed ? LEFT_COL_COLLAPSED_WIDTH : leftColWidth
  const leftBodyRef = useRef(null)
  const headerScrollRef = useRef(null)
  const scrollSyncRef = useRef(false)
  const scrollInitializedRef = useRef(false)
  const suppressScrollTrackingRef = useRef(false)
  const shouldPersistViewRef = useRef(false)
  const extendingRangeRef = useRef(false)
  const prevRangeStartRef = useRef(null)
  const scrollPositionRef = useRef({ scrollLeft: 0, scrollTop: 0 })
  const [expandedMarkerDates, setExpandedMarkerDates] = useState(() => new Set())
  const [featureSearchQuery, setFeatureSearchQuery] = useState('')
  const searchInputRef = useRef(null)

  const displayRows = useMemo(() => {
    const trimmed = featureSearchQuery.trim()
    if (!trimmed) return timelineRows
    return filterTimelineRowsBySearch(timelineRowsExpanded, trimmed)
  }, [featureSearchQuery, timelineRows, timelineRowsExpanded])

  const { gridRef, rowsRef, drag, beginDrag } = useFeatureDrag(
    displayRows,
    onMove,
    0,
    calendar,
  )
  const { startResize } = useLeftColResize({
    onWidthChange: onLeftColWidthChange,
    onCollapsedChange: (next) => {
      if (next) onToggleLeftColCollapsed(true)
      else onToggleLeftColCollapsed(false)
    },
  })

  const todayPosition = useMemo(
    () => getTodayTimelinePosition(weekCalendar, WEEK_WIDTH),
    [weekCalendar],
  )

  const markerGroups = useMemo(
    () => buildGroupedMarkerLayout(markers, weekCalendar, WEEK_WIDTH),
    [markers, weekCalendar],
  )

  const dependencyFocusIds = useMemo(() => {
    if (!selectedFeatureId) return null
    return getDependencyRelatedIds(selectedFeatureId, allFeatures)
  }, [selectedFeatureId, allFeatures])

  const productFocusIds = useMemo(() => {
    if (!highlightProductId) return null
    return new Set(
      allFeatures
        .filter((f) => f.projectId === projectId && f.productId === highlightProductId)
        .map((f) => f.id),
    )
  }, [highlightProductId, allFeatures, projectId])

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
    [applyScroll, gridRef, weekCalendar],
  )

  useEffect(() => {
    scrollInitializedRef.current = false
    shouldPersistViewRef.current = false
    scrollPositionRef.current = { scrollLeft: 0, scrollTop: 0 }
    prevRangeStartRef.current = null
    setExpandedMarkerDates(new Set())
    setFeatureSearchQuery('')
  }, [projectId])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !calendar?.rangeStart) return

    const prevStart = prevRangeStartRef.current
    if (prevStart && calendar.rangeStart < prevStart) {
      const daysAdded = daysBetween(calendar.rangeStart, prevStart)
      applyScroll(grid.scrollLeft + daysAdded * DAY_WIDTH, grid.scrollTop)
      shouldPersistViewRef.current = true
    }
    prevRangeStartRef.current = calendar.rangeStart
  }, [calendar?.rangeStart, applyScroll, gridRef])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || scrollInitializedRef.current) return

    const saved = loadTimelineView(projectId)
    if (saved) {
      shouldPersistViewRef.current = true
      applyScroll(saved.scrollLeft, saved.scrollTop)
    } else {
      const scrollLeft = scrollLeftForToday(weekCalendar, WEEK_WIDTH, grid.clientWidth, 0)
      applyScroll(scrollLeft, 0)
    }

    scrollInitializedRef.current = true
  }, [projectId, applyScroll, gridRef, weekCalendar])

  const maybeExtendRange = useCallback(() => {
    const grid = gridRef.current
    if (!grid || !onExtendRange || extendingRangeRef.current) return

    const { scrollLeft, clientWidth, scrollWidth } = grid
    const threshold = DYNAMIC_CALENDAR.EDGE_THRESHOLD_PX

    if (scrollLeft < threshold) {
      extendingRangeRef.current = true
      onExtendRange('past', DYNAMIC_CALENDAR.SCROLL_CHUNK_DAYS)
      requestAnimationFrame(() => {
        extendingRangeRef.current = false
      })
    } else if (scrollLeft + clientWidth > scrollWidth - threshold) {
      extendingRangeRef.current = true
      onExtendRange('future', DYNAMIC_CALENDAR.SCROLL_CHUNK_DAYS)
      requestAnimationFrame(() => {
        extendingRangeRef.current = false
      })
    }
  }, [gridRef, onExtendRange])

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

    maybeExtendRange()
    syncScrollTop(gridRef.current, leftBodyRef.current)
  }, [gridRef, syncScrollTop, syncHeaderScrollLeft, maybeExtendRange])

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
  const timelineWidth = totalWidth
  const bodyMinHeight = displayRows.reduce((sum, row) => sum + rowHeight(row), 0)
  const hasFeatureRows = displayRows.some((row) => row.type === 'feature')
  const panelEmptyMessage = featureSearchQuery.trim()
    ? `No features match "${featureSearchQuery.trim()}".`
    : emptyMessage

  const getRowVisualState = (featureId) => {
    if (dependencyFocusIds) {
      return { isDimmed: !dependencyFocusIds.has(featureId) }
    }
    if (productFocusIds) {
      return { isDimmed: !productFocusIds.has(featureId) }
    }
    return { isDimmed: false }
  }

  return (
    <div data-timeline-split className="relative z-0 flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-stretch">
        <div style={{ width: effectiveColWidth }}>
          <FeaturePanelHeader
            collapsed={leftColCollapsed}
            onToggle={() => onToggleLeftColCollapsed()}
            onCollapseAll={onCollapseAllSections}
            onExpandAll={onExpandAllSections}
            searchQuery={featureSearchQuery}
            onSearchChange={setFeatureSearchQuery}
            searchInputRef={searchInputRef}
          />
        </div>
        <div
          ref={headerScrollRef}
          className="min-w-0 flex-1 overflow-hidden"
          aria-hidden
        >
          <TimelineHeader
            calendar={calendar}
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
              {displayRows.map((row) => {
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
              {!leftColCollapsed && !hasFeatureRows && (
                <div className="flex items-center justify-center border-r border-gray-200 px-4 py-16 text-center text-sm text-gray-400">
                  {panelEmptyMessage}
                </div>
              )}
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
              {displayRows.map((row) => {
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
                    totalWidth={totalWidth}
                    units={weekCalendar}
                    dragStyle={drag?.featureId === feature.id ? drag.barStyle : null}
                    onBarPointerDown={(e) => beginDrag(e, feature.id, 'bar', e.currentTarget)}
                    onSelect={() => onSelectFeature(feature.id)}
                  />
                )
              })}

              {!hasFeatureRows && (
                <div className="flex items-center justify-center py-16 text-sm text-gray-400">
                  {panelEmptyMessage}
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
