import { useRef } from 'react'
import {
  DEFAULT_DISPLAY_NAME,
  DISPLAY_NAME_MAX_LENGTH,
} from '../../constants/timeline'
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
  /** 見出し・シェア文言に使う表示名（空文字なら「わたし」表示） */
  displayName: string
  onDisplayNameChange: (value: string) => void
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
export function PreviewPanel({
  years,
  displayName,
  onDisplayNameChange,
}: PreviewPanelProps) {
  const exportTargetRef = useRef<HTMLDivElement>(null)

  const visibleYears = getVisibleYears(years)
  const laneCount = getUsedLaneCount(computeLaneSegments(visibleYears))
  const chartWidth = getChartWidth(laneCount)
  const headingOwner = displayName.trim() || DEFAULT_DISPLAY_NAME

  return (
    <div>
      {/*
        名前の入力欄は書き出し対象（exportTargetRef）の外に置く。
        中に置くと入力欄自体が画像として書き出されてしまうため。
      */}
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="display-name" className="text-xs text-[#8D869B]">
          見出しの名前
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          placeholder={DEFAULT_DISPLAY_NAME}
          className="w-56 rounded-lg border border-[#E5E0EE] bg-white px-2 py-1 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
        />
      </div>

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
          <h2 className="font-maru mb-5 text-[22px] font-black whitespace-nowrap text-[#4A4560]">
            {headingOwner}の<span className="text-[#E8899F]">オタク年表</span>
          </h2>

          <TimelineChart years={years} laneCount={laneCount} />

          <div
            className="mt-4 flex justify-end pt-[14px]"
            style={{ borderTop: '1px solid #E4DEF0' }}
          >
            <p className="font-kaku text-[10.5px] text-[#A79FC2]">
              #オタク年表メーカー で作成
            </p>
          </div>
        </div>
      </ScaledCanvas>

      {/*
        「初回訪問時、何が作れるのか分からない」というユーザーテストの声を受けて、
        まだ何も入力していない間だけ完成イメージのサンプル画像を表示する。
        exportTargetRefの外に置いているのは、書き出し対象の中に入れると
        ダミーのサンプル画像ごとユーザー自身の書き出し画像に含まれてしまうため
        （見出しの名前入力欄を外に置いているのと同じ理由）。
        入力を始めてvisibleYearsが1件でもできた時点で自動的に引っ込むため、
        常時表示のヘッダー画像等と違い恒久的な場所の占有にはならない。
        既にOGP用に用意済みのpublic/ogp.pngをそのまま流用している。
      */}
      {visibleYears.length === 0 && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="font-kaku text-xs text-[#A79FC2]">
            こんな年表が作れます（サンプル）
          </p>
          <img
            src={`${import.meta.env.BASE_URL}ogp.png`}
            alt="サンプルの年表画像。2023年から2026年にかけて、アニメA・ストリーマーD・ソシャゲB・アイドルC・Jリーグなど、年ごとに色分けされたブロックとコメントが並んでいる"
            className="w-full max-w-md rounded-lg border border-[#E5E0EE] shadow-sm"
          />
        </div>
      )}

      <ShareButtons
        exportTargetRef={exportTargetRef}
        displayName={displayName}
      />
    </div>
  )
}
