import { useEffect } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * 破壊的な操作の確認用モーダル。
 * ブラウザ標準のconfirm()は「〇〇の内容」のようなURLが必ず表示されてしまい
 * 見た目のコントロールができないため、代わりにアプリのデザインに合わせた
 * 自前のダイアログを使う。
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'OK',
  cancelLabel = 'キャンセル',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border-2 border-[#2B2420] bg-[#FFFCF4] p-5 shadow-[5px_5px_0_0_rgba(43,36,32,0.18)]"
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-bold text-[#2B2420]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-[#6B5D4C]">{description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border-2 border-[#2B2420] bg-[#FFFCF4] px-4 py-2 text-sm font-bold text-[#2B2420] shadow-[3px_3px_0_0_#2B2420] transition-all hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#2B2420]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md border-2 border-[#2B2420] bg-[#B23A2E] px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_#2B2420] transition-all hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_#2B2420]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
