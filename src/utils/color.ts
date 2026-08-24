import { SWATCH_COLORS } from '../constants/timeline'

/** 年表画像の基調となる、少し柔らかい濃さのインク色（スウォッチにない色のフォールバック用） */
const INK_FALLBACK_TEXT_COLOR = '#2B2420'

/** スウォッチからランダムに1色選ぶ（新規項目のカラー未指定時のデフォルト） */
export function pickRandomColor(): string {
  return SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)].bg
}

/**
 * 背景色（スウォッチのbg）に対応する、ペアの文字色を返す。
 * 過去のパレットの色などスウォッチに一致しない場合は、標準のインク色にフォールバックする。
 */
export function getSwatchTextColor(bg: string): string {
  return (
    SWATCH_COLORS.find((swatch) => swatch.bg === bg)?.text ??
    INK_FALLBACK_TEXT_COLOR
  )
}
