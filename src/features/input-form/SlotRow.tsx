import type { TimelineItem } from '../../types/timeline'
import {
  COMMENT_MAX_LENGTH,
  SWATCH_COLORS,
  TITLE_MAX_LENGTH,
} from '../../constants/timeline'

interface SlotRowProps {
  /** 入力済みの項目。未入力の空き枠（ドラフト）の場合はundefined */
  item: TimelineItem | undefined
  /** このドラフト枠に表示する、翌年からの引き継ぎ候補 */
  continuationChips: TimelineItem[]
  onTitleChange: (value: string) => void
  onPickChip: (chip: TimelineItem) => void
  onCommentChange: (value: string) => void
  onColorChange: (color: string) => void
  onDelete: () => void
}

/**
 * 1項目分の入力欄。
 * itemが未定義の間は作品名入力のみのドラフト枠として表示し、
 * 入力が始まるとコメント・カラー・削除ボタンが現れる。
 */
export function SlotRow({
  item,
  continuationChips,
  onTitleChange,
  onPickChip,
  onCommentChange,
  onColorChange,
  onDelete,
}: SlotRowProps) {
  return (
    <div className="rounded-xl border border-[#F0ECF5] bg-[#FAF8FC] p-3">
      {continuationChips.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {continuationChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onPickChip(chip)}
              className="rounded-full border border-[#D8D2E4] bg-white px-2.5 py-1 text-xs text-[#6B6375] transition hover:border-[#BFB4D6] hover:text-[#262230]"
            >
              翌年から：{chip.title}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={item?.title ?? ''}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="作品名を入力（15文字まで）"
        className="w-full rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
      />

      {item && (
        <div className="mt-2 flex flex-col gap-2">
          <input
            type="text"
            value={item.comment}
            onChange={(e) => onCommentChange(e.target.value)}
            maxLength={COMMENT_MAX_LENGTH}
            placeholder="一言コメント（任意）"
            className="w-full rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-xs text-[#6B6375] outline-none focus:border-[#BFB4D6]"
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {SWATCH_COLORS.map((swatch) => (
                <button
                  key={swatch.bg}
                  type="button"
                  aria-label={`カラー ${swatch.bg}`}
                  aria-pressed={item.color === swatch.bg}
                  onClick={() => onColorChange(swatch.bg)}
                  style={{ backgroundColor: swatch.bg }}
                  className={`h-6 w-6 rounded-full border-2 transition ${
                    item.color === swatch.bg
                      ? 'border-[#262230]'
                      : 'border-transparent hover:border-[#D8D2E4]'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-[#B9B2C7] transition hover:text-[#E4738A]"
            >
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
