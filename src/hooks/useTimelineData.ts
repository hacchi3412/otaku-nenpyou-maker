import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import {
  ADD_PAST_YEARS_STEP,
  DEFAULT_YEAR_COUNT,
  LOCAL_STORAGE_KEY,
  MAX_ITEMS_PER_YEAR,
} from '../constants/timeline'
import type { TimelineData, TimelineItem } from '../types/timeline'
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
      setData((prev) => ({
        ...prev,
        years: prev.years.map((entry) =>
          entry.year === year
            ? { ...entry, items: items.slice(0, MAX_ITEMS_PER_YEAR) }
            : entry,
        ),
      }))
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
