<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>🛒 결제하기</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 주문 요약 -->
        <div class="order-summary">
          <h3>주문 상품</h3>
          <div class="order-items">
            <div 
              v-for="item in cartItems" 
              :key="item.id" 
              class="order-item"
            >
              <div class="item-image">
                <img 
                  :src="item.main_image_url || '/placeholder-product.jpg'" 
                  :alt="item.name"
                >
              </div>
              <div class="item-details">
                <h4>{{ item.name }}</h4>
                <p class="item-description">{{ item.description }}</p>
                <div class="item-meta">
                  <span class="quantity">수량: {{ item.quantity }}개</span>
                  <span class="unit-price">
                    단가: {{ formatGLILAmount(item.price_glil) }} GLI-L
                  </span>
                </div>
              </div>
              <div class="item-total">
                <span class="total-price">
                  {{ formatGLILAmount(item.price_glil * item.quantity) }} GLI-L
                </span>
              </div>
            </div>
          </div>
          
          <div class="order-total">
            <div class="total-row">
              <span class="label">총 결제 금액</span>
              <span class="amount">
                {{ formatGLILAmount(totalAmount) }} GLI-L
              </span>
            </div>
          </div>
        </div>

        <!-- GLI-L 토큰 잔액 -->
        <div class="balance-section">
          <div class="balance-header">
            <h4>💰 GLI-L 토큰 잔액</h4>
            <button v-if="isConnected" class="refresh-btn" @click="refreshBalance" :disabled="isBalanceLoading">
              <span v-if="isBalanceLoading" class="loading-spinner small"></span>
              <span v-else>🔄</span>
            </button>
          </div>
          <div class="balance-display">
            <div v-if="!isConnected" class="balance-warning">
              ⚠️ 지갑을 연결해주세요
            </div>
            <div v-else-if="isBalanceLoading" class="balance-loading">
              <span class="loading-spinner small"></span>
              잔액 확인 중...
            </div>
            <div v-else class="balance-amount">
              <span class="balance-value">{{ formattedBalance }}</span>
              <span class="balance-unit">GLI-L</span>
              <div v-if="!hasEnoughGLIL(totalAmount)" class="insufficient-balance">
                ⚠️ 잔액이 부족합니다
              </div>
            </div>
          </div>
        </div>

        <!-- 유효성 검사 오류 -->
        <div v-if="validationErrors.length > 0" class="validation-errors">
          <div class="error-header">
            <span class="error-icon">⚠️</span>
            <span class="error-title">결제 진행이 어렵습니다</span>
          </div>
          <ul class="error-list">
            <li v-for="error in validationErrors" :key="error" class="error-item">
              {{ error }}
            </li>
          </ul>
        </div>

        <!-- 결제 조건 동의 -->
        <div class="payment-agreement">
          <div class="agreement-section">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="agreedToTerms"
                class="checkbox-input"
              >
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                <a href="#" @click.prevent="showTerms = true" class="terms-link">이용약관</a> 및 
                <a href="#" @click.prevent="showPrivacy = true" class="terms-link">개인정보처리방침</a>에 
                동의합니다
              </span>
            </label>
          </div>
          <div class="agreement-section">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="understoodRefund"
                class="checkbox-input"
              >
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                환불 정책을 이해하였으며, GLI-L 토큰 결제에 동의합니다
              </span>
            </label>
          </div>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="errorMessage" class="error-message">
          <div class="message-content">
            <span class="message-icon">❌</span>
            <span class="message-text">{{ errorMessage }}</span>
          </div>
        </div>

        <!-- 성공 메시지 -->
        <div v-if="successMessage" class="success-message">
          <div class="message-content">
            <span class="message-icon">✅</span>
            <span class="message-text">{{ successMessage }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal" :disabled="isFullyLoading">
          취소
        </button>
        <button 
          class="btn-pay" 
          @click="processPayment"
          :disabled="!canPay"
        >
          <span v-if="isFullyLoading" class="loading-spinner"></span>
          <span v-else>{{ formatGLILAmount(totalAmount) }} GLI-L 결제하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGLILToken } from '../composables/useGLILToken'
import { useSolanaWallet } from '../composables/useSolanaWallet'
import { useSolanaPayment } from '../composables/useSolanaPayment'
import { createShoppingOrder, confirmOrderPayment } from '../services/api'

interface PaymentItem {
  id: string
  name: string
  description: string
  price_glil: number
  quantity: number
  main_image_url?: string
}

interface Props {
  show: boolean
  cartItems: PaymentItem[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'payment-success': [order: any]
  'payment-error': [error: string]
}>()

// Composables
const { 
  glilBalance, 
  formattedBalance, 
  isLoading: isBalanceLoading,
  updateGLILBalance,
  formatGLILAmount,
  hasEnoughGLIL,
  validateCartCheckout,
  calculateCartTotal
} = useGLILToken()

const { fullAddress, isConnected } = useSolanaWallet()

const { 
  processGLILPayment, 
  processTestPayment, 
  isProcessing: isPaymentProcessing,
  error: paymentError 
} = useSolanaPayment()

// 반응형 데이터
const agreedToTerms = ref(false)
const understoodRefund = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationErrors = ref<string[]>([])
const showTerms = ref(false)
const showPrivacy = ref(false)

// 총 결제 금액 계산
const totalAmount = computed(() => {
  return calculateCartTotal(props.cartItems)
})

// 전체 로딩 상태
const isFullyLoading = computed(() => {
  return isLoading.value || isPaymentProcessing.value
})

// 결제 가능 여부
const canPay = computed(() => {
  if (!isConnected.value) return false
  if (props.cartItems.length === 0) return false
  if (validationErrors.value.length > 0) return false
  if (!agreedToTerms.value || !understoodRefund.value) return false
  if (isFullyLoading.value) return false
  return true
})

// 결제 유효성 검사
const validatePayment = () => {
  const validation = validateCartCheckout(props.cartItems)
  validationErrors.value = validation.errors
}

// GLI-L 잔액 새로고침
const refreshBalance = async () => {
  if (fullAddress.value) {
    await updateGLILBalance(fullAddress.value)
  }
}

// 결제 처리
const processPayment = async () => {
  if (!canPay.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // 1. 주문 생성
    const orderData = {
      items: props.cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price_glil: item.price_glil
      })),
      total_amount_glil: totalAmount.value,
      payment_method: 'glil_token',
      wallet_address: fullAddress.value
    }

    const orderResponse = await createShoppingOrder(orderData)
    const order = orderResponse.data

    // 2. GLI-L 토큰 결제 처리 (실제 블록체인 트랜잭션)
    let paymentTxHash: string
    try {
      // 개발 환경에서는 테스트 결제 사용, 프로덕션에서는 실제 결제 사용
      if (import.meta.env.DEV) {
        paymentTxHash = await processTestPayment(order.id, totalAmount.value)
      } else {
        paymentTxHash = await processGLILPayment(order.id, totalAmount.value)
      }
    } catch (paymentErr: any) {
      console.error('Solana payment failed:', paymentErr)
      // 블록체인 결제 실패 시 주문 상태 업데이트 필요
      throw new Error(`결제 처리 실패: ${paymentErr.message}`)
    }

    // 3. 결제 확인
    await confirmOrderPayment(order.id, { payment_tx_hash: paymentTxHash })

    // 4. 성공 처리
    successMessage.value = '결제가 완료되었습니다!'
    
    setTimeout(() => {
      emit('payment-success', order)
      closeModal()
    }, 2000)

    // 잔액 업데이트
    await refreshBalance()

  } catch (error: any) {
    console.error('Payment failed:', error)
    errorMessage.value = error.response?.data?.message || error.message || '결제 처리에 실패했습니다.'
    emit('payment-error', errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

// 모달 닫기
const closeModal = () => {
  if (!isFullyLoading.value) {
    emit('update:show', false)
    resetModal()
  }
}

// 모달 초기화
const resetModal = () => {
  agreedToTerms.value = false
  understoodRefund.value = false
  errorMessage.value = ''
  successMessage.value = ''
  validationErrors.value = []
}

// 연결된 지갑 변경 감지
watch(fullAddress, (newAddress) => {
  if (newAddress) {
    refreshBalance()
  }
})

// props.cartItems 변경 감지
watch(() => props.cartItems, () => {
  validatePayment()
}, { immediate: true })

// 모달 표시 시 초기 설정
watch(() => props.show, (show) => {
  if (show) {
    resetModal()
    validatePayment()
    if (fullAddress.value) {
      refreshBalance()
    }
  }
})

// 솔라나 결제 에러 감지
watch(paymentError, (error) => {
  if (error) {
    errorMessage.value = error
  }
})
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
  max-width: 600px;
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

.order-summary {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.order-summary h3 {
  margin: 0 0 16px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
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

.item-details h4 {
  margin: 0 0 4px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.item-description {
  margin: 0 0 8px 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 0.75rem;
  color: #6b7280;
}

.item-total {
  display: flex;
  align-items: center;
}

.total-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
}

.order-total {
  border-top: 2px solid #e2e8f0;
  padding-top: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-row .label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.total-row .amount {
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
}

.balance-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f0fdf4;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.balance-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #059669;
}

.refresh-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  color: #059669;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(5, 150, 105, 0.1);
}

.balance-display {
  font-size: 1.25rem;
  font-weight: 600;
}

.balance-warning {
  color: #dc2626;
  font-size: 1rem;
}

.balance-loading {
  color: #6b7280;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.balance-value {
  color: #059669;
}

.balance-unit {
  font-size: 1rem;
  color: #059669;
}

.insufficient-balance {
  font-size: 0.875rem;
  color: #dc2626;
  margin-top: 4px;
}

.validation-errors {
  margin-bottom: 20px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.error-icon {
  font-size: 1.125rem;
}

.error-title {
  font-weight: 600;
  color: #dc2626;
}

.error-list {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 4px;
}

.payment-agreement {
  margin-bottom: 20px;
  padding: 16px;
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: 8px;
}

.agreement-section {
  margin-bottom: 12px;
}

.agreement-section:last-child {
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.5;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 3px;
  background: white;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s;
}

.checkbox-input:checked + .checkbox-custom {
  background: #059669;
  border-color: #059669;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  display: block;
  color: white;
  font-size: 10px;
  text-align: center;
  line-height: 12px;
}

.checkbox-text {
  color: #374151;
}

.terms-link {
  color: #059669;
  text-decoration: underline;
  font-weight: 500;
}

.terms-link:hover {
  color: #047857;
}

.error-message,
.success-message {
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-icon {
  font-size: 1.125rem;
}

.message-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message .message-text {
  color: #dc2626;
}

.success-message .message-text {
  color: #059669;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-cancel,
.btn-pay {
  flex: 1;
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

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-pay {
  background: #059669;
  color: white;
}

.btn-pay:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.btn-pay:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 12px;
  height: 12px;
  border-width: 1px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 디자인 */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .order-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .item-details {
    order: 2;
  }
  
  .item-total {
    order: 3;
    justify-content: flex-start;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>