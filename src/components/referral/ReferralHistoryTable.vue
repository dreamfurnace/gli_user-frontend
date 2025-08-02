<template>
  <div class="history-table-container">
    <div class="table-header">
      <h3 class="table-title">전체 레퍼럴 내역</h3>
      
      <!-- Filters -->
      <div class="table-filters">
        <div class="filter-group">
          <label class="filter-label">상태</label>
          <select v-model="filters.status" class="filter-select">
            <option value="">전체</option>
            <option value="pending">가입 대기</option>
            <option value="confirmed">가입 완료</option>
            <option value="rewarded">보상 지급</option>
            <option value="expired">만료됨</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">기간</label>
          <select v-model="filters.period" class="filter-select">
            <option value="">전체 기간</option>
            <option value="7d">최근 7일</option>
            <option value="30d">최근 30일</option>
            <option value="90d">최근 90일</option>
            <option value="1y">최근 1년</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">보상 유형</label>
          <select v-model="filters.rewardType" class="filter-select">
            <option value="">전체</option>
            <option value="base">기본 보상</option>
            <option value="bonus">보너스 보상</option>
            <option value="special">특별 보상</option>
          </select>
        </div>
        
        <button class="filter-clear-btn" @click="clearFilters">
          필터 초기화
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>내역을 불러오는 중...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button class="retry-button" @click="loadHistory">
        다시 시도
      </button>
    </div>

    <!-- Table -->
    <div v-else class="table-wrapper">
      <table class="history-table">
        <thead>
          <tr>
            <th @click="sortBy('created_at')" class="sortable">
              초대 일시
              <span class="sort-indicator" :class="getSortClass('created_at')">↕️</span>
            </th>
            <th>레퍼럴 코드</th>
            <th @click="sortBy('status')" class="sortable">
              상태
              <span class="sort-indicator" :class="getSortClass('status')">↕️</span>
            </th>
            <th @click="sortBy('reward_amount_glib')" class="sortable">
              보상 금액
              <span class="sort-indicator" :class="getSortClass('reward_amount_glib')">↕️</span>
            </th>
            <th>보상 유형</th>
            <th>트랜잭션</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedHistory" :key="record.id" class="table-row">
            <td class="date-cell">
              <div class="date-info">
                <div class="date">{{ formatDate(record.created_at) }}</div>
                <div class="time">{{ formatTime(record.created_at) }}</div>
              </div>
            </td>
            
            <td class="code-cell">
              <div class="referral-code">
                <span class="code">{{ record.referral_code }}</span>
                <button class="copy-btn" @click="copyToClipboard(record.referral_code)">
                  📋
                </button>
              </div>
            </td>
            
            <td class="status-cell">
              <span class="status-badge" :class="getStatusClass(record.status)">
                {{ getStatusText(record.status) }}
              </span>
              <div v-if="record.status === 'confirmed' && record.reward_sent_at" class="reward-date">
                보상: {{ formatDate(record.reward_sent_at) }}
              </div>
            </td>
            
            <td class="reward-cell">
              <div v-if="record.reward_amount_glib > 0" class="reward-amount">
                <span class="amount">{{ formatGLIBAmount(record.reward_amount_glib) }}</span>
                <span class="unit">GLI-B</span>
              </div>
              <div v-else class="no-reward">-</div>
            </td>
            
            <td class="type-cell">
              <span v-if="record.reward_type" class="type-badge" :class="record.reward_type">
                {{ getTypeText(record.reward_type) }}
              </span>
              <span v-else>-</span>
            </td>
            
            <td class="transaction-cell">
              <div v-if="record.transaction_hash" class="transaction-info">
                <button class="hash-btn" @click="copyToClipboard(record.transaction_hash)">
                  {{ formatHash(record.transaction_hash) }}
                </button>
                <a 
                  :href="getExplorerUrl(record.transaction_hash)" 
                  target="_blank" 
                  class="explorer-link"
                >
                  🔗
                </a>
              </div>
              <span v-else>-</span>
            </td>
            
            <td class="action-cell">
              <div class="action-buttons">
                <button 
                  v-if="record.status === 'pending' && canResendInvite(record)"
                  class="action-btn resend"
                  @click="resendInvite(record.id)"
                >
                  재전송
                </button>
                <button 
                  v-if="record.status === 'confirmed' && !record.reward_sent_at"
                  class="action-btn claim"
                  @click="claimReward(record.id)"
                >
                  보상 수령
                </button>
                <button 
                  class="action-btn details"
                  @click="showDetails(record)"
                >
                  상세
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="filteredHistory.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>레퍼럴 내역이 없습니다</h3>
        <p>조건에 맞는 레퍼럴 내역을 찾을 수 없습니다.</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="filteredHistory.length > 0" class="pagination">
      <div class="pagination-info">
        {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredHistory.length) }} 
        / {{ filteredHistory.length }}개 항목
      </div>
      
      <div class="pagination-controls">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          이전
        </button>
        
        <span class="page-numbers">
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="page-number"
            :class="{ active: page === currentPage }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </span>
        
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-section">
      <button class="export-btn" @click="exportToCSV">
        📊 CSV 내보내기
      </button>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useReferral, type ReferralRecord } from '@/composables/useReferral'
import { useReferralRewards } from '@/composables/useReferralRewards'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
}

const props = defineProps<Props>()

// Composables
const { referralHistory, isLoading, error, getReferralHistory } = useReferral()
const { formatGLIBAmount, processReward } = useReferralRewards()

// State
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortField = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showSuccessMessage = ref(false)
const successMessage = ref('')

const filters = ref({
  status: '',
  period: '',
  rewardType: ''
})

// Computed
const filteredHistory = computed(() => {
  let filtered = referralHistory.value || []

  // Status filter
  if (filters.value.status) {
    filtered = filtered.filter(record => record.status === filters.value.status)
  }

  // Period filter
  if (filters.value.period) {
    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }
    
    const days = periodDays[filters.value.period as keyof typeof periodDays]
    if (days) {
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(record => new Date(record.created_at) >= cutoffDate)
    }
  }

  // Reward type filter
  if (filters.value.rewardType) {
    filtered = filtered.filter(record => record.reward_type === filters.value.rewardType)
  }

  // Sort
  filtered.sort((a, b) => {
    const aValue = a[sortField.value as keyof ReferralRecord]
    const bValue = b[sortField.value as keyof ReferralRecord]
    
    if (sortDirection.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  return filtered
})

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredHistory.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredHistory.value.length / itemsPerPage.value)
)

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const loadHistory = async () => {
  try {
    await getReferralHistory(props.userId, 1, 1000) // Get all history
  } catch (err) {
    console.error('Failed to load referral history:', err)
  }
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'desc'
  }
}

const getSortClass = (field: string) => {
  if (sortField.value === field) {
    return sortDirection.value === 'asc' ? 'asc' : 'desc'
  }
  return ''
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const clearFilters = () => {
  filters.value = {
    status: '',
    period: '',
    rewardType: ''
  }
  currentPage.value = 1
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatHash = (hash: string): string => {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const getStatusText = (status: string): string => {
  const statusMap = {
    'pending': '가입 대기',
    'confirmed': '가입 완료',
    'rewarded': '보상 지급',
    'expired': '만료됨'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getStatusClass = (status: string): string => {
  return `status-${status}`
}

const getTypeText = (type: string): string => {
  const typeMap = {
    'base': '기본',
    'bonus': '보너스',
    'special': '특별'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

const getExplorerUrl = (hash: string): string => {
  return `https://explorer.solana.com/tx/${hash}`
}

const canResendInvite = (record: ReferralRecord): boolean => {
  const hoursSinceCreated = (Date.now() - new Date(record.created_at).getTime()) / (1000 * 60 * 60)
  return hoursSinceCreated > 24 // Can resend after 24 hours
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    showSuccessToast('클립보드에 복사되었습니다!')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

const showSuccessToast = (message: string) => {
  successMessage.value = message
  showSuccessMessage.value = true
  
  setTimeout(() => {
    showSuccessMessage.value = false
  }, 3000)
}

const resendInvite = async (recordId: string) => {
  try {
    // Implement resend invite logic
    console.log('Resending invite for record:', recordId)
    showSuccessToast('초대 링크가 재전송되었습니다!')
    
    securityLogger.log('REFERRAL_INVITE_RESENT', {
      userId: props.userId,
      recordId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to resend invite:', error)
    showSuccessToast('초대 재전송에 실패했습니다.')
  }
}

const claimReward = async (recordId: string) => {
  try {
    const success = await processReward(recordId)
    if (success) {
      showSuccessToast('보상이 성공적으로 수령되었습니다!')
      await loadHistory() // Refresh data
    } else {
      showSuccessToast('보상 수령에 실패했습니다.')
    }
  } catch (error) {
    console.error('Failed to claim reward:', error)
    showSuccessToast('보상 수령 중 오류가 발생했습니다.')
  }
}

const showDetails = (record: ReferralRecord) => {
  // Implement details modal or navigation
  console.log('Show details for record:', record)
  alert('상세 정보 기능은 곧 제공될 예정입니다.')
}

const exportToCSV = () => {
  const csvData = [
    ['초대 일시', '레퍼럴 코드', '상태', '보상 금액', '보상 유형', '트랜잭션 해시'],
    ...filteredHistory.value.map(record => [
      formatDate(record.created_at),
      record.referral_code,
      getStatusText(record.status),
      record.reward_amount_glib > 0 ? `${formatGLIBAmount(record.reward_amount_glib)} GLI-B` : '-',
      record.reward_type ? getTypeText(record.reward_type) : '-',
      record.transaction_hash || '-'
    ])
  ]
  
  const csvContent = csvData.map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  link.href = URL.createObjectURL(blob)
  link.download = `referral-history-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  showSuccessToast('CSV 파일이 다운로드되었습니다!')
}

// Watch filters for auto-refresh
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

// Initialize
onMounted(async () => {
  await loadHistory()
})
</script>

<style scoped>
.history-table-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 24px;
}

.table-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.table-filters {
  display: flex;
  gap: 16px;
  align-items: end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 14px;
}

.filter-clear-btn {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 60px 20px;
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

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 24px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.history-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
}

.history-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.history-table th.sortable:hover {
  background: #e9ecef;
}

.sort-indicator {
  margin-left: 4px;
  opacity: 0.5;
}

.sort-indicator.asc {
  opacity: 1;
  transform: rotate(180deg);
}

.sort-indicator.desc {
  opacity: 1;
}

.history-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
  vertical-align: top;
}

.table-row:hover {
  background: #f8f9fa;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date {
  font-weight: 500;
  color: #333;
}

.time {
  font-size: 12px;
  color: #666;
}

.referral-code {
  display: flex;
  align-items: center;
  gap: 8px;
}

.code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #0d6efd;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0.7;
}

.copy-btn:hover {
  opacity: 1;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-rewarded {
  background: #d4edda;
  color: #155724;
}

.status-expired {
  background: #f8d7da;
  color: #721c24;
}

.reward-date {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.reward-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount {
  font-weight: 600;
  color: #28a745;
}

.unit {
  font-size: 12px;
  color: #666;
}

.no-reward {
  color: #666;
}

.type-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
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

.transaction-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hash-btn {
  background: none;
  border: none;
  color: #0d6efd;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  text-decoration: underline;
}

.explorer-link {
  text-decoration: none;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
}

.action-btn.resend {
  background: #17a2b8;
  color: white;
}

.action-btn.claim {
  background: #28a745;
  color: white;
}

.action-btn.details {
  background: #6c757d;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 0;
  border-top: 1px solid #e9ecef;
}

.pagination-info {
  font-size: 14px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.page-number:hover {
  background: #f8f9fa;
}

.page-number.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.export-section {
  border-top: 1px solid #e9ecef;
  padding-top: 16px;
}

.export-btn {
  padding: 12px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.export-btn:hover {
  background: #218838;
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
  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .table-filters {
    justify-content: center;
  }
  
  .history-table {
    font-size: 14px;
  }
  
  .history-table th,
  .history-table td {
    padding: 8px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 16px;
  }
  
  .page-numbers {
    order: -1;
  }
}
</style>