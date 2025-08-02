<template>
  <div class="rwa-asset-detail-view">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>자산 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>자산을 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchAssetDetail">다시 시도</button>
    </div>

    <!-- 자산 상세 내용 -->
    <div v-else-if="asset" class="asset-detail-content">
      <!-- 상단 캐러셀 섹션 -->
      <div class="carousel-section">
        <div class="carousel-header">
          <h2>다른 투자 자산 둘러보기</h2>
          <div class="carousel-controls">
            <button @click="prevSlide" :disabled="currentSlideIndex === 0" class="carousel-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            <button @click="nextSlide" :disabled="currentSlideIndex >= maxSlideIndex" class="carousel-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        <div class="carousel-container" ref="carouselContainer">
          <div class="carousel-track" :style="{ transform: `translateX(-${currentSlideIndex * slideWidth}px)` }">
            <div 
              v-for="otherAsset in otherAssets" 
              :key="otherAsset.id"
              :class="['carousel-item', { active: otherAsset.id === asset.id }]"
              @click="navigateToAsset(otherAsset.id)"
            >
              <div class="carousel-image">
                <img 
                  :src="otherAsset.main_image_url || '/placeholder-asset.jpg'" 
                  :alt="otherAsset.name"
                  @error="handleImageError"
                >
                <div v-if="otherAsset.is_featured" class="featured-badge">⭐</div>
                <div v-if="otherAsset.id === asset.id" class="current-badge">현재 보는 자산</div>
              </div>
              <div class="carousel-info">
                <h4>{{ otherAsset.name }}</h4>
                <p class="apy">{{ otherAsset.expected_apy }}% APY</p>
                <span class="risk-badge" :class="`risk-${otherAsset.risk_level}`">
                  {{ getRiskLevelDisplay(otherAsset.risk_level_display) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 메인 자산 상세 정보 -->
      <div class="main-content">
        <div class="asset-header">
          <div class="header-left">
            <div class="breadcrumb">
              <router-link to="/rwa-assets" class="breadcrumb-link">RWA 자산</router-link>
              <span class="breadcrumb-separator">></span>
              <span class="breadcrumb-current">{{ asset.name }}</span>
            </div>
            <h1 class="asset-title">{{ asset.name }}</h1>
            <p class="asset-description">{{ asset.short_description }}</p>
            
            <div class="asset-badges">
              <span v-if="asset.is_featured" class="featured-badge-main">⭐ 추천 자산</span>
              <span class="category-badge">{{ asset.category_name }}</span>
              <span class="status-badge" :class="asset.status">{{ getStatusText(asset.status) }}</span>
            </div>
          </div>
          
          <div class="header-right">
            <div class="main-image">
              <img 
                :src="asset.main_image_url || '/placeholder-asset.jpg'" 
                :alt="asset.name"
                @error="handleImageError"
              >
            </div>
          </div>
        </div>

        <!-- 핵심 투자 지표 -->
        <div class="key-metrics">
          <div class="metrics-grid">
            <div class="metric-card highlight">
              <div class="metric-icon">📈</div>
              <div class="metric-content">
                <span class="metric-label">예상 연수익률</span>
                <span class="metric-value apy">{{ asset.expected_apy }}%</span>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">⚡</div>
              <div class="metric-content">
                <span class="metric-label">위험도</span>
                <span class="metric-value" :class="`risk-${asset.risk_level}`">
                  {{ getRiskLevelDisplay(asset.risk_level_display) }}
                </span>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">💰</div>
              <div class="metric-content">
                <span class="metric-label">최소 투자금</span>
                <span class="metric-value">{{ formatNumber(asset.min_investment_gleb) }} GLEB</span>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon">⏱️</div>
              <div class="metric-content">
                <span class="metric-label">투자 기간</span>
                <span class="metric-value">{{ asset.investment_period_months }}개월</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 펀딩 현황 -->
        <div class="funding-status">
          <div class="funding-header">
            <h3>펀딩 현황</h3>
            <div class="funding-stats">
              <span class="current-funding">{{ formatCurrency(asset.total_invested_gleb * 1000) }}</span>
              <span class="funding-separator">/</span>
              <span class="target-funding">{{ formatCurrency(asset.funding_target_gleb * 1000) }}</span>
            </div>
          </div>
          
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${Math.min(asset.funding_progress || 0, 100)}%` }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-percentage">{{ (asset.funding_progress || 0).toFixed(1) }}% 완료</span>
              <span class="investor-count">{{ asset.investor_count || 0 }}명 참여</span>
            </div>
          </div>
        </div>

        <!-- 상세 정보 탭 -->
        <div class="detail-tabs">
          <div class="tab-headers">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              :class="['tab-header', { active: activeTab === tab.id }]"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
          
          <div class="tab-content">
            <!-- 자산 개요 탭 -->
            <div v-if="activeTab === 'overview'" class="tab-pane">
              <div class="overview-section">
                <h4>자산 개요</h4>
                <div class="overview-content" v-html="asset.description || asset.short_description"></div>
                
                <div class="asset-details-grid">
                  <div class="detail-item">
                    <span class="detail-label">자산 유형</span>
                    <span class="detail-value">{{ asset.asset_type || '부동산' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">위치</span>
                    <span class="detail-value">{{ asset.asset_location || '정보 없음' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">총 자산 가치</span>
                    <span class="detail-value">{{ formatCurrency(asset.total_value_usd) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">최대 투자한도</span>
                    <span class="detail-value">{{ asset.max_investment_gleb ? formatNumber(asset.max_investment_gleb) + ' GLEB' : '제한 없음' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 수익 구조 탭 -->
            <div v-if="activeTab === 'returns'" class="tab-pane">
              <div class="returns-section">
                <h4>예상 수익 구조</h4>
                <div class="returns-chart">
                  <div class="returns-timeline">
                    <div v-for="month in timelineMonths" :key="month" class="timeline-item">
                      <div class="timeline-marker"></div>
                      <div class="timeline-content">
                        <span class="timeline-month">{{ month }}개월</span>
                        <span class="timeline-value">{{ calculateReturnForMonth(month) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="returns-calculator">
                  <h5>수익 계산기</h5>
                  <div class="calculator-input">
                    <label for="calc-amount">투자 금액 (GLEB)</label>
                    <input 
                      id="calc-amount"
                      v-model="calculatorAmount" 
                      type="number" 
                      :min="asset.min_investment_gleb"
                      :placeholder="`최소 ${asset.min_investment_gleb} GLEB`"
                    >
                  </div>
                  <div v-if="calculatedReturns" class="calculator-results">
                    <div class="result-item">
                      <span>투자원금</span>
                      <span>{{ formatNumber(calculatorAmount) }} GLEB</span>
                    </div>
                    <div class="result-item">
                      <span>예상수익</span>
                      <span class="profit">+{{ formatNumber(calculatedReturns.profit) }} GLEB</span>
                    </div>
                    <div class="result-item total">
                      <span>총 예상금액</span>
                      <span>{{ formatNumber(calculatedReturns.total) }} GLEB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 위험 요소 탭 -->
            <div v-if="activeTab === 'risks'" class="tab-pane">
              <div class="risks-section">
                <h4>투자 위험 요소</h4>
                <div class="risk-level-indicator">
                  <span class="risk-level" :class="`risk-${asset.risk_level}`">
                    {{ getRiskLevelDisplay(asset.risk_level_display) }} 위험
                  </span>
                </div>
                
                <div class="risk-factors">
                  <div v-for="(risk, index) in getRiskFactors()" :key="index" class="risk-factor">
                    <div class="risk-icon">⚠️</div>
                    <div class="risk-content">
                      <h5>{{ risk.title }}</h5>
                      <p>{{ risk.description }}</p>
                    </div>
                  </div>
                </div>
                
                <div class="risk-disclaimer">
                  <h5>투자 유의사항</h5>
                  <ul>
                    <li>투자 원금의 손실 가능성이 있습니다.</li>
                    <li>과거 수익률이 미래 수익률을 보장하지 않습니다.</li>
                    <li>투자 전 상품 설명서를 반드시 확인하시기 바랍니다.</li>
                    <li>본인의 투자 성향과 위험 감수 능력을 고려하여 투자하시기 바랍니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 문서 탭 -->
            <div v-if="activeTab === 'documents'" class="tab-pane">
              <div class="documents-section">
                <h4>관련 문서</h4>
                <div class="document-list">
                  <div v-for="doc in getDocuments()" :key="doc.id" class="document-item">
                    <div class="document-icon">📄</div>
                    <div class="document-info">
                      <span class="document-name">{{ doc.name }}</span>
                      <span class="document-description">{{ doc.description }}</span>
                    </div>
                    <button class="document-download">다운로드</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 투자 액션 섹션 -->
        <div class="investment-action">
          <div class="action-card">
            <div class="action-content">
              <h3>{{ asset.name }}에 투자하기</h3>
              <p>최소 {{ formatNumber(asset.min_investment_gleb) }} GLEB부터 투자 가능합니다.</p>
              <div class="quick-amounts">
                <span class="quick-amount-label">빠른 선택:</span>
                <button 
                  v-for="amount in quickAmounts" 
                  :key="amount"
                  class="quick-amount-btn"
                  @click="setQuickAmount(amount)"
                >
                  {{ formatNumber(amount) }} GLEB
                </button>
              </div>
            </div>
            <div class="action-buttons">
              <button 
                class="btn-invest-main" 
                @click="openInvestmentModal"
                :disabled="asset.status !== 'active'"
              >
                <span class="btn-icon">💰</span>
                지금 투자하기
              </button>
              <button class="btn-bookmark" @click="toggleBookmark">
                <span class="btn-icon">{{ isBookmarked ? '❤️' : '🤍' }}</span>
                {{ isBookmarked ? '관심목록에서 제거' : '관심목록에 추가' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 투자 모달 -->
    <InvestmentModal 
      :show="showInvestModal"
      :asset="asset"
      @update:show="showInvestModal = $event"
      @investment-success="handleInvestmentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getRWAAsset, getRWAAssets } from '../services/api'
import InvestmentModal from '../components/InvestmentModal.vue'

interface RWAAsset {
  id: string
  name: string
  short_description: string
  description?: string
  expected_apy: number
  risk_level: string
  risk_level_display: string
  min_investment_gleb: number
  max_investment_gleb?: number
  investment_period_months: number
  main_image_url?: string
  funding_progress?: number
  is_featured: boolean
  status: string
  category_name: string
  asset_type?: string
  asset_location?: string
  total_value_usd: number
  total_invested_gleb: number
  funding_target_gleb: number
  investor_count: number
}

const route = useRoute()
const router = useRouter()

// 반응형 데이터
const asset = ref<RWAAsset | null>(null)
const otherAssets = ref<RWAAsset[]>([])
const loading = ref(false)
const error = ref('')
const activeTab = ref('overview')
const showInvestModal = ref(false)
const calculatorAmount = ref<number | null>(null)
const isBookmarked = ref(false)

// 캐러셀 관련
const carouselContainer = ref<HTMLElement>()
const currentSlideIndex = ref(0)
const slideWidth = ref(280) // 각 슬라이드 너비 + 간격
const slidesPerView = ref(4)

// 탭 구성
const tabs = [
  { id: 'overview', label: '자산 개요' },
  { id: 'returns', label: '수익 구조' },
  { id: 'risks', label: '위험 요소' },
  { id: 'documents', label: '관련 문서' }
]

// 빠른 투자 금액
const quickAmounts = computed(() => {
  if (!asset.value) return []
  const min = asset.value.min_investment_gleb
  return [min, min * 2, min * 5, min * 10]
})

// 캐러셀 계산
const maxSlideIndex = computed(() => {
  const totalSlides = otherAssets.value.length
  return Math.max(0, totalSlides - slidesPerView.value)
})

// 수익 계산기
const calculatedReturns = computed(() => {
  if (!calculatorAmount.value || !asset.value || calculatorAmount.value <= 0) return null
  
  const principal = calculatorAmount.value
  const monthlyRate = asset.value.expected_apy / 100 / 12
  const months = asset.value.investment_period_months
  
  const total = principal * Math.pow(1 + monthlyRate, months)
  const profit = total - principal
  
  return { principal, profit, total }
})

// 수익률 타임라인
const timelineMonths = computed(() => {
  if (!asset.value) return []
  const months = asset.value.investment_period_months
  const intervals = Math.min(6, months)
  const step = Math.ceil(months / intervals)
  
  const timeline = []
  for (let i = step; i <= months; i += step) {
    timeline.push(i)
  }
  if (timeline[timeline.length - 1] !== months) {
    timeline.push(months)
  }
  return timeline
})

// 자산 상세 정보 조회
const fetchAssetDetail = async () => {
  const assetId = route.params.id as string
  if (!assetId) {
    error.value = '자산 ID가 필요합니다.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await getRWAAsset(assetId)
    asset.value = response.data
    
    // 다른 자산들도 함께 조회
    await fetchOtherAssets()
    
  } catch (err: any) {
    console.error('Failed to fetch asset detail:', err)
    error.value = err.message || '자산 정보를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 다른 자산들 조회
const fetchOtherAssets = async () => {
  try {
    const response = await getRWAAssets({ page_size: 20 })
    otherAssets.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to fetch other assets:', err)
  }
}

// 유틸리티 함수들
const getRiskLevelDisplay = (display: string): string => {
  return display || '보통'
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '투자 가능'
    case 'pending': return '준비 중'
    case 'completed': return '펀딩 완료'
    case 'paused': return '일시중단'
    default: return status
  }
}

const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-asset.jpg'
}

// 월별 수익률 계산
const calculateReturnForMonth = (month: number): string => {
  if (!asset.value) return '0.0'
  const monthlyRate = asset.value.expected_apy / 100 / 12
  const compoundReturn = (Math.pow(1 + monthlyRate, month) - 1) * 100
  return compoundReturn.toFixed(1)
}

// 위험 요소 가져오기
const getRiskFactors = () => {
  const factors = [
    {
      title: '시장 위험',
      description: '부동산 시장 변동으로 인한 자산 가치 하락 위험이 있습니다.'
    },
    {
      title: '유동성 위험',
      description: '투자 기간 중 중도 매도가 제한될 수 있습니다.'
    },
    {
      title: '운영 위험',
      description: '자산 운영 과정에서 예상치 못한 비용이 발생할 수 있습니다.'
    }
  ]
  
  if (asset.value?.risk_level === 'high' || asset.value?.risk_level === 'very_high') {
    factors.push({
      title: '고위험 투자',
      description: '높은 수익률과 함께 높은 손실 위험을 동반합니다.'
    })
  }
  
  return factors
}

// 문서 목록 가져오기
const getDocuments = () => {
  return [
    {
      id: '1',
      name: '투자설명서',
      description: '상품의 주요 투자 정보 및 위험 요소'
    },
    {
      id: '2',
      name: '자산 평가서',
      description: '전문 평가기관의 자산 가치 평가 보고서'
    },
    {
      id: '3',
      name: '법적고지',
      description: '투자 관련 법적 고지사항 및 약관'
    }
  ]
}

// 캐러셀 관련 함수들
const prevSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--
  }
}

const nextSlide = () => {
  if (currentSlideIndex.value < maxSlideIndex.value) {
    currentSlideIndex.value++
  }
}

const navigateToAsset = (assetId: string) => {
  if (assetId !== asset.value?.id) {
    router.push(`/rwa-assets/${assetId}`)
  }
}

// 투자 관련 함수들
const openInvestmentModal = () => {
  showInvestModal.value = true
}

const setQuickAmount = (amount: number) => {
  calculatorAmount.value = amount
}

const toggleBookmark = () => {
  isBookmarked.value = !isBookmarked.value
  // TODO: 실제 북마크 API 호출
}

const handleInvestmentSuccess = (investment: any) => {
  console.log('Investment successful:', investment)
  // 자산 정보 새로고침
  fetchAssetDetail()
}

// 라우트 변경 감지
watch(() => route.params.id, () => {
  if (route.params.id) {
    fetchAssetDetail()
  }
})

// 컴포넌트 마운트
onMounted(() => {
  fetchAssetDetail()
})
</script>

<style scoped>
.rwa-asset-detail-view {
  min-height: 100vh;
  background: #f8fafc;
}

/* 로딩 및 에러 상태 */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
}

/* 캐러셀 섹션 */
.carousel-section {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px 0;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  margin-bottom: 20px;
}

.carousel-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.carousel-controls {
  display: flex;
  gap: 8px;
}

.carousel-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.carousel-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.carousel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  overflow: hidden;
}

.carousel-track {
  display: flex;
  gap: 20px;
  transition: transform 0.3s ease;
}

.carousel-item {
  min-width: 260px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.carousel-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.carousel-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.carousel-image {
  position: relative;
  height: 140px;
  overflow: hidden;
}

.carousel-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-badge,
.current-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.featured-badge {
  background: #fbbf24;
  color: white;
}

.current-badge {
  background: #3b82f6;
  color: white;
}

.carousel-info {
  padding: 16px;
}

.carousel-info h4 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.3;
}

.carousel-info .apy {
  color: #059669;
  font-weight: 600;
  margin-bottom: 8px;
  display: block;
}

.risk-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.risk-badge.risk-low {
  background: #dcfce7;
  color: #059669;
}

.risk-badge.risk-medium {
  background: #fef3c7;
  color: #d97706;
}

.risk-badge.risk-high,
.risk-badge.risk-very_high {
  background: #fee2e2;
  color: #dc2626;
}

/* 메인 콘텐츠 */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* 자산 헤더 */
.asset-header {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.breadcrumb {
  margin-bottom: 16px;
  font-size: 0.875rem;
  color: #6b7280;
}

.breadcrumb-link {
  color: #3b82f6;
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  margin: 0 8px;
}

.asset-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  line-height: 1.2;
}

.asset-description {
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 24px;
}

.asset-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.featured-badge-main,
.category-badge,
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.featured-badge-main {
  background: #fbbf24;
  color: white;
}

.category-badge {
  background: #eff6ff;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.status-badge.active {
  background: #dcfce7;
  color: #059669;
}

.header-right {
  flex-shrink: 0;
}

.main-image {
  width: 300px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 핵심 지표 */
.key-metrics {
  margin-bottom: 40px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.metric-card.highlight {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.metric-icon {
  font-size: 2rem;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.metric-card.highlight .metric-label {
  color: rgba(255, 255, 255, 0.9);
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.metric-value.apy {
  color: #059669;
}

.metric-card.highlight .metric-value.apy {
  color: white;
}

/* 펀딩 현황 */
.funding-status {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.funding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.funding-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.funding-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  font-weight: 600;
}

.current-funding {
  color: #3b82f6;
}

.funding-separator {
  color: #6b7280;
}

.target-funding {
  color: #111827;
}

.progress-container {
  margin-bottom: 16px;
}

.progress-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  border-radius: 6px;
  transition: width 0.3s;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

/* 상세 정보 탭 */
.detail-tabs {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-header {
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 3px solid transparent;
}

.tab-header:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-header.active {
  background: white;
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  padding: 32px;
}

.tab-pane h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

/* 자산 개요 탭 */
.overview-content {
  color: #374151;
  line-height: 1.8;
  margin-bottom: 32px;
}

.asset-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-label {
  color: #6b7280;
  font-weight: 500;
}

.detail-value {
  color: #111827;
  font-weight: 600;
}

/* 수익 구조 탭 */
.returns-timeline {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  padding: 32px 0;
  background: #f8fafc;
  border-radius: 12px;
  position: relative;
}

.returns-timeline::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #d1d5db;
  transform: translateY(-50%);
}

.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.timeline-marker {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  margin-bottom: 12px;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.timeline-month {
  font-size: 0.875rem;
  color: #6b7280;
}

.timeline-value {
  font-weight: 600;
  color: #059669;
}

.returns-calculator {
  background: #f8fafc;
  border-radius: 12px;
  padding: 24px;
}

.returns-calculator h5 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.calculator-input {
  margin-bottom: 20px;
}

.calculator-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.calculator-input input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.calculator-input input:focus {
  outline: none;
  border-color: #3b82f6;
}

.calculator-results {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.result-item.total {
  border-top: 2px solid #e5e7eb;
  padding-top: 12px;
  margin-top: 12px;
  font-weight: 600;
}

.result-item .profit {
  color: #059669;
}

/* 위험 요소 탭 */
.risk-level-indicator {
  margin-bottom: 32px;
}

.risk-level {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.risk-factors {
  margin-bottom: 32px;
}

.risk-factor {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: #fef2f2;
  border-radius: 12px;
  margin-bottom: 16px;
}

.risk-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.risk-content h5 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #111827;
}

.risk-content p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.risk-disclaimer {
  background: #fef9e7;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 24px;
}

.risk-disclaimer h5 {
  margin: 0 0 16px 0;
  font-weight: 600;
  color: #92400e;
}

.risk-disclaimer ul {
  margin: 0;
  padding-left: 20px;
  color: #92400e;
}

.risk-disclaimer li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 문서 탭 */
.document-list {
  space-y: 16px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
}

.document-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.document-info {
  flex: 1;
}

.document-name {
  display: block;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.document-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.document-download {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.document-download:hover {
  background: #2563eb;
}

/* 투자 액션 섹션 */
.investment-action {
  position: sticky;
  bottom: 20px;
  z-index: 100;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.action-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.action-content p {
  color: #6b7280;
  margin: 0 0 16px 0;
}

.quick-amounts {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-amount-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-right: 8px;
}

.quick-amount-btn {
  padding: 4px 8px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-amount-btn:hover {
  background: #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn-invest-main,
.btn-bookmark {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-invest-main {
  background: #3b82f6;
  color: white;
  font-size: 1.1rem;
}

.btn-invest-main:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-invest-main:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.btn-bookmark {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-bookmark:hover {
  background: #e5e7eb;
}

.btn-icon {
  font-size: 1.2rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .carousel-header {
    padding: 0 16px;
  }
  
  .carousel-container {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 32px 16px;
  }
  
  .asset-header {
    flex-direction: column;
    gap: 24px;
  }
  
  .main-image {
    width: 100%;
    max-width: 400px;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .tab-headers {
    overflow-x: auto;
  }
  
  .tab-header {
    white-space: nowrap;
    min-width: 120px;
  }
  
  .action-card {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .asset-title {
    font-size: 2rem;
  }
  
  .carousel-track {
    gap: 12px;
  }
  
  .carousel-item {
    min-width: 220px;
  }
  
  .returns-timeline {
    flex-direction: column;
    gap: 20px;
  }
  
  .returns-timeline::before {
    display: none;
  }
  
  .asset-details-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-amounts {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>