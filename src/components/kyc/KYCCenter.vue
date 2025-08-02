<template>
  <div class="kyc-center">
    <div class="center-header">
      <h1 class="center-title">인증센터</h1>
      <p class="center-subtitle">안전한 거래를 위해 본인 인증을 완료해주세요</p>
    </div>

    <!-- KYC Status Overview -->
    <div class="status-overview">
      <div class="status-card" :class="getStatusClass()">
        <div class="status-icon">
          <span v-if="isKYCComplete">✅</span>
          <span v-else-if="kycStatus?.status === 'pending'">⏰</span>
          <span v-else-if="kycStatus?.status === 'rejected'">❌</span>
          <span v-else>🔄</span>
        </div>
        
        <div class="status-info">
          <h3 class="status-title">{{ getStatusTitle() }}</h3>
          <p class="status-description">{{ getStatusDescription() }}</p>
          
          <div class="status-details">
            <div class="detail-item">
              <span class="detail-label">인증 레벨:</span>
              <span class="detail-value">{{ getKYCLevelText(kycStatus?.level) }}</span>
            </div>
            <div v-if="kycStatus?.updated_at" class="detail-item">
              <span class="detail-label">최종 업데이트:</span>
              <span class="detail-value">{{ formatDate(kycStatus.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="progress-circle">
          <svg class="progress-ring" width="80" height="80">
            <circle
              class="progress-ring-background"
              stroke="#e9ecef"
              stroke-width="6"
              fill="transparent"
              r="34"
              cx="40"
              cy="40"
            />
            <circle
              class="progress-ring-progress"
              :stroke="getProgressColor()"
              stroke-width="6"
              fill="transparent"
              r="34"
              cx="40"
              cy="40"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="progressOffset"
            />
          </svg>
          <div class="progress-text">{{ progressPercentage }}%</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div v-if="!isKYCComplete" class="quick-actions">
      <button 
        class="action-button start-verification"
        @click="startVerification"
        :disabled="isLoading"
      >
        <span class="action-icon">🚀</span>
        <span class="action-text">인증 시작하기</span>
      </button>
      
      <button 
        v-if="kycStatus?.status === 'incomplete'"
        class="action-button continue-verification"
        @click="continueVerification"
        :disabled="isLoading"
      >
        <span class="action-icon">▶️</span>
        <span class="action-text">인증 이어하기</span>
      </button>
    </div>

    <!-- Verification Steps Overview -->
    <div class="steps-overview-section">
      <h3>인증 단계</h3>
      <div class="steps-grid">
        <div 
          v-for="step in verificationSteps" 
          :key="step.id"
          class="step-card"
          :class="getStepCardClass(step)"
        >
          <div class="step-header">
            <div class="step-number">{{ step.order }}</div>
            <div class="step-status-icon">
              <span v-if="step.status === 'completed'">✅</span>
              <span v-else-if="step.status === 'in_progress'">🔄</span>
              <span v-else-if="step.status === 'failed'">❌</span>
              <span v-else>⭕</span>
            </div>
          </div>
          
          <div class="step-content">
            <h4 class="step-title">{{ step.title }}</h4>
            <p class="step-description">{{ step.description }}</p>
            
            <div class="step-footer">
              <span class="step-status" :class="step.status">
                {{ getStatusText(step.status) }}
              </span>
              <span v-if="step.required" class="required-badge">필수</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KYC Verification Wizard Modal -->
    <div v-if="showWizard" class="wizard-modal">
      <div class="modal-backdrop" @click="closeWizard"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>본인 인증</h2>
          <button class="close-btn" @click="closeWizard">✕</button>
        </div>
        
        <div class="modal-body">
          <KYCVerificationWizard
            :user-id="userId"
            @completed="onVerificationCompleted"
            @cancelled="closeWizard"
          />
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>인증 정보를 불러오는 중...</p>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-section">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="refreshKYCData">
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
import KYCVerificationWizard from './KYCVerificationWizard.vue'

interface Props {
  userId: string
}

const props = defineProps<Props>()

// Composables
const {
  kycStatus,
  verificationSteps,
  isLoading,
  error,
  completedSteps,
  totalSteps,
  progressPercentage,
  isKYCComplete,
  getKYCStatus,
  initializeSteps
} = useKYC()

// State
const showWizard = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Computed
const circumference = computed(() => 2 * Math.PI * 34)
const progressOffset = computed(() => {
  const progress = progressPercentage.value / 100
  return circumference.value - (progress * circumference.value)
})

// Methods
const getStatusClass = () => {
  if (isKYCComplete.value) return 'status-completed'
  if (kycStatus.value?.status === 'pending') return 'status-pending'
  if (kycStatus.value?.status === 'rejected') return 'status-rejected'
  return 'status-incomplete'
}

const getStatusTitle = (): string => {
  if (isKYCComplete.value) return '인증 완료'
  if (kycStatus.value?.status === 'pending') return '검토 중'
  if (kycStatus.value?.status === 'rejected') return '인증 거부'
  return '인증 필요'
}

const getStatusDescription = (): string => {
  if (isKYCComplete.value) return '모든 인증이 완료되어 모든 서비스를 이용할 수 있습니다.'
  if (kycStatus.value?.status === 'pending') return '제출된 정보를 검토 중입니다. 1-2일 소요될 수 있습니다.'
  if (kycStatus.value?.status === 'rejected') return '인증이 거부되었습니다. 다시 시도해주세요.'
  return '계정 보안과 규정 준수를 위해 본인 인증이 필요합니다.'
}

const getKYCLevelText = (level?: string): string => {
  const levelMap = {
    'unverified': '미인증',
    'basic': '기본 인증',
    'intermediate': '중급 인증',
    'advanced': '고급 인증'
  }
  return levelMap[level as keyof typeof levelMap] || '미인증'
}

const getProgressColor = (): string => {
  if (isKYCComplete.value) return '#28a745'
  if (kycStatus.value?.status === 'pending') return '#ffc107'
  if (kycStatus.value?.status === 'rejected') return '#dc3545'
  return '#0d6efd'
}

const getStepCardClass = (step: any) => {
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

const startVerification = () => {
  showWizard.value = true
  
  securityLogger.log('KYC_VERIFICATION_STARTED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const continueVerification = () => {
  showWizard.value = true
  
  securityLogger.log('KYC_VERIFICATION_CONTINUED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const closeWizard = () => {
  showWizard.value = false
}

const onVerificationCompleted = async () => {
  showWizard.value = false
  showSuccessToast('인증이 성공적으로 완료되었습니다!')
  
  // Refresh KYC data
  await refreshKYCData()
  
  securityLogger.log('KYC_VERIFICATION_COMPLETED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const refreshKYCData = async () => {
  try {
    await getKYCStatus(props.userId)
  } catch (err) {
    console.error('Failed to refresh KYC data:', err)
  }
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

// Initialize
onMounted(async () => {
  await refreshKYCData()
})
</script>

<style scoped>
.kyc-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.center-header {
  text-align: center;
  margin-bottom: 40px;
}

.center-title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0 0 12px 0;
}

.center-subtitle {
  font-size: 18px;
  color: #666;
  margin: 0;
}

.status-overview {
  margin-bottom: 40px;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-card.status-completed {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 6px solid #28a745;
}

.status-card.status-pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 6px solid #ffc107;
}

.status-card.status-rejected {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);
  border-left: 6px solid #dc3545;
}

.status-card.status-incomplete {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 6px solid #0d6efd;
}

.status-icon {
  font-size: 48px;
  line-height: 1;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.status-description {
  font-size: 16px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  gap: 12px;
}

.detail-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  min-width: 100px;
}

.detail-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.progress-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-progress {
  transition: stroke-dashoffset 0.5s ease-in-out;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-button.start-verification {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.action-button.start-verification:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.action-button.continue-verification {
  background: linear-gradient(135deg, #0d6efd 0%, #6610f2 100%);
  color: white;
}

.action-button.continue-verification:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-icon {
  font-size: 18px;
}

.steps-overview-section {
  margin-bottom: 40px;
}

.steps-overview-section h3 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 24px 0;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.step-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.step-card.step-completed {
  border-color: #28a745;
  background: linear-gradient(135deg, #f8fff9 0%, #f0fff4 100%);
}

.step-card.step-current {
  border-color: #0d6efd;
  background: linear-gradient(135deg, #f8fbff 0%, #e3f2fd 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.2);
}

.step-card.step-failed {
  border-color: #dc3545;
  background: linear-gradient(135deg, #fff8f8 0%, #fdf2f2 100%);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #495057;
}

.step-card.step-completed .step-number {
  background: #28a745;
  color: white;
}

.step-card.step-current .step-number {
  background: #0d6efd;
  color: white;
}

.step-status-icon {
  font-size: 20px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.step-description {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.step-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.step-status.pending {
  background: #e9ecef;
  color: #495057;
}

.step-status.in_progress {
  background: #cff4fc;
  color: #055160;
}

.step-status.completed {
  background: #d4edda;
  color: #155724;
}

.step-status.failed {
  background: #f8d7da;
  color: #721c24;
}

.required-badge {
  padding: 2px 6px;
  background: #dc3545;
  color: white;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 500;
}

.wizard-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #6c757d;
}

.close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 0 24px 24px 24px;
  overflow-y: auto;
  max-height: calc(90vh - 100px);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-content {
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.spinner {
  width: 48px;
  height: 48px;
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

.loading-content p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.error-section {
  margin-top: 24px;
}

.error-card {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #721c24;
  margin: 0 0 20px 0;
}

.retry-btn {
  padding: 12px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  background: #c82333;
}

.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #28a745;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
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
  .kyc-center {
    padding: 16px;
  }
  
  .status-card {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  
  .status-details {
    align-items: center;
  }
  
  .detail-item {
    justify-content: center;
  }
  
  .quick-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .action-button {
    width: 100%;
    max-width: 300px;
  }
  
  .steps-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 10px;
    width: calc(100% - 20px);
  }
}
</style>