<template>
  <ion-header>
    <ion-toolbar>
      <ion-title class="title-left">{{ t('home.title') }}</ion-title>

      <ion-buttons slot="end">
        <HelpIcon
          v-if="currentTopic"
          :topic="currentTopic"
          size="large"
          color="primary"
        />
        <UiBaseLanguageSwitcher />
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import HelpIcon from '~/components/help/HelpIcon.vue'
import { useHelpTopic } from '~/composables/useHelpTopic'

const { t } = useI18n()
const { currentTopic } = useHelpTopic()
</script>

<style scoped>
.title-left {
  text-align: left !important;
  padding-inline-start: 16px;
}
</style>

