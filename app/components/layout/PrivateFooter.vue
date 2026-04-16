<template>
  <ion-footer>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button fill="clear" @click="goHome">
          <ion-icon :icon="home" />
        </ion-button>
      </ion-buttons>

      <ion-title size="small">
        <a href="https://www.mannainsect.com" target="_blank" rel="noopener noreferrer">
          {{ t('footer.poweredBy') }}
        </a>
      </ion-title>
      <ion-buttons slot="end">
        <ion-button
          :aria-label="t('navigation.toggleMenu')"
          :aria-expanded="isMenuOpen"
          aria-controls="main-content"
          @click="toggleMenu"
        >
          <ion-icon :icon="menu" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script setup lang="ts">
import { menuController } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '~/composables/errors/useErrorHandler'

const { t } = useI18n()
const { handleSilentError } = useErrorHandler()
const { menu, home } = useIcons()
const localePath = useLocalePath()

const goHome = () => {
  navigateTo(localePath('/main'))
}
const isMenuOpen = ref(false)

const toggleMenu = async () => {
  try {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    if (!menuController) {
      handleSilentError(new Error('Menu controller not available'), 'PrivateFooter.toggleMenu')
      return
    }

    const currentState = await menuController.isOpen('end')
    if (currentState !== undefined) {
      await menuController.toggle('end')
      const newState = await menuController.isOpen('end')
      if (newState !== undefined) {
        isMenuOpen.value = newState
      }
    }
  } catch (error) {
    handleSilentError(error, 'PrivateFooter.toggleMenu')
  }
}
</script>
