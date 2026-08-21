/**
 * 控えめな線画装飾（きらめき・リング・波線）。年表画像のアクセントとして散らす。
 * メンフィス風の図形を参考に、主張しすぎない程度に薄く配置する。
 */
export function TimelineDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute -top-2 right-8 h-8 w-8 text-[#F4A7C6]"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"
          fill="currentColor"
          opacity="0.35"
        />
      </svg>
      <svg
        className="absolute bottom-10 left-5 h-6 w-6 text-[#8FCBE0]"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
      </svg>
      <svg
        className="absolute top-1/3 -right-2 h-10 w-20 text-[#9ED393]"
        viewBox="0 0 80 24"
        fill="none"
      >
        <path
          d="M0 12c8-10 16 10 24 0s16-10 24 0s16 10 24 0s16-10 8 0"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
      </svg>
    </div>
  )
}
