import { useState } from 'react'
import type { ContinuationChip, TimelineItem } from '../../types/timeline'
import {
  COMMENT_MAX_LENGTH,
  SWATCH_COLORS,
  TITLE_MAX_LENGTH,
} from '../../constants/timeline'

interface SlotRowProps {
  /** 入力済みの項目。未入力の空き枠（ドラフト）の場合はundefined */
  item: TimelineItem | undefined
  /** このドラフト枠に表示する、前年・翌年からの引き継ぎ候補 */
  continuationChips: ContinuationChip[]
  /** 「年を移動」で選べる、この項目の現在の年以外の年一覧 */
  availableYears: number[]
  onTitleChange: (value: string) => void
  onPickChip: (chip: TimelineItem) => void
  onCommentChange: (value: string) => void
  onColorChange: (color: string) => void
  /** 指定した年へ移動する。成功時true、移動先が上限（3件）に達していて失敗した場合false */
  onMove: (toYear: number) => boolean
  onDelete: () => void
}

/**
 * 1項目分の入力欄。
 * itemが未定義の間は「ハマったもの」入力のみのドラフト枠として表示し、
 * 入力が始まるとコメント・カラー・削除ボタンが現れる。
 * コメントは長めの文章でも入力中に先頭が見えなくなったり上限文字数が
 * わかりにくかったりしないよう、2行のtextarea＋文字数カウンター表示にしている。
 *
 * コメント・カラーともに「何を書けば／選べばいいのか分からない」という
 * ユーザーテストの声を受け、プレースホルダーに実例を、カラーには
 * スウォッチの意味（同じ名前の項目は自動で揃う。タップで自由に変更可）を
 * 一言添えている（詳細は7章参照）。
 *
 * 「年を移動」は、間違えた年に入力してしまった項目を、消して打ち直す
 * ことなく別の年へ動かせるようにする機能（詳細は7章参照）。タイトル・
 * コメント・カラーはすべてそのまま移動先に引き継がれる。
 */
export function SlotRow({
  item,
  continuationChips,
  availableYears,
  onTitleChange,
  onPickChip,
  onCommentChange,
  onColorChange,
  onMove,
  onDelete,
}: SlotRowProps) {
  const [isMoving, setIsMoving] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)

  const handleSelectMoveTarget = (toYear: number) => {
    const moved = onMove(toYear)
    if (moved) {
      setIsMoving(false)
      setMoveError(null)
    } else {
      setMoveError(`${toYear}年はすでに上限（3件）まで入力されています`)
    }
  }
  return (
    <div className="rounded-xl border border-[#F0ECF5] bg-[#FAF8FC] p-3">
      {continuationChips.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {continuationChips.map(({ item: chip, source }) => (
            <button
              key={`${source}-${chip.id}`}
              type="button"
              onClick={() => onPickChip(chip)}
              className="rounded-full border border-[#D8D2E4] bg-white px-2.5 py-1 text-xs text-[#6B6375] transition hover:border-[#BFB4D6] hover:text-[#262230]"
            >
              {source === 'previous' ? '昨年から' : '翌年から'}：{chip.title}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={item?.title ?? ''}
        onChange={(e) => onTitleChange(e.target.value)}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="ハマったものを入力（20文字まで）"
        className="w-full rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
      />

      {item && (
        <div className="mt-2 flex flex-col gap-2">
          <div>
            <textarea
              value={item.comment}
              onChange={(e) => onCommentChange(e.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder={'一言コメント（任意）\n例：沼落ちした'}
              rows={2}
              // QuickAddCardから「コメント・色を編集」で飛んでこられるよう、
              // 項目IDをマークしておく（詳細はQuickAddCardのコメント参照）
              data-comment-for={item.id}
              className="w-full resize-none rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-xs text-[#6B6375] outline-none focus:border-[#BFB4D6]"
            />
            <p className="mt-0.5 text-right text-[10px] text-[#B9B2C7]">
              {item.comment.length}/{COMMENT_MAX_LENGTH}
            </p>
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              {/*
                「これは何？」という戸惑いへの対応。同じ名前の項目は自動で色が
                揃う仕組み（3.6参照）自体がスウォッチの存在理由でもあるため、
                タップで自由に変更できることとあわせて一言で説明する。
              */}
              <p className="mb-1 text-xs text-[#8D869B]">
                カラー（同じ名前の項目は自動で揃います）
              </p>
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
            </div>
            <div className="flex flex-col items-end gap-1">
              {isMoving ? (
                <div className="flex items-center gap-1">
                  <select
                    value=""
                    onChange={(e) =>
                      handleSelectMoveTarget(Number(e.target.value))
                    }
                    aria-label="移動先の年"
                    className="rounded-lg border border-[#E5E0EE] bg-white px-1.5 py-1 text-xs text-[#262230] outline-none focus:border-[#BFB4D6]"
                  >
                    <option value="" disabled>
                      年を選択
                    </option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoving(false)
                      setMoveError(null)
                    }}
                    aria-label="移動をキャンセル"
                    className="text-xs text-[#B9B2C7] transition hover:text-[#262230]"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMoving(true)}
                    className="text-xs text-[#B9B2C7] transition hover:text-[#262230]"
                  >
                    年を移動
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="text-xs text-[#B9B2C7] transition hover:text-[#E4738A]"
                  >
                    削除
                  </button>
                </div>
              )}
              {moveError && (
                <p className="text-[10px] text-[#E4738A]">{moveError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
