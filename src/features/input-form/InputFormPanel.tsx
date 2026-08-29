import type { YearEntry } from '../../types/timeline'
import {
  listItemGroups,
  type ItemGroupInput,
  type SaveItemGroupResult,
} from '../../utils/itemGroups'
import { ItemGroupForm } from './ItemGroupForm'
import { ItemGroupList } from './ItemGroupList'

interface InputFormPanelProps {
  years: YearEntry[]
  /** 現在編集中の項目のgroupId。nullなら新規登録モード（Appが保持。詳細は下記参照） */
  editingGroupId: string | null
  onEditingGroupIdChange: (groupId: string | null) => void
  onSaveItemGroup: (input: ItemGroupInput) => SaveItemGroupResult
  onDeleteItemGroup: (groupId: string) => void
  onAddPastYears: () => void
}

/**
 * 入力フォーム全体。
 * 登録・編集フォーム（`ItemGroupForm`）を常設し、その下に登録済みの項目一覧
 * （`ItemGroupList`）を並べる。年ごとにカードを埋めていく方式から、
 * 「タイトル・開始年〜終了年・コメント・カラーをまとめて1件ずつ登録する」
 * 方式に変更した（詳細は7章参照）。
 *
 * editingGroupIdはAppが保持する（`InputFormPanel`単体ではなく`App`で持つ
 * 理由：プレビュー上のブロックをタップした時にも同じ状態を切り替える必要が
 * あり、その際はモバイルタブの切り替えと同期的に行う必要があるため。詳細は
 * Appのコメント参照）。
 */
export function InputFormPanel({
  years,
  editingGroupId,
  onEditingGroupIdChange,
  onSaveItemGroup,
  onDeleteItemGroup,
  onAddPastYears,
}: InputFormPanelProps) {
  const groups = listItemGroups(years)
  const editingGroup = groups.find((g) => g.groupId === editingGroupId) ?? null

  const handleDelete = (groupId: string) => {
    onDeleteItemGroup(groupId)
    onEditingGroupIdChange(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <ItemGroupForm
        // 編集対象が切り替わるたびに再マウントし、フォームの内容を作り直す
        // （ItemGroupFormのコメント参照）
        key={editingGroupId ?? 'new'}
        years={years}
        editingGroup={editingGroup}
        onSave={onSaveItemGroup}
        onDelete={handleDelete}
        onCancelEdit={() => onEditingGroupIdChange(null)}
      />
      <ItemGroupList
        groups={groups}
        editingGroupId={editingGroupId}
        onEdit={onEditingGroupIdChange}
      />
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
