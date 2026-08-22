const SPARKLE_PATH =
  'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z'

interface SparkleProps {
  className: string
  size: number
  color: string
}

function Sparkle({ className, size, color }: SparkleProps) {
  return (
    <svg
      className={`absolute opacity-70 ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d={SPARKLE_PATH} fill={color} />
    </svg>
  )
}

/**
 * 控えめな線画装飾。年表画像のアクセントとして、見出し・署名の近くに1つずつだけ添える。
 * 散りばめすぎるとにぎやかになりすぎるため、最小限に絞っている。
 */
export function TimelineDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Sparkle className="top-5 right-4" size={16} color="#D9CFF5" />
      <Sparkle className="right-5 bottom-4" size={14} color="#FFD4DC" />
    </div>
  )
}
