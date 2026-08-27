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
