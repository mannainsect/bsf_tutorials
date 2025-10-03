<template>
  <div class="landing-content">
      <!-- Hero Section -->
      <ion-grid class="hero-grid">
        <ion-row class="ion-justify-content-center ion-text-center hero-row">
          <ion-col size="12">
            <ion-text class="hero-title">
              <h1>{{ t('home.heroTitle') }}</h1>
            </ion-text>
            <ion-text class="hero-subtitle">
              <p>{{ t('home.heroSubtitle') }}</p>
            </ion-text>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Features Section with Swiper -->
      <ion-grid class="ion-margin-top">
        <ion-row>
          <ion-col size="12">
            <swiper-container
              :slides-per-view="swiperConfig.slidesPerView"
              :space-between="swiperConfig.spaceBetween"
              :pagination="swiperConfig.pagination"
              :navigation="swiperConfig.navigation"
              :autoplay="swiperConfig.autoplay"
              :loop="swiperConfig.loop"
              :breakpoints="swiperConfig.breakpoints"
              class="swiper-container"
            >
          <swiper-slide v-for="feature in features" :key="feature.id">
            <ion-card>
              <ion-card-content class="ion-text-center">
                <ion-icon
                  :icon="feature.icon"
                  size="large"
                  color="primary"
                  class="ion-margin-bottom feature-icon"
                  :aria-label="t(feature.iconLabel)"
                />
                <ion-card-title>{{ t(feature.title) }}</ion-card-title>
                <ion-text color="medium">
                  <p>{{ t(feature.description) }}</p>
                </ion-text>
              </ion-card-content>
            </ion-card>
          </swiper-slide>
            </swiper-container>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Get Started and Sign In Buttons -->
      <ion-grid class="ion-margin-top">
        <ion-row class="ion-justify-content-center">
          <ion-col size="12" size-sm="8" size-md="6" size-lg="4">
            <ion-button
              v-if="!authStore.isAuthenticated"
              :router-link="localePath('/register')"
              expand="block"
              size="large"
              class="ion-margin-bottom"
            >
              {{ t('home.getStarted') }}
            </ion-button>
            <ion-button
              v-if="!authStore.isAuthenticated"
              :router-link="localePath('/login')"
              fill="clear"
              size="large"
              expand="block"
            >
              {{ t('home.signIn') }}
            </ion-button>
            <ion-button
              v-else
              :router-link="localePath('/account')"
              expand="block"
              size="large"
              color="primary"
            >
              {{ t('home.manageAccount') }}
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
  </div>
</template>

<script setup lang="ts">
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'

interface Feature {
  readonly id: string
  readonly icon: string
  readonly title: string
  readonly description: string
  readonly iconLabel: string
}

interface SwiperBreakpoint {
  slidesPerView: number
  spaceBetween: number
  loop?: boolean
}

interface SwiperConfig {
  slidesPerView: number
  spaceBetween: number
  pagination: boolean
  navigation: boolean
  autoplay: {
    delay: number
    disableOnInteraction: boolean
  }
  loop: boolean
  breakpoints: Record<number, SwiperBreakpoint>
}

const { t } = useI18n()
const localePath = useLocalePath()
const icons = useIcons()
const authStore = useAuthStore()

const features: readonly Feature[] = [
  {
    id: 'secure',
    icon: icons.success,
    title: 'home.features.secure.title',
    description: 'home.features.secure.description',
    iconLabel: 'home.features.secure.iconLabel'
  },
  {
    id: 'fast',
    icon: icons.fast,
    title: 'home.features.fast.title',
    description: 'home.features.fast.description',
    iconLabel: 'home.features.fast.iconLabel'
  },
  {
    id: 'mobile',
    icon: icons.mobile,
    title: 'home.features.mobile.title',
    description: 'home.features.mobile.description',
    iconLabel: 'home.features.mobile.iconLabel'
  }
]

// Swiper configuration with dynamic loop based on viewport
// Loop is disabled when slidesPerView >= total slides to prevent console warnings
const swiperConfig = computed<SwiperConfig>(() => {
  const slidesCount = features.length
  
  return {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: true,
    navigation: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    loop: slidesCount > 1,
    breakpoints: {
      768: { 
        slidesPerView: 2, 
        spaceBetween: 30,
        loop: slidesCount > 2
      },
      1024: { 
        slidesPerView: 3, 
        spaceBetween: 40,
        loop: slidesCount > 3
      }
    }
  }
})
</script>

<style scoped>
.landing-content {
  padding: var(--ion-padding, 16px);
  padding-top: calc(var(--ion-padding, 16px) / 4);
}

.hero-grid {
  margin-top: 0;
}

.hero-row {
  padding-top: 0;
  padding-bottom: calc(var(--ion-padding, 16px) / 3);
}

.hero-title :deep(h1) {
  margin-bottom: 0.5rem;
}

.hero-subtitle :deep(p) {
  margin-top: 0;
}

.featured-grid {
  margin-top: calc(var(--ion-padding, 16px) / 2);
}

.featured-header {
  margin-bottom: calc(var(--ion-padding, 16px) / 2.5);
}

.featured-title :deep(h2) {
  margin-bottom: 0.5rem;
}

.featured-subtitle :deep(p) {
  margin-top: 0;
}

.featured-actions {
  margin-top: calc(var(--ion-padding, 16px) / 2);
}

/* Use Ionic CSS variables for Swiper theming */
.swiper-container {
  --swiper-navigation-color: var(--ion-color-primary);
  --swiper-pagination-color: var(--ion-color-primary);
  --swiper-pagination-bullet-inactive-color: var(--ion-color-medium);
}

/* Ensure cards have equal height */
swiper-slide ion-card {
  height: 100%;
}

swiper-slide ion-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Feature icon sizing using Ionic's font-based approach */
.feature-icon {
  font-size: 3rem;
  margin-bottom: var(--ion-margin, 16px);
  color: var(--ion-color-primary);
}
</style>
