<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>거래 상세 정보</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div v-if="transaction" class="modal-body">
        <!-- 거래 기본 정보 -->
        <div class="detail-section">
          <h3 class="section-title">기본 정보</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">거래 ID</span>
              <span class="detail-value">
                {{ transaction.id }}
                <button class="copy-btn" @click="copyToClipboard(transaction.id)">
                  {{ copied === transaction.id ? '✅' : '📋' }}
                </button>
              </span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">거래 유형</span>
              <div class="type-badge" :class="transaction.type">
                <span class="type-icon">{{ getTypeIcon(transaction.type) }}</span>
                <span class="type-text">{{ getTypeText(transaction.type) }}</span>
              </div>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">상태</span>
              <span class="status-badge" :class="transaction.status">
                {{ getStatusText(transaction.status) }}
              </span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">거래일시</span>
              <span class="detail-value">
                {{ formatDateTime(transaction.date) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 금액 정보 -->
        <div class="detail-section">
          <h3 class="section-title">금액 정보</h3>
          <div class="amount-section">
            <div class="amount-display">
              <span class="amount-label">거래 금액</span>
              <div class="amount-value" :class="{ 
                positive: transaction.amount > 0, 
                negative: transaction.amount < 0 
              }">
                <span class="amount">
                  {{ transaction.amount >= 0 ? '+' : '' }}{{ formatAmount(Math.abs(transaction.amount)) }}
                </span>
                <span class="currency">{{ transaction.currency }}</span>
              </div>
            </div>
            
            <!-- 수수료 정보 (있는 경우) -->
            <div v-if="transaction.metadata?.fee" class="fee-info">
              <span class="fee-label">수수료</span>
              <span class="fee-value">{{ formatAmount(transaction.metadata.fee) }} {{ transaction.currency }}</span>
            </div>
          </div>
        </div>

        <!-- 거래 상세 정보 -->
        <div class="detail-section">
          <h3 class="section-title">거래 상세</h3>
          <div class="description-section">
            <div class="description-main">
              {{ transaction.description }}
            </div>
            
            <!-- 메타데이터 정보 -->
            <div v-if="transaction.metadata" class="metadata-section">
              <div v-if="transaction.type === 'investment'" class="investment-details">
                <div class="metadata-item">
                  <span class="metadata-label">투자 자산</span>
                  <span class="metadata-value">{{ transaction.metadata.assetName }}</span>
                </div>
                <div v-if="transaction.metadata.expectedAPY" class="metadata-item">
                  <span class="metadata-label">예상 APY</span>
                  <span class="metadata-value">{{ transaction.metadata.expectedAPY }}%</span>
                </div>
                <div v-if="transaction.metadata.investmentPeriod" class="metadata-item">
                  <span class="metadata-label">투자 기간</span>
                  <span class="metadata-value">{{ transaction.metadata.investmentPeriod }}개월</span>
                </div>
              </div>
              
              <div v-else-if="transaction.type === 'shopping'" class="shopping-details">
                <div class="metadata-item">
                  <span class="metadata-label">상품명</span>
                  <span class="metadata-value">{{ transaction.metadata.productName }}</span>
                </div>
                <div v-if="transaction.metadata.quantity" class="metadata-item">
                  <span class="metadata-label">수량</span>
                  <span class="metadata-value">{{ transaction.metadata.quantity }}개</span>
                </div>
                <div v-if="transaction.metadata.orderNumber" class="metadata-item">
                  <span class="metadata-label">주문번호</span>
                  <span class="metadata-value">{{ transaction.metadata.orderNumber }}</span>
                </div>
              </div>
              
              <div v-else-if="transaction.type === 'token_conversion'" class="conversion-details">
                <div class="conversion-flow">
                  <div class="conversion-token from">
                    <span class="token-label">변환 전</span>
                    <span class="token-value">{{ transaction.metadata.fromToken }}</span>
                    <span class="token-amount">{{ formatAmount(transaction.metadata.fromAmount) }}</span>
                  </div>
                  <div class="conversion-arrow">→</div>
                  <div class="conversion-token to">
                    <span class="token-label">변환 후</span>
                    <span class="token-value">{{ transaction.metadata.toToken }}</span>
                    <span class="token-amount">{{ formatAmount(transaction.metadata.toAmount) }}</span>
                  </div>
                </div>
                <div v-if="transaction.metadata.exchangeRate" class="metadata-item">
                  <span class="metadata-label">환율</span>
                  <span class="metadata-value">1 {{ transaction.metadata.fromToken }} = {{ transaction.metadata.exchangeRate }} {{ transaction.metadata.toToken }}</span>
                </div>
              </div>
              
              <div v-else-if="transaction.type === 'reward'" class="reward-details">
                <div v-if="transaction.metadata.rewardType" class="metadata-item">
                  <span class="metadata-label">리워드 유형</span>
                  <span class="metadata-value">{{ transaction.metadata.rewardType }}</span>
                </div>
                <div v-if="transaction.metadata.source" class="metadata-item">
                  <span class="metadata-label">지급 근거</span>
                  <span class="metadata-value">{{ transaction.metadata.source }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 블록체인 정보 (있는 경우) -->
        <div v-if="transaction.metadata?.txHash" class="detail-section">
          <h3 class="section-title">블록체인 정보</h3>
          <div class="blockchain-info">
            <div class="detail-item">
              <span class="detail-label">트랜잭션 해시</span>
              <span class="detail-value hash">
                {{ formatHash(transaction.metadata.txHash) }}
                <button class="copy-btn" @click="copyToClipboard(transaction.metadata.txHash)">
                  {{ copied === transaction.metadata.txHash ? '✅' : '📋' }}
                </button>
                <a 
                  :href="getExplorerUrl(transaction.metadata.txHash)" 
                  target="_blank" 
                  class="explorer-link"
                  title="익스플로러에서 보기"
                >
                  🔗
                </a>
              </span>
            </div>
            
            <div v-if="transaction.metadata.blockNumber" class="detail-item">
              <span class="detail-label">블록 번호</span>
              <span class="detail-value">{{ transaction.metadata.blockNumber }}</span>
            </div>
            
            <div v-if="transaction.metadata.confirmations" class="detail-item">
              <span class="detail-label">확인 수</span>
              <span class="detail-value">{{ transaction.metadata.confirmations }}</span>
            </div>
          </div>
        </div>

        <!-- 상태 기록 -->
        <div v-if="transaction.metadata?.statusHistory" class="detail-section">
          <h3 class="section-title">상태 변경 기록</h3>
          <div class="status-timeline">
            <div 
              v-for="(status, index) in transaction.metadata.statusHistory" 
              :key="index"
              class="timeline-item"
              :class="{ current: index === transaction.metadata.statusHistory.length - 1 }"
            >
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-status">{{ getStatusText(status.status) }}</div>
                <div class="timeline-date">{{ formatDateTime(status.timestamp) }}</div>
                <div v-if="status.note" class="timeline-note">{{ status.note }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 에러 정보 (실패한 경우) -->
        <div v-if="transaction.status === 'failed' && transaction.metadata?.error" class="detail-section">
          <h3 class="section-title">오류 정보</h3>
          <div class="error-info">
            <div class="error-message">
              {{ transaction.metadata.error.message }}
            </div>
            <div v-if="transaction.metadata.error.code" class="error-code">
              오류 코드: {{ transaction.metadata.error.code }}
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-close" @click="closeModal">
          닫기
        </button>
        <div class="action-buttons">
          <button 
            v-if="canRetry" 
            class="btn-retry" 
            @click="retryTransaction"
          >
            다시 시도
          </button>
          <button 
            v-if="canCancel" 
            class="btn-cancel" 
            @click="cancelTransaction"
          >
            거래 취소
          </button>
          <button 
            v-if="transaction?.metadata?.supportTicket" 
            class="btn-support" 
            @click="openSupport"
          >
            고객지원
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Transaction {
  id: string
  type: 'investment' | 'shopping' | 'token_conversion' | 'reward' | 'deposit' | 'withdrawal'
  description: string
  amount: number
  currency: string
  date: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  metadata?: Record<string, any>
}

interface Props {
  show: boolean
  transaction: Transaction | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'retry-transaction': [transaction: Transaction]
  'cancel-transaction': [transaction: Transaction]
}>()

// 반응형 데이터
const copied = ref('')

// 계산된 속성
const canRetry = computed(() => 
  props.transaction?.status === 'failed'
)

const canCancel = computed(() => 
  props.transaction?.status === 'pending'
)

// 유틸리티 함수들
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(amount)
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const formatHash = (hash: string): string => {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

const getTypeIcon = (type: string): string => {
  const icons = {
    investment: '📈',
    shopping: '🛒',
    token_conversion: '🔄',
    reward: '🎁',
    deposit: '⬇️',
    withdrawal: '⬆️'
  }
  return icons[type as keyof typeof icons] || '💰'
}

const getTypeText = (type: string): string => {
  const texts = {
    investment: 'RWA 투자',
    shopping: '쇼핑몰 구매',
    token_conversion: '토큰 변환',
    reward: '리워드',
    deposit: '입금',
    withdrawal: '출금'
  }
  return texts[type as keyof typeof texts] || type
}

const getStatusText = (status: string): string => {
  const texts = {
    pending: '대기중',
    completed: '완료',
    failed: '실패',
    cancelled: '취소'
  }
  return texts[status as keyof typeof texts] || status
}

const getExplorerUrl = (txHash: string): string => {
  // Solana Explorer URL (실제 환경에서는 네트워크에 따라 조정)
  return `https://explorer.solana.com/tx/${txHash}`
}

// 클립보드 복사
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = text
    setTimeout(() => {
      copied.value = ''
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

// 모달 닫기
const closeModal = () => {
  emit('update:show', false)
}

// 액션 함수들
const retryTransaction = () => {
  if (props.transaction) {
    emit('retry-transaction', props.transaction)
    closeModal()
  }
}

const cancelTransaction = () => {
  if (props.transaction) {
    emit('cancel-transaction', props.transaction)
    closeModal()
  }
}

const openSupport = () => {
  // TODO: 고객지원 페이지로 이동
  console.log('Open support for transaction:', props.transaction?.id)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-section {
  margin-bottom: 32px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  font-size: 1rem;
  color: #111827;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-value.hash {
  font-family: monospace;
  word-break: break-all;
}

.copy-btn,
.explorer-link {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  font-size: 0.875rem;
  transition: transform 0.2s;
  text-decoration: none;
}

.copy-btn:hover,
.explorer-link:hover {
  transform: scale(1.1);
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  width: fit-content;
}

.type-badge.investment {
  background: #dbeafe;
  color: #1e40af;
}

.type-badge.shopping {
  background: #dcfce7;
  color: #166534;
}

.type-badge.token_conversion {
  background: #fef3c7;
  color: #92400e;
}

.type-badge.reward {
  background: #fce7f3;
  color: #be185d;
}

.type-badge.deposit {
  background: #ecfdf5;
  color: #059669;
}

.type-badge.withdrawal {
  background: #fef2f2;
  color: #dc2626;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  width: fit-content;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.completed {
  background: #dcfce7;
  color: #166534;
}

.status-badge.failed {
  background: #fef2f2;
  color: #dc2626;
}

.status-badge.cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.amount-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.amount-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.amount-label {
  font-size: 1rem;
  color: #374151;
  font-weight: 500;
}

.amount-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.amount-value.positive .amount {
  color: #059669;
}

.amount-value.negative .amount {
  color: #dc2626;
}

.currency {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

.fee-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 0.875rem;
}

.fee-label {
  color: #6b7280;
}

.fee-value {
  color: #dc2626;
  font-weight: 500;
}

.description-section {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.description-main {
  font-size: 1rem;
  color: #111827;
  margin-bottom: 16px;
  line-height: 1.6;
}

.metadata-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
}

.metadata-item:last-child {
  margin-bottom: 0;
}

.metadata-label {
  color: #6b7280;
  font-weight: 500;
}

.metadata-value {
  color: #111827;
  font-weight: 500;
  text-align: right;
}

.conversion-flow {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  justify-content: center;
}

.conversion-token {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-width: 120px;
}

.token-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.token-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.token-amount {
  font-size: 0.875rem;
  color: #374151;
}

.conversion-arrow {
  font-size: 1.5rem;
  color: #3b82f6;
  font-weight: bold;
}

.blockchain-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
}

.status-timeline {
  position: relative;
  padding-left: 24px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 8px;
  bottom: -16px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  position: absolute;
  left: -28px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d1d5db;
  border: 2px solid white;
}

.timeline-item.current .timeline-dot {
  background: #3b82f6;
}

.timeline-content {
  margin-left: 8px;
}

.timeline-status {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.timeline-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.timeline-note {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.4;
}

.error-info {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
  margin-bottom: 8px;
}

.error-code {
  color: #7f1d1d;
  font-size: 0.875rem;
  font-family: monospace;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-close,
.btn-retry,
.btn-cancel,
.btn-support {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-close {
  background: #f3f4f6;
  color: #374151;
}

.btn-close:hover {
  background: #e5e7eb;
}

.btn-retry {
  background: #3b82f6;
  color: white;
}

.btn-retry:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #dc2626;
  color: white;
}

.btn-cancel:hover {
  background: #b91c1c;
}

.btn-support {
  background: #059669;
  color: white;
}

.btn-support:hover {
  background: #047857;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .amount-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .conversion-flow {
    flex-direction: column;
    gap: 12px;
  }
  
  .conversion-arrow {
    transform: rotate(90deg);
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>