import { vi } from 'vitest'

/**
 * Centralized Ionic Component Stubs
 *
 * All Ionic web components are stubbed here to avoid resolution
 * warnings and enable v-model testing. Tests can override these
 * stubs locally if needed.
 */
export const ionicStubs = {
  'ion-textarea': {
    template:
      '<textarea class="ion-textarea" ' +
      ':value="modelValue" ' +
      "@input=\"$emit('update:modelValue', " +
      '$event.target.value)" ' +
      '@keydown="$emit(\'keydown\', $event)" ' +
      ':placeholder="placeholder" ' +
      ':maxlength="maxlength" ' +
      ':disabled="disabled" ' +
      ':rows="rows"></textarea>',
    props: [
      'modelValue',
      'placeholder',
      'disabled',
      'maxlength',
      'rows',
      'autoGrow'
    ],
    emits: ['update:modelValue', 'keydown']
  },
  'ion-input': {
    template:
      '<input class="ion-input" ' +
      ':value="modelValue" ' +
      "@input=\"$emit('update:modelValue', " +
      '$event.target.value)" ' +
      ':placeholder="placeholder" ' +
      ':type="type" ' +
      ':disabled="disabled" />',
    props: ['modelValue', 'placeholder', 'type', 'disabled'],
    emits: ['update:modelValue']
  },
  'ion-button': {
    template:
      '<button class="ion-button" ' +
      '@click="$emit(\'click\')" ' +
      ':disabled="disabled" ' +
      ':size="size" ' +
      ':shape="shape" ' +
      ':fill="fill" ' +
      ':color="color"><slot /></button>',
    props: ['disabled', 'size', 'shape', 'fill', 'color'],
    emits: ['click']
  },
  'ion-modal': {
    template: '<div class="ion-modal"><slot /></div>',
    props: ['isOpen', 'backdropDismiss', 'keyboardClose'],
    emits: ['ion-modal-did-dismiss'],
    mounted() {
      ;(this.$el as any).dismiss = vi.fn()
    }
  },
  'ion-page': {
    template: '<div class="ion-page"><slot /></div>'
  },
  'ion-header': {
    template: '<header class="ion-header"><slot /></header>'
  },
  'ion-toolbar': {
    template: '<div class="ion-toolbar"><slot /></div>',
    props: ['class']
  },
  'ion-title': {
    template: '<h1 class="ion-title"><slot /></h1>'
  },
  'ion-content': {
    template: '<main class="ion-content"><slot /></main>'
  },
  'ion-icon': {
    template: '<span class="ion-icon" :icon="icon"></span>',
    props: ['icon']
  },
  'ion-spinner': {
    template: '<div class="ion-spinner"></div>',
    props: ['name', 'color']
  },
  'ion-card': {
    template: '<div class="ion-card"><slot /></div>'
  },
  'ion-item': {
    template: '<div class="ion-item"><slot /></div>',
    props: ['lines']
  },
  'ion-label': {
    template: '<div class="ion-label"><slot /></div>'
  },
  'ion-buttons': {
    template: '<div class="ion-buttons"><slot /></div>'
  },
  'ion-back-button': {
    template: '<button class="ion-back-button"></button>',
    props: ['default-href']
  },
  'ion-thumbnail': {
    template: '<div class="ion-thumbnail"><slot /></div>',
    props: ['slot']
  },
  'ion-chip': {
    template: '<div class="ion-chip"><slot /></div>',
    props: ['color', 'size']
  },
  'ion-text': {
    template: '<div class="ion-text"><slot /></div>',
    props: ['color']
  }
}
