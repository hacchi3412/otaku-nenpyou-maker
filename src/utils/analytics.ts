// index.htmlのインラインスクリプトで、GA4（gtag.js）用のwindow.gtagがグローバルに
// 定義されている前提の型宣言。gtag.js自体をimportしないため、ここで型だけ補う。
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * GA4へカスタムイベントを送信する。
 * 広告ブロッカー等でgtag.js自体の読み込みがブロックされ、window.gtagが
 * 存在しない場合は何もしない（呼び出し側でtry/catch等を意識する必要はない）。
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  window.gtag?.('event', name, params)
}
