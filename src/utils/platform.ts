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
 * navigator.share()に画像ファイルを渡せる環境かどうかを判定する。
 * OSの共有シート経由でXに限らず任意のアプリへ画像を渡せるようにするための機能検出。
 * UA判定ではなく機能検出にしているのは、PCブラウザでも将来対応が広がる可能性があるため。
 * 現状は主にiOS Safari / Androidのブラウザでtrueになり、多くのデスクトップブラウザではfalseになる。
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) {
    return false
  }
  try {
    const probe = new File([''], 'probe.png', { type: 'image/png' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}
