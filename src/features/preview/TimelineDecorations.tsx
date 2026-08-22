/**
 * 控えめな線画装飾（きらめき・丸）。年表画像のアクセントとして四隅に散らす。
 */
export function TimelineDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        className="absolute top-4 left-4 h-[22px] w-[22px] opacity-90"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"
          fill="#D9CFF5"
        />
      </svg>
      <svg
        className="absolute top-20 right-3.5 h-5 w-5 opacity-90"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"
          fill="#FFE8B8"
        />
      </svg>
      <svg
        className="absolute right-4 bottom-[54px] h-[22px] w-[22px] opacity-90"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"
          fill="#FFD4DC"
        />
      </svg>
      <svg
        className="absolute bottom-3.5 left-[52px] h-4 w-4 opacity-90"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="12" cy="12" r="4" fill="#D9CFF5" />
      </svg>
    </div>
  )
}
