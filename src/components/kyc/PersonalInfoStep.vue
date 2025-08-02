<template>
  <div class="personal-info-step">
    <div class="step-description">
      <p>신원 확인을 위한 개인정보를 입력해주세요. 입력된 정보는 안전하게 보호됩니다.</p>
    </div>

    <form @submit.prevent="submitPersonalInfo" class="personal-info-form">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="firstName">
            이름 <span class="required">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            v-model="personalInfo.first_name"
            class="form-input"
            placeholder="이름을 입력하세요"
            required
            :disabled="isLoading || isCompleted"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="lastName">
            성 <span class="required">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            v-model="personalInfo.last_name"
            class="form-input"
            placeholder="성을 입력하세요"
            required
            :disabled="isLoading || isCompleted"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="dateOfBirth">
            생년월일 <span class="required">*</span>
          </label>
          <input
            id="dateOfBirth"
            type="date"
            v-model="personalInfo.date_of_birth"
            class="form-input"
            required
            :max="maxBirthDate"
            :disabled="isLoading || isCompleted"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="nationality">
            국적 <span class="required">*</span>
          </label>
          <select
            id="nationality"
            v-model="personalInfo.nationality"
            class="form-select"
            required
            :disabled="isLoading || isCompleted"
          >
            <option value="">국적을 선택하세요</option>
            <option value="KR">대한민국</option>
            <option value="US">미국</option>
            <option value="CN">중국</option>
            <option value="JP">일본</option>
            <option value="GB">영국</option>
            <option value="DE">독일</option>
            <option value="FR">프랑스</option>
            <option value="CA">캐나다</option>
            <option value="AU">호주</option>
            <option value="SG">싱가포르</option>
            <option value="OTHER">기타</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="addressLine1">
          주소 <span class="required">*</span>
        </label>
        <input
          id="addressLine1"
          type="text"
          v-model="personalInfo.address_line1"
          class="form-input"
          placeholder="상세 주소를 입력하세요"
          required
          :disabled="isLoading || isCompleted"
        />
      </div>

      <div class="form-group">
        <label class="form-label" for="addressLine2">
          상세 주소 (선택사항)
        </label>
        <input
          id="addressLine2"
          type="text"
          v-model="personalInfo.address_line2"
          class="form-input"
          placeholder="아파트명, 동/호수 등"
          :disabled="isLoading || isCompleted"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="city">
            도시 <span class="required">*</span>
          </label>
          <input
            id="city"
            type="text"
            v-model="personalInfo.city"
            class="form-input"
            placeholder="도시명을 입력하세요"
            required
            :disabled="isLoading || isCompleted"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="state">
            시/도 <span class="required">*</span>
          </label>
          <input
            id="state"
            type="text"
            v-model="personalInfo.state"
            class="form-input"
            placeholder="시/도를 입력하세요"
            required
            :disabled="isLoading || isCompleted"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="postalCode">
            우편번호 <span class="required">*</span>
          </label>
          <input
            id="postalCode"
            type="text"
            v-model="personalInfo.postal_code"
            class="form-input"
            placeholder="우편번호를 입력하세요"
            required
            :disabled="isLoading || isCompleted"
          />
        </div>
        
        <div class="form-group">
          <label class="form-label" for="country">
            국가 <span class="required">*</span>
          </label>
          <select
            id="country"
            v-model="personalInfo.country"
            class="form-select"
            required
            :disabled="isLoading || isCompleted"
          >
            <option value="">국가를 선택하세요</option>
            <option value="KR">대한민국</option>
            <option value="US">미국</option>
            <option value="CN">중국</option>
            <option value="JP">일본</option>
            <option value="GB">영국</option>
            <option value="DE">독일</option>
            <option value="FR">프랑스</option>
            <option value="CA">캐나다</option>
            <option value="AU">호주</option>
            <option value="SG">싱가포르</option>
          </select>
        </div>
      </div>

      <!-- Privacy Notice -->
      <div class="privacy-notice">
        <div class="notice-icon">🔒</div>
        <div class="notice-content">
          <h4>개인정보 보호</h4>
          <p>입력하신 개인정보는 본인 확인 목적으로만 사용되며, 관련 법률에 따라 안전하게 보호됩니다.</p>
        </div>
      </div>

      <!-- Form Actions -->
      <div v-if="!isCompleted" class="form-actions">
        <button 
          type="button"
          class="action-btn secondary"
          @click="loadExistingData"
          :disabled="isLoading"
        >
          기존 정보 불러오기
        </button>
        <button 
          type="submit"
          class="action-btn primary"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          {{ isLoading ? '저장 중...' : '개인정보 저장' }}
        </button>
      </div>

      <!-- Completion State -->
      <div v-if="isCompleted" class="completion-state">
        <div class="success-icon">✅</div>
        <h4>개인정보 입력 완료</h4>
        <p>개인정보가 성공적으로 저장되었습니다.</p>
        <button 
          type="button"
          class="edit-btn"
          @click="enableEditing"
          :disabled="isLoading"
        >
          수정하기
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !isCompleted" class="loading-section">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="errors.length > 0" class="error-section">
        <div class="error-icon">⚠️</div>
        <h4>입력 오류</h4>
        <ul class="error-list">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKYC, type KYCPersonalInfo } from '@/composables/useKYC'
import { profileAPI } from '@/services/api'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  completed: []
  error: [string]
}>()

// Composables
const { submitPersonalInfo } = useKYC()

// State
const personalInfo = ref<KYCPersonalInfo>({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  nationality: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: ''
})

const isLocalLoading = ref(false)
const loadingMessage = ref('')
const errors = ref<string[]>([])
const isCompleted = ref(false)

// Computed
const isLoading = computed(() => props.isLoading || isLocalLoading.value)

const maxBirthDate = computed(() => {
  const today = new Date()
  const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
  return minAge.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return (
    personalInfo.value.first_name.trim() &&
    personalInfo.value.last_name.trim() &&
    personalInfo.value.date_of_birth &&
    personalInfo.value.nationality &&
    personalInfo.value.address_line1.trim() &&
    personalInfo.value.city.trim() &&
    personalInfo.value.state.trim() &&
    personalInfo.value.postal_code.trim() &&
    personalInfo.value.country
  )
})

// Methods
const loadExistingData = async () => {
  try {
    isLocalLoading.value = true
    loadingMessage.value = '기존 정보를 불러오는 중...'
    errors.value = []

    const response = await profileAPI.getProfile(props.userId)
    const profile = response.data

    // Map profile data to personal info
    if (profile.first_name) personalInfo.value.first_name = profile.first_name
    if (profile.last_name) personalInfo.value.last_name = profile.last_name
    if (profile.date_of_birth) personalInfo.value.date_of_birth = profile.date_of_birth
    if (profile.nationality) personalInfo.value.nationality = profile.nationality
    if (profile.address) personalInfo.value.address_line1 = profile.address
    if (profile.city) personalInfo.value.city = profile.city
    if (profile.state) personalInfo.value.state = profile.state
    if (profile.postal_code) personalInfo.value.postal_code = profile.postal_code
    if (profile.country) personalInfo.value.country = profile.country

    securityLogger.log('KYC_PERSONAL_INFO_LOADED', {
      userId: props.userId,
      timestamp: new Date().toISOString()
    })

  } catch (err: any) {
    console.error('Failed to load existing data:', err)
    errors.value = ['기존 정보를 불러오는데 실패했습니다.']
  } finally {
    isLocalLoading.value = false
  }
}

const validateForm = (): string[] => {
  const validationErrors: string[] = []

  if (!personalInfo.value.first_name.trim()) {
    validationErrors.push('이름을 입력해주세요.')
  }

  if (!personalInfo.value.last_name.trim()) {
    validationErrors.push('성을 입력해주세요.')
  }

  if (!personalInfo.value.date_of_birth) {
    validationErrors.push('생년월일을 입력해주세요.')
  } else {
    const birthDate = new Date(personalInfo.value.date_of_birth)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    
    if (age < 18) {
      validationErrors.push('18세 이상만 이용할 수 있습니다.')
    }
  }

  if (!personalInfo.value.nationality) {
    validationErrors.push('국적을 선택해주세요.')
  }

  if (!personalInfo.value.address_line1.trim()) {
    validationErrors.push('주소를 입력해주세요.')
  }

  if (!personalInfo.value.city.trim()) {
    validationErrors.push('도시를 입력해주세요.')
  }

  if (!personalInfo.value.state.trim()) {
    validationErrors.push('시/도를 입력해주세요.')
  }

  if (!personalInfo.value.postal_code.trim()) {
    validationErrors.push('우편번호를 입력해주세요.')
  }

  if (!personalInfo.value.country) {
    validationErrors.push('국가를 선택해주세요.')
  }

  return validationErrors
}

const submitPersonalInfo = async () => {
  try {
    isLocalLoading.value = true
    loadingMessage.value = '개인정보를 저장하는 중...'
    errors.value = []

    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      errors.value = validationErrors
      return
    }

    // Submit to KYC system
    const success = await submitPersonalInfo(props.userId, personalInfo.value)
    
    if (success) {
      isCompleted.value = true
      emit('completed')
      
      securityLogger.log('KYC_PERSONAL_INFO_SUBMITTED', {
        userId: props.userId,
        timestamp: new Date().toISOString()
      })
    } else {
      errors.value = ['개인정보 저장에 실패했습니다. 다시 시도해주세요.']
      emit('error', '개인정보 저장에 실패했습니다.')
    }

  } catch (err: any) {
    console.error('Failed to submit personal info:', err)
    const errorMessage = err.response?.data?.message || '개인정보 저장 중 오류가 발생했습니다.'
    errors.value = [errorMessage]
    emit('error', errorMessage)
  } finally {
    isLocalLoading.value = false
  }
}

const enableEditing = () => {
  isCompleted.value = false
  errors.value = []
}

const checkExistingData = async () => {
  try {
    // Check if personal info is already submitted
    const response = await profileAPI.getKYCStatus(props.userId)
    
    // If personal info step is already completed, load the data and mark as completed
    if (response.data.personal_info_submitted) {
      await loadExistingData()
      isCompleted.value = true
      emit('completed')
    }
    
  } catch (err) {
    console.error('Failed to check existing KYC data:', err)
    // Continue without error - user can still fill the form
  }
}

// Initialize
onMounted(async () => {
  await checkExistingData()
})
</script>

<style scoped>
.personal-info-step {
  max-width: 600px;
  margin: 0 auto;
}

.step-description {
  text-align: center;
  margin-bottom: 32px;
}

.step-description p {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.personal-info-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.required {
  color: #dc3545;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2);
}

.form-input:disabled,
.form-select:disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.privacy-notice {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
  margin: 24px 0;
}

.notice-icon {
  font-size: 24px;
  line-height: 1;
}

.notice-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1565c0;
  margin: 0 0 8px 0;
}

.notice-content p {
  font-size: 14px;
  color: #1976d2;
  margin: 0;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
}

.action-btn {
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn.primary {
  background: #28a745;
  color: white;
  flex: 1;
}

.action-btn.primary:hover:not(:disabled) {
  background: #218838;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.completion-state {
  text-align: center;
  padding: 32px;
  background: #d4edda;
  border-radius: 12px;
  border: 1px solid #28a745;
  margin-top: 24px;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.completion-state h4 {
  font-size: 20px;
  font-weight: 600;
  color: #155724;
  margin: 0 0 12px 0;
}

.completion-state p {
  font-size: 16px;
  color: #155724;
  margin: 0 0 20px 0;
}

.edit-btn {
  padding: 10px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.edit-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.loading-section {
  text-align: center;
  padding: 32px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-section p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.error-section {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.error-icon {
  font-size: 24px;
  margin-bottom: 12px;
  text-align: center;
}

.error-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #721c24;
  margin: 0 0 12px 0;
  text-align: center;
}

.error-list {
  margin: 0;
  padding-left: 20px;
  color: #721c24;
}

.error-list li {
  font-size: 14px;
  margin-bottom: 4px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>