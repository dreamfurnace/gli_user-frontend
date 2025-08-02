<template>
  <div class="investment-portfolio">
    <!-- 헤더 -->
    <div class="portfolio-header">
      <h1>투자 포트폴리오</h1>
      <p class="header-description">나의 RWA 투자 현황과 수익률을 확인하세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>포트폴리오 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchPortfolioData">다시 시도</button>
    </div>

    <!-- 포트폴리오 내용 -->
    <div v-else class="portfolio-content">
      <!-- 투자 요약 카드 -->
      <div class="summary-cards">
        <div class="summary-card total-investment">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <h3>총 투자금액</h3>
            <p class="amount">{{ formatNumber(stats.total_invested) }} GLEB</p>
            <span class="change-indicator">원금</span>
          </div>
        </div>

        <div class="summary-card current-value">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <h3>현재 가치</h3>
            <p class="amount">{{ formatNumber(stats.total_current_value) }} GLEB</p>
            <span class="change-indicator">평가액</span>
          </div>
        </div>

        <div class="summary-card profit-loss">
          <div class="card-icon">{{ stats.total_profit_loss >= 0 ? '💹' : '📉' }}</div>
          <div class="card-content">
            <h3>손익</h3>
            <p 
              class="amount"
              :class="{ 
                profit: stats.total_profit_loss > 0, 
                loss: stats.total_profit_loss < 0 
              }"
            >
              {{ stats.total_profit_loss >= 0 ? '+' : '' }}{{ formatNumber(stats.total_profit_loss) }} GLEB
            </p>
            <span 
              class="change-indicator"
              :class="{ 
                profit: stats.profit_loss_percentage > 0, 
                loss: stats.profit_loss_percentage < 0 
              }"
            >
              {{ stats.profit_loss_percentage >= 0 ? '+' : '' }}{{ stats.profit_loss_percentage.toFixed(2) }}%
            </span>
          </div>
        </div>

        <div class="summary-card active-investments">
          <div class="card-icon">🏗️</div>
          <div class="card-content">
            <h3>진행 중인 투자</h3>
            <p class="amount">{{ stats.active_investments_count }}건</p>
            <span class="change-indicator">활성 투자</span>
          </div>
        </div>
      </div>

      <!-- 포트폴리오 분석 -->
      <div class="portfolio-analysis">
        <div class="analysis-section">
          <h2>카테고리별 분산</h2>
          <div class="breakdown-grid">
            <div 
              v-for="(categoryData, categoryName) in portfolio.category_breakdown" 
              :key="categoryName"
              class="breakdown-item"
            >
              <div class="breakdown-header">
                <h4>{{ categoryName }}</h4>
                <span class="breakdown-percentage">
                  {{ calculatePercentage(categoryData.total_invested, stats.total_invested) }}%
                </span>
              </div>
              <div class="breakdown-amounts">
                <div class="amount-row">
                  <span class="label">투자금:</span>
                  <span class="value">{{ formatNumber(categoryData.total_invested) }} GLEB</span>
                </div>
                <div class="amount-row">
                  <span class="label">현재가치:</span>
                  <span class="value">{{ formatNumber(categoryData.total_current_value) }} GLEB</span>
                </div>
                <div class="amount-row">
                  <span class="label">건수:</span>
                  <span class="value">{{ categoryData.count }}건</span>
                </div>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${calculatePercentage(categoryData.total_invested, stats.total_invested)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="analysis-section">
          <h2>위험도별 분산</h2>
          <div class="risk-breakdown">
            <div 
              v-for="(riskData, riskLevel) in portfolio.risk_breakdown" 
              :key="riskLevel"
              class="risk-item"
              :class="`risk-${getRiskClass(riskLevel)}`"
            >
              <div class="risk-header">
                <div class="risk-badge">{{ riskLevel }}</div>
                <span class="risk-percentage">
                  {{ calculatePercentage(riskData.total_invested, stats.total_invested) }}%
                </span>
              </div>
              <div class="risk-amounts">
                <span class="amount">{{ formatNumber(riskData.total_invested) }} GLEB</span>
                <span class="count">({{ riskData.count }}건)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 최근 투자 내역 -->
      <div class="recent-investments">
        <div class="section-header">
          <h2>최근 투자 내역</h2>
          <button class="view-all-btn" @click="showAllInvestments">
            전체 보기
          </button>
        </div>
        
        <div class="investments-list">
          <div 
            v-for="investment in portfolio.recent_investments" 
            :key="investment.id"
            class="investment-item"
          >
            <div class="investment-info">
              <div class="asset-name">{{ investment.rwa_asset_name }}</div>
              <div class="investment-date">
                {{ formatDate(investment.investment_date) }}
              </div>
            </div>
            
            <div class="investment-amounts">
              <div class="amount-invested">
                <span class="label">투자금:</span>
                <span class="value">{{ formatNumber(investment.amount_gleb) }} GLEB</span>
              </div>
              <div class="current-value">
                <span class="label">현재가치:</span>
                <span class="value">{{ formatNumber(investment.current_value_gleb) }} GLEB</span>
              </div>
            </div>
            
            <div class="investment-performance">
              <div 
                class="profit-loss"
                :class="{ 
                  profit: investment.current_profit_loss > 0, 
                  loss: investment.current_profit_loss < 0 
                }"
              >
                {{ investment.current_profit_loss >= 0 ? '+' : '' }}{{ formatNumber(investment.current_profit_loss) }} GLEB
              </div>
              <div 
                class="profit-percentage"
                :class="{ 
                  profit: investment.profit_loss_percentage > 0, 
                  loss: investment.profit_loss_percentage < 0 
                }"
              >
                ({{ investment.profit_loss_percentage >= 0 ? '+' : '' }}{{ investment.profit_loss_percentage.toFixed(2) }}%)
              </div>
            </div>
            
            <div class="investment-status">
              <span 
                class="status-badge"
                :class="getStatusClass(investment.status)"
              >
                {{ getStatusDisplay(investment.status) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 투자 내역이 없는 경우 -->
        <div v-if="portfolio.recent_investments?.length === 0" class="empty-investments">
          <div class="empty-icon">📊</div>
          <h3>투자 내역이 없습니다</h3>
          <p>RWA 자산에 투자하여 포트폴리오를 시작해보세요</p>
          <button class="start-investing-btn" @click="goToInvestments">
            투자하러 가기
          </button>
        </div>
      </div>

      <!-- 성과 차트 (향후 구현) -->
      <!-- <div class="performance-chart">
        <h2>투자 성과 차트</h2>
        <div class="chart-placeholder">
          차트 영역 (Chart.js 또는 다른 차트 라이브러리 사용 예정)
        </div>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getInvestmentStats, getInvestmentPortfolio } from '../services/api'

interface InvestmentStats {
  total_invested: number
  total_current_value: number
  total_profit_loss: number
  profit_loss_percentage: number
  active_investments_count: number
  completed_investments_count: number
}

interface InvestmentPortfolio {
  category_breakdown: Record<string, {
    total_invested: number
    total_current_value: number
    count: number
  }>
  risk_breakdown: Record<string, {
    total_invested: number
    total_current_value: number
    count: number
  }>
  recent_investments: Array<{
    id: string
    rwa_asset_name: string
    amount_gleb: number
    current_value_gleb: number
    current_profit_loss: number
    profit_loss_percentage: number
    investment_date: string
    status: string
  }>
}

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

const portfolio = reactive<InvestmentPortfolio>({
  category_breakdown: {},
  risk_breakdown: {},
  recent_investments: []
})

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
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

// 백분율 계산
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

// 위험도 클래스 매핑
const getRiskClass = (riskLevel: string): string => {
  const riskMap: Record<string, string> = {
    '낮음': 'low',
    '보통': 'medium',
    '높음': 'high',
    '매우 높음': 'very-high'
  }
  return riskMap[riskLevel] || 'medium'
}

// 상태 클래스 매핑
const getStatusClass = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'confirmed': 'confirmed',
    'active': 'active',
    'completed': 'completed',
    'cancelled': 'cancelled'
  }
  return statusMap[status] || 'pending'
}

// 상태 표시 텍스트
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '처리 중',
    'confirmed': '확정',
    'active': '투자 중',
    'completed': '완료',
    'cancelled': '취소'
  }
  return statusMap[status] || status
}

// 포트폴리오 데이터 조회
const fetchPortfolioData = async () => {
  loading.value = true
  error.value = ''

  try {
    // 병렬로 통계와 포트폴리오 데이터 조회
    const [statsResponse, portfolioResponse] = await Promise.all([
      getInvestmentStats(),
      getInvestmentPortfolio()
    ])

    // 통계 데이터 업데이트
    Object.assign(stats, statsResponse.data)

    // 포트폴리오 데이터 업데이트
    Object.assign(portfolio, portfolioResponse.data)

  } catch (err: any) {
    console.error('Failed to fetch portfolio data:', err)
    error.value = err.message || '포트폴리오 데이터를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 전체 투자 내역 보기
const showAllInvestments = () => {
  // TODO: 전체 투자 내역 페이지로 이동
  console.log('Show all investments')
}

// 투자하러 가기
const goToInvestments = () => {
  // TODO: RWA 투자 페이지로 이동
  console.log('Go to investments page')
}

// 컴포넌트 마운트
onMounted(() => {
  fetchPortfolioData()
})
</script>

<style scoped>
.investment-portfolio {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.portfolio-header {
  text-align: center;
  margin-bottom: 32px;
}

.portfolio-header h1 {
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

.portfolio-content {
  space-y: 32px;
}

/* 요약 카드 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.card-content h3 {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-content .amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.card-content .amount.profit {
  color: #059669;
}

.card-content .amount.loss {
  color: #dc2626;
}

.change-indicator {
  font-size: 0.75rem;
  color: #9ca3af;
}

.change-indicator.profit {
  color: #059669;
}

.change-indicator.loss {
  color: #dc2626;
}

/* 포트폴리오 분석 */
.portfolio-analysis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.analysis-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.analysis-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 20px;
}

.breakdown-grid {
  space-y: 16px;
}

.breakdown-item {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
}

.breakdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.breakdown-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.breakdown-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #3b82f6;
}

.breakdown-amounts {
  space-y: 6px;
  margin-bottom: 12px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.amount-row .label {
  color: #6b7280;
}

.amount-row .value {
  font-weight: 500;
  color: #111827;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 3px;
  transition: width 0.3s;
}

/* 위험도 분석 */
.risk-breakdown {
  space-y: 12px;
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.risk-item.risk-low {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.risk-item.risk-medium {
  background: #fffbeb;
  border-color: #fed7aa;
}

.risk-item.risk-high,
.risk-item.risk-very-high {
  background: #fef2f2;
  border-color: #fecaca;
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.risk-low .risk-badge {
  background: #059669;
}

.risk-medium .risk-badge {
  background: #d97706;
}

.risk-high .risk-badge,
.risk-very-high .risk-badge {
  background: #dc2626;
}

.risk-percentage {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.risk-amounts {
  display: flex;
  align-items: center;
  gap: 8px;
}

.risk-amounts .amount {
  font-weight: 600;
  color: #111827;
}

.risk-amounts .count {
  font-size: 0.875rem;
  color: #6b7280;
}

/* 최근 투자 내역 */
.recent-investments {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.view-all-btn {
  padding: 6px 12px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: #e5e7eb;
}

.investments-list {
  space-y: 12px;
}

.investment-item {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
}

.investment-item:hover {
  background: #f3f4f6;
}

.investment-info .asset-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.investment-info .investment-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.investment-amounts {
  space-y: 4px;
}

.investment-amounts > div {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.investment-amounts .label {
  color: #6b7280;
}

.investment-amounts .value {
  font-weight: 500;
  color: #111827;
}

.investment-performance {
  text-align: right;
}

.profit-loss {
  font-weight: 600;
  margin-bottom: 2px;
}

.profit-loss.profit {
  color: #059669;
}

.profit-loss.loss {
  color: #dc2626;
}

.profit-percentage {
  font-size: 0.875rem;
}

.profit-percentage.profit {
  color: #059669;
}

.profit-percentage.loss {
  color: #dc2626;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.confirmed {
  background: #dbeafe;
  color: #2563eb;
}

.status-badge.active {
  background: #dcfce7;
  color: #059669;
}

.status-badge.completed {
  background: #f3f4f6;
  color: #374151;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.empty-investments {
  text-align: center;
  padding: 48px 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-investments h3 {
  color: #111827;
  margin-bottom: 8px;
}

.empty-investments p {
  color: #6b7280;
  margin-bottom: 24px;
}

.start-investing-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.start-investing-btn:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .investment-portfolio {
    padding: 16px;
  }
  
  .portfolio-header h1 {
    font-size: 2rem;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .portfolio-analysis {
    grid-template-columns: 1fr;
  }
  
  .investment-item {
    grid-template-columns: 1fr;
    gap: 12px;
    text-align: left;
  }
  
  .investment-performance {
    text-align: left;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>