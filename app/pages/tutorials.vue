<template>
  <div class="tutorials-page">
    <!-- Page Header -->
    <ion-grid>
      <ion-row>
        <ion-col size="12" class="ion-text-center page-header">
          <ion-text>
            <h1>{{ t('tutorials.title') }}</h1>
          </ion-text>
          <ion-text color="medium">
            <p>{{ t('tutorials.subtitle') }}</p>
          </ion-text>
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- Loading State -->
    <ion-grid v-if="loading">
      <ion-row class="ion-justify-content-center">
        <ion-col size="12" class="ion-text-center">
          <LoadingSpinner />
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- Error State -->
    <ion-grid v-else-if="error">
      <ion-row class="ion-justify-content-center">
        <ion-col size="12" size-md="8" size-lg="6">
          <ErrorCard
            :message="t('tutorials.error.title')"
            :retry-action="retryLoad"
            :retry-label="t('tutorials.error.retry')"
          />
        </ion-col>
      </ion-row>
    </ion-grid>

    <!-- Filters and Results -->
    <ion-grid v-else>
      <!-- Filters Section -->
      <ion-row>
        <ion-col size="12">
          <ion-card>
            <ion-card-content>
              <!-- Search -->
              <ion-searchbar
                v-model="searchInput"
                :placeholder="t('tutorials.search.placeholder')"
                :debounce="300"
                @ion-input="onSearchInput"
              />

              <!-- Level Filter -->
              <ion-item>
                <ion-label>
                  {{ t('tutorials.filters.level') }}
                </ion-label>
                <ion-select
                  v-model="selectedLevels"
                  multiple
                  interface="popover"
                >
                  <ion-select-option value="basic">
                    {{ t('video.level.basic') }}
                  </ion-select-option>
                  <ion-select-option value="intermediate">
                    {{ t('video.level.intermediate') }}
                  </ion-select-option>
                  <ion-select-option value="advanced">
                    {{ t('video.level.advanced') }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Category Tags Filter -->
              <ion-item v-if="availableCategoryTags.length > 0">
                <ion-label>
                  {{ t('tutorials.filters.categoryTags') }}
                </ion-label>
                <ion-select
                  v-model="selectedCategoryTags"
                  multiple
                  interface="popover"
                >
                  <ion-select-option
                    v-for="tag in availableCategoryTags"
                    :key="tag"
                    :value="tag"
                  >
                    {{ tag }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Profile Tags Filter -->
              <ion-item v-if="availableProfileTags.length > 0">
                <ion-label>
                  {{ t('tutorials.filters.profileTags') }}
                </ion-label>
                <ion-select
                  v-model="selectedProfileTags"
                  multiple
                  interface="popover"
                >
                  <ion-select-option
                    v-for="tag in availableProfileTags"
                    :key="tag"
                    :value="tag"
                  >
                    {{ tag }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Sort Options -->
              <ion-row>
                <ion-col size="6">
                  <ion-item>
                    <ion-label>
                      {{ t('tutorials.sort.label') }}
                    </ion-label>
                    <ion-select v-model="sortBy">
                      <ion-select-option value="credits">
                        {{ t('tutorials.sort.credits') }}
                      </ion-select-option>
                      <ion-select-option value="title">
                        {{ t('tutorials.sort.title') }}
                      </ion-select-option>
                      <ion-select-option value="date">
                        {{ t('tutorials.sort.date') }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </ion-col>
                <ion-col size="6">
                  <ion-item>
                    <ion-label>
                      {{ t('tutorials.sort.direction') }}
                    </ion-label>
                    <ion-select v-model="sortDirection">
                      <ion-select-option value="asc">
                        {{ t('tutorials.sort.ascending') }}
                      </ion-select-option>
                      <ion-select-option value="desc">
                        {{ t('tutorials.sort.descending') }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </ion-col>
              </ion-row>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <!-- Results Count -->
      <ion-row>
        <ion-col size="12">
          <ion-text color="medium">
            <p class="results-count">
              {{ t('tutorials.results.count', filteredVideos.length) }}
            </p>
          </ion-text>
        </ion-col>
      </ion-row>

      <!-- Empty State -->
      <ion-row
        v-if="filteredVideos.length === 0"
        class="ion-justify-content-center"
      >
        <ion-col size="12" size-md="8" size-lg="6">
          <ion-card>
            <ion-card-content class="ion-text-center">
              <ion-text>
                <h2>{{ t('tutorials.empty.title') }}</h2>
              </ion-text>
              <ion-text color="medium">
                <p>{{ t('tutorials.empty.description') }}</p>
              </ion-text>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>

      <!-- Videos Grid -->
      <ion-row v-else>
        <ion-col
          v-for="video in filteredVideos"
          :key="video._id"
          size="12"
          size-md="6"
          size-lg="4"
        >
          <VideoCard :video="video" />
        </ion-col>
      </ion-row>
    </ion-grid>
  </div>
</template>

<script setup lang="ts">
import type {
  ContentPublic,
  CategoryTag,
  ProfileTag
} from '../../shared/types/api/content.types'

definePageMeta({
  layout: 'public'
})

const { t } = useI18n()
const { api } = useApi()

// State
const videos = ref<ContentPublic[]>([])
const loading = ref(true)
const error = ref(false)

// Filters
const searchInput = ref('')
const searchQuery = ref('')
const selectedLevels = ref<string[]>([])
const selectedCategoryTags = ref<CategoryTag[]>([])
const selectedProfileTags = ref<ProfileTag[]>([])
const sortBy = ref<'credits' | 'title' | 'date'>('credits')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Extract unique tags from videos
const availableCategoryTags = computed(() => {
  const tags = new Set<CategoryTag>()
  videos.value.forEach((v: ContentPublic) =>
    v.category_tags.forEach((t: CategoryTag) => tags.add(t))
  )
  return Array.from(tags).sort()
})

const availableProfileTags = computed(() => {
  const tags = new Set<ProfileTag>()
  videos.value.forEach((v: ContentPublic) =>
    v.profile_tags.forEach((t: ProfileTag) => tags.add(t))
  )
  return Array.from(tags).sort()
})

// Handle search input with debouncing
const onSearchInput = (event: CustomEvent) => {
  searchQuery.value = event.detail.value || ''
}

// Filtered videos
const filteredVideos = computed(() => {
  let filtered = [...videos.value]

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      v =>
        v.title?.toLowerCase().includes(query) ||
        v.description?.toLowerCase().includes(query)
    )
  }

  // Level filter
  if (selectedLevels.value.length > 0) {
    filtered = filtered.filter(v => selectedLevels.value.includes(v.level))
  }

  // Category tags filter (OR logic)
  if (selectedCategoryTags.value.length > 0) {
    filtered = filtered.filter((v: ContentPublic) =>
      v.category_tags.some((tag: CategoryTag) =>
        selectedCategoryTags.value.includes(tag)
      )
    )
  }

  // Profile tags filter (OR logic)
  if (selectedProfileTags.value.length > 0) {
    filtered = filtered.filter((v: ContentPublic) =>
      v.profile_tags.some((tag: ProfileTag) =>
        selectedProfileTags.value.includes(tag)
      )
    )
  }

  // Sort (create new sorted array to avoid mutation)
  if (sortBy.value === 'credits') {
    return [...filtered].sort((a, b) => {
      const diff = a.credits - b.credits
      return sortDirection.value === 'asc' ? diff : -diff
    })
  } else if (sortBy.value === 'title') {
    return [...filtered].sort((a, b) => {
      const cmp = a.title.localeCompare(b.title)
      return sortDirection.value === 'asc' ? cmp : -cmp
    })
  } else if (sortBy.value === 'date') {
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      const diff = dateA - dateB
      return sortDirection.value === 'asc' ? diff : -diff
    })
  }

  return filtered
})

// Load videos
const loadVideos = async () => {
  loading.value = true
  error.value = false
  try {
    const data = await api<ContentPublic[]>('/products/content/public')
    // Filter only videos with URLs
    videos.value = data.filter(v => v.url !== null)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

// Retry function
const retryLoad = () => {
  loadVideos()
}

// Load videos on mount
onMounted(() => {
  loadVideos()
})
</script>

<style scoped>
.tutorials-page {
  padding: var(--ion-padding, 16px);
}

.page-header {
  margin-bottom: calc(var(--ion-padding, 16px) / 2);
}

.page-header :deep(h1) {
  margin-bottom: 0.5rem;
}

.page-header :deep(p) {
  margin-top: 0;
}

.results-count {
  margin: 0.5rem 0;
  font-size: 0.875rem;
}
</style>
