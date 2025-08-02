<template>
  <div class="shopping-product-list">
    <!-- 헤더 -->
    <div class="list-header">
      <div class="header-content">
        <h1>GLI 쇼핑몰</h1>
        <p class="header-description">GLIL 토큰으로 프리미엄 레저 상품과 서비스를 구매하세요</p>
      </div>
      
      <!-- 카테고리 탭 -->
      <div class="category-tabs">
        <button 
          :class="['category-tab', { active: selectedCategory === '' }]"
          @click="selectCategory('')"
        >
          전체 상품
        </button>
        <button 
          v-for="category in categories" 
          :key="category.id"
          :class="['category-tab', { active: selectedCategory === category.id }]"
          @click="selectCategory(category.id)"
        >
          {{ category.icon }} {{ category.name }}
          <span class="product-count">({{ category.asset_count }})</span>
        </button>
      </div>
      
      <!-- 필터 및 검색 -->
      <div class="filters-section">
        <div class="filter-row">
          <div class="filter-group">
            <label>상품 유형</label>
            <select v-model="selectedProductType" @change="fetchProducts">
              <option value="">전체 유형</option>
              <option value="goods">일반 상품</option>
              <option value="resort">리조트 예약</option>
              <option value="restaurant">레스토랑 예약</option>
              <option value="service">서비스</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>정렬</label>
            <select v-model="sortBy" @change="fetchProducts">
              <option value="-is_featured,-created_at">추천순</option>
              <option value="price_glil">가격 낮은순</option>
              <option value="-price_glil">가격 높은순</option>
              <option value="-purchase_count">인기순</option>
              <option value="-created_at">최신순</option>
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
                placeholder="상품명, 설명으로 검색..."
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
            ⭐ 추천 상품
          </button>
          <button 
            :class="['quick-filter', { active: showInStockOnly }]"
            @click="toggleInStock"
          >
            ✅ 재고 있음
          </button>
          <button 
            :class="['quick-filter', { active: selectedProductType === 'resort' }]"
            @click="filterByType('resort')"
          >
            🏖️ 리조트
          </button>
          <button 
            :class="['quick-filter', { active: selectedProductType === 'restaurant' }]"
            @click="filterByType('restaurant')"
          >
            🍽️ 레스토랑
          </button>
        </div>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>상품을 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchProducts">다시 시도</button>
    </div>

    <!-- 상품 목록 -->
    <div v-else class="products-container">
      <!-- 결과 요약 -->
      <div class="results-summary">
        <p>
          총 <strong>{{ totalCount }}</strong>개의 상품
          <span v-if="searchQuery || selectedCategory || selectedProductType">
            (필터 적용됨)
          </span>
        </p>
      </div>

      <!-- 상품 그리드 -->
      <div class="products-grid">
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="product-card"
          :class="{ 
            featured: product.is_featured,
            'out-of-stock': !product.is_in_stock 
          }"
        >
          <!-- 추천 배지 -->
          <div v-if="product.is_featured" class="featured-badge">
            ⭐ 추천
          </div>

          <!-- 재고 없음 배지 -->
          <div v-if="!product.is_in_stock" class="stock-badge out-of-stock">
            품절
          </div>

          <!-- 상품 이미지 -->
          <div class="product-image">
            <img 
              :src="product.main_image_url || '/placeholder-product.jpg'" 
              :alt="product.name"
              @error="handleImageError"
            >
            <div class="image-overlay">
              <span class="category-tag">{{ product.category_name }}</span>
              <span class="type-tag">{{ getProductTypeDisplay(product.product_type_display) }}</span>
            </div>
          </div>

          <!-- 상품 정보 -->
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-description">{{ product.short_description }}</p>

            <!-- 가격 정보 -->
            <div class="price-info">
              <div class="price-glil">
                <span class="price-value">{{ formatNumber(product.price_glil) }}</span>
                <span class="price-unit">GLIL</span>
              </div>
              <div v-if="product.price_usd" class="price-usd">
                ≈ ${{ formatNumber(product.price_usd) }}
              </div>
            </div>

            <!-- 추가 정보 -->
            <div class="product-meta">
              <div class="meta-item" v-if="product.view_count">
                <span class="meta-icon">👁️</span>
                <span class="meta-text">{{ formatNumber(product.view_count) }}회 조회</span>
              </div>
              <div class="meta-item" v-if="product.purchase_count">
                <span class="meta-icon">🛒</span>
                <span class="meta-text">{{ formatNumber(product.purchase_count) }}회 구매</span>
              </div>
            </div>
          </div>

          <!-- 액션 버튼 -->
          <div class="product-actions">
            <button class="btn-details" @click="showProductDetails(product)">
              자세히 보기
            </button>
            <button 
              class="btn-cart" 
              @click="addToCart(product)"
              :disabled="!product.is_in_stock"
            >
              <span v-if="product.is_in_stock">장바구니</span>
              <span v-else>품절</span>
            </button>
            <button 
              class="btn-buy" 
              @click="buyNow(product)"
              :disabled="!product.is_in_stock"
            >
              <span v-if="product.is_in_stock">바로 구매</span>
              <span v-else>구매 불가</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 빈 결과 -->
      <div v-if="!loading && products.length === 0" class="empty-results">
        <div class="empty-icon">🛍️</div>
        <h3>상품이 없습니다</h3>
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

    <!-- 장바구니 모달 (향후 구현) -->
    <!-- <CartModal ... /> -->

    <!-- 구매 모달 (향후 구현) -->
    <!-- <PurchaseModal ... /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getShoppingProducts, getShoppingCategories } from '../services/api'

interface ShoppingProduct {
  id: string
  name: string
  short_description: string
  product_type_display: string
  price_glil: number
  price_usd?: number
  main_image_url?: string
  is_featured: boolean
  is_in_stock: boolean
  status: string
  category_name: string
  view_count?: number
  purchase_count?: number
}

interface ShoppingCategory {
  id: string
  name: string
  description: string
  icon: string
  asset_count: number
}

// 반응형 데이터
const products = ref<ShoppingProduct[]>([])
const categories = ref<ShoppingCategory[]>([])
const loading = ref(false)
const error = ref('')

// 필터 상태
const selectedCategory = ref('')
const selectedProductType = ref('')
const searchQuery = ref('')
const sortBy = ref('-is_featured,-created_at')
const showFeaturedOnly = ref(false)
const showInStockOnly = ref(false)

// 페이지네이션
const currentPage = ref(1)
const pageSize = ref(12)
const totalCount = ref(0)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))

// 장바구니 상태 (향후 구현)
const cartItems = ref<any[]>([])

// 검색 디바운스
let searchTimeout: NodeJS.Timeout

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchProducts()
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

// 상품 유형 표시 텍스트
const getProductTypeDisplay = (display: string): string => {
  return display || '상품'
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
  img.src = '/placeholder-product.jpg'
}

// 상품 목록 조회
const fetchProducts = async () => {
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

    if (selectedProductType.value) {
      params.product_type = selectedProductType.value
    }

    if (searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    if (showFeaturedOnly.value) {
      params.is_featured = true
    }

    const response = await getShoppingProducts(params)
    
    products.value = response.data.results || response.data
    totalCount.value = response.data.count || products.value.length

    // 재고 있음 필터 적용
    if (showInStockOnly.value) {
      products.value = products.value.filter(product => product.is_in_stock)
    }

  } catch (err: any) {
    console.error('Failed to fetch shopping products:', err)
    error.value = err.message || '데이터를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 카테고리 목록 조회
const fetchCategories = async () => {
  try {
    const response = await getShoppingCategories()
    categories.value = response.data.results || response.data
  } catch (err) {
    console.error('Failed to fetch categories:', err)
  }
}

// 카테고리 선택
const selectCategory = (categoryId: string) => {
  selectedCategory.value = categoryId
  currentPage.value = 1
  fetchProducts()
}

// 빠른 필터 함수들
const toggleFeatured = () => {
  showFeaturedOnly.value = !showFeaturedOnly.value
  currentPage.value = 1
  fetchProducts()
}

const toggleInStock = () => {
  showInStockOnly.value = !showInStockOnly.value
  currentPage.value = 1
  fetchProducts()
}

const filterByType = (productType: string) => {
  if (selectedProductType.value === productType) {
    selectedProductType.value = ''
  } else {
    selectedProductType.value = productType
  }
  currentPage.value = 1
  fetchProducts()
}

// 필터 초기화
const resetFilters = () => {
  selectedCategory.value = ''
  selectedProductType.value = ''
  searchQuery.value = ''
  showFeaturedOnly.value = false
  showInStockOnly.value = false
  sortBy.value = '-is_featured,-created_at'
  currentPage.value = 1
  fetchProducts()
}

// 페이지 변경
const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// 상품 상세 정보 보기 (향후 구현)
const showProductDetails = (product: ShoppingProduct) => {
  console.log('Show product details:', product)
  // TODO: 상품 상세 모달 또는 페이지로 이동
}

// 장바구니 추가 (향후 구현)
const addToCart = (product: ShoppingProduct) => {
  if (!product.is_in_stock) return
  
  console.log('Add to cart:', product)
  // TODO: 장바구니 로직 구현
  
  // 임시 알림
  alert(`${product.name}이(가) 장바구니에 추가되었습니다.`)
}

// 바로 구매 (향후 구현)
const buyNow = (product: ShoppingProduct) => {
  if (!product.is_in_stock) return
  
  console.log('Buy now:', product)
  // TODO: 구매 모달 또는 결제 페이지로 이동
  
  // 임시 알림
  alert(`${product.name} 구매 페이지로 이동합니다.`)
}

// 컴포넌트 마운트
onMounted(() => {
  fetchCategories()
  fetchProducts()
})
</script>

<style scoped>
.shopping-product-list {
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

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.category-tab {
  padding: 12px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 25px;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-tab:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.category-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.product-count {
  font-size: 0.75rem;
  opacity: 0.8;
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

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-card.featured {
  border-color: #fbbf24;
  box-shadow: 0 1px 3px rgba(251, 191, 36, 0.2);
}

.product-card.out-of-stock {
  opacity: 0.7;
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

.stock-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
}

.stock-badge.out-of-stock {
  background: #ef4444;
  color: white;
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 16px;
  display: flex;
  justify-content: space-between;
}

.category-tag,
.type-tag {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.product-info {
  padding: 20px;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.3;
}

.product-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price-info {
  margin-bottom: 16px;
}

.price-glil {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

.price-unit {
  font-size: 1rem;
  font-weight: 600;
  color: #059669;
}

.price-usd {
  font-size: 0.875rem;
  color: #6b7280;
}

.product-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  font-size: 0.875rem;
}

.meta-text {
  font-size: 0.75rem;
  color: #6b7280;
}

.product-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #f3f4f6;
}

.btn-details,
.btn-cart,
.btn-buy {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  text-align: center;
}

.btn-details {
  background: #f3f4f6;
  color: #374151;
}

.btn-details:hover {
  background: #e5e7eb;
}

.btn-cart {
  background: #8b5cf6;
  color: white;
}

.btn-cart:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-buy {
  background: #059669;
  color: white;
}

.btn-buy:hover:not(:disabled) {
  background: #047857;
}

.btn-cart:disabled,
.btn-buy:disabled {
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
  .shopping-product-list {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .category-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .filter-row {
    grid-template-columns: 1fr;
  }
  
  .search-group {
    grid-column: span 1;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .product-actions {
    flex-direction: column;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>