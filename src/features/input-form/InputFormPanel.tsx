import type { TimelineItem, YearEntry } from '../../types/timeline'
import { YearCard } from './YearCard'

interface InputFormPanelProps {
  years: YearEntry[]
  onChangeYearItems: (year: number, items: TimelineItem[]) => void
  onAddPastYears: () => void
}

/**
 * 年ごとの入力カード一覧（新しい年が上）。
 */
export function InputFormPanel({
  years,
  onChangeYearItems,
  onAddPastYears,
}: InputFormPanelProps) {
  return (
    <div className="flex flex-col gap-3">
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
            onChange={(items) => onChangeYearItems(entry.year, items)}
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
