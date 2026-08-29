import type { ItemGroup } from '../../utils/itemGroups'

interface ItemGroupListProps {
  groups: ItemGroup[]
  editingGroupId: string | null
  onEdit: (groupId: string) => void
}

/**
 * 登録済みの項目一覧。開始年の若い順に並べる。
 *
 * かつては年ごとにカードを常設し、未入力の年も含めて空欄が並ぶ表示だったが、
 * 「入力した項目だけが下に並び、未入力の年はそもそも表示しない」形に変更した
 * （詳細は7章参照）。行をクリックすると`ItemGroupForm`が編集モードに切り替わる。
 */
export function ItemGroupList({
  groups,
  editingGroupId,
  onEdit,
}: ItemGroupListProps) {
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#D8D2E4] px-4 py-6 text-center text-xs text-[#A79FC2]">
        登録した項目はここに並びます
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        const range =
          group.startYear === group.endYear
            ? `${group.startYear}`
            : `${group.startYear}〜${group.endYear}`
        return (
          <button
            key={group.groupId}
            type="button"
            onClick={() => onEdit(group.groupId)}
            className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-left transition hover:border-[#BFB4D6] ${
              editingGroupId === group.groupId
                ? 'border-[#262230]'
                : 'border-[#F0ECF5]'
            }`}
          >
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span className="shrink-0 text-xs font-semibold whitespace-nowrap text-[#8D7FA8]">
              {range}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#262230]">
              {group.title}
            </span>
            {group.comment && (
              <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-[#8D869B] sm:inline">
                {group.comment}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
