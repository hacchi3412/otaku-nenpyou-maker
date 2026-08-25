import { DEFAULT_DISPLAY_NAME } from './timeline'

/** 保存する画像のファイル名 */
export const EXPORT_FILE_NAME = 'オタク年表.png'

/**
 * シェア時のキャプションを組み立てる。
 * 年表見出しと同じ表示名（未入力時は「わたし」）を使い、見出しとシェア文言の
 * 呼び方が食い違わないようにする。
 * ハッシュタグはサービス名の検索性を保つため「#オタク年表メーカーで作成」のように
 * 後ろに文言を続けず、「#オタク年表メーカー」単体で完結させる。
 */
export function buildShareCaption(displayName: string): string {
  const owner = displayName.trim() || DEFAULT_DISPLAY_NAME
  return `${owner}のオタク年表 #オタク年表メーカー`
}

/**
 * PC（デスクトップ）でXの投稿画面を開く際に使うキャプション。
 * この経路（`shouldUseShareSheet`がfalseの場合）は共有シートを介さず、
 * 画像は先にダウンロードされるだけで、投稿欄への添付はユーザーの手作業に
 * なる。投稿画面に切り替わった後はアプリ側の画面（ボタン下のヒント文言）が
 * 見えなくなり、添付を忘れたまま投稿してしまうことがあるという指摘を
 * 受けたため、投稿欄のテキスト自体に添付を促す一言を含めておく
 * （詳細は7章参照）。
 * モバイルの共有シート経由（`navigator.share()`）では画像が自動添付される
 * ため、この一言は不要（`buildShareCaption`をそのまま使う）。
 */
export function buildTwitterIntentCaption(displayName: string): string {
  return `${buildShareCaption(displayName)}\n（画像はダウンロードされたものを添付してください）`
}

/**
 * サービスの公開URL。Xシェア時にintent URLの`url`パラメータへ渡し、
 * 投稿からアプリへ辿れるようにする（拡散導線）。
 */
export const SITE_URL = 'https://hacchi3412.github.io/otaku-nenpyou-maker/'

/** 画像化する際の解像度倍率（SNS共有でも潰れないよう高解像度で書き出す） */
export const EXPORT_PIXEL_RATIO = 2
