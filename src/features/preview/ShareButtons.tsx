import { useEffect, useState, type RefObject } from 'react'
import {
  buildShareCaption,
  buildTwitterIntentCaption,
  EXPORT_FILE_NAME,
  SITE_URL,
} from '../../constants/share'
import { trackEvent } from '../../utils/analytics'
import {
  downloadBlob,
  exportNodeAsPngBlob,
  prefetchFontEmbedCSS,
} from '../../utils/exportImage'
import { canShareFiles, isIOS, isMobileDevice } from '../../utils/platform'

interface ShareButtonsProps {
  /** 画像として書き出す対象（幅固定の年表本体）への参照 */
  exportTargetRef: RefObject<HTMLElement | null>
  /** シェア文言に使う表示名（空文字なら「わたし」表示）。見出しと同じ値を使う */
  displayName: string
  /**
   * 保存・シェア時点で年表に入っている項目数（全年合計）。
   * GA4のitem_countパラメータとして送り、「どのくらい入力が進んだ状態で
   * 保存・シェアされているか」を見られるようにするためだけに使う
   * （詳細は7章参照）。
   */
  itemCount: number
}

type Status = 'idle' | 'saving' | 'sharing'

const PC_FALLBACK_HINT =
  '「Xに投稿する」は画像がダウンロードされ、投稿画面が開きます。投稿欄に添付してください'

/**
 * 「画像として保存」「シェア」ボタン。
 * サーバーを使わず完結させるため、
 * - 保存: iOSでは共有シート（画像保存がワンタップで並ぶ）、それ以外は直接ダウンロード
 * - シェア: モバイル端末でOSの共有シートに画像ファイルを渡せる場合は、
 *   navigator.share()でOS標準の共有シートを開き、画像・キャプション・URLを
 *   まとめて渡す（宛先はX限定ではなくユーザーが選択）。PC（デスクトップ）では、
 *   navigator.share()自体が使える環境が増えてきているが、PCのOS標準共有シート
 *   にはそもそもX（Twitter）が登録されていないことが多く、「シェアしたのに
 *   Xが選べない」という実機報告があった。そのためPCでは機能の有無に関わらず
 *   常に、画像を先にダウンロードしてからXの投稿画面を新規タブで開く方式
 *   （ボタン名は「Xに投稿する」）を使う（詳細は7章参照）
 *
 * 保存・シェアが実際に完了した時点（クリックした時点ではない。キャンセル・
 * 失敗した操作まで計測しないため）で、GA4へimage_save／shareイベントを送る。
 * どちらの方式で完了したか（method）と、その時点の項目数（item_count）を
 * パラメータとして付与する（詳細は7章参照）。
 */
export function ShareButtons({
  exportTargetRef,
  displayName,
  itemCount,
}: ShareButtonsProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  // 共有シート経由にするかどうかは、実行環境（主にOS・ブラウザ）で決まり
  // セッション中に変わることはないため、初回レンダー時に一度だけ判定する。
  // canShareFiles()（画像ファイルを渡せるかの機能検出）だけでなく
  // isMobileDevice()も合わせて見ているのは、PCのOS共有シートにXが
  // 登録されていないことが多いため（詳細はisMobileDeviceのコメント・7章参照）
  const [shouldUseShareSheet] = useState(
    () => canShareFiles() && isMobileDevice(),
  )

  // 「保存」「シェア」を押した瞬間にフォント埋め込み用CSSの取得（数百リクエスト
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

      // ここまで到達するのは、共有シート経由（saved=true）／直接ダウンロード
      // （saved=false）のどちらかで保存が完了した場合のみ（キャンセル時は
      // 上のAbortErrorの分岐でreturnしており、ここには来ない）
      trackEvent('image_save', {
        method: saved ? 'share_sheet' : 'download',
        item_count: itemCount,
      })
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

      if (shouldUseShareSheet) {
        // OS標準の共有シートに画像・キャプション・URLをまとめて渡す。
        // 添付は共有シート側で自動的に行われるため、手動添付の案内は不要。
        // 宛先はユーザーが共有シートから選ぶため、Xとは限らない
        // （モバイル端末限定の分岐。PCではisMobileDevice()がfalseになるため
        // shouldUseShareSheetがtrueにならず、ここには入らない）。
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
          trackEvent('share', { method: 'web_share', item_count: itemCount })
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

      // PC（および共有シート非対応環境）向けのフォールバック。
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

      // この経路（PC）では画像を投稿欄に自動添付できないため、投稿画面に
      // 切り替わった後もアプリ側のヒント文言に頼らず気づけるよう、投稿欄の
      // テキスト自体に添付を促す一言を含めておく（詳細はbuildTwitterIntentCaption
      // のコメント・7章参照）
      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildTwitterIntentCaption(displayName))}&url=${encodeURIComponent(SITE_URL)}`
      window.open(intentUrl, '_blank', 'noopener,noreferrer')
      trackEvent('share', { method: 'twitter_intent', item_count: itemCount })

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
            : shouldUseShareSheet
              ? 'シェア'
              : 'Xに投稿する'}
        </button>
      </div>
      {/*
        PC（および共有シート非対応環境）向けのフォールバックは、画像を
        ダウンロードしてから投稿画面を開くだけで、投稿欄への添付は自動化
        されない。初見だと気づきにくいため、クリックする前から常にヒントを
        出しておく。共有シートに委ねられる環境では、添付が自動で行われ
        宛先もXに限らないためこのヒントは不要（共有シート自体が説明不要な
        UIのため）。シェア操作直後にエラー等が起きた場合は、結果に応じた
        メッセージに差し替える。
      */}
      {(message ?? (shouldUseShareSheet ? null : PC_FALLBACK_HINT)) && (
        <p className="max-w-xs text-center text-xs text-[#8D869B]">
          {message ?? PC_FALLBACK_HINT}
        </p>
      )}
    </div>
  )
}
