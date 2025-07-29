<template>
  <img
    :src="currentSrc"
    :alt="alt"
    :class="imageClass"
    :style="imageStyle"
    @load="onLoad"
    @error="onError"
    ref="imgRef"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { lazyLoadImage } from '@/utils/performance'

interface Props {
  src: string
  alt: string
  placeholder?: string
  class?: string
  style?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
  class: '',
  style: () => ({}),
})

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
}>()

const imgRef = ref<HTMLImageElement>()
const isLoaded = ref(false)
const hasError = ref(false)

const currentSrc = computed(() => {
  if (hasError.value) {
    return props.placeholder
  }
  return isLoaded.value ? props.src : props.placeholder
})

const imageClass = computed(() => {
  const classes = ['lazy-image']
  if (props.class) {
    classes.push(props.class)
  }
  if (isLoaded.value) {
    classes.push('loaded')
  }
  if (hasError.value) {
    classes.push('error')
  }
  return classes.join(' ')
})

const imageStyle = computed(() => ({
  ...props.style,
  opacity: isLoaded.value ? '1' : '0.7',
  transition: 'opacity 0.3s ease-in-out',
}))

const onLoad = (event: Event) => {
  isLoaded.value = true
  emit('load', event)
}

const onError = (event: Event) => {
  hasError.value = true
  emit('error', event)
}

onMounted(() => {
  if (imgRef.value) {
    lazyLoadImage(imgRef.value, props.src)
  }
})
</script>

<style scoped>
.lazy-image {
  display: block;
  max-width: 100%;
  height: auto;
}

.lazy-image.loaded {
  opacity: 1;
}

.lazy-image.error {
  opacity: 0.5;
}
</style>
