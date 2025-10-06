<template>
  <section class="section" :class="sectionClass">
    <slot />
  </section>
</template>

<script setup lang="ts">
interface Props {
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  spacing: 'lg'
})

const sectionClass = computed(() => `section--spacing-${props.spacing}`)
</script>

<style scoped>
.section {
  width: 100%;
}

.section--spacing-sm {
  margin-bottom: var(--spacing-sm);
}

.section--spacing-md {
  margin-bottom: var(--spacing-md);
}

.section--spacing-lg {
  margin-bottom: var(--spacing-lg);
}

.section--spacing-xl {
  margin-bottom: var(--spacing-xl);
}

.section:last-child {
  margin-bottom: 0;
}
</style>
