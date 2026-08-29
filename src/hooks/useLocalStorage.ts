import { useEffect, useState } from 'react'

/**
 * localStorageと同期するstate。
 * SSRは行わないアプリのため、初期値の読み込みは同期的にwindow.localStorageから行う。
 *
 * migrateを渡すと、読み込んだ値（新規訪問時はinitialValue）に対して
 * レンダー前・同期的に適用する。データ構造を変更した際、初回レンダーの
 * 時点で既に新しい形になっている必要がある処理（例：groupId方式への移行。
 * 詳細はitemGroups.tsのコメント参照）に使う。useEffectでの事後移行だと、
 * 移行前の状態のまま最初の描画が走ってしまうため。
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  migrate?: (value: T) => T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      const parsed = stored ? (JSON.parse(stored) as T) : initialValue
      return migrate ? migrate(parsed) : parsed
    } catch (error) {
      console.warn(`localStorageの読み込みに失敗しました (key: ${key})`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`localStorageの保存に失敗しました (key: ${key})`, error)
    }
  }, [key, value])

  return [value, setValue] as const
}
