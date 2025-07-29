<template>
  <div class="date-input-component">
    <div class="input-group">
      <label v-if="label" class="input-label">{{ label }}</label>
      <div class="date-input-wrapper">
        <input
          ref="inputRef"
          v-model="displayValue"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @click="toggleCalendar"
          type="text"
          :placeholder="placeholder"
          :disabled="disabled"
          :readonly="readonly"
          class="date-input"
          :class="{
            error: hasError,
            disabled: disabled,
            readonly: readonly,
            focused: isFocused,
          }"
        />
        <button
          type="button"
          @click="toggleCalendar"
          :disabled="disabled"
          class="calendar-button"
          :class="{ disabled: disabled }"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>

      <!-- 달력 팝업 -->
      <div v-if="showCalendar" class="calendar-popup" :class="{ above: showAbove }">
        <div class="calendar-header">
          <button @click="previousMonth" class="nav-button">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
          <span class="current-month">{{ currentMonthYear }}</span>
          <button @click="nextMonth" class="nav-button">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>

        <div class="calendar-weekdays">
          <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
        </div>

        <div class="calendar-days">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            @click="selectDate(day)"
            :disabled="!day.isCurrentMonth || day.isDisabled"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              disabled: day.isDisabled,
              selected: day.isSelected,
              today: day.isToday,
            }"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="calendar-footer">
          <button @click="selectToday" class="today-button">오늘</button>
          <button @click="clearDate" class="clear-button">지우기</button>
        </div>
      </div>

      <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
      <div v-if="showHelperText" class="helper-text">{{ helperText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

// Props 정의
interface Props {
  modelValue?: Date | string | null
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  format?: string
  helperText?: string
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  label: '',
  placeholder: '날짜를 선택하세요',
  disabled: false,
  readonly: false,
  required: false,
  minDate: undefined,
  maxDate: undefined,
  format: 'YYYY-MM-DD',
  helperText: '',
  clearable: true,
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [value: Date | null]
  change: [value: Date | null]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 반응형 상태
const inputRef = ref<HTMLInputElement>()
const displayValue = ref('')
const isFocused = ref(false)
const showCalendar = ref(false)
const showAbove = ref(false)
const currentDate = ref(new Date())
const errorMessage = ref('')

// 계산된 속성
const hasError = computed(() => errorMessage.value.length > 0)
const showHelperText = computed(() => props.helperText && !hasError.value)

// 요일 배열
const weekdays = ['일', '월', '화', '수', '목', '금', '토']

// 현재 월/년 표시
const currentMonthYear = computed(() => {
  return `${currentDate.value.getFullYear()}년 ${currentDate.value.getMonth() + 1}월`
})

// 달력 날짜 생성
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const days = []
  const today = new Date()
  const selectedDate = props.modelValue ? new Date(props.modelValue) : null
  const minDate = props.minDate ? new Date(props.minDate) : null
  const maxDate = props.maxDate ? new Date(props.maxDate) : null

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)

    const isCurrentMonth = date.getMonth() === month
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
    const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate)

    days.push({
      key: date.toISOString(),
      date,
      day: date.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled,
    })
  }

  return days
})

// 날짜 포맷팅
const formatDate = (date: Date | null): string => {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return props.format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day)
}

// 날짜 파싱
const parseDate = (value: string): Date | null => {
  if (!value) return null

  // YYYY-MM-DD 형식 파싱
  const match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (match) {
    const [, year, month, day] = match
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  // YYYY/MM/DD 형식 파싱
  const match2 = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (match2) {
    const [, year, month, day] = match2
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    if (!isNaN(date.getTime())) {
      return date
    }
  }

  return null
}

// 유효성 검사
const validate = (date: Date | null): boolean => {
  errorMessage.value = ''

  // 필수 입력 검사
  if (props.required && !date) {
    errorMessage.value = '날짜를 선택해주세요.'
    return false
  }

  if (date) {
    // 최소 날짜 검사
    if (props.minDate) {
      const minDate = new Date(props.minDate)
      if (date < minDate) {
        errorMessage.value = `최소 ${formatDate(minDate)} 이후 날짜를 선택해주세요.`
        return false
      }
    }

    // 최대 날짜 검사
    if (props.maxDate) {
      const maxDate = new Date(props.maxDate)
      if (date > maxDate) {
        errorMessage.value = `최대 ${formatDate(maxDate)} 이전 날짜를 선택해주세요.`
        return false
      }
    }
  }

  return true
}

// 이벤트 핸들러들
const handleInput = () => {
  const date = parseDate(displayValue.value)

  if (validate(date)) {
    emit('update:modelValue', date)
    emit('change', date)
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)

  // 달력 닫기 지연
  setTimeout(() => {
    if (!showCalendar.value) return
    showCalendar.value = false
  }, 200)
}

const toggleCalendar = () => {
  if (props.disabled || props.readonly) return

  showCalendar.value = !showCalendar.value

  if (showCalendar.value) {
    // 달력 위치 계산
    nextTick(() => {
      if (inputRef.value) {
        const rect = inputRef.value.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        showAbove.value = spaceBelow < 300 && spaceAbove > 300
      }
    })
  }
}

const selectDate = (day: any) => {
  if (day.isDisabled || !day.isCurrentMonth) return

  const date = day.date
  if (validate(date)) {
    emit('update:modelValue', date)
    emit('change', date)
    displayValue.value = formatDate(date)
    showCalendar.value = false
  }
}

const selectToday = () => {
  const today = new Date()
  if (validate(today)) {
    emit('update:modelValue', today)
    emit('change', today)
    displayValue.value = formatDate(today)
    showCalendar.value = false
  }
}

const clearDate = () => {
  if (!props.clearable) return

  emit('update:modelValue', null)
  emit('change', null)
  displayValue.value = ''
  showCalendar.value = false
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

// 외부 클릭 감지
const handleClickOutside = (event: Event) => {
  if (inputRef.value && !inputRef.value.contains(event.target as Node)) {
    showCalendar.value = false
  }
}

// 감시자
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const date = typeof newValue === 'string' ? new Date(newValue) : newValue
      displayValue.value = formatDate(date)
    } else {
      displayValue.value = ''
    }
  },
  { immediate: true },
)

// 생명주기
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 외부에서 접근 가능한 메서드들
defineExpose({
  validate: () => validate(parseDate(displayValue.value)),
  getValue: () => parseDate(displayValue.value),
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  openCalendar: () => toggleCalendar(),
  closeCalendar: () => (showCalendar.value = false),
})
</script>

<style scoped>
.date-input-component {
  position: relative;
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

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-input {
  flex: 1;
  padding: var(--spacing-sm);
  padding-right: var(--spacing-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.date-input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.date-input.disabled {
  background-color: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.date-input.readonly {
  background-color: var(--color-gray-50);
  cursor: default;
}

.calendar-button {
  position: absolute;
  right: var(--spacing-xs);
  padding: var(--spacing-xs);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.calendar-button:hover:not(.disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.calendar-button.disabled {
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.calendar-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  margin-top: var(--spacing-xs);
}

.calendar-popup.above {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: var(--spacing-xs);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.nav-button {
  padding: var(--spacing-xs);
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.nav-button:hover {
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.current-month {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.weekday {
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs);
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: var(--spacing-xs);
}

.calendar-day {
  aspect-ratio: 1;
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.calendar-day:hover:not(.disabled) {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

.calendar-day.other-month {
  color: var(--color-gray-400);
}

.calendar-day.disabled {
  color: var(--color-gray-300);
  cursor: not-allowed;
}

.calendar-day.selected {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.calendar-day.today {
  font-weight: var(--font-weight-bold);
  border: 2px solid var(--color-primary);
}

.calendar-day.today.selected {
  border-color: var(--color-white);
}

.calendar-footer {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border-top: 1px solid var(--color-border);
}

.today-button,
.clear-button {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text-primary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.today-button:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
}

.clear-button:hover {
  background-color: var(--color-danger-light);
  border-color: var(--color-danger);
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
  .calendar-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 320px;
    margin: 0;
  }

  .calendar-popup.above {
    top: 50%;
    bottom: auto;
    margin: 0;
  }
}
</style>
