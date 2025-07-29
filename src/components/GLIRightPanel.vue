<template>
  <aside class="gli-right-panel" :class="{ 'collapsed': isCollapsed, 'visible': isVisible }">
    <!-- 패널 토글 버튼 -->
    <div class="panel-toggle">
      <button class="toggle-btn" @click="togglePanel">
        <span v-if="isCollapsed">📋</span>
        <span v-else>📋</span>
      </button>
    </div>

    <!-- 패널 콘텐츠 -->
    <div class="panel-content" v-if="!isCollapsed">
      <!-- 패널 헤더 -->
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="title-emoji">💡</span>
          {{ $t('rightPanel.help') }}
        </h3>
        <button class="close-btn" @click="collapsePanel">
          <span class="close-icon">×</span>
        </button>
      </div>

      <!-- 탭 네비게이션 -->
      <div class="panel-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ $t(`rightPanel.tabs.${tab.id}`) }}</span>
        </button>
      </div>

      <!-- 도움말 콘텐츠 -->
      <div v-show="activeTab === 'help'" class="tab-content">
        <div class="help-content">
          <div class="current-page-help">
            <h4 class="help-section-title">
              <span class="section-emoji">🎯</span>
              {{ $t('rightPanel.currentPageHelp') }}
            </h4>
            <div class="help-card">
              <div class="help-icon">{{ getCurrentPageIcon() }}</div>
              <div class="help-text">
                <h5>{{ getCurrentPageTitle() }}</h5>
                <p>{{ getCurrentPageDescription() }}</p>
              </div>
            </div>
            <div class="help-steps" v-if="getCurrentPageSteps().length > 0">
              <h5 class="steps-title">{{ $t('rightPanel.quickSteps') }}</h5>
              <ol class="steps-list">
                <li v-for="(step, index) in getCurrentPageSteps()" :key="index" class="step-item">
                  {{ step }}
                </li>
              </ol>
            </div>
          </div>

          <div class="common-help">
            <h4 class="help-section-title">
              <span class="section-emoji">📚</span>
              {{ $t('rightPanel.commonHelp') }}
            </h4>
            <div class="help-topics">
              <div 
                v-for="topic in helpTopics" 
                :key="topic.id"
                class="help-topic"
                @click="expandTopic(topic.id)"
              >
                <div class="topic-header">
                  <span class="topic-icon">{{ topic.icon }}</span>
                  <span class="topic-title">{{ $t(`rightPanel.topics.${topic.id}.title`) }}</span>
                  <span class="expand-icon">{{ expandedTopics.includes(topic.id) ? '▼' : '▶' }}</span>
                </div>
                <div v-if="expandedTopics.includes(topic.id)" class="topic-content">
                  <p>{{ $t(`rightPanel.topics.${topic.id}.content`) }}</p>
                  <div v-if="topic.links" class="topic-links">
                    <a 
                      v-for="link in topic.links" 
                      :key="link.id"
                      :href="link.url"
                      class="topic-link"
                      target="_blank"
                    >
                      {{ $t(`rightPanel.topics.${topic.id}.links.${link.id}`) }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 툴팁 가이드 -->
      <div v-show="activeTab === 'guide'" class="tab-content">
        <div class="guide-content">
          <div class="guide-header">
            <h4 class="guide-title">
              <span class="guide-emoji">🗺️</span>
              {{ $t('rightPanel.interactiveGuide') }}
            </h4>
            <div class="guide-controls">
              <button 
                class="guide-btn"
                :class="{ active: isGuideMode }"
                @click="toggleGuideMode"
              >
                <span class="guide-icon">{{ isGuideMode ? '🛑' : '▶️' }}</span>
                {{ isGuideMode ? $t('rightPanel.stopGuide') : $t('rightPanel.startGuide') }}
              </button>
            </div>
          </div>
          
          <div class="guide-sections">
            <div 
              v-for="section in guideSections" 
              :key="section.id"
              class="guide-section"
              @click="startSectionGuide(section.id)"
            >
              <div class="section-icon">{{ section.icon }}</div>
              <div class="section-info">
                <h5 class="section-name">{{ $t(`rightPanel.guides.${section.id}.title`) }}</h5>
                <p class="section-desc">{{ $t(`rightPanel.guides.${section.id}.description`) }}</p>
                <div class="section-meta">
                  <span class="step-count">{{ section.steps }} {{ $t('rightPanel.steps') }}</span>
                  <span class="duration">~{{ section.duration }}{{ $t('rightPanel.minutes') }}</span>
                </div>
              </div>
              <div class="section-action">
                <span class="action-icon">▶️</span>
              </div>
            </div>
          </div>

          <div v-if="isGuideMode" class="active-guide">
            <div class="guide-progress">
              <div class="progress-header">
                <span class="progress-title">{{ currentGuide?.title }}</span>
                <span class="progress-indicator">{{ currentGuideStep }}/{{ currentGuide?.totalSteps }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${(currentGuideStep / currentGuide?.totalSteps) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="guide-step-content">
              <h5 class="step-title">{{ currentGuide?.currentStepTitle }}</h5>
              <p class="step-description">{{ currentGuide?.currentStepDescription }}</p>
              <div class="step-actions">
                <button class="step-btn prev" @click="previousGuideStep" :disabled="currentGuideStep === 1">
                  {{ $t('rightPanel.previous') }}
                </button>
                <button class="step-btn next" @click="nextGuideStep" :disabled="currentGuideStep === currentGuide?.totalSteps">
                  {{ $t('rightPanel.next') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 고객 지원 채팅 -->
      <div v-show="activeTab === 'chat'" class="tab-content">
        <div class="chat-content">
          <div class="chat-header">
            <div class="chat-status">
              <span class="status-indicator" :class="{ online: isChatOnline }"></span>
              <span class="status-text">
                {{ isChatOnline ? $t('rightPanel.supportOnline') : $t('rightPanel.supportOffline') }}
              </span>
            </div>
            <div class="chat-info">
              <span class="response-time">{{ $t('rightPanel.avgResponseTime') }}: ~{{ avgResponseTime }}{{ $t('rightPanel.minutes') }}</span>
            </div>
          </div>

          <div class="chat-messages" ref="chatMessages">
            <div v-if="chatMessages.length === 0" class="chat-welcome">
              <div class="welcome-icon">👋</div>
              <h4 class="welcome-title">{{ $t('rightPanel.chatWelcome') }}</h4>
              <p class="welcome-text">{{ $t('rightPanel.chatWelcomeText') }}</p>
              <div class="quick-questions">
                <h5 class="quick-title">{{ $t('rightPanel.quickQuestions') }}</h5>
                <div class="question-buttons">
                  <button 
                    v-for="question in quickQuestions" 
                    :key="question.id"
                    class="question-btn"
                    @click="sendQuickQuestion(question.text)"
                  >
                    {{ $t(`rightPanel.quickQuestions.${question.id}`) }}
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else>
              <div 
                v-for="message in chatMessages" 
                :key="message.id"
                class="chat-message"
                :class="{ 'user': message.sender === 'user', 'support': message.sender === 'support' }"
              >
                <div class="message-avatar">
                  <span v-if="message.sender === 'user'">👤</span>
                  <span v-else>🎧</span>
                </div>
                <div class="message-content">
                  <div class="message-text">{{ message.text }}</div>
                  <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
                </div>
              </div>
              
              <div v-if="isTyping" class="typing-indicator">
                <div class="typing-avatar">🎧</div>
                <div class="typing-content">
                  <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <div class="chat-input-container">
              <input 
                v-model="newMessage"
                type="text"
                class="chat-input"
                :placeholder="$t('rightPanel.typeMessage')"
                @keyup.enter="sendMessage"
                :disabled="!isChatOnline"
              >
              <button 
                class="send-btn"
                @click="sendMessage"
                :disabled="!newMessage.trim() || !isChatOnline"
              >
                <span class="send-icon">📤</span>
              </button>
            </div>
            <div class="chat-footer">
              <div class="file-upload">
                <button class="upload-btn" @click="$refs.fileInput.click()">
                  <span class="upload-icon">📎</span>
                  {{ $t('rightPanel.attachFile') }}
                </button>
                <input 
                  ref="fileInput" 
                  type="file" 
                  hidden 
                  @change="handleFileUpload"
                  accept="image/*,.pdf,.doc,.docx"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 가이드 오버레이 -->
    <div v-if="showGuideOverlay" class="guide-overlay" @click="closeGuideOverlay">
      <div class="guide-tooltip" :style="tooltipPosition">
        <div class="tooltip-content">
          <div class="tooltip-header">
            <span class="tooltip-step">{{ $t('rightPanel.step') }} {{ currentGuideStep }}</span>
            <button class="tooltip-close" @click="closeGuideOverlay">×</button>
          </div>
          <div class="tooltip-body">
            <h5 class="tooltip-title">{{ currentTooltip?.title }}</h5>
            <p class="tooltip-description">{{ currentTooltip?.description }}</p>
          </div>
          <div class="tooltip-footer">
            <button class="tooltip-btn skip" @click="skipGuide">{{ $t('rightPanel.skip') }}</button>
            <div class="tooltip-navigation">
              <button class="tooltip-btn prev" @click="previousGuideStep" :disabled="currentGuideStep === 1">
                {{ $t('rightPanel.previous') }}
              </button>
              <button class="tooltip-btn next" @click="nextGuideStep">
                {{ currentGuideStep === currentGuide?.totalSteps ? $t('rightPanel.finish') : $t('rightPanel.next') }}
              </button>
            </div>
          </div>
        </div>
        <div class="tooltip-arrow"></div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const route = useRoute()
const { t } = useI18n()

// 패널 상태
const isCollapsed = ref(true)
const isVisible = ref(true)
const activeTab = ref('help')

// 가이드 상태
const isGuideMode = ref(false)
const showGuideOverlay = ref(false)
const currentGuideStep = ref(1)
const currentGuide = ref(null)
const currentTooltip = ref(null)
const tooltipPosition = ref({ top: '50%', left: '50%' })

// 채팅 상태
const isChatOnline = ref(true)
const avgResponseTime = ref(2)
const chatMessages = ref([])
const newMessage = ref('')
const isTyping = ref(false)

// 도움말 상태
const expandedTopics = ref([])

// 탭 정의
const tabs = [
  { id: 'help', icon: '❓', label: 'Help' },
  { id: 'guide', icon: '🗺️', label: 'Guide' },
  { id: 'chat', icon: '💬', label: 'Chat' }
]

// 도움말 주제
const helpTopics = [
  {
    id: 'wallet',
    icon: '💳',
    links: [
      { id: 'metamask', url: 'https://metamask.io/download.html' },
      { id: 'walletconnect', url: 'https://walletconnect.com/' }
    ]
  },
  {
    id: 'tokens',
    icon: '🪙',
    links: [
      { id: 'tokenomics', url: '#' },
      { id: 'whitepaper', url: '#' }
    ]
  },
  {
    id: 'conversion',
    icon: '💱'
  },
  {
    id: 'security',
    icon: '🔒'
  }
]

// 가이드 섹션
const guideSections = [
  { id: 'wallet', icon: '💳', steps: 5, duration: 3 },
  { id: 'conversion', icon: '💱', steps: 7, duration: 5 },
  { id: 'staking', icon: '🏦', steps: 6, duration: 4 },
  { id: 'referral', icon: '🤝', steps: 4, duration: 2 }
]

// 자주 묻는 질문
const quickQuestions = [
  { id: 'wallet', text: 'How to connect wallet?' },
  { id: 'conversion', text: 'How to convert tokens?' },
  { id: 'fees', text: 'What are the fees?' },
  { id: 'support', text: 'Contact support' }
]

// 메서드
const togglePanel = () => {
  isCollapsed.value = !isCollapsed.value
}

const collapsePanel = () => {
  isCollapsed.value = true
}

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const getCurrentPageIcon = () => {
  const pageIcons = {
    '/': '🏠',
    '/business': '📄',
    '/auth': '🔐',
    '/conversion': '💱',
    '/mypage': '🧑',
    '/shopping': '🛍️'
  }
  return pageIcons[route.path] || '📄'
}

const getCurrentPageTitle = () => {
  const pageTitles = {
    '/': 'rightPanel.pages.home.title',
    '/business': 'rightPanel.pages.business.title',
    '/auth': 'rightPanel.pages.auth.title',
    '/conversion': 'rightPanel.pages.conversion.title',
    '/mypage': 'rightPanel.pages.mypage.title',
    '/shopping': 'rightPanel.pages.shopping.title'
  }
  return t(pageTitles[route.path] || 'rightPanel.pages.default.title')
}

const getCurrentPageDescription = () => {
  const pageDescriptions = {
    '/': 'rightPanel.pages.home.description',
    '/business': 'rightPanel.pages.business.description',
    '/auth': 'rightPanel.pages.auth.description',
    '/conversion': 'rightPanel.pages.conversion.description',
    '/mypage': 'rightPanel.pages.mypage.description',
    '/shopping': 'rightPanel.pages.shopping.description'
  }
  return t(pageDescriptions[route.path] || 'rightPanel.pages.default.description')
}

const getCurrentPageSteps = () => {
  const pageSteps = {
    '/auth': [
      t('rightPanel.pages.auth.steps.1'),
      t('rightPanel.pages.auth.steps.2'),
      t('rightPanel.pages.auth.steps.3')
    ],
    '/conversion': [
      t('rightPanel.pages.conversion.steps.1'),
      t('rightPanel.pages.conversion.steps.2'),
      t('rightPanel.pages.conversion.steps.3'),
      t('rightPanel.pages.conversion.steps.4')
    ],
    '/mypage': [
      t('rightPanel.pages.mypage.steps.1'),
      t('rightPanel.pages.mypage.steps.2')
    ]
  }
  return pageSteps[route.path] || []
}

const expandTopic = (topicId: string) => {
  const index = expandedTopics.value.indexOf(topicId)
  if (index > -1) {
    expandedTopics.value.splice(index, 1)
  } else {
    expandedTopics.value.push(topicId)
  }
}

const toggleGuideMode = () => {
  isGuideMode.value = !isGuideMode.value
  if (!isGuideMode.value) {
    showGuideOverlay.value = false
    currentGuide.value = null
  }
}

const startSectionGuide = (sectionId: string) => {
  const section = guideSections.find(s => s.id === sectionId)
  if (section) {
    currentGuide.value = {
      id: sectionId,
      title: t(`rightPanel.guides.${sectionId}.title`),
      totalSteps: section.steps
    }
    currentGuideStep.value = 1
    isGuideMode.value = true
    showGuide()
  }
}

const showGuide = () => {
  showGuideOverlay.value = true
  updateTooltipContent()
}

const updateTooltipContent = () => {
  if (currentGuide.value) {
    currentTooltip.value = {
      title: t(`rightPanel.guides.${currentGuide.value.id}.steps.${currentGuideStep.value}.title`),
      description: t(`rightPanel.guides.${currentGuide.value.id}.steps.${currentGuideStep.value}.description`)
    }
  }
}

const nextGuideStep = () => {
  if (currentGuide.value && currentGuideStep.value < currentGuide.value.totalSteps) {
    currentGuideStep.value++
    updateTooltipContent()
  } else {
    finishGuide()
  }
}

const previousGuideStep = () => {
  if (currentGuideStep.value > 1) {
    currentGuideStep.value--
    updateTooltipContent()
  }
}

const finishGuide = () => {
  isGuideMode.value = false
  showGuideOverlay.value = false
  currentGuide.value = null
  currentGuideStep.value = 1
}

const skipGuide = () => {
  finishGuide()
}

const closeGuideOverlay = () => {
  showGuideOverlay.value = false
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !isChatOnline.value) return
  
  const message = {
    id: Date.now(),
    text: newMessage.value.trim(),
    sender: 'user',
    timestamp: new Date()
  }
  
  chatMessages.value.push(message)
  newMessage.value = ''
  
  // 스크롤을 맨 아래로
  nextTick(() => {
    scrollToBottom()
  })
  
  // 자동 응답 시뮬레이션
  simulateResponse(message.text)
}

const sendQuickQuestion = (questionText: string) => {
  newMessage.value = questionText
  sendMessage()
}

const simulateResponse = (userMessage: string) => {
  isTyping.value = true
  
  setTimeout(() => {
    isTyping.value = false
    
    const responses = {
      'How to connect wallet?': t('rightPanel.chatResponses.wallet'),
      'How to convert tokens?': t('rightPanel.chatResponses.conversion'),
      'What are the fees?': t('rightPanel.chatResponses.fees'),
      'Contact support': t('rightPanel.chatResponses.support')
    }
    
    const response = {
      id: Date.now(),
      text: responses[userMessage] || t('rightPanel.chatResponses.default'),
      sender: 'support',
      timestamp: new Date()
    }
    
    chatMessages.value.push(response)
    
    nextTick(() => {
      scrollToBottom()
    })
  }, 1500)
}

const scrollToBottom = () => {
  const messagesEl = document.querySelector('.chat-messages')
  if (messagesEl) {
    messagesEl.scrollTop = messagesEl.scrollHeight
  }
}

const formatMessageTime = (timestamp: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(timestamp)
}

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    // 파일 업로드 처리 (실제 구현에서)
    console.log('File uploaded:', file.name)
  }
}

// 라우트 변경 시 패널 업데이트
watch(() => route.path, () => {
  // 새 페이지로 이동 시 도움말 내용 업데이트
  expandedTopics.value = []
})

onMounted(() => {
  // 화면 크기에 따라 초기 상태 설정
  if (window.innerWidth < 1200) {
    isCollapsed.value = true
  }
})
</script>

<style scoped>
.gli-right-panel {
  position: fixed;
  top: 80px; /* 헤더 높이 */
  right: 0;
  width: 380px;
  height: calc(100vh - 80px);
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.gli-right-panel.visible:not(.collapsed) {
  transform: translateX(0);
}

.panel-toggle {
  position: absolute;
  left: -50px;
  top: 20px;
  z-index: 101;
}

.toggle-btn {
  width: 50px;
  height: 50px;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 25px 0 0 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.toggle-btn:hover {
  filter: brightness(1.1);
  transform: translateX(-5px);
  box-shadow: -8px 4px 20px rgba(30, 64, 175, 0.3);
}

.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-emoji {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--gli-orange);
  color: white;
}

.panel-tabs {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover,
.tab-btn.active {
  color: var(--gli-blue);
  border-bottom-color: var(--gli-blue);
  background: var(--bg-primary);
}

.tab-icon {
  font-size: 1rem;
}

.tab-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* 도움말 콘텐츠 */
.help-content {
  padding: 1.5rem;
}

.help-section-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-emoji {
  font-size: 1.3rem;
  margin-right: 0.5rem;
}

.current-page-help {
  margin-bottom: 2rem;
}

.help-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-bottom: 1rem;
}

.help-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.help-text h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.help-text p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.help-steps {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
}

.steps-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.steps-list {
  padding-left: 1.2rem;
  margin: 0;
}

.step-item {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.help-topics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.help-topic {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.help-topic:hover {
  border-color: var(--gli-blue);
}

.topic-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
}

.topic-icon {
  font-size: 1.2rem;
  margin-right: 0.75rem;
}

.topic-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.expand-icon {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.topic-content {
  padding: 1rem;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.topic-content p {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 1rem;
}

.topic-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.topic-link {
  color: var(--gli-blue);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.topic-link:hover {
  color: var(--gli-purple);
  text-decoration: underline;
}

/* 가이드 콘텐츠 */
.guide-content {
  padding: 1.5rem;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.guide-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.guide-emoji {
  font-size: 1.3rem;
  margin-right: 0.5rem;
}

.guide-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.guide-btn:hover {
  background: var(--gli-purple);
}

.guide-btn.active {
  background: var(--gli-orange);
}

.guide-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.guide-section {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.guide-section:hover {
  border-color: var(--gli-blue);
  transform: translateY(-2px);
}

.section-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.section-info {
  flex: 1;
}

.section-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.section-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.section-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.section-action {
  display: flex;
  align-items: center;
}

.action-icon {
  font-size: 1.2rem;
  color: var(--gli-blue);
}

.active-guide {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
  border: 2px solid var(--gli-blue);
}

.guide-progress {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-title {
  font-weight: 600;
  color: var(--text-primary);
}

.progress-indicator {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.progress-bar {
  height: 6px;
  background: var(--bg-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  transition: width 0.3s ease;
}

.guide-step-content h5 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.step-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 1.5rem;
}

.step-actions {
  display: flex;
  gap: 1rem;
}

.step-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step-btn.prev {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.step-btn.next {
  background: var(--gli-blue);
  color: white;
}

.step-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 채팅 콘텐츠 */
.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.chat-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-secondary);
}

.status-indicator.online {
  background: var(--gli-green);
}

.status-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}

.chat-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-welcome {
  text-align: center;
  padding: 2rem 1rem;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.welcome-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.welcome-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.4;
}

.quick-questions {
  text-align: left;
}

.quick-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.question-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.question-btn {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.question-btn:hover {
  border-color: var(--gli-blue);
  background: var(--bg-primary);
}

.chat-message {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.chat-message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.chat-message.user .message-avatar {
  background: var(--gli-blue);
  color: white;
}

.chat-message.support .message-avatar {
  background: var(--gli-green);
  color: white;
}

.message-content {
  max-width: 70%;
}

.chat-message.user .message-content {
  text-align: right;
}

.message-text {
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.4;
}

.chat-message.user .message-text {
  background: var(--gli-blue);
  color: white;
}

.message-time {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.typing-indicator {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.typing-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gli-green);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.typing-content {
  background: var(--bg-secondary);
  padding: 0.75rem 1rem;
  border-radius: 12px;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-secondary);
  animation: typing 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-input-area {
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  padding: 1rem;
}

.chat-input-container {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.chat-input:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gli-blue);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: var(--gli-purple);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-footer {
  display: flex;
  justify-content: center;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.upload-btn:hover {
  border-color: var(--gli-blue);
  color: var(--gli-blue);
}

/* 가이드 오버레이 */
.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-tooltip {
  position: relative;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
}

.tooltip-content {
  padding: 2rem;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tooltip-step {
  font-size: 0.8rem;
  color: var(--gli-blue);
  font-weight: 600;
  text-transform: uppercase;
}

.tooltip-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
}

.tooltip-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.tooltip-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 2rem;
}

.tooltip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tooltip-navigation {
  display: flex;
  gap: 0.5rem;
}

.tooltip-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.tooltip-btn.skip {
  background: transparent;
  color: var(--text-secondary);
}

.tooltip-btn.prev {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.tooltip-btn.next {
  background: var(--gli-blue);
  color: white;
}

.tooltip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tooltip-arrow {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--bg-primary);
}

/* 애니메이션 */
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* 반응형 */
@media (max-width: 768px) {
  .gli-right-panel {
    width: 100%;
    transform: translateX(100%);
  }
  
  .panel-toggle {
    left: -60px;
  }
  
  .toggle-btn {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>