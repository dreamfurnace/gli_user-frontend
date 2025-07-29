<template>
  <div class="ui-input-wrapper" :class="wrapperClasses">
    <!-- 라벨 -->
    <label v-if="label" :for="inputId" class="ui-input-label">
      {{ label }}
      <span v-if="required" class="ui-input-required" aria-hidden="true">*</span>
    </label>

    <!-- 입력 필드 컨테이너 -->
    <div class="ui-input-container" :class="containerClasses">
      <!-- 접두 아이콘 -->
      <span
        v-if="icon && iconPosition === 'left'"
        class="ui-input-icon ui-input-icon--left"
        aria-hidden="true"
      >
        <slot name="prefix">
          <i :class="icon"></i>
        </slot>
      </span>

      <!-- 입력 필드 -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :minlength="minLength"
        :maxlength="maxLength"
        :pattern="pattern"
        :name="name"
        :aria-label="ariaLabel || label"
        :aria-describedby="describedBy"
        :aria-invalid="isInvalid"
        :aria-required="required"
        :aria-busy="loading"
        class="ui-input"
        :class="inputClasses"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      />

      <!-- 접미 아이콘 -->
      <span
        v-if="icon && iconPosition === 'right'"
        class="ui-input-icon ui-input-icon--right"
        aria-hidden="true"
      >
        <slot name="suffix">
          <i :class="icon"></i>
        </slot>
      </span>

      <!-- 로딩 스피너 -->
      <span v-if="loading" class="ui-input-loading" aria-hidden="true">
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
      </span>
    </div>

    <!-- 도움말 텍스트 -->
    <div v-if="helpText" :id="helpId" class="ui-input-help">
      <slot name="help">
        {{ helpText }}
      </slot>
    </div>

    <!-- 에러 메시지 -->
    <div v-if="errorMessage || invalid" :id="errorId" class="ui-input-error" role="alert">
      <slot name="error">
        {{ errorMessage }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { generateId } from '@/utils/accessibility'
import { createInputStyle } from '@/styles/styled-system'
import { responsiveComponents } from '@/styles/styled-system/responsive'
import { focusStyles } from '@/styles/styled-system/accessibility'
import type { InputProps, InputEmits } from './Input.types'

// Props 정의
const props = withDefaults(
  defineProps<
    InputProps & {
      modelValue?: string | number
      label?: string
      helpText?: string
      errorMessage?: string
    }
  >(),
  {
    type: 'text',
    size: 'md',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    loading: false,
    iconPosition: 'left',
    fullWidth: false,
    rounded: false,
  },
)

// Emits 정의
const emit = defineEmits<InputEmits>()

// 접근성 ID 생성
const inputId = ref(props.id || generateId('input'))
const errorId = ref(generateId('input-error'))
const helpId = ref(generateId('input-help'))

// 상태 관리
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement>()

// 계산된 속성들
const isInvalid = computed(() => props.invalid || !!props.errorMessage)

const describedBy = computed(() => {
  const ids = []
  if (props.ariaDescribedBy) ids.push(props.ariaDescribedBy)
  if (props.helpText) ids.push(helpId.value)
  if (isInvalid.value) ids.push(errorId.value)
  return ids.length > 0 ? ids.join(' ') : undefined
})

const inputClasses = computed(() => [
  'ui-input',
  `ui-input--${props.size}`,
  {
    'ui-input--disabled': props.disabled,
    'ui-input--readonly': props.readonly,
    'ui-input--invalid': isInvalid.value,
    'ui-input--loading': props.loading,
    'ui-input--focused': isFocused.value,
    'ui-input--full-width': props.fullWidth,
    'ui-input--rounded': props.rounded,
    'ui-input--with-icon': !!props.icon,
    [`ui-input--icon-${props.iconPosition}`]: !!props.icon,
  },
])

const containerClasses = computed(() => [
  'ui-input-container',
  {
    'ui-input-container--invalid': isInvalid.value,
    'ui-input-container--focused': isFocused.value,
    'ui-input-container--disabled': props.disabled,
  },
])

const wrapperClasses = computed(() => [
  'ui-input-wrapper',
  {
    'ui-input-wrapper--full-width': props.fullWidth,
  },
])

// 이벤트 핸들러
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('input', event)
  emit('update:value', target.value)
}

const handleChange = (event: Event) => {
  emit('change', event)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

// 포커스 메서드
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

// 메서드 노출
defineExpose({
  focus,
  blur,
  inputRef,
})
</script>

<style scoped>
.ui-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ui-input-wrapper--full-width {
  width: 100%;
}

.ui-input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  cursor: pointer;
}

.ui-input-required {
  color: var(--color-semantic-error);
  margin-left: 2px;
}

.ui-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  transition: all 0.2s ease-in-out;
}

.ui-input-container--focused {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.ui-input-container--invalid {
  border-color: var(--color-semantic-error);
  box-shadow: 0 0 0 3px var(--color-semantic-error) 20;
}

.ui-input-container--disabled {
  background-color: var(--color-background-secondary);
  opacity: 0.6;
  cursor: not-allowed;
}

.ui-input {
  flex: 1;
  width: 100%;
  padding: 12px 16px;
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  border-radius: inherit;
}

.ui-input:disabled {
  cursor: not-allowed;
}

.ui-input:read-only {
  cursor: default;
}

.ui-input::placeholder {
  color: var(--color-text-tertiary);
}

/* 입력 필드 크기 */
.ui-input--sm {
  padding: 8px 12px;
  font-size: var(--font-size-sm);
}

.ui-input--md {
  padding: 12px 16px;
  font-size: var(--font-size-base);
}

.ui-input--lg {
  padding: 16px 20px;
  font-size: var(--font-size-lg);
}

/* 아이콘 스타일 */
.ui-input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.ui-input--with-icon.ui-input--icon-left .ui-input {
  padding-left: 40px;
}

.ui-input--with-icon.ui-input--icon-right .ui-input {
  padding-right: 40px;
}

.ui-input-icon--left {
  position: absolute;
  left: 12px;
}

.ui-input-icon--right {
  position: absolute;
  right: 12px;
}

/* 로딩 스피너 */
.ui-input-loading {
  position: absolute;
  right: 12px;
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

/* 도움말 텍스트 */
.ui-input-help {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-normal);
}

/* 에러 메시지 */
.ui-input-error {
  font-size: var(--font-size-sm);
  color: var(--color-semantic-error);
  line-height: var(--line-height-normal);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .ui-input--md {
    padding: 10px 14px;
    font-size: 16px; /* 모바일에서 자동 확대 방지 */
  }

  .ui-input--lg {
    padding: 14px 18px;
    font-size: 16px;
  }
}

/* 모션 감소 설정 지원 */
@media (prefers-reduced-motion: reduce) {
  .ui-input-container {
    transition: none;
  }

  .loading-spinner {
    animation: none;
  }
}

/* 고대비 모드 지원 */
@media (prefers-contrast: high) {
  .ui-input-container {
    border-width: 2px;
  }
}

/* 포커스 스타일 */
.ui-input:focus-visible {
  outline: none;
}

/* 자동완성 스타일 */
.ui-input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px var(--color-background-primary) inset;
  -webkit-text-fill-color: var(--color-text-primary);
}
</style>
