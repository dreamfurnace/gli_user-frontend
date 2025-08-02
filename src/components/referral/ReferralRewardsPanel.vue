<template>
  <div class="rewards-panel">
    <div class="panel-header">
      <h3 class="panel-title">GLI-B 토큰 보상</h3>
      <button 
        v-if="hasPendingRewards" 
        class="claim-all-btn"
        @click="processAllRewards"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="loading-spinner">⏳</span>
        <span v-else>💰</span>
        모든 보상 수령
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !hasStats" class="loading-state">
      <div class="spinner"></div>
      <p>보상 정보를 불러오는 중...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="refreshRewardData">
        다시 시도
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="rewards-content">
      <!-- Reward Stats Overview -->
      <div class="stats-overview">
        <div class="stat-card total-earned">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatGLIBAmount(rewardStats?.total_rewards_earned || 0) }}</div>
            <div class="stat-label">총 획득 보상</div>
          </div>
        </div>
        
        <div class="stat-card pending-rewards">
          <div class="stat-icon">⏰</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatGLIBAmount(totalPendingAmount) }}</div>
            <div class="stat-label">대기 중 보상</div>
          </div>
        </div>
        
        <div class="stat-card monthly-rewards">
          <div class="stat-icon">📅</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatGLIBAmount(rewardStats?.monthly_rewards || 0) }}</div>
            <div class="stat-label">이번 달 보상</div>
          </div>
        </div>
        
        <div class="stat-card reward-rate">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-value">{{ ((rewardStats?.reward_rate || 0) * 100).toFixed(1) }}%</div>
            <div class="stat-label">보상 전환율</div>
          </div>
        </div>
      </div>

      <!-- Reward Configuration Info -->
      <div v-if="rewardConfig" class="config-info">
        <h4>보상 정책</h4>
        <div class="config-details">
          <div class="config-item">
            <span class="config-label">기본 보상:</span>
            <span class="config-value">{{ formatGLIBAmount(rewardConfig.base_reward_glib) }} GLI-B</span>
          </div>
          <div class="config-item">
            <span class="config-label">보너스 보상:</span>
            <span class="config-value">{{ formatGLIBAmount(rewardConfig.bonus_reward_glib) }} GLI-B</span>
          </div>
          <div class="config-item">
            <span class="config-label">보너스 조건:</span>
            <span class="config-value">{{ rewardConfig.bonus_threshold_referrals }}명 이상 추천</span>
          </div>
          <div class="config-item">
            <span class="config-label">월 최대 보상:</span>
            <span class="config-value">{{ formatGLIBAmount(rewardConfig.max_rewards_per_month) }} GLI-B</span>
          </div>
        </div>
      </div>

      <!-- Pending Rewards -->
      <div v-if="hasPendingRewards" class="pending-rewards-section">
        <h4>수령 대기 중인 보상</h4>
        <div class="rewards-list">
          <div 
            v-for="reward in pendingRewards" 
            :key="reward.id"
            class="reward-item"
          >
            <div class="reward-info">
              <div class="reward-type">
                <span class="type-badge" :class="reward.reward_type">
                  {{ getRewardTypeText(reward.reward_type) }}
                </span>
                <span class="reward-date">{{ formatDate(reward.created_at) }}</span>
              </div>
              <div class="reward-amount">
                <span class="amount">+{{ formatGLIBAmount(reward.reward_amount_glib) }}</span>
                <span class="unit">GLI-B</span>
              </div>
            </div>
            <div class="reward-actions">
              <span class="status" :class="getStatusColor(reward.status)">
                {{ getStatusText(reward.status) }}
              </span>
              <button 
                v-if="reward.status === 'pending'"
                class="claim-btn"
                @click="claimReward(reward.id)"
                :disabled="isLoading"
              >
                수령
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Reward History -->
      <div v-if="rewardHistory.length > 0" class="reward-history-section">
        <h4>최근 보상 내역</h4>
        <div class="history-list">
          <div 
            v-for="reward in rewardHistory.slice(0, 5)" 
            :key="reward.id"
            class="history-item"
          >
            <div class="history-info">
              <div class="history-type">
                <span class="type-badge" :class="reward.reward_type">
                  {{ getRewardTypeText(reward.reward_type) }}
                </span>
                <span class="history-date">{{ formatDate(reward.created_at) }}</span>
              </div>
              <div class="history-amount">
                <span class="amount">+{{ formatGLIBAmount(reward.reward_amount_glib) }}</span>
                <span class="unit">GLI-B</span>
              </div>
            </div>
            <div class="history-status">
              <span class="status" :class="getStatusColor(reward.status)">
                {{ getStatusText(reward.status) }}
              </span>
              <div v-if="reward.transaction_hash" class="tx-hash">
                <button class="hash-btn" @click="copyToClipboard(reward.transaction_hash)">
                  {{ formatHash(reward.transaction_hash) }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="view-all-btn" @click="$emit('viewAllRewards')">
          전체 보상 내역 보기
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="!hasPendingRewards && rewardHistory.length === 0" class="empty-state">
        <div class="empty-icon">🎁</div>
        <h3>아직 받을 수 있는 보상이 없습니다</h3>
        <p>친구들을 초대하여 GLI-B 토큰 보상을 받아보세요!</p>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useReferralRewards } from '@/composables/useReferralRewards'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  viewAllRewards: []
}>()

// Composables
const {
  rewardConfig,
  rewardStats,
  pendingRewards,
  rewardHistory,
  totalPendingAmount,
  hasPendingRewards,
  hasStats,
  isLoading,
  error,
  getRewardConfig,
  getRewardStats,
  getPendingRewards,
  getRewardHistory,
  processReward,
  processAllPendingRewards,
  formatGLIBAmount,
  getStatusText,
  getStatusColor
} = useReferralRewards()

// State
const showSuccessMessage = ref(false)
const successMessage = ref('')

// Methods
const refreshRewardData = async () => {
  try {
    await Promise.all([
      getRewardConfig(),
      getRewardStats(props.userId),
      getPendingRewards(props.userId),
      getRewardHistory(props.userId, 1, 10)
    ])
  } catch (err) {
    console.error('Failed to refresh reward data:', err)
  }
}

const claimReward = async (rewardId: string) => {
  try {
    const success = await processReward(rewardId)
    if (success) {
      showSuccessToast('보상이 성공적으로 처리되었습니다!')
      
      // Log successful claim
      securityLogger.log('REFERRAL_REWARD_CLAIMED', {
        userId: props.userId,
        rewardId,
        timestamp: new Date().toISOString()
      })
      
      // Refresh data
      await refreshRewardData()
    } else {
      showSuccessToast('보상 처리에 실패했습니다. 다시 시도해주세요.')
    }
  } catch (err) {
    console.error('Failed to claim reward:', err)
    showSuccessToast('보상 처리 중 오류가 발생했습니다.')
  }
}

const processAllRewards = async () => {
  try {
    const result = await processAllPendingRewards(props.userId)
    if (result.processed > 0) {
      showSuccessToast(`${result.processed}개의 보상이 처리되었습니다!`)
      
      // Log batch claim
      securityLogger.log('REFERRAL_BATCH_REWARDS_CLAIMED', {
        userId: props.userId,
        processed: result.processed,
        failed: result.failed,
        timestamp: new Date().toISOString()
      })
      
      if (result.failed > 0) {
        setTimeout(() => {
          showSuccessToast(`${result.failed}개의 보상 처리에 실패했습니다.`)
        }, 3000)
      }
    } else {
      showSuccessToast('처리할 수 있는 보상이 없습니다.')
    }
  } catch (err) {
    console.error('Failed to process all rewards:', err)
    showSuccessToast('일괄 보상 처리 중 오류가 발생했습니다.')
  }
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccessToast('트랜잭션 해시가 클립보드에 복사되었습니다!')
  } catch (error) {
    console.error('Failed to copy transaction hash:', error)
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatHash = (hash: string): string => {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const getRewardTypeText = (type: string): string => {
  const typeMap = {
    'base': '기본 보상',
    'bonus': '보너스 보상',
    'special': '특별 보상'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

// Initialize data
onMounted(async () => {
  await refreshRewardData()
})
</script>

<style scoped>
.rewards-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.claim-all-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.claim-all-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.claim-all-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  animation: spin 1s linear infinite;
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #0d6efd;
}

.stat-card.total-earned {
  border-left-color: #28a745;
}

.stat-card.pending-rewards {
  border-left-color: #ffc107;
}

.stat-card.monthly-rewards {
  border-left-color: #17a2b8;
}

.stat-card.reward-rate {
  border-left-color: #6f42c1;
}

.stat-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.config-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
}

.config-info h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.config-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.config-label {
  color: #666;
  font-size: 14px;
}

.config-value {
  font-weight: 600;
  color: #333;
}

.pending-rewards-section,
.reward-history-section {
  margin-bottom: 32px;
}

.pending-rewards-section h4,
.reward-history-section h4 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.rewards-list,
.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.reward-item,
.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.reward-info,
.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reward-type,
.history-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-badge.base {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.bonus {
  background: #fff3e0;
  color: #f57c00;
}

.type-badge.special {
  background: #f3e5f5;
  color: #7b1fa2;
}

.reward-date,
.history-date {
  font-size: 12px;
  color: #666;
}

.reward-amount,
.history-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount {
  font-size: 18px;
  font-weight: 700;
  color: #28a745;
}

.unit {
  font-size: 14px;
  color: #666;
}

.reward-actions,
.history-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-processing {
  background: #cff4fc;
  color: #055160;
}

.status-success {
  background: #d1ecf1;
  color: #0c5460;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.status-expired {
  background: #e2e3e5;
  color: #41464b;
}

.claim-btn {
  padding: 6px 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

.claim-btn:hover:not(:disabled) {
  background: #218838;
}

.tx-hash {
  margin-top: 4px;
}

.hash-btn {
  background: none;
  border: none;
  color: #0d6efd;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-decoration: underline;
}

.view-all-btn {
  width: 100%;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  color: #333;
  transition: background 0.2s;
}

.view-all-btn:hover {
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
  margin: 0;
  line-height: 1.5;
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
  .rewards-panel {
    padding: 16px;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .config-details {
    grid-template-columns: 1fr;
  }
  
  .reward-item,
  .history-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .reward-actions,
  .history-status {
    align-self: stretch;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>