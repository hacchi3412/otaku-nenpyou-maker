import type { TimelineItem, YearEntry } from '../types/timeline'
import { MAX_ITEMS_PER_YEAR } from '../constants/timeline'

/** 年表上で連続して縦につながる1つのブロック区間 */
export interface LaneSegment {
  /** レーン番号（0始まり、最大3レーン） */
  lane: number
  /**
   * 区間の内容として表示する項目。
   * 複数年にまたがる場合は開始年の項目（タイトル・コメント・カラー）を使う。
   */
  item: TimelineItem
  /** 表示対象年配列（getVisibleYearsの戻り値）における開始インデックス */
  startIndex: number
  /** 連続する年数（1以上） */
  length: number
}

/**
 * 先頭側（一番古い側）の空欄年を除外した、表示対象の年配列を返す。
 * 途中の空欄年は時間軸の連続性を保つためそのまま残す。
 */
export function getVisibleYears(years: YearEntry[]): YearEntry[] {
  const firstNonEmptyIndex = years.findIndex((entry) => entry.items.length > 0)
  if (firstNonEmptyIndex === -1) {
    return []
  }
  return years.slice(firstNonEmptyIndex)
}

/**
 * 各年の項目を最大3レーンに割り当てる。
 * 年をまたいで作品名が完全一致する項目は同じレーンに配置し、
 * 1つの連続したセグメントとして扱う（線でつながって見えるように）。
 *
 * 年ごとの項目数は3以下（入力フォーム側で担保）であることを前提とする。
 */
export function computeLaneSegments(visibleYears: YearEntry[]): LaneSegment[] {
  const segments: LaneSegment[] = []
  // 各レーンで現在進行中のセグメント（続いていなければnull）
  const active: (LaneSegment | null)[] = Array(MAX_ITEMS_PER_YEAR).fill(null)

  visibleYears.forEach((entry, yearIndex) => {
    const matchedLanes = new Set<number>()
    const newItems: TimelineItem[] = []

    // 1. 前年から続く項目（タイトル完全一致）を同じレーンに割り当て、区間を延長する
    for (const item of entry.items) {
      const laneIndex = active.findIndex(
        (segment, lane) =>
          segment !== null &&
          !matchedLanes.has(lane) &&
          segment.item.title === item.title,
      )
      if (laneIndex === -1) {
        newItems.push(item)
      } else {
        matchedLanes.add(laneIndex)
        // segmentsに積んだオブジェクトと同一参照なので、直接更新する
        active[laneIndex]!.length += 1
      }
    }

    // 2. 今年に続かなかったレーンは空きに戻す
    active.forEach((segment, lane) => {
      if (segment !== null && !matchedLanes.has(lane)) {
        active[lane] = null
      }
    })

    // 3. 新規項目を空いているレーンへ順に割り当てる
    for (const item of newItems) {
      const freeLane = active.findIndex((segment) => segment === null)
      if (freeLane === -1) {
        // 年あたり最大3項目という前提が守られていれば発生しない
        continue
      }
      const segment: LaneSegment = {
        lane: freeLane,
        item,
        startIndex: yearIndex,
        length: 1,
      }
      segments.push(segment)
      active[freeLane] = segment
    }
  })

  return segments
}
