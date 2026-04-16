import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { HelpTopic } from '../../../shared/types/help'

// Mock Ionic modal controller
vi.mock('@ionic/vue', () => ({
  modalController: {
    create: vi.fn()
  },
  IonPage: { name: 'IonPage' },
  IonHeader: { name: 'IonHeader' },
  IonToolbar: { name: 'IonToolbar' },
  IonTitle: { name: 'IonTitle' },
  IonButtons: { name: 'IonButtons' },
  IonButton: { name: 'IonButton' },
  IonIcon: { name: 'IonIcon' },
  IonContent: { name: 'IonContent' },
  IonSegment: { name: 'IonSegment' },
  IonSegmentButton: { name: 'IonSegmentButton' },
  IonLabel: { name: 'IonLabel' },
  IonText: { name: 'IonText' }
}))

// Mock HelpModal component
vi.mock('../../../app/components/help/HelpModal.vue', () => ({
  default: { name: 'HelpModal' }
}))

// useHelp will be imported dynamically in each test to reset singleton state

// Mock modal instance
const mockModal = {
  present: vi.fn(),
  dismiss: vi.fn(),
  onDidDismiss: vi.fn(),
  querySelector: vi.fn()
}

// Mock performance.now
const mockPerformanceNow = vi.spyOn(performance, 'now')

describe('useHelp', () => {
  let mockModalController: { create: ReturnType<typeof vi.fn> }
  let useHelp: typeof import('~/composables/useHelp').useHelp
  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset singleton state by clearing module cache
    vi.resetModules()

    // Re-import useHelp to get fresh singleton
    const helpModule = await import('../../../app/composables/useHelp')
    useHelp = helpModule.useHelp

    // Get mocked modalController
    const ionicModule = await import('@ionic/vue')
    mockModalController = ionicModule.modalController as {
      create: ReturnType<typeof vi.fn>
    }

    // Setup default mock implementations
    mockModal.present.mockResolvedValue(undefined)
    mockModal.dismiss.mockResolvedValue(undefined)
    mockModal.querySelector.mockReturnValue(null)
    mockModalController.create.mockResolvedValue(mockModal)

    mockPerformanceNow.mockReturnValue(100)

    // Reset modal mock
    mockModal.onDidDismiss.mockReturnValue(Promise.resolve({ data: undefined, role: undefined }))

    // Mock window properties
    Object.defineProperty(window, 'pageYOffset', {
      value: 100,
      writable: true,
      configurable: true
    })

    // Mock window.scrollTo
    window.scrollTo = vi.fn()

    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: { tagName: 'BUTTON', focus: vi.fn() },
      writable: true,
      configurable: true
    })
  })

  describe('Singleton pattern', () => {
    it('should only create one modal instance', async () => {
      const { showHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          // Don't call callback immediately to keep modal "open"
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      // Open first modal
      await showHelp(HelpTopic.GETTING_STARTED)
      expect(mockModalController.create).toHaveBeenCalledTimes(1)

      // Try to open second modal while first is still open
      await showHelp(HelpTopic.ACCOUNT_SECURITY)

      // Should not create a second modal
      expect(mockModalController.create).toHaveBeenCalledTimes(1)

      // Cleanup - simulate dismiss
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })

    it('should focus existing modal if already open', async () => {
      const { showHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      const mockModalElement = { focus: vi.fn() }
      mockModal.querySelector.mockResolvedValue(mockModalElement)

      // Open first modal
      await showHelp(HelpTopic.GETTING_STARTED)

      // Try to open second modal while first is still open
      await showHelp(HelpTopic.ACCOUNT_SECURITY)

      expect(mockModal.querySelector).toHaveBeenCalledWith(
        '[autofocus], button, [href], input, select, textarea, ' + '[tabindex]:not([tabindex="-1"])'
      )

      // Cleanup
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })
  })

  describe('showHelp', () => {
    it('should show help modal with valid topic', async () => {
      const { showHelp } = useHelp()

      await showHelp(HelpTopic.GETTING_STARTED)

      expect(mockModalController.create).toHaveBeenCalledWith({
        component: expect.any(Object),
        componentProps: {
          topic: HelpTopic.GETTING_STARTED,
          fallbackContent: {
            title: 'Help',
            content: 'Help content is not available for this topic.',
            sections: []
          }
        },
        cssClass: 'help-modal',
        backdropDismiss: true,
        keyboardClose: true,
        showBackdrop: true,
        animated: true
      })

      expect(mockModal.present).toHaveBeenCalled()
    })

    it('should handle invalid topic', async () => {
      const { showHelp } = useHelp()

      await showHelp('invalid.topic' as HelpTopic)

      // Should still create modal but with null topic
      expect(mockModalController.create).toHaveBeenCalledWith(
        expect.objectContaining({
          componentProps: expect.objectContaining({
            topic: null
          })
        })
      )
    })

    it('should handle undefined topic', async () => {
      const { showHelp } = useHelp()

      await showHelp(undefined)

      expect(mockModalController.create).toHaveBeenCalledWith(
        expect.objectContaining({
          componentProps: expect.objectContaining({
            topic: null
          })
        })
      )
    })

    it('should handle modal creation error', async () => {
      const { showHelp } = useHelp()

      mockModalController.create.mockRejectedValueOnce(new Error('Creation failed'))

      await expect(showHelp(HelpTopic.GETTING_STARTED)).rejects.toThrow(
        'Unable to create help modal. Please try again.'
      )
    })

    it('should handle modal present error', async () => {
      const { showHelp } = useHelp()

      mockModal.present.mockRejectedValueOnce(new Error('Present failed'))

      await expect(showHelp(HelpTopic.GETTING_STARTED)).rejects.toThrow('Present failed')
    })
  })

  describe('hideHelp', () => {
    it('should dismiss open modal', async () => {
      const { showHelp, hideHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)
      await hideHelp()

      expect(mockModal.dismiss).toHaveBeenCalled()

      // Cleanup
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })

    it('should handle no modal to hide', async () => {
      const { hideHelp } = useHelp()

      await hideHelp()

      expect(mockModal.dismiss).not.toHaveBeenCalled()
    })

    it('should handle dismiss error gracefully', async () => {
      const { showHelp, hideHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      mockModal.dismiss.mockRejectedValueOnce(new Error('Dismiss failed'))
      await hideHelp()

      // Cleanup
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })
  })

  describe('isHelpOpen', () => {
    it('should return false initially', () => {
      const { isHelpOpen } = useHelp()

      expect(isHelpOpen()).toBe(false)
    })

    it('should return true when modal is open', async () => {
      const { showHelp, isHelpOpen } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      expect(isHelpOpen()).toBe(true)

      // Cleanup
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })
  })

  describe('Modal lifecycle', () => {
    it('should handle modal dismissal', async () => {
      const { showHelp } = useHelp()

      let dismissCallback: (value: { data: undefined; role?: string }) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: (value: { data: undefined }) => void) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })
    })

    it('should restore scroll position on dismiss', async () => {
      const { showHelp } = useHelp()

      window.pageYOffset = 500
      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      let dismissCallback: (value: { data: undefined; role?: string }) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: (value: { data: undefined }) => void) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })

      expect(scrollToSpy).toHaveBeenCalledWith(0, 500)
    })

    it('should restore focus on dismiss', async () => {
      const { showHelp } = useHelp()

      const mockElement = { tagName: 'INPUT', focus: vi.fn() }
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        configurable: true
      })

      let dismissCallback: (value: { data: undefined; role?: string }) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: (value: { data: undefined }) => void) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })

      expect(mockElement.focus).toHaveBeenCalled()
    })

    it('should handle dismiss callback error', async () => {
      const { showHelp } = useHelp()

      let catchCallback: (error: Error) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: () => {
            return {
              catch: (callback: (error: Error) => void) => {
                catchCallback = callback
              }
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate error in dismiss handler
      catchCallback(new Error('Dismiss handler error'))
    })
  })

  describe('Keyboard handling', () => {
    it('should close modal on ESC key', async () => {
      const { showHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: ((value: { data: undefined }) => void) | null = null
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: (value: { data: undefined }) => void) => {
          dismissResolve = callback
          return { catch: vi.fn() as () => void }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate ESC key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)

      await nextTick()

      // Cleanup
      if (dismissResolve) {
        dismissResolve({ data: undefined })
      }
    })

    it('should not close modal on other keys', async () => {
      const { showHelp } = useHelp()

      await showHelp(HelpTopic.GETTING_STARTED)

      // Simulate Enter key press
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(event)

      await nextTick()

      // Modal dismiss should not be called for non-Escape keys
      expect(mockModal.dismiss).not.toHaveBeenCalled()
    })

    it('should not close modal if no modal is open', async () => {
      const { isHelpOpen } = useHelp()

      // Ensure modal is not open
      expect(isHelpOpen()).toBe(false)

      // Simulate ESC key press without modal
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)

      await nextTick()

      // Modal should still be closed
      expect(isHelpOpen()).toBe(false)
    })
  })

  describe('Error handling', () => {
    it('should handle scroll position save error', async () => {
      const { showHelp } = useHelp()

      // Make pageYOffset throw an error
      Object.defineProperty(window, 'pageYOffset', {
        get() {
          throw new Error('Cannot access pageYOffset')
        },
        configurable: true
      })

      await showHelp(HelpTopic.GETTING_STARTED)
    })

    it('should handle focus save error', async () => {
      const { showHelp } = useHelp()

      // Make activeElement throw an error
      Object.defineProperty(document, 'activeElement', {
        get() {
          throw new Error('Cannot access activeElement')
        },
        configurable: true
      })

      await showHelp(HelpTopic.GETTING_STARTED)
    })

    it('should handle scroll restore error', async () => {
      const { showHelp } = useHelp()

      window.pageYOffset = 500

      // Make scrollTo throw an error
      window.scrollTo = vi.fn().mockImplementation(() => {
        throw new Error('Cannot scroll')
      })

      let dismissCallback: (value: { data: undefined; role?: string }) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: (value: { data: undefined }) => void) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)
      dismissCallback({ data: undefined })
    })

    it('should handle focus restore error', async () => {
      const { showHelp } = useHelp()

      const mockElement = {
        tagName: 'INPUT',
        focus: vi.fn().mockImplementation(() => {
          throw new Error('Cannot focus')
        })
      }
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        configurable: true
      })

      let dismissCallback: (value: { data: undefined; role?: string }) => void = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: (value: { data: undefined }) => void) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.GETTING_STARTED)
      dismissCallback({ data: undefined })
    })
  })
})
