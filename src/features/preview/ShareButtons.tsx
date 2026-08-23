import { useEffect, useState, type RefObject } from 'react'
import {
  buildShareCaption,
  EXPORT_FILE_NAME,
  SITE_URL,
} from '../../constants/share'
import {
  downloadBlob,
  exportNodeAsPngBlob,
  prefetchFontEmbedCSS,
} from '../../utils/exportImage'
import { canShareFiles, isIOS } from '../../utils/platform'

interface ShareButtonsProps {
  /** 画像として書き出す対象（幅固定の年表本体）への参照 */
  exportTargetRef: RefObject<HTMLElement | null>
  /** シェア文言に使う表示名（空文字なら「わたし」表示）。見出しと同じ値を使う */
  displayName: string
}

type Status = 'idle' | 'saving' | 'sharing'

const PC_FALLBACK_HINT =
  '「Xでシェア」は画像がダウンロードされ、投稿画面が開きます。投稿欄に添付してください'

/**
 * 「画像として保存」「シェア」ボタン。
 * サーバーを使わず完結させるため、
 * - 保存: iOSでは共有シート（画像保存がワンタップで並ぶ）、それ以外は直接ダウンロード
 * - シェア: OSの共有シートに画像ファイルを渡せる環境（主にスマホ）では
 *   navigator.share()でOS標準の共有シートを開き、画像・キャプション・URLを
 *   まとめて渡す（宛先はX限定ではなくユーザーが選択）。非対応環境（主にPC）では
 *   従来通り、画像を先にダウンロードしてからXの投稿画面を新規タブで開く方式に
 *   フォールバックする（詳細は7章参照）
 */
export function ShareButtons({
  exportTargetRef,
  displayName,
}: ShareButtonsProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  // 共有シートに画像を渡せるかどうかは実行環境（主にOS・ブラウザ）で決まり、
  // セッション中に変わることはないため、初回レンダー時に一度だけ判定する
  const [shareFilesSupported] = useState(canShareFiles)

  // 「保存」「Xでシェア」を押した瞬間にフォント埋め込み用CSSの取得（数百リクエスト
  // 規模になりうる重い処理。詳細はexportImage.tsのコメント参照）が走ると体感が
  // 遅くなるため、プレビューが表示されている間に先読みしておく。
  useEffect(() => {
    if (exportTargetRef.current) {
      prefetchFontEmbedCSS(exportTargetRef.current)
    }
  }, [exportTargetRef])

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

    try {
      const blob = await exportNodeAsPngBlob(exportTargetRef.current)

      if (shareFilesSupported) {
        // OS標準の共有シートに画像・キャプション・URLをまとめて渡す。
        // 添付は共有シート側で自動的に行われるため、手動添付の案内は不要。
        // 宛先はユーザーが共有シートから選ぶため、Xとは限らない。
        //
        // urlは独立したフィールドとして渡さず、textに直接埋め込んでいる。
        // filesと一緒にurlを渡すと、iOS（WebKit）+ Xの組み合わせで実機検証した際に
        // urlだけが共有結果から欠落する（画像とキャプションは渡るがURLが本文に
        // 含まれない）ことを確認した。WebKitはfilesと他のフィールドを併用した際の
        // 挙動が不安定なことが知られており、Androidの共有（Intent.ACTION_SEND）も
        // もともとtext/urlを分けて渡せず1本の文字列に結合される仕様のため、
        // urlは常にtextの一部として渡す方が環境をまたいで確実に届く。
        const file = new File([blob], EXPORT_FILE_NAME, { type: 'image/png' })
        try {
          await navigator.share({
            files: [file],
            text: `${buildShareCaption(displayName)}\n${SITE_URL}`,
          })
          return
        } catch (shareError) {
          if (
            shareError instanceof DOMException &&
            shareError.name === 'AbortError'
          ) {
            // ユーザーが共有をキャンセルした場合は何もしない
            return
          }
          console.warn(
            '共有シートでの送信に失敗したため、ダウンロード方式にフォールバックします',
            shareError,
          )
          // フォールスルーして下のダウンロード方式を試す
        }
      }

      // 非対応環境（主にPC）向けのフォールバック。
      // 画像のダウンロードを終えてから投稿画面を開く順序にしている。
      // スマホでXのintent URLへ遷移すると、多くの場合ネイティブのXアプリへ
      // 丸ごと切り替わる（ブラウザがバックグラウンドになる）。この切り替えが
      // ダウンロードより先に起きると、ダウンロード確認のダイアログ等が
      // ユーザーの目に入らないまま放置され、画像が結局保存されずに終わって
      // しまう（実際に報告された不具合）。ダウンロードは先に確実に済ませる。
      //
      // トレードオフ：window.open()をユーザー操作から時間を置いて呼ぶことになる
      // ため、エクスポートに時間がかかった場合はまれに投稿画面がポップアップ
      // ブロックに引っかかることがありうる（詳細は7章参照）。ただしこの場合でも
      // 画像は既に保存済みなので、ユーザーは手動でXを開いて添付すればよく、
      // 「画像が保存されないまま投稿画面だけ開く」場合より実害は小さいと判断した。
      downloadBlob(blob, EXPORT_FILE_NAME)

      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareCaption(displayName))}&url=${encodeURIComponent(SITE_URL)}`
      window.open(intentUrl, '_blank', 'noopener,noreferrer')

      setMessage(
        '画像をダウンロードしました。投稿画面を開いたので、投稿欄に添付してください。',
      )
    } catch (error) {
      console.error(error)
      setMessage('画像の保存に失敗しました。もう一度お試しください。')
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
          {status === 'sharing'
            ? '準備中…'
            : shareFilesSupported
              ? 'シェア'
              : 'Xでシェア'}
        </button>
      </div>
      {/*
        非対応環境（主にPC）向けのフォールバックは、画像をダウンロードしてから
        投稿画面を開くだけで、投稿欄への添付は自動化されない。初見だと
        気づきにくいため、クリックする前から常にヒントを出しておく。
        共有シートに委ねられる環境では、添付が自動で行われ宛先もXに限らないため
        このヒントは不要（共有シート自体が説明不要なUIのため）。
        シェア操作直後にエラー等が起きた場合は、結果に応じたメッセージに差し替える。
      */}
      {(message ?? (shareFilesSupported ? null : PC_FALLBACK_HINT)) && (
        <p className="max-w-xs text-center text-xs text-[#8D869B]">
          {message ?? PC_FALLBACK_HINT}
        </p>
      )}
    </div>
  )
}
