import { useRef } from 'react'
import type { YearEntry } from '../../types/timeline'
import { getVisibleYears } from '../../utils/timelineLayout'
import { ScaledCanvas } from './ScaledCanvas'
import { ShareButtons } from './ShareButtons'
import { TimelineChart } from './TimelineChart'
import { TimelineDecorations } from './TimelineDecorations'

const CHART_WIDTH = 600

interface PreviewPanelProps {
  years: YearEntry[]
}

/**
 * 年表画像のプレビュー。
 * カード自体（枠線・角丸・影）も含めて画像として書き出す対象なので、
 * それらのスタイルはexportTargetRefのdivに直接持たせている。
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
    <div>
      <ScaledCanvas width={CHART_WIDTH}>
        <div
          ref={exportTargetRef}
          className="relative overflow-hidden rounded-[24px] px-7 pt-[30px] pb-[26px]"
          style={{
            backgroundColor: '#FFFDFB',
            // box-shadow（ぼかしあり）はiOS Safari上のhtml-to-image書き出しで
            // ぼけずに硬い矩形として描画されてしまう既知の相性問題があるため使わない
            border: '2px solid #E4DEF0',
          }}
        >
          <TimelineDecorations />

          <div className="relative mb-5 flex items-center justify-between gap-2">
            <h2 className="font-maru text-[22px] font-black whitespace-nowrap text-[#4A4560]">
              わたしの<span className="text-[#E8899F]">オタク年表</span>
            </h2>
            {rangeLabel && (
              <span
                className="font-maru flex-shrink-0 rounded-full px-[11px] py-1 text-xs font-bold whitespace-nowrap text-[#6B6480]"
                style={{ background: '#F7F4FC', border: '1.5px solid #E4DEF0' }}
              >
                {rangeLabel}
              </span>
            )}
          </div>

          <div className="relative">
            <TimelineChart years={years} />
          </div>

          <div
            className="relative mt-4 flex justify-end pt-[14px]"
            style={{ borderTop: '1.5px dashed #E4DEF0' }}
          >
            <p className="font-maru text-[10.5px] text-[#A79FC2]">
              オタク年表メーカーで作成
            </p>
          </div>
        </div>
      </ScaledCanvas>

      <ShareButtons exportTargetRef={exportTargetRef} />
    </div>
  )
}
