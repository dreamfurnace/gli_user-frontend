<template>
  <div class="transaction-history">
    <!-- 필터 및 검색 -->
    <div class="filters-section">
      <div class="filter-header">
        <h2>📋 거래 내역</h2>
        <button class="refresh-btn" @click="refreshData" :disabled="loading">
          <span v-if="loading" class="loading-spinner small"></span>
          <span v-else>🔄</span>
        </button>
      </div>

      <div class="filter-controls">
        <div class="filter-row">
          <div class="filter-group">
            <label for="transaction-type">거래 유형</label>
            <select 
              id="transaction-type" 
              v-model="filters.type" 
              @change="applyFilters"
              class="filter-select"
            >
              <option value="">전체</option>
              <option value="investment">RWA 투자</option>
              <option value="shopping">쇼핑몰 구매</option>
              <option value="token_conversion">토큰 변환</option>
              <option value="reward">리워드</option>
              <option value="deposit">입금</option>
              <option value="withdrawal">출금</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="date-range">기간</label>
            <select 
              id="date-range" 
              v-model="filters.dateRange" 
              @change="applyFilters"
              class="filter-select"
            >
              <option value="all">전체</option>
              <option value="today">오늘</option>
              <option value="week">1주일</option>
              <option value="month">1개월</option>
              <option value="quarter">3개월</option>
              <option value="year">1년</option>
              <option value="custom">사용자 지정</option>
            </select>
          </div>

          <div v-if="filters.dateRange === 'custom'" class="filter-group date-inputs">
            <div class="date-input-group">
              <label for="start-date">시작일</label>
              <input 
                id="start-date"
                type="date" 
                v-model="filters.startDate" 
                @change="applyFilters"
                class="date-input"
              />
            </div>
            <div class="date-input-group">
              <label for="end-date">종료일</label>
              <input 
                id="end-date"
                type="date" 
                v-model="filters.endDate" 
                @change="applyFilters"
                class="date-input"
              />
            </div>
          </div>

          <div class="filter-group">
            <label for="status">상태</label>
            <select 
              id="status" 
              v-model="filters.status" 
              @change="applyFilters"
              class="filter-select"
            >
              <option value="">전체</option>
              <option value="pending">대기중</option>
              <option value="completed">완료</option>
              <option value="failed">실패</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>

        <div class="search-group">
          <div class="search-input-wrapper">
            <input 
              type="text" 
              v-model="searchQuery" 
              @input="debounceSearch"
              placeholder="거래 ID, 상품명, 메모 검색..."
              class="search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 통계 요약 -->
    <div class="stats-section">
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <span class="stat-label">총 거래액</span>
            <span class="stat-value">{{ formatAmount(stats.totalAmount) }}</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <span class="stat-label">총 거래 건수</span>
            <span class="stat-value">{{ stats.totalCount }}건</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <span class="stat-label">이번 달 거래</span>
            <span class="stat-value">{{ stats.monthlyCount }}건</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <span class="stat-label">누적 리워드</span>
            <span class="stat-value">{{ formatAmount(stats.totalRewards) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 거래 내역 테이블 -->
    <div class="table-section">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>거래 내역을 불러오는 중...</span>
      </div>

      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <h3>데이터를 불러올 수 없습니다</h3>
        <p>{{ error }}</p>
        <button class="retry-btn" @click="refreshData">다시 시도</button>
      </div>

      <div v-else-if="paginatedTransactions.length === 0" class="empty-container">
        <div class="empty-icon">📄</div>
        <h3>거래 내역이 없습니다</h3>
        <p>선택한 조건에 맞는 거래 내역이 없습니다.</p>
      </div>

      <div v-else class="table-container">
        <table class="transactions-table">
          <thead>
            <tr>
              <th @click="sortBy('date')" class="sortable">
                날짜
                <span class="sort-indicator" :class="getSortClass('date')">{{ getSortIcon('date') }}</span>
              </th>
              <th @click="sortBy('type')" class="sortable">
                유형
                <span class="sort-indicator" :class="getSortClass('type')">{{ getSortIcon('type') }}</span>
              </th>
              <th>상세 정보</th>
              <th @click="sortBy('amount')" class="sortable">
                금액
                <span class="sort-indicator" :class="getSortClass('amount')">{{ getSortIcon('amount') }}</span>
              </th>
              <th @click="sortBy('status')" class="sortable">
                상태
                <span class="sort-indicator" :class="getSortClass('status')">{{ getSortIcon('status') }}</span>
              </th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="transaction in paginatedTransactions" 
              :key="transaction.id"
              class="transaction-row"
              :class="{ 'pending': transaction.status === 'pending' }"
            >
              <td class="date-cell">
                <div class="date-info">
                  <span class="date">{{ formatDate(transaction.date) }}</span>
                  <span class="time">{{ formatTime(transaction.date) }}</span>
                </div>
              </td>
              
              <td class="type-cell">
                <div class="type-badge" :class="transaction.type">
                  <span class="type-icon">{{ getTypeIcon(transaction.type) }}</span>
                  <span class="type-text">{{ getTypeText(transaction.type) }}</span>
                </div>
              </td>
              
              <td class="details-cell">
                <div class="transaction-details">
                  <div class="details-main">{{ transaction.description }}</div>
                  <div v-if="transaction.metadata" class="details-meta">
                    {{ formatMetadata(transaction.metadata) }}
                  </div>
                </div>
              </td>
              
              <td class="amount-cell">
                <div class="amount-info">
                  <span class="amount" :class="{ 
                    positive: transaction.amount > 0, 
                    negative: transaction.amount < 0 
                  }">
                    {{ transaction.amount >= 0 ? '+' : '' }}{{ formatAmount(Math.abs(transaction.amount)) }}
                  </span>
                  <span class="currency">{{ transaction.currency }}</span>
                </div>
              </td>
              
              <td class="status-cell">
                <span class="status-badge" :class="transaction.status">
                  {{ getStatusText(transaction.status) }}
                </span>
              </td>
              
              <td class="actions-cell">
                <div class="action-buttons">
                  <button 
                    class="action-btn detail" 
                    @click="viewTransactionDetail(transaction)"
                    title="상세 보기"
                  >
                    👁️
                  </button>
                  <button 
                    v-if="canRetry(transaction)" 
                    class="action-btn retry" 
                    @click="retryTransaction(transaction)"
                    title="다시 시도"
                  >
                    🔄
                  </button>
                  <button 
                    v-if="canCancel(transaction)" 
                    class="action-btn cancel" 
                    @click="cancelTransaction(transaction)"
                    title="취소"
                  >
                    ❌
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          {{ paginationStart }}-{{ paginationEnd }} / {{ filteredTransactions.length }}개 항목
        </div>
        
        <div class="pagination-controls">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="goToPage(1)"
          >
            ⏮️
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            ◀️
          </button>
          
          <span class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              class="page-number" 
              :class="{ active: page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </span>
          
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            ▶️
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="goToPage(totalPages)"
          >
            ⏭️
          </button>
        </div>
        
        <div class="items-per-page">
          <label for="items-per-page">페이지당:</label>
          <select 
            id="items-per-page"
            v-model="itemsPerPage" 
            @change="currentPage = 1"
            class="items-select"
          >
            <option value="10">10개</option>
            <option value="25">25개</option>
            <option value="50">50개</option>
            <option value="100">100개</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 거래 상세 모달 -->
    <TransactionDetailModal 
      :show="showDetailModal"
      :transaction="selectedTransaction"
      @update:show="showDetailModal = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TransactionDetailModal from './TransactionDetailModal.vue'

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

interface TransactionStats {
  totalAmount: number
  totalCount: number
  monthlyCount: number
  totalRewards: number
}

// 반응형 데이터
const loading = ref(false)
const error = ref('')
const transactions = ref<Transaction[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(25)
const sortField = ref('date')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showDetailModal = ref(false)
const selectedTransaction = ref<Transaction | null>(null)

// 필터 상태
const filters = ref({
  type: '',
  dateRange: 'month',
  startDate: '',
  endDate: '',
  status: ''
})

// 통계 데이터
const stats = ref<TransactionStats>({
  totalAmount: 0,
  totalCount: 0,
  monthlyCount: 0,
  totalRewards: 0
})

// 필터링된 거래 내역
const filteredTransactions = computed(() => {
  let filtered = transactions.value

  // 유형 필터
  if (filters.value.type) {
    filtered = filtered.filter(t => t.type === filters.value.type)
  }

  // 상태 필터
  if (filters.value.status) {
    filtered = filtered.filter(t => t.status === filters.value.status)
  }

  // 기간 필터
  const now = new Date()
  let startDate: Date | null = null
  let endDate: Date | null = null

  switch (filters.value.dateRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      break
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      endDate = now
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = now
      break
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      endDate = now
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = now
      break
    case 'custom':
      if (filters.value.startDate) startDate = new Date(filters.value.startDate)
      if (filters.value.endDate) endDate = new Date(filters.value.endDate)
      break
  }

  if (startDate || endDate) {
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date)
      return (!startDate || transactionDate >= startDate) && 
             (!endDate || transactionDate <= endDate)
    })
  }

  // 검색 필터
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      (t.metadata && JSON.stringify(t.metadata).toLowerCase().includes(query))
    )
  }

  // 정렬
  filtered.sort((a, b) => {
    let aValue: any = a[sortField.value as keyof Transaction]
    let bValue: any = b[sortField.value as keyof Transaction]

    if (sortField.value === 'date') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (sortField.value === 'amount') {
      aValue = Math.abs(aValue)
      bValue = Math.abs(bValue)
    }

    if (sortDirection.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
})

// 페이지네이션 계산
const totalPages = computed(() => 
  Math.ceil(filteredTransactions.value.length / itemsPerPage.value)
)

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTransactions.value.slice(start, end)
})

const paginationStart = computed(() => 
  (currentPage.value - 1) * itemsPerPage.value + 1
)

const paginationEnd = computed(() => 
  Math.min(currentPage.value * itemsPerPage.value, filteredTransactions.value.length)
)

const visiblePages = computed(() => {
  const delta = 2
  const range = []
  const rangeWithDots = []

  for (
    let i = Math.max(2, currentPage.value - delta);
    i <= Math.min(totalPages.value - 1, currentPage.value + delta);
    i++
  ) {
    range.push(i)
  }

  if (currentPage.value - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (currentPage.value + delta < totalPages.value - 1) {
    rangeWithDots.push('...', totalPages.value)
  } else if (totalPages.value > 1) {
    rangeWithDots.push(totalPages.value)
  }

  return rangeWithDots.filter((item, index, arr) => arr.indexOf(item) === index)
})

// 유틸리티 함수들
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
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

const formatMetadata = (metadata: Record<string, any>): string => {
  if (metadata.assetName) return metadata.assetName
  if (metadata.productName) return metadata.productName
  if (metadata.fromToken && metadata.toToken) {
    return `${metadata.fromToken} → ${metadata.toToken}`
  }
  return ''
}

// 정렬 관련
const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

const getSortClass = (field: string): string => {
  if (sortField.value !== field) return ''
  return sortDirection.value === 'asc' ? 'asc' : 'desc'
}

const getSortIcon = (field: string): string => {
  if (sortField.value !== field) return '↕️'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

// 액션 관련
const canRetry = (transaction: Transaction): boolean => {
  return transaction.status === 'failed'
}

const canCancel = (transaction: Transaction): boolean => {
  return transaction.status === 'pending'
}

const viewTransactionDetail = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  showDetailModal.value = true
}

const retryTransaction = (transaction: Transaction) => {
  // TODO: 재시도 로직 구현
  console.log('Retry transaction:', transaction.id)
}

const cancelTransaction = (transaction: Transaction) => {
  // TODO: 취소 로직 구현
  console.log('Cancel transaction:', transaction.id)
}

// 페이지네이션
const goToPage = (page: number | string) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// 필터 및 검색
const applyFilters = () => {
  currentPage.value = 1
}

let searchTimeout: ReturnType<typeof setTimeout>
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

// 데이터 로딩
const loadTransactions = async () => {
  loading.value = true
  error.value = ''

  try {
    // TODO: 실제 API 호출로 교체
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 임시 데이터
    const mockTransactions: Transaction[] = [
      {
        id: 'TXN001',
        type: 'investment',
        description: '서울 역세권 상가 투자',
        amount: -1500.5,
        currency: 'GLEB',
        date: '2024-01-20T10:30:00Z',
        status: 'completed',
        metadata: { assetName: '서울 역세권 상가' }
      },
      {
        id: 'TXN002',
        type: 'shopping',
        description: '프리미엄 스마트폰',
        amount: -299.99,
        currency: 'GLIL',
        date: '2024-01-19T14:20:00Z',
        status: 'completed',
        metadata: { productName: 'iPhone 15 Pro' }
      },
      {
        id: 'TXN003',
        type: 'reward',
        description: '월간 투자 리워드',
        amount: 125.75,
        currency: 'GLEB',
        date: '2024-01-18T09:00:00Z',
        status: 'completed'
      },
      {
        id: 'TXN004',
        type: 'token_conversion',
        description: 'GLI-B → GLI-L 변환',
        amount: 0,
        currency: 'GLEB',
        date: '2024-01-17T16:45:00Z',
        status: 'completed',
        metadata: { fromToken: 'GLI-B', toToken: 'GLI-L', amount: 500 }
      },
      {
        id: 'TXN005',
        type: 'investment',
        description: '부산 워터프론트 투자',
        amount: -2500,
        currency: 'GLEB',
        date: '2024-01-16T11:15:00Z',
        status: 'pending',
        metadata: { assetName: '부산 워터프론트' }
      }
    ]

    transactions.value = mockTransactions

    // 통계 계산
    stats.value = {
      totalAmount: mockTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalCount: mockTransactions.length,
      monthlyCount: mockTransactions.filter(t => {
        const date = new Date(t.date)
        const now = new Date()
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }).length,
      totalRewards: mockTransactions
        .filter(t => t.type === 'reward')
        .reduce((sum, t) => sum + t.amount, 0)
    }

  } catch (err: any) {
    console.error('Failed to load transactions:', err)
    error.value = err.message || '거래 내역을 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  loadTransactions()
}

// 필터 변경 감지
watch(() => filters.value, () => {
  currentPage.value = 1
}, { deep: true })

// 컴포넌트 마운트
onMounted(() => {
  loadTransactions()
})
</script>

<style scoped>
.transaction-history {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.filters-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.refresh-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
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

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select, .date-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.filter-select:focus, .date-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.search-group {
  margin-top: 4px;
}

.search-input-wrapper {
  position: relative;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.table-section {
  background: white;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 64px 20px;
  text-align: center;
}

.error-icon,
.empty-icon {
  font-size: 3rem;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.transactions-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  position: sticky;
  top: 0;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: #f3f4f6;
}

.sort-indicator {
  margin-left: 8px;
  font-size: 0.75rem;
}

.transaction-row {
  transition: background-color 0.2s;
}

.transaction-row:hover {
  background: #f9fafb;
}

.transaction-row.pending {
  background: #fef3c7;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 500;
  color: #111827;
}

.time {
  font-size: 0.75rem;
  color: #6b7280;
}

.type-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
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

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.details-main {
  font-weight: 500;
  color: #111827;
}

.details-meta {
  font-size: 0.875rem;
  color: #6b7280;
}

.amount-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.amount {
  font-weight: 600;
  font-size: 1rem;
}

.amount.positive {
  color: #059669;
}

.amount.negative {
  color: #dc2626;
}

.currency {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
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

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn,
.page-number {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled),
.page-number:hover {
  background: #f3f4f6;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #6b7280;
}

.items-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background: white;
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
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .date-inputs {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .transactions-table {
    font-size: 0.875rem;
  }
  
  .transactions-table th,
  .transactions-table td {
    padding: 12px 8px;
  }
  
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .pagination-controls {
    justify-content: center;
  }
}
</style>