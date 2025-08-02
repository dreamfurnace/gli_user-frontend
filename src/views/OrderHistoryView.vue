<template>
  <div class="order-history">
    <div class="page-header">
      <div class="header-content">
        <h1>📦 주문 내역</h1>
        <p class="header-description">GLI-L 토큰으로 구매한 상품들의 주문 내역을 확인하세요</p>
      </div>
      
      <!-- 필터 섹션 -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group">
            <label>기간</label>
            <select v-model="selectedPeriod" @change="fetchOrders">
              <option value="all">전체 기간</option>
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 3개월</option>
              <option value="365">최근 1년</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>상태</label>
            <select v-model="selectedStatus" @change="fetchOrders">
              <option value="">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="paid">결제완료</option>
              <option value="processing">처리중</option>
              <option value="shipped">배송중</option>
              <option value="delivered">배송완료</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
          
          <div class="search-group">
            <div class="search-input">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="주문번호, 상품명 검색..."
                @input="debouncedSearch"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>주문 내역을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>주문 내역을 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchOrders">다시 시도</button>
    </div>

    <!-- 주문 목록 -->
    <div v-else class="orders-container">
      <!-- 결과 요약 -->
      <div class="results-summary">
        <p>
          총 <strong>{{ totalCount }}</strong>개의 주문
          <span v-if="searchQuery || selectedStatus || selectedPeriod !== 'all'">
            (필터 적용됨)
          </span>
        </p>
      </div>

      <!-- 주문 카드 목록 -->
      <div class="orders-list">
        <div 
          v-for="order in orders" 
          :key="order.id" 
          class="order-card"
          :class="{ 'order-cancelled': order.status === 'cancelled' }"
        >
          <!-- 주문 헤더 -->
          <div class="order-header">
            <div class="order-info">
              <h3 class="order-number">주문번호: {{ order.order_number }}</h3>
              <div class="order-meta">
                <span class="order-date">{{ formatDate(order.created_at) }}</span>
                <span class="order-status" :class="`status-${order.status}`">
                  {{ getStatusDisplay(order.status) }}
                </span>
              </div>
            </div>
            <div class="order-actions">
              <button class="btn-details" @click="viewOrderDetails(order)">
                상세보기
              </button>
              <button 
                v-if="order.status === 'pending'"
                class="btn-cancel" 
                @click="cancelOrder(order.id)"
                :disabled="isLoading"
              >
                주문취소
              </button>
            </div>
          </div>

          <!-- 주문 상품 목록 -->
          <div class="order-items">
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
              <div class="item-info">
                <h4 class="item-name">{{ item.product_name }}</h4>
                <div class="item-details">
                  <span class="item-quantity">수량: {{ item.quantity }}개</span>
                  <span class="item-price">
                    {{ formatNumber(item.unit_price_glil) }} GLI-L
                  </span>
                </div>
              </div>
              <div class="item-total">
                <span class="total-price">
                  {{ formatNumber(item.unit_price_glil * item.quantity) }} GLI-L
                </span>
              </div>
            </div>
          </div>

          <!-- 주문 총액 -->
          <div class="order-footer">
            <div class="order-total">
              <span class="label">총 결제 금액</span>
              <span class="amount">
                {{ formatNumber(order.total_amount_glil) }} GLI-L
              </span>
            </div>
            <div v-if="order.payment_tx_hash" class="tx-hash">
              <span class="label">트랜잭션</span>
              <a 
                :href="getSolanaExplorerUrl(order.payment_tx_hash)" 
                target="_blank"
                class="tx-link"
              >
                {{ order.payment_tx_hash.substring(0, 8) }}...{{ order.payment_tx_hash.substring(-8) }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15,3 21,3 21,9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 결과 -->
      <div v-if="!loading && orders.length === 0" class="empty-results">
        <div class="empty-icon">📦</div>
        <h3>주문 내역이 없습니다</h3>
        <p v-if="searchQuery || selectedStatus || selectedPeriod !== 'all'">
          검색 조건을 조정하거나 필터를 초기화해보세요
        </p>
        <p v-else>
          쇼핑몰에서 상품을 구매해보세요!
        </p>
        <div class="empty-actions">
          <button v-if="searchQuery || selectedStatus || selectedPeriod !== 'all'" class="btn-reset" @click="resetFilters">
            필터 초기화
          </button>
          <button class="btn-shopping" @click="goToShopping">
            쇼핑몰 둘러보기
          </button>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          이전
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            :class="['page-btn', { active: page === currentPage }]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>

    <!-- 주문 상세 모달 -->
    <OrderDetailModal 
      v-if="selectedOrder"
      :show="showDetailModal"
      :order="selectedOrder"
      @update:show="showDetailModal = $event"
      @order-cancelled="handleOrderCancelled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getShoppingOrders, cancelShoppingOrder } from '../services/api'
import OrderDetailModal from '../components/OrderDetailModal.vue'

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

const router = useRouter()

// 반응형 데이터
const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')
const isLoading = ref(false)

// 필터 상태
const selectedPeriod = ref('all')
const selectedStatus = ref('')
const searchQuery = ref('')

// 페이지네이션
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// 모달 상태
const showDetailModal = ref(false)
const selectedOrder = ref<Order | null>(null)

// 검색 디바운스
let searchTimeout: NodeJS.Timeout

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 500)
}

// 페이지 계산
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2

  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)

  if (end - start < delta * 2) {
    if (start === 1) {
      end = Math.min(total, start + delta * 2)
    } else {
      start = Math.max(1, end - delta * 2)
    }
  }

  const pages = []
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// 주문 목록 조회
const fetchOrders = async () => {
  loading.value = true
  error.value = ''

  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      page_size: pageSize.value,
      ordering: '-created_at'
    }

    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }

    if (selectedPeriod.value !== 'all') {
      const days = parseInt(selectedPeriod.value)
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      params.created_at__gte = fromDate.toISOString().split('T')[0]
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    const response = await getShoppingOrders(params)
    
    orders.value = response.data.results || response.data
    totalCount.value = response.data.count || orders.value.length

  } catch (err: any) {
    console.error('Failed to fetch orders:', err)
    error.value = err.message || '주문 내역을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

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

// 필터 초기화
const resetFilters = () => {
  selectedPeriod.value = 'all'
  selectedStatus.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  fetchOrders()
}

// 페이지 변경
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchOrders()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 주문 상세보기
const viewOrderDetails = (order: Order) => {
  selectedOrder.value = order
  showDetailModal.value = true
}

// 주문 취소
const cancelOrder = async (orderId: string) => {
  if (!confirm('정말로 주문을 취소하시겠습니까?')) return

  isLoading.value = true
  try {
    await cancelShoppingOrder(orderId)
    alert('주문이 취소되었습니다.')
    fetchOrders() // 목록 새로고침
  } catch (err: any) {
    console.error('Failed to cancel order:', err)
    alert(err.message || '주문 취소에 실패했습니다.')
  } finally {
    isLoading.value = false
  }
}

// 주문 취소 완료 처리
const handleOrderCancelled = () => {
  fetchOrders() // 목록 새로고침
}

// 쇼핑몰로 이동
const goToShopping = () => {
  router.push('/shopping')
}

// 컴포넌트 마운트
onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-history {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 32px;
}

.header-content {
  text-align: center;
  margin-bottom: 32px;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.header-description {
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
}

.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.filter-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-group {
  grid-column: span 2;
}

.search-input {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input input {
  width: 100%;
  padding: 8px 12px 8px 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input input:focus {
  outline: none;
  border-color: #3b82f6;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 64px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.results-summary {
  margin-bottom: 24px;
  color: #6b7280;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
}

.order-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.order-card.order-cancelled {
  opacity: 0.7;
  background: #f9fafb;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  background: #f8fafc;
}

.order-number {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.order-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.order-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.order-status {
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

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-details,
.btn-cancel {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-details {
  background: #f3f4f6;
  color: #374151;
}

.btn-details:hover {
  background: #e5e7eb;
}

.btn-cancel {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-cancel:hover:not(:disabled) {
  background: #fee2e2;
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.order-items {
  padding: 16px 20px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.order-item:last-child {
  border-bottom: none;
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

.item-info {
  flex: 1;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.item-details {
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

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #f3f4f6;
}

.order-total {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-total .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.order-total .amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #059669;
}

.tx-hash {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
}

.tx-hash .label {
  color: #6b7280;
}

.tx-link {
  color: #3b82f6;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tx-link:hover {
  text-decoration: underline;
}

.empty-results {
  text-align: center;
  padding: 64px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.btn-reset,
.btn-shopping {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-reset {
  background: #f3f4f6;
  color: #374151;
}

.btn-reset:hover {
  background: #e5e7eb;
}

.btn-shopping {
  background: #3b82f6;
  color: white;
}

.btn-shopping:hover {
  background: #2563eb;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.page-btn:disabled {
  background: #f9fafb;
  color: #d1d5db;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .order-history {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .search-group {
    grid-column: span 1;
  }
  
  .order-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .order-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .order-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>