import { useState, type RefObject } from 'react'
import { DEFAULT_SHARE_TEXT, EXPORT_FILE_NAME } from '../../constants/share'
import { downloadBlob, exportNodeAsPngBlob } from '../../utils/exportImage'

interface ShareButtonsProps {
  /** 画像として書き出す対象（幅固定の年表本体）への参照 */
  exportTargetRef: RefObject<HTMLElement | null>
}

type Status = 'idle' | 'saving' | 'sharing'

/**
 * 「画像として保存」「Xでシェア」ボタン。
 * サーバーを使わず完結させるため、Xへの共有は
 * Web Share API（画像添付に対応）があればそれを使い、
 * 無ければ画像をダウンロードした上でXの投稿画面を新規タブで開く。
 */
export function ShareButtons({ exportTargetRef }: ShareButtonsProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    if (!exportTargetRef.current) return
    setStatus('saving')
    setMessage(null)
    try {
      const blob = await exportNodeAsPngBlob(exportTargetRef.current)
      downloadBlob(blob, EXPORT_FILE_NAME)
    } catch (error) {
      console.error(error)
      setMessage('画像の保存に失敗しました。もう一度お試しください。')
    } finally {
      setStatus('idle')
    }
  }

  const handleShare = async () => {
    if (!exportTargetRef.current) return
    setStatus('sharing')
    setMessage(null)
    try {
      const blob = await exportNodeAsPngBlob(exportTargetRef.current)
      const file = new File([blob], EXPORT_FILE_NAME, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: DEFAULT_SHARE_TEXT })
      } else {
        // 画像添付付きの共有に対応していない環境向けのフォールバック：
        // 画像を保存しつつ、Xの投稿画面をテキスト付きで開く
        downloadBlob(blob, EXPORT_FILE_NAME)
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(DEFAULT_SHARE_TEXT)}`
        window.open(intentUrl, '_blank', 'noopener,noreferrer')
        setMessage(
          '画像を保存しました。投稿画面が開くので、保存した画像を貼り付けてください。',
        )
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // シェアシートをユーザーがキャンセルした場合は何もしない
        return
      }
      console.error(error)
      setMessage('シェアに失敗しました。もう一度お試しください。')
    } finally {
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="rounded-full bg-[#262230] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3A3448] disabled:opacity-50"
        >
          {status === 'saving' ? '保存中…' : '画像として保存'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy}
          className="rounded-full border border-[#D8D2E4] px-4 py-2 text-sm font-medium text-[#262230] transition hover:border-[#BFB4D6] disabled:opacity-50"
        >
          {status === 'sharing' ? '準備中…' : 'Xでシェア'}
        </button>
      </div>
      {message && (
        <p className="max-w-xs text-center text-xs text-[#8D869B]">{message}</p>
      )}
    </div>
  )
}
