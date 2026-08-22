import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

interface HeaderProps {
  /** 入力済みの年表データをすべて削除するハンドラ */
  onResetAll: () => void
}

export function Header({ onResetAll }: HeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleConfirm = () => {
    setConfirmOpen(false)
    onResetAll()
  }

  return (
    <>
      <header className="border-b border-[#F0ECF5] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold tracking-tight text-[#262230] sm:text-xl">
            オタク年表メーカー
          </h1>
          <div className="flex flex-shrink-0 items-center gap-3">
            <p className="hidden text-sm text-[#8D869B] sm:block">
              ハマってきたものを年表画像に
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="text-xs text-[#B9B2C7] transition hover:text-[#E4738A]"
            >
              全部消す
            </button>
          </div>
        </div>
      </header>

      {/*
        ConfirmDialogは<header>の外に置く。headerのbackdrop-blur
        （backdrop-filter）が position: fixed の包含ブロックを作ってしまい、
        ダイアログの全画面オーバーレイがheaderの高さ分に閉じ込められて
        しまうため。
      */}
      <ConfirmDialog
        open={confirmOpen}
        title="年表データをすべて削除しますか？"
        description="入力した内容がすべて削除され、初期状態に戻ります。この操作は取り消せません。"
        confirmLabel="全部消す"
        cancelLabel="キャンセル"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
