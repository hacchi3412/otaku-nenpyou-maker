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

/**
 * 入力フォーム・プレビューの両パネルで共通のsticky指定。
 * PC幅（lg:）でスクロールに追従させつつ、パネル自身の高さが画面の縦幅を
 * 超えた場合はパネル内でスクロールできるようにする（詳細は下記JSXの
 * コメント・7章参照）
 */
const STICKY_PANEL_CLASSNAME =
  'lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#D8D2E4] [&::-webkit-scrollbar-track]:bg-transparent'

function App() {
  const { years, saveItemGroup, removeItemGroup, addPastYears, resetAll } =
    useTimelineData()
  const [displayName, setDisplayName] = useLocalStorage(
    DISPLAY_NAME_STORAGE_KEY,
    '',
  )
  const [mobileTab, setMobileTab] = useState<MobileTab>('input')
  // 入力フォーム（ItemGroupForm）が現在編集中の項目。nullなら新規登録モード。
  // InputFormPanel単体ではなくAppで持つ理由：プレビュー上のブロックをタップ
  // した時にも、モバイルタブの切り替えと同期的に（同じflushSync内で）この
  // 状態を切り替える必要があるため（詳細は下記handleEditItemFromPreview参照）
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)

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

  // プレビュー上のブロックをタップした項目の登録フォームへジャンプする機能。
  // 「プレビューを見て直したい箇所に気づいても、入力フォームへ戻って該当欄を
  // 探すのが面倒」という声を受けたもの（詳細は7章参照）。
  // モバイルではタブ切り替え直後は対象要素がhidden（display:none）のため、
  // タブ切り替えの状態更新とフォーカス処理を分ける必要がある。当初は
  // useEffectで「タブ切り替え後にDOM検索してフォーカス」を行っていたが、
  // それだと.focus()の呼び出しがタップのイベントハンドラから見て非同期
  // （次のティック）になってしまい、iOS Safariなどでは「ユーザー操作に
  // 直接紐づかない.focus()」とみなされてキーボードが開かない＝実際には
  // フォーカスが当たらないことがある、との指摘を受けた。
  // そこでflushSyncを使い、タブ切り替え＋編集対象の切り替えを同期的にDOMへ
  // 反映させてから、同じクリックハンドラ内（＝同じユーザー操作の呼び出し
  // スタック内）で続けてfocus()を呼ぶようにした。これによりタップ操作と
  // 地続きのフォーカスとして扱われるようになる。
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
  const handleEditItemFromPreview = (groupId: string) => {
    flushSync(() => {
      setMobileTab('input')
      setEditingGroupId(groupId)
    })
    const target = document.querySelector<HTMLElement>('[data-item-form-title]')
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

  // 「入力欄をどんどん書き進めると、タブが画面上部にあり何度もスクロールして
  // 戻らないと切り替えられない」という指摘を受け、タブ切り替え時は常に
  // ページ先頭までスクロールし直すようにした。タブバー自体もsticky
  // （下記JSX）にして常時タップできるようにしているが、切り替え後の
  // スクロール位置をそのままにすると、切り替え先のタブで意図しない位置
  // （下の方の余白など）が表示されたままになりうるため、あわせて対応した
  // （詳細は7章参照）
  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
        {/*
          スマホ：入力／プレビューのタブ切り替え。
          年カードを下までスクロールしてもタブへすぐ手が届くよう、
          スクロールしても画面上部に貼り付くsticky指定にしている
          （詳細は7章参照）。z-20はTutorialOverlay・CompleteFlow
          （いずれもz-[100]）より低いままにし、それらが表示された際は
          きちんと覆われるようにしている
        */}
        <div className="sticky top-2 z-20 mb-4 flex gap-2 rounded-full bg-white p-1 shadow-sm lg:hidden">
          <button
            type="button"
            onClick={() => handleMobileTabChange('input')}
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
            onClick={() => handleMobileTabChange('preview')}
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
            {/*
              入力フォームも、プレビューと同じ理由・同じ仕組みでPC幅（lg:）
              のみスクロールに追従するsticky指定にしている（詳細は下記
              プレビュー側のコメント・7章参照）。登録済み項目の一覧
              （`ItemGroupList`）が増えて全体の高さが画面の縦幅を超えても、
              登録フォーム自体は常に画面内に留まり、一覧側だけがこのdiv内で
              スクロールする。
            */}
            <div className={STICKY_PANEL_CLASSNAME}>
              <InputFormPanel
                years={years}
                editingGroupId={editingGroupId}
                onEditingGroupIdChange={setEditingGroupId}
                onSaveItemGroup={saveItemGroup}
                onDeleteItemGroup={removeItemGroup}
                onAddPastYears={addPastYears}
              />
            </div>
          </section>
          <section
            ref={previewSectionRef}
            className={mobileTab === 'preview' ? 'block' : 'hidden lg:block'}
          >
            {/*
              PCでは、入力欄が縦に長くなるほどプレビューが早々に画面外へ
              流れてしまい確認しづらいという指摘を受け、PC幅（lg:）のみ
              スクロールに追従するsticky指定にしている（詳細は7章参照）。
              sticky自体はこの内側のdivに付け、外側のsection（グリッド
              アイテム）は従来通りグリッドの行の高さいっぱいに伸びたまま
              にしておく必要がある（sectionの高さを内容に合わせて縮めて
              しまうと、sticky先が入力欄と同じ高さ分だけ「動ける余地」を
              失い、追従しなくなるため）。スマホでは1カラム表示のため
              位置固定は不要（lg:のみ有効）。

              年表自体が長くなり、プレビュー（見出し＋チャート＋完成
              ボタン等）の高さが画面の縦幅を超えると、sticky要素は
              画面内に収まらない分をそのまま画面外にはみ出させるだけで
              スクロールする手段を持たないため、「完成」ボタンや年表の
              下の方の項目が画面内に入らず見えなくなる（ブラウザを縮小
              しないと出てこない）という指摘があった。対処として、この
              divの高さを画面の縦幅基準で頭打ちにし（lg:max-h-[...]）、
              収まりきらない分はこのdiv自身の中でスクロールできるように
              した（lg:overflow-y-auto）。プレビューの高さが画面に収まる
              間は今まで通り何も変わらず、収まらない場合だけこのdiv内に
              スクロールバーが現れる。

              OSやブラウザによってはスクロール可能な領域でも既定では
              スクロールバーが常時表示されず（ホバー時のみ等）、内容が
              途中で切れているだけなのかスクロールできるのか一見わかり
              にくいため、スクロールバー自体を細く・薄い色で常時見える
              スタイルに指定している（Firefox向けscrollbar-width、
              Chrome/Safari向け::-webkit-scrollbar系の両方をカバー）。
              入力フォーム側（上記）も同じクラスをそのまま流用している
            */}
            <div className={STICKY_PANEL_CLASSNAME}>
              <PreviewPanel
                years={years}
                displayName={displayName}
                onDisplayNameChange={setDisplayName}
                onEditItem={handleEditItemFromPreview}
              />
            </div>
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
            description="ハマってきたものを、年ごとに入力してみよう。作品でも、キャラでも、ジャンルでも自由です。"
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
