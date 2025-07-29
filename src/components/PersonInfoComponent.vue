<template>
  <div class="person-info-component">
    <!-- 개인/법인 선택 -->
    <div class="type-selector">
      <label class="type-label">유형:</label>
      <div class="type-options">
        <label class="type-option">
          <input
            type="radio"
            v-model="personType"
            value="individual"
            @change="handleTypeChange"
            class="type-radio"
          />
          <span class="type-text">개인</span>
        </label>
        <label class="type-option">
          <input
            type="radio"
            v-model="personType"
            value="corporate"
            @change="handleTypeChange"
            class="type-radio"
          />
          <span class="type-text">법인</span>
        </label>
      </div>
    </div>

    <!-- 개인 정보 입력 -->
    <div v-if="personType === 'individual'" class="individual-info">
      <div class="input-group">
        <label class="input-label">성명 *</label>
        <input
          v-model="individualInfo.name"
          @input="updateIndividualInfo"
          type="text"
          placeholder="성명을 입력하세요"
          class="text-input"
          :class="{ error: errors.name }"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <div class="input-group">
        <label class="input-label">주민등록번호</label>
        <input
          v-model="individualInfo.residentNumber"
          @input="formatResidentNumber"
          type="text"
          placeholder="000000-0000000"
          class="text-input"
          maxlength="14"
          :class="{ error: errors.residentNumber }"
        />
        <span v-if="errors.residentNumber" class="error-message">{{ errors.residentNumber }}</span>
      </div>

      <div class="input-group">
        <label class="input-label">주소</label>
        <input
          v-model="individualInfo.address"
          @input="updateIndividualInfo"
          type="text"
          placeholder="주소를 입력하세요"
          class="text-input"
        />
      </div>

      <div class="input-group">
        <label class="input-label">연락처</label>
        <input
          v-model="individualInfo.phone"
          @input="formatPhoneNumber"
          type="text"
          placeholder="010-0000-0000"
          class="text-input"
          maxlength="13"
        />
      </div>
    </div>

    <!-- 법인 정보 입력 -->
    <div v-if="personType === 'corporate'" class="corporate-info">
      <div class="input-group">
        <label class="input-label">법인명 *</label>
        <input
          v-model="corporateInfo.name"
          @input="updateCorporateInfo"
          type="text"
          placeholder="법인명을 입력하세요"
          class="text-input"
          :class="{ error: errors.name }"
        />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>

      <div class="input-group">
        <label class="input-label">사업자등록번호</label>
        <input
          v-model="corporateInfo.businessNumber"
          @input="formatBusinessNumber"
          type="text"
          placeholder="000-00-00000"
          class="text-input"
          maxlength="12"
          :class="{ error: errors.businessNumber }"
        />
        <span v-if="errors.businessNumber" class="error-message">{{ errors.businessNumber }}</span>
      </div>

      <div class="input-group">
        <label class="input-label">대표자명</label>
        <input
          v-model="corporateInfo.representative"
          @input="updateCorporateInfo"
          type="text"
          placeholder="대표자명을 입력하세요"
          class="text-input"
        />
      </div>

      <div class="input-group">
        <label class="input-label">법인주소</label>
        <input
          v-model="corporateInfo.address"
          @input="updateCorporateInfo"
          type="text"
          placeholder="법인주소를 입력하세요"
          class="text-input"
        />
      </div>

      <div class="input-group">
        <label class="input-label">연락처</label>
        <input
          v-model="corporateInfo.phone"
          @input="formatPhoneNumber"
          type="text"
          placeholder="02-0000-0000"
          class="text-input"
          maxlength="13"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Props 정의
interface Props {
  modelValue?: {
    type: 'individual' | 'corporate'
    individual?: {
      name: string
      residentNumber: string
      address: string
      phone: string
    }
    corporate?: {
      name: string
      businessNumber: string
      representative: string
      address: string
      phone: string
    }
  }
  required?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    type: 'individual',
    individual: {
      name: '',
      residentNumber: '',
      address: '',
      phone: '',
    },
    corporate: {
      name: '',
      businessNumber: '',
      representative: '',
      address: '',
      phone: '',
    },
  }),
  required: false,
  label: '정보',
})

// Emits 정의
const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
}>()

// 반응형 상태
const personType = ref(props.modelValue.type)
const individualInfo = ref({ ...props.modelValue.individual })
const corporateInfo = ref({ ...props.modelValue.corporate })
const errors = ref<Record<string, string>>({})

// 유효성 검사
const validateIndividual = () => {
  errors.value = {}

  if (props.required && !individualInfo.value?.name?.trim()) {
    errors.value.name = '성명은 필수 입력 항목입니다.'
  }

  const residentNumber = individualInfo.value?.residentNumber
  if (residentNumber && !isValidResidentNumber(residentNumber)) {
    errors.value.residentNumber = '올바른 주민등록번호 형식이 아닙니다.'
  }

  return Object.keys(errors.value).length === 0
}

const validateCorporate = () => {
  errors.value = {}

  if (props.required && !corporateInfo.value?.name?.trim()) {
    errors.value.name = '법인명은 필수 입력 항목입니다.'
  }

  const businessNumber = corporateInfo.value?.businessNumber
  if (businessNumber && !isValidBusinessNumber(businessNumber)) {
    errors.value.businessNumber = '올바른 사업자등록번호 형식이 아닙니다.'
  }

  return Object.keys(errors.value).length === 0
}

// 유효성 검사 헬퍼 함수
const isValidResidentNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/-/g, '')
  if (cleanNumber.length !== 13) return false

  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanNumber[i]) * weights[i]
  }

  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === parseInt(cleanNumber[12])
}

const isValidBusinessNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/-/g, '')
  if (cleanNumber.length !== 10) return false

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNumber[i]) * weights[i]
  }

  sum += Math.floor((parseInt(cleanNumber[8]) * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleanNumber[9])
}

// 포맷팅 함수들
const formatResidentNumber = () => {
  const currentValue = individualInfo.value?.residentNumber || ''
  let value = currentValue.replace(/[^0-9]/g, '')
  if (value.length > 6) {
    value = value.slice(0, 6) + '-' + value.slice(6, 13)
  }
  if (individualInfo.value) {
    individualInfo.value.residentNumber = value
  }
  updateIndividualInfo()
}

const formatBusinessNumber = () => {
  const currentValue = corporateInfo.value?.businessNumber || ''
  let value = currentValue.replace(/[^0-9]/g, '')
  if (value.length > 3) {
    value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10)
  }
  if (corporateInfo.value) {
    corporateInfo.value.businessNumber = value
  }
  updateCorporateInfo()
}

const formatPhoneNumber = () => {
  const value = individualInfo.value?.phone || corporateInfo.value?.phone || ''
  const cleanValue = value.replace(/[^0-9]/g, '')

  let formatted = ''
  if (cleanValue.length <= 3) {
    formatted = cleanValue
  } else if (cleanValue.length <= 7) {
    formatted = cleanValue.slice(0, 3) + '-' + cleanValue.slice(3)
  } else {
    formatted =
      cleanValue.slice(0, 3) + '-' + cleanValue.slice(3, 7) + '-' + cleanValue.slice(7, 11)
  }

  if (personType.value === 'individual') {
    individualInfo.value.phone = formatted
  } else {
    corporateInfo.value.phone = formatted
  }

  if (personType.value === 'individual') {
    updateIndividualInfo()
  } else {
    updateCorporateInfo()
  }
}

// 이벤트 핸들러들
const handleTypeChange = () => {
  emitChange()
}

const updateIndividualInfo = () => {
  validateIndividual()
  emitChange()
}

const updateCorporateInfo = () => {
  validateCorporate()
  emitChange()
}

const emitChange = () => {
  const value = {
    type: personType.value,
    individual: personType.value === 'individual' ? { ...individualInfo.value } : undefined,
    corporate: personType.value === 'corporate' ? { ...corporateInfo.value } : undefined,
  }

  emit('update:modelValue', value)
  emit('change', value)
}

// 계산된 속성
const isValid = computed(() => {
  if (personType.value === 'individual') {
    return validateIndividual()
  } else {
    return validateCorporate()
  }
})

// 감시자
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      personType.value = newValue.type
      if (newValue.individual) {
        individualInfo.value = { ...newValue.individual }
      }
      if (newValue.corporate) {
        corporateInfo.value = { ...newValue.corporate }
      }
    }
  },
  { deep: true },
)

// 외부에서 접근 가능한 메서드들
defineExpose({
  validate: () => isValid.value,
  getValue: () => ({
    type: personType.value,
    individual: personType.value === 'individual' ? { ...individualInfo.value } : undefined,
    corporate: personType.value === 'corporate' ? { ...corporateInfo.value } : undefined,
  }),
})
</script>

<style scoped>
.person-info-component {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  background-color: var(--color-white);
}

.type-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.type-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 60px;
}

.type-options {
  display: flex;
  gap: var(--spacing-lg);
}

.type-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.type-radio {
  margin: 0;
}

.type-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.individual-info,
.corporate-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
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

.text-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.text-input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.error-message {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin-top: var(--spacing-xs);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .type-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .type-options {
    gap: var(--spacing-md);
  }
}
</style>
