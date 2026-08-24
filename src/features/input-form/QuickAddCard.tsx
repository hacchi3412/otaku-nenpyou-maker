import { useState } from 'react'
import { TITLE_MAX_LENGTH } from '../../constants/timeline'
import type { YearEntry } from '../../types/timeline'

interface QuickAddCardProps {
  /** 年選択の候補（新しい年順で表示する） */
  years: YearEntry[]
  /**
   * 指定した年に項目を追加する。
   * 成功時は新規項目のID、失敗時（未入力・その年が上限3件に到達済み）はnullを返す。
   */
  onAdd: (year: number, title: string) => string | null
}

/**
 * 「クイック入力」欄。
 * 年カードを上から順に埋めていく通常のフローとは別に、思い出した順にポンポン
 * 項目を追加できる入力手段を提供する（詳細は7章参照）。
 * ユーザーテストで「2026年から降順で考えていくのが難しい。コロナの時に
 * モンハンにハマってたから2020年、のように記憶の方が先に浮かぶ」という
 * 指摘があったため導入した。
 *
 * コメント・カラーはここでは扱わない（どちらも任意項目のため、まず
 * 「何に・いつハマったか」だけを次々書き留められることを優先し、連続入力の
 * テンポを止めないようにしている）。追加直後に出る確認メッセージのリンクから、
 * その項目のコメント欄へスクロール＋フォーカスし、必要な人だけその場で
 * 書き足せるようにした。
 */
export function QuickAddCard({ years, onAdd }: QuickAddCardProps) {
  // 年カードの表示順（新しい年が上）に合わせて降順にする
  const sortedYears = [...years].reverse()
  const [year, setYear] = useState(
    sortedYears[0]?.year ?? new Date().getFullYear(),
  )
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [addedItemId, setAddedItemId] = useState<string | null>(null)

  const handleAdd = () => {
    const trimmed = title.trim()
    if (!trimmed) return

    const newItemId = onAdd(year, trimmed)
    if (newItemId) {
      setMessage(`${year}年に「${trimmed}」を追加しました`)
      setAddedItemId(newItemId)
      setTitle('')
    } else {
      setMessage(`${year}年はすでに上限（3件）まで入力されています`)
      setAddedItemId(null)
    }
  }

  const handleJumpToEdit = () => {
    if (!addedItemId) return
    const target = document.querySelector<HTMLElement>(
      `[data-comment-for="${addedItemId}"]`,
    )
    if (!target) return
    // focus()自体はscrollIntoViewなしでも自動でスクロールしてしまうことがあり、
    // 下のscrollIntoView（スムーズスクロール）と競合してカクつくため、
    // まずpreventScrollでフォーカスだけ当ててからスクロールさせる
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="rounded-lg border-2 border-[#2B2420] bg-[#FFFCF4] p-4 shadow-[4px_4px_0_0_rgba(43,36,32,0.14)]">
      <span className="inline-flex items-center rounded-full bg-[#F4DCD3] px-2.5 py-1 text-xs font-bold text-[#8A2A1C]">
        ⚡ クイック入力
      </span>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#9C8F79]">
        順番はバラバラでOK。思い出した順に追加できます
      </p>

      <div className="mt-2.5 flex gap-2">
        <select
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value))
            setMessage(null)
          }}
          aria-label="追加する年"
          className="w-[92px] shrink-0 rounded-lg border border-[#DED0AF] bg-[#FFFCF4] px-1.5 py-2 text-sm text-[#2B2420] outline-none focus:border-[#2B2420]"
        >
          {sortedYears.map((entry) => (
            <option key={entry.year} value={entry.year}>
              {entry.year}年
            </option>
          ))}
        </select>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setMessage(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="ハマったものを入力（20文字まで）"
          className="min-w-0 flex-1 rounded-lg border border-[#DED0AF] bg-[#FFFCF4] px-3 py-2 text-sm text-[#2B2420] outline-none focus:border-[#2B2420]"
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!title.trim()}
        className="mt-2 w-full rounded-md border-2 border-[#2B2420] bg-[#2B2420] py-2 text-sm font-bold text-[#FFFCF4] shadow-[3px_3px_0_0_#B23A2E] transition-all hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#B23A2E] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-[3px_3px_0_0_#B23A2E]"
      >
        追加
      </button>

      {message && (
        <p className="mt-2 text-xs text-[#9C8F79]">
          {message}
          {addedItemId && (
            <>
              {'　'}
              <button
                type="button"
                onClick={handleJumpToEdit}
                className="font-medium text-[#6B5D4C] underline underline-offset-2 hover:text-[#2B2420]"
              >
                コメント・色を編集 →
              </button>
            </>
          )}
        </p>
      )}
    </div>
  )
}
