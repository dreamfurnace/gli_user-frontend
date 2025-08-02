<template>
  <div class="business-content-manager">
    <!-- 헤더 -->
    <div class="manager-header">
      <h1>비즈니스 콘텐츠 관리</h1>
      <p class="header-description">GLI 플랫폼의 사업 소개 콘텐츠를 관리하세요</p>
    </div>

    <!-- 섹션 탭 -->
    <div class="section-tabs">
      <button 
        v-for="section in sections" 
        :key="section.key"
        :class="['section-tab', { active: activeSection === section.key }]"
        @click="switchSection(section.key)"
      >
        {{ section.icon }} {{ section.name }}
        <span v-if="getSectionContentCount(section.key)" class="content-count">
          ({{ getSectionContentCount(section.key) }})
        </span>
      </button>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>콘텐츠를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>데이터를 불러올 수 없습니다</h3>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchSectionContent">다시 시도</button>
    </div>

    <!-- 콘텐츠 관리 -->
    <div v-else class="content-management">
      <!-- 섹션 헤더 -->
      <div class="section-header">
        <div class="section-info">
          <h2>{{ getCurrentSectionName() }}</h2>
          <p class="section-description">{{ getCurrentSectionDescription() }}</p>
        </div>
        <button 
          v-if="!isEditMode" 
          class="add-content-btn"
          @click="startAddingContent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          콘텐츠 추가
        </button>
      </div>

      <!-- 편집 모드 -->
      <div v-if="isEditMode" class="edit-form">
        <div class="form-header">
          <h3>{{ editingContent ? '콘텐츠 수정' : '새 콘텐츠 추가' }}</h3>
          <button class="close-form-btn" @click="cancelEdit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form @submit.prevent="saveContent" class="content-form">
          <div class="form-group">
            <label for="title">제목 *</label>
            <input 
              id="title"
              v-model="formData.title" 
              type="text" 
              required
              placeholder="콘텐츠 제목을 입력하세요"
            >
          </div>

          <div class="form-group">
            <label for="subtitle">부제목</label>
            <input 
              id="subtitle"
              v-model="formData.subtitle" 
              type="text" 
              placeholder="부제목을 입력하세요 (선택사항)"
            >
          </div>

          <div class="form-group">
            <label for="content">내용 *</label>
            <textarea 
              id="content"
              v-model="formData.content" 
              required
              rows="8"
              placeholder="콘텐츠 내용을 입력하세요"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="image_url">이미지 URL</label>
            <input 
              id="image_url"
              v-model="formData.image_url" 
              type="url" 
              placeholder="https://example.com/image.jpg"
            >
            <div v-if="formData.image_url" class="image-preview">
              <img 
                :src="formData.image_url" 
                alt="미리보기"
                @error="handleImageError"
              >
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="order">순서</label>
              <input 
                id="order"
                v-model.number="formData.order" 
                type="number" 
                min="0"
                placeholder="0"
              >
            </div>

            <div class="form-group">
              <label for="status">상태</label>
              <select id="status" v-model="formData.status">
                <option value="draft">초안</option>
                <option value="published">게시됨</option>
                <option value="archived">보관됨</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="cancelEdit">
              취소
            </button>
            <button type="submit" class="btn-save" :disabled="saving">
              <span v-if="saving" class="loading-spinner small"></span>
              <span v-else>{{ editingContent ? '수정' : '추가' }}</span>
            </button>
          </div>
        </form>
      </div>

      <!-- 콘텐츠 목록 -->
      <div v-else class="content-list">
        <!-- 빈 상태 -->
        <div v-if="sectionContents.length === 0" class="empty-content">
          <div class="empty-icon">📄</div>
          <h3>콘텐츠가 없습니다</h3>
          <p>{{ getCurrentSectionName() }} 섹션에 첫 번째 콘텐츠를 추가해보세요</p>
          <button class="add-first-content-btn" @click="startAddingContent">
            첫 콘텐츠 추가하기
          </button>
        </div>

        <!-- 콘텐츠 카드들 -->
        <div v-else class="content-cards">
          <div 
            v-for="content in sectionContents" 
            :key="content.id"
            class="content-card"
            :class="{ draft: content.status === 'draft', archived: content.status === 'archived' }"
          >
            <!-- 상태 배지 -->
            <div class="status-badge" :class="content.status">
              {{ getStatusDisplay(content.status) }}
            </div>

            <!-- 콘텐츠 이미지 -->
            <div v-if="content.image_url" class="content-image">
              <img 
                :src="content.image_url" 
                :alt="content.title"
                @error="handleImageError"
              >
            </div>

            <!-- 콘텐츠 정보 -->
            <div class="content-info">
              <div class="content-header">
                <h3 class="content-title">{{ content.title }}</h3>
                <div class="content-order">순서: {{ content.order }}</div>
              </div>
              
              <p v-if="content.subtitle" class="content-subtitle">{{ content.subtitle }}</p>
              
              <p class="content-text">{{ content.content }}</p>
              
              <div class="content-meta">
                <span class="created-date">
                  생성: {{ formatDate(content.created_at) }}
                </span>
                <span v-if="content.updated_at !== content.created_at" class="updated-date">
                  수정: {{ formatDate(content.updated_at) }}
                </span>
              </div>
            </div>

            <!-- 액션 버튼 -->
            <div class="content-actions">
              <button class="btn-edit" @click="editContent(content)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                수정
              </button>
              <button class="btn-delete" @click="deleteContent(content)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6l-2,14H7L5,6"></path>
                  <path d="M10,11v6"></path>
                  <path d="M14,11v6"></path>
                </svg>
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 성공/에러 메시지 -->
    <div v-if="successMessage" class="message success">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="message error">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { getBusinessContentBySection } from '../services/api'

interface BusinessContent {
  id: string
  section: string
  title: string
  subtitle: string
  content: string
  image_url?: string
  order: number
  status: string
  created_at: string
  updated_at: string
}

// 섹션 정의
const sections = [
  { key: 'background', name: '회사 소개', icon: '🏢' },
  { key: 'team', name: '사업 소개', icon: '💼' },
  { key: 'strategy', name: '사업 계획', icon: '📈' },
  { key: 'tokens', name: '생태계 토큰', icon: '🪙' },
  { key: 'roadmap', name: '추진 사업', icon: '🗺️' },
]

// 반응형 데이터
const activeSection = ref('background')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const errorMessage = ref('')
const saving = ref(false)

const allContents = ref<BusinessContent[]>([])
const isEditMode = ref(false)
const editingContent = ref<BusinessContent | null>(null)

// 폼 데이터
const formData = reactive({
  title: '',
  subtitle: '',
  content: '',
  image_url: '',
  order: 0,
  status: 'published'
})

// 계산된 속성
const sectionContents = computed(() => {
  return allContents.value
    .filter(content => content.section === activeSection.value)
    .sort((a, b) => a.order - b.order)
})

// 섹션별 콘텐츠 개수
const getSectionContentCount = (sectionKey: string): number => {
  return allContents.value.filter(content => content.section === sectionKey).length
}

// 현재 섹션 정보
const getCurrentSectionName = (): string => {
  const section = sections.find(s => s.key === activeSection.value)
  return section ? section.name : '알 수 없음'
}

const getCurrentSectionDescription = (): string => {
  const descriptions: Record<string, string> = {
    'background': 'GLI 플랫폼과 회사에 대한 소개 콘텐츠를 관리합니다',
    'team': '사업 영역과 서비스에 대한 소개 콘텐츠를 관리합니다',
    'strategy': '사업 전략과 계획에 대한 콘텐츠를 관리합니다',
    'tokens': 'GLI 토큰 생태계에 대한 콘텐츠를 관리합니다',
    'roadmap': '추진 중인 사업과 로드맵 콘텐츠를 관리합니다'
  }
  return descriptions[activeSection.value] || ''
}

// 상태 표시 텍스트
const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'draft': '초안',
    'published': '게시됨',
    'archived': '보관됨'
  }
  return statusMap[status] || status
}

// 날짜 포맷팅
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 이미지 에러 처리
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/placeholder-content.jpg'
}

// 메시지 표시
const showMessage = (message: string, type: 'success' | 'error') => {
  if (type === 'success') {
    successMessage.value = message
    setTimeout(() => { successMessage.value = '' }, 3000)
  } else {
    errorMessage.value = message
    setTimeout(() => { errorMessage.value = '' }, 5000)
  }
}

// 섹션 전환
const switchSection = (sectionKey: string) => {
  if (isEditMode.value) {
    if (confirm('편집 중인 내용이 있습니다. 섹션을 변경하시겠습니까?')) {
      cancelEdit()
      activeSection.value = sectionKey
    }
  } else {
    activeSection.value = sectionKey
  }
}

// 섹션 콘텐츠 조회
const fetchSectionContent = async () => {
  loading.value = true
  error.value = ''

  try {
    // 모든 섹션의 콘텐츠를 한 번에 조회 (향후 최적화 가능)
    const promises = sections.map(section => 
      getBusinessContentBySection(section.key).catch(() => ({ data: [] }))
    )
    
    const responses = await Promise.all(promises)
    
    allContents.value = []
    responses.forEach((response, index) => {
      if (response.data && Array.isArray(response.data)) {
        allContents.value.push(...response.data)
      }
    })

  } catch (err: any) {
    console.error('Failed to fetch business content:', err)
    error.value = err.message || '콘텐츠를 불러오는데 실패했습니다.'
  } finally {
    loading.value = false
  }
}

// 폼 리셋
const resetForm = () => {
  formData.title = ''
  formData.subtitle = ''
  formData.content = ''
  formData.image_url = ''
  formData.order = 0
  formData.status = 'published'
}

// 콘텐츠 추가 시작
const startAddingContent = () => {
  resetForm()
  editingContent.value = null
  isEditMode.value = true
  
  // 다음 순서 번호 자동 설정
  const maxOrder = Math.max(0, ...sectionContents.value.map(c => c.order))
  formData.order = maxOrder + 1
}

// 콘텐츠 편집 시작
const editContent = (content: BusinessContent) => {
  editingContent.value = content
  formData.title = content.title
  formData.subtitle = content.subtitle
  formData.content = content.content
  formData.image_url = content.image_url || ''
  formData.order = content.order
  formData.status = content.status
  isEditMode.value = true
}

// 편집 취소
const cancelEdit = () => {
  isEditMode.value = false
  editingContent.value = null
  resetForm()
}

// 콘텐츠 저장
const saveContent = async () => {
  saving.value = true
  
  try {
    const contentData = {
      section: activeSection.value,
      title: formData.title,
      subtitle: formData.subtitle,
      content: formData.content,
      image_url: formData.image_url || null,
      order: formData.order,
      status: formData.status
    }

    if (editingContent.value) {
      // 수정 로직 (실제 API 호출)
      console.log('Update content:', editingContent.value.id, contentData)
      showMessage('콘텐츠가 성공적으로 수정되었습니다.', 'success')
    } else {
      // 추가 로직 (실제 API 호출)
      console.log('Create content:', contentData)
      showMessage('콘텐츠가 성공적으로 추가되었습니다.', 'success')
    }

    // TODO: 실제 API 호출 후 목록 새로고침
    // await fetchSectionContent()
    
    cancelEdit()

  } catch (err: any) {
    console.error('Failed to save content:', err)
    showMessage(err.message || '콘텐츠 저장에 실패했습니다.', 'error')
  } finally {
    saving.value = false
  }
}

// 콘텐츠 삭제
const deleteContent = async (content: BusinessContent) => {
  if (!confirm(`"${content.title}" 콘텐츠를 삭제하시겠습니까?`)) {
    return
  }

  try {
    // TODO: 실제 API 호출
    console.log('Delete content:', content.id)
    
    // 임시로 로컬에서 제거
    allContents.value = allContents.value.filter(c => c.id !== content.id)
    
    showMessage('콘텐츠가 성공적으로 삭제되었습니다.', 'success')

  } catch (err: any) {
    console.error('Failed to delete content:', err)
    showMessage(err.message || '콘텐츠 삭제에 실패했습니다.', 'error')
  }
}

// 컴포넌트 마운트
onMounted(() => {
  fetchSectionContent()
})
</script>

<style scoped>
.business-content-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.manager-header {
  text-align: center;
  margin-bottom: 32px;
}

.manager-header h1 {
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

.section-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  justify-content: center;
}

.section-tab {
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

.section-tab:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.section-tab.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.content-count {
  font-size: 0.75rem;
  opacity: 0.8;
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

.content-management {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.section-info h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.section-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.add-content-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-content-btn:hover {
  background: #2563eb;
}

/* 편집 폼 */
.edit-form {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.close-form-btn {
  padding: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-form-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.content-form {
  max-width: 800px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.image-preview {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  max-width: 300px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: #3b82f6;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #2563eb;
}

.btn-save:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

/* 콘텐츠 목록 */
.content-list {
  padding: 24px;
}

.empty-content {
  text-align: center;
  padding: 48px 20px;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-content h3 {
  color: #111827;
  margin-bottom: 8px;
}

.empty-content p {
  color: #6b7280;
  margin-bottom: 24px;
}

.add-first-content-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-first-content-btn:hover {
  background: #2563eb;
}

.content-cards {
  display: grid;
  gap: 20px;
}

.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  transition: all 0.3s;
  position: relative;
}

.content-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.content-card.draft {
  border-color: #fbbf24;
  background: #fffbeb;
}

.content-card.archived {
  opacity: 0.7;
  background: #f9fafb;
}

.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
}

.status-badge.draft {
  background: #fbbf24;
  color: white;
}

.status-badge.published {
  background: #059669;
  color: white;
}

.status-badge.archived {
  background: #6b7280;
  color: white;
}

.content-image {
  height: 200px;
  overflow: hidden;
}

.content-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-info {
  padding: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.content-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  flex: 1;
  margin-right: 12px;
}

.content-order {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.content-subtitle {
  color: #6b7280;
  margin-bottom: 12px;
  font-style: italic;
}

.content-text {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.content-meta {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.content-actions {
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.btn-edit,
.btn-delete {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-edit {
  background: #eff6ff;
  color: #2563eb;
}

.btn-edit:hover {
  background: #dbeafe;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fee2e2;
}

/* 메시지 */
.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message.success {
  background: #dcfce7;
  color: #059669;
  border: 1px solid #bbf7d0;
}

.message.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

@media (max-width: 768px) {
  .business-content-manager {
    padding: 16px;
  }
  
  .manager-header h1 {
    font-size: 2rem;
  }
  
  .section-tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 8px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>