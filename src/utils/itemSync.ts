import type { TimelineItem, YearEntry } from '../types/timeline'

/**
 * 全年から、指定したジャンル名を持つ既存項目を1つ探す。
 * 新規項目がすでに他の年で使われているジャンル名と同じ名前になったとき、
 * そのコメント・カラーを初期値として引き継ぐために使う。
 */
function findExistingItemForTitle(
  years: YearEntry[],
  title: string,
): TimelineItem | undefined {
  for (const entry of years) {
    const match = entry.items.find((item) => item.title === title)
    if (match) {
      return match
    }
  }
  return undefined
}

/**
 * 新規項目が引き継ぐべきコメントを探す。
 * コメントは自由記述のため、すでに何か入力されていれば上書きしない
 * （呼び出し側でコメントが空の場合のみ使う）。
 */
export function findExistingCommentForTitle(
  years: YearEntry[],
  title: string,
): string | undefined {
  const match = findExistingItemForTitle(years, title)
  return match && match.comment ? match.comment : undefined
}

/**
 * 新規項目が引き継ぐべきカラーを探す。
 * カラーはジャンルの見た目上の識別子という位置づけのため、
 * 既存項目が見つかればコメントと違って常に引き継ぐ
 * （新規項目には割り当て時点でランダムな色が入っているため、
 * 既存のジャンルと同じ色に上書きする）。
 */
export function findExistingColorForTitle(
  years: YearEntry[],
  title: string,
): string | undefined {
  return findExistingItemForTitle(years, title)?.color
}

/**
 * sourceItems（ちょうど更新された年の項目群）を正として、
 * 同じジャンル名を持つ他の年の項目のコメント・カラーも同じ値に揃える。
 * 同じジャンル名は同じ対象を指すはず、というルールのもと、
 * どの年で編集してもコメント・カラーが全年に伝播するようにする。
 *
 * sourceItemsは事前に（新規項目であれば）既存ジャンルの値を引き継ぎ済みである
 * 前提で呼び出すこと。そうしないと、新規項目にまだ割り当てられただけの
 * ランダムな色が、逆に既存の色を上書きしてしまう。
 */
export function propagateItemsByTitle(
  years: YearEntry[],
  sourceItems: TimelineItem[],
): YearEntry[] {
  const sourceByTitle = new Map(
    sourceItems
      .filter((item) => item.title.trim() !== '')
      .map((item) => [item.title, item] as const),
  )
  if (sourceByTitle.size === 0) {
    return years
  }

  return years.map((entry) => ({
    ...entry,
    items: entry.items.map((item) => {
      const source = sourceByTitle.get(item.title)
      if (!source) {
        return item
      }
      const commentChanged = source.comment !== item.comment
      const colorChanged = source.color !== item.color
      if (!commentChanged && !colorChanged) {
        return item
      }
      return {
        ...item,
        ...(commentChanged ? { comment: source.comment } : {}),
        ...(colorChanged ? { color: source.color } : {}),
      }
    }),
  }))
}
