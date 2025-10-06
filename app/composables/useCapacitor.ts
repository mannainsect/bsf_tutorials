import { Capacitor } from '@capacitor/core'

export const useCapacitor = () => {
  const isNative = computed(() => Capacitor.isNativePlatform())
  const platform = computed(() => Capacitor.getPlatform())
  const isAndroid = computed(() => platform.value === 'android')
  const isIOS = computed(() => platform.value === 'ios')
  const isWeb = computed(() => platform.value === 'web')

  return {
    isNative,
    platform,
    isAndroid,
    isIOS,
    isWeb
  }
}
