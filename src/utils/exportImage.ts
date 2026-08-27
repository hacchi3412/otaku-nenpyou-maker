import { getFontEmbedCSS, toBlob } from 'html-to-image'
import { EXPORT_PIXEL_RATIO } from '../constants/share'
import { needsFontEmbedWorkaround } from './platform'

// 年表内で使うWebフォントファミリー（詳細はsrc/index.cssのfont-maru/font-kaku
// 参照）。取得したフォント埋め込みCSSに、両方の@font-faceルールが実際に
// 含まれているかを確認するために使う（詳細はloadFontEmbedCSSのコメント参照）。
const REQUIRED_FONT_FAMILIES = ['Zen Maru Gothic', 'Zen Kaku Gothic New']

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
    fontEmbedCSSPromise = getFontEmbedCSS(node)
      .then((cssText) => {
        // Google Fontsのスタイルシート（index.htmlで<link>読み込み）が
        // まだ読み込み中のタイミングでこの取得が走ると、@font-faceルールが
        // 1件もマッチせず空（または一部の書体だけ）のCSSが返ってくることが
        // ある。Promiseの「解決した値」ごとキャッシュする方式のため、
        // 一度これが起きるとページを再読み込みするまでずっと不完全な
        // 埋め込みCSSを使い続けてしまう（＝書き出すたびに毎回フォールバック
        // フォントで焼き込まれる）。両方の書体が含まれているか確認し、
        // 不足していれば失敗として扱いキャッシュしない（詳細は7章参照）
        const isComplete = REQUIRED_FONT_FAMILIES.every((family) =>
          cssText.includes(family),
        )
        if (!isComplete) {
          throw new Error('フォント埋め込みCSSの取得が不完全です')
        }
        return cssText
      })
      .catch((error: unknown) => {
        // 失敗時は次回また取り直せるようにキャッシュを空にしておく
        fontEmbedCSSPromise = null
        throw error
      })
  }
  return fontEmbedCSSPromise
}

/**
 * 書き出しで使うWebフォントCSSを先読みしておく。
 * 「保存」「シェア」ボタンが押されるより前（プレビュー表示時）に呼んでおくことで、
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
 *
 * WebKitエンジン（iOS上の全ブラウザ。OS側の制約で実体はどれもWebKitに
 * なる。加えてデスクトップ版Safariも同じエンジン。詳細は`needsFontEmbedWorkaround`
 * のコメント参照）では、埋め込んだ@font-face（base64のdata URI）を<img>
 * 経由でCanvasにラスタライズする際、「そのページで最初の1回だけ」埋め込み
 * フォントが反映されずフォールバックの標準フォントで焼き込まれてしまう
 * 既知の挙動がある（html-to-image・dom-to-imageの両OSSで報告例があり、
 * フォントに限らず画像が丸ごと欠落する事例も報告されている）。
 *
 * 当初はこの「最初の1回」をプレビュー表示中に裏側で先に消費しておく方式
 * （ダミー書き出しを1回だけ行い、実際の書き出し前にその完了を待つ）を
 * 取っていたが、iPadのChromeで対策後も再発する事例が確認された。ページ
 * 読み込み直後に一度warmupしておけば、その後もずっと「温まった」状態が
 * 保たれるという前提が崩れていた（タブのバックグラウンド化やメモリ回収等、
 * 何らかの理由で時間が経つとレンダリングパイプラインの状態がリセット
 * されうる）と考えられ、「1回だけ先に消費しておけば安心」という一度きりの
 * 対策では信頼できないと判断した。
 *
 * そのため、対象のWebKitブラウザでは書き出しのたびに毎回2回連続で
 * toBlob()を呼び、1回目（ダミー。結果は使わず破棄する）の直後に2回目
 * （実際に使う結果）を呼ぶように変更した。フォント埋め込みCSS自体は
 * 上記のキャッシュにより毎回再取得されないため、増える処理はCanvas
 * ラスタライズの分のみ。多少の追加コストにはなるが、書き出しのたびに
 * 確実に正しいフォントで反映されることを優先する（詳細は7章参照）。
 *
 * PC・モバイルの保存方式を統一しPCも同じ処理を通るようになった際、
 * 当初は`isIOS()`のみでこの分岐を判定しており、デスクトップ版Safari
 * （macOS、タッチなし）がこのバグ対策から漏れていた。デスクトップ版
 * Safariも実体は同じWebKitエンジンのため、同種のバグが起こりうる
 * （詳細は7章参照）。
 */
export async function exportNodeAsPngBlob(node: HTMLElement): Promise<Blob> {
  // キャッシュ済みのフォントCSSがあればそれを渡し、html-to-image側での
  // 再取得（サブセット729ファイル分の再フェッチ）を避ける。
  // 万一キャッシュの取得自体が失敗していた場合はundefinedを渡し、
  // html-to-image自身の通常の取得処理にフォールバックさせる。
  const fontEmbedCSS = await loadFontEmbedCSS(node).catch(() => undefined)

  const toBlobOptions = {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    fontEmbedCSS,
  }

  if (needsFontEmbedWorkaround()) {
    // ダミーの1回目。結果は使わず、失敗しても2回目に影響しないよう無視する
    await toBlob(node, toBlobOptions).catch(() => {})
  }

  const blob = await toBlob(node, toBlobOptions)
  if (!blob) {
    throw new Error('画像の生成に失敗しました')
  }
  return blob
}
