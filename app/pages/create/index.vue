<template>
  <div class="ion-padding">
      <ion-grid>
        <ion-row
          class="ion-justify-content-center ion-text-center
          ion-padding-vertical"
        >
          <ion-col size="12">
            <ion-text>
              <h1>{{ t('marketplace.select_listing_type') }}</h1>
            </ion-text>
            <ion-text color="medium">
              <p>{{ t('marketplace.select_listing_type_desc') }}</p>
            </ion-text>
          </ion-col>
        </ion-row>

        <ion-row class="ion-justify-content-center">
          <ion-col size="12">
            <ion-card
              role="button"
              tabindex="0"
              @click="handleCreateProduct"
              @keyup.enter="handleCreateProduct"
              @keyup.space.prevent="handleCreateProduct"
            >
              <ion-card-content class="ion-text-center">
                <ion-icon
                  :icon="icons.bag"
                  size="large"
                  color="primary"
                  class="listing-icon"
                />
                <ion-card-title>
                  {{ t('marketplace.create_product') }}
                </ion-card-title>
                <ion-text color="medium">
                  <p>{{ t('marketplace.create_product_desc') }}</p>
                </ion-text>
              </ion-card-content>
            </ion-card>

            <ion-card
              role="button"
              tabindex="0"
              @click="handleCreateWanted"
              @keyup.enter="handleCreateWanted"
              @keyup.space.prevent="handleCreateWanted"
            >
              <ion-card-content class="ion-text-center">
                <ion-icon
                  :icon="icons.search"
                  size="large"
                  color="secondary"
                  class="listing-icon"
                />
                <ion-card-title>
                  {{ t('marketplace.create_wanted') }}
                </ion-card-title>
                <ion-text color="medium">
                  <p>{{ t('marketplace.create_wanted_desc') }}</p>
                </ion-text>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- No permission message -->
      <ion-alert
        :is-open="showNoPermissionAlert"
        :header="t('errors.permissionDenied')"
        :message="t('marketplace.no_company_permission')"
        :buttons="alertButtons"
        @ion-alert-did-dismiss="handleAlertDismiss"
      />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const authStore = useAuthStore()
const icons = useIcons()
const { canCreateListings } = useUserRole()

// Synchronous permission check - profile already loaded by middleware
const hasPermission = computed(() => {
  return canCreateListings()
})

// Show alert immediately if no permission
const showNoPermissionAlert = ref(!hasPermission.value)

// Watch for permission changes (e.g., after company switch)
watch(hasPermission, (newValue) => {
  showNoPermissionAlert.value = !newValue
})

const alertButtons = [
  {
    text: t('common.ok'),
    role: 'cancel',
    handler: () => {
      navigateTo(localePath('/'))
    }
  }
]

const handleAlertDismiss = () => {
  showNoPermissionAlert.value = false
  navigateTo(localePath('/'))
}

const handleCreateProduct = async () => {
  // Check permission immediately before navigation
  if (!canCreateListings()) {
    showNoPermissionAlert.value = true
    return
  }
  await navigateTo(localePath('/create/product'))
}

const handleCreateWanted = async () => {
  // Check permission immediately before navigation
  if (!canCreateListings()) {
    showNoPermissionAlert.value = true
    return
  }
  await navigateTo(localePath('/create/wanted'))
}
</script>

<style scoped>
.listing-icon {
  font-size: 3rem;
  margin-bottom: var(--ion-margin, 16px);
}

ion-card {
  margin-bottom: var(--ion-margin, 16px);
  cursor: pointer;
  transition: transform 0.2s ease;
}

ion-card:hover {
  transform: translateY(-2px);
}

ion-card:active {
  transform: translateY(0);
}
</style>