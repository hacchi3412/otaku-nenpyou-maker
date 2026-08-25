import { getFontEmbedCSS, toBlob } from 'html-to-image'
import { EXPORT_PIXEL_RATIO } from '../constants/share'
import { isIOS } from './platform'

// 年表の見出し・コメント等はGoogle Fonts（Zen Maru Gothic / Zen Kaku Gothic New）を
// 使っており、書き出し時はhtml-to-imageがフォントファイルをbase64化してSVGに埋め込む。
// ここが「保存」「シェア」の体感速度の大部分を占めている：
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

// iOS（WebKitエンジン）では、SVGへ埋め込んだ@font-face（base64のdata URI）を
// <img>経由でCanvasにラスタライズする際、そのページで最初の1回だけ描画結果に
// 反映されず、フォールバックの標準フォントで焼き込まれてしまう既知の挙動がある
// （html-to-image・dom-to-imageの両方で報告例があり、フォントに限らず画像が
// 丸ごと欠落する事例も報告されている。2回目以降の呼び出しは同一ページ内であれば
// 問題なく反映される）。ここでは実機報告（「保存」を押した時だけフォントが違う
// ＝そのセッションで最初に書き出しボタンを押した操作だった可能性が高い）を踏まえ、
// iOSに限り、プレビュー表示中にダミーの書き出しを1回済ませておくことで、
// ユーザーが実際にボタンを押す時点をこの「1回目」に当たらせないようにする
// （詳細は7章参照）。
//
// ただし「プレビュー表示時に裏で1回済ませておく」だけでは、このダミー書き出し
// 自体がまだ完了していないうちに実際のクリックが来た場合、両者がほぼ同時に
// toBlob()を呼ぶ形になってしまい、WebKit視点では「1回目」がどちらか保証
// されない（実際のクリック側が「1回目」に当たってしまいうる）。ネットワークや
// 端末の状態次第でこのダミー書き出しの完了が遅れるケース（プライベート
// ブラウジングでは追加のセキュリティチェック等により読み込みが遅れやすい。
// downloadBlobのコメント参照）で発生しやすいと考えられる。そのため
// exportNodeAsPngBlob側は、実際の書き出しの直前に必ずこのウォームアップの
// 完了を待つ（未着手なら開始して待つ）ことで、順序を保証する。
let iosRenderWarmupPromise: Promise<void> | null = null

function warmUpIOSRendering(
  node: HTMLElement,
  fontEmbedCSS: string | undefined,
): Promise<void> {
  if (!isIOS()) return Promise.resolve()
  if (!iosRenderWarmupPromise) {
    iosRenderWarmupPromise = toBlob(node, {
      pixelRatio: EXPORT_PIXEL_RATIO,
      backgroundColor: '#ffffff',
      fontEmbedCSS,
    })
      .then(() => undefined)
      .catch(() => {
        // 失敗しても実際の書き出し（exportNodeAsPngBlob）には影響しないため、
        // ここでは無視する。次回の呼び出しでやり直せるよう空にしておく。
        iosRenderWarmupPromise = null
      })
  }
  return iosRenderWarmupPromise
}

/**
 * 書き出しで使うWebフォントCSSを先読みしておく。
 * 「保存」「シェア」ボタンが押されるより前（プレビュー表示時）に呼んでおくことで、
 * 実際にボタンが押された時点ではキャッシュ済みの状態にし、待ち時間を無くす。
 * あわせてiOSでは、上記のレンダリング1回目問題を避けるためのダミー書き出しも
 * 一度だけ開始しておく（完了を待つのはexportNodeAsPngBlob側の役目）。
 * いずれも失敗時は無視してよい（exportNodeAsPngBlob側でフォールバック・
 * 実際の書き出しで再試行される）。
 */
export function prefetchFontEmbedCSS(node: HTMLElement) {
  loadFontEmbedCSS(node)
    .then((fontEmbedCSS) => warmUpIOSRendering(node, fontEmbedCSS))
    .catch(() => {})
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

  // iOSのレンダリング1回目問題（上記コメント参照）を避けるため、ウォーム
  // アップの完了を待ってから実際の書き出しを行う。プレビュー表示時の
  // 先読み（prefetchFontEmbedCSS）で既に開始・完了していれば即座に
  // 解決するため、通常はここでの待ち時間は発生しない。
  await warmUpIOSRendering(node, fontEmbedCSS)

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
