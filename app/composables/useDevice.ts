import { Device } from '@capacitor/device'

export const useDevice = () => {
  const getInfo = async () => {
    return await Device.getInfo()
  }

  const getBatteryInfo = async () => {
    return await Device.getBatteryInfo()
  }

  const getLanguageCode = async () => {
    return await Device.getLanguageCode()
  }

  return {
    getInfo,
    getBatteryInfo,
    getLanguageCode
  }
}
