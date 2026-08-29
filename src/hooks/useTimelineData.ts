import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import {
  ADD_PAST_YEARS_STEP,
  DEFAULT_YEAR_COUNT,
  LOCAL_STORAGE_KEY,
} from '../constants/timeline'
import type { TimelineData } from '../types/timeline'
import {
  deleteItemGroup,
  migrateLegacyItemsToGroups,
  upsertItemGroup,
  validateGroupRange,
  type ItemGroupInput,
  type SaveItemGroupResult,
} from '../utils/itemGroups'
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
    (value) => ({
      ...value,
      years: migrateLegacyItemsToGroups(value.years),
    }),
  )

  /**
   * 1件の項目登録（グループ）を保存する。範囲内のどこかの年が上限（3件）を
   * 超える場合は何も書き込まず、conflictYearsを添えて失敗を返す
   * （全部reject。部分的な登録はしない。詳細は7章参照）。
   *
   * 上限チェックは直前にレンダーされた（＝直前の確定状態である）data.years
   * に対して行う。この画面は1回のフォーム送信ごとに検証→保存の1往復で
   * 完結する設計であり、既存の年移動などの上限チェックと同じ前提
   * （連続でsetDataを呼び分けない限りレンダー済みの状態は最新である）に
   * 立っている。
   */
  const saveItemGroup = useCallback(
    (input: ItemGroupInput): SaveItemGroupResult => {
      const validation = validateGroupRange(
        data.years,
        input.startYear,
        input.endYear,
        input.groupId ?? undefined,
      )
      if (!validation.ok) return validation

      setData((prev) => ({
        ...prev,
        years: upsertItemGroup(prev.years, input),
      }))
      return { ok: true }
    },
    [data.years, setData],
  )

  const removeItemGroup = useCallback(
    (groupId: string) => {
      setData((prev) => ({
        ...prev,
        years: deleteItemGroup(prev.years, groupId),
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

  /** 入力済みの年表データをすべて削除し、初期状態に戻す */
  const resetAll = useCallback(() => {
    setData(createInitialData())
  }, [setData])

  return {
    years: data.years,
    saveItemGroup,
    removeItemGroup,
    addPastYears,
    resetAll,
  }
}
