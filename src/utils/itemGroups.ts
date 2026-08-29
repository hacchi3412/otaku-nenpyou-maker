import { MAX_ITEMS_PER_YEAR } from '../constants/timeline'
import type { TimelineItem, YearEntry } from '../types/timeline'

/**
 * 入力フォームで1回の登録操作として扱う項目。
 * 年表データ上は開始年〜終了年の各年に同じgroupIdを持つTimelineItemの
 * コピーとして保存されているが、フォーム・一覧表示はこの単位で扱う。
 */
export interface ItemGroup {
  groupId: string
  title: string
  comment: string
  color: string
  startYear: number
  endYear: number
}

/** 項目登録フォームの送信内容。groupIdがnullなら新規登録 */
export interface ItemGroupInput {
  groupId: string | null
  title: string
  comment: string
  color: string
  startYear: number
  endYear: number
}

export type SaveItemGroupResult =
  { ok: true } | { ok: false; conflictYears: number[] }

/**
 * 年表データから、登録済みの項目をグループ単位でまとめて取り出す。
 * 開始年の若い順（同じ開始年ならデータ内の出現順）に並べる。
 *
 * タイトル・コメント・カラーは、同じgroupIdを持つ年ごとのコピー全てで
 * 常に揃っている前提（upsertItemGroupが常にその形で書き込むため）で、
 * 最初に見つかったものをそのグループの値として使う。
 */
export function listItemGroups(years: YearEntry[]): ItemGroup[] {
  const groups = new Map<string, ItemGroup>()

  for (const entry of years) {
    for (const item of entry.items) {
      const existing = groups.get(item.groupId)
      if (!existing) {
        groups.set(item.groupId, {
          groupId: item.groupId,
          title: item.title,
          comment: item.comment,
          color: item.color,
          startYear: entry.year,
          endYear: entry.year,
        })
      } else {
        existing.endYear = Math.max(existing.endYear, entry.year)
      }
    }
  }

  return [...groups.values()].sort((a, b) => a.startYear - b.startYear)
}

/**
 * 範囲［startYear, endYear］の各年について、このグループ以外の項目で
 * 上限（MAX_ITEMS_PER_YEAR）に達していないかを確認する。
 * 1年でも達していれば全体をrejectする方針（部分的な登録はしない）のため、
 * 呼び出し側はconflictYearsが空でない場合、登録・更新を中止すること。
 *
 * excludeGroupIdには編集中の既存グループのIDを渡す（自分自身の項目は
 * 上限カウントから除外する）。新規登録時はundefinedのままでよい。
 */
export function validateGroupRange(
  years: YearEntry[],
  startYear: number,
  endYear: number,
  excludeGroupId?: string,
): SaveItemGroupResult {
  const conflictYears: number[] = []

  for (const entry of years) {
    if (entry.year < startYear || entry.year > endYear) continue
    const otherItemsCount = entry.items.filter(
      (item) => item.groupId !== excludeGroupId,
    ).length
    if (otherItemsCount >= MAX_ITEMS_PER_YEAR) {
      conflictYears.push(entry.year)
    }
  }

  return conflictYears.length > 0 ? { ok: false, conflictYears } : { ok: true }
}

/**
 * グループ（1回の登録操作）を年表データへ書き込む。
 * 既に同じgroupIdの項目があれば、範囲外になった年からは取り除き、範囲内の
 * 各年には（無ければ新規に、あれば置き換える形で）同じタイトル・コメント・
 * カラーの項目を反映する。これにより、範囲の伸び縮みやタイトル・コメント・
 * カラーの変更もこの1関数で完結する（新規登録・編集の両方をこの関数で扱う）。
 *
 * 呼び出し側が事前にvalidateGroupRangeで上限チェック済みであることを
 * 前提とし、ここでは上限チェックを行わない。
 */
export function upsertItemGroup(
  years: YearEntry[],
  input: ItemGroupInput,
): YearEntry[] {
  const groupId = input.groupId ?? crypto.randomUUID()

  return years.map((entry) => {
    const existingIndex = entry.items.findIndex(
      (item) => item.groupId === groupId,
    )
    const inRange = entry.year >= input.startYear && entry.year <= input.endYear

    if (!inRange) {
      if (existingIndex === -1) return entry
      return {
        ...entry,
        items: entry.items.filter((item) => item.groupId !== groupId),
      }
    }

    const newItem: TimelineItem = {
      id:
        existingIndex === -1
          ? crypto.randomUUID()
          : entry.items[existingIndex].id,
      groupId,
      title: input.title,
      comment: input.comment,
      color: input.color,
    }

    if (existingIndex === -1) {
      return { ...entry, items: [...entry.items, newItem] }
    }
    const items = [...entry.items]
    items[existingIndex] = newItem
    return { ...entry, items }
  })
}

/** 指定したgroupIdを持つ項目を、すべての年から取り除く */
export function deleteItemGroup(
  years: YearEntry[],
  groupId: string,
): YearEntry[] {
  return years.map((entry) => {
    const items = entry.items.filter((item) => item.groupId !== groupId)
    return items.length === entry.items.length ? entry : { ...entry, items }
  })
}

/**
 * groupIdを持たない旧バージョンのデータを、新しいグループ方式へ移行する。
 * 既にgroupIdを持つ項目はそのまま素通りするため、何度呼んでも安全。
 *
 * 移行済みユーザーの継続ブロックの見た目を変えないよう、旧
 * `computeLaneSegments`が採用していたのと同じ判定基準（前年に同じ
 * タイトルの項目があれば継続とみなす）でgroupIdを割り当てる。
 * yearsが年の昇順で連続していること（`createInitialYears`・
 * `prependPastYears`で保証されている前提）を利用し、先頭から順に
 * 「このタイトルは前の年から続いているか」を追跡する。
 */
export function migrateLegacyItemsToGroups(years: YearEntry[]): YearEntry[] {
  const openGroupByTitle = new Map<
    string,
    { groupId: string; lastYear: number }
  >()

  return years.map((entry) => ({
    ...entry,
    items: entry.items.map((item) => {
      if (item.groupId) return item

      const open = openGroupByTitle.get(item.title)
      const groupId =
        open && open.lastYear === entry.year - 1
          ? open.groupId
          : crypto.randomUUID()
      openGroupByTitle.set(item.title, { groupId, lastYear: entry.year })
      return { ...item, groupId }
    }),
  }))
}
