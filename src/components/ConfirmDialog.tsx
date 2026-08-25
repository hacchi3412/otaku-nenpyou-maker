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
        className="w-full max-w-sm rounded-2xl border-2 border-[#262230] bg-white p-5 shadow-[0_6px_16px_rgba(38,34,48,0.14)]"
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-bold text-[#262230]"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-[#6B6375]">{description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border-2 border-[#262230] bg-white px-4 py-2 text-sm font-bold text-[#262230] transition hover:bg-[#F5F2FB]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border-2 border-[#262230] bg-[#FF8A80] px-4 py-2 text-sm font-bold text-[#262230] transition hover:bg-[#FF7062]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
