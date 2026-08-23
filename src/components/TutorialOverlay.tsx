import { useEffect, useState, type RefObject } from 'react'

interface TutorialOverlayProps {
  /** スポットライトを当てる対象要素への参照 */
  targetRef: RefObject<HTMLElement | null>
  /** 現在のステップ番号（1始まり）とステップ総数。「1/2」のように表示する */
  step: number
  totalSteps: number
  title: string
  description: string
  /** 次のステップに進むボタンのラベル。省略時は最終ステップとして扱い、押すと閉じる */
  nextLabel: string
  onNext: () => void
  /** ✕ボタン。いつでもチュートリアル全体を終了できる */
  onClose: () => void
}

/** スポットライトの縁とハイライト対象の間の余白（px） */
const SPOTLIGHT_PADDING = 8

/**
 * 初回訪問時だけ表示するスポットライト式チュートリアルオーバーレイ。
 *
 * 画面全体を薄暗くしつつ、targetRefが指す要素の周囲だけをくり抜いたように
 * 見せる（対象要素と同じ位置・サイズの透明な枠に、ものすごく広い
 * box-shadowを付けることで、枠の外側だけが暗く見える定番のテクニック）。
 * クリックは全画面ブロック用の透明な層で止め、チュートリアル中は
 * 背後の要素を操作できないようにしている（誤操作防止・状態のシンプルさ優先）。
 *
 * 対象要素の位置はレイアウト変化（フォントの遅延読み込みによるサイズ変化、
 * ウィンドウリサイズ等）に追従できるよう、ResizeObserver・resize・scroll
 * イベントのたびに再計測する。
 */
export function TutorialOverlay({
  targetRef,
  step,
  totalSteps,
  title,
  description,
  nextLabel,
  onNext,
  onClose,
}: TutorialOverlayProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const update = () => setRect(target.getBoundingClientRect())
    update()

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(target)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
      resizeObserver.disconnect()
    }
  }, [targetRef])

  if (!rect) return null

  return (
    <>
      {/* クリックを全面でブロックする透明な層。チュートリアル中は背後を操作させない */}
      <div className="fixed inset-0 z-[100]" aria-hidden="true" />

      {/* スポットライト本体。box-shadowの広い広がりで周囲だけを暗くする */}
      <div
        className="pointer-events-none fixed z-[100] rounded-2xl transition-all duration-200"
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + SPOTLIGHT_PADDING * 2,
          height: rect.height + SPOTLIGHT_PADDING * 2,
          boxShadow: '0 0 0 9999px rgba(38, 34, 48, 0.68)',
        }}
      />

      {/*
        説明の吹き出し。
        対象要素（rect）の直上・直下に配置しようとすると、対象が画面より背の高い
        セクション（入力エリアなど、カードが何枚も並んで縦に長い）の場合に
        rect.top / rect.bottomが画面外の値になり、吹き出しごと画面外へ
        はみ出してしまう。対象の大きさに関わらず必ず画面内に収まるよう、
        画面下部に固定表示する（スポットライトの一部と重なることはあるが、
        吹き出しは不透明・影付きで前面に出るため視認性は保たれる）。
      */}
      <div
        className="fixed inset-x-4 bottom-4 z-[101] mx-auto w-[min(320px,calc(100vw-32px))] rounded-2xl bg-white p-4 shadow-lg"
        role="dialog"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-[#A79FC2]">
            {step}/{totalSteps}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="チュートリアルを閉じる"
            className="-mt-1 -mr-1 rounded-full p-1 text-[#B9B2C7] transition hover:bg-[#F0ECF5] hover:text-[#262230]"
          >
            ✕
          </button>
        </div>
        <p className="font-maru mt-1 text-sm font-bold text-[#262230]">
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#6B6375]">
          {description}
        </p>
        <button
          type="button"
          onClick={onNext}
          className="mt-3 w-full rounded-full bg-[#262230] py-2 text-sm font-medium text-white transition hover:bg-[#3A3448]"
        >
          {nextLabel}
        </button>
      </div>
    </>
  )
}
