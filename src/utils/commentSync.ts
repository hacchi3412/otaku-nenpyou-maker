import type { TimelineItem, YearEntry } from '../types/timeline'

/**
 * 全年から、指定したジャンル名を持つ既存項目の（空でない）コメントを1つ探す。
 * 新規項目がすでに他の年で使われているジャンル名と同じ名前になったとき、
 * その既存コメントを初期値として引き継ぐために使う。
 */
export function findExistingCommentForTitle(
  years: YearEntry[],
  title: string,
): string | undefined {
  for (const entry of years) {
    const match = entry.items.find((item) => item.title === title)
    if (match && match.comment) {
      return match.comment
    }
  }
  return undefined
}

/**
 * sourceItems（ちょうど更新された年の項目群）を正として、
 * 同じジャンル名を持つ他の年の項目のコメントも同じ値に揃える。
 * 同じジャンル名は同じ対象を指すはず、というルールのもと、
 * どの年で編集してもコメントが全年に伝播するようにする。
 */
export function propagateCommentsByTitle(
  years: YearEntry[],
  sourceItems: TimelineItem[],
): YearEntry[] {
  const commentByTitle = new Map(
    sourceItems
      .filter((item) => item.title.trim() !== '')
      .map((item) => [item.title, item.comment] as const),
  )
  if (commentByTitle.size === 0) {
    return years
  }

  return years.map((entry) => ({
    ...entry,
    items: entry.items.map((item) => {
      const syncedComment = commentByTitle.get(item.title)
      return syncedComment !== undefined && syncedComment !== item.comment
        ? { ...item, comment: syncedComment }
        : item
    }),
  }))
}
