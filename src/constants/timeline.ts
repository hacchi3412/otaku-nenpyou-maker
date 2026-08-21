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

/**
 * ブロックのパステルカラー・スウォッチ。
 * 未指定時のランダム割り当てにも、手動選択にもこの配列を使う。
 */
export const SWATCH_COLORS = [
  '#FDE7EF', // パステルピンク
  '#FFF3D6', // パステルイエロー
  '#E4F3D9', // パステルグリーン
  '#D9F0EF', // パステルミント
  '#DCEBFA', // パステルブルー
  '#EAE1F7', // パステルパープル
] as const

export const LOCAL_STORAGE_KEY = 'otaku-nenpyou-maker:data'
