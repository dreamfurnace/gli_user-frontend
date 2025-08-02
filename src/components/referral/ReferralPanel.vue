<template>
  <div class="referral-panel">
    <div class="panel-header">
      <h2 class="panel-title">친구 초대하기</h2>
      <p class="panel-subtitle">친구를 초대하고 GLI-B 토큰 보상을 받으세요!</p>
    </div>

    <div class="referral-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>레퍼럴 정보를 불러오는 중...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-button" @click="refreshReferralData">
          다시 시도
        </button>
      </div>

      <!-- Main Content -->
      <div v-else class="referral-main">
        <!-- Referral Code Display -->
        <div class="referral-code-card">
          <div class="card-header">
            <h3>나의 초대 코드</h3>
            <span v-if="isCodeActive" class="status-badge active">활성</span>
            <span v-else class="status-badge inactive">비활성</span>
          </div>
          
          <div class="code-display-large">
            <span class="referral-code">{{ formattedReferralCode || '코드 생성 중...' }}</span>
          </div>
          
          <div class="code-actions">
            <button 
              class="action-button primary" 
              @click="openShareModal"
              :disabled="!hasReferralCode"
            >
              📤 공유하기
            </button>
            <button 
              class="action-button secondary" 
              @click="copyReferralCode"
              :disabled="!hasReferralCode || copyingCode"
            >
              {{ copyingCode ? '복사 중...' : (codeCopied ? '✅ 복사됨' : '📋 복사') }}
            </button>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats" v-if="referralStats">
          <div class="stat-item">
            <div class="stat-number">{{ referralStats.total_referrals }}</div>
            <div class="stat-label">총 초대</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ referralStats.confirmed_referrals }}</div>
            <div class="stat-label">가입 완료</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ formatGLIBAmount(referralStats.total_rewards_glib) }}</div>
            <div class="stat-label">받은 보상</div>
          </div>
        </div>

        <!-- Recent Referrals -->
        <div class="recent-referrals" v-if="referralHistory.length > 0">
          <h3>최근 초대 내역</h3>
          <div class="referral-list">
            <div 
              v-for="referral in referralHistory.slice(0, 3)" 
              :key="referral.id"
              class="referral-item"
            >
              <div class="referral-info">
                <div class="referral-date">
                  {{ formatDate(referral.created_at) }}
                </div>
                <div class="referral-status" :class="referral.status">
                  {{ getStatusText(referral.status) }}
                </div>
              </div>
              <div class="referral-reward">
                <span v-if="referral.status === 'rewarded'" class="reward-amount">
                  +{{ referral.reward_amount_glib }} GLI-B
                </span>
                <span v-else class="reward-pending">
                  보상 대기중
                </span>
              </div>
            </div>
          </div>
          <button class="view-all-button" @click="showHistoryTable = true">
            전체 내역 보기
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>아직 초대한 친구가 없습니다</h3>
          <p>친구들에게 초대 코드를 공유하고<br>함께 GLI 플랫폼을 즐겨보세요!</p>
          <button class="start-inviting-button" @click="openShareModal">
            지금 초대하기
          </button>
        </div>
      </div>
    </div>

    <!-- Referral Charts -->
    <ReferralCharts 
      :user-id="userId"
    />

    <!-- Referral Rewards Panel -->
    <ReferralRewardsPanel 
      :user-id="userId"
      @viewAllRewards="handleViewAllRewards"
    />

    <!-- Referral History Table -->
    <ReferralHistoryTable 
      v-if="showHistoryTable"
      :user-id="userId"
    />

    <!-- Share Modal -->
    <ReferralShareModal
      :show="showShareModal"
      :referral-code="referralCode?.code"
      :user-id="userId"
      @close="closeShareModal"
    />

    <!-- Success Message -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReferral } from '@/composables/useReferral'
import { useGLIBToken } from '@/composables/useGLIBToken'
import { securityLogger } from '@/utils/security'
import ReferralShareModal from './ReferralShareModal.vue'
import ReferralRewardsPanel from './ReferralRewardsPanel.vue'
import ReferralCharts from './ReferralCharts.vue'
import ReferralHistoryTable from './ReferralHistoryTable.vue'

interface Props {
  userId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewAllReferrals: []
}>()

// Composables
const { 
  referralCode,
  referralStats, 
  referralHistory,
  isLoading,
  error,
  hasReferralCode,
  formattedReferralCode,
  isCodeActive,
  getReferralCode,
  getReferralStats,
  getReferralHistory
} = useReferral()

const { formatGLIBAmount } = useGLIBToken()

// State
const showShareModal = ref(false)
const showHistoryTable = ref(false)
const copyingCode = ref(false)
const codeCopied = ref(false)
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Methods
const refreshReferralData = async () => {
  try {
    await getReferralCode(props.userId)
    await getReferralStats(props.userId)
    await getReferralHistory(props.userId, 1, 10)
  } catch (err) {
    console.error('Failed to refresh referral data:', err)
  }
}

const openShareModal = () => {
  if (!hasReferralCode.value) {
    alert('레퍼럴 코드를 먼저 생성해주세요.')
    return
  }
  
  showShareModal.value = true
  
  // Log share modal open
  securityLogger.log('REFERRAL_SHARE_MODAL_OPENED', {
    userId: props.userId,
    timestamp: new Date().toISOString()
  })
}

const closeShareModal = () => {
  showShareModal.value = false
}

const copyReferralCode = async () => {
  if (!referralCode.value?.code) return
  
  try {
    copyingCode.value = true
    await navigator.clipboard.writeText(referralCode.value.code)
    codeCopied.value = true
    
    showSuccessToast('초대 코드가 클립보드에 복사되었습니다!')
    
    // Log copy event
    securityLogger.log('REFERRAL_CODE_COPIED', {
      userId: props.userId,
      method: 'panel_copy',
      timestamp: new Date().toISOString()
    })
    
    setTimeout(() => {
      codeCopied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy referral code:', error)
    alert('복사에 실패했습니다.')
  } finally {
    copyingCode.value = false
  }
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusText = (status: string): string => {
  const statusMap = {
    'pending': '가입 대기',
    'confirmed': '가입 완료',
    'rewarded': '보상 지급',
    'expired': '만료됨'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const handleViewAllRewards = () => {
  // TODO: Implement full reward history view
  console.log('View all rewards clicked')
  // 전체 보상 내역을 보여주는 모달 또는 별도 페이지로 이동
}

// Initialize data
onMounted(async () => {
  await refreshReferralData()
})
</script>

<style scoped>
.referral-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  text-align: center;
  margin-bottom: 32px;
}

.panel-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.panel-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
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

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-message {
  color: #dc3545;
  margin-bottom: 16px;
}

.retry-button {
  padding: 12px 24px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.retry-button:hover {
  background: #0b5ed7;
}

.referral-code-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
  border: 1px solid rgba(40, 167, 69, 0.3);
}

.status-badge.inactive {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  border: 1px solid rgba(220, 53, 69, 0.3);
}

.code-display-large {
  margin: 20px 0;
}

.referral-code {
  font-family: 'Courier New', monospace;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 3px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.code-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.action-button.primary {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
}

.action-button.primary:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-button.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #0d6efd;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.recent-referrals h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.referral-list {
  margin-bottom: 16px;
}

.referral-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.referral-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.referral-date {
  font-size: 14px;
  color: #333;
}

.referral-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  width: fit-content;
}

.referral-status.pending {
  background: #fff3cd;
  color: #856404;
}

.referral-status.confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.referral-status.rewarded {
  background: #d4edda;
  color: #155724;
}

.referral-status.expired {
  background: #f8d7da;
  color: #721c24;
}

.reward-amount {
  font-weight: bold;
  color: #28a745;
}

.reward-pending {
  font-size: 12px;
  color: #666;
}

.view-all-button {
  width: 100%;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  transition: background 0.2s;
}

.view-all-button:hover {
  background: #e9ecef;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.empty-state p {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.start-inviting-button {
  padding: 14px 28px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.start-inviting-button:hover {
  background: #0b5ed7;
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
  z-index: 1000;
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
  .referral-panel {
    padding: 16px;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .code-actions {
    flex-direction: column;
  }
  
  .referral-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .referral-code {
    font-size: 18px;
    letter-spacing: 1px;
  }
}
</style>