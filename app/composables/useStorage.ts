import type { JsonSerializable } from '../../shared/types'

export const useStorage = () => {
  const set = <T extends JsonSerializable>(key: string, value: T): void => {
    if (import.meta.client) {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  const get = <T extends JsonSerializable>(key: string): T | null => {
    if (import.meta.client) {
      const item = localStorage.getItem(key)
      if (item === null) return null
      try {
        return JSON.parse(item) as T
      } catch {
        localStorage.removeItem(key)
        return null
      }
    }
    return null
  }

  const remove = (key: string) => {
    if (import.meta.client) {
      localStorage.removeItem(key)
    }
  }

  const clear = () => {
    if (import.meta.client) {
      localStorage.clear()
    }
  }

  return {
    set,
    get,
    remove,
    clear
  }
}
