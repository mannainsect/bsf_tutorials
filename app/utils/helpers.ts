// Array utilities
export const uniqueArray = <T>(array: T[]): T[] => {
  return [...new Set(array)]
}

export const groupBy = <T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item)
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    },
    {} as Record<K, T[]>
  )
}

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => string | number | Date,
  direction: 'asc' | 'desc' = 'asc'
): T[] => {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a)
    const bVal = keyFn(b)

    if (direction === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })
}

// Object utilities
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete result[key]
  })
  return result
}

export const isEmpty = (value: unknown): boolean => {
  if (value == null) return true
  if (Array.isArray(value) || typeof value === 'string') {
    return value.length === 0
  }
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// Function utilities
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Async utilities
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> => {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs)
      return retry(fn, retries - 1, delayMs)
    }
    throw error
  }
}

// URL utilities
export const buildUrl = (
  base: string,
  params: Record<string, string | number | boolean | null | undefined>
): string => {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  })
  return url.toString()
}

// Random utilities
export const generateId = (length = 8): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Regex utilities
export const isValidRegex = (pattern: string): boolean => {
  try {
    // Check for ReDoS patterns (catastrophic backtracking)
    // Only check for truly dangerous nested quantifiers
    if (pattern.includes('(') && pattern.includes(')')) {
      // Check for patterns like (a+)+, (a*)+, (.+)+, etc
      const nestedQuantifier = /\([^)]*[+*]\)[+*]/
      const nestedBraces = /\([^)]*\{[^}]*\}\)[+*]/

      if (nestedQuantifier.test(pattern) || nestedBraces.test(pattern)) {
        // But allow safe patterns like (/path)*
        if (!/\(\/[^)]*\)\*/.test(pattern)) {
          console.warn('Potentially dangerous regex pattern detected')
          return false
        }
      }
    }

    // Try to compile the regex
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

export const createSafeRegex = (
  pattern: string,
  flags = ''
): RegExp | null => {
  try {
    // Check for ReDoS patterns (catastrophic backtracking)
    // Only check for truly dangerous nested quantifiers
    if (pattern.includes('(') && pattern.includes(')')) {
      // Check for patterns like (a+)+, (a*)+, (.+)+, etc
      const nestedQuantifier = /\([^)]*[+*]\)[+*]/
      const nestedBraces = /\([^)]*\{[^}]*\}\)[+*]/

      if (nestedQuantifier.test(pattern) || nestedBraces.test(pattern)) {
        // But allow safe patterns like (/path)*
        if (!/\(\/[^)]*\)\*/.test(pattern)) {
          console.warn('Potentially dangerous regex pattern detected')
          return null
        }
      }
    }

    // Try to compile the regex once
    // This combines validation and creation in a single step
    return new RegExp(pattern, flags)
  } catch {
    return null
  }
}
