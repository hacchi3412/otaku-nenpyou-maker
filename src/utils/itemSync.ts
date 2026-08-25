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
/**
 * fromYearの翌年以降で、指定したタイトルの項目が連続している年を、
 * 連続が途切れる（該当タイトルの項目がない年に当たる）まで順に集めて返す。
 * fromYear自身は含まない（呼び出し側で既に確定した変更として扱う前提のため）。
 *
 * 「前方まとめ編集」機能で使う：ある年のタイトルを変更したとき、それより
 * 後ろ（未来方向）に同じ（変更前の）タイトルが連続していれば、まとめて
 * 変更するかどうかをユーザーに確認する（詳細は7章参照）。過去方向は見ない
 * ため、「途中の年から名前を分けたい」場合はその年から編集を始めれば
 * 過去には影響しない。
 *
 * yearsは常に年が連続した昇順配列であること（createInitialYears・
 * prependPastYearsで保証されている前提）。
 */
export function findForwardContinuousYears(
  years: YearEntry[],
  fromYear: number,
  title: string,
): number[] {
  const startIndex = years.findIndex((entry) => entry.year === fromYear)
  if (startIndex === -1) return []

  const result: number[] = []
  for (let i = startIndex + 1; i < years.length; i++) {
    const entry = years[i]
    if (entry.year !== years[i - 1].year + 1) break // 年が歯抜けの場合は打ち切り（通常は発生しない想定）
    if (!entry.items.some((item) => item.title === title)) break
    result.push(entry.year)
  }
  return result
}

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
