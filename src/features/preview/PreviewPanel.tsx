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
  /**
   * プレビュー上のブロックをタップした項目のIDを渡して呼ばれる。
   * 「プレビューで気づいて直したいのに、入力フォームへ戻るのが面倒」という
   * 声を受けたジャンプ機能用（詳細は7章参照）。
   */
  onEditItem: (itemId: string) => void
}

/**
 * 年表画像のプレビュー。
 * カード自体（枠線・角丸）も含めて画像として書き出す対象なので、
 * それらのスタイルはexportTargetRefのdivに直接持たせている。
 *
 * 装飾は引き算方針: 角丸は最小限、グラデーションなし、影・枠線は
 * カード外枠の1箇所（台帳・記録物らしい太めのink罫線＋硬めのオフセット影）
 * に絞り、他は色（塗り・文字色）だけで表現する（お試しのデザイン変更、
 * 詳細は7章参照）。
 *
 * カード全体の横幅は、実際に使われているレーン数（1〜3）に応じて可変にする。
 * ブロック列が少ないときに右側へ余分な余白ができないようにするため。
 */
export function PreviewPanel({
  years,
  displayName,
  onDisplayNameChange,
  onEditItem,
}: PreviewPanelProps) {
  const exportTargetRef = useRef<HTMLDivElement>(null)

  const visibleYears = getVisibleYears(years)
  const laneCount = getUsedLaneCount(computeLaneSegments(visibleYears))
  const chartWidth = getChartWidth(laneCount)
  const headingOwner = displayName.trim() || DEFAULT_DISPLAY_NAME
  // 保存・シェアのGA4計測用。全年合計の項目数（詳細は7章参照）
  const itemCount = years.reduce((sum, entry) => sum + entry.items.length, 0)

  return (
    <div>
      {/*
        名前の入力欄は書き出し対象（exportTargetRef）の外に置く。
        中に置くと入力欄自体が画像として書き出されてしまうため。
      */}
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="display-name" className="text-xs text-[#9C8F79]">
          見出しの名前
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          placeholder={DEFAULT_DISPLAY_NAME}
          className="w-56 rounded-lg border border-[#DED0AF] bg-[#FFFCF4] px-2 py-1 text-sm text-[#2B2420] outline-none focus:border-[#2B2420]"
        />
      </div>

      <ScaledCanvas width={chartWidth}>
        <div
          ref={exportTargetRef}
          className="relative overflow-hidden rounded-[4px] px-7 pt-[30px] pb-[26px]"
          style={{
            backgroundColor: '#FFFCF4',
            // 台帳・記録物らしい主張のある太め罫線に変更（引き算方針自体は
            // 維持：飾りの線を増やすのではなく、既存の1本の枠線を太くする
            // だけに留めている）
            border: '2px solid #2B2420',
            boxShadow: '4px 4px 0 0 rgba(43, 36, 32, 0.12)',
          }}
        >
          <h2 className="font-maru mb-5 text-[22px] font-black whitespace-nowrap text-[#2B2420]">
            {headingOwner}の<span className="text-[#B23A2E]">オタク年表</span>
          </h2>

          <TimelineChart
            years={years}
            laneCount={laneCount}
            onItemClick={onEditItem}
          />

          <div
            className="mt-4 flex justify-end pt-[14px]"
            style={{ borderTop: '1px solid #E8DFC9' }}
          >
            <p className="font-kaku text-[10.5px] text-[#B0A78D]">
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
          <p className="font-kaku text-xs text-[#B0A78D]">
            こんな年表が作れます（サンプル）
          </p>
          <img
            src={`${import.meta.env.BASE_URL}ogp.png`}
            alt="サンプルの年表画像。2023年から2026年にかけて、アニメA・ストリーマーD・ソシャゲB・アイドルC・Jリーグなど、年ごとに色分けされたブロックとコメントが並んでいる"
            className="w-full max-w-md rounded-lg border border-[#DED0AF] shadow-sm"
          />
        </div>
      )}

      <ShareButtons
        exportTargetRef={exportTargetRef}
        displayName={displayName}
        itemCount={itemCount}
      />
    </div>
  )
}
