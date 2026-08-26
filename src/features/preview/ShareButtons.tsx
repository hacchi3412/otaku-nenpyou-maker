import { useEffect, useState, type RefObject } from 'react'
import {
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
 * PC（デスクトップ）専用の「画像として保存」「Xに投稿する」ボタン。
 *
 * モバイルではWeb Share API・`<a download>`のどちらもX・LINEのアプリ内蔵
 * ブラウザで機能しないことがある問題を踏まえ、`MobileCompleteFlow`に
 * 一本化した（詳細はそちらのコメント・7章参照）。このコンポーネントは
 * `PreviewPanel`側で`isMobileDevice()`がfalseの場合のみ使われるため、
 * モバイル固有の分岐（共有シート・Web Share API等）は持たない。
 *
 * PCではサーバーを使わず完結させるため、画像を先にダウンロードしてから
 * Xの投稿画面を新規タブで開く方式にしている。PCのOS標準共有シートには
 * そもそもX（Twitter）が登録されていないことが多く、Web Share APIを
 * 使っても「シェアしたのにXが選べない」という実機報告があったため
 * （詳細は7章参照）。
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
      downloadBlob(blob, EXPORT_FILE_NAME)
      trackEvent('image_save', { method: 'download', item_count: itemCount })
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

      // 画像のダウンロードを終えてから投稿画面を開く順序にしている。
      // ダウンロードより先に投稿画面（別タブ）を開いてしまうと、環境によっては
      // ダウンロード確認のダイアログ等がユーザーの目に入らないまま放置され、
      // 画像が結局保存されずに終わってしまう事例があったため。
      downloadBlob(blob, EXPORT_FILE_NAME)

      // この経路では画像を投稿欄に自動添付できないため、投稿画面に
      // 切り替わった後もアプリ側のヒント文言に頼らず気づけるよう、投稿欄の
      // テキスト自体に添付を促す一言を含めておく（詳細はbuildTwitterIntentCaption
      // のコメント・7章参照）
      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildTwitterIntentCaption(displayName))}&url=${encodeURIComponent(SITE_URL)}`
      const opened = window.open(intentUrl, '_blank', 'noopener,noreferrer')

      // window.open()はポップアップブロック等で失敗するとnullを返す（例外は
      // 投げない）。エクスポートに時間がかかった場合等にまれに起こりうるため
      // （詳細は7章参照）、戻り値を見て案内を出し分ける。GA4のshareイベントも
      // 実際に開けた場合のみ送る
      if (opened) {
        trackEvent('share', { method: 'twitter_intent', item_count: itemCount })
        setMessage(
          '画像をダウンロードしました。投稿画面を開いたので、投稿欄に添付してください。',
        )
      } else {
        setMessage(
          'このブラウザでは投稿画面を開けませんでした（画像のダウンロードも失敗している可能性があります）。もう一度お試しください。',
        )
      }
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
          {status === 'sharing' ? '準備中…' : 'Xに投稿する'}
        </button>
      </div>
      {/*
        画像をダウンロードしてから投稿画面を開くだけで、投稿欄への添付は
        自動化されない。初見だと気づきにくいため、クリックする前から常に
        ヒントを出しておく。シェア操作直後にエラー等が起きた場合は、
        結果に応じたメッセージに差し替える。
      */}
      <p className="max-w-xs text-center text-xs text-[#8D869B]">
        {message ?? PC_FALLBACK_HINT}
      </p>
    </div>
  )
}
