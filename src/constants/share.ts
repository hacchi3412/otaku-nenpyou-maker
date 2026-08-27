import { DEFAULT_DISPLAY_NAME } from './timeline'

/**
 * シェア文言の一行目（見出し行）を組み立てる。
 * 年表見出しと同じ表示名（未入力時は「わたし」）を使い、見出しとシェア文言の
 * 呼び方が食い違わないようにする。
 */
export function buildShareCaption(displayName: string): string {
  const owner = displayName.trim() || DEFAULT_DISPLAY_NAME
  return `${owner}のオタク年表📚✨`
}

/**
 * Xの投稿画面（intent URL）を開く際に使うキャプション。
 * `CompleteFlow`はPC・モバイルどちらも、画像は手動保存（長押し／右クリック）
 * されるだけで、投稿欄への添付はユーザーの手作業になる。投稿画面に
 * 切り替わった後はアプリ側の画面（保存案内・長押し案内）が見えなくなり、
 * 添付を忘れたまま投稿してしまうことがあるという指摘を受けたため、投稿欄の
 * テキスト自体に添付を促す一言（2行目）を含めておく（詳細は7章参照）。
 * 3行目以降は、投稿を見た人がアプリへ辿ってきてくれるよう添えるアプリの
 * 紹介文。ハッシュタグはサービス名の検索性を保つため「#オタク年表メーカーで
 * 作成」のように後ろに文言を続けず、「#オタク年表メーカー」単体で完結させる
 * （`url`はintent URLの`url`パラメータ側で別途渡すため、ここには含めない）。
 */
export function buildTwitterIntentCaption(displayName: string): string {
  return [
    buildShareCaption(displayName),
    '🌟作成した画像を添付してシェアしてね🌟',
    '',
    '---',
    '',
    'あなたは今まで、何にハマってきた？',
    '好きだった作品、推し、ジャンル……',
    'ぜんぶ並べて、あなただけのオタク年表を作ろう！',
    '#オタク年表メーカー',
  ].join('\n')
}

/**
 * サービスの公開URL。Xシェア時にintent URLの`url`パラメータへ渡し、
 * 投稿からアプリへ辿れるようにする（拡散導線）。
 */
export const SITE_URL = 'https://hacchi3412.github.io/otaku-nenpyou-maker/'

/** 画像化する際の解像度倍率（SNS共有でも潰れないよう高解像度で書き出す） */
export const EXPORT_PIXEL_RATIO = 2
