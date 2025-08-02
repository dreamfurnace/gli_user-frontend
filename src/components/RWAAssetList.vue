<template>
  <div class="rwa-asset-list">
    <!-- 헤더 -->
    <div class="list-header">
      <div class="header-content">
        <h1>RWA 투자 자산 목록</h1>
        <p class="header-description">전 세계 프리미엄 레저 시설에 투자하여 안정적인 수익을 창출하세요</p>
      </div>
      
      <!-- 필터 및 검색 -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group">
            <label>카테고리</label>
            <select v-model="selectedCategory" @change="fetchAssets">
              <option value="">전체 카테고리</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>위험도</label>
            <select v-model="selectedRiskLevel" @change="fetchAssets">
              <option value="">전체 위험도</option>
              <option value="low">낮음</option>
              <option value="medium">보통</option>
              <option value="high">높음</option>
              <option value="very_high">매우 높음</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>정렬</label>
            <select v-model="sortBy" @change="fetchAssets">
              <option value="-is_featured,-created_at">추천순</option>
              <option value="-expected_apy">수익률 높은순</option>
              <option value="expected_apy">수익률 낮은순</option>
              <option value="min_investment_gleb">최소투자금 낮은순</option>
              <option value="-min_investment_gleb">최소투자금 높은순</option>
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
                placeholder="자산명, 위치, 유형으로 검색..."
                @input="debouncedSearch"
              >
            </div>
          </div>
        </div>
        
        <!-- 빠른 필터 -->
        <div class="quick-filters">
          <button 
            :class="['quick-filter', { active: showFeaturedOnly }]"
            @click="toggleFeatured"
          >
            ⭐ 추천 자산
          </button>
          <button 
            :class="['quick-filter', { active: selectedRiskLevel === 'low' }]"
            @click="filterByRisk('low')"
          >
            🟢 저위험
          </button>
          <button 
            :class="['quick-filter', { active: selectedRiskLevel === 'medium' }]"
            @click="filterByRisk('medium')"
          >
            🟡 중위험
          </button>
          <button 
            :class="['quick-filter', { active: selectedRiskLevel === 'high' }]"
            @click="filterByRisk('high')"
          >
            🔴 고위험
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>투자 자산을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchAssets">다시 시도</button>
    </div>

    <!-- 자산 목록 -->
    <div v-else class="assets-container">
      <!-- 결과 요약 -->
      <div class="results-summary">
        <p>
          총 <strong>{{ totalCount }}</strong>개의 투자 자산
          <span v-if="searchQuery || selectedCategory || selectedRiskLevel">
            (필터 적용됨)
          </span>
        </p>
      </div>

      <!-- 자산 그리드 -->
      <div class="assets-grid">
        <div 
          v-for="asset in assets" 
          :key="asset.id" 
          class="asset-card"
          :class="{ featured: asset.is_featured }"
        >
          <!-- 추천 배지 -->
          <div v-if="asset.is_featured" class="featured-badge">
            ⭐ 추천
          </div>

          <!-- 자산 이미지 -->
          <div class="asset-image">
            <img 
              :src="asset.main_image_url || '/placeholder-asset.jpg'" 
              :alt="asset.name"
              @error="handleImageError"
            >
            <div class="image-overlay">
              <span class="category-tag">{{ asset.category_name }}</span>
            </div>
          </div>

          <!-- 자산 정보 -->
          <div class="asset-info">
            <h3 class="asset-name">{{ asset.name }}</h3>
            <p class="asset-description">{{ asset.short_description }}</p>

            <!-- 핵심 지표 -->
            <div class="key-metrics">
              <div class="metric">
                <span class="metric-label">예상 APY</span>
                <span class="metric-value apy">{{ asset.expected_apy }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">위험도</span>
                <span 
                  class="metric-value risk-badge" 
                  :class="`risk-${asset.risk_level}`"
                >
                  {{ getRiskLevelDisplay(asset.risk_level_display) }}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">최소 투자</span>
                <span class="metric-value">{{ formatNumber(asset.min_investment_gleb) }} GLEB</span>
              </div>
            </div>

            <!-- 펀딩 진행률 -->
            <div class="funding-progress">
              <div class="progress-header">
                <span class="progress-label">펀딩 진행률</span>
                <span class="progress-value">{{ asset.funding_progress?.toFixed(1) || 0 }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${Math.min(asset.funding_progress || 0, 100)}%` }"
                ></div>
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="asset-actions">
            <button class="btn-details" @click="showAssetDetails(asset)">
              자세히 보기
            </button>
            <button 
              class="btn-invest" 
              @click="openInvestmentModal(asset)"
              :disabled="asset.status !== 'active'"
            >
              투자하기
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 결과 -->
      <div v-if="!loading && assets.length === 0" class="empty-results">
        <div class="empty-icon">🔍</div>
        <h3>검색 결과가 없습니다</h3>
        <p>검색 조건을 조정하거나 필터를 초기화해보세요</p>
        <button class="btn-reset" @click="resetFilters">필터 초기화</button>
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

    <!-- 투자 모달 -->
    <InvestmentModal 
      :show="showInvestModal"
      :asset="selectedAsset"
      @update:show="showInvestModal = $event"
      @investment-success="handleInvestmentSuccess"
    />

    <!-- 자산 상세 모달 (향후 구현) -->
    <!-- <AssetDetailModal ... /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getRWAAssets, getRWACategories } from '../services/api'
import InvestmentModal from './InvestmentModal.vue'

interface RWAAsset {
  id: string
  name: string
  short_description: string
  expected_apy: number
  risk_level: string
  risk_level_display: string
  min_investment_gleb: number
  main_image_url?: string
  funding_progress?: number
  is_featured: boolean
  status: string
  category_name: string
}

interface RWACategory {
  id: string
  name: string
  description: string
  asset_count: number
}

// 반응형 데이터
const assets = ref<RWAAsset[]>([])
const categories = ref<RWACategory[]>([])
const loading = ref(false)
const error = ref('')

// 필터 상태
const selectedCategory = ref('')
const selectedRiskLevel = ref('')
const searchQuery = ref('')
const sortBy = ref('-is_featured,-created_at')
const showFeaturedOnly = ref(false)

// 페이지네이션
const currentPage = ref(1)
const pageSize = ref(12)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// 모달 상태
const showInvestModal = ref(false)
const selectedAsset = ref<RWAAsset | null>(null)

// 검색 디바운스
let searchTimeout: NodeJS.Timeout

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchAssets()
  }, 500)
}

// 페이지 계산
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2

  let start = Math.max(1, current - delta)
  let end = Math.min(total, current + delta)

  // 시작 또는 끝에 가까우면 더 많은 페이지 표시
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

// 위험도 표시 텍스트
const getRiskLevelDisplay = (display: string): string => {
  return display || '보통'
}

// 숫자 포맷팅
const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

// 이미지 에러 처리
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-asset.jpg'
}

// 자산 목록 조회
const fetchAssets = async () => {
  loading.value = true
  error.value = ''

  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      page_size: pageSize.value,
      ordering: sortBy.value
    }

    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }

    if (selectedRiskLevel.value) {
      params.risk_level = selectedRiskLevel.value
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (showFeaturedOnly.value) {
      params.is_featured = true
    }

    const response = await getRWAAssets(params)
    
    assets.value = response.data.results || response.data
    totalCount.value = response.data.count || assets.value.length

  } catch (err: any) {
    console.error('Failed to fetch RWA assets:', err)
    error.value = err.message || '데이터를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 카테고리 목록 조회
const fetchCategories = async () => {
  try {
    const response = await getRWACategories()
    categories.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

// 빠른 필터 함수들
const toggleFeatured = () => {
  showFeaturedOnly.value = !showFeaturedOnly.value
  currentPage.value = 1
  fetchAssets()
}

const filterByRisk = (riskLevel: string) => {
  if (selectedRiskLevel.value === riskLevel) {
    selectedRiskLevel.value = ''
  } else {
    selectedRiskLevel.value = riskLevel
  }
  currentPage.value = 1
  fetchAssets()
}

// 필터 초기화
const resetFilters = () => {
  selectedCategory.value = ''
  selectedRiskLevel.value = ''
  searchQuery.value = ''
  showFeaturedOnly.value = false
  sortBy.value = '-is_featured,-created_at'
  currentPage.value = 1
  fetchAssets()
}

// 페이지 변경
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchAssets()
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 투자 모달 열기
const openInvestmentModal = (asset: RWAAsset) => {
  selectedAsset.value = asset
  showInvestModal.value = true
}

// 자산 상세 정보 보기 (향후 구현)
const showAssetDetails = (asset: RWAAsset) => {
  // TODO: 자산 상세 모달 또는 페이지로 이동
  console.log('Show asset details:', asset)
}

// 투자 성공 처리
const handleInvestmentSuccess = (investment: any) => {
  console.log('Investment successful:', investment)
  // 필요시 자산 목록 새로고침
  fetchAssets()
}

// 컴포넌트 마운트
onMounted(() => {
  fetchCategories()
  fetchAssets()
})
</script>

<style scoped>
.rwa-asset-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
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
  margin-bottom: 20px;
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

.quick-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-filter {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  background: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-filter:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.quick-filter.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
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

.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.asset-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  position: relative;
}

.asset-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.asset-card.featured {
  border-color: #fbbf24;
  box-shadow: 0 1px 3px rgba(251, 191, 36, 0.2);
}

.featured-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #fbbf24;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
}

.asset-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.asset-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.asset-card:hover .asset-image img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
}

.category-tag {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.asset-info {
  padding: 20px;
}

.asset-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.3;
}

.asset-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.key-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-weight: 600;
  color: #111827;
}

.metric-value.apy {
  color: #059669;
  font-size: 1.125rem;
}

.risk-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

.funding-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.progress-value {
  font-size: 0.875rem;
  font-weight: 600;
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

.asset-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
}

.btn-details,
.btn-invest {
  flex: 1;
  padding: 8px 16px;
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

.btn-invest {
  background: #3b82f6;
  color: white;
}

.btn-invest:hover:not(:disabled) {
  background: #2563eb;
}

.btn-invest:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.empty-results {
  text-align: center;
  padding: 64px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.btn-reset {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
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
  .rwa-asset-list {
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
  
  .assets-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .quick-filters {
    justify-content: center;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>