<template>
  <ion-card
    :button="true"
    class="product-card"
    @click="handleWantedClick"
  >
    <img
      :src="imageSrc"
      :alt="wanted.title"
      class="product-image"
      loading="lazy"
      @error="handleImageError"
    />

    <ion-card-header class="product-card-header">
      <ion-card-title class="product-title">{{ wanted.title }}</ion-card-title>
      <ion-card-subtitle class="product-company">{{ wanted.company_name }}</ion-card-subtitle>
    </ion-card-header>

    <ion-card-content>
      <ion-grid class="ion-no-padding">
        <ion-row class="product-meta-row">
          <ion-col size="6" class="meta-price">
            <ion-text color="primary">
              <h3 class="price">
                {{ budgetDisplay }}
              </h3>
            </ion-text>
            <ion-text v-if="secondaryMeta" color="medium">
              <p class="text-sm">{{ secondaryMeta }}</p>
            </ion-text>
          </ion-col>
          <ion-col size="6" class="ion-text-end meta-tags">
            <ion-chip
              v-if="wanted.category"
              color="secondary"
              size="small"
              class="product-chip"
            >
              <ion-label>{{ wanted.category }}</ion-label>
            </ion-chip>
            <ion-chip
              v-if="wanted.subcategory"
              color="tertiary"
              size="small"
              class="product-chip"
            >
              <ion-label>{{ wanted.subcategory }}</ion-label>
            </ion-chip>
          </ion-col>
        </ion-row>

        <ion-row v-if="quantityDisplay" class="quantity-row">
          <ion-col size="12">
            <ion-text color="medium">
              <p class="quantity">
                {{ $t('wanted.quantity') }}: {{ quantityDisplay }}
              </p>
            </ion-text>
          </ion-col>
        </ion-row>

        <ion-row v-if="isAuthenticated && hasContactEmail">
          <ion-col size="12">
            <ion-item lines="none" class="contact-item">
              <ion-icon
                slot="start"
                :icon="icons.mail"
                color="medium"
              />
              <ion-label>
                <p class="contact-email">{{ wantedWithAuth?.contact_email }}</p>
              </ion-label>
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-card-content>

    <div v-if="isLoading" class="loading-overlay">
      <ion-spinner color="primary" />
    </div>

    <div v-if="error" class="error-overlay">
      <ion-text color="danger">
        <p>{{ $t('errors.loadingFailed') }}</p>
      </ion-text>
    </div>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  isAuthenticatedWanted
} from '../../../shared/types/models/MarketplaceWanted'
import type {
  WantedPublicListing,
  Wanted
} from '../../../shared/types/models/MarketplaceWanted'
import { debounce } from '~/utils/helpers'
import { useSafeLocalePath } from '~/composables/useSafeLocalePath'

interface Props {
  wanted: WantedPublicListing | Wanted
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

const PLACEHOLDER_IMAGE = '/images/placeholder_wanted.jpg'

const resolveImageSource = (
  wanted: WantedPublicListing | Wanted
): string => {
  const primaryImage = wanted.image_urls?.[0]
  if (typeof primaryImage === 'string' && primaryImage.trim().length > 0) {
    return primaryImage
  }
  return PLACEHOLDER_IMAGE
}

const imageSrc = ref(resolveImageSource(props.wanted))

const handleImageError = () => {
  if (imageSrc.value !== PLACEHOLDER_IMAGE) {
    imageSrc.value = PLACEHOLDER_IMAGE
  }
}

watch(
  () => [props.wanted.id, props.wanted.image_urls?.[0] ?? null],
  () => {
    imageSrc.value = resolveImageSource(props.wanted)
  }
)

const hasContactEmail = computed(() => {
  return isAuthenticatedWanted(props.wanted)
})

const wantedWithAuth = computed(() => {
  if (hasContactEmail.value) {
    return props.wanted as Wanted
  }
  return null
})

const handleWantedClick = debounce(() => {
  if (props.isLoading || props.error) {
    return
  }

  if (!props.wanted.id) {
    console.warn('Wanted item missing ID:', props.wanted)
    return
  }

  router.push(localePath(`/wanted/${props.wanted.id}`))
}, 300)

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

const budgetDisplay = computed(() => {
  const min = formatCurrency(props.wanted.budget_min, props.wanted.budget_currency)
  const max = formatCurrency(props.wanted.budget_max, props.wanted.budget_currency)

  if (min && max) {
    if (props.wanted.budget_min === props.wanted.budget_max) {
      return min
    }
    return `${min} - ${max}`
  }

  if (min) {
    return min
  }

  if (max) {
    return max
  }

  return '—'
})

const formatDate = (dateString?: string | null) => {
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
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return dateString
  }
}

const secondaryMeta = computed(() => {
  const expires = formatDate(props.wanted.expires_at)
  if (expires) {
    return `${t('wanted.expires')}: ${expires}`
  }

  const created = formatDate(props.wanted.created_at)
  if (created) {
    return created
  }

  return null
})

const quantityDisplay = computed(() => {
  const quantity = props.wanted.quantity_needed
  const unit = props.wanted.quantity_unit

  if (quantity == null || quantity === 0) {
    return null
  }

  if (unit && unit.trim().length > 0) {
    return `${quantity} ${unit}`
  }

  return `${quantity}`
})
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
