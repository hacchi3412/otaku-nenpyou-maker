import type { YearEntry } from '../types/timeline'

/**
 * 直近count年分のYearEntryを生成する（項目は空）。
 * 終了年は常に現在の年に固定する。
 */
export function createInitialYears(
  count: number,
  endYear: number = new Date().getFullYear(),
): YearEntry[] {
  const startYear = endYear - count + 1
  return Array.from({ length: count }, (_, i) => ({
    year: startYear + i,
    items: [],
  }))
}

/**
 * 現在の最も古い年より前に、さらにstep年分を先頭に追加する。
 */
export function prependPastYears(
  years: YearEntry[],
  step: number,
): YearEntry[] {
  if (years.length === 0) {
    return years
  }
  const oldestYear = years[0].year
  const added: YearEntry[] = Array.from({ length: step }, (_, i) => ({
    year: oldestYear - step + i,
    items: [],
  }))
  return [...added, ...years]
}
