<template>
  <ion-menu side="end" content-id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('navigation.menu') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item button @click="navigateToMarketplace">
          <ion-icon slot="start" :icon="icons.storefront" />
          <ion-label>{{ t('menu.marketplace') }}</ion-label>
        </ion-item>
        <ion-item button @click="navigateToWanted">
          <ion-icon slot="start" :icon="icons.search" />
          <ion-label>{{ t('wanted.browse') }}</ion-label>
        </ion-item>
        <ion-item button @click="navigateToMessages">
          <ion-icon slot="start" :icon="icons.chatbubbles" />
          <ion-label>{{ t('messaging.title') }}</ion-label>
        </ion-item>
        <ion-item button @click="navigateToLogin">
          <ion-icon slot="start" :icon="logInOutline" />
          <ion-label>{{ t('navigation.login') }}</ion-label>
        </ion-item>
        <ion-item button @click="navigateToRegister">
          <ion-icon slot="start" :icon="personAddOutline" />
          <ion-label>{{ t('navigation.register') }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { menuController } from '@ionic/vue'
import { logInOutline, personAddOutline } from 'ionicons/icons'

const { t } = useI18n()
const localePath = useLocalePath()
const icons = useIcons()

const navigateToMarketplace = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/market'))
}

const navigateToWanted = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/wanted'))
}

const navigateToMessages = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/login'))
}

const navigateToLogin = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/login'))
}

const navigateToRegister = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/register'))
}
</script>