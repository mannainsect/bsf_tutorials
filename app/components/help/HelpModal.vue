<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          {{ currentTitle }}
        </ion-title>
        <ion-buttons slot="end">
          <ion-button
            fill="clear"
            :aria-label="$t('common.close')"
            @click="dismiss"
          >
            <ion-icon :icon="closeIcon" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Topic navigation tabs if multiple topics -->
      <ion-segment
        v-if="showTopicNavigation"
        v-model="selectedTopic"
        scrollable
        class="ion-margin-bottom"
      >
        <ion-segment-button
          v-for="topicKey in availableTopics"
          :key="topicKey"
          :value="(topicKey as any)"
        >
          <ion-label>
            {{ getTopicTitle(topicKey) }}
          </ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Help content -->
      <div v-if="helpContent" class="help-content">
        <!-- Main content -->
        <ion-text>
          <h2>{{ helpContent.title }}</h2>
          <p>{{ helpContent.content }}</p>
        </ion-text>

        <!-- Sections if available -->
        <div
          v-if="helpContent.sections && helpContent.sections.length"
          class="ion-margin-top"
        >
          <div
            v-for="(section, index) in helpContent.sections"
            :key="`section-${index}`"
            class="help-section ion-margin-vertical"
          >
            <ion-text color="primary">
              <h3>{{ section.title }}</h3>
            </ion-text>
            <ion-text>
              <p>{{ section.content }}</p>
            </ion-text>
          </div>
        </div>
      </div>

      <!-- Fallback content -->
      <div v-else class="ion-text-center ion-padding">
        <ion-icon
          :icon="helpIcon"
          class="fallback-icon"
          aria-hidden="true"
        />
        <ion-text>
          <h3>{{ $t('help.noContent.title') }}</h3>
          <p class="ion-margin-top">
            {{ $t('help.noContent.message') }}
          </p>
        </ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import type { Ref, ComputedRef } from 'vue'
import { ref, computed, watch, onMounted } from 'vue'
import { modalController } from '@ionic/vue'
import { useI18n } from 'vue-i18n'
import type { HelpContent } from '../../../shared/types/help'
import {
  HelpTopic,
  isValidHelpTopic
} from '../../../shared/types/help'
import { useIcons } from '~/composables/useIcons'

interface Props {
  topic?: HelpTopic | null
}

const props = withDefaults(defineProps<Props>(), {
  topic: null
})

const { t } = useI18n()
const { close, helpCircleOutline } = useIcons()

const closeIcon = close
const helpIcon = helpCircleOutline

// Available topics
const availableTopics = Object.values(HelpTopic)

// Selected topic state
const selectedTopic: Ref<string> = ref(
  props.topic || HelpTopic.MARKET_FILTERING
)

// Show navigation only if no specific topic or multiple available
const showTopicNavigation: ComputedRef<boolean> = computed(() => {
  return !props.topic && availableTopics.length > 1
})

// Current title based on selected topic
const currentTitle: ComputedRef<string> = computed(() => {
  if (props.topic) {
    return getTopicTitle(props.topic)
  }
  return t('help.title')
})

// Get topic title from translation
const getTopicTitle = (topicKey: string): string => {
  const titleKey = `help.topics.${topicKey}.title`
  const translation = t(titleKey)
  if (translation === titleKey) {
    const fallback = t('help.topicFallback')
    if (fallback !== 'help.topicFallback') {
      return fallback
    }

    return topicKey
      .split('.')
      .map((segment) => segment.replace(/[-_]/g, ' '))
      .flatMap((segment) => segment.split(' '))
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  return translation
}

// Help content based on selected topic
const helpContent: ComputedRef<HelpContent | null> = computed(() => {
  const currentTopic = props.topic || selectedTopic.value

  if (!isValidHelpTopic(currentTopic)) {
    console.warn(`[HelpModal] Invalid topic: ${currentTopic}`)
    return null
  }

  const baseKey = `help.topics.${currentTopic}`

  // Build content object from translations
  const title = t(`${baseKey}.title`)
  const content = t(`${baseKey}.content`)

  // Check if main content exists
  if (title === `${baseKey}.title`) {
    return null
  }

  // Try to get sections (support both array-style 0-based and legacy 1-based)
  const sections: HelpContent['sections'] = []
  let foundAny = false

  // First, try 0-based indices (arrays in locale files)
  for (let i = 0; i < 10; i++) {
    const titleKey = `${baseKey}.sections.${i}.title`
    const contentKey = `${baseKey}.sections.${i}.content`

    const sectionTitle = t(titleKey)
    if (sectionTitle !== titleKey) {
      const sectionContent = t(contentKey)
      sections.push({ title: sectionTitle, content: sectionContent })
      foundAny = true
      if (sections.length >= 5) break // Cap sections at 5
    } else if (foundAny) {
      // Stop at first gap after finding at least one section
      break
    }
  }

  // Fallback: legacy 1-based indices
  if (!foundAny) {
    for (let i = 1; i <= 5; i++) {
      const titleKey = `${baseKey}.sections.${i}.title`
      const contentKey = `${baseKey}.sections.${i}.content`

      const sectionTitle = t(titleKey)
      if (sectionTitle !== titleKey) {
        const sectionContent = t(contentKey)
        sections.push({ title: sectionTitle, content: sectionContent })
        foundAny = true
      } else {
        break // No more sections
      }
    }
  }

  return {
    title,
    content,
    sections: sections.length > 0 ? sections : undefined
  }
})

// Dismiss the modal
const dismiss = async () => {
  try {
    await modalController.dismiss()
  } catch (error) {
    console.error('[HelpModal] Error dismissing:', error)
  }
}

// Scroll to topic if specified
const scrollToTopic = () => {
  if (props.topic) {
    selectedTopic.value = props.topic
    // Could implement actual scrolling here if needed
    console.log(`[HelpModal] Scrolled to topic: ${props.topic}`)
  }
}

// Watch for topic changes
watch(() => props.topic, (newTopic) => {
  if (newTopic && isValidHelpTopic(newTopic)) {
    selectedTopic.value = newTopic
    scrollToTopic()
  }
})

// Initial scroll on mount
onMounted(() => {
  scrollToTopic()
})

// Expose dismiss method
defineExpose({
  dismiss
})
</script>

<style scoped>
.help-content {
  max-width: 800px;
  margin: 0 auto;
}

.help-section {
  border-left: 3px solid var(--ion-color-primary);
  padding-left: 1rem;
}

.fallback-icon {
  font-size: 4rem;
  color: var(--ion-color-medium);
  margin-bottom: 1rem;
}

ion-segment {
  --background: var(--ion-color-light);
}

h2 {
  color: var(--ion-color-primary);
  margin-bottom: 1rem;
}

h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

p {
  line-height: 1.6;
  color: var(--ion-text-color);
}
</style>
