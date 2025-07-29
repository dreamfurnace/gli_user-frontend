<template>
  <div class="information-center">
    <!-- 헤더 섹션 -->
    <div class="info-header">
      <div class="header-content">
        <div class="header-main">
          <h1 class="page-title">
            <span class="title-icon">📑</span>
            {{ $t('info.title') }}
          </h1>
          <p class="page-subtitle">{{ $t('info.subtitle') }}</p>
        </div>
        
        <!-- 검색 바 -->
        <div class="search-section">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="$t('info.searchPlaceholder')"
              @input="filterContent"
            >
            <button class="search-btn">
              <span class="search-icon">🔍</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="info-content">
      <!-- 빠른 링크 섹션 -->
      <div class="section-card quick-links">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">⚡</span>
            {{ $t('info.quickLinks') }}
          </h2>
        </div>
        
        <div class="quick-links-grid">
          <div
            v-for="link in quickLinks"
            :key="link.id"
            class="quick-link-card"
            @click="scrollToSection(link.target)"
          >
            <div class="link-icon">{{ link.icon }}</div>
            <div class="link-content">
              <h4 class="link-title">{{ $t(link.title) }}</h4>
              <p class="link-description">{{ $t(link.description) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ 섹션 -->
      <div id="faq-section" class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">❓</span>
            {{ $t('info.faq.title') }}
          </h2>
          <p class="section-description">{{ $t('info.faq.subtitle') }}</p>
        </div>
        
        <!-- FAQ 카테고리 -->
        <div class="faq-categories">
          <button
            v-for="category in faqCategories"
            :key="category.id"
            class="category-btn"
            :class="{ active: selectedCategory === category.id }"
            @click="selectedCategory = category.id"
          >
            <span class="category-icon">{{ category.icon }}</span>
            {{ $t(category.name) }}
          </button>
        </div>
        
        <!-- FAQ 리스트 -->
        <div class="faq-list">
          <div
            v-for="faq in filteredFAQs"
            :key="faq.id"
            class="faq-item"
            :class="{ active: expandedFAQ === faq.id }"
          >
            <div class="faq-question" @click="toggleFAQ(faq.id)">
              <h4>{{ $t(faq.question) }}</h4>
              <span class="toggle-icon">{{ expandedFAQ === faq.id ? '−' : '+' }}</span>
            </div>
            <div v-if="expandedFAQ === faq.id" class="faq-answer">
              <div v-html="$t(faq.answer)"></div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredFAQs.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>{{ $t('info.noResults') }}</p>
          <p class="empty-help">{{ $t('info.tryDifferentSearch') }}</p>
        </div>
      </div>

      <!-- 사용자 가이드 섹션 -->
      <div id="guides-section" class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">📖</span>
            {{ $t('info.guides.title') }}
          </h2>
          <p class="section-description">{{ $t('info.guides.subtitle') }}</p>
        </div>
        
        <div class="guides-grid">
          <div
            v-for="guide in userGuides"
            :key="guide.id"
            class="guide-card"
            @click="openGuide(guide)"
          >
            <div class="guide-header">
              <div class="guide-icon">{{ guide.icon }}</div>
              <div class="guide-badge" :class="guide.difficulty">
                {{ $t(`info.guides.difficulty.${guide.difficulty}`) }}
              </div>
            </div>
            <div class="guide-content">
              <h4 class="guide-title">{{ $t(guide.title) }}</h4>
              <p class="guide-description">{{ $t(guide.description) }}</p>
              <div class="guide-meta">
                <span class="guide-duration">⏱️ {{ guide.duration }}</span>
                <span class="guide-steps">📋 {{ guide.steps }} steps</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 다운로드 리소스 섹션 -->
      <div id="resources-section" class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">📁</span>
            {{ $t('info.resources.title') }}
          </h2>
          <p class="section-description">{{ $t('info.resources.subtitle') }}</p>
        </div>
        
        <div class="resources-list">
          <div
            v-for="resource in downloadResources"
            :key="resource.id"
            class="resource-item"
          >
            <div class="resource-icon">{{ resource.icon }}</div>
            <div class="resource-info">
              <h4 class="resource-title">{{ $t(resource.title) }}</h4>
              <p class="resource-description">{{ $t(resource.description) }}</p>
              <div class="resource-meta">
                <span class="resource-type">{{ resource.type }}</span>
                <span class="resource-size">{{ resource.size }}</span>
              </div>
            </div>
            <button class="download-btn" @click="downloadResource(resource)">
              <span class="btn-icon">💾</span>
              {{ $t('info.download') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 연락처 섹션 -->
      <div id="contact-section" class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">📞</span>
            {{ $t('info.contact.title') }}
          </h2>
          <p class="section-description">{{ $t('info.contact.subtitle') }}</p>
        </div>
        
        <div class="contact-content">
          <div class="contact-methods">
            <div class="contact-method">
              <div class="method-icon">📧</div>
              <div class="method-info">
                <h4>{{ $t('info.contact.email') }}</h4>
                <p>support@gli.io</p>
              </div>
            </div>
            <div class="contact-method">
              <div class="method-icon">💬</div>
              <div class="method-info">
                <h4>{{ $t('info.contact.chat') }}</h4>
                <p>{{ $t('info.contact.chatHours') }}</p>
              </div>
            </div>
            <div class="contact-method">
              <div class="method-icon">📱</div>
              <div class="method-info">
                <h4>{{ $t('info.contact.telegram') }}</h4>
                <p>@GLI_Support</p>
              </div>
            </div>
          </div>
          
          <!-- 연락 폼 -->
          <div class="contact-form">
            <h4>{{ $t('info.contact.form.title') }}</h4>
            <form @submit.prevent="submitContactForm">
              <div class="form-group">
                <label>{{ $t('info.contact.form.name') }}</label>
                <input v-model="contactForm.name" type="text" required />
              </div>
              <div class="form-group">
                <label>{{ $t('info.contact.form.email') }}</label>
                <input v-model="contactForm.email" type="email" required />
              </div>
              <div class="form-group">
                <label>{{ $t('info.contact.form.subject') }}</label>
                <select v-model="contactForm.subject" required>
                  <option value="">{{ $t('info.contact.form.selectSubject') }}</option>
                  <option value="technical">{{ $t('info.contact.form.subjects.technical') }}</option>
                  <option value="account">{{ $t('info.contact.form.subjects.account') }}</option>
                  <option value="billing">{{ $t('info.contact.form.subjects.billing') }}</option>
                  <option value="general">{{ $t('info.contact.form.subjects.general') }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ $t('info.contact.form.message') }}</label>
                <textarea v-model="contactForm.message" rows="5" required></textarea>
              </div>
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                {{ isSubmitting ? $t('info.contact.form.sending') : $t('info.contact.form.send') }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 가이드 모달 -->
    <div v-if="selectedGuide" class="guide-modal-overlay" @click="closeGuide">
      <div class="guide-modal" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ $t(selectedGuide.title) }}</h3>
          <button class="close-btn" @click="closeGuide">✕</button>
        </div>
        <div class="modal-body">
          <div class="guide-steps">
            <div
              v-for="(step, index) in selectedGuide.stepDetails"
              :key="index"
              class="guide-step"
              :class="{ active: currentStep === index }"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <h4>{{ $t(step.title) }}</h4>
                <p>{{ $t(step.description) }}</p>
                <div v-if="step.image" class="step-image">
                  <img :src="step.image" :alt="$t(step.title)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="step-btn"
            :disabled="currentStep === 0"
            @click="currentStep--"
          >
            {{ $t('common.previous') }}
          </button>
          <span class="step-indicator">
            {{ currentStep + 1 }} / {{ selectedGuide.stepDetails.length }}
          </span>
          <button
            class="step-btn"
            :disabled="currentStep === selectedGuide.stepDetails.length - 1"
            @click="currentStep++"
          >
            {{ $t('common.next') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 상태 관리
const searchQuery = ref('')
const selectedCategory = ref('all')
const expandedFAQ = ref<number | null>(null)
const selectedGuide = ref<any>(null)
const currentStep = ref(0)
const isSubmitting = ref(false)

// 연락 폼
const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

// 빠른 링크 데이터
const quickLinks = [
  {
    id: 1,
    icon: '❓',
    title: 'info.quickLinks.faq',
    description: 'info.quickLinks.faqDesc',
    target: 'faq-section'
  },
  {
    id: 2,
    icon: '📖',
    title: 'info.quickLinks.guides',
    description: 'info.quickLinks.guidesDesc',
    target: 'guides-section'
  },
  {
    id: 3,
    icon: '📁',
    title: 'info.quickLinks.resources',
    description: 'info.quickLinks.resourcesDesc',
    target: 'resources-section'
  },
  {
    id: 4,
    icon: '📞',
    title: 'info.quickLinks.contact',
    description: 'info.quickLinks.contactDesc',
    target: 'contact-section'
  }
]

// FAQ 카테고리
const faqCategories = [
  { id: 'all', name: 'info.faq.categories.all', icon: '📋' },
  { id: 'getting-started', name: 'info.faq.categories.gettingStarted', icon: '🚀' },
  { id: 'wallet', name: 'info.faq.categories.wallet', icon: '💰' },
  { id: 'tokens', name: 'info.faq.categories.tokens', icon: '🪙' },
  { id: 'shopping', name: 'info.faq.categories.shopping', icon: '🛍️' },
  { id: 'technical', name: 'info.faq.categories.technical', icon: '⚙️' }
]

// FAQ 데이터
const faqData = [
  {
    id: 1,
    category: 'getting-started',
    question: 'info.faq.items.howToStart.question',
    answer: 'info.faq.items.howToStart.answer'
  },
  {
    id: 2,
    category: 'wallet',
    question: 'info.faq.items.connectWallet.question',
    answer: 'info.faq.items.connectWallet.answer'
  },
  {
    id: 3,
    category: 'tokens',
    question: 'info.faq.items.tokenTypes.question',
    answer: 'info.faq.items.tokenTypes.answer'
  },
  {
    id: 4,
    category: 'shopping',
    question: 'info.faq.items.resortBooking.question',
    answer: 'info.faq.items.resortBooking.answer'
  },
  {
    id: 5,
    category: 'technical',
    question: 'info.faq.items.networkIssues.question',
    answer: 'info.faq.items.networkIssues.answer'
  },
  {
    id: 6,
    category: 'getting-started',
    question: 'info.faq.items.accountSetup.question',
    answer: 'info.faq.items.accountSetup.answer'
  }
]

// 사용자 가이드 데이터
const userGuides = [
  {
    id: 1,
    icon: '🚀',
    title: 'info.guides.items.gettingStarted.title',
    description: 'info.guides.items.gettingStarted.description',
    difficulty: 'beginner',
    duration: '5 min',
    steps: 4,
    stepDetails: [
      {
        title: 'info.guides.items.gettingStarted.steps.1.title',
        description: 'info.guides.items.gettingStarted.steps.1.description'
      },
      {
        title: 'info.guides.items.gettingStarted.steps.2.title',
        description: 'info.guides.items.gettingStarted.steps.2.description'
      },
      {
        title: 'info.guides.items.gettingStarted.steps.3.title',
        description: 'info.guides.items.gettingStarted.steps.3.description'
      },
      {
        title: 'info.guides.items.gettingStarted.steps.4.title',
        description: 'info.guides.items.gettingStarted.steps.4.description'
      }
    ]
  },
  {
    id: 2,
    icon: '💰',
    title: 'info.guides.items.walletSetup.title',
    description: 'info.guides.items.walletSetup.description',
    difficulty: 'intermediate',
    duration: '10 min',
    steps: 6,
    stepDetails: [
      {
        title: 'info.guides.items.walletSetup.steps.1.title',
        description: 'info.guides.items.walletSetup.steps.1.description'
      },
      {
        title: 'info.guides.items.walletSetup.steps.2.title',
        description: 'info.guides.items.walletSetup.steps.2.description'
      }
    ]
  },
  {
    id: 3,
    icon: '🔄',
    title: 'info.guides.items.tokenConversion.title',
    description: 'info.guides.items.tokenConversion.description',
    difficulty: 'advanced',
    duration: '15 min',
    steps: 8,
    stepDetails: [
      {
        title: 'info.guides.items.tokenConversion.steps.1.title',
        description: 'info.guides.items.tokenConversion.steps.1.description'
      }
    ]
  }
]

// 다운로드 리소스 데이터
const downloadResources = [
  {
    id: 1,
    icon: '📄',
    title: 'info.resources.items.whitepaper.title',
    description: 'info.resources.items.whitepaper.description',
    type: 'PDF',
    size: '2.5 MB',
    url: '/downloads/gli-whitepaper.pdf'
  },
  {
    id: 2,
    icon: '📊',
    title: 'info.resources.items.tokenomics.title',
    description: 'info.resources.items.tokenomics.description',
    type: 'PDF',
    size: '1.8 MB',
    url: '/downloads/gli-tokenomics.pdf'
  },
  {
    id: 3,
    icon: '🔧',
    title: 'info.resources.items.apiDocs.title',
    description: 'info.resources.items.apiDocs.description',
    type: 'HTML',
    size: '0.5 MB',
    url: '/downloads/api-documentation.html'
  }
]

// 계산된 속성
const filteredFAQs = computed(() => {
  let filtered = faqData

  // 카테고리 필터링
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(faq => faq.category === selectedCategory.value)
  }

  // 검색 필터링
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(faq => 
      t(faq.question).toLowerCase().includes(query) ||
      t(faq.answer).toLowerCase().includes(query)
    )
  }

  return filtered
})

// 메서드
const filterContent = () => {
  // 검색 시 실시간 필터링 (computed에서 처리됨)
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const toggleFAQ = (faqId: number) => {
  expandedFAQ.value = expandedFAQ.value === faqId ? null : faqId
}

const openGuide = (guide: any) => {
  selectedGuide.value = guide
  currentStep.value = 0
}

const closeGuide = () => {
  selectedGuide.value = null
  currentStep.value = 0
}

const downloadResource = (resource: any) => {
  // 실제 다운로드 로직 (모의)
  console.log('Downloading:', resource.title)
  
  // 임시 링크 생성하여 다운로드 시뮬레이션
  const link = document.createElement('a')
  link.href = resource.url
  link.download = resource.title
  link.click()
  
  showNotification(t('info.resources.downloadStarted'), 'success')
}

const submitContactForm = async () => {
  isSubmitting.value = true
  
  try {
    // 모의 폼 제출
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    showNotification(t('info.contact.form.success'), 'success')
    
    // 폼 리셋
    contactForm.value = {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  } catch (error) {
    showNotification(t('info.contact.form.error'), 'error')
  } finally {
    isSubmitting.value = false
  }
}

const showNotification = (message: string, type: string) => {
  // 간단한 알림 (실제로는 Toast 컴포넌트 사용)
  console.log(`${type.toUpperCase()}: ${message}`)
}

onMounted(() => {
  // 초기화 로직
})
</script>

<style scoped>
.information-center {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 헤더 섹션 */
.info-header {
  background: var(--gradient-primary);
  color: white;
  padding: 3rem 0;
  border-radius: 0 0 2rem 2rem;
  box-shadow: var(--shadow-lg);
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.header-main {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-icon {
  font-size: 3rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.search-section {
  flex: 0 0 400px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: none;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
}

/* 컨텐츠 영역 */
.info-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.card-header {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.8rem;
}

.section-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 빠른 링크 */
.quick-links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.quick-link-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-link-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
  border-color: var(--gli-blue);
}

.link-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.link-content {
  flex: 1;
}

.link-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.link-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* FAQ 섹션 */
.faq-categories {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.category-btn:hover {
  border-color: var(--gli-blue);
}

.category-btn.active {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: var(--gli-blue);
}

.faq-item.active {
  border-color: var(--gli-blue);
  box-shadow: var(--shadow);
}

.faq-question {
  padding: 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-tertiary);
}

.faq-question h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.toggle-icon {
  font-size: 1.5rem;
  color: var(--gli-blue);
  font-weight: bold;
}

.faq-answer {
  padding: 1.5rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-light);
  color: var(--text-primary);
  line-height: 1.6;
}

/* 가이드 섹션 */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.guide-card {
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-tertiary);
}

.guide-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
  border-color: var(--gli-blue);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.guide-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  border-radius: 50%;
}

.guide-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.guide-badge.beginner {
  background: var(--gli-green);
  color: white;
}

.guide-badge.intermediate {
  background: var(--gli-gold);
  color: var(--gli-gray-dark);
}

.guide-badge.advanced {
  background: var(--gli-red);
  color: white;
}

.guide-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.guide-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.guide-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* 리소스 섹션 */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  background: var(--bg-tertiary);
  transition: all 0.3s ease;
}

.resource-item:hover {
  border-color: var(--gli-blue);
  box-shadow: var(--shadow);
}

.resource-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-gold);
  border-radius: 0.5rem;
  flex-shrink: 0;
}

.resource-info {
  flex: 1;
}

.resource-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.resource-description {
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.resource-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.download-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

/* 연락처 섹션 */
.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.contact-method {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.method-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-primary);
  border-radius: 50%;
  flex-shrink: 0;
}

.method-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.method-info p {
  color: var(--text-secondary);
}

.contact-form {
  background: var(--bg-tertiary);
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.contact-form h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.submit-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 가이드 모달 */
.guide-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.guide-modal {
  background: var(--bg-primary);
  border-radius: 1rem;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: var(--bg-secondary);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.guide-step {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  opacity: 0.5;
  transition: all 0.3s ease;
}

.guide-step.active {
  opacity: 1;
  border-color: var(--gli-blue);
  background: var(--bg-tertiary);
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.step-content p {
  color: var(--text-secondary);
  line-height: 1.5;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-indicator {
  font-weight: 600;
  color: var(--text-primary);
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-help {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

/* 반응형 */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .search-section {
    flex: none;
    width: 100%;
    max-width: 400px;
  }
  
  .contact-content {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .info-header {
    padding: 2rem 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .quick-links-grid {
    grid-template-columns: 1fr;
  }
  
  .guides-grid {
    grid-template-columns: 1fr;
  }
  
  .faq-categories {
    justify-content: center;
  }
  
  .guide-modal {
    margin: 1rem;
    max-height: calc(100vh - 2rem);
  }
  
  .guide-step {
    flex-direction: column;
    text-align: center;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>