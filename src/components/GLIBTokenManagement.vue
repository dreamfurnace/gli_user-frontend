<template>
  <div class="glib-token-management">
    <!-- GLI-B 토큰 잔액 카드 -->
    <div class="token-card balance-card">
      <div class="card-header">
        <h3>💰 GLI-B 토큰 잔액</h3>
        <button 
          v-if="isConnected" 
          class="refresh-btn" 
          @click="refreshBalance" 
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner small"></span>
          <span v-else>🔄</span>
        </button>
      </div>

      <div class="balance-section">
        <div v-if="!isConnected" class="not-connected">
          <div class="warning-icon">⚠️</div>
          <h4>지갑이 연결되지 않았습니다</h4>
          <p>GLI-B 토큰 잔액을 확인하려면 지갑을 연결해주세요.</p>
          <button class="connect-btn" @click="connectWallet">
            지갑 연결하기
          </button>
        </div>

        <div v-else-if="isLoading" class="balance-loading">
          <div class="loading-spinner"></div>
          <span>잔액 확인 중...</span>
        </div>

        <div v-else class="balance-display">
          <div class="main-balance">
            <span class="balance-amount">{{ formattedBalance }}</span>
            <span class="balance-unit">GLI-B</span>
          </div>
          
          <div class="balance-info">
            <div class="info-row">
              <span class="label">지갑 주소:</span>
              <span class="value">{{ shortAddress }}</span>
              <button class="copy-btn" @click="copyAddress" :title="fullAddress">
                {{ copied ? '✅' : '📋' }}
              </button>
            </div>
            
            <div class="info-row">
              <span class="label">마지막 업데이트:</span>
              <span class="value">{{ lastUpdated }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isConnected" class="balance-actions">
        <button class="action-btn secondary" @click="viewTransactions">
          거래 내역
        </button>
        <button class="action-btn primary" @click="openTokenConverter">
          토큰 변환
        </button>
      </div>
    </div>

    <!-- GLI-L 토큰 잔액 카드 -->
    <div class="token-card glil-card">
      <div class="card-header">
        <h3>🛍️ GLI-L 토큰 잔액</h3>
        <button 
          v-if="isConnected" 
          class="refresh-btn" 
          @click="refreshGLILBalance" 
          :disabled="isGLILLoading"
        >
          <span v-if="isGLILLoading" class="loading-spinner small"></span>
          <span v-else>🔄</span>
        </button>
      </div>

      <div class="balance-section">
        <div v-if="!isConnected" class="not-connected">
          <div class="warning-icon">⚠️</div>
          <p>지갑을 연결하여 GLI-L 토큰 잔액을 확인하세요.</p>
        </div>

        <div v-else-if="isGLILLoading" class="balance-loading">
          <div class="loading-spinner"></div>
          <span>GLI-L 잔액 확인 중...</span>
        </div>

        <div v-else class="balance-display glil">
          <div class="main-balance">
            <span class="balance-amount">{{ formattedGLILBalance }}</span>
            <span class="balance-unit">GLI-L</span>
          </div>
          
          <div class="balance-usage">
            <span class="usage-text">쇼핑몰에서 사용 가능</span>
          </div>
        </div>
      </div>

      <div v-if="isConnected" class="balance-actions">
        <button class="action-btn secondary" @click="viewShoppingHistory">
          구매 내역
        </button>
        <router-link to="/shopping" class="action-btn primary">
          쇼핑하러 가기
        </router-link>
      </div>
    </div>

    <!-- 토큰 통계 카드 -->
    <div class="token-card stats-card">
      <div class="card-header">
        <h3>📊 토큰 활동 통계</h3>
      </div>

      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">💸</div>
          <div class="stat-content">
            <span class="stat-label">이번 달 투자</span>
            <span class="stat-value">{{ formatNumber(monthlyInvestment) }} GLEB</span>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">🛒</div>
          <div class="stat-content">
            <span class="stat-label">이번 달 쇼핑</span>
            <span class="stat-value">{{ formatNumber(monthlyShopping) }} GLIL</span>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">🔄</div>
          <div class="stat-content">
            <span class="stat-label">토큰 변환</span>
            <span class="stat-value">{{ tokenConversions }}회</span>
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-label">리워드 획득</span>
            <span class="stat-value">{{ formatNumber(totalRewards) }} GLEB</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 빠른 액션 카드 -->
    <div class="token-card quick-actions">
      <div class="card-header">
        <h3>⚡ 빠른 액션</h3>
      </div>

      <div class="action-grid">
        <button class="quick-action-btn" @click="quickInvest">
          <div class="action-icon">📈</div>
          <span>투자하기</span>
        </button>

        <button class="quick-action-btn" @click="quickShopping">
          <div class="action-icon">🛒</div>
          <span>쇼핑하기</span>
        </button>

        <button class="quick-action-btn" @click="quickConvert">
          <div class="action-icon">🔄</div>
          <span>토큰 변환</span>
        </button>

        <button class="quick-action-btn" @click="quickReward">
          <div class="action-icon">🎁</div>
          <span>리워드 받기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGLIBToken } from '../composables/useGLIBToken'
import { useGLILToken } from '../composables/useGLILToken'
import { useSolanaWallet } from '../composables/useSolanaWallet'

const router = useRouter()

// Composables
const { 
  glibBalance, 
  formattedBalance, 
  isLoading,
  updateGLIBBalance 
} = useGLIBToken()

const { 
  glilBalance, 
  formattedBalance: formattedGLILBalance,
  isLoading: isGLILLoading,
  updateGLILBalance 
} = useGLILToken()

const { 
  fullAddress, 
  isConnected,
  connect: connectWallet 
} = useSolanaWallet()

// 반응형 데이터
const copied = ref(false)
const lastUpdated = ref('')

// 임시 통계 데이터 (실제로는 API에서 가져올 것)
const monthlyInvestment = ref(1250.5)
const monthlyShopping = ref(89.3)
const tokenConversions = ref(7)
const totalRewards = ref(342.8)

// 계산된 속성
const shortAddress = computed(() => {
  if (!fullAddress.value) return ''
  return `${fullAddress.value.slice(0, 6)}...${fullAddress.value.slice(-4)}`
})

// 숫자 포맷팅
const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

// GLI-B 잔액 새로고침
const refreshBalance = async () => {
  if (fullAddress.value) {
    await updateGLIBBalance(fullAddress.value)
    lastUpdated.value = new Date().toLocaleTimeString('ko-KR')
  }
}

// GLI-L 잔액 새로고침
const refreshGLILBalance = async () => {
  if (fullAddress.value) {
    await updateGLILBalance(fullAddress.value)
  }
}

// 주소 복사
const copyAddress = async () => {
  if (fullAddress.value) {
    try {
      await navigator.clipboard.writeText(fullAddress.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
    }
  }
}

// 거래 내역 보기
const viewTransactions = () => {
  // TODO: 거래 내역 페이지로 이동
  console.log('View transactions')
}

// 쇼핑 내역 보기
const viewShoppingHistory = () => {
  // TODO: 쇼핑 내역 페이지로 이동
  console.log('View shopping history')
}

// 토큰 변환기 열기
const openTokenConverter = () => {
  // TODO: 토큰 변환 모달 또는 페이지 열기
  console.log('Open token converter')
}

// 빠른 액션들
const quickInvest = () => {
  router.push('/rwa-assets')
}

const quickShopping = () => {
  router.push('/shopping')
}

const quickConvert = () => {
  openTokenConverter()
}

const quickReward = () => {
  // TODO: 리워드 페이지로 이동
  console.log('Quick reward')
}

// 컴포넌트 마운트
onMounted(() => {
  if (isConnected.value && fullAddress.value) {
    refreshBalance()
    refreshGLILBalance()
  }
})
</script>

<style scoped>
.glib-token-management {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.token-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.token-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.refresh-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.not-connected {
  text-align: center;
  padding: 40px 20px;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.not-connected h4 {
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
}

.not-connected p {
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.connect-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.connect-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.balance-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: #6b7280;
}

.balance-display {
  text-align: center;
  padding: 20px 0;
}

.main-balance {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #059669;
}

.balance-unit {
  font-size: 1.25rem;
  color: #6b7280;
  font-weight: 500;
}

.balance-display.glil .balance-amount {
  color: #dc2626;
}

.balance-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
}

.info-row .label {
  color: #6b7280;
}

.info-row .value {
  color: #111827;
  font-weight: 500;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 0.875rem;
  transition: transform 0.2s;
}

.copy-btn:hover {
  transform: scale(1.1);
}

.balance-usage {
  margin-bottom: 16px;
}

.usage-text {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
}

.balance-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
}

.action-btn.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
}

.stats-card {
  grid-column: 1 / -1;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.quick-actions {
  grid-column: 1 / -1;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.quick-action-btn:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 1.5rem;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .glib-token-management {
    grid-template-columns: 1fr;
  }
  
  .balance-actions {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>