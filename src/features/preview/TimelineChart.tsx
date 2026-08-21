import type { YearEntry } from '../../types/timeline'
import { MAX_ITEMS_PER_YEAR } from '../../constants/timeline'
import {
  computeLaneSegments,
  getVisibleYears,
} from '../../utils/timelineLayout'

const AXIS_WIDTH = 52
const MIN_ROW_HEIGHT = 68

interface TimelineChartProps {
  years: YearEntry[]
}

/**
 * 年表本体。左端に年の目盛り、右側に最大3レーンの作品ブロックを配置する。
 * 複数年にまたがる項目は、CSS Gridの行スパンでレーンをまたがず縦に連続した
 * 1つのブロックとして描画する（線でつながって見える表現）。
 */
export function TimelineChart({ years }: TimelineChartProps) {
  const visibleYears = getVisibleYears(years)

  if (visibleYears.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
        <p className="text-sm text-[#9089A0]">
          年ごとに作品やコメントを入力すると
          <br />
          ここに年表が表示されます
        </p>
      </div>
    )
  }

  const segments = computeLaneSegments(visibleYears)

  return (
    <div
      className="grid gap-x-2 gap-y-2"
      style={{
        gridTemplateColumns: `${AXIS_WIDTH}px repeat(${MAX_ITEMS_PER_YEAR}, 1fr)`,
        gridTemplateRows: `repeat(${visibleYears.length}, minmax(${MIN_ROW_HEIGHT}px, auto))`,
      }}
    >
      {visibleYears.map((entry, index) => (
        <div
          key={entry.year}
          className="flex items-start gap-1.5 pt-1"
          style={{ gridColumn: 1, gridRow: index + 1 }}
        >
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#C7BFDA]" />
          <span className="text-[11px] font-medium text-[#B0A8C2]">
            {entry.year}
          </span>
        </div>
      ))}

      {segments.map((segment) => (
        <div
          key={`${segment.lane}-${segment.startIndex}-${segment.item.id}`}
          className="flex flex-col items-start justify-start overflow-hidden rounded-2xl border px-3 py-2 shadow-[0_2px_6px_rgba(80,60,100,0.08)]"
          style={{
            gridColumn: segment.lane + 2,
            gridRow: `${segment.startIndex + 1} / span ${segment.length}`,
            backgroundColor: segment.item.color,
            borderColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <p className="w-full text-left text-sm leading-snug font-bold break-words text-[#2B2735]">
            {segment.item.title}
          </p>
          {segment.item.comment && (
            <p className="mt-0.5 w-full text-left text-[11px] leading-snug break-words text-[#2B2735]/60">
              {segment.item.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
