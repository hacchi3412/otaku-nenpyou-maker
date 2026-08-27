import { useRef, useState } from 'react'
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
  /**
   * 「前方まとめ編集」：指定した（変更前の）タイトルが、この年より後ろに
   * 連続している年一覧を返す（詳細は7章参照）。
   */
  onCheckForwardRename: (oldTitle: string) => number[]
  /** 「前方まとめ編集」の実行：この年より後ろの連続範囲もまとめて新タイトルに変更する */
  onRenameForward: (oldTitle: string, newTitle: string) => void
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
 *
 * 「前方まとめ編集」は、継続入力（3.6・7章参照）で複数年にまたがった
 * タイトルを改名したいとき、1年ずつ打ち直す手間を減らす機能（詳細は
 * 7章参照）。タイトル欄からフォーカスが外れた（編集を終えた）タイミングで、
 * 変更前のタイトルがこの年より後ろに連続していないか確認し、あれば
 * 「この年だけ」「まとめて変更」を選べる小さな確認を出す。過去方向は
 * 見ないため、途中の年から名前を分けたい場合はその年から編集を始めれば
 * 過去の年には影響しない。
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
  onCheckForwardRename,
  onRenameForward,
}: SlotRowProps) {
  const [isMoving, setIsMoving] = useState(false)
  const [moveError, setMoveError] = useState<string | null>(null)
  // フォーカスが当たった時点でのタイトルを覚えておき、blur時の値と比較する
  // ことで「今回の編集で実際に変わったか」を判定する（詳細は7章参照）。
  // タイトルはonChangeのたびに即座に親へ反映されるため、blur時点で
  // item.titleは既に新しい値になっている
  const titleOnFocusRef = useRef('')
  const [renamePrompt, setRenamePrompt] = useState<{
    oldTitle: string
    newTitle: string
    years: number[]
  } | null>(null)

  const handleSelectMoveTarget = (toYear: number) => {
    const moved = onMove(toYear)
    if (moved) {
      setIsMoving(false)
      setMoveError(null)
    } else {
      setMoveError(`${toYear}年はもう上限（3件）まで入力されてるよ`)
    }
  }

  const handleTitleBlur = () => {
    const oldTitle = titleOnFocusRef.current
    const newTitle = item?.title ?? ''
    if (!item || !oldTitle || !newTitle || oldTitle === newTitle) return
    const years = onCheckForwardRename(oldTitle)
    if (years.length === 0) return
    setRenamePrompt({ oldTitle, newTitle, years })
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
        onFocus={() => {
          titleOnFocusRef.current = item?.title ?? ''
          setRenamePrompt(null)
        }}
        onBlur={handleTitleBlur}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="ハマったものを入力（20文字まで）"
        className="w-full rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
      />

      {renamePrompt && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-[#F3F0FA] px-2.5 py-1.5 text-xs text-[#6B6375]">
          <span>
            {`「${renamePrompt.oldTitle}」は${renamePrompt.years[0]}${
              renamePrompt.years.length > 1
                ? `〜${renamePrompt.years[renamePrompt.years.length - 1]}`
                : ''
            }年にも続いてるよ`}
          </span>
          <button
            type="button"
            onClick={() => {
              onRenameForward(renamePrompt.oldTitle, renamePrompt.newTitle)
              setRenamePrompt(null)
            }}
            className="rounded-full bg-[#262230] px-2.5 py-1 font-medium text-white transition hover:bg-[#3A3448]"
          >
            まとめて変更（{renamePrompt.years.length}件）
          </button>
          <button
            type="button"
            onClick={() => setRenamePrompt(null)}
            className="rounded-full border border-[#D8D2E4] bg-white px-2.5 py-1 text-[#6B6375] transition hover:border-[#BFB4D6]"
          >
            この年だけ
          </button>
        </div>
      )}

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
                カラー（同じ名前の項目は自動で揃うよ）
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
