<template>
  <div class="kyc-wizard">
    <div class="wizard-header">
      <h2 class="wizard-title">신원 인증</h2>
      <p class="wizard-subtitle">안전한 거래를 위해 본인 인증을 완료해주세요</p>
    </div>

    <!-- Progress Bar -->
    <div class="progress-section">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
      <div class="progress-text">
        {{ completedSteps.length }} / {{ totalSteps }} 단계 완료 ({{ progressPercentage }}%)
      </div>
    </div>

    <!-- Steps Overview -->
    <div class="steps-overview">
      <div 
        v-for="step in verificationSteps" 
        :key="step.id"
        class="step-item"
        :class="getStepClass(step)"
      >
        <div class="step-icon">
          <span v-if="step.status === 'completed'">✅</span>
          <span v-else-if="step.status === 'in_progress'">🔄</span>
          <span v-else-if="step.status === 'failed'">❌</span>
          <span v-else>⭕</span>
        </div>
        <div class="step-info">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-description">{{ step.description }}</div>
        </div>
        <div class="step-status">
          <span class="status-badge" :class="step.status">
            {{ getStatusText(step.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Current Step Content -->
    <div v-if="currentStep" class="current-step-section">
      <div class="step-card">
        <div class="step-card-header">
          <h3>{{ currentStep.title }}</h3>
          <span v-if="currentStep.required" class="required-badge">필수</span>
        </div>
        
        <div class="step-content">
          <!-- Email Verification -->
          <EmailVerificationStep 
            v-if="currentStep.id === 'email'"
            :user-id="userId"
            :is-loading="isLoading"
            @verified="handleStepComplete('email')"
            @error="handleStepError"
          />

          <!-- Phone Verification -->
          <PhoneVerificationStep 
            v-else-if="currentStep.id === 'phone'"
            :user-id="userId"
            :is-loading="isLoading"
            @verified="handleStepComplete('phone')"
            @error="handleStepError"
          />

          <!-- Personal Information -->
          <PersonalInfoStep 
            v-else-if="currentStep.id === 'personal_info'"
            :user-id="userId"
            :is-loading="isLoading"
            @completed="handleStepComplete('personal_info')"
            @error="handleStepError"
          />

          <!-- Identity Document Upload -->
          <DocumentUploadStep 
            v-else-if="currentStep.id === 'identity_document'"
            :user-id="userId"
            :document-type="'identity'"
            :is-loading="isLoading"
            @uploaded="handleStepComplete('identity_document')"
            @error="handleStepError"
          />

          <!-- Address Proof Upload -->
          <DocumentUploadStep 
            v-else-if="currentStep.id === 'address_proof'"
            :user-id="userId"
            :document-type="'address'"
            :is-loading="isLoading"
            @uploaded="handleStepComplete('address_proof')"
            @error="handleStepError"
          />
        </div>

        <!-- Step Actions -->
        <div class="step-actions">
          <button 
            v-if="canSkipCurrentStep"
            class="action-btn skip"
            @click="skipCurrentStep"
            :disabled="isLoading"
          >
            건너뛰기
          </button>
          
          <button 
            v-if="canProceedToNext"
            class="action-btn next"
            @click="proceedToNextStep"
            :disabled="isLoading"
          >
            다음 단계
          </button>
        </div>
      </div>
    </div>

    <!-- Completion Section -->
    <div v-else-if="isKYCComplete" class="completion-section">
      <div class="completion-card">
        <div class="completion-icon">🎉</div>
        <h3>인증 완료!</h3>
        <p>모든 인증 단계가 완료되었습니다. 검토 후 승인될 예정입니다.</p>
        
        <div class="completion-stats">
          <div class="stat">
            <span class="label">인증 레벨:</span>
            <span class="value">{{ getKYCLevelText(kycStatus?.level) }}</span>
          </div>
          <div class="stat">
            <span class="label">완료 일시:</span>
            <span class="value">{{ formatDate(new Date().toISOString()) }}</span>
          </div>
        </div>

        <button class="action-btn primary" @click="$emit('completed')">
          확인
        </button>
      </div>
    </div>

    <!-- Submit Section -->
    <div v-else-if="canSubmitForReview" class="submit-section">
      <div class="submit-card">
        <h3>인증 검토 요청</h3>
        <p>필수 인증 단계가 모두 완료되었습니다. 검토를 요청하시겠습니까?</p>
        
        <div class="submit-actions">
          <button 
            class="action-btn secondary" 
            @click="continueOptionalSteps"
            :disabled="isLoading"
          >
            선택 단계 계속
          </button>
          <button 
            class="action-btn primary" 
            @click="submitForReview"
            :disabled="isLoading"
          >
            검토 요청
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>처리 중...</p>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-section">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="retryCurrentStep">
          다시 시도
        </button>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useKYC } from '@/composables/useKYC'
import { securityLogger } from '@/utils/security'
import EmailVerificationStep from './EmailVerificationStep.vue'
import PhoneVerificationStep from './PhoneVerificationStep.vue'
import PersonalInfoStep from './PersonalInfoStep.vue'
import DocumentUploadStep from './DocumentUploadStep.vue'

interface Props {
  userId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  completed: []
  cancelled: []
}>()

// Composables
const {
  kycStatus,
  verificationSteps,
  isLoading,
  error,
  currentStep,
  completedSteps,
  totalSteps,
  progressPercentage,
  isKYCComplete,
  canSubmitForReview,
  getKYCStatus,
  updateStepStatus
} = useKYC()

// State
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Computed
const canSkipCurrentStep = computed(() => {
  return currentStep.value && !currentStep.value.required
})

const canProceedToNext = computed(() => {
  return currentStep.value?.status === 'completed'
})

// Methods
const handleStepComplete = async (stepId: string) => {
  try {
    updateStepStatus(stepId, 'completed')
    showSuccessToast(`${getStepTitle(stepId)} 단계가 완료되었습니다!`)
    
    // Log step completion
    securityLogger.log('KYC_STEP_COMPLETED', {
      userId: props.userId,
      stepId,
      timestamp: new Date().toISOString()
    })
    
    // Auto-proceed to next step after a short delay
    setTimeout(() => {
      proceedToNextStep()
    }, 1500)
    
  } catch (err) {
    console.error('Failed to complete step:', err)
    handleStepError('단계 완료 처리 중 오류가 발생했습니다.')
  }
}

const handleStepError = (errorMessage: string) => {
  if (currentStep.value) {
    updateStepStatus(currentStep.value.id, 'failed')
  }
  showSuccessToast(errorMessage)
}

const skipCurrentStep = () => {
  if (currentStep.value && !currentStep.value.required) {
    updateStepStatus(currentStep.value.id, 'completed')
    showSuccessToast(`${currentStep.value.title} 단계를 건너뛰었습니다.`)
    
    securityLogger.log('KYC_STEP_SKIPPED', {
      userId: props.userId,
      stepId: currentStep.value.id,
      timestamp: new Date().toISOString()
    })
    
    proceedToNextStep()
  }
}

const proceedToNextStep = () => {
  // The currentStep computed will automatically update to the next pending step
  if (currentStep.value) {
    updateStepStatus(currentStep.value.id, 'in_progress')
  }
}

const continueOptionalSteps = () => {
  // Find next optional step and set it to in_progress
  const nextOptionalStep = verificationSteps.value.find(
    step => !step.required && step.status === 'pending'
  )
  
  if (nextOptionalStep) {
    updateStepStatus(nextOptionalStep.id, 'in_progress')
  }
}

const submitForReview = async () => {
  try {
    // This would typically call an API to submit the KYC for review
    showSuccessToast('인증 검토 요청이 제출되었습니다!')
    
    securityLogger.log('KYC_SUBMITTED_FOR_REVIEW', {
      userId: props.userId,
      completedSteps: completedSteps.value.length,
      timestamp: new Date().toISOString()
    })
    
    // Emit completion event
    setTimeout(() => {
      emit('completed')
    }, 2000)
    
  } catch (err) {
    console.error('Failed to submit for review:', err)
    showSuccessToast('검토 요청 제출 중 오류가 발생했습니다.')
  }
}

const retryCurrentStep = () => {
  if (currentStep.value) {
    updateStepStatus(currentStep.value.id, 'in_progress')
  }
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const getStepClass = (step: any) => {
  return {
    'step-completed': step.status === 'completed',
    'step-current': step.status === 'in_progress',
    'step-failed': step.status === 'failed',
    'step-pending': step.status === 'pending'
  }
}

const getStatusText = (status: string): string => {
  const statusMap = {
    'pending': '대기중',
    'in_progress': '진행중',
    'completed': '완료',
    'failed': '실패'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStepTitle = (stepId: string): string => {
  const step = verificationSteps.value.find(s => s.id === stepId)
  return step?.title || stepId
}

const getKYCLevelText = (level?: string): string => {
  const levelMap = {
    'unverified': '미인증',
    'basic': '기본 인증',
    'intermediate': '중급 인증',
    'advanced': '고급 인증'
  }
  return levelMap[level as keyof typeof levelMap] || '알 수 없음'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
onMounted(async () => {
  try {
    await getKYCStatus(props.userId)
    
    // Start the first pending step
    if (currentStep.value) {
      updateStepStatus(currentStep.value.id, 'in_progress')
    }
    
    securityLogger.log('KYC_WIZARD_OPENED', {
      userId: props.userId,
      currentLevel: kycStatus.value?.level,
      timestamp: new Date().toISOString()
    })
    
  } catch (err) {
    console.error('Failed to initialize KYC wizard:', err)
  }
})
</script>

<style scoped>
.kyc-wizard {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wizard-header {
  text-align: center;
  margin-bottom: 32px;
}

.wizard-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.wizard-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.progress-section {
  margin-bottom: 32px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0d6efd 0%, #28a745 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.steps-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.step-item.step-completed {
  background: #d4edda;
  border-color: #28a745;
}

.step-item.step-current {
  background: #cff4fc;
  border-color: #0dcaf0;
  box-shadow: 0 0 0 2px rgba(13, 202, 240, 0.2);
}

.step-item.step-failed {
  background: #f8d7da;
  border-color: #dc3545;
}

.step-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: white;
}

.step-info {
  flex: 1;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.step-description {
  font-size: 14px;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.in_progress {
  background: #cff4fc;
  color: #055160;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.current-step-section {
  margin-bottom: 32px;
}

.step-card {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 24px;
  background: #f8f9fa;
}

.step-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.step-card-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.required-badge {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.step-content {
  margin-bottom: 24px;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.action-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.skip {
  background: #6c757d;
  color: white;
}

.action-btn.skip:hover:not(:disabled) {
  background: #5a6268;
}

.action-btn.next {
  background: #0d6efd;
  color: white;
}

.action-btn.next:hover:not(:disabled) {
  background: #0b5ed7;
}

.action-btn.primary {
  background: #28a745;
  color: white;
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

.completion-section,
.submit-section {
  text-align: center;
}

.completion-card,
.submit-card {
  padding: 32px 24px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background: #f8f9fa;
}

.completion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.completion-card h3,
.submit-card h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.completion-card p,
.submit-card p {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin: 24px 0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat .label {
  font-size: 12px;
  color: #666;
}

.stat .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.submit-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
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

.error-section {
  margin-top: 24px;
}

.error-card {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  text-align: center;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  color: #721c24;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.success-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #28a745;
  color: white;
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .kyc-wizard {
    padding: 16px;
  }
  
  .steps-overview {
    gap: 8px;
  }
  
  .step-item {
    padding: 12px;
  }
  
  .step-card {
    padding: 16px;
  }
  
  .completion-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .submit-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>