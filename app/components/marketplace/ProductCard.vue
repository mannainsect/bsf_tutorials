<template>
  <ion-card
    :button="true"
    class="product-card"
    @click="handleProductClick"
  >
    <img
      :src="imageSrc"
      :alt="product.title"
      class="product-image"
      loading="lazy"
      @error="handleImageError"
    />
    <ion-card-header class="product-card-header">
      <ion-card-title class="product-title">{{ product.title }}</ion-card-title>
      <ion-card-subtitle class="product-company">{{ product.company_name }}</ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <ion-grid class="ion-no-padding">
        <ion-row class="product-meta-row">
          <ion-col size="6" class="meta-price">
            <ion-text color="primary">
              <h3 class="price">
                {{ formatPrice(product.price, product.price_currency) }}
              </h3>
            </ion-text>
            <ion-text
              v-if="usdPrice !== null && product.price_currency !== 'USD'"
              color="medium"
            >
              <p class="text-sm">≈ {{ formatUSDConversion(usdPrice) }}</p>
            </ion-text>
          </ion-col>
          <ion-col size="6" class="ion-text-end meta-tags">
            <ion-chip color="secondary" size="small" class="product-chip">
              <ion-label>{{ product.category }}</ion-label>
            </ion-chip>
          </ion-col>
        </ion-row>

        <ion-row v-if="product.quantity" class="quantity-row">
          <ion-col size="12">
            <ion-text color="medium">
              <p class="quantity">
                {{ $t('marketplace.quantity') }}:
                {{ product.quantity }} {{ product.quantity_unit }}
              </p>
            </ion-text>
          </ion-col>
        </ion-row>

        <!-- Show contact email for authenticated users -->
        <ion-row v-if="isAuthenticated && hasContactEmail">
          <ion-col size="12">
            <ion-item lines="none" class="contact-item">
              <ion-icon
                slot="start"
                :icon="icons.mail"
                color="medium"
              />
              <ion-label>
                <p class="contact-email">{{ productWithAuth?.contact_email }}</p>
              </ion-label>
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-card-content>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <ion-spinner color="primary" />
    </div>

    <!-- Error state -->
    <div v-if="error" class="error-overlay">
      <ion-text color="danger">
        <p>{{ $t('errors.loadingFailed') }}</p>
      </ion-text>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import {
  
  
  isAuthenticatedProduct
} from '../../../shared/types/models/MarketplaceProduct'
import type {ProductPublicListing, Product} from '../../../shared/types/models/MarketplaceProduct';
import { debounce } from '~/utils/helpers'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'
import { useCurrencyExchange } from '~/composables/useCurrencyExchange'
import { formatUSDConversion } from '~/utils/formatters'

interface Props {
  product: ProductPublicListing | Product
  isLoading?: boolean
  error?: Error | null
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null
})

const router = useRouter()
const authStore = useAuthStore()
const { isAuthenticated } = authStore
const icons = useIcons()
const { localePath } = useSafeLocalePath()
const { t } = useI18n()
const { getUSDRate } = useCurrencyExchange()

const PLACEHOLDER_IMAGE = '/images/placeholder_sales.jpg'

const resolveImageSource = (product: ProductPublicListing | Product): string => {
  const primaryImage = product.image_urls?.[0]
  if (typeof primaryImage === 'string' && primaryImage.trim().length > 0) {
    return primaryImage
  }
  return PLACEHOLDER_IMAGE
}

const imageSrc = ref(resolveImageSource(props.product))

// USD conversion state
const usdPrice = ref<number | null>(null)

const handleImageError = () => {
  if (imageSrc.value !== PLACEHOLDER_IMAGE) {
    imageSrc.value = PLACEHOLDER_IMAGE
  }
}

watch(
  () => [props.product.id, props.product.image_urls?.[0] ?? null],
  () => {
    imageSrc.value = resolveImageSource(props.product)
  }
)

// Check if product has authenticated fields
const hasContactEmail = computed(() => {
  return isAuthenticatedProduct(props.product)
})

// Cast to Product type when authenticated
const productWithAuth = computed(() => {
  if (hasContactEmail.value) {
    return props.product as Product
  }
  return null
})

// Create debounced function once at component initialization
const handleProductClick = debounce(() => {
  // Don't navigate if loading or error state
  if (props.isLoading || props.error) {
    return
  }

  // Validate product has ID
  if (!props.product.id) {
    console.warn('Product missing ID:', props.product)
    return
  }

  // Navigate to product detail with anchor for return navigation
  router.push({
    path: localePath(`/market/${props.product.id}`),
    query: { from: props.product.id }
  })
}, 300) // 300ms debounce delay

// Format price with currency
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

// Keep USD conversion in sync with product updates
watch(
  () => [
    props.product.id,
    props.product.price,
    props.product.price_currency
  ],
  async ([, price, currency]) => {
    try {
      // Type guard for currency
      if (
        currency &&
        typeof currency === 'string' &&
        currency.toUpperCase() !== 'USD' &&
        typeof price === 'number'
      ) {
        const rate = await getUSDRate(currency.toUpperCase())
        usdPrice.value = rate != null ? price * rate : null
      } else {
        usdPrice.value = null
      }
    } catch (error) {
      console.warn('Failed to fetch USD conversion', error)
      usdPrice.value = null
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.product-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background-color: var(--ion-color-light, #f4f5f8);
}

.product-card-header {
  padding: 0.75rem 1rem 0.35rem;
}

.product-title {
  font-size: 1rem;
  line-height: 1.3;
  font-weight: 600;
  margin: 0;
  word-break: break-word;
}

.product-company {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium-shade, var(--ion-color-medium));
  text-transform: none;
  letter-spacing: normal;
}

ion-card-content {
  flex: 1;
  padding: 0.4rem 1rem 0.85rem;
}

.product-meta-row {
  align-items: center;
}

.meta-price {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.price {
  margin: 0;
  font-size: 1.05rem;
  font-weight: bold;
}

.text-sm {
  font-size: 0.8rem;
  margin: 0;
}

.meta-tags {
  display: flex;
  justify-content: flex-end;
}

.product-chip {
  --padding-top: 0;
  --padding-bottom: 0;
  --padding-start: 0.35rem;
  --padding-end: 0.35rem;
  --min-height: 1.25rem;
  font-size: 0.75rem;
}

.quantity-row {
  margin-top: 0.25rem;
}

.quantity {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
}

.contact-item {
  --background: transparent;
  --padding-start: 0;
  margin-top: 0.35rem;
}

.contact-email {
  font-size: 0.85rem;
  word-break: break-word;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
