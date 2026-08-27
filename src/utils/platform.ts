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
 * `CompleteFlow`が画像の保存方法の案内文（長押し／右クリック）を出し分ける
 * のに使う（詳細は7章参照）。
 *
 * かつては保存・シェアの「方式」自体（長押し保存に統一するかWeb Share API
 * を使うか等）をこの判定で分岐しており、判定を誤った環境が必ず残る
 * リスクがあったため一度廃止した経緯がある（詳細は7章参照）。今回の
 * 用途はあくまで案内文の表示切り替えのみで、万一判定を誤っても
 * 「長押しでも右クリックでも実際には保存できる」ため実害がなく、
 * 動作そのものを分岐で決めていた頃とはリスクの性質が異なる。
 */
export function isMobileDevice(): boolean {
  return isIOS() || /Android/.test(navigator.userAgent)
}
