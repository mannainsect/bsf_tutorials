<template>
  <ion-button
    :fill="fill"
    :size="size"
    :color="color"
    :aria-label="ariaLabel"
    class="help-icon-button"
    @click.stop="handleClick"
  >
    <ion-icon slot="icon-only" :icon="helpCircleOutline" />
  </ion-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HelpTopic } from '../../../shared/types/help'
import { useHelp } from '~/composables/useHelp'
import { useIcons } from '~/composables/useIcons'

interface Props {
  /**
   * The help topic to display when clicked
   */
  topic: HelpTopic

  /**
   * Button size
   * @default 'default'
   */
  size?: 'default' | 'small' | 'large'

  /**
   * Button fill style
   * @default 'clear'
   */
  fill?: 'clear' | 'outline' | 'solid' | 'default'

  /**
   * Button color
   * @default 'medium'
   */
  color?: string

  /**
   * Custom aria-label for accessibility
   */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'small',
  fill: 'clear',
  color: 'medium',
  ariaLabel: undefined
})

const { t } = useI18n()
const { showHelp } = useHelp()
const { helpCircleOutline } = useIcons()

const translate = (
  key: string,
  fallback: string,
  params?: Record<string, unknown>
): string => {
  const translated = params ? t(key, params as any) : t(key)
  return translated === key ? fallback : translated
}

const formatTopic = (topic?: string | null): string => {
  if (!topic) {
    return 'topic'
  }

  return topic
    .split('.')
    .flatMap(segment => segment.split(/[-_]/))
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// Computed aria-label with fallback
const ariaLabel: ComputedRef<string> = computed(() => {
  if (props.ariaLabel) {
    return props.ariaLabel
  }

  // Try to get specific help label for the topic
  const topicPath = props.topic
  const specificLabel = topicPath
    ? translate(`help.topics.${topicPath}.ariaLabel`, '')
    : ''

  if (specificLabel) {
    return specificLabel
  }

  // Fallback to generic help label
  const fallbackTopicTitle = props.topic
    ? translate(`help.topics.${topicPath}.title`, formatTopic(topicPath))
    : translate('help.button.genericTopic', 'topic')

  return translate(
    'help.button.ariaLabel',
    `Get help for ${fallbackTopicTitle}`,
    { topic: fallbackTopicTitle }
  )
})

/**
 * Handle button click - show help for the specified topic
 * Stop propagation to prevent parent click handlers
 */
const handleClick = async (event: Event) => {
  event.preventDefault()
  event.stopPropagation()

  try {
    console.log(`[HelpIcon] Showing help for topic: ${props.topic ?? ''}`)
    await showHelp(props.topic)
  } catch (error) {
    console.error('[HelpIcon] Failed to show help:', error)
  }
}
</script>

<style scoped>
.help-icon-button {
  --padding-start: 0.25rem;
  --padding-end: 0.25rem;
  --padding-top: 0.25rem;
  --padding-bottom: 0.25rem;
  min-width: auto;
  min-height: auto;
}

.help-icon-button ion-icon {
  font-size: 1.2rem;
}

.help-icon-button[size='small'] ion-icon {
  font-size: 1rem;
}

.help-icon-button[size='large'] ion-icon {
  font-size: 1.5rem;
}
</style>
