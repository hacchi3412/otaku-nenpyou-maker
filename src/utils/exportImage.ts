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

/** Blobをファイルとしてブラウザにダウンロードさせる */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
