import { useEffect } from 'react'
import FeatureRow from './FeatureRow'
import TimelineHeader from './TimelineHeader'
import DragGhost, { WeekHighlight } from './DragGhost'
import { useFeatureDrag, LEFT_COL_WIDTH, ROW_HEIGHT, WEEK_WIDTH } from '../hooks/useFeatureDrag'
import { CURRENT_PI_START_WEEK, TOTAL_WEEKS } from '../data'

export default function TimelineGrid({ features, setFeatures }) {
  const { gridRef, drag, beginDrag, barWidth, barLeft, BAR_HEIGHT } = useFeatureDrag(
    features,
    setFeatures,
  )

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    el.scrollLeft = CURRENT_PI_START_WEEK * WEEK_WIDTH
  }, [gridRef])

  const contentWidth = LEFT_COL_WIDTH + TOTAL_WEEKS * WEEK_WIDTH

  return (
    <>
      <div ref={gridRef} className="relative min-h-0 flex-1 overflow-auto bg-white">
        <div style={{ width: contentWidth, minHeight: features.length * ROW_HEIGHT }}>
          <TimelineHeader />

          <div className="relative">
            <WeekHighlight
              drag={drag}
              barWidth={barWidth}
              barLeft={barLeft}
              leftColWidth={LEFT_COL_WIDTH}
              rowHeight={ROW_HEIGHT}
              barHeight={BAR_HEIGHT}
            />

            {features.map((feature) => (
              <FeatureRow
                key={feature.id}
                feature={feature}
                isDragging={drag?.featureId === feature.id}
                dragMode={drag?.mode}
                onBarPointerDown={(e) => beginDrag(e, feature.id, 'bar')}
                onRowPointerDown={(e) => beginDrag(e, feature.id, 'row')}
              />
            ))}
          </div>
        </div>
      </div>

      <DragGhost drag={drag} />
    </>
  )
}
