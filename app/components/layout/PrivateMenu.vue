<template>
  <ion-menu side="end" content-id="main-content">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t('navigation.menu') }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list lines="none">
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
