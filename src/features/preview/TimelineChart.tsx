import type { YearEntry } from '../../types/timeline'
import { MAX_ITEMS_PER_YEAR } from '../../constants/timeline'
import { getSwatchTextColor } from '../../utils/color'
import {
  computeLaneSegments,
  getVisibleYears,
} from '../../utils/timelineLayout'

const AXIS_WIDTH = 32
const MIN_ROW_HEIGHT = 58

/** 年の目盛りは脇役として、下2桁＋アポストロフィの略記にする（例: 2026 → '26） */
function formatYearAbbrev(year: number): string {
  return `'${String(year).slice(-2)}`
}

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
        <p className="font-kaku text-sm text-[#A79FC2]">
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
      className="grid gap-x-[10px] gap-y-0"
      style={{
        gridTemplateColumns: `${AXIS_WIDTH}px repeat(${MAX_ITEMS_PER_YEAR}, 1fr)`,
        gridTemplateRows: `repeat(${visibleYears.length}, minmax(${MIN_ROW_HEIGHT}px, auto))`,
      }}
    >
      {/* 年軸を貫く縦の点線（サブウェイマップの本線のような表現） */}
      <div
        aria-hidden
        className="rounded-full"
        style={{
          gridColumn: 1,
          gridRow: `1 / ${visibleYears.length + 1}`,
          marginTop: 4,
          marginBottom: 4,
          marginLeft: 5,
          width: 2,
          background:
            'repeating-linear-gradient(to bottom, #A79FC2 0 4px, transparent 4px 9px)',
        }}
      />

      {visibleYears.map((entry, index) => (
        <div
          key={entry.year}
          className="relative flex items-start"
          style={{ gridColumn: 1, gridRow: index + 1, paddingTop: 2 }}
        >
          <span
            className="absolute rounded-full bg-white"
            style={{
              left: 1.5,
              top: 2,
              width: 7,
              height: 7,
              border: '2px solid #C9C2DE',
            }}
          />
          <span className="font-kaku ml-4 text-[10px] font-bold text-[#A79FC2]">
            {formatYearAbbrev(entry.year)}
          </span>
        </div>
      ))}

      {segments.map((segment) => (
        <div
          key={`${segment.lane}-${segment.startIndex}-${segment.item.id}`}
          className="flex flex-col items-start gap-[3px] overflow-hidden rounded-2xl px-3 py-2"
          style={{
            gridColumn: segment.lane + 2,
            gridRow: `${segment.startIndex + 1} / span ${segment.length}`,
            margin: '6px 0 4px',
            backgroundColor: segment.item.color,
            color: getSwatchTextColor(segment.item.color),
            // box-shadow（ぼかしあり）はiOS Safari上のhtml-to-image書き出しで
            // ぼけずに硬い矩形として描画されてしまう既知の相性問題があるため使わない。
            // 枠線の濃さで代わりに立体感を出す。
            border: '1.75px solid rgba(74,69,96,0.18)',
          }}
        >
          <p className="font-kaku w-full text-left text-[13px] leading-[1.3] font-bold break-words">
            {segment.item.title}
          </p>
          {segment.item.comment && (
            <p className="font-kaku w-full text-left text-[10.5px] leading-[1.3] font-semibold break-words opacity-[0.68]">
              {segment.item.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
