import { DEFAULT_DISPLAY_NAME } from './timeline'

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
 * Xの投稿画面（intent URL）を開く際に使うキャプション。
 * `CompleteFlow`はPC・モバイルどちらも、画像は手動保存（長押し／右クリック）
 * されるだけで、投稿欄への添付はユーザーの手作業になる。投稿画面に
 * 切り替わった後はアプリ側の画面（保存案内・長押し案内）が見えなくなり、
 * 添付を忘れたまま投稿してしまうことがあるという指摘を受けたため、投稿欄の
 * テキスト自体に添付を促す一言を含めておく（詳細は7章参照）。
 */
export function buildTwitterIntentCaption(displayName: string): string {
  return `${buildShareCaption(displayName)}\n（保存した画像を添付してください）`
}

/**
 * サービスの公開URL。Xシェア時にintent URLの`url`パラメータへ渡し、
 * 投稿からアプリへ辿れるようにする（拡散導線）。
 */
export const SITE_URL = 'https://hacchi3412.github.io/otaku-nenpyou-maker/'

/** 画像化する際の解像度倍率（SNS共有でも潰れないよう高解像度で書き出す） */
export const EXPORT_PIXEL_RATIO = 2
