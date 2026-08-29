/**
 * 年表上の1項目（作品・アイドル・趣味など）
 */
export interface TimelineItem {
  /** UI操作用の一意なID（永続化データの同一性判定には使わない） */
  id: string
  /**
   * この項目が属する「グループ」（1回の項目登録操作）のID。
   * 開始年〜終了年の範囲で登録された1件の項目は、範囲内の各年に同じ
   * groupIdを持つコピーとして保存される。年表側の「連続して線がつながる」
   * 表現（`computeLaneSegments`）や、入力フォームでの編集・削除は、この
   * groupIdを単位として扱う（詳細は7章参照）。
   *
   * かつてはタイトル文字列の完全一致で継続を判定していたが、1回の登録・
   * 編集操作の対象を明確にするため、登録時に発行するIDで管理する方式に
   * 変更した。
   */
  groupId: string
  /** 「ハマったもの」（タイトル）。必須・最大20文字 */
  title: string
  /** 一言コメント。任意・20〜30文字程度 */
  comment: string
  /** ブロックのカラー（HEX等）。未指定時は自動割り当て */
  color: string
}

/** 1年分のデータ。項目は最大3つ（同じグループの継続分も同枠でカウント） */
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
