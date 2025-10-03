import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  let mockModalController: any
  let useHelp: any
  let originalConsole: {
    log: typeof console.log
    warn: typeof console.warn
    error: typeof console.error
    debug: typeof console.debug
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset singleton state by clearing module cache
    vi.resetModules()

    // Re-import useHelp to get fresh singleton
    const helpModule = await import('../../../app/composables/useHelp')
    useHelp = helpModule.useHelp

    // Get mocked modalController
    const ionicModule = await import('@ionic/vue')
    mockModalController = ionicModule.modalController as any

    // Setup default mock implementations
    mockModal.present.mockResolvedValue(undefined)
    mockModal.dismiss.mockResolvedValue(undefined)
    mockModal.querySelector.mockReturnValue(null)
    mockModalController.create.mockResolvedValue(mockModal)

    mockPerformanceNow.mockReturnValue(100)

    // Store original console methods
    originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    }

    // Mock console methods
    console.log = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
    console.debug = vi.fn()

    // Reset modal mock
    mockModal.onDidDismiss.mockReturnValue(
      Promise.resolve({ data: undefined, role: undefined })
    )

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

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log
    console.warn = originalConsole.warn
    console.error = originalConsole.error
    console.debug = originalConsole.debug
  })

  describe('Singleton pattern', () => {
    it('should only create one modal instance', async () => {
      const { showHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          // Don't call callback immediately to keep modal "open"
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      // Open first modal
      await showHelp(HelpTopic.MARKET_FILTERING)
      expect(mockModalController.create).toHaveBeenCalledTimes(1)

      // Try to open second modal while first is still open
      await showHelp(HelpTopic.PRODUCT_CONTACT)

      // Should not create a second modal
      expect(mockModalController.create).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Modal already open, preventing duplicate'
      )

      // Cleanup - simulate dismiss
      if (dismissResolve) dismissResolve({ data: undefined })
    })

    it('should focus existing modal if already open', async () => {
      const { showHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      const mockModalElement = { focus: vi.fn() }
      mockModal.querySelector.mockResolvedValue(mockModalElement)

      // Open first modal
      await showHelp(HelpTopic.MARKET_FILTERING)

      // Try to open second modal while first is still open
      await showHelp(HelpTopic.PRODUCT_CONTACT)

      expect(mockModal.querySelector).toHaveBeenCalledWith(
        '[autofocus], button, [href], input, select, textarea, ' +
        '[tabindex]:not([tabindex="-1"])'
      )

      // Cleanup
      if (dismissResolve) dismissResolve({ data: undefined })
    })
  })

  describe('showHelp', () => {
    it('should show help modal with valid topic', async () => {
      const { showHelp } = useHelp()

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(mockModalController.create).toHaveBeenCalledWith({
        component: expect.any(Object),
        componentProps: {
          topic: HelpTopic.MARKET_FILTERING,
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
      expect(console.log).toHaveBeenCalledWith(
        '[useHelp] Opening help modal',
        expect.any(Object)
      )
    })

    it('should handle invalid topic', async () => {
      const { showHelp } = useHelp()

      await showHelp('invalid.topic' as HelpTopic)

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Invalid help topic:',
        'invalid.topic'
      )

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

      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] No topic provided'
      )

      expect(mockModalController.create).toHaveBeenCalledWith(
        expect.objectContaining({
          componentProps: expect.objectContaining({
            topic: null
          })
        })
      )
    })

    it('should track performance metrics', async () => {
      const { showHelp } = useHelp()

      mockPerformanceNow.mockReturnValueOnce(100) // start
      mockPerformanceNow.mockReturnValueOnce(150) // end

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.log).toHaveBeenCalledWith(
        '[useHelp] Modal presented successfully',
        expect.objectContaining({
          loadTime: '50.00ms'
        })
      )
    })

    it('should warn if modal takes too long to open', async () => {
      const { showHelp } = useHelp()

      mockPerformanceNow.mockReturnValueOnce(100) // start
      mockPerformanceNow.mockReturnValueOnce(350) // end (250ms)

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Modal took longer than 200ms to open:',
        '250.00ms'
      )
    })

    it('should save scroll position', async () => {
      const { showHelp } = useHelp()

      window.pageYOffset = 500

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] Saved scroll position:',
        500
      )
    })

    it('should save focus element', async () => {
      const { showHelp } = useHelp()

      const mockElement = { tagName: 'INPUT', focus: vi.fn() }
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        configurable: true
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] Saved focus element:',
        'INPUT'
      )
    })

    it('should handle modal creation error', async () => {
      const { showHelp } = useHelp()

      mockModalController.create.mockRejectedValueOnce(
        new Error('Creation failed')
      )

      await expect(showHelp(HelpTopic.MARKET_FILTERING)).rejects.toThrow(
        'Unable to create help modal. Please try again.'
      )

      expect(console.error).toHaveBeenCalledWith(
        '[useHelp] Failed to create modal:',
        expect.any(Error)
      )
    })

    it('should handle modal present error', async () => {
      const { showHelp } = useHelp()

      mockModal.present.mockRejectedValueOnce(new Error('Present failed'))

      await expect(showHelp(HelpTopic.MARKET_FILTERING)).rejects.toThrow(
        'Present failed'
      )

      expect(console.error).toHaveBeenCalledWith(
        '[useHelp] Error showing help modal:',
        expect.any(Error)
      )
    })
  })

  describe('hideHelp', () => {
    it('should dismiss open modal', async () => {
      const { showHelp, hideHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)
      await hideHelp()

      expect(mockModal.dismiss).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        '[useHelp] Hiding help modal'
      )

      // Cleanup
      if (dismissResolve) dismissResolve({ data: undefined })
    })

    it('should handle no modal to hide', async () => {
      const { hideHelp } = useHelp()

      await hideHelp()

      expect(mockModal.dismiss).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        '[useHelp] No modal to hide'
      )
    })

    it('should handle dismiss error gracefully', async () => {
      const { showHelp, hideHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      mockModal.dismiss.mockRejectedValueOnce(new Error('Dismiss failed'))
      await hideHelp()

      expect(console.error).toHaveBeenCalledWith(
        '[useHelp] Error hiding help modal:',
        expect.any(Error)
      )

      // Cleanup
      if (dismissResolve) dismissResolve({ data: undefined })
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
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(isHelpOpen()).toBe(true)

      // Cleanup
      if (dismissResolve) dismissResolve({ data: undefined })
    })
  })

  describe('Modal lifecycle', () => {
    it('should handle modal dismissal', async () => {
      const { showHelp } = useHelp()

      let dismissCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: Function) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })

      expect(console.log).toHaveBeenCalledWith(
        '[useHelp] Modal dismissed',
        expect.any(Object)
      )
    })

    it('should restore scroll position on dismiss', async () => {
      const { showHelp } = useHelp()

      window.pageYOffset = 500
      const scrollToSpy = vi.spyOn(window, 'scrollTo')

      let dismissCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: Function) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })

      expect(scrollToSpy).toHaveBeenCalledWith(0, 500)
      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] Restored scroll position:',
        500
      )
    })

    it('should restore focus on dismiss', async () => {
      const { showHelp } = useHelp()

      const mockElement = { tagName: 'INPUT', focus: vi.fn() }
      Object.defineProperty(document, 'activeElement', {
        value: mockElement,
        configurable: true
      })

      let dismissCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: Function) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate modal dismiss
      dismissCallback({ data: undefined, role: 'backdrop' })

      expect(mockElement.focus).toHaveBeenCalled()
      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] Restored focus to:',
        'INPUT'
      )
    })

    it('should handle dismiss callback error', async () => {
      const { showHelp } = useHelp()

      let catchCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: () => {
            return {
              catch: (callback: Function) => {
                catchCallback = callback
              }
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate error in dismiss handler
      catchCallback(new Error('Dismiss handler error'))

      expect(console.error).toHaveBeenCalledWith(
        '[useHelp] Error in dismiss handler:',
        expect.any(Error)
      )
    })
  })

  describe('Keyboard handling', () => {
    it('should close modal on ESC key', async () => {
      const { showHelp, hideHelp } = useHelp()

      // Setup modal to stay open
      let dismissResolve: any
      mockModal.onDidDismiss.mockReturnValue({
        then: (callback: Function) => {
          dismissResolve = callback
          return { catch: vi.fn() }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate ESC key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      window.dispatchEvent(event)

      await nextTick()

      expect(console.debug).toHaveBeenCalledWith(
        '[useHelp] Escape key pressed, closing modal'
      )

      // Cleanup
      if (dismissResolve) dismissResolve({ data: undefined })
    })

    it('should not close modal on other keys', async () => {
      const { showHelp } = useHelp()

      await showHelp(HelpTopic.MARKET_FILTERING)

      // Simulate Enter key press
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      window.dispatchEvent(event)

      await nextTick()

      expect(console.debug).not.toHaveBeenCalledWith(
        '[useHelp] Escape key pressed, closing modal'
      )
    })

    it('should not close modal if no modal is open', async () => {
      const { hideHelp, isHelpOpen } = useHelp()

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

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Failed to save scroll position:',
        expect.any(Error)
      )
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

      await showHelp(HelpTopic.MARKET_FILTERING)

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Failed to save focus:',
        expect.any(Error)
      )
    })

    it('should handle scroll restore error', async () => {
      const { showHelp } = useHelp()

      window.pageYOffset = 500

      // Make scrollTo throw an error
      window.scrollTo = vi.fn().mockImplementation(() => {
        throw new Error('Cannot scroll')
      })

      let dismissCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: Function) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)
      dismissCallback({ data: undefined })

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Failed to restore scroll position:',
        expect.any(Error)
      )
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

      let dismissCallback: Function = () => {}
      mockModal.onDidDismiss.mockImplementation(() => {
        return {
          then: (callback: Function) => {
            dismissCallback = callback
            return {
              catch: vi.fn()
            }
          }
        }
      })

      await showHelp(HelpTopic.MARKET_FILTERING)
      dismissCallback({ data: undefined })

      expect(console.warn).toHaveBeenCalledWith(
        '[useHelp] Failed to restore focus:',
        expect.any(Error)
      )
    })
  })
})