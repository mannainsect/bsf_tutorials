import { computed } from 'vue'
import {
  TIMEZONE_IDENTIFIERS,
  POPULAR_TIMEZONE_VALUES,
  type TimezoneIdentifier
} from '~/utils/timezones'

export interface Timezone {
  value: string
  label: string
}

/**
 * Extract readable label from timezone identifier
 */
function getTimezoneLabel(tzIdentifier: string): string {
  if (tzIdentifier === 'UTC') return 'UTC'
  const parts = tzIdentifier.split('/')
  const city = parts[parts.length - 1].replace(/_/g, ' ')
  if (parts.length > 2) {
    return `${parts[1]} - ${city}`
  }
  return city
}

/**
 * Generate Timezone object from identifier
 */
function createTimezone(identifier: string): Timezone {
  return {
    value: identifier,
    label: getTimezoneLabel(identifier)
  }
}

export const useTimezones = () => {
  const timezones = computed<Timezone[]>(() => {
    const tzList = TIMEZONE_IDENTIFIERS.map(id => createTimezone(id))
    return tzList.sort((a, b) => a.label.localeCompare(b.label))
  })

  const getTimezoneByValue = (value: string): Timezone | undefined => {
    if (!value) return undefined
    return timezones.value.find(tz => tz.value === value)
  }

  const getTimezoneDisplayLabel = (value: string): string => {
    if (!value) return ''
    const timezone = getTimezoneByValue(value)
    return timezone?.label || value
  }

  const getPopularTimezones = (): Timezone[] => {
    return POPULAR_TIMEZONE_VALUES.map(value =>
      getTimezoneByValue(value)
    ).filter((tz): tz is Timezone => tz !== undefined)
  }

  return {
    timezones,
    getTimezoneByValue,
    getTimezoneLabel: getTimezoneDisplayLabel,
    getPopularTimezones
  }
}
