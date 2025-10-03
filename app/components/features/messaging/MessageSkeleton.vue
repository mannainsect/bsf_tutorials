<template>
  <ion-list>
    <ion-item
      v-for="index in skeletonCount"
      :key="`skeleton-${index}`"
      lines="inset"
      class="skeleton-item"
    >
      <ion-thumbnail slot="start" class="skeleton-avatar">
        <ion-skeleton-text
          :animated="true"
          class="skeleton-avatar-inner"
        />
      </ion-thumbnail>

      <ion-label>
        <h2>
          <ion-skeleton-text
            :animated="true"
            style="width: 60%"
          />
        </h2>
        <p>
          <ion-skeleton-text
            :animated="true"
            style="width: 80%"
          />
        </p>
        <p>
          <ion-skeleton-text
            :animated="true"
            style="width: 90%"
          />
        </p>
      </ion-label>

      <ion-note slot="end">
        <ion-skeleton-text
          :animated="true"
          style="width: 50px"
        />
      </ion-note>
    </ion-item>
  </ion-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 3
})

const skeletonCount = computed(() => {
  return Math.min(Math.max(1, props.count), 10)
})
</script>

<style scoped>
.skeleton-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  min-height: 80px;
}

.skeleton-avatar {
  --size: 48px;
  margin-inline-end: 16px;
}

.skeleton-avatar-inner {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

ion-label {
  margin: 8px 0;
}

ion-label h2 {
  margin-bottom: 4px;
}

ion-label p {
  margin: 4px 0;
}

ion-note {
  align-self: flex-start;
  margin-top: 8px;
}
</style>