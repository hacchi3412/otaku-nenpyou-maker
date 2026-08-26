interface XLogoIconProps {
  className?: string
}

/**
 * X（旧Twitter）の公式ロゴマーク。
 * 「ポストする」ボタンがテキストだけだと何のサービスへの投稿か
 * ひと目で伝わりにくいという指摘を受けて追加した（詳細は7章参照）。
 * アイコン1個だけのために外部アイコンライブラリを追加するほどではないため、
 * 公式ブランドアセットのパスデータをそのままインラインSVGとして埋め込む。
 * `fill="currentColor"`にしているため、ボタン側のtext色（白）がそのまま
 * アイコンの色になる。
 */
export function XLogoIcon({ className }: XLogoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
