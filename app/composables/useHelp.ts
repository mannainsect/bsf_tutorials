import { modalController } from '@ionic/vue'
import type { Ref } from 'vue'
import { ref, onUnmounted, getCurrentInstance } from 'vue'
import type { HelpTopic } from '../../shared/types/help'
import { isValidHelpTopic } from '../../shared/types/help'
import HelpModal from '~/components/help/HelpModal.vue'

// Singleton modal instance reference with stronger typing
let currentModal: HTMLIonModalElement | null = null
let isCreating = false
const isModalOpen: Ref<boolean> = ref(false)
const modalOpenTime: Ref<number> = ref(0)

// Scroll position management
let savedScrollPosition: number = 0

// Focus management
let previousActiveElement: HTMLElement | null = null

export const useHelp = () => {
  const { t } = useI18n()

  const translate = (
    key: string,
    fallback: string,
    params?: Record<string, unknown>
  ): string => {
    const translated = params ? t(key, params) : t(key)
    return translated === key ? fallback : translated
  }

  // Fallback content for missing topics
  const getFallbackContent = () => ({
    title: translate('help.fallback.title', 'Help'),
    content: translate(
      'help.fallback.content',
      'Help content is not available for this topic.'
    ),
    sections: []
  })

  /**
   * Validate and sanitize help topic
   * @param topic - Topic to validate
   * @returns Validated topic or null
   */
  const validateTopic = (topic?: HelpTopic): HelpTopic | null => {
    if (!topic) {
      console.debug('[useHelp] No topic provided')
      return null
    }

    if (typeof topic !== 'string') {
      console.warn('[useHelp] Invalid help topic type:', typeof topic)
      return null
    }

    if (!isValidHelpTopic(topic)) {
      console.warn('[useHelp] Invalid help topic:', topic)
      return null
    }

    return topic
  }

  /**
   * Save current scroll position
   */
  const saveScrollPosition = (): void => {
    try {
      savedScrollPosition =
        window.pageYOffset || document.documentElement.scrollTop
      console.debug('[useHelp] Saved scroll position:', savedScrollPosition)
    } catch (error) {
      console.warn('[useHelp] Failed to save scroll position:', error)
    }
  }

  /**
   * Restore saved scroll position
   */
  const restoreScrollPosition = (): void => {
    try {
      if (savedScrollPosition > 0) {
        window.scrollTo(0, savedScrollPosition)
        console.debug(
          '[useHelp] Restored scroll position:',
          savedScrollPosition
        )
        savedScrollPosition = 0
      }
    } catch (error) {
      console.warn('[useHelp] Failed to restore scroll position:', error)
    }
  }

  /**
   * Save current focus element
   */
  const saveFocus = (): void => {
    try {
      previousActiveElement = document.activeElement as HTMLElement
      console.debug(
        '[useHelp] Saved focus element:',
        previousActiveElement?.tagName ?? ''
      )
    } catch (error) {
      console.warn('[useHelp] Failed to save focus:', error)
    }
  }

  /**
   * Restore focus to previous element
   */
  const restoreFocus = (): void => {
    try {
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus()
        console.debug(
          '[useHelp] Restored focus to:',
          previousActiveElement.tagName
        )
        previousActiveElement = null
      }
    } catch (error) {
      console.warn('[useHelp] Failed to restore focus:', error)
    }
  }

  /**
   * Show the help modal with optional topic
   * @param topic - Optional help topic to display
   */
  const showHelp = async (topic?: HelpTopic): Promise<void> => {
    const startTime = performance.now()

    try {
      // Enhanced singleton enforcement
      if (isModalOpen.value || isCreating) {
        console.warn('[useHelp] Modal already open, preventing duplicate')
        if (currentModal) {
          try {
            // Try to focus first focusable element within the modal
            const el = currentModal.querySelector<HTMLElement>(
              '[autofocus], button, [href], input, select, textarea, ' +
                '[tabindex]:not([tabindex="-1"])'
            )
            el?.focus()
          } catch {
            console.debug('[useHelp] Could not focus existing help modal')
          }
        }
        return
      }

      // Validate topic
      const validatedTopic = validateTopic(topic)

      // Opening help modal
      console.log('[useHelp] Opening help modal', {
        topic: validatedTopic ?? null
      })

      // Save current state
      saveScrollPosition()
      saveFocus()

      // Error boundary wrapper for modal creation
      isCreating = true
      try {
        currentModal = await modalController.create({
          component: HelpModal,
          componentProps: {
            topic: validatedTopic,
            fallbackContent: getFallbackContent()
          },
          cssClass: 'help-modal',
          backdropDismiss: true,
          keyboardClose: true,
          showBackdrop: true,
          animated: true
        })
      } catch (createError) {
        console.error('[useHelp] Failed to create modal:', createError)
        // Attempt recovery
        currentModal = null
        isModalOpen.value = false
        throw new Error(
          translate(
            'errors.help.createModalFailed',
            'Unable to create help modal. Please try again.'
          )
        )
      }

      isModalOpen.value = true
      modalOpenTime.value = Date.now()

      // Enhanced dismissal handling
      currentModal
        .onDidDismiss()
        .then((result: unknown) => {
          const duration = Date.now() - modalOpenTime.value
          console.log('[useHelp] Modal dismissed', { duration, result })
          // Modal dismissed
          currentModal = null
          isModalOpen.value = false
          modalOpenTime.value = 0

          // Restore previous state
          restoreScrollPosition()
          restoreFocus()
        })
        .catch((error: unknown) => {
          console.error('[useHelp] Error in dismiss handler:', error)
          currentModal = null
          isModalOpen.value = false
          modalOpenTime.value = 0
        })

      // Present with error handling
      await currentModal.present()

      const loadTime = performance.now() - startTime
      const formattedLoadTime = loadTime.toFixed(2)
      // Modal presented successfully
      console.log('[useHelp] Modal presented successfully', {
        loadTime: `${formattedLoadTime}ms`
      })

      // Performance warning
      if (loadTime > 200) {
        console.warn(
          '[useHelp] Modal took longer than 200ms to open:',
          `${formattedLoadTime}ms`
        )
      }
    } catch (error) {
      console.error('[useHelp] Error showing help modal:', error)
      currentModal = null
      isModalOpen.value = false
      modalOpenTime.value = 0

      // Restore state on error
      restoreScrollPosition()
      restoreFocus()

      // Re-throw with user-friendly message
      throw new Error(
        error instanceof Error
          ? error.message
          : translate('errors.help.openFailed', 'Failed to open help.')
      )
    } finally {
      isCreating = false
    }
  }

  /**
   * Hide the currently open help modal
   */
  const hideHelp = async (): Promise<void> => {
    try {
      if (currentModal) {
        // Hiding help modal
        console.log('[useHelp] Hiding help modal')
        await currentModal.dismiss()
      } else {
        // No modal to hide
        console.log('[useHelp] No modal to hide')
      }
    } catch (error) {
      console.error('[useHelp] Error hiding help modal:', error)
      // Clean up state even if dismiss fails
      currentModal = null
      isModalOpen.value = false
      modalOpenTime.value = 0
    }
  }

  /**
   * Check if help modal is currently open
   */
  const isHelpOpen = (): boolean => {
    return isModalOpen.value
  }

  /**
   * Setup keyboard event handlers
   */
  const setupKeyboardHandlers = (): void => {
    const handleEscape = async (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpen.value) {
        console.debug('[useHelp] Escape key pressed, closing modal')
        await hideHelp()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleEscape)

      // Cleanup on unmount only when inside a component instance
      const instance = getCurrentInstance()
      if (instance) {
        onUnmounted(() => {
          window.removeEventListener('keydown', handleEscape)
        })
      }
    }
  }

  // Initialize keyboard handlers
  setupKeyboardHandlers()

  // Test-only reset helper to avoid cross-test leakage
  const __resetHelpForTests = () => {
    currentModal = null
    isCreating = false
    isModalOpen.value = false
    modalOpenTime.value = 0
    savedScrollPosition = 0
    previousActiveElement = null
  }

  return {
    showHelp,
    hideHelp,
    isHelpOpen,
    __resetHelpForTests
  }
}

// Test-only reset helper to avoid cross-test leakage
// Exposed for unit/integration tests to reset internal singleton state safely
/*
export const __resetHelpForTests = () => {
  currentModal = null
  isCreating = false
  isModalOpen.value = false
  modalOpenTime.value = 0
  savedScrollPosition = 0
  previousActiveElement = null

}
*/
