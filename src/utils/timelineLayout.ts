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
 * 年をまたいで同じグループ（1回の登録操作、`item.groupId`が一致）の項目は
 * 同じレーンに配置し、1つの連続したセグメントとして扱う（線でつながって
 * 見えるように）。かつてはタイトル文字列の完全一致で判定していたが、
 * 登録・編集の単位を明確にするためgroupId方式に変更した（詳細は7章参照）。
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

    // 1. 前年から続く項目（同じgroupId）を同じレーンに割り当て、区間を延長する
    for (const item of entry.items) {
      const laneIndex = active.findIndex(
        (segment, lane) =>
          segment !== null &&
          !matchedLanes.has(lane) &&
          segment.item.groupId === item.groupId,
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

/** 年表カードのレイアウト定数（PreviewPanel・TimelineChartで共通利用） */
/** 年の目盛り欄の横幅。年を4桁フルで表示するため、下2桁略記だった頃より広めに取っている */
export const AXIS_WIDTH = 44
/** レーン1つあたりの横幅（px） */
export const LANE_WIDTH = 482 / 3
export const LANE_GAP = 10
/** カードの左右パディング合計（px-7 = 28px × 2） */
const CARD_PADDING_X = 56
/**
 * レーン数が少ないときに見出しが窮屈にならないための最小幅。
 * 表示名（最大DISPLAY_NAME_MAX_LENGTH文字）を使った最長の見出し
 * 「（表示名10文字）のオタク年表」が1行に収まる幅を、実描画で確認して決めている。
 */
const MIN_CHART_WIDTH = 400

/**
 * 実際に使われているレーン数（1〜MAX_ITEMS_PER_YEAR）を返す。
 * セグメントが1つもない場合は1を返す。
 */
export function getUsedLaneCount(segments: LaneSegment[]): number {
  if (segments.length === 0) {
    return 1
  }
  return Math.max(...segments.map((segment) => segment.lane + 1))
}

/**
 * 実際に使われているレーン数に応じた年表カードの横幅（px）を返す。
 * ブロック列が少ないときに右側へ余分な余白ができないよう、
 * レーン数に比例して幅を縮める（見出しが窮屈にならない最小幅は下限として維持）。
 */
export function getChartWidth(laneCount: number): number {
  const raw = CARD_PADDING_X + AXIS_WIDTH + laneCount * (LANE_WIDTH + LANE_GAP)
  return Math.max(MIN_CHART_WIDTH, raw)
}
