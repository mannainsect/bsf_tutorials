import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageComposer from '~/components/messaging/MessageComposer.vue'
import {
  mockContactProductResponse,
  createLongMessage
} from '../../fixtures/messaging'
const mockIcons = {
  close: 'close-icon',
  send: 'send-icon'
}
global.useIcons = vi.fn(() => mockIcons)
const mockSendInitialMessage = vi.fn()
const mockIsSending = ref(false)
const mockMessagingError = ref<Error | null>(null)
const mockClearError = vi.fn(() => {
  mockMessagingError.value = null
})
vi.mock('~/composables/useMessaging', () => ({
  useMessaging: vi.fn(() => ({
    sendInitialMessage: mockSendInitialMessage,
    isSending: mockIsSending,
    error: mockMessagingError,
    clearError: mockClearError
  }))
}))
describe('MessageComposer', () => {
  const mockProduct = {
    id: 'product-123',
    title: 'Test Product',
    company_name: 'Test Company',
    description: 'Product description',
    price: 99.99,
    price_currency: 'USD',
    category: 'Electronics',
    subcategory: 'Components',
    company_id: 'company-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
  const mockWantedItem = {
    id: 'wanted-456',
    title: 'Wanted Item',
    company_name: 'Buyer Company',
    description: 'Looking for this item',
    category: 'Electronics',
    subcategory: 'Parts',
    company_id: 'company-2',
    budget_min: 50,
    budget_max: 150,
    budget_currency: 'USD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
  const defaultProps = {
    isOpen: true
  }
  const createWrapper = (props = {}) => {
    return mount(MessageComposer, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          IonModal: {
            template: '<div><slot /></div>',
            props: ['isOpen', 'backdropDismiss', 'keyboardClose'],
            emits: ['ion-modal-did-dismiss'],
            mounted() {
              this.$el.dismiss = vi.fn()
            }
          },
          IonHeader: true,
          IonToolbar: true,
          IonTitle: true,
          IonButtons: true,
          IonButton: true,
          IonIcon: true,
          IonContent: true,
          IonItem: true,
          IonLabel: true,
          IonTextarea: {
            template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" :maxlength="maxlength" :disabled="disabled" :rows="rows" />',
            props: ['modelValue', 'placeholder', 'maxlength', 'disabled',
                     'rows', 'autoGrow'],
            emits: ['update:modelValue']
          },
          IonText: true,
          IonSpinner: true
        },
        mocks: {
          $t: (key: string) => key
        }
      }
    })
  }
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsSending.value = false
    mockMessagingError.value = null
  })
  describe('Component Rendering', () => {
    it('should mount successfully', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })
    it('should display product information when product prop is provided', () => {
      const wrapper = createWrapper({ product: mockProduct })
      const html = wrapper.html()
      expect(html).toContain(mockProduct.title)
      expect(html).toContain(mockProduct.company_name)
    })
    it('should display wanted item information when wantedItem prop is provided',
       () => {
      const wrapper = createWrapper({ wantedItem: mockWantedItem })
      const html = wrapper.html()
      expect(html).toContain(mockWantedItem.title)
      expect(html).toContain(mockWantedItem.company_name)
    })
    it('should not display product/wanted info when neither prop is provided',
       () => {
      const wrapper = createWrapper()
      const html = wrapper.html()
      expect(html).not.toContain(mockProduct.title)
      expect(html).not.toContain(mockWantedItem.title)
    })
    it('should display error message when error exists', async () => {
      const wrapper = createWrapper()
      const errorMessage = 'Test error message'
      mockMessagingError.value = new Error(errorMessage)
      await nextTick()
      expect(wrapper.html()).toContain(errorMessage)
    })
  })
  describe('Message Input', () => {
    it('should update message text when typing', async () => {
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = 'Hello, I am interested'
      await nextTick()
      expect(wrapper.vm.messageText).toBe('Hello, I am interested')
    })
    it('should show character count', () => {
      const wrapper = createWrapper()
      expect(wrapper.html()).toContain('0 / 1000')
    })
    it('should update character count as user types', async () => {
      const wrapper = createWrapper()
      const message = 'Test message'
      wrapper.vm.messageText = message
      await nextTick()
      expect(wrapper.html()).toContain(`${message.length} / 1000`)
    })
    it('should enforce max length of 1000 characters', () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('[data-test="message-input"]')
      expect(textarea.attributes('maxlength')).toBe('1000')
    })
    it('should disable textarea when sending', async () => {
      mockIsSending.value = true
      const wrapper = createWrapper({ product: mockProduct })
      const textarea = wrapper.find('[data-test="message-input"]')
      expect(textarea.attributes('disabled')).toBeDefined()
    })
  })
  describe('Send Button', () => {
    it('should be disabled when message is empty', () => {
      const wrapper = createWrapper({ product: mockProduct })
      expect(wrapper.vm.canSend).toBe(false)
    })
    it('should be disabled when message is only whitespace', async () => {
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = '   '
      await nextTick()
      expect(wrapper.vm.canSend).toBe(false)
    })
    it('should be enabled when valid message and product exist', async () => {
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = 'Valid message'
      await nextTick()
      expect(wrapper.vm.canSend).toBe(true)
    })
    it('should be enabled when valid message and wanted item exist', async () => {
      const wrapper = createWrapper({ wantedItem: mockWantedItem })
      wrapper.vm.messageText = 'Valid message'
      await nextTick()
      expect(wrapper.vm.canSend).toBe(true)
    })
    it('should be disabled when message exceeds 1000 characters', async () => {
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = createLongMessage(1001)
      await nextTick()
      expect(wrapper.vm.canSend).toBe(false)
    })
    it('should be disabled when currently sending', async () => {
      mockIsSending.value = true
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = 'Valid message'
      await nextTick()
      expect(wrapper.vm.canSend).toBe(false)
    })
    it('should be disabled when no product or wanted item', async () => {
      const wrapper = createWrapper()
      wrapper.vm.messageText = 'Valid message'
      await nextTick()
      const canSend = wrapper.vm.messageText.trim().length > 0 &&
                      wrapper.vm.messageText.length <= 1000 &&
                      !mockIsSending.value &&
                      false
      expect(canSend).toBe(false)
    })
    it('should show spinner when sending', async () => {
      mockIsSending.value = true
      const wrapper = createWrapper({ product: mockProduct })
      const spinner = wrapper.find('[data-test="sending-spinner"]')
      expect(spinner.exists()).toBe(true)
    })
    it('should show send icon when not sending', () => {
      const wrapper = createWrapper({ product: mockProduct })
      expect(wrapper.find('[data-test="sending-spinner"]').exists())
        .toBe(false)
      expect(wrapper.html()).toContain(mockIcons.send)
    })
  })
  describe('Send Functionality', () => {
    it('should send message with product ID', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.modalRef.$el = {
        dismiss: vi.fn()
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(mockSendInitialMessage).toHaveBeenCalledWith(
        mockProduct.id,
        'Test message',
        mockProduct.company_id,
        false
      )
    })
    it('should send message with wanted item ID', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const wrapper = createWrapper({ wantedItem: mockWantedItem })
      wrapper.vm.modalRef.$el = {
        dismiss: vi.fn()
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(mockSendInitialMessage).toHaveBeenCalledWith(
        mockWantedItem.id,
        'Test message',
        mockWantedItem.company_id,
        false
      )
    })
    it('should emit sent event on successful send', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.modalRef.$el = {
        dismiss: vi.fn()
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(wrapper.emitted('sent')).toBeTruthy()
      expect(wrapper.emitted('sent')?.[0]).toEqual([mockContactProductResponse])
    })
    it('should clear message text after successful send', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.modalRef.$el = {
        dismiss: vi.fn()
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(wrapper.vm.messageText).toBe('')
    })
    it('should dismiss modal after successful send', async () => {
      mockSendInitialMessage.mockResolvedValue(mockContactProductResponse)
      const wrapper = createWrapper({ product: mockProduct })
      const dismissMock = vi.fn()
      wrapper.vm.modalRef.$el = {
        dismiss: dismissMock
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(dismissMock).toHaveBeenCalled()
    })
    it('should not send if canSend is false', async () => {
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = ''
      await wrapper.vm.handleSend()
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should set error when no product or wanted item', async () => {
      const wrapper = createWrapper()
      wrapper.vm.messageText = 'Test message'
      const originalCanSend = wrapper.vm.canSend
      wrapper.vm.canSend = true
      await wrapper.vm.handleSend()
      expect(mockSendInitialMessage).not.toHaveBeenCalled()
    })
    it('should not dismiss modal on send failure', async () => {
      mockSendInitialMessage.mockResolvedValue(null)
      const wrapper = createWrapper({ product: mockProduct })
      const dismissMock = vi.fn()
      wrapper.vm.modalRef.$el = {
        dismiss: dismissMock
      }
      wrapper.vm.messageText = 'Test message'
      await wrapper.vm.handleSend()
      expect(dismissMock).not.toHaveBeenCalled()
    })
  })
  describe('Modal Behavior', () => {
    it('should emit update:isOpen when dismissed', () => {
      const wrapper = createWrapper()
      wrapper.vm.handleDismiss()
      expect(wrapper.emitted('update:isOpen')).toBeTruthy()
      expect(wrapper.emitted('update:isOpen')?.[0]).toEqual([false])
    })
    it('should emit dismiss event when dismissed', () => {
      const wrapper = createWrapper()
      wrapper.vm.handleDismiss()
      expect(wrapper.emitted('dismiss')).toBeTruthy()
    })
    it('should clear message text when dismissed', () => {
      const wrapper = createWrapper()
      wrapper.vm.messageText = 'Test message'
      wrapper.vm.handleDismiss()
      expect(wrapper.vm.messageText).toBe('')
    })
    it('should expose dismiss method', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.dismiss).toBeDefined()
      expect(typeof wrapper.vm.dismiss).toBe('function')
    })
    it('should clear message and error when modal opens', async () => {
      const wrapper = createWrapper({ isOpen: false })
      wrapper.vm.messageText = 'Old message'
      mockMessagingError.value = new Error('Old error')
      await wrapper.setProps({ isOpen: true })
      expect(wrapper.vm.messageText).toBe('')
      expect(mockMessagingError.value).toBeNull()
    })
    it('should not clear when modal closes', async () => {
      const wrapper = createWrapper({ isOpen: true })
      wrapper.vm.messageText = 'Test message'
      await wrapper.setProps({ isOpen: false })
      expect(wrapper.vm.messageText).toBe('Test message')
    })
  })
  describe('Loading States', () => {
    it('should disable cancel button when sending', async () => {
      mockIsSending.value = true
      const wrapper = createWrapper({ product: mockProduct })
      const cancelButton = wrapper.findAll('ion-button')
        .find(btn => btn.text().includes('common.cancel'))
      expect(cancelButton?.attributes('disabled')).toBeDefined()
    })
    it('should disable send button when sending', async () => {
      mockIsSending.value = true
      const wrapper = createWrapper({ product: mockProduct })
      wrapper.vm.messageText = 'Valid message'
      await nextTick()
      expect(wrapper.vm.canSend).toBe(false)
    })
    it('should show correct button text when sending', () => {
      const wrapper = createWrapper({ product: mockProduct })
      expect(wrapper.html()).toContain('messaging.compose.send')
    })
  })
  describe('Accessibility', () => {
    it('should have aria-label on close button', () => {
      const wrapper = createWrapper()
      const closeButton = wrapper.findAll('ion-button')
        .find(btn => btn.html().includes('close-icon'))
      expect(closeButton?.attributes('aria-label')).toBe('common.close')
    })
    it('should have proper label for message textarea', () => {
      const wrapper = createWrapper()
      expect(wrapper.html()).toContain('messaging.compose.messageLabel')
    })
    it('should have placeholder text for textarea', () => {
      const wrapper = createWrapper()
      const textarea = wrapper.find('[data-test="message-input"]')
      expect(textarea.attributes('placeholder'))
        .toBe('messaging.compose.placeholder')
    })
  })
})