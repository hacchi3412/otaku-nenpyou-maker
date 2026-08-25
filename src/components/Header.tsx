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
      <header className="border-b-2 border-[#262230] bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-maru text-lg font-black tracking-tight text-[#262230] sm:text-xl">
              オタク年表メーカー
            </h1>
            <div className="flex flex-shrink-0 items-center gap-3">
              <p className="hidden text-sm text-[#8D869B] sm:block">
                ハマってきたものを年表画像に
              </p>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="text-xs text-[#B9B2C7] transition hover:text-[#E1483E]"
              >
                全部消す
              </button>
            </div>
          </div>
          {/*
            タグライン（何をするアプリかの一言説明）。PC以降は上の行に
            インラインで表示しているため、ここでは重複しないようスマホ時のみ
            2行目のサブタイトルとして表示する。スマホは「入力」タブが
            デフォルト表示で、タグラインがないとアプリの目的が伝わらない
            まま入力欄だけが並ぶ状態になってしまうため。
          */}
          <p className="mt-0.5 text-xs text-[#8D869B] sm:hidden">
            ハマってきたものを年表画像に
          </p>
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
