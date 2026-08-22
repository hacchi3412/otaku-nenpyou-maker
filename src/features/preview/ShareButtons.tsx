import { useState, type RefObject } from 'react'
import {
  DEFAULT_SHARE_TEXT,
  EXPORT_FILE_NAME,
  SITE_URL,
} from '../../constants/share'
import { downloadBlob, exportNodeAsPngBlob } from '../../utils/exportImage'
import { isIOS } from '../../utils/platform'

interface ShareButtonsProps {
  /** 画像として書き出す対象（幅固定の年表本体）への参照 */
  exportTargetRef: RefObject<HTMLElement | null>
}

type Status = 'idle' | 'saving' | 'sharing'

/**
 * 「画像として保存」「Xでシェア」ボタン。
 * サーバーを使わず完結させるため、
 * - 保存: iOSでは共有シート（画像保存がワンタップで並ぶ）、それ以外は直接ダウンロード
 * - Xでシェア: 常にXの投稿画面（テキスト入力済み）を新規タブで開く。
 *   画像は自動ダウンロードし、投稿欄への添付は手動で案内する
 *   （クリップボード経由の自動貼り付けは試みない。詳細は7章参照）
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
      const file = new File([blob], EXPORT_FILE_NAME, { type: 'image/png' })

      // iOS SafariはBlobの<a download>を「保存」ではなく「画像を開くだけ」として
      // 扱ってしまい、そこから長押しで保存する手間が発生する。
      // ネイティブの共有シート経由なら「イメージを保存」がワンタップで並ぶため、
      // iOSではこちらを優先する（テキストは付けず、保存だけを促す）。
      //
      // ただしWeb Share APIはプライベートブラウジング中などに失敗することがある
      // （canShareがtrueを返してもshare()自体がNotAllowedError等で拒否される事例が
      // 報告されている）。ユーザーが共有をキャンセルした場合（AbortError）以外は、
      // 通常のダウンロードにフォールバックして保存自体は完了させる。
      let saved = false
      if (isIOS()) {
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file] })
            saved = true
          }
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === 'AbortError'
          ) {
            // 共有シートをユーザーがキャンセルした場合は何もしない
            return
          }
          console.warn(
            '共有シートでの保存に失敗したため、直接ダウンロードにフォールバックします',
            shareError,
          )
        }
      }

      if (!saved) {
        downloadBlob(blob, EXPORT_FILE_NAME)
      }
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

    // Xの投稿作成画面（テキスト入力済み）を確実に開くのが最優先。
    // OSの汎用共有シート（Web Share API）経由だと、Xを選ぶ一手間が増える上、
    // 投稿画面に直接テキストが入るとは限らないため、常にX公式のintent URLを使う。
    //
    // 画像はクリップボード経由での自動貼り付けを試みず、常にダウンロードして
    // 手動添付を案内する方針にした。理由：
    // - クリップボードコピー（navigator.clipboard.write）はドキュメントが
    //   フォーカスを失うと失敗する仕様があり、スマホでXのintent URLへ遷移すると
    //   多くの場合ネイティブのXアプリへ丸ごと切り替わってフォーカスを失うため、
    //   常に失敗してしまう
    // - フォーカスを保つには投稿画面への遷移をコピーの後に遅らせる必要があるが、
    //   そうすると今度はexportに時間がかかった場合に「ユーザー操作からの経過時間」
    //   判定でその遷移自体がポップアップブロックされることがあった
    // 両立できないため、ダウンロード方式に一本化した。ダウンロードは
    // ドキュメントのフォーカス状態に依存しないため、投稿画面をユーザー操作
    // 直後に確定URLで直接開いても問題ない（詳細は7章参照）。
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(DEFAULT_SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}`
    window.open(intentUrl, '_blank', 'noopener,noreferrer')

    try {
      const blob = await exportNodeAsPngBlob(exportTargetRef.current)
      downloadBlob(blob, EXPORT_FILE_NAME)
      setMessage(
        '投稿画面を開きました。保存した画像を投稿欄に添付してください。',
      )
    } catch (error) {
      console.error(error)
      setMessage(
        '投稿画面は開きましたが、画像の保存に失敗しました。もう一度お試しください。',
      )
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
      {/*
        「Xでシェア」は投稿画面を開くのと同時に画像をダウンロードするだけで、
        投稿欄への添付は自動化されない。初見だと気づきにくいため、
        クリックする前から常にヒントを出しておく。
        シェア操作直後は、結果に応じた具体的なメッセージに差し替える。
      */}
      <p className="max-w-xs text-center text-xs text-[#8D869B]">
        {message ??
          '「Xでシェア」は投稿画面が開き、画像がダウンロードされます。投稿欄に添付してください'}
      </p>
    </div>
  )
}
