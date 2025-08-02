<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>📦 주문 상세</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 주문 기본 정보 -->
        <div class="order-info-section">
          <h3>주문 정보</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">주문번호</span>
              <span class="value">{{ order.order_number }}</span>
            </div>
            <div class="info-item">
              <span class="label">주문일시</span>
              <span class="value">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">주문상태</span>
              <span class="value">
                <span class="status-badge" :class="`status-${order.status}`">
                  {{ getStatusDisplay(order.status) }}
                </span>
              </span>
            </div>
            <div class="info-item">
              <span class="label">결제금액</span>
              <span class="value amount">{{ formatNumber(order.total_amount_glil) }} GLI-L</span>
            </div>
          </div>
        </div>

        <!-- 주문 상품 목록 -->
        <div class="order-items-section">
          <h3>주문 상품</h3>
          <div class="items-list">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <div class="item-image">
                <img 
                  :src="item.product_image_url || '/placeholder-product.jpg'" 
                  :alt="item.product_name"
                  @error="handleImageError"
                >
              </div>
              <div class="item-details">
                <h4 class="item-name">{{ item.product_name }}</h4>
                <div class="item-meta">
                  <span class="item-quantity">수량: {{ item.quantity }}개</span>
                  <span class="item-unit-price">단가: {{ formatNumber(item.unit_price_glil) }} GLI-L</span>
                </div>
              </div>
              <div class="item-total-price">
                {{ formatNumber(item.unit_price_glil * item.quantity) }} GLI-L
              </div>
            </div>
          </div>
        </div>

        <!-- 결제 정보 -->
        <div class="payment-section">
          <h3>결제 정보</h3>
          <div class="payment-details">
            <div class="payment-row">
              <span class="label">결제 방법</span>
              <span class="value">GLI-L 토큰</span>
            </div>
            <div class="payment-row">
              <span class="label">결제 일시</span>
              <span class="value">{{ formatDate(order.updated_at) }}</span>
            </div>
            <div v-if="order.payment_tx_hash" class="payment-row">
              <span class="label">트랜잭션 해시</span>
              <div class="tx-hash-container">
                <span class="tx-hash">{{ order.payment_tx_hash }}</span>
                <div class="tx-actions">
                  <button class="btn-copy" @click="copyTxHash" :disabled="copied">
                    {{ copied ? '복사됨!' : '복사' }}
                  </button>
                  <a 
                    :href="getSolanaExplorerUrl(order.payment_tx_hash)" 
                    target="_blank"
                    class="btn-explorer"
                  >
                    익스플로러에서 보기
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15,3 21,3 21,9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            <div class="payment-row total">
              <span class="label">총 결제 금액</span>
              <span class="value amount">{{ formatNumber(order.total_amount_glil) }} GLI-L</span>
            </div>
          </div>
        </div>

        <!-- 배송 정보 (향후 확장) -->
        <div v-if="order.status === 'shipped' || order.status === 'delivered'" class="shipping-section">
          <h3>배송 정보</h3>
          <div class="shipping-details">
            <div class="shipping-row">
              <span class="label">배송 상태</span>
              <span class="value">{{ getStatusDisplay(order.status) }}</span>
            </div>
            <div class="shipping-row">
              <span class="label">배송 방법</span>
              <span class="value">일반 배송</span>
            </div>
            <!-- 추후 배송 추적 정보 추가 가능 -->
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel-order" 
          v-if="order.status === 'pending'" 
          @click="cancelOrder"
          :disabled="isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>주문 취소</span>
        </button>
        <button class="btn-close" @click="closeModal">
          닫기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { cancelShoppingOrder } from '../services/api'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  product_image_url?: string
  quantity: number
  unit_price_glil: number
}

interface Order {
  id: string
  order_number: string
  status: string
  total_amount_glil: number
  payment_tx_hash?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

interface Props {
  show: boolean
  order: Order
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'order-cancelled': []
}>()

const isLoading = ref(false)
const copied = ref(false)

// 상태 표시 텍스트
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '대기중',
    'paid': '결제완료',
    'processing': '처리중',
    'shipped': '배송중',
    'delivered': '배송완료',
    'cancelled': '취소됨'
  }
  return statusMap[status] || status
}

// 날짜 포맷팅
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

// 숫자 포맷팅
const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

// 솔라나 익스플로러 URL
const getSolanaExplorerUrl = (txHash: string): string => {
  return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`
}

// 이미지 에러 처리
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-product.jpg'
}

// 트랜잭션 해시 복사
const copyTxHash = async () => {
  if (!props.order.payment_tx_hash) return
  
  try {
    await navigator.clipboard.writeText(props.order.payment_tx_hash)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 주문 취소
const cancelOrder = async () => {
  if (!confirm('정말로 주문을 취소하시겠습니까?')) return

  isLoading.value = true
  try {
    await cancelShoppingOrder(props.order.id)
    alert('주문이 취소되었습니다.')
    emit('order-cancelled')
    closeModal()
  } catch (err: any) {
    console.error('Failed to cancel order:', err)
    alert(err.message || '주문 취소에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 모달 닫기
const closeModal = () => {
  emit('update:show', false)
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
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
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

.order-info-section,
.order-items-section,
.payment-section,
.shipping-section {
  margin-bottom: 32px;
}

.order-info-section h3,
.order-items-section h3,
.payment-section h3,
.shipping-section h3 {
  margin: 0 0 16px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-item .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.info-item .value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.info-item .value.amount {
  color: #059669;
  font-size: 1rem;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-paid { background: #d1fae5; color: #065f46; }
.status-processing { background: #dbeafe; color: #1e40af; }
.status-shipped { background: #e0e7ff; color: #3730a3; }
.status-delivered { background: #dcfce7; color: #166534; }
.status-cancelled { background: #fee2e2; color: #991b1b; }

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.875rem;
  color: #6b7280;
}

.item-total-price {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.payment-details,
.shipping-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-row,
.shipping-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.payment-row.total {
  border: 2px solid #059669;
  background: #f0fdf4;
}

.payment-row .label,
.shipping-row .label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.payment-row .value,
.shipping-row .value {
  font-size: 0.875rem;
  color: #111827;
  font-weight: 600;
}

.payment-row.total .value.amount {
  color: #059669;
  font-size: 1.125rem;
  font-weight: 700;
}

.tx-hash-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.tx-hash {
  font-family: monospace;
  font-size: 0.75rem;
  color: #374151;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  max-width: 300px;
}

.tx-actions {
  display: flex;
  gap: 8px;
}

.btn-copy,
.btn-explorer {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-copy {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-copy:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-copy:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-explorer {
  background: #3b82f6;
  color: white;
  border: 1px solid #3b82f6;
}

.btn-explorer:hover {
  background: #2563eb;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  justify-content: flex-end;
}

.btn-cancel-order,
.btn-close {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel-order {
  background: #dc2626;
  color: white;
}

.btn-cancel-order:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-cancel-order:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-close {
  background: #f3f4f6;
  color: #374151;
}

.btn-close:hover {
  background: #e5e7eb;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    margin: 10px auto;
    max-height: calc(100vh - 20px);
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .order-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .item-total-price {
    justify-content: flex-start;
  }
  
  .payment-row,
  .shipping-row {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .tx-hash-container {
    align-items: flex-start;
    width: 100%;
  }
  
  .tx-hash {
    max-width: 100%;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>