import { useRef } from 'react'
import type { YearEntry } from '../../types/timeline'
import { getVisibleYears } from '../../utils/timelineLayout'
import { ScaledCanvas } from './ScaledCanvas'
import { ShareButtons } from './ShareButtons'
import { TimelineChart } from './TimelineChart'
import { TimelineDecorations } from './TimelineDecorations'

const CHART_WIDTH = 640

interface PreviewPanelProps {
  years: YearEntry[]
}

/**
 * 年表画像のプレビュー。
 */
export function PreviewPanel({ years }: PreviewPanelProps) {
  const exportTargetRef = useRef<HTMLDivElement>(null)

  const visibleYears = getVisibleYears(years)
  const rangeLabel =
    visibleYears.length === 0
      ? ''
      : visibleYears.length === 1
        ? `${visibleYears[0].year}`
        : `${visibleYears[0].year}-${visibleYears[visibleYears.length - 1].year}`

  return (
    <div className="rounded-2xl border border-[#F0ECF5] bg-[#FBFAFD] p-3 shadow-sm sm:p-4">
      <ScaledCanvas width={CHART_WIDTH}>
        {/* このdivがそのまま画像として書き出される対象（幅固定・スケール前の実寸） */}
        <div
          ref={exportTargetRef}
          className="relative overflow-hidden bg-white px-6 py-8"
        >
          <TimelineDecorations />

          <div className="relative flex flex-col items-center">
            <h2 className="text-lg font-bold text-[#262230]">
              わたしのオタク年表
            </h2>
            {rangeLabel && (
              <span className="mt-2 inline-flex items-center rounded-full bg-[#F5F2FA] px-3 py-1 text-xs font-medium text-[#8D869B]">
                {rangeLabel}
              </span>
            )}
          </div>

          <div className="relative mt-6">
            <TimelineChart years={years} />
          </div>

          <p className="relative mt-6 text-center text-[10px] text-[#C9C3D6]">
            オタク年表メーカー
          </p>
        </div>
      </ScaledCanvas>

      <ShareButtons exportTargetRef={exportTargetRef} />
    </div>
  )
}
