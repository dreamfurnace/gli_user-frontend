<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>🛒 장바구니</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 빈 장바구니 -->
        <div v-if="cartStore.isEmpty" class="empty-cart">
          <div class="empty-icon">🛒</div>
          <h3>장바구니가 비어있습니다</h3>
          <p>원하는 상품을 장바구니에 담아보세요!</p>
          <button class="btn-shopping" @click="goToShopping">
            쇼핑 계속하기
          </button>
        </div>

        <!-- 장바구니 아이템 목록 -->
        <div v-else class="cart-items">
          <div class="cart-header">
            <div class="items-count">
              총 {{ cartStore.uniqueItemCount }}개 상품 ({{ cartStore.itemCount }}개)
            </div>
            <button class="clear-btn" @click="clearCart" :disabled="cartStore.isLoading">
              전체 삭제
            </button>
          </div>

          <div class="items-list">
            <div 
              v-for="item in cartStore.items" 
              :key="item.id"
              class="cart-item"
              :class="{ 'out-of-stock': !item.is_in_stock }"
            >
              <div class="item-image">
                <img 
                  :src="item.main_image_url || '/placeholder-product.jpg'" 
                  :alt="item.name"
                  @error="handleImageError"
                >
                <div v-if="!item.is_in_stock" class="stock-overlay">
                  품절
                </div>
              </div>

              <div class="item-info">
                <div class="item-header">
                  <h4 class="item-name">{{ item.name }}</h4>
                  <button 
                    class="remove-btn" 
                    @click="removeItem(item.id)"
                    :disabled="cartStore.isLoading"
                  >
                    ✕
                  </button>
                </div>
                
                <p class="item-description">{{ item.description }}</p>
                
                <div class="item-meta">
                  <span class="category-tag">{{ item.category_name }}</span>
                  <span class="type-tag">{{ item.product_type_display }}</span>
                </div>

                <div class="item-footer">
                  <div class="quantity-controls">
                    <button 
                      class="qty-btn" 
                      @click="decreaseQuantity(item.id)"
                      :disabled="cartStore.isLoading || item.quantity <= 1"
                    >
                      -
                    </button>
                    <span class="quantity">{{ item.quantity }}</span>
                    <button 
                      class="qty-btn" 
                      @click="increaseQuantity(item.id)"
                      :disabled="cartStore.isLoading || !item.is_in_stock"
                    >
                      +
                    </button>
                  </div>

                  <div class="item-price">
                    <div class="price-glil">
                      <span class="price-value">{{ formatNumber(item.price_glil * item.quantity) }}</span>
                      <span class="price-unit">GLI-L</span>
                    </div>
                    <div v-if="item.price_usd" class="price-usd">
                      ≈ ${{ formatNumber(item.price_usd * item.quantity) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 총 계산 -->
          <div class="cart-summary">
            <div class="summary-row total">
              <span class="label">총 금액</span>
              <div class="price">
                <div class="price-glil">
                  <span class="price-value">{{ formatNumber(cartStore.totalPrice) }}</span>
                  <span class="price-unit">GLI-L</span>
                </div>
                <div v-if="cartStore.totalPriceUSD > 0" class="price-usd">
                  ≈ ${{ formatNumber(cartStore.totalPriceUSD) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer" v-if="!cartStore.isEmpty">
        <button 
          class="btn-continue" 
          @click="closeModal"
          :disabled="cartStore.isLoading"
        >
          쇼핑 계속하기
        </button>
        <button 
          class="btn-checkout" 
          @click="proceedToCheckout"
          :disabled="cartStore.isLoading || hasOutOfStockItems"
        >
          <span v-if="cartStore.isLoading" class="loading-spinner"></span>
          <span v-else>결제하기 ({{ cartStore.itemCount }}개)</span>
        </button>
      </div>

      <!-- 알림 메시지 -->
      <div v-if="notification.show" class="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </div>
  </div>

  <!-- 결제 모달 -->
  <PaymentModal 
    :show="showPaymentModal"
    :cart-items="cartStore.items.filter(item => item.is_in_stock)"
    @update:show="showPaymentModal = $event"
    @payment-success="handlePaymentSuccess"
    @payment-error="handlePaymentError"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingCartStore } from '../stores/shoppingCart'
import PaymentModal from './PaymentModal.vue'

interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'checkout': [items: any[]]
}>()

const router = useRouter()
const cartStore = useShoppingCartStore()

// 알림 상태
const notification = ref({
  show: false,
  message: '',
  type: 'success' // 'success' | 'error' | 'warning'
})

// 결제 모달 상태
const showPaymentModal = ref(false)

// 계산된 속성
const hasOutOfStockItems = computed(() => {
  return cartStore.items.some(item => !item.is_in_stock)
})

// 메서드
const closeModal = () => {
  emit('update:show', false)
}

const goToShopping = () => {
  closeModal()
  router.push('/shopping')
}

const removeItem = async (productId: string) => {
  const result = cartStore.removeItem(productId)
  showNotification(result.message, result.success ? 'success' : 'error')
}

const increaseQuantity = async (productId: string) => {
  const result = cartStore.increaseQuantity(productId)
  if (!result.success) {
    showNotification(result.message, 'warning')
  }
}

const decreaseQuantity = async (productId: string) => {
  const result = cartStore.decreaseQuantity(productId)
  if (result.success && result.message.includes('제거')) {
    showNotification(result.message, 'success')
  }
}

const clearCart = async () => {
  if (confirm('장바구니의 모든 상품을 삭제하시겠습니까?')) {
    const result = cartStore.clearCart()
    showNotification(result.message, 'success')
  }
}

const proceedToCheckout = () => {
  const checkoutItems = cartStore.getCheckoutItems()
  // 장바구니 모달을 닫고 결제 모달 열기
  showPaymentModal.value = true
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-product.jpg'
}

const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
  notification.value = {
    show: true,
    message,
    type
  }
  
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const handlePaymentSuccess = (order: any) => {
  // 결제된 상품들을 장바구니에서 제거
  const paidItemIds = cartStore.items
    .filter(item => item.is_in_stock)
    .map(item => item.id)
  
  cartStore.removeCheckoutItems(paidItemIds)
  
  showNotification('결제가 완료되었습니다!', 'success')
  showPaymentModal.value = false
  
  // 결제 성공 이벤트 전달
  emit('checkout', order)
}

const handlePaymentError = (errorMessage: string) => {
  showNotification(errorMessage, 'error')
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

/* 빈 장바구니 */
.empty-cart {
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-cart h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.empty-cart p {
  color: #6b7280;
  margin-bottom: 24px;
}

.btn-shopping {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-shopping:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

/* 장바구니 헤더 */
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.items-count {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.clear-btn {
  background: none;
  border: 1px solid #ef4444;
  color: #ef4444;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #ef4444;
  color: white;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 장바구니 아이템 */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.cart-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  transition: all 0.2s;
}

.cart-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.cart-item.out-of-stock {
  opacity: 0.7;
  background: #f9fafb;
}

.item-image {
  position: relative;
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

.stock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.3;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 1rem;
}

.remove-btn:hover:not(:disabled) {
  background: #fef2f2;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.item-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  gap: 8px;
}

.category-tag,
.type-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.category-tag {
  background: #dbeafe;
  color: #1e40af;
}

.type-tag {
  background: #f3e8ff;
  color: #7c3aed;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  width: 32px;
  height: 32px;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s;
}

.qty-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  min-width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.item-price {
  text-align: right;
}

.price-glil {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 2px;
}

.price-value {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.price-unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
}

.price-usd {
  font-size: 0.75rem;
  color: #6b7280;
}

/* 장바구니 요약 */
.cart-summary {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-row.total {
  font-size: 1.125rem;
  font-weight: 600;
}

.summary-row .label {
  color: #64748b;
}

.summary-row .price .price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

.summary-row .price .price-unit {
  font-size: 1.125rem;
  font-weight: 600;
  color: #059669;
}

/* 모달 푸터 */
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-continue,
.btn-checkout {
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

.btn-continue {
  background: #f3f4f6;
  color: #374151;
}

.btn-continue:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-checkout {
  background: #059669;
  color: white;
}

.btn-checkout:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-1px);
}

.btn-checkout:disabled {
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 알림 */
.notification {
  position: absolute;
  bottom: 24px;
  left: 24px;
  right: 24px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  animation: slideUp 0.3s ease-out;
}

.notification.success {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #bbf7d0;
}

.notification.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.notification.warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fed7aa;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 반응형 디자인 */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .cart-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .item-image {
    width: 100%;
    height: 120px;
  }
  
  .item-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>