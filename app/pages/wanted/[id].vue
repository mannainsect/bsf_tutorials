<template>
  <div>
    <AuthPromptModal
      v-model:is-open="showAuthModal"
      @dismiss="handleAuthModalDismiss"
    />

    <MessageComposer
      v-model:is-open="showMessageComposer"
      :wanted-item="currentWanted"
      @dismiss="showMessageComposer = false"
      @sent="handleMessageSent"
    />

    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button fill="clear" @click="handleBack">
          <ion-icon slot="start" :icon="icons.arrowBack" />
          {{ t('common.back') }}
        </ion-button>
      </ion-buttons>
      <ion-buttons v-if="canEditListing" slot="end">
        <ion-button
          :router-link="localePath(`/create/wanted?edit=${wantedId}`)"
          fill="clear"
          color="primary"
        >
          <ion-icon slot="icon-only" :icon="icons.create" />
        </ion-button>
        <ion-button
          fill="clear"
          color="danger"
          @click="handleDelete"
        >
          <ion-icon slot="icon-only" :icon="icons.trash" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <div v-if="isLoading" class="loading-container">
      <ion-spinner color="primary" />
      <ion-text color="medium">
        <p>{{ t('wanted.loading') }}</p>
      </ion-text>
    </div>

    <div v-else-if="error || !currentWanted" class="error-container">
      <ion-icon
        :icon="icons.alertCircle"
        color="danger"
        class="error-icon"
      />
      <ion-text color="danger">
        <h3>
          {{
            error
              ? t('errors.failedToLoad', { resource: t('wanted.title') })
              : t('errors.notFound')
          }}
        </h3>
        <p>
          {{ error?.message || t('errors.notFound') }}
        </p>
      </ion-text>
      <ion-button color="primary" @click="handleBack">
        {{ t('wanted.browse') }}
      </ion-button>
    </div>

    <template v-else>
      <swiper-container
        v-if="wantedImages.length"
        :slides-per-view="1"
        :pagination="true"
        :navigation="true"
        class="wanted-images"
      >
        <swiper-slide
          v-for="(imageUrl, index) in wantedImages"
          :key="`${index}-${imageUrl}`"
        >
          <img
            :src="imageUrl"
            :alt="`${currentWanted.title} - ${t('common.image')} ${index + 1}`"
            class="wanted-image"
            @error="handleSlideError"
          />
        </swiper-slide>
      </swiper-container>

      <ion-grid>
        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-subtitle>
                  {{ currentWanted.company_name }}
                </ion-card-subtitle>
                <ion-card-title>{{ currentWanted.title }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-grid class="ion-no-padding">
                  <ion-row class="product-meta-row">
                    <ion-col size="12" size-md="6" class="meta-price">
                      <ion-text v-if="budgetRange" color="primary">
                        <h2 class="price budget">
                          {{ t('wanted.budget') }}: {{ budgetRange }}
                        </h2>
                      </ion-text>
                      <ion-text v-if="formattedCreated" color="medium">
                        <p class="text-sm created">
                          {{ formattedCreated }}
                        </p>
                      </ion-text>
                      <ion-text v-if="formattedExpiry" color="medium">
                        <p class="text-sm expires">
                          {{ t('wanted.expires') }}: {{ formattedExpiry }}
                        </p>
                      </ion-text>
                    </ion-col>
                    <ion-col
                      size="12"
                      size-md="6"
                      class="ion-text-end meta-tags"
                    >
                      <ion-chip color="secondary">
                        <ion-label>{{ currentWanted.category }}</ion-label>
                      </ion-chip>
                      <ion-chip
                        v-if="currentWanted.subcategory"
                        color="tertiary"
                      >
                        <ion-label>{{ currentWanted.subcategory }}</ion-label>
                      </ion-chip>
                    </ion-col>
                  </ion-row>

                  <ion-row v-if="quantityDisplay" class="quantity-row">
                    <ion-col size="12">
                      <ion-item lines="none">
                        <ion-icon
                          slot="start"
                          :icon="icons.bag"
                          color="medium"
                        />
                        <ion-label>
                          <p>{{ t('wanted.quantity') }}</p>
                          <h3>{{ quantityDisplay }}</h3>
                        </ion-label>
                      </ion-item>
                    </ion-col>
                  </ion-row>
                </ion-grid>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <ion-row>
          <ion-col size="12">
            <ion-card>
              <ion-card-header class="card-header-with-actions">
                <div class="header-content">
                  <ion-card-title>
                    {{ t('marketplace.description') }}
                  </ion-card-title>
                  <ion-button
                    v-if="currentWanted?.description"
                    fill="clear"
                    size="small"
                    @click="toggleDescriptionTranslation"
                    :disabled="isTranslatingDescription"
                    class="translate-button-inline"
                  >
                    <ion-spinner
                      v-if="isTranslatingDescription"
                      name="dots"
                      color="primary"
                    />
                    <ion-icon
                      v-else
                      :icon="icons.language"
                      :color="
                        isDescriptionTranslated ? 'primary' : 'medium'
                      "
                      slot="icon-only"
                    />
                  </ion-button>
                </div>
              </ion-card-header>
              <ion-card-content>
                <div
                  v-if="translationErrorDescription"
                  class="translation-error"
                >
                  <ion-text color="warning">
                    <p>{{ translationErrorDescription }}</p>
                  </ion-text>
                </div>
                <div v-html="formattedDescription"></div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <!-- Contact Buyer Button (Authenticated Users with Company) -->
        <ion-row v-if="canContactBuyer">
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.contactBuyer') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-button
                  expand="block"
                  @click="showMessageComposer = true"
                >
                  <ion-icon slot="start" :icon="icons.chatbubbles" />
                  {{ t('messaging.contact_buyer') }}
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <!-- Contact Email (Only for Wanted Owner) -->
        <ion-row v-if="isAuthenticated && hasContactInfo">
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.contactInformation') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item lines="none">
                  <ion-icon slot="start" :icon="icons.mail" color="primary" />
                  <ion-label>
                    <p>{{ t('marketplace.contactEmail') }}</p>
                    <h3>
                      <a :href="`mailto:${wantedWithAuth?.contact_email}`">
                        {{ wantedWithAuth?.contact_email }}
                      </a>
                    </h3>
                  </ion-label>
                </ion-item>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <ion-row v-else-if="!isAuthenticated">
          <ion-col size="12">
            <ion-card color="light">
              <ion-card-content class="ion-text-center">
                <ion-icon
                  :icon="icons.lock"
                  color="medium"
                  class="lock-icon"
                />
                <ion-text>
                  <p>{{ t('marketplace.loginToContact') }}</p>
                </ion-text>
                <ion-button
                  color="primary"
                  class="ion-margin-top"
                  @click="handleShowAuthModal"
                >
                  {{ t('auth.signIn') }}
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <ion-row v-if="additionalInfoItems.length">
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.additionalInfo') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list>
                  <ion-item
                    v-for="(item, index) in additionalInfoItems"
                    :key="`${index}-${item}`"
                    lines="inset"
                  >
                    <ion-label>
                      <h3>{{ item }}</h3>
                    </ion-label>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>

        <!-- Available Countries -->
        <ion-row v-if="currentWanted?.countries?.length">
          <ion-col size="12">
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  {{ t('marketplace.availableCountries') }}
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-chip
                  v-for="country in displayedCountries"
                  :key="country"
                  color="light"
                >
                  <ion-label>{{ getCountryName(country) }}</ion-label>
                </ion-chip>
                <ion-chip
                  v-if="hasExtraCountries"
                  :button="true"
                  color="light"
                  @click="toggleCountryVisibility"
                >
                  <ion-label>{{ countryToggleLabel }}</ion-label>
                </ion-chip>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </template>
  </div>
</template>

<script setup lang="ts">
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  WantedAuthenticated,
  WantedPublicDetail
} from '../../../shared/types/models/MarketplaceWanted'
import AuthPromptModal from '~/components/marketplace/AuthPromptModal.vue'
import MessageComposer from '~/components/messaging/MessageComposer.vue'
import { useIonRouter, alertController } from '@ionic/vue'
import type { AlertInput } from '@ionic/vue'
import {
  WantedRepository
} from '~/composables/api/repositories/WantedRepository'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'
import { useWanted } from '~/composables/useWanted'
import { useUserRole } from '~/composables/useUserRole'
import { useToast } from '~/composables/useToast'
import { useCountries } from '~/composables/useCountries'
import { useTranslation } from '~/composables/useTranslation'
import { useTextFormatting } from '~/composables/useTextFormatting'
import type {
  MarketplaceDetailInfo
} from '../../../shared/types/models/metrics'
import { MetricCategory } from '../../../shared/types/models/metrics'

const route = useRoute()
const router = useRouter()
const icons = useIcons()
const authStore = useAuthStore()
const { isAuthenticated } = authStore
const { localePath } = useSafeLocalePath()
const ionRouter = useIonRouter()
const wantedRepository = new WantedRepository()
const { t, locale } = useI18n()
const { getCountryName } = useCountries()
const { translate } = useTranslation()
const { formatMarkdown } = useTextFormatting()

const {
  currentWanted,
  isLoading,
  error,
  fetchWantedDetail
} = useWanted()

const showAuthModal = ref(false)
const showMessageComposer = ref(false)
const canEditListing = ref(false)

// Translation state for description
const translatedDescription = ref<string>('')
const isDescriptionTranslated = ref(false)
const isTranslatingDescription = ref(false)
const translationErrorDescription = ref<string | null>(null)

const handleShowAuthModal = async () => {
  showAuthModal.value = false
  await nextTick()
  showAuthModal.value = true
}

const handleAuthModalDismiss = () => {
  showAuthModal.value = false
}

const PLACEHOLDER_IMAGE = '/images/placeholder_wanted.jpg'

const wantedPath = computed(() => localePath('/wanted'))
const wantedId = computed(() => route.params.id as string)

const wantedImages = computed(() => {
  const rawImages = currentWanted.value?.image_urls ?? []
  const sanitized = rawImages
    .map((url) => (typeof url === 'string' ? url.trim() : ''))
    .filter((url) => url.length > 0)

  if (sanitized.length > 0) {
    return sanitized
  }

  return currentWanted.value ? [PLACEHOLDER_IMAGE] : []
})

const handleSlideError = (event: Event) => {
  const target = event.target as HTMLImageElement | null
  if (target && target.getAttribute('src') !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE
  }
}

const formatCurrency = (
  value: number | null | undefined,
  currency?: string | null
) => {
  if (value == null) {
    return null
  }

  const targetCurrency = currency && currency.trim().length > 0
    ? currency.toUpperCase()
    : 'USD'

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: targetCurrency
    }).format(value)
  } catch {
    return `${targetCurrency} ${value}`
  }
}

const budgetRange = computed(() => {
  if (!currentWanted.value) {
    return null
  }

  const minValue = (currentWanted.value as any).budget_min
  const maxValue = (currentWanted.value as any).budget_max
  const currency = (currentWanted.value as any).budget_currency

  const minFormatted = formatCurrency(minValue, currency)
  const maxFormatted = formatCurrency(maxValue, currency)

  if (minFormatted && maxFormatted) {
    if (minValue === maxValue) {
      return minFormatted
    }
    return `${minFormatted} - ${maxFormatted}`
  }

  if (minFormatted) {
    return minFormatted
  }

  if (maxFormatted) {
    return maxFormatted
  }

  return null
})

const quantityDisplay = computed(() => {
  if (!currentWanted.value) {
    return null
  }

  const quantity = (currentWanted.value as any).quantity_needed
  const unit = (currentWanted.value as any).quantity_unit

  if (quantity == null || quantity === 0) {
    return null
  }

  if (unit && typeof unit === 'string' && unit.trim().length > 0) {
    return `${quantity} ${unit}`
  }

  return `${quantity}`
})

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) {
    return null
  }

  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
      return dateString
    }
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  } catch {
    return dateString
  }
}

const formattedCreated = computed(() =>
  formatDate(currentWanted.value?.created_at))
const formattedExpiry = computed(() =>
  formatDate((currentWanted.value as any)?.expires_at))

const wantedWithAuth = computed(() => {
  if (!currentWanted.value) {
    return null
  }

  if (
    'user_id' in currentWanted.value &&
    'contact_email' in currentWanted.value &&
    currentWanted.value.contact_email
  ) {
    return currentWanted.value as WantedAuthenticated
  }

  return null
})

const hasContactInfo = computed(() =>
  Boolean(wantedWithAuth.value?.contact_email))

const canContactBuyer = computed(() => {
  // User must be authenticated
  if (!isAuthenticated) return false

  // User must have an active company
  if (!authStore.companyId) return false

  // Wanted item must exist and have a company_id
  if (!currentWanted.value?.company_id) return false

  // Don't show contact button if user owns the wanted listing
  return currentWanted.value.company_id !== authStore.companyId
})

const additionalInfoItems = computed(() => {
  if (!currentWanted.value?.additional_info) {
    return []
  }

  const info = currentWanted.value.additional_info

  if (typeof info === 'string') {
    return info
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  }

  if (typeof info === 'object') {
    return Object.entries(info).map(([key, value]) => `${key}: ${value}`)
  }

  return []
})

const wantedTitle = computed(() =>
  currentWanted.value?.title || t('wanted.title'))

// Formatted description with markdown
const formattedDescription = computed(() => {
  if (!currentWanted.value?.description) return ''
  return formatMarkdown(currentWanted.value.description)
})

// Get target language based on user's locale
const getTargetLanguage = () => {
  const userLocale = locale.value || 'en'
  // Map locale codes to translation API language codes
  const langMap: Record<string, string> = {
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'pt': 'pt',
    'ru': 'ru',
    'zh': 'zh',
    'ja': 'ja',
    'ko': 'ko',
    'ar': 'ar'
  }
  return langMap[userLocale] || 'es' // Default to Spanish if unknown
}

// Toggle description translation
const toggleDescriptionTranslation = async () => {
  if (isTranslatingDescription.value) return

  // Reset error state
  translationErrorDescription.value = null

  // Toggle back to original
  if (isDescriptionTranslated.value) {
    isDescriptionTranslated.value = false
    return
  }

  // Check if we already have a translation cached
  if (translatedDescription.value) {
    isDescriptionTranslated.value = true
    return
  }

  // Translate the description
  if (!currentWanted.value?.description) return

  isTranslatingDescription.value = true

  try {
    const targetLang = getTargetLanguage()
    const translated = await translate(
      currentWanted.value.description,
      'en',
      targetLang
    )

    // Store the translated content (already sanitized by useTranslation)
    translatedDescription.value = translated
    isDescriptionTranslated.value = true
  } catch (error: any) {
    console.error('Translation failed:', error)

    // Handle clipboard fallback specially
    if (error?.isClipboardFallback) {
      const toast = useToast()
      await toast.showInfo(t('translation.copyFallback'))
      return
    }

    translationErrorDescription.value =
      error instanceof Error ? error.message :
      t('translation.genericError')
  } finally {
    isTranslatingDescription.value = false
  }
}

const handleMessageSent = () => {
  showMessageComposer.value = false
}

// Countries display logic
const MAX_VISIBLE_COUNTRIES = 5
const showAllCountries = ref(false)
const availableCountries = computed(() =>
  currentWanted.value?.countries ?? [])

const hasExtraCountries = computed(() =>
  availableCountries.value.length > MAX_VISIBLE_COUNTRIES)

const displayedCountries = computed(() => {
  if (showAllCountries.value) {
    return availableCountries.value
  }
  return availableCountries.value.slice(0, MAX_VISIBLE_COUNTRIES)
})

const hiddenCountriesCount = computed(() => {
  if (!hasExtraCountries.value) {
    return 0
  }
  return availableCountries.value.length - MAX_VISIBLE_COUNTRIES
})

const countryToggleLabel = computed(() => {
  if (!hasExtraCountries.value) {
    return ''
  }

  return showAllCountries.value
    ? t('marketplace.showLess')
    : t('marketplace.moreCountries', { count: hiddenCountriesCount.value })
})

const toggleCountryVisibility = () => {
  if (!hasExtraCountries.value) {
    return
  }
  showAllCountries.value = !showAllCountries.value
}

// Reset country visibility when wanted item changes
watch(
  () => [currentWanted.value?.id, availableCountries.value.length],
  () => {
    showAllCountries.value = false
  }
)

const handleBack = () => {
  router.push(wantedPath.value)
}

const handleDelete = async () => {
  if (!currentWanted.value) return

  const alert = await alertController.create({
    header: t('common.confirmDelete'),
    message: t('marketplace.confirmDeleteMessage'),
    inputs: [
      {
        name: 'title',
        type: 'text',
        placeholder: currentWanted.value.title,
        attributes: {
          maxlength: 200
        }
      } as AlertInput
    ],
    buttons: [
      {
        text: t('common.cancel'),
        role: 'cancel'
      },
      {
        text: t('common.delete'),
        role: 'destructive',
        handler: async (data) => {
          if (data.title !== currentWanted.value?.title) {
            const toast = useToast()
            await toast.showWarning(t('errors.titleMismatch'))
            return false
          }

          try {
            const result = await wantedRepository.deleteWanted(wantedId.value)

            if (result.success) {
              const toast = useToast()
              await toast.showSuccess(t('wanted.deleteSuccess'))
              ionRouter.push(wantedPath.value)
            }
          } catch (err: any) {
            const toast = useToast()
            const message = err?.message || t('errors.deleteFailed')
            await toast.showError(message)
          }
          return true
        }
      }
    ]
  })

  await alert.present()
}

const fetchDetail = async (id: string) => {
  if (!id) return
  await fetchWantedDetail(id)

  await nextTick()

  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
  }

  const ionContent = document.querySelector('ion-content')
  if (ionContent) {
    await ionContent.scrollToTop(0)
  }
}

onMounted(async () => {
  await fetchDetail(wantedId.value)

  // Send metrics only if user is logged in
  if (wantedId.value && authStore.isAuthenticated) {
    const { sendMetric } = useMetrics()
    sendMetric({
      category: MetricCategory.VISIT_MARKETPLACE,
      extra_info: {
        view: 'detail',
        item_type: 'wanted',
        wanted_id: String(wantedId.value)
      } as MarketplaceDetailInfo
    })
  }
})

watch(wantedId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await fetchDetail(newId)
  }
})

watch(currentWanted, async (wanted) => {
  if (wanted && authStore.companyId) {
    const isOwner = wanted.company_id === authStore.companyId
    const hasPermission = await useUserRole().canCreateListings()
    canEditListing.value = isOwner && hasPermission
  } else {
    canEditListing.value = false
  }
})

useHead(() => ({
  title: wantedTitle.value,
  meta: [
    {
      name: 'description',
      content: currentWanted.value?.description || t('wanted.title')
    },
    {
      property: 'og:title',
      content: wantedTitle.value
    },
    {
      property: 'og:description',
      content: currentWanted.value?.description || t('wanted.title')
    },
    {
      property: 'og:image',
      content: wantedImages.value[0] || ''
    }
  ]
}))
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--ion-padding, 16px);
  text-align: center;
  gap: 1rem;
}

.error-icon,
.lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

ion-spinner {
  width: 48px;
  height: 48px;
}

.wanted-images {
  --swiper-navigation-color: var(--ion-color-primary);
  --swiper-pagination-color: var(--ion-color-primary);
  width: 100%;
  max-height: 400px;
  margin-bottom: 1rem;
}

.wanted-image {
  width: 100%;
  height: 100%;
  max-height: 400px;
  object-fit: contain;
  background: var(--ion-color-light);
}

.price {
  margin: 0;
  font-size: 1.6rem;
  font-weight: bold;
}

.product-meta-row {
  align-items: flex-start;
  gap: 0.5rem;
}

.meta-price {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.text-sm {
  font-size: 0.85rem;
  margin: 0.1rem 0;
}

.quantity-row {
  margin-top: 0.5rem;
}

/* Translation button positioning */
.card-header-with-actions .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.translate-button-inline {
  margin-left: auto;
  flex-shrink: 0;
}

.translation-error {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: var(--ion-color-warning-tint);
  border-radius: 4px;
}

.translation-error p {
  margin: 0;
  font-size: 0.875rem;
}

ion-chip {
  margin: 0.25rem;
}

a {
  color: var(--ion-color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

ion-card {
  margin-bottom: 1rem;
}


</style>
