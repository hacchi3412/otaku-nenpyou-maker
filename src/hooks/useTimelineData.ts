import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import {
  ADD_PAST_YEARS_STEP,
  DEFAULT_YEAR_COUNT,
  LOCAL_STORAGE_KEY,
  MAX_ITEMS_PER_YEAR,
} from '../constants/timeline'
import type { TimelineData, TimelineItem } from '../types/timeline'
import {
  findExistingColorForTitle,
  findExistingCommentForTitle,
  propagateItemsByTitle,
} from '../utils/itemSync'
import { createInitialYears, prependPastYears } from '../utils/years'

function createInitialData(): TimelineData {
  return {
    version: 1,
    years: createInitialYears(DEFAULT_YEAR_COUNT),
  }
}

/**
 * 年表データ（localStorage永続化）と、それに対する更新操作をまとめて提供する。
 */
export function useTimelineData() {
  const [data, setData] = useLocalStorage<TimelineData>(
    LOCAL_STORAGE_KEY,
    createInitialData(),
  )

  const updateYearItems = useCallback(
    (year: number, items: TimelineItem[]) => {
      setData((prev) => {
        const trimmedItems = items.slice(0, MAX_ITEMS_PER_YEAR)
        const prevItemIds = new Set(
          (prev.years.find((entry) => entry.year === year)?.items ?? []).map(
            (item) => item.id,
          ),
        )

        // 新規追加された項目（前後の年から引き継ぐ場合を含む）は、
        // すでに他の年で使われている同じジャンル名のコメント・カラーがあれば引き継ぐ。
        // コメントは自由記述なので空の場合のみ、カラーはジャンルの識別子的な
        // 位置づけなので見つかれば常に引き継ぐ（新規項目にはこの時点で
        // ランダムな色が入っているだけなので、既存ジャンルの色で上書きする）
        const itemsWithInheritedFields = trimmedItems.map((item) => {
          const isNewItem = !prevItemIds.has(item.id)
          if (!isNewItem) return item

          const inheritedComment =
            item.comment === ''
              ? findExistingCommentForTitle(prev.years, item.title)
              : undefined
          const inheritedColor = findExistingColorForTitle(
            prev.years,
            item.title,
          )

          if (inheritedComment === undefined && inheritedColor === undefined) {
            return item
          }
          return {
            ...item,
            ...(inheritedComment !== undefined
              ? { comment: inheritedComment }
              : {}),
            ...(inheritedColor !== undefined ? { color: inheritedColor } : {}),
          }
        })

        const updatedYears = prev.years.map((entry) =>
          entry.year === year
            ? { ...entry, items: itemsWithInheritedFields }
            : entry,
        )

        // 同じジャンル名を持つ項目のコメント・カラーを、今回更新した年の内容に
        // 揃えて他の年にも伝播する（どの年で編集しても全年に反映されるようにする）
        return {
          ...prev,
          years: propagateItemsByTitle(updatedYears, itemsWithInheritedFields),
        }
      })
    },
    [setData],
  )

  const addPastYears = useCallback(() => {
    setData((prev) => ({
      ...prev,
      years: prependPastYears(prev.years, ADD_PAST_YEARS_STEP),
    }))
  }, [setData])

  /** 入力済みの年表データをすべて削除し、初期状態に戻す */
  const resetAll = useCallback(() => {
    setData(createInitialData())
  }, [setData])

  return { years: data.years, updateYearItems, addPastYears, resetAll }
}
