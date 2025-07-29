<template>
  <div class="left-panel-content">
    <!-- 계약서 정보 섹션 -->
    <div class="contract-info-section">
      <h3 class="section-title">계약서 정보</h3>
      <div class="contract-type">
        <span class="label">계약서 유형:</span>
        <span class="value">{{ contractType }}</span>
      </div>
      <div class="contract-title">
        <span class="label">계약서 제목:</span>
        <input
          v-model="contractTitle"
          @input="updateContractTitle"
          type="text"
          placeholder="계약서 제목을 입력하세요"
          class="title-input"
        />
      </div>
    </div>

    <!-- 물건 정보 섹션 -->
    <div class="property-info-section">
      <h3 class="section-title">대상 물건 정보</h3>
      <div class="property-address">
        <span class="label">주소:</span>
        <input
          v-model="propertyAddress"
          @input="updatePropertyAddress"
          type="text"
          placeholder="물건 주소를 입력하세요"
          class="address-input"
        />
      </div>
      <div class="property-lot">
        <span class="label">지번:</span>
        <input
          v-model="propertyLot"
          @input="updatePropertyLot"
          type="text"
          placeholder="지번을 입력하세요"
          class="lot-input"
        />
      </div>
    </div>

    <!-- 작성자 정보 섹션 -->
    <div class="author-info-section">
      <h3 class="section-title">작성자 정보</h3>
      <div class="authors-list">
        <div class="authors-header">
          <span class="label">공동 작성자:</span>
          <button @click="addAuthor" class="add-author-btn">+ 추가</button>
        </div>
        <div v-for="(author, index) in authors" :key="index" class="author-item">
          <input
            v-model="author.name"
            @input="updateAuthor(index)"
            type="text"
            :placeholder="`작성자 ${index + 1} 이름`"
            class="author-input"
          />
          <button @click="removeAuthor(index)" class="remove-author-btn">삭제</button>
        </div>
      </div>
      <div class="creation-date">
        <span class="label">작성 시작일자:</span>
        <span class="value">{{ creationDate }}</span>
      </div>
      <div class="status-switch">
        <span class="label">상태:</span>
        <div class="switch-container">
          <input
            type="checkbox"
            id="status-switch"
            v-model="isCompleted"
            @change="updateStatus"
            class="status-checkbox"
          />
          <label for="status-switch" class="switch-label">
            <span class="switch-text">{{ isCompleted ? '완료' : '미완료' }}</span>
          </label>
        </div>
      </div>

      <!-- 검증 상태 표시 -->
      <div v-if="enableValidation" class="validation-status">
        <span class="label">검증 상태:</span>
        <div class="validation-indicator" :class="getValidationStatusClass()">
          <div class="validation-dot"></div>
          <span class="validation-text">{{ getValidationStatusText() }}</span>
        </div>
        <div class="completion-progress">
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="getProgressBarClass()"
              :style="{ width: `${validationStatus.completionRate}%` }"
            ></div>
          </div>
          <span class="progress-text">{{ validationStatus.completionRate.toFixed(1) }}%</span>
        </div>
      </div>
    </div>

    <!-- 액션 버튼 섹션 -->
    <div class="action-section">
      <button @click="previewContract" class="preview-btn" :disabled="!contractTitle.trim()">
        계약서 미리보기
      </button>
      <button @click="exportContract" :class="exportButtonClass" :disabled="!canExport">
        {{ exportButtonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  contractValidationService,
  type ValidationResult,
} from '@/services/ContractValidationService'

// Props 정의
interface Props {
  contractType?: string
  initialTitle?: string
  initialAddress?: string
  initialLot?: string
  initialAuthors?: Array<{ name: string; id?: string }>
  contractId?: string
  validationResult?: ValidationResult
  enableValidation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  contractType: '부동산 매매계약서',
  initialTitle: '',
  initialAddress: '',
  initialLot: '',
  initialAuthors: () => [{ name: '' }],
  contractId: '',
  validationResult: () => contractValidationService.validationResult.value,
  enableValidation: true,
})

// Emits 정의
const emit = defineEmits<{
  'update:title': [title: string]
  'update:address': [address: string]
  'update:lot': [lot: string]
  'update:authors': [authors: Array<{ name: string; id?: string }>]
  'update:status': [status: boolean]
  preview: [contractId: string]
  export: [contractId: string]
}>()

// 반응형 상태
const contractTitle = ref(props.initialTitle)
const propertyAddress = ref(props.initialAddress)
const propertyLot = ref(props.initialLot)
const authors = ref([...props.initialAuthors])
const isCompleted = ref(false)

// 계산된 속성
const creationDate = computed(() => {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// 검증 상태 계산된 속성
const validationStatus = computed(() => {
  if (!props.enableValidation) return { isValid: true, completionRate: 100 }
  return props.validationResult
})

const canExport = computed(() => {
  if (!props.enableValidation) {
    return isCompleted.value && contractTitle.value.trim()
  }
  return validationStatus.value.isValid && isCompleted.value && contractTitle.value.trim()
})

const exportButtonText = computed(() => {
  if (!props.enableValidation) return '계약서 출력'

  if (!validationStatus.value.isValid) {
    return `출력 불가 (${validationStatus.value.completionRate.toFixed(1)}%)`
  }
  return '계약서 출력'
})

const exportButtonClass = computed(() => {
  if (!props.enableValidation) return canExport.value ? 'export-btn' : 'export-btn disabled'

  if (!validationStatus.value.isValid) return 'export-btn disabled validation-error'
  if (!canExport.value) return 'export-btn disabled'
  return 'export-btn'
})

// 메서드들
const updateContractTitle = () => {
  emit('update:title', contractTitle.value)
}

const updatePropertyAddress = () => {
  emit('update:address', propertyAddress.value)
}

const updatePropertyLot = () => {
  emit('update:lot', propertyLot.value)
}

const updateAuthor = (index: number) => {
  emit('update:authors', [...authors.value])
}

const addAuthor = () => {
  authors.value.push({ name: '' })
  emit('update:authors', [...authors.value])
}

const removeAuthor = (index: number) => {
  if (authors.value.length > 1) {
    authors.value.splice(index, 1)
    emit('update:authors', [...authors.value])
  }
}

const updateStatus = () => {
  emit('update:status', isCompleted.value)
}

const previewContract = () => {
  if (props.contractId) {
    emit('preview', props.contractId)
  }
}

const exportContract = () => {
  if (props.contractId && canExport.value) {
    emit('export', props.contractId)
  }
}

// 검증 상태 관련 메서드들
const getValidationStatusClass = () => {
  if (validationStatus.value.isValid) return 'status-valid'
  if (
    'errors' in validationStatus.value &&
    validationStatus.value.errors?.some((e: any) => e.severity === 'error')
  )
    return 'status-error'
  return 'status-warning'
}

const getValidationStatusText = () => {
  if (validationStatus.value.isValid) return '검증 완료'
  if (
    'errors' in validationStatus.value &&
    validationStatus.value.errors?.some((e: any) => e.severity === 'error')
  )
    return '검증 오류'
  return '검증 경고'
}

const getProgressBarClass = () => {
  const rate = validationStatus.value.completionRate
  if (rate >= 90) return 'progress-excellent'
  if (rate >= 70) return 'progress-good'
  if (rate >= 50) return 'progress-fair'
  return 'progress-poor'
}

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  if (authors.value.length === 0) {
    authors.value = [{ name: '' }]
  }
})
</script>

<style scoped>
.left-panel-content {
  width: 280px;
  max-width: 420px;
  margin: 10px;
  background-color: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: fit-content;
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.contract-info-section,
.property-info-section,
.author-info-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 80px;
  display: inline-block;
}

.value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.contract-type,
.creation-date {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.contract-title,
.property-address,
.property-lot {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.title-input,
.address-input,
.lot-input,
.author-input {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  transition: border-color 0.2s ease;
}

.title-input:focus,
.address-input:focus,
.lot-input:focus,
.author-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.authors-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.authors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-author-btn {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-author-btn:hover {
  background-color: var(--color-primary-dark);
}

.author-item {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.author-input {
  flex: 1;
}

.remove-author-btn {
  background-color: var(--color-danger);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.remove-author-btn:hover {
  background-color: var(--color-danger-dark);
}

.status-switch {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.switch-container {
  position: relative;
  display: inline-block;
}

.status-checkbox {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-label {
  display: inline-block;
  width: 60px;
  height: 30px;
  background-color: var(--color-gray-300);
  border-radius: 15px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.status-checkbox:checked + .switch-label {
  background-color: var(--color-success);
}

.switch-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 26px;
  height: 26px;
  background-color: var(--color-white);
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.status-checkbox:checked + .switch-label::after {
  transform: translateX(30px);
}

.switch-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  pointer-events: none;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.preview-btn,
.export-btn {
  padding: var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-btn {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.preview-btn:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
}

.preview-btn:disabled {
  background-color: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

.export-btn {
  background-color: var(--color-success);
  color: var(--color-white);
}

.export-btn:hover:not(:disabled) {
  background-color: var(--color-success-dark);
}

.export-btn:disabled {
  background-color: var(--color-gray-300);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .left-panel-content {
    max-width: 100%;
    margin-bottom: var(--spacing-lg);
  }

  .author-item {
    flex-direction: column;
    align-items: stretch;
  }

  .remove-author-btn {
    align-self: flex-end;
  }
}
</style>
