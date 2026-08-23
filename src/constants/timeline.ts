/** 1年あたりの最大項目数（継続項目も同じ枠でカウントする） */
export const MAX_ITEMS_PER_YEAR = 3

/** ジャンル名（タイトル）の最大文字数 */
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
 * Open Colorのクリーンで発色の良いトーンを参考にした配色にしている。
 */
export const SWATCH_COLORS: readonly SwatchColor[] = [
  { bg: '#FFE3EC', text: '#C2255C' }, // ピンク
  { bg: '#FFF3BF', text: '#997404' }, // イエロー
  { bg: '#C3FAE8', text: '#087F5B' }, // ティール
  { bg: '#F3D9FA', text: '#862E9C' }, // グレープ
  { bg: '#D0EBFF', text: '#1864AB' }, // ブルー
] as const

export const LOCAL_STORAGE_KEY = 'otaku-nenpyou-maker:data'

/**
 * 見出し（「わたしのオタク年表」）・シェア文言に使う表示名を保存するキー。
 * 年表本体のデータ（years）とはライフサイクルが異なる（バージョン移行が
 * 不要な単純な文字列）ため、TimelineDataとは別のキーで独立して保持する。
 */
export const DISPLAY_NAME_STORAGE_KEY = 'otaku-nenpyou-maker:display-name'

/**
 * 表示名の最大文字数。
 * 見出しがカードからはみ出さないよう、timelineLayout.tsのMIN_CHART_WIDTHと
 * セットで調整すること（実描画で確認済みの組み合わせ）。
 */
export const DISPLAY_NAME_MAX_LENGTH = 10

/** 表示名が未入力のときに使うデフォルト値（見出しは「わたしのオタク年表」になる） */
export const DEFAULT_DISPLAY_NAME = 'わたし'

/**
 * 初回訪問時のスポットライト・チュートリアルを見終えた（または閉じた）かどうかを
 * 保存するキー。ユーザーテストで「開いた瞬間何をしていいかわからない」という
 * 声があったため導入した。一度見た・閉じたら二度と出さない。
 */
export const TUTORIAL_SEEN_STORAGE_KEY = 'otaku-nenpyou-maker:tutorial-seen'
