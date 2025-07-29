<template>
  <button
    :class="buttonClass"
    :style="buttonStyle"
    @click="$emit('click', $event)"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { createButtonStyle } from '@/styles/styled-system'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isHovered = ref(false)

const buttonStyle = computed(() => {
  const baseStyle = createButtonStyle(props.variant, props.size).value

  if (props.disabled) {
    return {
      ...baseStyle,
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    }
  }

  if (isHovered.value) {
    return {
      ...baseStyle,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }
  }

  return baseStyle
})

const buttonClass = computed(() => [
  'styled-button',
  `styled-button--${props.variant}`,
  `styled-button--${props.size}`,
  { 'styled-button--disabled': props.disabled },
])

const handleMouseEnter = () => {
  if (!props.disabled) {
    isHovered.value = true
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
}
</script>

<style scoped>
.styled-button {
  transition: all 0.2s ease-in-out;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.styled-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

.styled-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
