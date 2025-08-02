<template>
  <div class="face-verification-section">
    <div class="section-header">
      <div class="header-content">
        <h3 class="section-title">얼굴 인증</h3>
        <p class="section-description">
          생체 인증으로 보안을 한층 더 강화하세요
        </p>
      </div>
      <div class="security-badge">
        <span class="badge-icon">🔐</span>
        <span class="badge-text">최고 보안</span>
      </div>
    </div>

    <!-- Verification Status Card -->
    <div class="status-card" :class="getStatusCardClass()">
      <div class="status-content">
        <div class="status-icon">
          <span v-if="isVerified">✅</span>
          <span v-else-if="verificationStatus === 'pending'">⏰</span>
          <span v-else-if="verificationStatus === 'failed'">❌</span>
          <span v-else>🎯</span>
        </div>
        
        <div class="status-info">
          <h4 class="status-title">{{ getStatusTitle() }}</h4>
          <p class="status-description">{{ getStatusDescription() }}</p>
          
          <div v-if="lastVerificationTime" class="status-details">
            <div class="detail-row">
              <span class="detail-label">최근 인증:</span>
              <span class="detail-value">{{ formatVerificationTime(lastVerificationTime) }}</span>
            </div>
            <div v-if="verificationConfidence" class="detail-row">
              <span class="detail-label">신뢰도:</span>
              <span class="detail-value">{{ Math.round(verificationConfidence * 100) }}%</span>
            </div>
          </div>
        </div>

        <div class="status-actions">
          <button 
            v-if="!isVerified"
            class="verify-btn primary"
            @click="startVerification"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner">⏳</span>
            {{ isLoading ? '처리 중...' : '얼굴 인증 시작' }}
          </button>
          
          <button 
            v-else
            class="verify-btn secondary"
            @click="startReverification"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-spinner">⏳</span>
            {{ isLoading ? '처리 중...' : '재인증' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Benefits Section -->
    <div class="benefits-section">
      <h4 class="benefits-title">얼굴 인증 혜택</h4>
      <div class="benefits-grid">
        <div class="benefit-item">
          <div class="benefit-icon">🛡️</div>
          <div class="benefit-content">
            <h5>향상된 보안</h5>
            <p>생체 정보를 통한 강력한 계정 보호</p>
          </div>
        </div>
        
        <div class="benefit-item">
          <div class="benefit-icon">⚡</div>
          <div class="benefit-content">
            <h5>빠른 인증</h5>
            <p>패스워드 없이 빠르고 편리한 로그인</p>
          </div>
        </div>
        
        <div class="benefit-item">
          <div class="benefit-icon">🎯</div>
          <div class="benefit-content">
            <h5>정확한 식별</h5>
            <p>고도의 정확성으로 본인만 접근 가능</p>
          </div>
        </div>
        
        <div class="benefit-item">
          <div class="benefit-icon">🔒</div>
          <div class="benefit-content">
            <h5>개인정보 보호</h5>
            <p>얼굴 데이터는 로컬에서만 처리</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Verification History -->
    <div v-if="verificationHistory.length > 0" class="history-section">
      <h4 class="history-title">인증 기록</h4>
      <div class="history-list">
        <div 
          v-for="record in verificationHistory.slice(0, 5)" 
          :key="record.id"
          class="history-item"
        >
          <div class="history-status">
            <span 
              class="status-dot" 
              :class="{ 
                success: record.verified, 
                failure: !record.verified 
              }"
            ></span>
            <span class="status-text">
              {{ record.verified ? '인증 성공' : '인증 실패' }}
            </span>
          </div>
          
          <div class="history-details">
            <div class="history-time">{{ formatHistoryTime(record.timestamp) }}</div>
            <div v-if="record.verified" class="history-confidence">
              신뢰도: {{ Math.round(record.confidence * 100) }}%
            </div>
          </div>
        </div>
      </div>
      
      <button 
        v-if="verificationHistory.length > 5"
        class="view-all-btn"
        @click="showAllHistory = !showAllHistory"
      >
        {{ showAllHistory ? '접기' : `전체 기록 보기 (${verificationHistory.length}개)` }}
      </button>
    </div>

    <!-- Privacy Information -->
    <div class="privacy-section">
      <div class="privacy-card">
        <div class="privacy-icon">🔐</div>
        <div class="privacy-content">
          <h5>개인정보 보호 정책</h5>
          <ul class="privacy-list">
            <li>얼굴 데이터는 기기에서만 처리됩니다</li>
            <li>원본 이미지는 서버로 전송되지 않습니다</li>
            <li>암호화된 특징점만 안전하게 저장됩니다</li>
            <li>언제든지 인증 데이터를 삭제할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Face Verification Modal -->
    <FaceVerificationModal
      v-if="showVerificationModal"
      :user-id="userId"
      :show="showVerificationModal"
      @close="closeVerificationModal"
      @completed="onVerificationCompleted"
      @failed="onVerificationFailed"
    />

    <!-- Success Toast -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>

    <!-- Error Toast -->
    <div v-if="showErrorMessage" class="error-toast">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { profileAPI } from '@/services/api'
import { securityLogger } from '@/utils/security'
import FaceVerificationModal from './FaceVerificationModal.vue'
import type { FaceVerificationResult } from '@/composables/useFaceVerification'

interface Props {
  userId: string
}

interface VerificationRecord {
  id: string
  verified: boolean
  confidence: number
  timestamp: string
  attempts: number
  errorMessage?: string
}

const props = defineProps<Props>()

// State
const isLoading = ref(false)
const verificationStatus = ref<'none' | 'pending' | 'verified' | 'failed'>('none')
const lastVerificationTime = ref<string>('')
const verificationConfidence = ref<number>(0)
const verificationHistory = ref<VerificationRecord[]>([])
const showVerificationModal = ref(false)
const showAllHistory = ref(false)
const showSuccessMessage = ref(false)
const showErrorMessage = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Computed
const isVerified = computed(() => verificationStatus.value === 'verified')

const getStatusCardClass = () => {
  return {
    'status-verified': isVerified.value,
    'status-pending': verificationStatus.value === 'pending',
    'status-failed': verificationStatus.value === 'failed',
    'status-none': verificationStatus.value === 'none'
  }
}

const getStatusTitle = (): string => {
  switch (verificationStatus.value) {
    case 'verified':
      return '얼굴 인증 완료'
    case 'pending':
      return '인증 처리 중'
    case 'failed':
      return '인증 실패'
    default:
      return '얼굴 인증 미완료'
  }
}

const getStatusDescription = (): string => {
  switch (verificationStatus.value) {
    case 'verified':
      return '얼굴 인증이 성공적으로 완료되어 최고 수준의 보안이 적용되었습니다.'
    case 'pending':
      return '얼굴 인증을 처리하고 있습니다. 잠시만 기다려주세요.'
    case 'failed':
      return '얼굴 인증에 실패했습니다. 다시 시도해주세요.'
    default:
      return '얼굴 인증을 통해 계정 보안을 한층 더 강화할 수 있습니다.'
  }
}

// Methods
const loadVerificationStatus = async () => {
  try {
    isLoading.value = true
    
    const response = await profileAPI.getFaceVerificationStatus(props.userId)
    const data = response.data
    
    verificationStatus.value = data.status
    lastVerificationTime.value = data.lastVerificationTime
    verificationConfidence.value = data.confidence || 0
    
    // Load verification history
    const historyResponse = await profileAPI.getFaceVerificationHistory(props.userId)
    verificationHistory.value = historyResponse.data.records || []
    
  } catch (err: any) {
    console.error('Failed to load verification status:', err)
    verificationStatus.value = 'none'
  } finally {
    isLoading.value = false
  }
}

const startVerification = () => {
  showVerificationModal.value = true
  
  securityLogger.log('FACE_VERIFICATION_INITIATED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const startReverification = () => {
  showVerificationModal.value = true
  
  securityLogger.log('FACE_REVERIFICATION_INITIATED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const closeVerificationModal = () => {
  showVerificationModal.value = false
}

const onVerificationCompleted = async (result: FaceVerificationResult) => {
  showVerificationModal.value = false
  
  // Update local status
  verificationStatus.value = 'verified'
  lastVerificationTime.value = result.timestamp
  verificationConfidence.value = result.confidence
  
  // Add to history
  verificationHistory.value.unshift({
    id: Date.now().toString(),
    verified: true,
    confidence: result.confidence,
    timestamp: result.timestamp,
    attempts: result.attempts
  })
  
  showSuccessToast('얼굴 인증이 성공적으로 완료되었습니다!')
  
  securityLogger.log('FACE_VERIFICATION_SUCCESS_UI', {
    userId: props.userId,
    confidence: result.confidence,
    timestamp: new Date().toISOString()
  })
}

const onVerificationFailed = (error: string) => {
  showVerificationModal.value = false
  
  // Update local status
  verificationStatus.value = 'failed'
  
  // Add to history
  verificationHistory.value.unshift({
    id: Date.now().toString(),
    verified: false,
    confidence: 0,
    timestamp: new Date().toISOString(),
    attempts: 1,
    errorMessage: error
  })
  
  showErrorToast(error || '얼굴 인증에 실패했습니다.')
  
  securityLogger.log('FACE_VERIFICATION_FAILED_UI', {
    userId: props.userId,
    error,
    timestamp: new Date().toISOString()
  })
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const showErrorToast = (message: string) => {
  errorMessage.value = message
  showErrorMessage.value = true
  
  setTimeout(() => {
    showErrorMessage.value = false
  }, 3000)
}

const formatVerificationTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '오늘'
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    return `${diffDays}일 전`
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

const formatHistoryTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
onMounted(async () => {
  await loadVerificationStatus()
})
</script>

<style scoped>
.face-verification-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-content {
  flex: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.section-description {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.security-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.badge-icon {
  font-size: 14px;
}

.status-card {
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  transition: all 0.3s ease;
}

.status-card.status-verified {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
}

.status-card.status-pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border-left: 4px solid #ffc107;
}

.status-card.status-failed {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%);
  border-left: 4px solid #dc3545;
}

.status-card.status-none {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid #2196f3;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-icon {
  font-size: 40px;
  line-height: 1;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.status-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-row {
  display: flex;
  gap: 8px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 60px;
}

.detail-value {
  font-size: 12px;
  color: #333;
  font-weight: 600;
}

.status-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.verify-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 140px;
}

.verify-btn.primary {
  background: #0d6efd;
  color: white;
}

.verify-btn.primary:hover:not(:disabled) {
  background: #0b5ed7;
}

.verify-btn.secondary {
  background: #6c757d;
  color: white;
}

.verify-btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.benefits-section {
  margin-bottom: 32px;
}

.benefits-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.benefit-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.benefit-content h5 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.benefit-content p {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.3;
}

.history-section {
  margin-bottom: 32px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.history-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.success {
  background: #28a745;
}

.status-dot.failure {
  background: #dc3545;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.history-details {
  text-align: right;
}

.history-time {
  font-size: 12px;
  color: #666;
}

.history-confidence {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.view-all-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  color: #0d6efd;
  font-size: 14px;
}

.view-all-btn:hover {
  background: #f8f9fa;
}

.privacy-section {
  border-top: 1px solid #e9ecef;
  padding-top: 24px;
}

.privacy-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.privacy-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.privacy-content h5 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.privacy-list {
  margin: 0;
  padding-left: 16px;
  color: #666;
}

.privacy-list li {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.success-toast,
.error-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 300px;
}

.success-toast {
  background: #28a745;
  color: white;
}

.error-toast {
  background: #dc3545;
  color: white;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .status-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .status-actions {
    width: 100%;
  }
  
  .verify-btn {
    width: 100%;
  }
  
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .history-details {
    text-align: left;
    width: 100%;
  }
  
  .privacy-card {
    flex-direction: column;
    text-align: center;
  }
}
</style>