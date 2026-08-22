interface HeaderProps {
  /** 入力済みの年表データをすべて削除するハンドラ */
  onResetAll: () => void
}

export function Header({ onResetAll }: HeaderProps) {
  const handleResetClick = () => {
    const confirmed = window.confirm(
      '入力した年表データをすべて削除します。この操作は取り消せません。よろしいですか？',
    )
    if (confirmed) {
      onResetAll()
    }
  }

  return (
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
            onClick={handleResetClick}
            className="text-xs text-[#B9B2C7] transition hover:text-[#E4738A]"
          >
            全部消す
          </button>
        </div>
      </div>
    </header>
  )
}
