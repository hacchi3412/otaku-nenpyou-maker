import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ScaledCanvasProps {
  /** 実寸（エクスポート時の基準になる固定幅） */
  width: number
  children: ReactNode
}

/**
 * 幅固定・高さ可変のコンテンツを、はみ出さないよう画面幅に合わせて縮小表示する。
 * 実際のDOM（画像として保存する対象）はwidthのまま保たれ、見た目だけtransform: scaleで縮小する。
 */
export function ScaledCanvas({ width, children }: ScaledCanvasProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const update = () => {
      const availableWidth = outer.clientWidth
      setScale(availableWidth > 0 ? Math.min(1, availableWidth / width) : 1)
      setContentHeight(inner.offsetHeight)
    }

    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(outer)
    resizeObserver.observe(inner)
    return () => resizeObserver.disconnect()
  }, [width])

  return (
    <div ref={outerRef} style={{ height: contentHeight * scale || undefined }}>
      <div
        ref={innerRef}
        style={{
          width,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
