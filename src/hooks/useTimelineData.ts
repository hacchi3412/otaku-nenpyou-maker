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
  findExistingCommentForTitle,
  propagateCommentsByTitle,
} from '../utils/commentSync'
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
        // すでに他の年で使われている同じジャンル名のコメントがあれば引き継ぐ
        const itemsWithInheritedComments = trimmedItems.map((item) => {
          const isNewItem = !prevItemIds.has(item.id)
          if (isNewItem && item.comment === '') {
            const inherited = findExistingCommentForTitle(
              prev.years,
              item.title,
            )
            if (inherited !== undefined) {
              return { ...item, comment: inherited }
            }
          }
          return item
        })

        const updatedYears = prev.years.map((entry) =>
          entry.year === year
            ? { ...entry, items: itemsWithInheritedComments }
            : entry,
        )

        // 同じジャンル名を持つ項目のコメントを、今回更新した年の内容に揃えて
        // 他の年にも伝播する（どの年で編集しても全年に反映されるようにする）
        return {
          ...prev,
          years: propagateCommentsByTitle(
            updatedYears,
            itemsWithInheritedComments,
          ),
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

  return { years: data.years, updateYearItems, addPastYears }
}
