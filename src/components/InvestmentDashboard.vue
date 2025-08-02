<template>
  <div class="investment-dashboard">
    <!-- 포트폴리오 요약 카드 -->
    <div class="dashboard-cards">
      <div class="dashboard-card portfolio-summary">
        <div class="card-header">
          <h3>📊 투자 포트폴리오</h3>
          <button class="refresh-btn" @click="refreshData" :disabled="loading">
            <span v-if="loading" class="loading-spinner small"></span>
            <span v-else>🔄</span>
          </button>
        </div>
        
        <div v-if="loading" class="card-loading">
          <div class="loading-spinner"></div>
          <span>로딩 중...</span>
        </div>
        
        <div v-else-if="error" class="card-error">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ error }}</span>
          <button class="retry-btn" @click="refreshData">다시 시도</button>
        </div>
        
        <div v-else class="portfolio-stats">
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-label">총 투자금액</span>
              <span class="stat-value">{{ formatNumber(stats.total_invested) }} GLEB</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">현재 가치</span>
              <span class="stat-value">{{ formatNumber(stats.total_current_value) }} GLEB</span>
            </div>
          </div>
          
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-label">손익</span>
              <span 
                class="stat-value"
                :class="{
                  profit: stats.total_profit_loss > 0,
                  loss: stats.total_profit_loss < 0
                }"
              >
                {{ stats.total_profit_loss >= 0 ? '+' : '' }}{{ formatNumber(stats.total_profit_loss) }} GLEB
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">수익률</span>
              <span 
                class="stat-value"
                :class="{
                  profit: stats.profit_loss_percentage > 0,
                  loss: stats.profit_loss_percentage < 0
                }"
              >
                {{ stats.profit_loss_percentage >= 0 ? '+' : '' }}{{ stats.profit_loss_percentage.toFixed(2) }}%
              </span>
            </div>
          </div>
          
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-label">진행 중인 투자</span>
              <span class="stat-value">{{ stats.active_investments_count }}건</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">완료된 투자</span>
              <span class="stat-value">{{ stats.completed_investments_count }}건</span>
            </div>
          </div>
        </div>
        
        <div class="card-actions">
          <router-link to="/rwa-assets" class="action-btn primary">
            새 투자하기
          </router-link>
          <button @click="viewPortfolio" class="action-btn secondary">
            포트폴리오 상세보기
          </button>
        </div>
      </div>

      <!-- 최근 투자 내역 카드 -->
      <div class="dashboard-card recent-investments">
        <div class="card-header">
          <h3>📈 최근 투자</h3>
        </div>
        
        <div v-if="recentInvestments.length > 0" class="investment-list">
          <div 
            v-for="investment in recentInvestments.slice(0, 3)" 
            :key="investment.id"
            class="investment-item"
          >
            <div class="investment-info">
              <span class="asset-name">{{ investment.rwa_asset_name }}</span>
              <span class="investment-date">{{ formatDate(investment.investment_date) }}</span>
            </div>
            <div class="investment-amount">
              <span class="amount">{{ formatNumber(investment.amount_gleb) }} GLEB</span>
              <span 
                class="profit-loss"
                :class="{
                  profit: investment.current_profit_loss > 0,
                  loss: investment.current_profit_loss < 0
                }"
              >
                {{ investment.current_profit_loss >= 0 ? '+' : '' }}{{ formatNumber(investment.current_profit_loss) }}
              </span>
            </div>
          </div>
        </div>
        
        <div v-else class="no-investments">
          <span class="empty-icon">💼</span>
          <span class="empty-text">투자 내역이 없습니다</span>
        </div>
        
        <div class="card-actions">
          <button @click="viewAllInvestments" class="action-btn secondary">
            전체 내역 보기
          </button>
        </div>
      </div>
    </div>

    <!-- 카테고리별 분산 차트 -->
    <div class="dashboard-card category-breakdown">
      <div class="card-header">
        <h3>🏷️ 카테고리별 분산</h3>
      </div>
      
      <div v-if="categoryData && Object.keys(categoryData).length > 0" class="category-chart">
        <div 
          v-for="(data, category) in categoryData" 
          :key="category"
          class="category-item"
        >
          <div class="category-info">
            <span class="category-name">{{ category }}</span>
            <span class="category-percentage">{{ calculatePercentage(data.total_invested, stats.total_invested) }}%</span>
          </div>
          <div class="category-bar">
            <div 
              class="bar-fill" 
              :style="{ width: `${calculatePercentage(data.total_invested, stats.total_invested)}%` }"
            ></div>
          </div>
          <div class="category-stats">
            <span class="invested">{{ formatNumber(data.total_invested) }} GLEB</span>
            <span class="count">{{ data.count }}건</span>
          </div>
        </div>
      </div>
      
      <div v-else class="no-data">
        <span class="empty-icon">📊</span>
        <span class="empty-text">분산 데이터가 없습니다</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getInvestmentStats, getInvestmentPortfolio } from '../services/api'

interface InvestmentStats {
  total_invested: number
  total_current_value: number
  total_profit_loss: number
  profit_loss_percentage: number
  active_investments_count: number
  completed_investments_count: number
}

interface RecentInvestment {
  id: string
  rwa_asset_name: string
  amount_gleb: number
  current_value_gleb: number
  current_profit_loss: number
  profit_loss_percentage: number
  investment_date: string
  status: string
}

interface CategoryData {
  total_invested: number
  total_current_value: number
  count: number
}

const router = useRouter()

// 반응형 데이터
const loading = ref(false)
const error = ref('')

const stats = reactive<InvestmentStats>({
  total_invested: 0,
  total_current_value: 0,
  total_profit_loss: 0,
  profit_loss_percentage: 0,
  active_investments_count: 0,
  completed_investments_count: 0
})

const recentInvestments = ref<RecentInvestment[]>([])
const categoryData = ref<Record<string, CategoryData>>({})

// 숫자 포맷팅
const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// 백분율 계산
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// 데이터 새로고침
const refreshData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [statsResponse, portfolioResponse] = await Promise.all([
      getInvestmentStats(),
      getInvestmentPortfolio()
    ])

    // 통계 데이터 업데이트
    Object.assign(stats, statsResponse.data)

    // 포트폴리오 데이터 업데이트
    const portfolioData = portfolioResponse.data
    recentInvestments.value = portfolioData.recent_investments || []
    categoryData.value = portfolioData.category_breakdown || {}

  } catch (err: any) {
    console.error('Failed to fetch investment data:', err)
    error.value = err.message || '데이터를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 포트폴리오 상세보기
const viewPortfolio = () => {
  // 부모 컴포넌트의 탭 변경을 위한 이벤트 발생
  const event = new CustomEvent('change-tab', { detail: 'portfolio' })
  document.dispatchEvent(event)
}

// 전체 투자 내역 보기
const viewAllInvestments = () => {
  // 포트폴리오 탭으로 이동
  viewPortfolio()
}

// 컴포넌트 마운트
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.investment-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.dashboard-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.card-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: #6b7280;
}

.card-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
}

.error-text {
  color: #dc2626;
  font-weight: 500;
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

.portfolio-stats {
  margin-bottom: 24px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.stat-value.profit {
  color: #059669;
}

.stat-value.loss {
  color: #dc2626;
}

.card-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
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

.recent-investments {
  display: flex;
  flex-direction: column;
}

.investment-list {
  flex: 1;
  margin-bottom: 20px;
}

.investment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.investment-item:last-child {
  border-bottom: none;
}

.investment-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.asset-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.investment-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.investment-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.profit-loss {
  font-size: 0.75rem;
  font-weight: 500;
}

.profit-loss.profit {
  color: #059669;
}

.profit-loss.loss {
  color: #dc2626;
}

.no-investments,
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: #6b7280;
}

.empty-icon {
  font-size: 2rem;
}

.empty-text {
  font-size: 0.875rem;
}

.category-breakdown {
  grid-column: 1 / -1;
}

.category-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  display: grid;
  grid-template-columns: 2fr 3fr 1fr;
  gap: 16px;
  align-items: center;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.category-percentage {
  font-size: 0.75rem;
  color: #3b82f6;
  font-weight: 500;
}

.category-bar {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s;
}

.category-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.invested {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.count {
  font-size: 0.75rem;
  color: #6b7280;
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
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
  
  .stat-row {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-direction: column;
  }
  
  .category-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .category-stats {
    align-items: flex-start;
  }
}
</style>