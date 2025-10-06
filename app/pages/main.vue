<template>
  <div class="ion-padding">
    <!-- Loading State -->
    <div v-if="loading">
      <ion-spinner name="crescent" />
      <p>{{ $t('dashboard.loadingProfile') }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <ion-icon :icon="errorIcon" />
      <h2>{{ $t('dashboard.errorLoadingProfile') }}</h2>
      <p>{{ error }}</p>
      <ion-button fill="outline" @click="ensureProfileData">
        {{ $t('common.retry') }}
      </ion-button>
    </div>

    <!-- Welcome Content -->
    <div v-else-if="user">
      <!-- Navigation Hub with Accessibility -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>{{ $t('dashboard.quickAccess') }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <nav
            role="navigation"
            :aria-label="$t('dashboard.quickAccess')"
            :aria-busy="navigationLoading"
          >
            <ion-grid>
              <ion-row>
                <ion-col
                  v-for="(item, index) in navigationItems"
                  :key="item.id"
                  size="12"
                  size-sm="6"
                  size-md="6"
                  size-lg="4"
                >
                  <ion-button
                    expand="block"
                    size="large"
                    :color="item.color"
                    :fill="item.fill"
                    :disabled="loading || navigationLoading"
                    :aria-label="$t(item.ariaLabel || item.label)"
                    :aria-describedby="
                      navigationError ? 'nav-error-message' : undefined
                    "
                    :tabindex="index"
                    @click="handleNavigation(item.route)"
                  >
                    <ion-icon
                      slot="start"
                      :icon="item.icon"
                      :aria-hidden="true"
                    />
                    {{ $t(item.label) }}
                  </ion-button>
                </ion-col>
              </ion-row>
            </ion-grid>
            <!-- Error message for screen readers -->
            <div
              v-if="navigationError"
              id="nav-error-message"
              class="ion-text-center ion-padding-top"
              role="alert"
              aria-live="polite"
            >
              <ion-text color="danger">
                {{ navigationError }}
              </ion-text>
            </div>
          </nav>
        </ion-card-content>
      </ion-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from '../utils/helpers'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'

definePageMeta({
  middleware: 'auth'
})

const { user, loading, error, ensureProfileData } = useProfile()
const { error: errorIcon, person } = useIcons()
const router = useRouter()
const { t } = useI18n()
const { localePath } = useSafeLocalePath()

// Navigation state management
const navigationLoading = ref(false)
const navigationError = ref<string | null>(null)

// Navigation items configuration with accessibility
const navigationItems = ref([
  {
    id: 'account',
    icon: person,
    label: 'dashboard.navigateToAccount',
    ariaLabel: 'dashboard.navigateToAccount',
    route: '/account',
    color: 'primary',
    fill: 'solid'
  }
])

// Navigation function (not debounced)
const navigateToRoute = async (route: string) => {
  if (!loading.value && !navigationLoading.value) {
    navigationLoading.value = true
    navigationError.value = null

    try {
      await router.push(localePath(route))
    } catch (err) {
      console.error(t('errors.navigationErrorLog'), err)
      // Set error message for screen readers
      const fallbackMessage =
        err instanceof Error ? err.message : t('errors.navigationFailed')
      navigationError.value = `${t('common.error')}: ${fallbackMessage}`

      // Clear error after 5 seconds
      setTimeout(() => {
        navigationError.value = null
      }, 5000)
    } finally {
      navigationLoading.value = false
    }
  }
}

// Create debounced navigation handler
const handleNavigation = debounce(navigateToRoute, 300)

onMounted(() => {
  ensureProfileData()
})
</script>

<style scoped>
/* Ensure proper RTL support for navigation */
nav {
  direction: inherit;
}

/* Ensure minimum touch target size on all devices */
ion-button {
  min-height: 44px;
  min-width: 44px;
}

/* Visual feedback for keyboard navigation */
ion-button:focus-visible {
  box-shadow: 0 0 0 2px var(--ion-color-primary);
  outline: none;
}

/* RTL-aware spacing */
[dir='rtl'] ion-icon[slot='start'] {
  margin-inline-end: 8px;
  margin-inline-start: 0;
}

/* Error message styling */
#nav-error-message {
  font-size: 0.875rem;
  margin-top: 8px;
}
</style>
