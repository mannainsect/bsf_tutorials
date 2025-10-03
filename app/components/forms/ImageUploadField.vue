<template>
  <div class="image-upload-field">

    <!-- File Input -->
    <ion-item lines="none">
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        :disabled="disabled || images.length >= maxFiles"
        style="display: none"
        @change="handleFileSelect"
      />
      <ion-button
        fill="outline"
        size="default"
        :disabled="disabled || images.length >= maxFiles"
        @click="triggerFileInput"
      >
        <ion-icon slot="start" :icon="camera" />
        {{ $t('marketplace.selectImages') }}
      </ion-button>
      <ion-note slot="end">
        {{ images.length }}/{{ maxFiles }} {{ $t('common.selected') }}
      </ion-note>
    </ion-item>

    <!-- Image Previews -->
    <div v-if="images.length > 0" class="image-preview-grid">
      <div
        v-for="(image, index) in images"
        :key="index"
        class="image-preview-item"
      >
        <img
          :src="image.preview"
          :alt="t('marketplace.imageAlt', { index: index + 1 })"
          class="preview-image"
        />
        <div class="image-info">
          <ion-text class="image-name">{{ image.name }}</ion-text>
          <ion-text color="medium" class="image-size">
            {{ formatFileSize(image.size) }}
          </ion-text>
        </div>
        <ion-button
          fill="clear"
          size="small"
          color="danger"
          :disabled="disabled"
          class="remove-button"
          @click="removeImage(index)"
        >
          <ion-icon slot="icon-only" :icon="close" />
        </ion-button>
      </div>
    </div>

    <!-- Validation Messages -->
    <ion-note v-if="error" color="danger" class="error-message">
      {{ error }}
    </ion-note>

    <!-- Help Text -->
    <ion-note v-if="helpText" color="medium" class="help-text">
      {{ helpText }}
    </ion-note>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue'
import { camera, close } from 'ionicons/icons'

const { t } = useI18n()

interface ImageFile {
  file: File
  name: string
  size: number
  preview: string
}

interface Props {
  modelValue?: File[]
  label?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  maxFiles?: number
  maxSizePerFile?: number
  maxTotalSize?: number
  error?: string
}

interface Emits {
  'update:modelValue': [files: File[]]
  'error': [message: string]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  required: false,
  disabled: false,
  maxFiles: 5,
  maxSizePerFile: 10 * 1024 * 1024, // 10MB
  maxTotalSize: 50 * 1024 * 1024, // 50MB
  helpText: '',
  error: ''
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()
const images = ref<ImageFile[]>([])
const resolvedLabel = computed(() => props.label || t('forms.imagesLabel'))

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Watch for external changes to modelValue
watch(() => props.modelValue, (newFiles) => {
  if (!newFiles || newFiles.length === 0) {
    clearAllImages()
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])

  if (!files.length) return

  // Validate file count
  const remainingSlots = props.maxFiles - images.value.length
  if (files.length > remainingSlots) {
    emit('error', t('marketplace.images_remaining_slots', { count: remainingSlots }))
    return
  }

  // Calculate total size
  let totalSize = images.value.reduce((sum, img) => sum + img.size, 0)

  const validFiles: ImageFile[] = []
  const errors: string[] = []

  for (const file of files) {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(t('marketplace.images_invalid_type', { name: file.name }))
      continue
    }

    // Validate individual file size
    if (file.size > props.maxSizePerFile) {
      errors.push(
        t('marketplace.images_too_large', {
          name: file.name,
          max: formatFileSize(props.maxSizePerFile)
        })
      )
      continue
    }

    // Validate total size
    if (totalSize + file.size > props.maxTotalSize) {
      errors.push(
        t('marketplace.images_total_exceeded', { name: file.name })
      )
      continue
    }

    totalSize += file.size

    // Create preview URL
    const preview = URL.createObjectURL(file)

    validFiles.push({
      file,
      name: file.name,
      size: file.size,
      preview
    })
  }

  if (errors.length > 0) {
    emit('error', errors.join(', '))
  }

  if (validFiles.length > 0) {
    images.value = [...images.value, ...validFiles]
    updateModelValue()
  }

  // Reset input
  input.value = ''
}

const removeImage = (index: number) => {
  const image = images.value[index]
  if (image) {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(image.preview)
    images.value.splice(index, 1)
    updateModelValue()
  }
}

const clearAllImages = () => {
  // Revoke all object URLs
  images.value.forEach(img => URL.revokeObjectURL(img.preview))
  images.value = []
}

const updateModelValue = () => {
  const files = images.value.map(img => img.file)
  emit('update:modelValue', files)
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Cleanup on unmount
onUnmounted(() => {
  clearAllImages()
})
</script>

<style scoped>
.image-upload-field {
  width: 100%;
}

.image-preview-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  padding: 0 16px;
}

.image-preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: var(--ion-color-light);
  border-radius: 8px;
  position: relative;
}

.preview-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid var(--ion-color-medium);
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.image-name {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-size {
  font-size: 0.75rem;
}

.remove-button {
  --padding-start: 4px;
  --padding-end: 4px;
  margin: 0;
}

.error-message,
.help-text {
  display: block;
  padding: 8px 16px 0;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  .image-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}
</style>
