/** 1年あたりの最大項目数（継続項目も同じ枠でカウントする） */
export const MAX_ITEMS_PER_YEAR = 3

/** 作品名（タイトル）の最大文字数 */
export const TITLE_MAX_LENGTH = 15

/** 一言コメントの目安上限文字数 */
export const COMMENT_MAX_LENGTH = 30

/** 初期表示する年数（直近何年分か） */
export const DEFAULT_YEAR_COUNT = 10

/** 「＋もっと過去の年を追加する」で一度に追加する年数 */
export const ADD_PAST_YEARS_STEP = 5

/** ブロックのパステルカラー・スウォッチ1件（背景色と、それに合う濃いめの同系色の文字色のペア） */
export interface SwatchColor {
  bg: string
  text: string
}

/**
 * ブロックのパステルカラー・スウォッチ。
 * 未指定時のランダム割り当てにも、手動選択にもこの配列を使う。
 * textは背景に対して可読性を保ちつつ主張を抑えられるよう、同系統の濃い色にしている。
 */
export const SWATCH_COLORS: readonly SwatchColor[] = [
  { bg: '#FFD4DC', text: '#B4536B' }, // ピンク
  { bg: '#FFEBBE', text: '#A6791E' }, // イエロー
  { bg: '#CBF3E6', text: '#2E8C74' }, // ミント
  { bg: '#E1D9FA', text: '#6B58B8' }, // パープル
  { bg: '#D3ECFC', text: '#3D7DAD' }, // ブルー
] as const

export const LOCAL_STORAGE_KEY = 'otaku-nenpyou-maker:data'
