<template>
  <div class="amount-input-component">
    <div class="input-group">
      <label v-if="label" class="input-label">{{ label }}</label>
      <div class="amount-input-wrapper">
        <input
          ref="inputRef"
          v-model="displayValue"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @keydown="handleKeydown"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          class="amount-input"
          :class="{
            error: hasError,
            disabled: disabled,
            readonly: readonly,
          }"
        />
        <span v-if="showCurrency" class="currency-symbol">원</span>
      </div>
      <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
      <div v-if="showHelperText" class="helper-text">{{ helperText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// Props 정의
interface Props {
  modelValue?: number | string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  min?: number
  max?: number
  showCurrency?: boolean
  helperText?: string
  precision?: number
  allowNegative?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  label: '',
  placeholder: '금액을 입력하세요',
  disabled: false,
  readonly: false,
  required: false,
  min: undefined,
  max: undefined,
  showCurrency: true,
  helperText: '',
  precision: 0,
  allowNegative: false,
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [value: number]
  change: [value: number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 반응형 상태
const inputRef = ref<HTMLInputElement>()
const displayValue = ref('')
const isFocused = ref(false)
const errorMessage = ref('')

// 계산된 속성
const hasError = computed(() => errorMessage.value.length > 0)
const showHelperText = computed(() => props.helperText && !hasError.value)

// 숫자 포맷팅 함수
const formatNumber = (value: number): string => {
  if (isNaN(value)) return ''

  // 음수 처리
  const isNegative = value < 0
  const absValue = Math.abs(value)

  // 정밀도 처리
  const roundedValue =
    props.precision > 0
      ? Math.round(absValue * Math.pow(10, props.precision)) / Math.pow(10, props.precision)
      : Math.round(absValue)

  // 천 단위 콤마 추가
  const formatted = roundedValue.toLocaleString('ko-KR', {
    minimumFractionDigits: props.precision,
    maximumFractionDigits: props.precision,
  })

  return isNegative ? `-${formatted}` : formatted
}

// 숫자 파싱 함수
const parseNumber = (value: string): number => {
  if (!value) return 0

  // 콤마와 공백 제거
  const cleanValue = value.replace(/[,\s]/g, '')

  // 음수 부호 처리
  const isNegative = cleanValue.startsWith('-')
  const absValue = isNegative ? cleanValue.slice(1) : cleanValue

  // 숫자만 추출
  const numericValue = absValue.replace(/[^0-9.]/g, '')

  if (!numericValue) return 0

  const parsed = parseFloat(numericValue)
  return isNaN(parsed) ? 0 : isNegative ? -parsed : parsed
}

// 유효성 검사
const validate = (value: number): boolean => {
  errorMessage.value = ''

  // 필수 입력 검사
  if (props.required && value === 0) {
    errorMessage.value = '금액을 입력해주세요.'
    return false
  }

  // 음수 허용 검사
  if (!props.allowNegative && value < 0) {
    errorMessage.value = '음수는 입력할 수 없습니다.'
    return false
  }

  // 최소값 검사
  if (props.min !== undefined && value < props.min) {
    errorMessage.value = `최소 ${formatNumber(props.min)}원 이상 입력해주세요.`
    return false
  }

  // 최대값 검사
  if (props.max !== undefined && value > props.max) {
    errorMessage.value = `최대 ${formatNumber(props.max)}원 이하로 입력해주세요.`
    return false
  }

  return true
}

// 이벤트 핸들러들
const handleInput = () => {
  const numericValue = parseNumber(displayValue.value)

  if (validate(numericValue)) {
    emit('update:modelValue', numericValue)
    emit('change', numericValue)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)

  // 포커스 시 전체 선택
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.select()
    }
  })
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false

  // 블러 시 포맷팅 적용
  const numericValue = parseNumber(displayValue.value)
  displayValue.value = formatNumber(numericValue)

  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  // 숫자, 콤마, 마이너스, 백스페이스, 삭제, 화살표 키만 허용
  const allowedKeys = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    ',',
    '-',
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Tab',
    'Enter',
    'Escape',
  ]

  if (!allowedKeys.includes(event.key)) {
    event.preventDefault()
    return
  }

  // 음수 허용하지 않는 경우 마이너스 키 차단
  if (!props.allowNegative && event.key === '-') {
    event.preventDefault()
    return
  }

  // 콤마는 자동으로 추가되므로 수동 입력 차단
  if (event.key === ',') {
    event.preventDefault()
    return
  }
}

// 감시자
watch(
  () => props.modelValue,
  (newValue) => {
    const numericValue = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue
    displayValue.value = formatNumber(numericValue)
  },
  { immediate: true },
)

// 외부에서 접근 가능한 메서드들
defineExpose({
  validate: () => validate(parseNumber(displayValue.value)),
  getValue: () => parseNumber(displayValue.value),
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
})
</script>

<style scoped>
.amount-input-component {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.amount-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  flex: 1;
  padding: var(--spacing-sm);
  padding-right: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  font-family: 'Courier New', monospace;
  text-align: right;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.amount-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.amount-input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.amount-input.disabled {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.amount-input.readonly {
  background-color: var(--color-gray-50);
  cursor: default;
}

.currency-symbol {
  position: absolute;
  right: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.error-message {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.helper-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .amount-input {
    font-size: var(--font-size-base);
    padding: var(--spacing-md);
  }

  .currency-symbol {
    font-size: var(--font-size-base);
  }
}
</style>
