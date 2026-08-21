import { SWATCH_COLORS } from '../constants/timeline'

/** スウォッチからランダムに1色選ぶ（新規項目のカラー未指定時のデフォルト） */
export function pickRandomColor(): string {
  return SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)]
}
