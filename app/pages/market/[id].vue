<template>
  <div>
      <!-- Auth Modal for unauthenticated users -->
      <AuthPromptModal
        v-model:is-open="showAuthModal"
        @dismiss="handleAuthModalDismiss"
      />

      <!-- Message Composer Modal -->
      <MessageComposer
        v-model:is-open="showMessageComposer"
        :product="currentProduct"
        @dismiss="showMessageComposer = false"
        @sent="handleMessageSent"
      />

      <!-- Back Button Bar -->
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" @click="handleBack">
            <ion-icon slot="start" :icon="icons.arrowBack" />
            {{ $t('common.back') }}
          </ion-button>
        </ion-buttons>
        <ion-buttons v-if="canEditListing" slot="end">
          <ion-button
            :router-link="localePath(`/create/product?edit=${productId}`)"
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

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner color="primary" />
        <ion-text color="medium">
          <p>{{ $t('marketplace.loadingProduct') }}</p>
        </ion-text>
      </div>

      <!-- Error State / 404 -->
      <div v-else-if="error || !currentProduct" class="error-container">
        <ion-icon
          :icon="icons.alertCircle"
          color="danger"
          class="error-icon"
        />
        <ion-text color="danger">
          <h3>
            {{ error ? $t('errors.loadingFailed') :
               $t('errors.productNotFound') }}
          </h3>
          <p>
            {{ error?.message ||
               $t('errors.productNotFoundDescription') }}
          </p>
        </ion-text>
        <ion-button
          :router-link="marketPath"
          color="primary"
        >
          {{ $t('marketplace.backToListings') }}
        </ion-button>
      </div>

      <!-- Product Detail -->
      <template v-else-if="currentProduct">
        <!-- Image Gallery -->
        <swiper-container
          v-if="productImages.length"
          :slides-per-view="1"
          :pagination="true"
          :navigation="true"
          class="product-images"
        >
          <swiper-slide
            v-for="(imageUrl, index) in productImages"
            :key="`${index}-${imageUrl}`"
          >
            <img
              :src="imageUrl"
              :alt="`${currentProduct.title} - ` +
                   `${$t('common.image')} ${index + 1}`"
              class="product-image"
              @error="handleSlideError"
            />
          </swiper-slide>
        </swiper-container>

        <!-- Product Information -->
        <ion-grid>
          <!-- Title and Company -->
          <ion-row>
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-subtitle>
                    {{ currentProduct.company_name }}
                  </ion-card-subtitle>
                  <ion-card-title>{{ currentProduct.title }}</ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <!-- Price and Quantity -->
                  <ion-grid class="ion-no-padding">
                    <ion-row>
                      <ion-col size="8" size-md="6">
                        <ion-text color="primary">
                          <h2 class="price">
                            {{ formatPrice(currentProduct.price,
                               currentProduct.price_currency) }}
                          </h2>
                        </ion-text>
                        <ion-text
                          v-if="usdPrice !== null &&
                                currentProduct.price_currency !== 'USD'"
                          color="medium"
                        >
                          <p class="text-sm">
                            ≈ {{ formatUSDConversion(usdPrice) }}
                          </p>
                        </ion-text>
                      </ion-col>
                      <ion-col size="4" size-md="6" class="ion-text-end">
                        <ion-chip color="secondary">
                          <ion-label>{{ currentProduct.category }}</ion-label>
                        </ion-chip>
                        <ion-chip
                          v-if="currentProduct?.subcategory"
                          color="tertiary"
                        >
                          <ion-label>
                            {{ currentProduct.subcategory }}
                          </ion-label>
                        </ion-chip>
                      </ion-col>
                    </ion-row>

                    <ion-row v-if="currentProduct?.quantity">
                      <ion-col size="12">
                        <ion-item lines="none">
                          <ion-icon
                            slot="start"
                            :icon="icons.bag"
                            color="medium"
                          />
                          <ion-label>
                            <p>{{ $t('marketplace.quantity') }}</p>
                            <h3>
                              {{ currentProduct.quantity }}
                              {{ currentProduct.quantity_unit }}
                            </h3>
                          </ion-label>
                        </ion-item>
                      </ion-col>
                    </ion-row>
                  </ion-grid>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Description -->
          <ion-row>
            <ion-col size="12">
              <ion-card>
                <ion-card-header class="card-header-with-actions">
                  <div class="header-content">
                    <ion-card-title>
                      {{ $t('marketplace.description') }}
                    </ion-card-title>
                    <ion-button
                      v-if="currentProduct?.description"
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
                        color="medium"
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

          <!-- Extracted Links -->
          <ion-row v-if="extractedLinks.length > 0">
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ $t('marketplace.links') }}
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-list>
                    <ion-item
                      v-for="(link, index) in extractedLinks"
                      :key="index"
                      lines="inset"
                    >
                      <ion-label>
                        <h3>{{ link.text }}</h3>
                        <p>
                          <a
                            :href="link.url"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {{ link.url }}
                          </a>
                        </p>
                      </ion-label>
                      <ion-icon
                        slot="end"
                        :icon="icons.linkOutline"
                        color="medium"
                      />
                    </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Contact Seller Button (Authenticated Users with Company) -->
          <ion-row v-if="canContactSeller">
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ $t('marketplace.contactSeller') }}
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-button
                    expand="block"
                    @click="showMessageComposer = true"
                  >
                    <ion-icon
                      slot="start"
                      :icon="icons.chatbubbles"
                    />
                    {{ $t('messaging.contact_seller') }}
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Contact Email (Only for Product Owner) -->
          <ion-row v-if="isAuthenticated && hasContactInfo">
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ $t('marketplace.contactInformation') }}
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="none">
                    <ion-icon
                      slot="start"
                      :icon="icons.mail"
                      color="primary"
                    />
                    <ion-label>
                      <p>{{ $t('marketplace.contactEmail') }}</p>
                      <h3>
                        <a :href="`mailto:${productWithAuth?.contact_email}`">
                          {{ productWithAuth?.contact_email }}
                        </a>
                      </h3>
                    </ion-label>
                  </ion-item>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Login Prompt for Non-authenticated Users -->
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
                    <p>{{ $t('marketplace.loginToContact') }}</p>
                  </ion-text>
                  <ion-button
                    color="primary"
                    class="ion-margin-top"
                    @click="handleShowAuthModal"
                  >
                    {{ $t('auth.signIn') }}
                  </ion-button>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Additional Information -->
          <ion-row v-if="currentProduct?.additional_info">
            <ion-col size="12">
              <ion-card>
                <ion-card-header class="card-header-with-actions">
                  <div class="header-content">
                    <ion-card-title>
                      {{ $t('marketplace.additionalInfo') }}
                    </ion-card-title>
                    <ion-button
                      v-if="currentProduct?.additional_info"
                      fill="clear"
                      size="small"
                      @click="toggleAdditionalInfoTranslation"
                      :disabled="isTranslatingAdditional"
                      class="translate-button-inline"
                    >
                      <ion-spinner
                        v-if="isTranslatingAdditional"
                        name="dots"
                        color="primary"
                      />
                      <ion-icon
                        v-else
                        :icon="icons.language"
                        color="medium"
                        slot="icon-only"
                      />
                    </ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <div
                    v-if="translationErrorAdditional"
                    class="translation-error"
                  >
                    <ion-text color="warning">
                      <p>{{ translationErrorAdditional }}</p>
                    </ion-text>
                  </div>
                  <div v-html="formattedAdditionalInfo"></div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <!-- Available Countries -->
          <ion-row v-if="currentProduct?.countries?.length">
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ $t('marketplace.availableCountries') }}
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
import {

  isProductAuthenticated
} from '../../../shared/types/models/MarketplaceProduct'
import type {
  ProductAuthenticated
} from '../../../shared/types/models/MarketplaceProduct';
import AuthPromptModal from '~/components/marketplace/AuthPromptModal.vue'
import MessageComposer from '~/components/messaging/MessageComposer.vue'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'
import { useCurrencyExchange } from '~/composables/useCurrencyExchange'
import { formatUSDConversion } from '~/utils/formatters'
import { useTextFormatting } from '~/composables/useTextFormatting'
import type { ExtractedLink } from '~/composables/useTextFormatting'
import { useIonRouter, alertController } from '@ionic/vue'
import type { AlertInput } from '@ionic/vue'
import {
  MarketplaceRepository
} from '~/composables/api/repositories/MarketplaceRepository'
import { useTranslation } from '~/composables/useTranslation'
import type {
  MarketplaceDetailInfo
} from '../../../shared/types/models/metrics'
import { MetricCategory } from '../../../shared/types/models/metrics'

const route = useRoute()
const { t, locale } = useI18n()
const icons = useIcons()
const authStore = useAuthStore()
const { isAuthenticated } = authStore
const { localePath } = useSafeLocalePath()
const { getUSDRate } = useCurrencyExchange()
const ionRouter = useIonRouter()
const { formatMarkdown, extractUrls } = useTextFormatting()
const { getCountryName } = useCountries()
const { translate } = useTranslation()

const PLACEHOLDER_IMAGE = '/images/placeholder_sales.jpg'

const {
  currentProduct,
  isLoading,
  error,
  fetchProductDetail
} = useMarketplace()
const marketplaceRepository = new MarketplaceRepository()

const productImages = computed(() => {
  const rawImages = currentProduct.value?.image_urls ?? []
  const sanitized = rawImages
    .map((url) => typeof url === 'string' ? url.trim() : '')
    .filter((url) => url.length > 0)

  return sanitized.length > 0 ? sanitized : [PLACEHOLDER_IMAGE]
})

const handleSlideError = (event: Event) => {
  const target = event.target as HTMLImageElement | null
  if (target && target.getAttribute('src') !== PLACEHOLDER_IMAGE) {
    target.src = PLACEHOLDER_IMAGE
  }
}

const showAuthModal = ref(false)
const showMessageComposer = ref(false)

const handleShowAuthModal = async () => {
  showAuthModal.value = false
  await nextTick()
  showAuthModal.value = true
}

const handleAuthModalDismiss = () => {
  showAuthModal.value = false
}

const usdPrice = ref<number | null>(null)

// Translation state for description
const isTranslatingDescription = ref(false)
const translationErrorDescription = ref<string | null>(null)

// Translation state for additional info
const isTranslatingAdditional = ref(false)
const translationErrorAdditional = ref<string | null>(null)

const formattedDescription = computed(() => {
  if (!currentProduct.value?.description) return ''
  return formatMarkdown(currentProduct.value.description)
})

const extractedLinks = computed<ExtractedLink[]>(() => {
  const links: ExtractedLink[] = []

  // Extract from description
  if (currentProduct.value?.description) {
    links.push(...extractUrls(currentProduct.value.description))
  }

  // Extract from additional info
  if (currentProduct.value?.additional_info) {
    const info = currentProduct.value.additional_info
    if (typeof info === 'string') {
      links.push(...extractUrls(info))
    } else if (typeof info === 'object' && info !== null) {
      // Convert object to string to extract URLs from values
      const textContent = Object.values(info).join(' ')
      links.push(...extractUrls(textContent))
    }
  }

  // Deduplicate URLs by URL property
  const uniqueUrls = new Map<string, ExtractedLink>()
  links.forEach(link => {
    if (!uniqueUrls.has(link.url)) {
      uniqueUrls.set(link.url, link)
    }
  })

  return Array.from(uniqueUrls.values())
})

const MAX_VISIBLE_COUNTRIES = 5
const showAllCountries = ref(false)
const availableCountries = computed(() =>
  currentProduct.value?.countries ?? [])

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

watch(
  () => [currentProduct.value?.id, availableCountries.value.length],
  () => {
    showAllCountries.value = false
  }
)

onMounted(async () => {
  // Ensure page starts at the top
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
  }

  // Also scroll ion-content to top
  await nextTick()
  const ionContent = document.querySelector('ion-content')
  if (ionContent) {
    await ionContent.scrollToTop(0)
  }

  // Send metrics only if user is logged in
  if (productId.value && authStore.isAuthenticated) {
    const { sendMetric } = useMetrics()
    sendMetric({
      category: MetricCategory.VISIT_MARKETPLACE,
      extra_info: {
        view: 'detail',
        item_type: 'product',
        product_id: String(productId.value)
      } as MarketplaceDetailInfo
    })
  }
})

const canEditListing = ref(false)

const marketPath = computed(() => localePath('/market'))

const productId = computed(() => route.params.id as string)

const hasContactInfo = computed(() => {
  return currentProduct.value &&
    isProductAuthenticated(currentProduct.value as any)
})

const canContactSeller = computed(() => {
  // User must be authenticated
  if (!isAuthenticated) return false

  // User must have an active company
  if (!authStore.companyId) return false

  // Product must exist and have a company_id
  if (!currentProduct.value?.company_id) return false

  // Don't show contact button if user owns the product
  return currentProduct.value.company_id !== authStore.companyId
})

const productWithAuth = computed(() => {
  if (hasContactInfo.value && currentProduct.value) {
    return currentProduct.value as ProductAuthenticated
  }
  return null
})

const formattedAdditionalInfo = computed(() => {
  if (!currentProduct.value?.additional_info) return ''

  const info = currentProduct.value.additional_info

  // If it's an object, convert to markdown list
  if (typeof info === 'object' && info !== null) {
    const items = Object.entries(info)
      .map(([key, value]) => `- **${key}**: ${value}`)
      .join('\n')
    return formatMarkdown(items)
  }

  // If it's a string, format as markdown
  if (typeof info === 'string') {
    return formatMarkdown(info)
  }

  return ''
})

const formatPrice = (price: number, currency: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price)
  } catch {
    return `${currency || '$'} ${price}`
  }
}

const handleMessageSent = () => {
  showMessageComposer.value = false
}

const handleBack = () => {
  const router = useRouter()
  const fromId = route.query.from as string

  // Navigate back to market with anchor if we have one
  if (fromId) {
    router.push(`${marketPath.value}#product-${fromId}`)
  } else {
    router.push(marketPath.value)
  }
}

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
  return langMap[userLocale] || 'es' // Default to Spanish if locale unknown
}

// Open description translation in Google Translate
const toggleDescriptionTranslation = async () => {
  if (isTranslatingDescription.value) return

  // Reset error state
  translationErrorDescription.value = null

  // Translate the description
  if (!currentProduct.value?.description) return

  isTranslatingDescription.value = true

  try {
    const targetLang = getTargetLanguage()
    await translate(
      currentProduct.value.description,
      'auto',  // Auto-detect source language
      targetLang
    )

    // Show toast notification
    const toast = useToast()
    await toast.showSuccess(t('translation.openingGoogleTranslate'))
  } catch (error: any) {
    console.error('Translation failed:', error)

    translationErrorDescription.value =
      error instanceof Error ? error.message :
      t('translation.genericError')
  } finally {
    // Reset after a short delay to allow button to show loading state
    setTimeout(() => {
      isTranslatingDescription.value = false
    }, 500)
  }
}

// Open additional info translation in Google Translate
const toggleAdditionalInfoTranslation = async () => {
  if (isTranslatingAdditional.value) return

  // Reset error state
  translationErrorAdditional.value = null

  // Translate the additional info
  const info = currentProduct.value?.additional_info
  if (!info) return

  isTranslatingAdditional.value = true

  try {
    const targetLang = getTargetLanguage()
    let textToTranslate = ''

    // Convert to string if it's an object
    if (typeof info === 'object' && info !== null) {
      textToTranslate = Object.entries(info)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    } else if (typeof info === 'string') {
      textToTranslate = info
    }

    if (!textToTranslate) return

    await translate(
      textToTranslate,
      'auto',  // Auto-detect source language
      targetLang
    )

    // Show toast notification
    const toast = useToast()
    await toast.showSuccess(t('translation.openingGoogleTranslate'))
  } catch (error: any) {
    console.error('Translation failed:', error)

    translationErrorAdditional.value =
      error instanceof Error ? error.message :
      t('translation.genericError')
  } finally {
    // Reset after a short delay to allow button to show loading state
    setTimeout(() => {
      isTranslatingAdditional.value = false
    }, 500)
  }
}

const handleDelete = async () => {
  if (!currentProduct.value) return

  const alert = await alertController.create({
    header: t('common.confirmDelete'),
    message: t('marketplace.confirmDeleteMessage'),
    inputs: [
      {
        name: 'title',
        type: 'text',
        placeholder: currentProduct.value.title,
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
          if (data.title !== currentProduct.value?.title) {
            const toast = useToast()
            await toast.showWarning(t('errors.titleMismatch'))
            return false
          }

          try {
            const result = await marketplaceRepository.deleteProduct(
              productId.value
            )

            if (result.success) {
              const toast = useToast()
              await toast.showSuccess(
                t('marketplace.deleteSuccess'))
              ionRouter.push(marketPath.value)
            }
          } catch (error: any) {
            const toast = useToast()
            const message = error.message ||
              t('errors.deleteFailed')
            await toast.showError(message)
          }
          return true
        }
      }
    ]
  })

  await alert.present()
}

watch(productId, async (newId) => {
  if (newId) {
    // Reset translation state when product changes
    isTranslatingDescription.value = false
    translationErrorDescription.value = null
    isTranslatingAdditional.value = false
    translationErrorAdditional.value = null

    // Fetch the product first
    await fetchProductDetail(newId)

    // Then scroll to top after content loads
    await nextTick()

    // Try multiple scroll methods to ensure we get to the top
    // 1. Standard window scroll
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    // 2. Find and scroll ion-content
    const ionContent = document.querySelector('ion-content')
    if (ionContent && typeof ionContent.scrollToTop === 'function') {
      await ionContent.scrollToTop(0)
    }

    // Also scroll parent ion-content elements (nested layouts)
    const allIonContents = document.querySelectorAll('ion-content')
    for (const content of allIonContents) {
      if (typeof content.scrollToTop === 'function') {
        await content.scrollToTop(0)
      }
    }
  }
}, { immediate: true })

watch(currentProduct, async (product) => {
  if (product && authStore.companyId) {
    const isOwner = product.company_id === authStore.companyId
    const hasPermission = await useUserRole().canCreateListings()
    canEditListing.value = isOwner && hasPermission
  } else {
    canEditListing.value = false
  }
})

watch(currentProduct, async (product) => {
  try {
    if (
      product &&
      product.price_currency &&
      typeof product.price_currency === 'string' &&
      product.price_currency !== 'USD' &&
      typeof product.price === 'number'
    ) {
      const rate = await getUSDRate(product.price_currency)
      if (rate != null) {
        usdPrice.value = product.price * rate
      } else {
        usdPrice.value = null
      }
    } else {
      usdPrice.value = null
    }
  } catch (error) {
    console.warn('Failed to fetch USD conversion', error)
    usdPrice.value = null
  }
})

useHead(() => ({
  title: currentProduct.value?.title || t('marketplace.productDetail'),
  meta: [
    {
      name: 'description',
      content: currentProduct.value?.description ||
        t('marketplace.pageDescription')
    },
    {
      property: 'og:title',
      content: currentProduct.value?.title ||
        t('marketplace.productDetail')
    },
    {
      property: 'og:description',
      content: currentProduct.value?.description ||
        t('marketplace.pageDescription')
    },
    {
      property: 'og:image',
      content: productImages.value[0] || ''
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
}

.error-icon,
.lock-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

ion-spinner {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

/* Image gallery styling */
.product-images {
  --swiper-navigation-color: var(--ion-color-primary);
  --swiper-pagination-color: var(--ion-color-primary);
  width: 100%;
  max-height: 400px;
}

.product-image {
  width: 100%;
  height: 100%;
  max-height: 400px;
  object-fit: contain;
  background: var(--ion-color-light);
}

/* Price styling */
.price {
  margin: 0;
  font-size: 1.4rem;
  font-weight: bold;
}

@media (min-width: 768px) {
  .price {
    font-size: 1.8rem;
  }
}

/* Chips spacing */
ion-chip {
  margin: 0.25rem;
}

/* List items in additional info */
ion-list {
  background: transparent;
}

/* Contact button */
a {
  color: var(--ion-color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Card spacing */
ion-card {
  margin-bottom: 1rem;
}

.text-sm {
  font-size: 0.85rem;
  margin: 0.25rem 0;
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

/* Translation error message styling */
.translation-error {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  background: var(--ion-color-warning-tint);
}

.translation-error p {
  margin: 0;
  font-size: 0.875rem;
}

/* Spinner sizing for translation */
ion-spinner[name="dots"] {
  width: 1.5rem;
  height: 1.5rem;
}

/* Responsive adjustments */

</style>
