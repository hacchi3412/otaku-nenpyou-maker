import { useRef } from 'react'
import type { YearEntry } from '../../types/timeline'
import {
  computeLaneSegments,
  getChartWidth,
  getUsedLaneCount,
  getVisibleYears,
} from '../../utils/timelineLayout'
import { ScaledCanvas } from './ScaledCanvas'
import { ShareButtons } from './ShareButtons'
import { TimelineChart } from './TimelineChart'

interface PreviewPanelProps {
  years: YearEntry[]
}

/**
 * 年表画像のプレビュー。
 * カード自体（枠線・角丸）も含めて画像として書き出す対象なので、
 * それらのスタイルはexportTargetRefのdivに直接持たせている。
 *
 * 装飾は引き算方針: 角丸は最小限、影はほぼ使わない、グラデーションなし、
 * 枠線は本当に必要な箇所だけに絞っている。
 *
 * カード全体の横幅は、実際に使われているレーン数（1〜3）に応じて可変にする。
 * ブロック列が少ないときに右側へ余分な余白ができないようにするため。
 */
export function PreviewPanel({ years }: PreviewPanelProps) {
  const exportTargetRef = useRef<HTMLDivElement>(null)

  const visibleYears = getVisibleYears(years)
  const laneCount = getUsedLaneCount(computeLaneSegments(visibleYears))
  const chartWidth = getChartWidth(laneCount)
  const rangeLabel =
    visibleYears.length === 0
      ? ''
      : visibleYears.length === 1
        ? `${visibleYears[0].year}`
        : `${visibleYears[0].year}-${visibleYears[visibleYears.length - 1].year}`

  return (
    <div>
      <ScaledCanvas width={chartWidth}>
        <div
          ref={exportTargetRef}
          className="relative overflow-hidden rounded-[4px] px-7 pt-[30px] pb-[26px]"
          style={{
            backgroundColor: '#FFFDFB',
            border: '1px solid #E4DEF0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="font-maru text-[22px] font-black whitespace-nowrap text-[#4A4560]">
              わたしの<span className="text-[#E8899F]">オタク年表</span>
            </h2>
            {rangeLabel && (
              <span
                className="font-kaku flex-shrink-0 rounded-[3px] px-[10px] py-1 text-xs font-bold whitespace-nowrap text-[#C15D78]"
                style={{ border: '1px solid #F0C3D0' }}
              >
                {rangeLabel}
              </span>
            )}
          </div>

          <TimelineChart years={years} laneCount={laneCount} />

          <div
            className="mt-4 flex justify-end pt-[14px]"
            style={{ borderTop: '1px solid #E4DEF0' }}
          >
            <p className="font-kaku text-[10.5px] text-[#A79FC2]">
              オタク年表メーカーで作成
            </p>
          </div>
        </div>
      </ScaledCanvas>

      <ShareButtons exportTargetRef={exportTargetRef} />
    </div>
  )
}
