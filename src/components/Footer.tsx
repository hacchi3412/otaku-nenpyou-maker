const CONTACT_FORM_URL = 'https://forms.gle/4EAH1x4iTjWxjh6z9'

const linkClassName =
  'text-[#6B6375] underline decoration-[#D8D2E4] underline-offset-2 transition hover:text-[#262230]'

/**
 * ページ最下部のフッター。
 * お問い合わせ（Googleフォーム）とプライバシーポリシーへの案内を置く。
 * プライバシーポリシーはpublic/privacy.htmlという、Reactアプリの外側にある
 * 素の静的HTMLとして用意している（このアプリはルーティングを持たないSPAで、
 * 1ページ増やすためだけにルーターを導入するほどでもないため）。
 */
export function Footer() {
  return (
    <footer className="border-t-2 border-[#262230] px-4 py-6 text-center sm:px-6">
      <p className="text-xs text-[#8D869B]">
        ご意見・不具合のご報告は
        <a
          href={CONTACT_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          お問い合わせフォーム
        </a>
        まで
      </p>
      <p className="mt-1 text-xs text-[#8D869B]">
        <a href="privacy.html" className={linkClassName}>
          プライバシーポリシー
        </a>
      </p>
    </footer>
  )
}
