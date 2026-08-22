import { toBlob } from 'html-to-image'
import { EXPORT_PIXEL_RATIO } from '../constants/share'

/**
 * 指定した要素をPNG画像（Blob）として書き出す。
 * html-to-imageはDOMをSVGにシリアライズしてラスタライズする方式のため、
 * 外部画像・カスタムフォントを使わない今の年表デザインとは相性が良い。
 */
export async function exportNodeAsPngBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    pixelRatio: EXPORT_PIXEL_RATIO,
    backgroundColor: '#ffffff',
  })
  if (!blob) {
    throw new Error('画像の生成に失敗しました')
  }
  return blob
}

/**
 * 画像BlobをクリップボードにコピーしてPasteできるようにする。
 * Clipboard APIが使えない・拒否された場合はfalseを返す（呼び出し側でフォールバックする）。
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      return false
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch (error) {
    console.warn('クリップボードへの画像コピーに失敗しました', error)
    return false
  }
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
