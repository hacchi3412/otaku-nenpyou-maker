import { getFontEmbedCSS, toBlob } from 'html-to-image'
import { EXPORT_PIXEL_RATIO } from '../constants/share'

// 年表の見出し・コメント等はGoogle Fonts（Zen Maru Gothic / Zen Kaku Gothic New）を
// 使っており、書き出し時はhtml-to-imageがフォントファイルをbase64化してSVGに埋め込む。
// ここが「保存」「Xでシェア」の体感速度の大部分を占めている：
// html-to-imageは@font-faceをfont-family名だけでマッチさせ、unicode-range（実際に
// 使われている文字か）は見ない。Google FontsはCJK対応のため1書体を数百のunicode-range
// サブセットファイルに分割して配信しており、実測ではこの2書体だけで729ファイル分の
// @font-faceルールがマッチし、埋め込みのたびにそれら全てを取得しようとしていた。
//
// 年表内で使うフォントファミリーはデータ内容に関わらず常に同じ（font-maru/font-kaku の
// 2つ固定）なので、書き出し対象の要素がマウントされた時点で一度だけ計算して使い回せば
// 十分。値ではなくPromiseそのものをキャッシュしているのは、複数箇所からほぼ同時に
// 呼ばれても取得処理自体が重複しないようにするため。
let fontEmbedCSSPromise: Promise<string> | null = null

function loadFontEmbedCSS(node: HTMLElement): Promise<string> {
  if (!fontEmbedCSSPromise) {
    fontEmbedCSSPromise = getFontEmbedCSS(node).catch((error: unknown) => {
      // 失敗時は次回また取り直せるようにキャッシュを空にしておく
      fontEmbedCSSPromise = null
      throw error
    })
  }
  return fontEmbedCSSPromise
}

/**
 * 書き出しで使うWebフォントCSSを先読みしておく。
 * 「保存」「Xでシェア」ボタンが押されるより前（プレビュー表示時）に呼んでおくことで、
 * 実際にボタンが押された時点ではキャッシュ済みの状態にし、待ち時間を無くす。
 * 失敗しても無視してよい（exportNodeAsPngBlob側でフォールバックする）。
 */
export function prefetchFontEmbedCSS(node: HTMLElement) {
  loadFontEmbedCSS(node).catch(() => {})
}

/**
 * 指定した要素をPNG画像（Blob）として書き出す。
 * html-to-imageはDOMをSVGにシリアライズしてラスタライズする方式で、
 * カスタムフォント（Zen Maru Gothic / Zen Kaku Gothic New）もSVGへ埋め込む必要がある。
 */
export async function exportNodeAsPngBlob(node: HTMLElement): Promise<Blob> {
  // キャッシュ済みのフォントCSSがあればそれを渡し、html-to-image側での
  // 再取得（サブセット729ファイル分の再フェッチ）を避ける。
  // 万一キャッシュの取得自体が失敗していた場合はundefinedを渡し、
  // html-to-image自身の通常の取得処理にフォールバックさせる。
  const fontEmbedCSS = await loadFontEmbedCSS(node).catch(() => undefined)

  const blob = await toBlob(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    fontEmbedCSS,
  })
  if (!blob) {
    throw new Error('画像の生成に失敗しました')
  }
  return blob
}

/** Blobをファイルとしてブラウザにダウンロードさせる */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // click()直後に同期的にrevokeすると、ブラウザが実際にBlobを読みに行く前に
  // URLが無効になってしまうことがある（シークレット/プライベートブラウジングでは
  // ダウンロード前の追加のセキュリティチェックなどで読み込みが遅れやすく、
  // このタイミング競合が起きやすい）。十分な余裕を持たせてから解放する。
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
