/**
 * iOS / iPadOS判定。
 * iPadOS 13以降はUser-AgentがMacintoshを名乗るため、タッチ対応も合わせて見る。
 */
export function isIOS(): boolean {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) {
    return true
  }
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * モバイル端末（スマホ・タブレット）かどうかの判定。
 * `PreviewPanel`が保存・シェアの方式（`MobileCompleteFlow`／`ShareButtons`の
 * どちらを使うか）を振り分けるのに使う（詳細はMobileCompleteFlowのコメント・
 * 7章参照）。
 *
 * かつてはこれに加えてnavigator.share()の機能検出（`canShareFiles()`）も
 * 組み合わせて「共有シートを使うか」を判定していたが、X・LINEのアプリ内蔵
 * ブラウザではWeb Share API・ファイルダウンロードのどちらも機能しないことが
 * あり、かつXのアプリ内蔵ブラウザはUser-Agentに目印がなく検出もできない
 * ため、環境判定に依存する実装そのものをやめ、モバイルでは常に
 * `MobileCompleteFlow`（長押し保存＋Xに投稿するリンク）に統一した経緯が
 * ある（詳細は7章参照）。
 */
export function isMobileDevice(): boolean {
  return isIOS() || /Android/.test(navigator.userAgent)
}
