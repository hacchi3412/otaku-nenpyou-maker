import type { YearEntry } from '../../types/timeline'

interface PreviewPanelProps {
  years: YearEntry[]
}

/**
 * 年表画像のプレビュー。
 * TODO: 年軸・作品ブロック・装飾SVGの描画、画像保存／Xシェア機能を実装する。
 */
export function PreviewPanel({ years }: PreviewPanelProps) {
  const rangeLabel =
    years.length > 0 ? `${years[0].year}-${years[years.length - 1].year}` : ''

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[#F0ECF5] bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-[#262230]">わたしのオタク年表</h2>
      {rangeLabel && (
        <span className="mt-2 inline-flex items-center rounded-full bg-[#F5F2FA] px-3 py-1 text-xs font-medium text-[#8D869B]">
          {rangeLabel}
        </span>
      )}
      <p className="mt-6 text-sm text-[#8D869B]">
        年表プレビューは近日実装予定です
      </p>
    </div>
  )
}
