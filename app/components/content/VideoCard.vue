<template>
  <ion-card>
    <ion-card-content class="video-content">
      <!-- Vimeo Player Section -->
      <ClientOnly v-if="video.url !== null">
        <div v-if="isValidVimeoUrl" class="video-container">
          <div class="aspect-ratio-box">
            <iframe
              :src="video.url"
              frameborder="0"
              loading="lazy"
              allow="autoplay; fullscreen; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowfullscreen
              :title="video.title"
              :aria-label="video.title"
              class="vimeo-iframe"
            />
          </div>
        </div>
        <div v-else class="invalid-url">
          <ion-text color="warning">
            <p>{{ t('video.error.invalidUrl') }}</p>
          </ion-text>
        </div>
      </ClientOnly>

      <!-- Premium Badge (no URL) -->
      <div v-else class="premium-placeholder">
        <ion-badge color="warning" class="premium-badge">
          {{ t('video.premium.badge') }}
        </ion-badge>
      </div>
    </ion-card-content>

    <ion-card-header>
      <ion-card-title>{{ video.title }}</ion-card-title>
    </ion-card-header>

    <ion-card-content>
      <!-- Description -->
      <ion-text color="medium">
        <p :class="{ 'line-clamp-2': !featured }">
          {{ video.description }}
        </p>
      </ion-text>

      <!-- Level Chip -->
      <div class="chips-container">
        <ion-chip :color="getLevelColor(video.level)">
          <ion-label>
            {{ t(`video.level.${video.level}`) }}
          </ion-label>
        </ion-chip>

        <!-- Credits Badge -->
        <ion-badge
          :color="video.credits === 0 ? 'success' : 'primary'"
          class="credits-badge"
        >
          {{
            video.credits === 0
              ? t('video.free.badge')
              : `${video.credits} credits`
          }}
        </ion-badge>
      </div>

      <!-- Category Tags (first 3) -->
      <div class="chips-container">
        <ion-chip
          v-for="tag in video.category_tags.slice(0, 3)"
          :key="tag"
          size="small"
          outline
        >
          <ion-label>{{ tag }}</ion-label>
        </ion-chip>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import type { ContentPublic } from '../../../shared/types/api/content.types'

interface Props {
  video: ContentPublic
  featured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  featured: false
})

const { t } = useI18n()

// Validate Vimeo URL - must be HTTPS from vimeo.com domain
// Accepts both direct (vimeo.com/ID) and embed
// (player.vimeo.com/video/ID) formats
// Query parameters allowed (backend includes player config params)
const isValidVimeoUrl = computed(() => {
  if (!props.video.url) return false
  const directPattern = /^https:\/\/(?:www\.)?vimeo\.com\/\d+(?:\?.*)?$/
  const embedPattern = /^https:\/\/player\.vimeo\.com\/video\/\d+(?:\?.*)?$/
  return (
    directPattern.test(props.video.url) || embedPattern.test(props.video.url)
  )
})

// Get color for level chip
const getLevelColor = (level: string): 'success' | 'warning' | 'danger' => {
  switch (level) {
    case 'basic':
      return 'success'
    case 'intermediate':
      return 'warning'
    case 'advanced':
      return 'danger'
    default:
      return 'success'
  }
}
</script>

<style scoped>
.video-content {
  padding: 0;
}

.video-container {
  width: 100%;
}

.aspect-ratio-box {
  padding: 56.25% 0 0 0;
  position: relative;
}

.vimeo-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.invalid-url,
.premium-placeholder {
  padding: var(--ion-padding, 16px);
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ion-color-light);
}

.premium-badge {
  font-size: 1.2rem;
  padding: 0.5rem 1rem;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  align-items: center;
}

.credits-badge {
  font-size: 0.875rem;
}
</style>
