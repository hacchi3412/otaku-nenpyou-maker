import { useEffect, useState } from 'react'

/**
 * localStorageと同期するstate。
 * SSRは行わないアプリのため、初期値の読み込みは同期的にwindow.localStorageから行う。
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
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
