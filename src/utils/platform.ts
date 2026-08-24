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
 *
 * ただし、この関数単体では「PCの共有シートにXが登録されていない」という
 * 問題までは検出できない（詳細はisMobileDeviceのコメント・7章参照）。
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

/**
 * モバイル端末（スマホ・タブレット）かどうかの判定。
 * PC（Windows等）でもcanShareFiles()がtrueになるケースが増えてきているが、
 * PCのOS標準共有シートにはそもそもX（Twitter）が登録されていないことが多く、
 * 「Xへの投稿」を主目的とする「シェア」ボタンで共有シートを開いても
 * 宛先候補にXが出てこない、という実機報告があった（詳細は7章参照）。
 * そのため「共有シートを使うかどうか」はcanShareFiles()の機能検出だけでなく、
 * モバイル端末かどうかも合わせて判定する必要がある。
 */
export function isMobileDevice(): boolean {
  return isIOS() || /Android/.test(navigator.userAgent)
}
