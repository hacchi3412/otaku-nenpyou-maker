import { useState, type RefObject } from 'react'
import { buildTwitterIntentCaption, SITE_URL } from '../../constants/share'
import { trackEvent } from '../../utils/analytics'
import { exportNodeAsPngBlob } from '../../utils/exportImage'

interface MobileCompleteFlowProps {
  /** 画像として書き出す対象（幅固定の年表本体）への参照 */
  exportTargetRef: RefObject<HTMLElement | null>
  /** シェア文言に使う表示名（空文字なら「わたし」表示）。見出しと同じ値を使う */
  displayName: string
  /** 完成時点で年表に入っている項目数（全年合計）。GA4のitem_countパラメータ用 */
  itemCount: number
}

type Phase = 'editing' | 'generating' | 'done'

/**
 * モバイル専用の「完成」フロー（詳細は7章参照）。
 *
 * 背景：X・LINEのアプリ内蔵ブラウザ（WebView）では、Web Share API・
 * `<a download>`によるファイルダウンロードのいずれも機能しないことが多い。
 * X（Twitter）のアプリ内蔵ブラウザはUser-Agentに一切目印が付かず検出も
 * できないため、「環境を判定して分岐する」実装ではこの穴を埋めきれない。
 * そこでモバイルでは、環境を問わず一律で「完成した画像をその場に大きく
 * 表示し、長押しで保存してもらう」方式に統一した。長押し保存はOS標準の
 * 機能でありJSの高度なAPIに依存しないため、Web Share API・ファイル
 * ダウンロードのどちらも使えない環境でも確実に機能する。
 *
 * 「Xに投稿する」もJSの`window.open()`（非同期に呼ぶとポップアップ
 * ブロックの対象になりうることが判明した。詳細は7章参照）を使わず、
 * 実体が`<a href>`の通常のリンクにすることで、アプリ内蔵ブラウザを含めて
 * どこでも確実に開けるようにしている。
 *
 * 通常のモバイルSafari/Chrome等、Web Share APIが使える環境向けの分岐
 * （共有シート経由での自動添付）は、環境判定そのものに起因する不具合を
 * 繰り返し踏んだ経緯（詳細は7章参照）を踏まえてあえて廃止し、常にこの
 * フローに統一している。
 */
export function MobileCompleteFlow({
  exportTargetRef,
  displayName,
  itemCount,
}: MobileCompleteFlowProps) {
  const [phase, setPhase] = useState<Phase>('editing')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleComplete = async () => {
    if (!exportTargetRef.current) return
    setPhase('generating')
    setErrorMessage(null)
    try {
      const blob = await exportNodeAsPngBlob(exportTargetRef.current)
      setImageUrl(URL.createObjectURL(blob))
      setPhase('done')
      // 長押し保存はOS側の操作のため、実際に保存されたかどうかはJSから
      // 検知できない。「完成画面が表示された（長押しで保存できる状態に
      // なった）」ことを保存の代理指標として計測する（詳細は7章参照）
      trackEvent('image_save', {
        method: 'long_press',
        item_count: itemCount,
      })
    } catch (error) {
      console.error(error)
      setErrorMessage('画像の生成に失敗しました。もう一度お試しください。')
      setPhase('editing')
    }
  }

  const handleBack = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    setImageUrl(null)
    setPhase('editing')
  }

  if (phase === 'done' && imageUrl) {
    // この経路では画像を投稿欄に自動添付できないため、投稿画面に
    // 切り替わった後も気づけるよう、投稿欄のテキスト自体に添付を促す
    // 一言を含めておく（詳細はbuildTwitterIntentCaptionのコメント・7章参照）
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildTwitterIntentCaption(displayName))}&url=${encodeURIComponent(SITE_URL)}`

    return (
      <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[#FAF8FC] px-4 py-4">
        <button
          type="button"
          onClick={handleBack}
          className="self-start rounded-full px-2 py-1 text-sm text-[#6B6375] transition hover:text-[#262230]"
        >
          ＜ 編集に戻る
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
          <img
            src={imageUrl}
            alt="完成したオタク年表"
            className="w-full max-w-md rounded-lg border border-[#E5E0EE] shadow-sm"
          />
          <p className="font-kaku text-sm text-[#6B6375]">
            ▲画像を長押しで保存してください
          </p>
          <a
            href={intentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent('share', {
                method: 'twitter_intent',
                item_count: itemCount,
              })
            }
            className="mt-2 rounded-full bg-[#262230] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A3448]"
          >
            Xに投稿する
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleComplete}
        disabled={phase === 'generating'}
        className="rounded-full bg-[#262230] px-8 py-2.5 text-sm font-medium text-white transition hover:bg-[#3A3448] disabled:opacity-50"
      >
        {phase === 'generating' ? '生成中…' : '完成！'}
      </button>
      {errorMessage && (
        <p className="max-w-xs text-center text-xs text-[#E4738A]">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
