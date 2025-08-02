<template>
  <div class="product-detail">
    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>상품 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>상품을 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchProduct">다시 시도</button>
    </div>

    <!-- 상품 상세 정보 -->
    <div v-else-if="product" class="product-content">
      <!-- 브레드크럼 -->
      <nav class="breadcrumb">
        <router-link to="/shopping" class="breadcrumb-link">쇼핑몰</router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ product.name }}</span>
      </nav>

      <!-- 메인 상품 섹션 -->
      <div class="main-section">
        <!-- 상품 이미지 갤러리 -->
        <div class="image-section">
          <!-- 메인 이미지 슬라이더 -->
          <div class="main-image-container">
            <swiper
              :modules="[Navigation, Pagination, Thumbs, Zoom]"
              :slides-per-view="1"
              :navigation="true"
              :pagination="{ clickable: true }"
              :zoom="true"
              :thumbs="{ swiper: thumbsSwiper }"
              class="main-swiper"
              @swiper="setMainSwiper"
            >
              <swiper-slide 
                v-for="(image, index) in productImages" 
                :key="index"
                class="main-slide"
              >
                <div class="swiper-zoom-container">
                  <img 
                    :src="image.url || '/placeholder-product.jpg'" 
                    :alt="image.alt || product.name"
                    @error="handleImageError"
                  >
                </div>
              </swiper-slide>
              
              <!-- 상품 배지들 -->
              <div class="product-badges">
                <div v-if="product.is_featured" class="badge featured">
                  ⭐ 추천
                </div>
                <div v-if="!product.is_in_stock" class="badge out-of-stock">
                  품절
                </div>
              </div>
            </swiper>
          </div>
          
          <!-- 썸네일 갤러리 -->
          <div class="thumbnail-container" v-if="productImages.length > 1">
            <swiper
              :modules="[Navigation, Thumbs]"
              :slides-per-view="4"
              :space-between="10"
              :watch-slides-progress="true"
              :breakpoints="{
                320: { slidesPerView: 3 },
                640: { slidesPerView: 4 },
                768: { slidesPerView: 5 }
              }"
              class="thumbs-swiper"
              @swiper="setThumbsSwiper"
            >
              <swiper-slide 
                v-for="(image, index) in productImages" 
                :key="index"
                class="thumb-slide"
              >
                <img 
                  :src="image.url || '/placeholder-product.jpg'" 
                  :alt="image.alt || product.name"
                  @error="handleImageError"
                >
              </swiper-slide>
            </swiper>
          </div>
        </div>

        <!-- 상품 정보 -->
        <div class="product-info">
          <div class="product-header">
            <span class="category-tag">{{ product.category_name }}</span>
            <span class="type-tag">{{ product.product_type_display }}</span>
          </div>

          <h1 class="product-title">{{ product.name }}</h1>
          <p class="product-description">{{ product.description || product.short_description }}</p>

          <!-- 가격 정보 -->
          <div class="price-section">
            <div class="price-main">
              <span class="price-value">{{ formatNumber(product.price_glil) }}</span>
              <span class="price-unit">GLI-L</span>
            </div>
            <div v-if="product.price_usd" class="price-usd">
              ≈ ${{ formatNumber(product.price_usd) }}
            </div>
          </div>

          <!-- 상품 메타 정보 -->
          <div class="product-meta">
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">상품 상태</span>
                <span class="meta-value" :class="`status-${product.status}`">
                  {{ getStatusDisplay(product.status) }}
                </span>
              </div>
              <div class="meta-item" v-if="product.view_count">
                <span class="meta-label">조회수</span>
                <span class="meta-value">{{ formatNumber(product.view_count) }}회</span>
              </div>
              <div class="meta-item" v-if="product.purchase_count">
                <span class="meta-label">구매수</span>
                <span class="meta-value">{{ formatNumber(product.purchase_count) }}회</span>
              </div>
            </div>
          </div>

          <!-- 수량 선택 -->
          <div class="quantity-section">
            <label class="quantity-label">수량</label>
            <div class="quantity-controls">
              <button 
                class="quantity-btn" 
                @click="decreaseQuantity"
                :disabled="quantity <= 1"
              >
                -
              </button>
              <input 
                v-model.number="quantity" 
                type="number" 
                min="1" 
                class="quantity-input"
                @input="validateQuantity"
              >
              <button 
                class="quantity-btn" 
                @click="increaseQuantity"
                :disabled="!product.is_in_stock"
              >
                +
              </button>
            </div>
          </div>

          <!-- 총 가격 -->
          <div class="total-price">
            <span class="total-label">총 금액</span>
            <div class="total-amount">
              <span class="total-value">{{ formatNumber(totalPrice) }}</span>
              <span class="total-unit">GLI-L</span>
            </div>
            <div v-if="product.price_usd" class="total-usd">
              ≈ ${{ formatNumber(totalPriceUSD) }}
            </div>
          </div>

          <!-- 액션 버튼들 -->
          <div class="action-buttons">
            <button 
              class="btn-cart" 
              @click="addToCart"
              :disabled="!product.is_in_stock || isAddingToCart"
            >
              <span v-if="isAddingToCart" class="loading-spinner small"></span>
              <span v-else-if="product.is_in_stock">🛒 장바구니 담기</span>
              <span v-else>품절</span>
            </button>
            <button 
              class="btn-buy" 
              @click="buyNow"
              :disabled="!product.is_in_stock || isBuying"
            >
              <span v-if="isBuying" class="loading-spinner small"></span>
              <span v-else-if="product.is_in_stock">💰 바로 구매</span>
              <span v-else>구매 불가</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 상품 상세 탭 -->
      <div class="detail-tabs">
        <div class="tab-nav">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <!-- 상품 설명 -->
          <div v-show="activeTab === 'description'" class="tab-panel">
            <div class="description-content">
              <h3>상품 상세 정보</h3>
              <div class="description-text" v-html="product.description || product.short_description"></div>
            </div>
          </div>

          <!-- 리뷰 -->
          <div v-show="activeTab === 'reviews'" class="tab-panel">
            <ProductReviewList 
              v-if="product"
              :product="product"
              :can-write-review="true"
            />
          </div>

          <!-- 배송/환불 정보 -->
          <div v-show="activeTab === 'policy'" class="tab-panel">
            <div class="policy-content">
              <h3>배송 및 환불 정책</h3>
              <div class="policy-sections">
                <div class="policy-section">
                  <h4>배송 정보</h4>
                  <ul>
                    <li>GLI-L 토큰으로 결제 완료 후 즉시 처리됩니다</li>
                    <li>디지털 상품의 경우 구매 즉시 이용 가능합니다</li>
                    <li>물리적 상품의 경우 1-3일 내 배송됩니다</li>
                  </ul>
                </div>
                <div class="policy-section">
                  <h4>환불 정책</h4>
                  <ul>
                    <li>디지털 상품: 구매 후 7일 이내 환불 가능</li>
                    <li>물리적 상품: 배송 완료 후 14일 이내 환불 가능</li>
                    <li>환불 시 GLI-L 토큰으로 반환됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 관련 상품 추천 -->
      <div class="related-products" v-if="relatedProducts.length > 0">
        <h3>관련 상품</h3>
        <div class="related-grid">
          <div 
            v-for="related in relatedProducts" 
            :key="related.id"
            class="related-item"
            @click="viewProduct(related.id)"
          >
            <div class="related-image">
              <img 
                :src="related.main_image_url || '/placeholder-product.jpg'" 
                :alt="related.name"
              >
            </div>
            <div class="related-info">
              <h4 class="related-name">{{ related.name }}</h4>
              <div class="related-price">
                <span class="price-value">{{ formatNumber(related.price_glil) }}</span>
                <span class="price-unit">GLI-L</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 장바구니 모달 -->
    <CartModal 
      :show="showCartModal"
      @update:show="showCartModal = $event"
      @checkout="handleCheckout"
    />

    <!-- 구매 모달 (향후 구현) -->
    <!-- <PurchaseModal ... /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getShoppingProduct, getShoppingProducts } from '../services/api'
import { useShoppingCartStore } from '../stores/shoppingCart'
import CartModal from '../components/CartModal.vue'
import ProductReviewList from '../components/ProductReviewList.vue'

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Thumbs, Zoom } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'
import 'swiper/css/zoom'

interface ShoppingProduct {
  id: string
  name: string
  description?: string
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

const route = useRoute()
const router = useRouter()
const cartStore = useShoppingCartStore()

// 반응형 데이터
const product = ref<ShoppingProduct | null>(null)
const relatedProducts = ref<ShoppingProduct[]>([])
const loading = ref(false)
const error = ref('')
const quantity = ref(1)
const activeTab = ref('description')
const isAddingToCart = ref(false)
const isBuying = ref(false)
const showCartModal = ref(false)

// Swiper 관련 상태
const mainSwiper = ref(null)
const thumbsSwiper = ref(null)

// 상품 이미지 목록 (API에서 여러 이미지를 받는다고 가정)
const productImages = computed(() => {
  if (!product.value) return []
  
  // 현재는 main_image_url만 있으므로 임시로 여러 이미지 생성
  const images = [
    {
      url: product.value.main_image_url || '/placeholder-product.jpg',
      alt: product.value.name
    }
  ]
  
  // 데모용으로 추가 이미지들 생성 (실제로는 API에서 받아옴)
  if (product.value.main_image_url) {
    images.push(
      {
        url: product.value.main_image_url,
        alt: `${product.value.name} - 상세 이미지 1`
      },
      {
        url: product.value.main_image_url,
        alt: `${product.value.name} - 상세 이미지 2`
      },
      {
        url: product.value.main_image_url,
        alt: `${product.value.name} - 상세 이미지 3`
      }
    )
  }
  
  return images
})

// 탭 설정
const tabs = [
  { id: 'description', label: '상품 설명' },
  { id: 'reviews', label: '리뷰' },
  { id: 'policy', label: '배송/환불' }
]

// 계산된 속성
const totalPrice = computed(() => {
  return product.value ? product.value.price_glil * quantity.value : 0
})

const totalPriceUSD = computed(() => {
  return product.value && product.value.price_usd 
    ? product.value.price_usd * quantity.value 
    : 0
})

// Swiper 메서드
const setMainSwiper = (swiper: any) => {
  mainSwiper.value = swiper
}

const setThumbsSwiper = (swiper: any) => {
  thumbsSwiper.value = swiper
}

// 메서드
const fetchProduct = async () => {
  const productId = route.params.id as string
  if (!productId) {
    error.value = '유효하지 않은 상품 ID입니다.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await getShoppingProduct(productId)
    product.value = response.data
    
    // 관련 상품 조회
    await fetchRelatedProducts()
    
  } catch (err: any) {
    console.error('Failed to fetch product:', err)
    error.value = err.message || '상품 정보를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const fetchRelatedProducts = async () => {
  if (!product.value) return

  try {
    const response = await getShoppingProducts({
      category: product.value.category_name,
      page_size: 4,
      exclude: product.value.id
    })
    
    relatedProducts.value = (response.data.results || response.data).filter(
      (item: ShoppingProduct) => item.id !== product.value?.id
    )
  } catch (err) {
    console.error('Failed to fetch related products:', err)
  }
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

const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': '판매중',
    'inactive': '판매중지',
    'out_of_stock': '품절',
    'discontinued': '단종'
  }
  return statusMap[status] || status
}

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const increaseQuantity = () => {
  if (product.value?.is_in_stock) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

const validateQuantity = () => {
  if (quantity.value < 1) {
    quantity.value = 1
  }
}

const addToCart = async () => {
  if (!product.value?.is_in_stock || isAddingToCart.value) return

  isAddingToCart.value = true
  
  try {
    const result = cartStore.addItem(product.value, quantity.value)
    
    if (result.success) {
      // 성공 시 장바구니 모달 표시
      showCartModal.value = true
    } else {
      alert(result.message)
    }
    
  } catch (error) {
    console.error('Failed to add to cart:', error)
    alert('장바구니 추가에 실패했습니다.')
  } finally {
    isAddingToCart.value = false
  }
}

const buyNow = async () => {
  if (!product.value?.is_in_stock || isBuying.value) return

  isBuying.value = true
  
  try {
    // 임시로 장바구니에 추가 후 결제 진행
    const result = cartStore.addItem(product.value, quantity.value)
    
    if (result.success) {
      // 바로 결제 모달 표시 (현재는 장바구니 모달로 대체)
      showCartModal.value = true
    } else {
      alert(result.message)
    }
    
  } catch (error) {
    console.error('Failed to buy now:', error)
    alert('구매 처리에 실패했습니다.')
  } finally {
    isBuying.value = false
  }
}

const viewProduct = (productId: string) => {
  router.push(`/shopping/product/${productId}`)
}

const handleCheckout = (items: any[]) => {
  console.log('Proceeding to checkout with items:', items)
  // TODO: 결제 페이지로 이동 또는 결제 처리
  alert(`${items.length}개 상품을 결제합니다.`)
}

// 라우트 파라미터 변경 감지
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProduct()
  }
}, { immediate: true })

onMounted(() => {
  fetchProduct()
})
</script>

<style scoped>
.product-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
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

/* 브레드크럼 */
.breadcrumb {
  margin-bottom: 24px;
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

.breadcrumb-current {
  color: #111827;
  font-weight: 500;
}

/* 메인 섹션 */
.main-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

/* 이미지 섹션 */
.image-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 메인 이미지 Swiper */
.main-image-container {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.main-swiper {
  width: 100%;
  height: 100%;
}

.main-slide {
  width: 100%;
  height: 100%;
}

.main-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.product-badges {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
}

.badge.featured {
  background: #fbbf24;
  color: white;
}

.badge.out-of-stock {
  background: #ef4444;
  color: white;
}

/* 썸네일 Swiper */
.thumbnail-container {
  margin-top: 12px;
}

.thumbs-swiper {
  width: 100%;
  height: 80px;
}

.thumb-slide {
  width: 100%;
  height: 100%;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}

.thumb-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-slide:hover {
  opacity: 0.8;
}

.thumbs-swiper .swiper-slide-thumb-active {
  opacity: 1;
  border-color: #3b82f6;
}

/* Swiper 네비게이션 커스터마이징 */
.main-swiper .swiper-button-next,
.main-swiper .swiper-button-prev {
  color: #3b82f6;
  background: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.main-swiper .swiper-button-next:hover,
.main-swiper .swiper-button-prev:hover {
  background: #3b82f6;
  color: white;
  transform: scale(1.1);
}

.main-swiper .swiper-button-next::after,
.main-swiper .swiper-button-prev::after {
  font-size: 18px;
  font-weight: 600;
}

/* Swiper 페이지네이션 커스터마이징 */
.main-swiper .swiper-pagination {
  bottom: 16px;
}

.main-swiper .swiper-pagination-bullet {
  background: #3b82f6;
  opacity: 0.5;
  width: 10px;
  height: 10px;
}

.main-swiper .swiper-pagination-bullet-active {
  opacity: 1;
  transform: scale(1.2);
}

/* Zoom 기능 스타일 */
.swiper-zoom-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.swiper-zoom-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 상품 정보 */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.product-header {
  display: flex;
  gap: 8px;
}

.category-tag,
.type-tag {
  padding: 4px 12px;
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

.product-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  margin: 0;
}

.product-description {
  font-size: 1.125rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* 가격 정보 */
.price-section {
  padding: 20px;
  background: linear-gradient(135deg, #059669, #047857);
  border-radius: 12px;
  color: white;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.price-value {
  font-size: 2.5rem;
  font-weight: 700;
}

.price-unit {
  font-size: 1.5rem;
  font-weight: 600;
}

.price-usd {
  opacity: 0.9;
  font-size: 1rem;
}

/* 메타 정보 */
.product-meta {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.status-active {
  color: #059669;
}

.status-out_of_stock {
  color: #ef4444;
}

/* 수량 선택 */
.quantity-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quantity-label {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0;
  width: fit-content;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.quantity-btn {
  width: 40px;
  height: 40px;
  background: #f9fafb;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  transition: all 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 60px;
  height: 40px;
  border: none;
  border-left: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
}

.quantity-input:focus {
  outline: none;
}

/* 총 가격 */
.total-price {
  padding: 20px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.total-label {
  display: block;
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 8px;
}

.total-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.total-value {
  font-size: 2rem;
  font-weight: 700;
  color: #059669;
}

.total-unit {
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
}

.total-usd {
  color: #64748b;
  font-size: 1rem;
}

/* 액션 버튼 */
.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-cart,
.btn-buy {
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 56px;
}

.btn-cart {
  background: #8b5cf6;
  color: white;
}

.btn-cart:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-2px);
}

.btn-buy {
  background: #059669;
  color: white;
}

.btn-buy:hover:not(:disabled) {
  background: #047857;
  transform: translateY(-2px);
}

.btn-cart:disabled,
.btn-buy:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

/* 상세 탭 */
.detail-tabs {
  margin-bottom: 48px;
}

.tab-nav {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 32px;
}

.tab-btn {
  padding: 16px 24px;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #3b82f6;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  min-height: 200px;
}

.tab-panel h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.description-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
}

.coming-soon {
  color: #6b7280;
  font-style: italic;
}

.policy-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.policy-section h4 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.policy-section ul {
  list-style: disc;
  padding-left: 20px;
  line-height: 1.6;
  color: #374151;
}

.policy-section li {
  margin-bottom: 8px;
}

/* 관련 상품 */
.related-products {
  margin-top: 48px;
}

.related-products h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.related-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s;
}

.related-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.related-image {
  height: 120px;
  overflow: hidden;
}

.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.related-info {
  padding: 12px;
}

.related-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  line-height: 1.3;
}

.related-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.related-price .price-value {
  font-size: 1rem;
  font-weight: 700;
  color: #059669;
}

.related-price .price-unit {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .product-detail {
    padding: 16px;
  }
  
  .main-section {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  
  .main-image-container {
    height: 300px;
  }
  
  .main-swiper .swiper-button-next,
  .main-swiper .swiper-button-prev {
    width: 36px;
    height: 36px;
  }
  
  .main-swiper .swiper-button-next::after,
  .main-swiper .swiper-button-prev::after {
    font-size: 14px;
  }
  
  .thumbs-swiper {
    height: 60px;
  }
  
  .product-title {
    font-size: 1.5rem;
  }
  
  .price-value {
    font-size: 2rem;
  }
  
  .price-unit {
    font-size: 1.25rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .tab-nav {
    overflow-x: auto;
  }
  
  .tab-btn {
    white-space: nowrap;
    padding: 12px 16px;
  }
  
  .related-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .policy-sections {
    gap: 16px;
  }
}
</style>