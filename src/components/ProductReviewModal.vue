<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>⭐ 상품 리뷰 작성</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 상품 정보 -->
        <div class="product-info">
          <div class="product-image">
            <img :src="product.main_image_url || '/placeholder-product.jpg'" :alt="product.name">
          </div>
          <div class="product-details">
            <h3>{{ product.name }}</h3>
            <p class="product-description">{{ product.short_description }}</p>
          </div>
        </div>

        <!-- 리뷰 폼 -->
        <div class="review-form">
          <!-- 별점 선택 -->
          <div class="rating-section">
            <label class="section-label">별점</label>
            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="star-btn"
                :class="{ active: star <= rating }"
                @click="setRating(star)"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </button>
            </div>
            <div class="rating-text">
              <span v-if="rating > 0" class="rating-label">
                {{ getRatingText(hoverRating || rating) }}
              </span>
              <span v-else class="rating-placeholder">별점을 선택해주세요</span>
            </div>
          </div>

          <!-- 리뷰 제목 -->
          <div class="form-group">
            <label for="review-title" class="section-label">리뷰 제목</label>
            <input
              id="review-title"
              v-model="reviewTitle"
              type="text"
              placeholder="리뷰 제목을 입력해주세요"
              maxlength="100"
            >
            <div class="char-count">{{ reviewTitle.length }}/100</div>
          </div>

          <!-- 리뷰 내용 -->
          <div class="form-group">
            <label for="review-content" class="section-label">리뷰 내용</label>
            <textarea
              id="review-content"
              v-model="reviewContent"
              placeholder="상품에 대한 솔직한 후기를 작성해주세요"
              rows="5"
              maxlength="1000"
            ></textarea>
            <div class="char-count">{{ reviewContent.length }}/1000</div>
          </div>

          <!-- 장점/단점 (선택사항) -->
          <div class="pros-cons-section">
            <div class="form-group">
              <label for="review-pros" class="section-label">장점 (선택사항)</label>
              <textarea
                id="review-pros"
                v-model="reviewPros"
                placeholder="이 상품의 좋은 점이 있다면 알려주세요"
                rows="2"
                maxlength="300"
              ></textarea>
              <div class="char-count">{{ reviewPros.length }}/300</div>
            </div>

            <div class="form-group">
              <label for="review-cons" class="section-label">단점 (선택사항)</label>
              <textarea
                id="review-cons"
                v-model="reviewCons"
                placeholder="개선되었으면 하는 점이 있다면 알려주세요"
                rows="2"
                maxlength="300"
              ></textarea>
              <div class="char-count">{{ reviewCons.length }}/300</div>
            </div>
          </div>

          <!-- 추천 여부 -->
          <div class="recommendation-section">
            <label class="section-label">이 상품을 다른 사람에게 추천하시겠습니까?</label>
            <div class="recommendation-options">
              <label class="radio-option">
                <input type="radio" v-model="wouldRecommend" :value="true">
                <span class="radio-custom"></span>
                <span class="radio-text">👍 네, 추천합니다</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="wouldRecommend" :value="false">
                <span class="radio-custom"></span>
                <span class="radio-text">👎 추천하지 않습니다</span>
              </label>
            </div>
          </div>
        </div>

        <!-- 에러 메시지 -->
        <div v-if="errorMessage" class="error-message">
          <div class="message-content">
            <span class="message-icon">❌</span>
            <span class="message-text">{{ errorMessage }}</span>
          </div>
        </div>

        <!-- 성공 메시지 -->
        <div v-if="successMessage" class="success-message">
          <div class="message-content">
            <span class="message-icon">✅</span>
            <span class="message-text">{{ successMessage }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal" :disabled="isLoading">
          취소
        </button>
        <button 
          class="btn-submit" 
          @click="submitReview"
          :disabled="!canSubmit || isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>리뷰 등록</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Product {
  id: string
  name: string
  short_description: string
  main_image_url?: string
}

interface Props {
  show: boolean
  product: Product
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'review-submitted': [review: any]
}>()

// 반응형 데이터
const rating = ref(0)
const hoverRating = ref(0)
const reviewTitle = ref('')
const reviewContent = ref('')
const reviewPros = ref('')
const reviewCons = ref('')
const wouldRecommend = ref<boolean | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 제출 가능 여부
const canSubmit = computed(() => {
  return rating.value > 0 && 
         reviewTitle.value.trim().length > 0 && 
         reviewContent.value.trim().length > 0 &&
         wouldRecommend.value !== null
})

// 별점 설정
const setRating = (star: number) => {
  rating.value = star
}

// 별점 텍스트
const getRatingText = (stars: number): string => {
  const texts = [
    '',
    '매우 불만족',
    '불만족',
    '보통',
    '만족',
    '매우 만족'
  ]
  return texts[stars] || ''
}

// 리뷰 제출
const submitReview = async () => {
  if (!canSubmit.value) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // TODO: 실제 API 호출로 교체
    const reviewData = {
      product_id: props.product.id,
      rating: rating.value,
      title: reviewTitle.value.trim(),
      content: reviewContent.value.trim(),
      pros: reviewPros.value.trim() || null,
      cons: reviewCons.value.trim() || null,
      would_recommend: wouldRecommend.value
    }

    // 임시로 1초 지연
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 성공 메시지 표시
    successMessage.value = '리뷰가 성공적으로 등록되었습니다!'
    
    // 이벤트 발생
    emit('review-submitted', reviewData)
    
    // 2초 후 모달 닫기
    setTimeout(() => {
      closeModal()
    }, 2000)

  } catch (error: any) {
    console.error('Failed to submit review:', error)
    errorMessage.value = error.message || '리뷰 등록에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

// 모달 닫기
const closeModal = () => {
  if (!isLoading.value) {
    emit('update:show', false)
    resetForm()
  }
}

// 폼 초기화
const resetForm = () => {
  rating.value = 0
  hoverRating.value = 0
  reviewTitle.value = ''
  reviewContent.value = ''
  reviewPros.value = ''
  reviewCons.value = ''
  wouldRecommend.value = null
  errorMessage.value = ''
  successMessage.value = ''
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 1000;
  backdrop-filter: blur(4px);
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  margin: 20px auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.product-info {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details h3 {
  margin: 0 0 8px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.product-description {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.review-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.rating-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.star-rating {
  display: flex;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #d1d5db;
  transition: all 0.2s;
  padding: 4px;
}

.star-btn:hover,
.star-btn.active {
  color: #fbbf24;
  transform: scale(1.1);
}

.rating-text {
  font-size: 0.875rem;
  height: 20px;
}

.rating-label {
  color: #059669;
  font-weight: 500;
}

.rating-placeholder {
  color: #9ca3af;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group input,
.form-group textarea {
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.char-count {
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: right;
}

.pros-cons-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.recommendation-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.radio-option:hover {
  background: #f3f4f6;
}

.radio-option input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: white;
  transition: all 0.2s;
}

.radio-option input[type="radio"]:checked + .radio-custom {
  background: #3b82f6;
  border-color: #3b82f6;
}

.radio-option input[type="radio"]:checked + .radio-custom::after {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  background: white;
  border-radius: 50%;
  margin: 3px;
}

.radio-text {
  font-size: 0.875rem;
  color: #374151;
}

.error-message,
.success-message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.message-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-icon {
  font-size: 1.125rem;
}

.message-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.error-message .message-text {
  color: #dc2626;
}

.success-message .message-text {
  color: #059669;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  justify-content: flex-end;
}

.btn-cancel,
.btn-submit {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-content {
    margin: 10px auto;
    max-height: calc(100vh - 20px);
  }
  
  .product-info {
    flex-direction: column;
    text-align: center;
  }
  
  .product-image {
    align-self: center;
  }
  
  .pros-cons-section {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>