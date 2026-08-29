import { useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  COMMENT_MAX_LENGTH,
  SWATCH_COLORS,
  TITLE_MAX_LENGTH,
} from '../../constants/timeline'
import type { YearEntry } from '../../types/timeline'
import { pickRandomColor } from '../../utils/color'
import type {
  ItemGroup,
  ItemGroupInput,
  SaveItemGroupResult,
} from '../../utils/itemGroups'

interface ItemGroupFormProps {
  /** 開始年・終了年のプルダウンに使う年一覧 */
  years: YearEntry[]
  /** 編集対象。nullなら新規登録モード */
  editingGroup: ItemGroup | null
  onSave: (input: ItemGroupInput) => SaveItemGroupResult
  onDelete: (groupId: string) => void
  onCancelEdit: () => void
  onAddPastYears: () => void
}

interface FormState {
  title: string
  startYear: number
  endYear: number
  comment: string
  color: string
}

function blankFormState(defaultYear: number): FormState {
  return {
    title: '',
    startYear: defaultYear,
    endYear: defaultYear,
    comment: '',
    color: pickRandomColor(),
  }
}

function formStateFromGroup(group: ItemGroup): FormState {
  return {
    title: group.title,
    startYear: group.startYear,
    endYear: group.endYear,
    comment: group.comment,
    color: group.color,
  }
}

/**
 * 項目の登録・編集フォーム。
 * タイトル・開始年〜終了年・コメント・カラーを1回の送信でまとめて登録する
 * （かつては「クイック入力」でタイトル・年だけ先に登録し、コメント・カラーは
 * 後から年カード側で追記する2段階の設計だったが、それを1段階にまとめた。
 * 詳細は7章参照）。
 *
 * 新規登録・既存グループの編集の両方をこのフォーム1つで担う。編集対象
 * （editingGroup）はプレビュー上のブロックをタップした時、または下の一覧
 * （ItemGroupList）の行をクリックした時に外部（InputFormPanel経由でApp）
 * から切り替わる。フォームの内容を編集対象の切り替えに追従させる方法として、
 * useEffectでの事後同期ではなく、呼び出し側（InputFormPanel）が
 * `key={editingGroupId ?? 'new'}`を渡してこのコンポーネントごと再マウント
 * させる方式を採る（Reactの定石。setStateをuseEffect内から呼ぶ実装だと
 * 余分な再レンダーが挟まる上、oxlintの`set-state-in-effect`にも抵触する）。
 *
 * PC幅では、このフォームの親（`InputFormPanel`の外側、`App`側）が
 * sticky＋overflow-y-autoのスクロール領域になっており、フォーム自身にも
 * `lg:sticky lg:top-0`を指定することで、下の登録済み項目一覧
 * （`ItemGroupList`）がその領域内でスクロールしてもフォームだけは常に
 * 領域の上端に留まるようにしている（詳細はAppのコメント・7章参照）。
 */
export function ItemGroupForm({
  years,
  editingGroup,
  onSave,
  onDelete,
  onCancelEdit,
  onAddPastYears,
}: ItemGroupFormProps) {
  // 年選択プルダウンの並び（新しい年が上）は他の年選択UIと揃えている
  const sortedYears = [...years].reverse()
  const latestYear = sortedYears[0]?.year ?? new Date().getFullYear()

  const [form, setForm] = useState<FormState>(() =>
    editingGroup
      ? formStateFromGroup(editingGroup)
      : blankFormState(latestYear),
  )
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }))
    setError(null)
    setMessage(null)
  }

  const handleSubmit = () => {
    const title = form.title.trim()
    if (!title) return

    if (form.startYear > form.endYear) {
      setError('開始年は終了年より前の年にしてください')
      return
    }

    const result = onSave({
      groupId: editingGroup?.groupId ?? null,
      title,
      comment: form.comment,
      color: form.color,
      startYear: form.startYear,
      endYear: form.endYear,
    })

    if (!result.ok) {
      setError(
        `${result.conflictYears.join('・')}年はすでに上限（3件）まで入力されています`,
      )
      return
    }

    setError(null)
    if (editingGroup) {
      onCancelEdit()
    } else {
      setMessage(`「${title}」を登録しました`)
      setForm(blankFormState(latestYear))
    }
  }

  const handleDelete = () => {
    if (!editingGroup) return
    onDelete(editingGroup.groupId)
  }

  return (
    <div className="rounded-2xl border border-[#F0ECF5] bg-white p-4 shadow-sm lg:sticky lg:top-0 lg:z-10">
      <span className="inline-flex items-center rounded-full bg-[#F3D9FA] px-2.5 py-1 text-xs font-bold text-[#862E9C]">
        {editingGroup ? '✏️ 項目を編集' : '⚡ 項目登録'}
      </span>
      {!editingGroup && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8D869B]">
          ハマったもの・年・コメント・カラーをまとめて登録できます
        </p>
      )}

      <input
        type="text"
        value={form.title}
        onChange={(e) => updateForm({ title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        maxLength={TITLE_MAX_LENGTH}
        placeholder="ハマったものを入力（20文字まで）"
        // プレビュー上のブロックをタップした時、この欄へフォーカスを移す
        // 目印に使う（Appのコメント参照）。フォームはページ内に常に1つだけ
        // なので、かつての`data-comment-for`のようにIDで対象を絞る必要がない
        data-item-form-title
        className="mt-2.5 w-full rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
      />

      <div className="mt-2 flex items-center gap-2">
        <select
          value={form.startYear}
          onChange={(e) => updateForm({ startYear: Number(e.target.value) })}
          aria-label="開始年"
          className="min-w-0 flex-1 rounded-lg border border-[#E5E0EE] bg-white px-1.5 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
        >
          {sortedYears.map((entry) => (
            <option key={entry.year} value={entry.year}>
              {entry.year}年
            </option>
          ))}
        </select>
        <span className="text-xs text-[#8D869B]">〜</span>
        <select
          value={form.endYear}
          onChange={(e) => updateForm({ endYear: Number(e.target.value) })}
          aria-label="終了年"
          className="min-w-0 flex-1 rounded-lg border border-[#E5E0EE] bg-white px-1.5 py-2 text-sm text-[#262230] outline-none focus:border-[#BFB4D6]"
        >
          {sortedYears.map((entry) => (
            <option key={entry.year} value={entry.year}>
              {entry.year}年
            </option>
          ))}
        </select>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-[10px] text-[#B9B2C7]">
          複数年続いた場合は開始年〜終了年を選んでください（1年だけなら同じ年でOK）
        </p>
        {/*
          「もっと過去の年を追加する」は、以前は登録済み項目一覧の一番下に
          常設していたが、一覧が伸びるほど手が届きにくくなり違和感がある
          という指摘を受けた。この操作の目的は「開始年・終了年の選択肢を
          増やすこと」そのものなので、その選択肢を出している場所（このすぐ
          上の年プルダウン）の直下に置くのが最も自然だと判断し、ここへ移した
          （詳細は7章参照）。フォーム自体もsticky化したため、一覧がどれだけ
          伸びても常に手の届く位置に留まる
        */}
        <button
          type="button"
          onClick={onAddPastYears}
          className="shrink-0 text-[10px] whitespace-nowrap text-[#8D869B] underline underline-offset-2 transition hover:text-[#262230]"
        >
          ＋もっと過去の年を追加する
        </button>
      </div>

      <div className="mt-2.5">
        <textarea
          value={form.comment}
          onChange={(e) => updateForm({ comment: e.target.value })}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder={'一言コメント（任意）\n例：沼落ちした'}
          rows={2}
          className="w-full resize-none rounded-lg border border-[#E5E0EE] bg-white px-3 py-2 text-xs text-[#6B6375] outline-none focus:border-[#BFB4D6]"
        />
        <p className="mt-0.5 text-right text-[10px] text-[#B9B2C7]">
          {form.comment.length}/{COMMENT_MAX_LENGTH}
        </p>
      </div>

      <div className="mt-2">
        <p className="mb-1 text-xs text-[#8D869B]">カラー</p>
        <div className="flex gap-1.5">
          {SWATCH_COLORS.map((swatch) => (
            <button
              key={swatch.bg}
              type="button"
              aria-label={`カラー ${swatch.bg}`}
              aria-pressed={form.color === swatch.bg}
              onClick={() => updateForm({ color: swatch.bg })}
              style={{ backgroundColor: swatch.bg }}
              className={`h-6 w-6 rounded-full border-2 transition ${
                form.color === swatch.bg
                  ? 'border-[#262230]'
                  : 'border-transparent hover:border-[#D8D2E4]'
              }`}
            />
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-[#E4738A]">{error}</p>}
      {message && <p className="mt-2 text-xs text-[#8D869B]">{message}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!form.title.trim()}
          className="flex-1 rounded-full bg-[#262230] py-2 text-sm font-medium text-white transition hover:bg-[#3A3448] disabled:opacity-40"
        >
          {editingGroup ? '更新する' : '登録する'}
        </button>
        {editingGroup && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full border border-[#D8D2E4] px-4 py-2 text-sm text-[#6B6375] transition hover:border-[#BFB4D6]"
          >
            キャンセル
          </button>
        )}
      </div>

      {editingGroup && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-[#B9B2C7] transition hover:text-[#E4738A]"
          >
            この項目を削除
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmingDelete}
        title="この項目を削除しますか？"
        description={
          editingGroup
            ? `「${editingGroup.title}」を年表から削除します（元に戻せません）`
            : undefined
        }
        confirmLabel="削除する"
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  )
}
