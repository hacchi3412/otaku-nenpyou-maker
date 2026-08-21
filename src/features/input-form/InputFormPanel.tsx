import type { YearEntry } from '../../types/timeline'

interface InputFormPanelProps {
  years: YearEntry[]
}

/**
 * 年ごとの入力カード一覧。
 * TODO: 作品名・コメント・カラー入力、継続チップ、年追加ボタン等を実装する。
 */
export function InputFormPanel({ years }: InputFormPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {[...years].reverse().map((entry) => (
        <div
          key={entry.year}
          className="rounded-2xl border border-[#F0ECF5] bg-white p-4 shadow-sm"
        >
          <span className="inline-flex items-center rounded-full bg-[#262230] px-3 py-1 text-sm font-semibold text-white">
            {entry.year}
          </span>
          <p className="mt-3 text-sm text-[#8D869B]">
            まだ項目がありません（入力フォームは近日実装）
          </p>
        </div>
      ))}
      <button
        type="button"
        className="rounded-full border border-dashed border-[#D8D2E4] px-4 py-2 text-sm text-[#8D869B] transition hover:border-[#BFB4D6] hover:text-[#262230]"
      >
        ＋もっと過去の年を追加する
      </button>
    </div>
  )
}
