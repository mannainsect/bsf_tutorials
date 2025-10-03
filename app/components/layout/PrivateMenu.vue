<template>
  <ion-menu side="end" content-id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('navigation.menu') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
        <ion-item button @click="handleMarketplace">
          <ion-icon slot="start" :icon="icons.storefront" />
          <ion-label>{{ t('menu.marketplace') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleWanted">
          <ion-icon slot="start" :icon="icons.search" />
          <ion-label>{{ t('wanted.browse') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleMyListings">
          <ion-icon slot="start" :icon="icons.documents" />
          <ion-label>{{ t('menu.myListings') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleMessages">
          <ion-icon slot="start" :icon="icons.chatbubbles" />
          <ion-label>{{ t('messaging.title') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleCreateListing">
          <ion-icon slot="start" :icon="icons.addCircle" />
          <ion-label>{{ t('marketplace.create_listing') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleAccount">
          <ion-icon slot="start" :icon="personOutline" />
          <ion-label>{{ t('navigation.account') }}</ion-label>
        </ion-item>
        <ion-item button @click="handleLogout">
          <ion-icon slot="start" :icon="logOutOutline" />
          <ion-label>{{ t('navigation.logout') }}</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import { menuController } from '@ionic/vue'
import { logOutOutline, personOutline } from 'ionicons/icons'

const { t } = useI18n()
const { logout } = useAuth()
const localePath = useLocalePath()
const icons = useIcons()

const handleMarketplace = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/market'))
}

const handleWanted = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/wanted'))
}

const handleMyListings = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/my-listings'))
}

const handleMessages = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/messages'))
}

const handleCreateListing = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/create'))
}

const handleAccount = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await navigateTo(localePath('/account'))
}

const handleLogout = async () => {
  // Clear focus before closing menu to prevent accessibility issues
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }

  await menuController.close('end')
  await logout()
}
</script>