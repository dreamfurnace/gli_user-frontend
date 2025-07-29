<template>
  <div class="agreement-check-component">
    <div class="input-group">
      <label v-if="label" class="input-label">{{ label }}</label>

      <!-- 전체 동의 체크박스 -->
      <div v-if="showSelectAll" class="select-all-section">
        <label class="select-all-checkbox">
          <input
            v-model="selectAll"
            @change="handleSelectAll"
            type="checkbox"
            class="checkbox-input"
            :disabled="disabled"
          />
          <span class="checkbox-custom"></span>
          <span class="checkbox-label">전체 동의</span>
        </label>
        <p class="select-all-description">아래 모든 항목에 동의합니다.</p>
      </div>

      <!-- 개별 동의 항목들 -->
      <div class="agreement-items">
        <div
          v-for="(item, index) in agreementItems"
          :key="item.id"
          class="agreement-item"
          :class="{ required: item.required, disabled: disabled }"
        >
          <label class="agreement-checkbox">
            <input
              v-model="item.checked"
              @change="handleItemChange(index)"
              type="checkbox"
              class="checkbox-input"
              :disabled="disabled || item.disabled"
              :required="item.required"
            />
            <span class="checkbox-custom"></span>
            <div class="agreement-content">
              <div class="agreement-header">
                <span class="agreement-title">
                  {{ item.title }}
                  <span v-if="item.required" class="required-mark">*</span>
                </span>
                <span v-if="item.required" class="required-text">필수</span>
              </div>
              <p v-if="item.description" class="agreement-description">{{ item.description }}</p>
            </div>
          </label>

          <!-- 상세 내용 보기 버튼 -->
          <button
            v-if="item.details"
            @click="toggleDetails(index)"
            type="button"
            class="details-button"
            :class="{ expanded: item.showDetails }"
            :disabled="disabled"
          >
            <span>{{ item.showDetails ? '상세 내용 닫기' : '상세 내용 보기' }}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :class="{ rotated: item.showDetails }"
            >
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>

          <!-- 상세 내용 -->
          <div v-if="item.details && item.showDetails" class="agreement-details">
            <div class="details-content" v-html="item.details"></div>
          </div>
        </div>
      </div>

      <!-- 커스텀 동의 항목 -->
      <div v-if="customAgreements.length > 0" class="custom-agreements">
        <div
          v-for="(agreement, index) in customAgreements"
          :key="agreement.id"
          class="custom-agreement-item"
        >
          <label class="agreement-checkbox">
            <input
              v-model="agreement.checked"
              @change="handleCustomChange(index)"
              type="checkbox"
              class="checkbox-input"
              :disabled="disabled"
            />
            <span class="checkbox-custom"></span>
            <div class="agreement-content">
              <div class="agreement-header">
                <span class="agreement-title">{{ agreement.title }}</span>
                <span v-if="agreement.required" class="required-text">필수</span>
              </div>
              <p v-if="agreement.description" class="agreement-description">
                {{ agreement.description }}
              </p>
            </div>
          </label>
        </div>
      </div>

      <div v-if="hasError" class="error-message">{{ errorMessage }}</div>
      <div v-if="showHelperText" class="helper-text">{{ helperText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props 정의
interface AgreementItem {
  id: string
  title: string
  description?: string
  details?: string
  required: boolean
  checked: boolean
  disabled?: boolean
  showDetails?: boolean
}

interface Props {
  modelValue?: AgreementItem[]
  label?: string
  disabled?: boolean
  required?: boolean
  helperText?: string
  showSelectAll?: boolean
  customAgreements?: AgreementItem[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: '',
  disabled: false,
  required: false,
  helperText: '',
  showSelectAll: true,
  customAgreements: () => [],
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [items: AgreementItem[]]
  change: [items: AgreementItem[]]
  'select-all': [checked: boolean]
  'item-change': [item: AgreementItem, index: number]
}>()

// 반응형 상태
const agreementItems = ref<AgreementItem[]>([])
const customAgreements = ref<AgreementItem[]>([])
const errorMessage = ref('')

// 계산된 속성
const hasError = computed(() => errorMessage.value.length > 0)
const showHelperText = computed(() => props.helperText && !hasError.value)

const selectAll = computed({
  get: () => {
    const allItems = [...agreementItems.value, ...customAgreements.value]
    return allItems.length > 0 && allItems.every((item) => item.checked)
  },
  set: (value: boolean) => {
    handleSelectAll(value)
  },
})

// 초기화
const initializeItems = () => {
  agreementItems.value = props.modelValue.map((item) => ({
    ...item,
    showDetails: false,
  }))

  customAgreements.value = props.customAgreements.map((item) => ({
    ...item,
    showDetails: false,
  }))
}

// 전체 선택/해제
const handleSelectAll = (checked: boolean) => {
  agreementItems.value.forEach((item) => {
    if (!item.disabled) {
      item.checked = checked
    }
  })

  customAgreements.value.forEach((item) => {
    if (!item.disabled) {
      item.checked = checked
    }
  })

  emitChange()
  emit('select-all', checked)
}

// 개별 항목 변경
const handleItemChange = (index: number) => {
  const item = agreementItems.value[index]
  emit('item-change', item, index)
  emitChange()
}

// 커스텀 항목 변경
const handleCustomChange = (index: number) => {
  const item = customAgreements.value[index]
  emit('item-change', item, index)
  emitChange()
}

// 상세 내용 토글
const toggleDetails = (index: number) => {
  agreementItems.value[index].showDetails = !agreementItems.value[index].showDetails
}

// 유효성 검사
const validate = (): boolean => {
  errorMessage.value = ''

  const allItems = [...agreementItems.value, ...customAgreements.value]
  const requiredItems = allItems.filter((item) => item.required)
  const uncheckedRequired = requiredItems.filter((item) => !item.checked)

  if (uncheckedRequired.length > 0) {
    errorMessage.value = '필수 동의 항목을 모두 체크해주세요.'
    return false
  }

  return true
}

// 이벤트 발생
const emitChange = () => {
  const allItems = [...agreementItems.value, ...customAgreements.value]
  emit('update:modelValue', allItems)
  emit('change', allItems)
}

// 감시자
watch(
  () => props.modelValue,
  () => {
    initializeItems()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.customAgreements,
  () => {
    initializeItems()
  },
  { deep: true },
)

// 외부에서 접근 가능한 메서드들
defineExpose({
  validate,
  getCheckedItems: () => {
    const allItems = [...agreementItems.value, ...customAgreements.value]
    return allItems.filter((item) => item.checked)
  },
  getRequiredItems: () => {
    const allItems = [...agreementItems.value, ...customAgreements.value]
    return allItems.filter((item) => item.required)
  },
  getUncheckedRequired: () => {
    const allItems = [...agreementItems.value, ...customAgreements.value]
    return allItems.filter((item) => item.required && !item.checked)
  },
  selectAll: () => handleSelectAll(true),
  unselectAll: () => handleSelectAll(false),
  addCustomAgreement: (agreement: AgreementItem) => {
    customAgreements.value.push({
      ...agreement,
      showDetails: false,
    })
    emitChange()
  },
  removeCustomAgreement: (id: string) => {
    const index = customAgreements.value.findIndex((item) => item.id === id)
    if (index > -1) {
      customAgreements.value.splice(index, 1)
      emitChange()
    }
  },
})
</script>

<style scoped>
.agreement-check-component {
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

.select-all-section {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-gray-50);
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.select-all-description {
  margin: var(--spacing-xs) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.agreement-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.agreement-item {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
  transition: border-color 0.2s ease;
}

.agreement-item.required {
  border-color: var(--color-primary);
}

.agreement-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.agreement-checkbox {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.agreement-checkbox:hover:not(.disabled) {
  background-color: var(--color-gray-50);
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  position: relative;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.checkbox-input:checked + .checkbox-custom {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 5px;
  width: 6px;
  height: 10px;
  border: solid var(--color-white);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-input:disabled + .checkbox-custom {
  border-color: var(--color-gray-300);
  background-color: var(--color-gray-100);
  cursor: not-allowed;
}

.agreement-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.agreement-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.agreement-title {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.required-mark {
  color: var(--color-danger);
  margin-left: var(--spacing-xs);
}

.required-text {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  background-color: var(--color-danger-light);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
}

.agreement-description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.details-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: background-color 0.2s ease;
  margin-left: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.details-button:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

.details-button.expanded {
  color: var(--color-text-secondary);
}

.details-button svg {
  transition: transform 0.2s ease;
}

.details-button svg.rotated {
  transform: rotate(180deg);
}

.agreement-details {
  margin: 0 var(--spacing-md) var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-gray-50);
}

.details-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.custom-agreements {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.custom-agreement-item {
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  background-color: var(--color-white);
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
  .agreement-checkbox {
    padding: var(--spacing-sm);
  }

  .agreement-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }

  .details-button {
    margin-left: var(--spacing-sm);
  }

  .agreement-details {
    margin: 0 var(--spacing-sm) var(--spacing-sm);
  }
}
</style>
