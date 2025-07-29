<template>
  <div class="shopping-mall">
    <!-- 헤더 섹션 -->
    <div class="mall-header">
      <div class="header-content">
        <h1 class="mall-title">
          <span class="title-icon">🛍️</span>
          {{ $t('shopping.title') }}
        </h1>
        <p class="mall-subtitle">{{ $t('shopping.subtitle') }}</p>
      </div>
      
      <!-- 탭 네비게이션 -->
      <div class="mall-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="nav-tab"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ $t(`shopping.tabs.${tab.id}`) }}</span>
        </button>
      </div>
    </div>

    <!-- 쇼핑카트 상태 표시 -->
    <div v-if="cartItems.length > 0" class="cart-status">
      <div class="cart-info">
        <span class="cart-icon">🛒</span>
        <span class="cart-count">{{ cartItems.length }} {{ $t('shopping.items') }}</span>
        <span class="cart-total">{{ formatPrice(cartTotal) }} GLI</span>
      </div>
      <button class="view-cart-btn" @click="showCart = true">
        {{ $t('shopping.viewCart') }}
      </button>
    </div>

    <!-- 탭 컨텐츠 -->
    <div class="mall-content">
      <!-- 리조트 예약 -->
      <div v-show="activeTab === 'resort'" class="tab-content">
        <ResortBooking 
          @add-to-cart="addToCart"
          @book-now="handleBooking"
        />
      </div>

      <!-- 상품 구매 -->
      <div v-show="activeTab === 'goods'" class="tab-content">
        <GoodsStore 
          @add-to-cart="addToCart"
          @buy-now="handlePurchase"
        />
      </div>

      <!-- 레스토랑 예약 -->
      <div v-show="activeTab === 'restaurant'" class="tab-content">
        <RestaurantReservation 
          @add-to-cart="addToCart"
          @reserve-now="handleReservation"
        />
      </div>

      <!-- 주문 내역 -->
      <div v-show="activeTab === 'orders'" class="tab-content">
        <OrderHistory />
      </div>
    </div>

    <!-- 장바구니 모달 -->
    <CartModal 
      v-if="showCart"
      :items="cartItems"
      :total="cartTotal"
      @close="showCart = false"
      @checkout="handleCheckout"
      @remove-item="removeFromCart"
      @update-quantity="updateCartQuantity"
    />

    <!-- 체크아웃 모달 -->
    <CheckoutModal
      v-if="showCheckout"
      :items="checkoutItems"
      :total="checkoutTotal"
      @close="showCheckout = false"
      @payment-success="handlePaymentSuccess"
      @payment-error="handlePaymentError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeb3Store } from '@/stores/web3'
import ResortBooking from '@/components/shopping/ResortBooking.vue'
import GoodsStore from '@/components/shopping/GoodsStore.vue'
import RestaurantReservation from '@/components/shopping/RestaurantReservation.vue'
import OrderHistory from '@/components/shopping/OrderHistory.vue'
import CartModal from '@/components/shopping/CartModal.vue'
import CheckoutModal from '@/components/shopping/CheckoutModal.vue'

const { t } = useI18n()
const web3Store = useWeb3Store()

// 상태 관리
const activeTab = ref('resort')
const showCart = ref(false)
const showCheckout = ref(false)
const cartItems = ref([])
const checkoutItems = ref([])

// 탭 설정
const tabs = [
  { id: 'resort', icon: '🏨', label: 'Resort Booking' },
  { id: 'goods', icon: '🛍️', label: 'Goods Store' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurant' },
  { id: 'orders', icon: '📋', label: 'Order History' }
]

// 계산된 속성
const cartTotal = computed(() => {
  return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

const checkoutTotal = computed(() => {
  return checkoutItems.value.reduce((total, item) => total + (item.price * item.quantity), 0)
})

// 메서드
const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const addToCart = (item: any) => {
  const existingItem = cartItems.value.find(cartItem => cartItem.id === item.id && cartItem.type === item.type)
  
  if (existingItem) {
    existingItem.quantity += item.quantity || 1
  } else {
    cartItems.value.push({
      ...item,
      quantity: item.quantity || 1,
      addedAt: new Date()
    })
  }
  
  // 성공 메시지 표시
  showNotification(t('shopping.addedToCart'), 'success')
}

const removeFromCart = (itemId: string, type: string) => {
  const index = cartItems.value.findIndex(item => item.id === itemId && item.type === type)
  if (index > -1) {
    cartItems.value.splice(index, 1)
  }
}

const updateCartQuantity = (itemId: string, type: string, quantity: number) => {
  const item = cartItems.value.find(item => item.id === itemId && item.type === type)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(itemId, type)
    } else {
      item.quantity = quantity
    }
  }
}

const handleCheckout = () => {
  if (!web3Store.isConnected) {
    showNotification(t('shopping.connectWalletFirst'), 'warning')
    return
  }
  
  checkoutItems.value = [...cartItems.value]
  showCart.value = false
  showCheckout.value = true
}

const handleBooking = (bookingData: any) => {
  if (!web3Store.isConnected) {
    showNotification(t('shopping.connectWalletFirst'), 'warning')
    return
  }
  
  checkoutItems.value = [bookingData]
  showCheckout.value = true
}

const handlePurchase = (purchaseData: any) => {
  if (!web3Store.isConnected) {
    showNotification(t('shopping.connectWalletFirst'), 'warning')
    return
  }
  
  checkoutItems.value = [purchaseData]
  showCheckout.value = true
}

const handleReservation = (reservationData: any) => {
  if (!web3Store.isConnected) {
    showNotification(t('shopping.connectWalletFirst'), 'warning')
    return
  }
  
  checkoutItems.value = [reservationData]
  showCheckout.value = true
}

const handlePaymentSuccess = (transactionData: any) => {
  // 결제 성공 처리
  console.log('Payment successful:', transactionData)
  
  // 장바구니에서 결제된 아이템들 제거
  checkoutItems.value.forEach(checkoutItem => {
    removeFromCart(checkoutItem.id, checkoutItem.type)
  })
  
  showCheckout.value = false
  showNotification(t('shopping.paymentSuccess'), 'success')
  
  // 주문 내역으로 이동
  setTimeout(() => {
    setActiveTab('orders')
  }, 2000)
}

const handlePaymentError = (error: any) => {
  console.error('Payment failed:', error)
  showNotification(t('shopping.paymentError'), 'error')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const showNotification = (message: string, type: string) => {
  // 알림 표시 로직 (간단한 구현)
  console.log(`${type.toUpperCase()}: ${message}`)
}

onMounted(() => {
  // 초기화 로직
  console.log('Shopping Mall initialized')
})
</script>

<style scoped>
.shopping-mall {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 헤더 섹션 */
.mall-header {
  background: var(--gradient-primary);
  color: white;
  padding: 2rem 0;
  border-radius: 0 0 2rem 2rem;
  box-shadow: var(--shadow-lg);
  margin-bottom: 2rem;
}

.header-content {
  text-align: center;
  margin-bottom: 2rem;
}

.mall-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.mall-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 탭 네비게이션 */
.mall-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0 2rem;
}

.nav-tab {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 140px;
  justify-content: center;
}

.nav-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-tab.active {
  background: var(--gli-gold);
  border-color: var(--gli-gold-light);
  color: var(--gli-gray-dark);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
}

.tab-icon {
  font-size: 1.5rem;
}

.tab-label {
  font-weight: 600;
}

/* 장바구니 상태 */
.cart-status {
  background: var(--bg-primary);
  border: 2px solid var(--gli-gold);
  border-radius: 1rem;
  padding: 1rem 1.5rem;
  margin: 0 2rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow);
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon {
  font-size: 1.5rem;
}

.cart-count {
  font-weight: 600;
  color: var(--text-primary);
}

.cart-total {
  font-weight: 700;
  color: var(--gli-blue);
  font-size: 1.1rem;
}

.view-cart-btn {
  background: var(--gradient-gold);
  color: var(--gli-gray-dark);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 컨텐츠 영역 */
.mall-content {
  padding: 0 2rem 2rem;
}

.tab-content {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  min-height: 600px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .mall-header {
    padding: 1.5rem 0;
    margin-bottom: 1rem;
  }
  
  .mall-title {
    font-size: 2rem;
  }
  
  .title-icon {
    font-size: 2.5rem;
  }
  
  .mall-subtitle {
    font-size: 1rem;
    padding: 0 1rem;
  }
  
  .mall-nav {
    padding: 0 1rem;
    gap: 0.5rem;
  }
  
  .nav-tab {
    padding: 0.75rem 1rem;
    min-width: 120px;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .tab-label {
    font-size: 0.9rem;
  }
  
  .cart-status {
    margin: 0 1rem 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .mall-content {
    padding: 0 1rem 1rem;
  }
  
  .tab-content {
    padding: 1.5rem;
  }
}

/* 애니메이션 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tab-content {
  animation: slideIn 0.3s ease-out;
}
</style>