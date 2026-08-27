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
 * デスクトップ版Safari（タッチ非対応の通常のMac）の判定。
 * `isIOS()`は「iPhone/iPad」または「タッチ対応のMacIntel（新しめの
 * iPadOSがMacを名乗る場合）」しか見ないため、タッチのない通常のMacの
 * Safariは対象に含まれない。`needsFontEmbedWorkaround()`がこれを
 * 補うために使う（詳細はそちらのコメント・7章参照）。
 * Chrome・Edge・Android系ブラウザもUser-Agentに"Safari"の文字列を含む
 * ため、それらに含まれがちな目印（chrome・android）が先に現れないことを
 * 確認する定番の判定方法を使う。
 */
function isDesktopSafari(): boolean {
  const ua = navigator.userAgent
  return /^((?!chrome|android).)*safari/i.test(ua)
}

/**
 * 画像書き出し時のWebKit特有のフォント埋め込みバグ（詳細は
 * exportImage.tsのコメント参照）の対象になりうるかどうかの判定。
 * iOS（iPhone・iPad。載っているブラウザの種類を問わずすべてWebKit
 * エンジンで動く）、またはデスクトップ版Safariが対象。
 *
 * かつてはこのバグへの対策を`isIOS()`のみで判定していたが、PC・モバイルの
 * 保存方式を統一しPCも同じ書き出し処理を通るようになったことで、
 * デスクトップ版Safari（macOS、タッチなし）がこの判定から漏れている
 * ことに気づいた。デスクトップ版Safariも実体はiOSと同じWebKitエンジンで
 * あり、同種のバグが起こりうるため、`isIOS()`だけでなくこちらも
 * 判定に含める必要がある（詳細は7章参照）。
 */
export function needsFontEmbedWorkaround(): boolean {
  return isIOS() || isDesktopSafari()
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
