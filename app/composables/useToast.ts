import { toastController } from '@ionic/vue'

export const useToast = () => {
  const showSuccess = async (message: string, duration = 3000) => {
    const toast = await toastController.create({
      message,
      duration,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    return toast
  }

  const showError = async (message: string, duration = 5000) => {
    const toast = await toastController.create({
      message,
      duration,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
    return toast
  }

  const showWarning = async (message: string, duration = 3000) => {
    const toast = await toastController.create({
      message,
      duration,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return toast
  }

  const showInfo = async (message: string, duration = 3000) => {
    const toast = await toastController.create({
      message,
      duration,
      color: 'medium',
      position: 'top'
    })
    await toast.present()
    return toast
  }

  // Also expose the original controller for advanced usage
  return {
    ...toastController,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}