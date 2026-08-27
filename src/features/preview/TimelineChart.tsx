import type { KeyboardEvent } from 'react'
import type { YearEntry } from '../../types/timeline'
import { getSwatchTextColor } from '../../utils/color'
import {
  AXIS_WIDTH,
  computeLaneSegments,
  getVisibleYears,
  LANE_WIDTH,
} from '../../utils/timelineLayout'

const MIN_ROW_HEIGHT = 58

interface TimelineChartProps {
  years: YearEntry[]
  /** 実際に使われているレーン数（getUsedLaneCountの戻り値）。グリッドの列数に使う */
  laneCount: number
  /**
   * ブロックをタップ／クリックしたときに、その項目のIDを渡して呼ばれる。
   * 「プレビューで気づいて直したいのに、入力フォームへ戻るのが面倒」という
   * 声を受け、タップした項目の入力欄（コメント欄）へジャンプする用途を想定
   * している（詳細は7章参照）。渡さなければブロックはただの表示のまま。
   */
  onItemClick?: (itemId: string) => void
}

/**
 * 年表本体。左端に年の目盛り、右側に実使用レーン数ぶんの作品ブロックを配置する。
 * 複数年にまたがる項目は、CSS Gridの行スパンでレーンをまたがず縦に連続した
 * 1つのブロックとして描画する（線でつながって見える表現）。
 * レーンは固定px幅（LANE_WIDTH）で、列数はlaneCountに応じて可変にする。
 * これにより、使用レーン数が少ないときにカード全体の横幅も自動的に狭まる
 * （PreviewPanel側でgetChartWidth(laneCount)を使って外枠の幅を合わせている）。
 */
export function TimelineChart({
  years,
  laneCount,
  onItemClick,
}: TimelineChartProps) {
  const visibleYears = getVisibleYears(years)

  if (visibleYears.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
        <p className="font-kaku text-sm text-[#A79FC2]">
          年ごとにハマったものやコメントを入力すると
          <br />
          ここに年表が表示されるよ
        </p>
      </div>
    )
  }

  const segments = computeLaneSegments(visibleYears)

  return (
    <div
      className="grid gap-x-[10px] gap-y-0"
      style={{
        gridTemplateColumns: `${AXIS_WIDTH}px repeat(${laneCount}, ${LANE_WIDTH}px)`,
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
            className="absolute rounded-full"
            style={{
              left: 1.5,
              top: 2,
              width: 7,
              height: 7,
              backgroundColor: '#A79FC2',
            }}
          />
          <span className="font-kaku ml-4 text-[12px] font-bold text-[#8D7FA8]">
            {entry.year}
          </span>
        </div>
      ))}

      {segments.map((segment) => (
        <div
          key={`${segment.lane}-${segment.startIndex}-${segment.item.id}`}
          className={`flex flex-col items-start gap-[3px] overflow-hidden rounded-[3px] px-3 py-2 ${onItemClick ? 'cursor-pointer transition hover:brightness-95 active:brightness-90' : ''}`}
          style={{
            gridColumn: segment.lane + 2,
            gridRow: `${segment.startIndex + 1} / span ${segment.length}`,
            margin: '6px 0 4px',
            // 枠線は使わず、パステルの塗り色だけで白背景から浮き立たせる
            backgroundColor: segment.item.color,
            color: getSwatchTextColor(segment.item.color),
          }}
          {...(onItemClick
            ? {
                role: 'button',
                tabIndex: 0,
                'aria-label': `${segment.item.title}を編集`,
                onClick: () => onItemClick(segment.item.id),
                onKeyDown: (e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onItemClick(segment.item.id)
                  }
                },
              }
            : {})}
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
