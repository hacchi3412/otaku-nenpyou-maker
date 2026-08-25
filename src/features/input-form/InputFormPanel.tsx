import { MAX_ITEMS_PER_YEAR } from '../../constants/timeline'
import type { TimelineItem, YearEntry } from '../../types/timeline'
import { pickRandomColor } from '../../utils/color'
import { findForwardContinuousYears } from '../../utils/itemSync'
import { QuickAddCard } from './QuickAddCard'
import { YearCard } from './YearCard'

interface InputFormPanelProps {
  years: YearEntry[]
  onChangeYearItems: (year: number, items: TimelineItem[]) => void
  /**
   * 「前方まとめ編集」の実行（詳細は7章参照）。対象年一覧・変更前後の
   * タイトルを渡すと、その年群の中でoldTitleに一致する項目をnewTitleへ
   * 一括で書き換える（コメント・カラーには影響しない）。
   */
  onRenameItemsForward: (
    targetYears: number[],
    oldTitle: string,
    newTitle: string,
  ) => void
  onAddPastYears: () => void
}

/**
 * 年ごとの入力カード一覧（新しい年が上）。
 * 一番上にはクイック入力欄（QuickAddCard）を常設し、年カードを順に埋める
 * 通常のフローとは別に、思い出した順で「何に・いつハマったか」だけを
 * 素早く書き留められるようにしている（詳細は7章参照）。
 */
export function InputFormPanel({
  years,
  onChangeYearItems,
  onRenameItemsForward,
  onAddPastYears,
}: InputFormPanelProps) {
  // クイック入力からの追加。新規項目の色・コメントの引き継ぎ判定（同じ
  // タイトルが他の年に既にあれば自動で揃える）はuseTimelineData側の
  // updateYearItemsが担うため、ここでは素の新規項目を積むだけでよい。
  const handleQuickAdd = (year: number, title: string): string | null => {
    const entry = years.find((y) => y.year === year)
    if (!entry || entry.items.length >= MAX_ITEMS_PER_YEAR) return null

    const newItem: TimelineItem = {
      id: crypto.randomUUID(),
      title,
      comment: '',
      color: pickRandomColor(),
    }
    onChangeYearItems(year, [...entry.items, newItem])
    return newItem.id
  }

  // 「年を移動」：間違えた年に入力してしまった項目を、消して打ち直すことなく
  // 別の年へ動かせるようにする（詳細は7章参照）。移動元からの削除・移動先への
  // 追加はどちらもonChangeYearItemsを通すため、同名項目のコメント・カラー
  // 自動同期（3.6）もそのまま適用される。
  const handleMoveItem = (
    fromYear: number,
    item: TimelineItem,
    toYear: number,
  ): boolean => {
    const fromEntry = years.find((y) => y.year === fromYear)
    const toEntry = years.find((y) => y.year === toYear)
    if (!fromEntry || !toEntry) return false
    if (toEntry.items.length >= MAX_ITEMS_PER_YEAR) return false

    onChangeYearItems(
      fromYear,
      fromEntry.items.filter((i) => i.id !== item.id),
    )
    onChangeYearItems(toYear, [...toEntry.items, item])
    return true
  }

  // 「前方まとめ編集」：タイトル編集直後に、変更前のタイトルがfromYearより
  // 後ろに連続していないか確認する（詳細は7章参照）。年群を求める部分は
  // itemSync.tsに切り出し、実行（renameItemsForward）はコメント・カラーの
  // 自動同期を避けるため、updateYearItemsとは別経路にしている
  const handleCheckForwardRename = (
    fromYear: number,
    title: string,
  ): number[] => findForwardContinuousYears(years, fromYear, title)

  const handleRenameForward = (
    fromYear: number,
    oldTitle: string,
    newTitle: string,
  ): void => {
    onRenameItemsForward(
      findForwardContinuousYears(years, fromYear, oldTitle),
      oldTitle,
      newTitle,
    )
  }

  const allYears = years.map((y) => y.year)

  return (
    <div className="flex flex-col gap-3">
      <QuickAddCard years={years} onAdd={handleQuickAdd} />
      {[...years].reverse().map((entry) => {
        // 上から新しい年順・下から古い年順のどちらで埋めても引き継ぎ候補が出るよう、
        // 前年（1つ下のカード）・翌年（1つ上のカード）の両方を参照する
        const previousYear = years.find((y) => y.year === entry.year - 1)
        const nextYear = years.find((y) => y.year === entry.year + 1)
        return (
          <YearCard
            key={entry.year}
            year={entry.year}
            items={entry.items}
            previousYearItems={previousYear?.items ?? []}
            nextYearItems={nextYear?.items ?? []}
            allYears={allYears}
            onChange={(items) => onChangeYearItems(entry.year, items)}
            onMoveItem={handleMoveItem}
            onCheckForwardRename={handleCheckForwardRename}
            onRenameForward={handleRenameForward}
          />
        )
      })}
      <button
        type="button"
        onClick={onAddPastYears}
        className="rounded-full border border-dashed border-[#D8D2E4] px-4 py-2 text-sm text-[#8D869B] transition hover:border-[#BFB4D6] hover:text-[#262230]"
      >
        ＋もっと過去の年を追加する
      </button>
    </div>
  )
}
