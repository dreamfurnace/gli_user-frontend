<template>
  <div class="goods-store">
    <div class="section-header">
      <h2 class="section-title">
        <span class="title-icon">🛍️</span>
        GLI-L 상품 스토어
      </h2>
      <p class="section-subtitle">GLI-L 토큰으로 구매할 수 있는 프리미엄 상품들</p>
    </div>

    <!-- 필터 및 검색 영역 -->
    <div class="filter-section">
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="상품 검색..." 
          class="search-input"
        />
        <button class="search-btn">🔍</button>
      </div>
      
      <div class="filter-controls">
        <div class="category-filter">
          <select v-model="selectedCategory" class="filter-select">
            <option value="">전체 카테고리</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="sort-filter">
          <select v-model="sortBy" class="filter-select">
            <option value="name">이름순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 상품 그리드 -->
    <div class="products-grid">
      <div 
        v-for="product in filteredProducts" 
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <div class="product-badge" v-if="product.isNew">NEW</div>
          <div class="product-badge sale" v-if="product.salePercent">-{{ product.salePercent }}%</div>
        </div>
        
        <div class="product-info">
          <div class="product-category">{{ getCategoryName(product.categoryId) }}</div>
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="product-description">{{ product.description }}</p>
          
          <div class="product-price">
            <span v-if="product.originalPrice && product.originalPrice > product.price" class="original-price">
              {{ formatPrice(product.originalPrice) }} GLI-L
            </span>
            <span class="current-price">{{ formatPrice(product.price) }} GLI-L</span>
          </div>
          
          <div class="product-actions">
            <button 
              class="btn-cart" 
              @click.stop="addToCart(product)"
              :disabled="product.stock === 0"
            >
              <span v-if="product.stock > 0">장바구니 추가</span>
              <span v-else>품절</span>
            </button>
            <button 
              class="btn-buy" 
              @click.stop="buyNow(product)"
              :disabled="product.stock === 0"
            >
              바로 구매
            </button>
          </div>
          
          <div class="product-stock">
            <span v-if="product.stock > 0" class="stock-available">재고: {{ product.stock }}개</span>
            <span v-else class="stock-out">품절</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-if="filteredProducts.length === 0" class="empty-state">
      <div class="empty-icon">🛍️</div>
      <h3>상품을 찾을 수 없습니다</h3>
      <p>다른 검색어나 필터를 사용해보세요.</p>
    </div>

    <!-- 페이지네이션 -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        이전
      </button>
      
      <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
      
      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        다음
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['add-to-cart', 'buy-now'])

// 상태 관리
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref('name')
const currentPage = ref(1)
const itemsPerPage = 12

// 카테고리 데이터
const categories = ref([
  { id: 'fashion', name: '패션 & 의류' },
  { id: 'accessories', name: '액세서리' },
  { id: 'electronics', name: '전자기기' },
  { id: 'lifestyle', name: '라이프스타일' },
  { id: 'sports', name: '스포츠 & 레저' },
  { id: 'home', name: '홈 & 리빙' }
])

// 상품 데이터 (실제로는 API에서 가져올 예정)
const products = ref([
  {
    id: 'product-1',
    name: 'GLI Premium 후드티',
    description: '프리미엄 코튼 소재의 GLI 브랜드 후드티',
    categoryId: 'fashion',
    price: 89.99,
    originalPrice: 120.00,
    salePercent: 25,
    stock: 15,
    image: '/img/products/hoodie-gli.jpg',
    isNew: true,
    popularity: 95
  },
  {
    id: 'product-2',
    name: 'GLI Signature 모자',
    description: 'GLI 로고가 새겨진 시그니처 캡',
    categoryId: 'accessories',
    price: 35.50,
    stock: 8,
    image: '/img/products/cap-gli.jpg',
    isNew: false,
    popularity: 78
  },
  {
    id: 'product-3',
    name: 'GLI 무선 이어폰',
    description: '고음질 GLI 브랜드 블루투스 이어폰',
    categoryId: 'electronics',
    price: 149.99,
    originalPrice: 199.99,
    salePercent: 25,
    stock: 12,
    image: '/img/products/earphones-gli.jpg',
    isNew: true,
    popularity: 92
  },
  {
    id: 'product-4',
    name: 'GLI 텀블러',
    description: '보온/보냉 기능이 있는 GLI 브랜드 텀블러',
    categoryId: 'lifestyle',
    price: 25.00,
    stock: 20,
    image: '/img/products/tumbler-gli.jpg',
    isNew: false,
    popularity: 65
  },
  {
    id: 'product-5',
    name: 'GLI 요가매트',
    description: '프리미엄 친환경 소재 요가매트',
    categoryId: 'sports',
    price: 75.00,
    stock: 6,
    image: '/img/products/yogamat-gli.jpg',
    isNew: false,
    popularity: 71
  },
  {
    id: 'product-6',
    name: 'GLI 디퓨저',
    description: 'GLI 시그니처 향이 나는 아로마 디퓨저',
    categoryId: 'home',
    price: 95.00,
    stock: 0,
    image: '/img/products/diffuser-gli.jpg',
    isNew: false,
    popularity: 88
  },
  {
    id: 'product-7',
    name: 'GLI 스마트워치',
    description: 'GLI 브랜딩이 적용된 스마트워치',
    categoryId: 'electronics',
    price: 299.99,
    stock: 5,
    image: '/img/products/smartwatch-gli.jpg',
    isNew: true,
    popularity: 94
  },
  {
    id: 'product-8',
    name: 'GLI 레더 지갑',
    description: '프리미엄 가죽으로 제작된 GLI 지갑',
    categoryId: 'accessories',
    price: 128.00,
    originalPrice: 160.00,
    salePercent: 20,
    stock: 10,
    image: '/img/products/wallet-gli.jpg',
    isNew: false,
    popularity: 82
  }
])

// 계산된 속성
const filteredProducts = computed(() => {
  let filtered = [...products.value]

  // 검색 필터
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    )
  }

  // 카테고리 필터
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.categoryId === selectedCategory.value)
  }

  // 정렬
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'popular':
        return b.popularity - a.popularity
      case 'name':
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // 페이지네이션
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return filtered.slice(startIndex, endIndex)
})

const totalPages = computed(() => {
  let filtered = [...products.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.categoryId === selectedCategory.value)
  }

  return Math.ceil(filtered.length / itemsPerPage)
})

// 메서드
const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(cat => cat.id === categoryId)
  return category ? category.name : ''
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const viewProduct = (product: any) => {
  console.log('상품 상세보기:', product.name)
  // 상품 상세 페이지로 이동하는 로직
}

const addToCart = (product: any) => {
  if (product.stock <= 0) return
  
  emit('add-to-cart', {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    type: 'goods',
    quantity: 1
  })
}

const buyNow = (product: any) => {
  if (product.stock <= 0) return
  
  emit('buy-now', {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    type: 'goods',
    quantity: 1
  })
}

onMounted(() => {
  console.log('GoodsStore 컴포넌트가 로드되었습니다.')
})
</script>

<style scoped>
.goods-store {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 헤더 섹션 */
.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 2.5rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

/* 필터 섹션 */
.filter-section {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.search-btn {
  padding: 0.75rem 1rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.3s ease;
}

.search-btn:hover {
  background: var(--gli-blue-dark);
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--gli-blue);
}

/* 상품 그리드 */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.product-card {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.product-image {
  position: relative;
  height: 200px;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: var(--gli-gold);
  color: var(--gli-gray-dark);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.product-badge.sale {
  background: var(--error-color);
  color: white;
}

.product-info {
  padding: 1.5rem;
}

.product-category {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.product-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.product-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.product-price {
  margin-bottom: 1rem;
}

.original-price {
  color: var(--text-secondary);
  text-decoration: line-through;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.current-price {
  color: var(--gli-blue);
  font-weight: 700;
  font-size: 1.1rem;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn-cart,
.btn-buy {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-cart {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.btn-cart:hover:not(:disabled) {
  background: var(--gli-blue);
  color: white;
  border-color: var(--gli-blue);
}

.btn-buy {
  background: var(--gli-gold);
  color: var(--gli-gray-dark);
}

.btn-buy:hover:not(:disabled) {
  background: var(--gli-gold-light);
  transform: translateY(-2px);
}

.btn-cart:disabled,
.btn-buy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-stock {
  font-size: 0.85rem;
}

.stock-available {
  color: var(--success-color);
}

.stock-out {
  color: var(--error-color);
  font-weight: 600;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--gli-blue);
  color: white;
  border-color: var(--gli-blue);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: var(--text-primary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .goods-store {
    padding: 0 0.5rem;
  }
  
  .filter-section {
    padding: 1rem;
  }
  
  .filter-controls {
    flex-direction: column;
  }
  
  .filter-select {
    min-width: auto;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-actions {
    flex-direction: column;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-btn {
    align-self: stretch;
  }
}

/* 애니메이션 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-card {
  animation: fadeIn 0.3s ease-out;
}
</style>