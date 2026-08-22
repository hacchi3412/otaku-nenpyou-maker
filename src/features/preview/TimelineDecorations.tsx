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
      className={`absolute opacity-90 ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d={SPARKLE_PATH} fill={color} />
    </svg>
  )
}

interface DotProps {
  className: string
  size: number
  color: string
}

function Dot({ className, size, color }: DotProps) {
  return (
    <svg
      className={`absolute opacity-90 ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="4" fill={color} />
    </svg>
  )
}

/**
 * 控えめな線画装飾（きらめき・丸）。年表画像のアクセントとして散らす。
 * 年数が多いと画像がかなり縦に伸びるため、四隅だけでなく高さに沿って
 * パーセント位置でも散らし、どんな長さでも寂しくならないようにしている。
 */
export function TimelineDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* 四隅 */}
      <Sparkle className="top-4 left-4" size={22} color="#D9CFF5" />
      <Sparkle className="top-20 right-3.5" size={20} color="#FFE8B8" />
      <Sparkle className="right-4 bottom-[54px]" size={22} color="#FFD4DC" />
      <Dot className="bottom-3.5 left-[52px]" size={16} color="#D9CFF5" />

      {/* 高さに沿って散らす分（コンテンツが長くなっても寂しくならないように） */}
      <Dot className="top-[18%] right-8" size={14} color="#B9E6D9" />
      <Sparkle className="top-[32%] left-2" size={16} color="#B9E6D9" />
      <Sparkle className="top-[48%] right-2" size={18} color="#BFE0F5" />
      <Dot className="top-[63%] left-6" size={14} color="#FFE8B8" />
      <Sparkle className="top-[78%] right-6" size={16} color="#D9CFF5" />
    </div>
  )
}
