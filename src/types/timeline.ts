/**
 * 年表上の1項目（作品・アイドル・趣味など）
 */
export interface TimelineItem {
  /** UI操作用の一意なID（永続化データの同一性判定には使わない） */
  id: string
  /** ジャンル名（タイトル）。必須・最大15文字。連続判定はこの文字列の完全一致で行う */
  title: string
  /** 一言コメント。任意・20〜30文字程度 */
  comment: string
  /** ブロックのカラー（HEX等）。未指定時は自動割り当て */
  color: string
}

/**
 * 継続入力チップの候補1件。
 * sourceは、どちらの方向の年から引き継ぐ候補かを表す
 * （前年から続けて入力する場合と、翌年から遡って入力する場合の双方に対応するため）。
 */
export interface ContinuationChip {
  item: TimelineItem
  source: 'previous' | 'next'
}

/** 1年分のデータ。項目は最大3つ（継続項目も同枠でカウント） */
export interface YearEntry {
  year: number
  items: TimelineItem[]
}

/** localStorageに保存する年表データ全体 */
export interface TimelineData {
  /** バージョン。将来の移行処理のために保持 */
  version: 1
  years: YearEntry[]
}
