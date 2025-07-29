<template>
  <div class="checkout-modal-overlay" @click="$emit('close')">
    <div class="checkout-modal" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="title-icon">💳</span>
          Checkout
        </h3>
        <button class="close-btn" @click="$emit('close')">
          <span>✕</span>
        </button>
      </div>

      <div class="modal-body">
        <!-- Order Summary -->
        <div class="order-summary">
          <h4>Order Summary</h4>
          <div class="summary-items">
            <div 
              v-for="item in items" 
              :key="`${item.id}-${item.type}`"
              class="summary-item"
            >
              <span class="item-name">{{ item.name }} × {{ item.quantity }}</span>
              <span class="item-price">{{ formatPrice(item.price * item.quantity) }} GLI</span>
            </div>
          </div>
          <div class="total-line">
            <span>Total: {{ formatPrice(total) }} GLI</span>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="payment-section">
          <h4>Payment Method</h4>
          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="payment" value="gli" v-model="paymentMethod" />
              <span class="option-label">
                <span class="option-icon">🪙</span>
                GLI Token
              </span>
            </label>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="processing" class="processing-state">
          <div class="processing-spinner"></div>
          <p>Processing payment...</p>
        </div>
      </div>

      <div class="modal-footer">
        <button class="cancel-btn" @click="$emit('close')" :disabled="processing">
          Cancel
        </button>
        <button class="pay-btn" @click="processPayment" :disabled="processing">
          {{ processing ? 'Processing...' : `Pay ${formatPrice(total)} GLI` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeb3Store } from '@/stores/web3'

defineProps<{
  items: any[]
  total: number
}>()

const emit = defineEmits(['close', 'payment-success', 'payment-error'])

const web3Store = useWeb3Store()
const processing = ref(false)
const paymentMethod = ref('gli')

const processPayment = async () => {
  processing.value = true
  
  try {
    // 실제 결제 로직은 여기에 구현
    // 지갑 연결 확인
    if (!web3Store.isConnected) {
      throw new Error('Wallet not connected')
    }
    
    // 모의 결제 처리 (실제로는 스마트 컨트랙트 호출)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 성공 시 이벤트 발생
    emit('payment-success', {
      transactionHash: '0x' + Math.random().toString(16).substring(2),
      amount: total.value,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Payment failed:', error)
    emit('payment-error', error)
  } finally {
    processing.value = false
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}
</script>

<style scoped>
.checkout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.checkout-modal {
  background: var(--bg-primary);
  border-radius: 1rem;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--bg-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-summary h4,
.payment-section h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-light);
}

.item-name {
  color: var(--text-primary);
}

.item-price {
  color: var(--gli-blue);
  font-weight: 600;
}

.total-line {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.payment-option:hover {
  border-color: var(--gli-blue);
}

.payment-option input[type="radio"] {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  position: relative;
}

.payment-option input[type="radio"]:checked {
  border-color: var(--gli-blue);
}

.payment-option input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.5rem;
  height: 0.5rem;
  background: var(--gli-blue);
  border-radius: 50%;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.option-icon {
  font-size: 1.2rem;
}

.processing-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

.processing-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--gli-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 1rem;
}

.cancel-btn,
.pay-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.pay-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
}

.pay-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>