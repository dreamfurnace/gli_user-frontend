<template>
  <div class="product-reviews">
    <!-- 리뷰 헤더 -->
    <div class="reviews-header">
      <div class="reviews-summary">
        <h3>상품 리뷰</h3>
        <div class="rating-summary">
          <div class="average-rating">
            <div class="stars-display">
              <span 
                v-for="star in 5" 
                :key="star"
                class="star"
                :class="{ filled: star <= Math.round(averageRating) }"
              >
                ⭐
              </span>
            </div>
            <span class="rating-value">{{ averageRating.toFixed(1) }}</span>
            <span class="review-count">({{ totalReviews }}개 리뷰)</span>
          </div>
          
          <!-- 별점 분포 -->
          <div class="rating-distribution">
            <div 
              v-for="rating in 5" 
              :key="rating"
              class="rating-bar"
            >
              <span class="rating-label">{{ 6 - rating }}★</span>
              <div class="bar-container">
                <div 
                  class="bar-fill" 
                  :style="{ width: getRatingPercentage(6 - rating) + '%' }"
                ></div>
              </div>
              <span class="rating-count">{{ getRatingCount(6 - rating) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <button 
        v-if="canWriteReview"
        class="btn-write-review" 
        @click="openReviewModal"
      >
        리뷰 작성하기
      </button>
    </div>

    <!-- 필터 및 정렬 -->
    <div class="reviews-filters">
      <div class="filter-group">
        <select v-model="selectedRating" @change="applyFilters">
          <option value="">전체 별점</option>
          <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
          <option value="4">⭐⭐⭐⭐ (4점)</option>
          <option value="3">⭐⭐⭐ (3점)</option>
          <option value="2">⭐⭐ (2점)</option>
          <option value="1">⭐ (1점)</option>
        </select>
      </div>
      
      <div class="filter-group">
        <select v-model="sortBy" @change="applyFilters">
          <option value="-created_at">최신순</option>
          <option value="created_at">오래된순</option>
          <option value="-rating">별점 높은순</option>
          <option value="rating">별점 낮은순</option>
          <option value="-helpful_count">도움순</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="checkbox-filter">
          <input type="checkbox" v-model="showRecommendedOnly" @change="applyFilters">
          <span class="checkbox-text">추천 리뷰만</span>
        </label>
      </div>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>리뷰를 불러오는 중...</p>
    </div>

    <!-- 리뷰 목록 -->
    <div v-else-if="reviews.length > 0" class="reviews-list">
      <div 
        v-for="review in reviews" 
        :key="review.id"
        class="review-item"
      >
        <!-- 리뷰 헤더 -->
        <div class="review-header">
          <div class="reviewer-info">
            <div class="reviewer-avatar">
              <img 
                :src="review.user_avatar || '/default-avatar.png'" 
                :alt="review.user_name"
                @error="handleAvatarError"
              >
            </div>
            <div class="reviewer-details">
              <span class="reviewer-name">{{ review.user_name || '익명' }}</span>
              <div class="review-meta">
                <div class="stars-display">
                  <span 
                    v-for="star in 5" 
                    :key="star"
                    class="star"
                    :class="{ filled: star <= review.rating }"
                  >
                    ⭐
                  </span>
                </div>
                <span class="review-date">{{ formatDate(review.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <div class="review-actions">
            <button 
              v-if="review.would_recommend"
              class="recommend-badge"
            >
              👍 추천
            </button>
          </div>
        </div>

        <!-- 리뷰 내용 -->
        <div class="review-content">
          <h4 class="review-title">{{ review.title }}</h4>
          <p class="review-text">{{ review.content }}</p>
          
          <!-- 장점/단점 -->
          <div v-if="review.pros || review.cons" class="pros-cons">
            <div v-if="review.pros" class="pros">
              <span class="label">👍 장점:</span>
              <span class="text">{{ review.pros }}</span>
            </div>
            <div v-if="review.cons" class="cons">
              <span class="label">👎 단점:</span>
              <span class="text">{{ review.cons }}</span>
            </div>
          </div>
        </div>

        <!-- 리뷰 푸터 -->
        <div class="review-footer">
          <div class="helpful-section">
            <button 
              class="btn-helpful"
              :class="{ active: review.user_found_helpful }"
              @click="toggleHelpful(review.id)"
              :disabled="isUpdatingHelpful"
            >
              👍 도움돼요 ({{ review.helpful_count || 0 }})
            </button>
          </div>
          
          <div class="review-options">
            <button class="btn-report" @click="reportReview(review.id)">
              신고
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 상태 -->
    <div v-else class="empty-reviews">
      <div class="empty-icon">📝</div>
      <h3>아직 리뷰가 없습니다</h3>
      <p>이 상품에 대한 첫 번째 리뷰를 작성해보세요!</p>
      <button 
        v-if="canWriteReview"
        class="btn-write-first-review" 
        @click="openReviewModal"
      >
        첫 리뷰 작성하기
      </button>
    </div>

    <!-- 더보기 버튼 -->
    <div v-if="hasMore && !loading" class="load-more-container">
      <button class="btn-load-more" @click="loadMoreReviews">
        더 많은 리뷰 보기
      </button>
    </div>

    <!-- 리뷰 작성 모달 -->
    <ProductReviewModal 
      :show="showReviewModal"
      :product="product"
      @update:show="showReviewModal = $event"
      @review-submitted="handleReviewSubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProductReviewModal from './ProductReviewModal.vue'

interface Review {
  id: string
  user_name: string
  user_avatar?: string
  rating: number
  title: string
  content: string
  pros?: string
  cons?: string
  would_recommend: boolean
  helpful_count: number
  user_found_helpful: boolean
  created_at: string
}

interface Product {
  id: string
  name: string
  short_description: string
  main_image_url?: string
}

interface Props {
  product: Product
  canWriteReview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canWriteReview: true
})

// 반응형 데이터
const reviews = ref<Review[]>([])
const loading = ref(false)
const isUpdatingHelpful = ref(false)
const showReviewModal = ref(false)

// 필터 상태
const selectedRating = ref('')
const sortBy = ref('-created_at')
const showRecommendedOnly = ref(false)

// 페이지네이션
const currentPage = ref(1)
const hasMore = ref(true)

// 리뷰 통계 (임시 데이터)
const ratingStats = ref({
  1: 2,
  2: 1,
  3: 5,
  4: 12,
  5: 25
})

// 계산된 속성
const totalReviews = computed(() => {
  return Object.values(ratingStats.value).reduce((sum, count) => sum + count, 0)
})

const averageRating = computed(() => {
  if (totalReviews.value === 0) return 0
  
  const totalScore = Object.entries(ratingStats.value).reduce((sum, [rating, count]) => {
    return sum + (parseInt(rating) * count)
  }, 0)
  
  return totalScore / totalReviews.value
})

// 별점 비율 계산
const getRatingPercentage = (rating: number): number => {
  if (totalReviews.value === 0) return 0
  return (ratingStats.value[rating as keyof typeof ratingStats.value] / totalReviews.value) * 100
}

// 별점 개수 가져오기
const getRatingCount = (rating: number): number => {
  return ratingStats.value[rating as keyof typeof ratingStats.value] || 0
}

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 아바타 에러 처리
const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/default-avatar.png'
}

// 리뷰 데이터 로드 (임시 구현)
const loadReviews = async (reset = false) => {
  loading.value = true
  
  try {
    // TODO: 실제 API 호출로 교체
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 임시 리뷰 데이터
    const mockReviews: Review[] = [
      {
        id: '1',
        user_name: '김민수',
        rating: 5,
        title: '정말 만족스러운 상품입니다!',
        content: '품질도 좋고 배송도 빨라서 매우 만족합니다. 다음에도 이용할 예정이에요.',
        pros: '품질이 우수하고 가격 대비 만족도가 높음',
        cons: '특별한 단점은 없음',
        would_recommend: true,
        helpful_count: 12,
        user_found_helpful: false,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        user_name: '이영희',
        rating: 4,
        title: '괜찮은 상품',
        content: '전반적으로 괜찮은 상품이네요. 약간의 아쉬운 점은 있지만 추천할 만합니다.',
        would_recommend: true,
        helpful_count: 8,
        user_found_helpful: true,
        created_at: '2024-01-10T14:20:00Z'
      },
      {
        id: '3',
        user_name: '박철수',
        rating: 3,
        title: '보통입니다',
        content: '기대했던 것보다는 아쉽지만 그럭저럭 쓸만합니다.',
        would_recommend: false,
        helpful_count: 3,
        user_found_helpful: false,
        created_at: '2024-01-05T09:15:00Z'
      }
    ]
    
    if (reset) {
      reviews.value = mockReviews
    } else {
      reviews.value.push(...mockReviews)
    }
    
    hasMore.value = currentPage.value < 3 // 임시로 3페이지까지만
    
  } catch (error) {
    console.error('Failed to load reviews:', error)
  } finally {
    loading.value = false
  }
}

// 필터 적용
const applyFilters = () => {
  currentPage.value = 1
  loadReviews(true)
}

// 더 많은 리뷰 로드
const loadMoreReviews = () => {
  currentPage.value++
  loadReviews(false)
}

// 도움돼요 토글
const toggleHelpful = async (reviewId: string) => {
  isUpdatingHelpful.value = true
  
  try {
    // TODO: 실제 API 호출로 교체
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const review = reviews.value.find(r => r.id === reviewId)
    if (review) {
      if (review.user_found_helpful) {
        review.helpful_count--
        review.user_found_helpful = false
      } else {
        review.helpful_count++
        review.user_found_helpful = true
      }
    }
  } catch (error) {
    console.error('Failed to toggle helpful:', error)
  } finally {
    isUpdatingHelpful.value = false
  }
}

// 리뷰 신고
const reportReview = (reviewId: string) => {
  // TODO: 신고 기능 구현
  alert('리뷰 신고 기능은 준비 중입니다.')
}

// 리뷰 작성 모달 열기
const openReviewModal = () => {
  showReviewModal.value = true
}

// 리뷰 제출 완료 처리
const handleReviewSubmitted = (reviewData: any) => {
  // 새 리뷰를 목록 맨 앞에 추가
  const newReview: Review = {
    id: Date.now().toString(),
    user_name: '나',
    rating: reviewData.rating,
    title: reviewData.title,
    content: reviewData.content,
    pros: reviewData.pros,
    cons: reviewData.cons,
    would_recommend: reviewData.would_recommend,
    helpful_count: 0,
    user_found_helpful: false,
    created_at: new Date().toISOString()
  }
  
  reviews.value.unshift(newReview)
  
  // 통계 업데이트
  ratingStats.value[reviewData.rating as keyof typeof ratingStats.value]++
}

// 컴포넌트 마운트
onMounted(() => {
  loadReviews(true)
})
</script>

<style scoped>
.product-reviews {
  max-width: 800px;
  margin: 0 auto;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.reviews-summary h3 {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stars-display {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1.25rem;
  color: #d1d5db;
}

.star.filled {
  color: #fbbf24;
}

.rating-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.review-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 300px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-label {
  font-size: 0.75rem;
  color: #6b7280;
  width: 30px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: #fbbf24;
  transition: width 0.3s ease;
}

.rating-count {
  font-size: 0.75rem;
  color: #6b7280;
  width: 20px;
  text-align: right;
}

.btn-write-review,
.btn-write-first-review {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-write-review:hover,
.btn-write-first-review:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.reviews-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.checkbox-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.875rem;
}

.loading-container {
  text-align: center;
  padding: 48px 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  transition: all 0.2s;
}

.review-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.reviewer-info {
  display: flex;
  gap: 12px;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.reviewer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reviewer-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.review-meta .stars-display .star {
  font-size: 1rem;
}

.review-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.recommend-badge {
  background: #dcfce7;
  color: #166534;
  border: none;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.review-content {
  margin-bottom: 16px;
}

.review-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.review-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.pros-cons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.pros,
.cons {
  display: flex;
  gap: 8px;
  font-size: 0.875rem;
}

.pros .label,
.cons .label {
  font-weight: 500;
  flex-shrink: 0;
}

.pros .text,
.cons .text {
  color: #374151;
}

.review-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.btn-helpful {
  background: none;
  border: 1px solid #d1d5db;
  color: #6b7280;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-helpful:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.btn-helpful.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-helpful:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-report {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 4px 8px;
}

.btn-report:hover {
  color: #dc2626;
}

.empty-reviews {
  text-align: center;
  padding: 64px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-reviews h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.empty-reviews p {
  color: #6b7280;
  margin-bottom: 24px;
}

.load-more-container {
  text-align: center;
  margin-top: 24px;
}

.btn-load-more {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover {
  background: #e5e7eb;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .reviews-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .rating-distribution {
    min-width: auto;
  }
  
  .reviews-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .review-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .review-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .pros-cons {
    flex-direction: column;
  }
}
</style>