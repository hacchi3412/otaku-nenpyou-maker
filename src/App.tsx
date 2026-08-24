import { useEffect, useRef, useState } from 'react'
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
  // 入力タブへの切り替えとスクロール＋フォーカスを同じイベントハンドラ内で
  // 行うと、切り替え直後はまだ対象要素がhidden（display:none）のままなので
  // 見つからない。setMobileTabとjumpRequestの更新は同じレンダーに含まれ、
  // useEffectはDOM更新後に実行されるため、ここでの検索は確実にタブ切り替え
  // 後の表示状態に対して行われる。
  // tokenを毎回変えているのは、同じ項目を連続でタップしてもオブジェクトの
  // 参照が変わり、確実にuseEffectが再実行されるようにするため（stateを
  // 使い終わった後にnullへ戻すような、effect内でのsetStateは避けている）。
  const [jumpRequest, setJumpRequest] = useState<{
    itemId: string
    token: number
  } | null>(null)

  useEffect(() => {
    if (!jumpRequest) return
    const target = document.querySelector<HTMLElement>(
      `[data-comment-for="${jumpRequest.itemId}"]`,
    )
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [jumpRequest])

  const handleEditItemFromPreview = (itemId: string) => {
    setMobileTab('input')
    setJumpRequest({ itemId, token: Date.now() })
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
    <div className="min-h-svh bg-[#FAF8FC]">
      <Header onResetAll={resetAll} />

      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
        {/* スマホ：入力／プレビューのタブ切り替え */}
        <div className="mb-4 flex gap-2 rounded-full bg-white p-1 shadow-sm lg:hidden">
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
