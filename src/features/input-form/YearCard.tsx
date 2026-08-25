import type { ContinuationChip, TimelineItem } from '../../types/timeline'
import { MAX_ITEMS_PER_YEAR } from '../../constants/timeline'
import { pickRandomColor } from '../../utils/color'
import { SlotRow } from './SlotRow'

interface YearCardProps {
  year: number
  items: TimelineItem[]
  /**
   * 前年（year - 1）の項目。継続入力チップの候補に使う。
   * 下から（古い年から）順に埋めていく場合、こちらが参照先になる。
   */
  previousYearItems: TimelineItem[]
  /**
   * 翌年（year + 1）の項目。継続入力チップの候補に使う。
   * 入力フォームは新しい年が上に並ぶため、1つ上のカード＝翌年のデータを参照することで、
   * 上から順に埋めていく入力順でも常に入力済みの内容を候補にできる。
   */
  nextYearItems: TimelineItem[]
  /** 「年を移動」の選択肢に使う、全カード共通の年一覧 */
  allYears: number[]
  onChange: (items: TimelineItem[]) => void
  /**
   * 項目を別の年へ移動する。成功時true、移動先が上限（3件）に達していて
   * 失敗した場合falseを返す。
   */
  onMoveItem: (fromYear: number, item: TimelineItem, toYear: number) => boolean
}

/**
 * 年ごとの入力カード。
 * 項目は最大3枠（継続項目も同枠でカウント）。空き枠は常に1つだけ表示し、
 * 入力されると自動で次の空き枠が現れる。
 */
export function YearCard({
  year,
  items,
  previousYearItems,
  nextYearItems,
  allYears,
  onChange,
  onMoveItem,
}: YearCardProps) {
  const availableYears = allYears.filter((y) => y !== year)
  const canAddMore = items.length < MAX_ITEMS_PER_YEAR

  // ドラフト枠がある間だけ、まだ未入力の前年・翌年項目を引き継ぎ候補として出す。
  // 上から新しい年順に埋める人・下から古い年順に埋める人の両方に対応するため、双方向に出す。
  const continuationChips: ContinuationChip[] = canAddMore
    ? [
        ...previousYearItems
          .filter((prevItem) => !items.some((i) => i.title === prevItem.title))
          .map((item): ContinuationChip => ({ item, source: 'previous' })),
        ...nextYearItems
          .filter((nextItem) => !items.some((i) => i.title === nextItem.title))
          .map((item): ContinuationChip => ({ item, source: 'next' })),
      ]
    : []

  const commitNewItem = (title: string, color: string) => {
    if (!canAddMore) return
    const trimmed = title.trim()
    if (!trimmed) return
    onChange([
      ...items,
      { id: crypto.randomUUID(), title: trimmed, comment: '', color },
    ])
  }

  const updateItem = (id: string, patch: Partial<TimelineItem>) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id))
  }

  // 入力済み項目 + (上限未満なら)ドラフト枠1つ、を並べて表示する
  const slotCount = canAddMore ? items.length + 1 : items.length

  return (
    <div className="rounded-2xl border-2 border-[#262230] bg-white p-4 shadow-[0_4px_12px_rgba(38,34,48,0.08)]">
      <span className="font-maru inline-flex items-center rounded-xl border-2 border-[#262230] bg-[#8FE8C8] px-3 py-1 text-sm font-bold text-[#262230]">
        {year}
      </span>

      <div className="mt-3 flex flex-col gap-3">
        {Array.from({ length: slotCount }, (_, index) => {
          const item = items[index]
          return (
            <SlotRow
              key={index}
              item={item}
              continuationChips={
                index === items.length ? continuationChips : []
              }
              onTitleChange={(value) => {
                if (item) {
                  if (value.trim() === '') {
                    removeItem(item.id)
                  } else {
                    updateItem(item.id, { title: value })
                  }
                } else {
                  commitNewItem(value, pickRandomColor())
                }
              }}
              onPickChip={(chip) => commitNewItem(chip.title, chip.color)}
              onCommentChange={(value) =>
                item && updateItem(item.id, { comment: value })
              }
              onColorChange={(color) => item && updateItem(item.id, { color })}
              availableYears={availableYears}
              onMove={(toYear) =>
                item ? onMoveItem(year, item, toYear) : false
              }
              onDelete={() => item && removeItem(item.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
