import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { TutorialOverlay } from './components/TutorialOverlay'
import {
  DISPLAY_NAME_STORAGE_KEY,
  TUTORIAL_SEEN_STORAGE_KEY,
} from './constants/timeline'
import { InputFormPanel } from './features/input-form/InputFormPanel'
import { PreviewPanel } from './features/preview/PreviewPanel'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useTimelineData } from './hooks/useTimelineData'

type MobileTab = 'input' | 'preview'
type TutorialStep = 1 | 2

function App() {
  const { years, updateYearItems, addPastYears, resetAll } = useTimelineData()
  const [displayName, setDisplayName] = useLocalStorage(
    DISPLAY_NAME_STORAGE_KEY,
    '',
  )
  const [mobileTab, setMobileTab] = useState<MobileTab>('input')

  // 初回訪問時のスポットライト・チュートリアル。
  // ユーザーテストで「開いた瞬間何をしていいかわからない」という声があったため導入。
  // 一度閉じる（✕、または最終ステップの完了）とlocalStorageに記録し、以降は出さない。
  const [tutorialSeen, setTutorialSeen] = useLocalStorage(
    TUTORIAL_SEEN_STORAGE_KEY,
    false,
  )
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(1)
  const inputSectionRef = useRef<HTMLElement>(null)
  const previewSectionRef = useRef<HTMLElement>(null)

  // プレビュー上のブロックをタップした項目のコメント欄へジャンプする機能。
  // 「プレビューを見て直したい箇所に気づいても、入力フォームへ戻って該当欄を
  // 探すのが面倒」という声を受けたもの（詳細は7章参照）。
  // モバイルではタブ切り替え直後は対象要素がhidden（display:none）のため、
  // タブ切り替えの状態更新とフォーカス処理を分ける必要がある。当初は
  // useEffectで「タブ切り替え後にDOM検索してフォーカス」を行っていたが、
  // それだと.focus()の呼び出しがタップのイベントハンドラから見て非同期
  // （次のティック）になってしまい、iOS Safariなどでは「ユーザー操作に
  // 直接紐づかない.focus()」とみなされてキーボードが開かない＝実際には
  // フォーカスが当たらないことがある、との指摘を受けた。
  // そこでflushSyncを使い、タブ切り替えの状態更新を同期的にDOMへ反映させて
  // から、同じクリックハンドラ内（＝同じユーザー操作の呼び出しスタック内）で
  // 続けてfocus()を呼ぶようにした。これによりタップ操作と地続きの
  // フォーカスとして扱われるようになる。
  //
  // さらに、focus()直後のscrollIntoView()は「仮想キーボードが出る前」の
  // レイアウト（layout viewport）を基準に位置を計算してしまう。iOS Safari
  // 等は、キーボード表示時にlayout viewport自体は縮小せず、実際に見えている
  // 範囲（visual viewport）だけが縮小する挙動のため、scrollIntoView()を
  // 何度呼び直しても計算結果は変わらず、キーボードの下に隠れたままになる
  // （scrollIntoViewはvisual viewportを考慮しない）。
  // そこで、visualViewportのresizeイベント（キーボード表示に伴う縮小）を
  // 検知したら、対象要素の位置と「実際に見えている範囲」の中心とのズレを
  // 自前で計算し、そのズレの分だけwindow.scrollByで補正する。resizeが
  // 発火しない環境（PC等、仮想キーボードが出ない場合）のフォールバックとして
  // タイムアウトも設定し、どちらか早い方で一度だけ補正する。
  const handleEditItemFromPreview = (itemId: string) => {
    flushSync(() => {
      setMobileTab('input')
    })
    const target = document.querySelector<HTMLElement>(
      `[data-comment-for="${itemId}"]`,
    )
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    let rescrolled = false
    const rescrollAfterKeyboard = () => {
      if (rescrolled || !target) return
      rescrolled = true
      const viewport = window.visualViewport
      if (!viewport) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
      const rect = target.getBoundingClientRect()
      const rectCenter = rect.top + rect.height / 2
      const visibleCenter = viewport.offsetTop + viewport.height / 2
      window.scrollBy({ top: rectCenter - visibleCenter, behavior: 'smooth' })
    }
    window.visualViewport?.addEventListener('resize', rescrollAfterKeyboard, {
      once: true,
    })
    window.setTimeout(rescrollAfterKeyboard, 400)
  }

  const closeTutorial = () => setTutorialSeen(true)
  const advanceTutorial = () => {
    if (tutorialStep === 1) {
      setTutorialStep(2)
      // スマホは選択中タブしか表示されないため、ステップ2の対象（プレビュー）が
      // 実際に見えるよう、進めると同時にタブも切り替える。PC表示では両方常に
      // 見えているため、この切り替えは見た目に影響しない
      setMobileTab('preview')
    } else {
      closeTutorial()
    }
  }

  return (
    <div className="min-h-svh bg-[#FFFBF6]">
      <Header onResetAll={resetAll} />

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        {/* スマホ：入力／プレビューのタブ切り替え */}
        <div className="mb-4 flex gap-2 rounded-full border-2 border-[#262230] bg-white p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab('input')}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              mobileTab === 'input'
                ? 'bg-[#262230] text-white'
                : 'text-[#8D869B]'
            }`}
          >
            入力
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
              mobileTab === 'preview'
                ? 'bg-[#262230] text-white'
                : 'text-[#8D869B]'
            }`}
          >
            プレビュー
          </button>
        </div>

        {/* PC：左右並び／スマホ：選択中タブのみ表示 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section
            ref={inputSectionRef}
            className={mobileTab === 'input' ? 'block' : 'hidden lg:block'}
          >
            <InputFormPanel
              years={years}
              onChangeYearItems={updateYearItems}
              onAddPastYears={addPastYears}
            />
          </section>
          <section
            ref={previewSectionRef}
            className={mobileTab === 'preview' ? 'block' : 'hidden lg:block'}
          >
            <PreviewPanel
              years={years}
              displayName={displayName}
              onDisplayNameChange={setDisplayName}
              onEditItem={handleEditItemFromPreview}
            />
          </section>
        </div>
      </main>

      <Footer />

      {!tutorialSeen &&
        (tutorialStep === 1 ? (
          <TutorialOverlay
            targetRef={inputSectionRef}
            step={1}
            totalSteps={2}
            title="ここから年表を作ろう"
            description="ハマってきたものを、年ごとに入力してみましょう。作品でも、キャラでも、ジャンルでも自由です。"
            nextLabel="次へ"
            onNext={advanceTutorial}
            onClose={closeTutorial}
          />
        ) : (
          <TutorialOverlay
            targetRef={previewSectionRef}
            step={2}
            totalSteps={2}
            title="入力するとリアルタイムで反映"
            description="入力した内容が、ここに年表画像としてすぐに反映されます。完成したら画像として保存したり、Xでシェアしたりできます。"
            nextLabel="はじめる"
            onNext={advanceTutorial}
            onClose={closeTutorial}
          />
        ))}
    </div>
  )
}

export default App
