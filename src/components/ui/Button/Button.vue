<template>
  <button
    :id="buttonId"
    :class="buttonClasses"
    :style="buttonStyles"
    :type="type"
    :disabled="isDisabled"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedBy"
    :aria-pressed="ariaPressed"
    :aria-expanded="ariaExpanded"
    :aria-busy="loading"
    :aria-disabled="isDisabled"
    @click="handleClick"
    @keydown="handleKeydown"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 로딩 스피너 -->
    <span v-if="loading" class="button-loading" aria-hidden="true">
      <slot name="loading">
        <svg class="loading-spinner" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-dasharray="31.416"
            stroke-dashoffset="31.416"
          >
            <animate
              attributeName="stroke-dasharray"
              dur="2s"
              values="0 31.416;15.708 15.708;0 31.416"
              repeatCount="indefinite"
            />
            <animate
              attributeName="stroke-dashoffset"
              dur="2s"
              values="0;-15.708;-31.416"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </slot>
    </span>

    <!-- 아이콘 (왼쪽) -->
    <span
      v-if="icon && iconPosition === 'left' && !loading"
      class="button-icon button-icon--left"
      aria-hidden="true"
    >
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </span>

    <!-- 버튼 텍스트 -->
    <span v-if="!iconOnly" class="button-text">
      <slot />
    </span>

    <!-- 아이콘 (오른쪽) -->
    <span
      v-if="icon && iconPosition === 'right' && !loading"
      class="button-icon button-icon--right"
      aria-hidden="true"
    >
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { generateId } from '@/utils/accessibility'
import { createButtonStyle } from '@/styles/styled-system'
import { responsiveComponents, touchFriendly } from '@/styles/styled-system/responsive'
import { focusStyles, keyboardNavigation } from '@/styles/styled-system/accessibility'
import type { ButtonProps, ButtonEmits } from './Button.types'

// Props 정의
const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'xs',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  iconOnly: false,
  type: 'button',
  fullWidth: false,
  rounded: false,
})

// Emits 정의
const emit = defineEmits<ButtonEmits>()

// 접근성 ID 생성
const buttonId = ref(generateId('button'))

// 상태 관리
const isFocused = ref(false)
const isPressed = ref(false)

// 계산된 속성들
const isDisabled = computed(() => props.disabled || props.loading)

const buttonStyles = computed(() => {
  const baseStyle = createButtonStyle(props.variant as any, props.size as any).value
  const responsiveStyle = responsiveComponents.button.value
  const touchStyle = touchFriendly.touchTarget.value
  const focusStyle = isFocused.value ? focusStyles.default.value : {}

  // secondary일 때 backgroundColor 제거
  if (props.variant === 'secondary' && 'backgroundColor' in baseStyle) {
    delete (baseStyle as any).backgroundColor
  }

  // 👇 여기에서 반드시 크기 관련 속성도 지워주세요!
  delete (baseStyle as any).minHeight
  delete (baseStyle as any).minWidth
  delete (baseStyle as any).fontSize
  delete (baseStyle as any).padding
  delete (baseStyle as any).width
  delete (responsiveStyle as any).minHeight
  delete (responsiveStyle as any).minWidth
  delete (responsiveStyle as any).fontSize
  delete (responsiveStyle as any).padding
  delete (responsiveStyle as any).width

  return {
    ...baseStyle,
    ...responsiveStyle,
    ...touchStyle,
    ...focusStyle,
    width: props.fullWidth ? '100%' : undefined,
    borderRadius: props.rounded ? '50px' : undefined,
  }
})

const buttonClasses = computed(() => [
  'ui-button',
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  {
    'ui-button--disabled': isDisabled.value,
    'ui-button--loading': props.loading,
    'ui-button--icon-only': props.iconOnly,
    'ui-button--full-width': props.fullWidth,
    'ui-button--rounded': props.rounded,
    'ui-button--focused': isFocused.value,
    'ui-button--pressed': isPressed.value,
  },
])

// 이벤트 핸들러
const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }

  isPressed.value = true
  emit('click', event)

  // 버튼 해제 효과
  setTimeout(() => {
    isPressed.value = false
  }, 150)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)

  // 스페이스바와 엔터키로 버튼 활성화
  if ((event.key === ' ' || event.key === 'Enter') && !isDisabled.value) {
    event.preventDefault()
    handleClick(event as any)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  isPressed.value = false
  emit('blur', event)
}
</script>

<style scoped>
.ui-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 버튼 크기 */
.ui-button--xs {
  padding: 4px 12px;
  font-size: 11px;
  min-height: 32px;
}

.ui-button--sm {
  padding: 6px 16px;
  font-size: 12px;
  min-height: 36px;
}

.ui-button--md {
  padding: 10px 20px;
  font-size: 14px;
  min-height: 44px;
}

.ui-button--lg {
  padding: 14px 28px;
  font-size: 16px;
  min-height: 48px;
}

.ui-button--xl {
  padding: 18px 36px;
  font-size: 18px;
  min-height: 56px;
}

/* 버튼 변형 */
.ui-button--primary {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
}

.ui-button--primary:hover:not(.ui-button--disabled) {
  background-color: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.ui-button--secondary {
  background-color: #4da3ff; /* 밝은 파란색 */
  color: var(--color-text-inverse);
}

.ui-button--secondary:hover:not(.ui-button--disabled) {
  background-color: #2684ff !important;
}

.ui-button--outline {
  background-color: transparent;
  color: var(--color-primary-500);
  border: 1px solid var(--color-primary-500);
}

.ui-button--outline:hover:not(.ui-button--disabled) {
  background-color: var(--color-primary-50);
  border-color: var(--color-primary-600);
}

.ui-button--ghost {
  background-color: #dddedb; /* 연한 회색 */
  color: var(--color-text-primary);
}

.ui-button--ghost:hover:not(.ui-button--disabled) {
  background-color: #e5e7ef;
}

.ui-button--danger {
  background-color: var(--color-semantic-error);
  color: var(--color-text-inverse);
}

.ui-button--danger:hover:not(.ui-button--disabled) {
  background-color: #c82333;
}

/* 상태 스타일 */
.ui-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.ui-button--loading {
  cursor: wait;
}

.ui-button--icon-only {
  padding: 8px;
  min-width: 44px;
}

.ui-button--full-width {
  width: 100%;
}

.ui-button--rounded {
  border-radius: 50px;
}

/* 포커스 스타일 */
.ui-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

/* 로딩 스피너 */
.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 아이콘 */
.button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
}

.button-icon--left {
  order: -1;
}

.button-icon--right {
  order: 1;
}

/* 텍스트 */
.button-text {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .ui-button--md {
    padding: 10px 16px;
    font-size: 13px;
    min-height: 40px;
  }

  .ui-button--lg {
    padding: 14px 20px;
    font-size: 15px;
    min-height: 44px;
  }
}

/* 모션 감소 설정 지원 */
@media (prefers-reduced-motion: reduce) {
  .ui-button {
    transition: none;
  }

  .loading-spinner {
    animation: none;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .ui-button {
    border-width: 2px;
  }
}

:deep(.ui-button.ui-button--secondary) {
  background-color: #4da3ff !important;
  color: var(--color-text-inverse) !important;
}

:deep(.ui-button.ui-button--ghost) {
  background-color: #dddedb !important;
  color: var(--color-text-primary) !important;
}

.ui-button--ghost:hover:not(.ui-button--disabled) {
  background-color: #e5e7ef !important;
}
</style>
