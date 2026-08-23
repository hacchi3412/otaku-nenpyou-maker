const CONTACT_FORM_URL = 'https://forms.gle/4EAH1x4iTjWxjh6z9'

/**
 * ページ最下部のフッター。
 * 現状はお問い合わせ（Googleフォーム）への案内のみを置く。
 */
export function Footer() {
  return (
    <footer className="border-t border-[#F0ECF5] px-4 py-6 text-center sm:px-6">
      <p className="text-xs text-[#8D869B]">
        ご意見・不具合のご報告は
        <a
          href={CONTACT_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#6B6375] underline decoration-[#D8D2E4] underline-offset-2 transition hover:text-[#262230]"
        >
          お問い合わせフォーム
        </a>
        からお気軽にどうぞ
      </p>
    </footer>
  )
}
