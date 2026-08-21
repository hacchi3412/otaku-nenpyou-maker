import { useState } from 'react'
import { Header } from './components/Header'
import { InputFormPanel } from './features/input-form/InputFormPanel'
import { PreviewPanel } from './features/preview/PreviewPanel'
import { useTimelineData } from './hooks/useTimelineData'

type MobileTab = 'input' | 'preview'

function App() {
  const { years, updateYearItems, addPastYears } = useTimelineData()
  const [mobileTab, setMobileTab] = useState<MobileTab>('input')

  return (
    <div className="min-h-svh bg-[#FAF8FC]">
      <Header />

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
            className={mobileTab === 'input' ? 'block' : 'hidden lg:block'}
          >
            <InputFormPanel
              years={years}
              onChangeYearItems={updateYearItems}
              onAddPastYears={addPastYears}
            />
          </section>
          <section
            className={mobileTab === 'preview' ? 'block' : 'hidden lg:block'}
          >
            <PreviewPanel years={years} />
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
