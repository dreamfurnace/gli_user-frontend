<template>
  <div class="dynamic-field-component">
    <div class="input-group">
      <label v-if="label" class="input-label">{{ label }}</label>

      <!-- 필드 목록 -->
      <div class="fields-container">
        <div
          v-for="(field, index) in fields"
          :key="field.id"
          class="field-item"
          :class="{ error: field.hasError }"
        >
          <div class="field-content">
            <!-- 필드 입력 영역 -->
            <div class="field-inputs">
              <div
                v-for="(input, inputIndex) in field.inputs"
                :key="inputIndex"
                class="input-wrapper"
              >
                <label v-if="input.label" class="input-label">{{ input.label }}</label>
                <input
                  v-if="input.type === 'text'"
                  v-model="input.value"
                  @input="handleFieldChange(index, inputIndex)"
                  @blur="validateField(index)"
                  type="text"
                  :placeholder="input.placeholder"
                  :required="input.required"
                  class="text-input"
                  :class="{ error: input.hasError }"
                />
                <textarea
                  v-else-if="input.type === 'textarea'"
                  v-model="input.value"
                  @input="handleFieldChange(index, inputIndex)"
                  @blur="validateField(index)"
                  :placeholder="input.placeholder"
                  :required="input.required"
                  :rows="input.rows || 3"
                  class="textarea-input"
                  :class="{ error: input.hasError }"
                ></textarea>
                <select
                  v-else-if="input.type === 'select'"
                  v-model="input.value"
                  @change="handleFieldChange(index, inputIndex)"
                  @blur="validateField(index)"
                  :required="input.required"
                  class="select-input"
                  :class="{ error: input.hasError }"
                >
                  <option value="">{{ input.placeholder || '선택하세요' }}</option>
                  <option v-for="option in input.options" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <div v-if="input.hasError" class="input-error">{{ input.errorMessage }}</div>
              </div>
            </div>

            <!-- 필드 액션 버튼 -->
            <div class="field-actions">
              <button
                v-if="allowRemove && fields.length > minFields"
                @click="removeField(index)"
                type="button"
                class="remove-button"
                :disabled="disabled"
                title="항목 삭제"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path
                    d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"
                  ></path>
                </svg>
              </button>

              <button
                v-if="allowMove && fields.length > 1"
                @click="moveField(index, 'up')"
                type="button"
                class="move-button"
                :disabled="disabled || index === 0"
                title="위로 이동"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="18,15 12,9 6,15"></polyline>
                </svg>
              </button>

              <button
                v-if="allowMove && fields.length > 1"
                @click="moveField(index, 'down')"
                type="button"
                class="move-button"
                :disabled="disabled || index === fields.length - 1"
                title="아래로 이동"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
            </div>
          </div>

          <!-- 필드 레벨 에러 메시지 -->
          <div v-if="field.hasError" class="field-error">{{ field.errorMessage }}</div>
        </div>
      </div>

      <!-- 필드 추가 버튼 -->
      <button
        v-if="allowAdd && fields.length < maxFields"
        @click="addField"
        type="button"
        class="add-button"
        :disabled="disabled"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        {{ addButtonText }}
      </button>

      <!-- 필드 개수 표시 -->
      <div v-if="showFieldCount" class="field-count">
        {{ fields.length }} / {{ maxFields }} 항목
      </div>

      <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
      <div v-if="showHelperText" class="helper-text">{{ helperText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props 정의
interface FieldInput {
  type: 'text' | 'textarea' | 'select'
  label?: string
  placeholder?: string
  required?: boolean
  value: string
  hasError?: boolean
  errorMessage?: string
  options?: Array<{ value: string; label: string }>
  rows?: number
  validation?: (value: string) => string | null
}

interface Field {
  id: string
  inputs: FieldInput[]
  hasError: boolean
  errorMessage: string
}

interface Props {
  modelValue?: Field[]
  label?: string
  disabled?: boolean
  required?: boolean
  helperText?: string
  template?: FieldInput[]
  minFields?: number
  maxFields?: number
  allowAdd?: boolean
  allowRemove?: boolean
  allowMove?: boolean
  showFieldCount?: boolean
  addButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  disabled: false,
  required: false,
  helperText: '',
  template: () => [],
  minFields: 1,
  maxFields: 10,
  allowAdd: true,
  allowRemove: true,
  allowMove: true,
  showFieldCount: false,
  addButtonText: '항목 추가',
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [fields: Field[]]
  change: [fields: Field[]]
  add: [field: Field, index: number]
  remove: [field: Field, index: number]
  move: [field: Field, fromIndex: number, toIndex: number]
}>()

// 반응형 상태
const fields = ref<Field[]>([])
const errorMessage = ref('')

// 계산된 속성
const hasError = computed(() => errorMessage.value.length > 0)
const showHelperText = computed(() => props.helperText && !hasError.value)

// 새 필드 생성
const createField = (): Field => {
  const inputs = props.template.map((input) => ({
    ...input,
    value: '',
    hasError: false,
    errorMessage: '',
  }))

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    inputs,
    hasError: false,
    errorMessage: '',
  }
}

// 필드 추가
const addField = () => {
  if (fields.value.length >= props.maxFields) return

  const newField = createField()
  fields.value.push(newField)

  emit('add', newField, fields.value.length - 1)
  emitChange()
}

// 필드 제거
const removeField = (index: number) => {
  if (fields.value.length <= props.minFields) return

  const removedField = fields.value[index]
  fields.value.splice(index, 1)

  emit('remove', removedField, index)
  emitChange()
}

// 필드 이동
const moveField = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1

  if (newIndex < 0 || newIndex >= fields.value.length) return

  const field = fields.value[index]
  fields.value.splice(index, 1)
  fields.value.splice(newIndex, 0, field)

  emit('move', field, index, newIndex)
  emitChange()
}

// 필드 변경 처리
const handleFieldChange = (fieldIndex: number, inputIndex: number) => {
  const field = fields.value[fieldIndex]
  const input = field.inputs[inputIndex]

  // 개별 입력 유효성 검사
  if (input.validation) {
    const error = input.validation(input.value)
    input.hasError = !!error
    input.errorMessage = error || ''
  }

  emitChange()
}

// 필드 유효성 검사
const validateField = (index: number) => {
  const field = fields.value[index]
  let hasError = false
  let errorMessage = ''

  // 각 입력 필드 검사
  field.inputs.forEach((input) => {
    if (input.required && !input.value.trim()) {
      input.hasError = true
      input.errorMessage = '필수 입력 항목입니다.'
      hasError = true
    } else if (input.validation) {
      const error = input.validation(input.value)
      input.hasError = !!error
      input.errorMessage = error || ''
      if (error) hasError = true
    } else {
      input.hasError = false
      input.errorMessage = ''
    }
  })

  field.hasError = hasError
  field.errorMessage = errorMessage

  return !hasError
}

// 전체 유효성 검사
const validate = (): boolean => {
  errorMessage.value = ''

  // 최소 필드 개수 검사
  if (fields.value.length < props.minFields) {
    errorMessage.value = `최소 ${props.minFields}개의 항목이 필요합니다.`
    return false
  }

  // 각 필드 검사
  let isValid = true
  fields.value.forEach((field, index) => {
    if (!validateField(index)) {
      isValid = false
    }
  })

  return isValid
}

// 이벤트 발생
const emitChange = () => {
  emit('update:modelValue', [...fields.value])
  emit('change', [...fields.value])
}

// 초기화
const initializeFields = () => {
  if (props.modelValue.length > 0) {
    fields.value = props.modelValue.map((field) => ({
      ...field,
      id: field.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }))
  } else {
    // 최소 필드 개수만큼 생성
    fields.value = []
    for (let i = 0; i < props.minFields; i++) {
      fields.value.push(createField())
    }
  }
}

// 감시자
watch(
  () => props.modelValue,
  () => {
    initializeFields()
  },
  { deep: true, immediate: true },
)

// 외부에서 접근 가능한 메서드들
defineExpose({
  validate,
  addField,
  removeField: (index: number) => removeField(index),
  moveField: (index: number, direction: 'up' | 'down') => moveField(index, direction),
  getFields: () => [...fields.value],
  getField: (index: number) => fields.value[index],
  clearFields: () => {
    fields.value = []
    for (let i = 0; i < props.minFields; i++) {
      fields.value.push(createField())
    }
    emitChange()
  },
  setFieldValue: (fieldIndex: number, inputIndex: number, value: string) => {
    if (fields.value[fieldIndex] && fields.value[fieldIndex].inputs[inputIndex]) {
      fields.value[fieldIndex].inputs[inputIndex].value = value
      handleFieldChange(fieldIndex, inputIndex)
    }
  },
})
</script>

<style scoped>
.dynamic-field-component {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.field-item {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-white);
  transition: border-color 0.2s ease;
}

.field-item.error {
  border-color: var(--color-danger);
}

.field-content {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.field-inputs {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.text-input,
.textarea-input,
.select-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.text-input:focus,
.textarea-input:focus,
.select-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.text-input.error,
.textarea-input.error,
.select-input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.textarea-input {
  resize: vertical;
  min-height: 80px;
}

.select-input {
  background-color: var(--color-white);
}

.input-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}

.field-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
  justify-content: center;
}

.remove-button,
.move-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.remove-button:hover:not(:disabled) {
  border-color: var(--color-danger);
  color: var(--color-danger);
  background-color: var(--color-danger-light);
}

.move-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.remove-button:disabled,
.move-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-error {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--color-danger);
}

.add-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px dashed var(--color-border);
  background-color: var(--color-white);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
}

.add-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-count {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs);
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
  .field-content {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .field-actions {
    flex-direction: row;
    justify-content: flex-end;
  }

  .field-inputs {
    gap: var(--spacing-md);
  }
}
</style>
