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
 * サービスの公開URL。Xシェア時にintent URLの`url`パラメータへ渡し、
 * 投稿からアプリへ辿れるようにする（拡散導線）。
 */
export const SITE_URL = 'https://hacchi3412.github.io/otaku-nenpyou-maker/'

/** 画像化する際の解像度倍率（SNS共有でも潰れないよう高解像度で書き出す） */
export const EXPORT_PIXEL_RATIO = 2
