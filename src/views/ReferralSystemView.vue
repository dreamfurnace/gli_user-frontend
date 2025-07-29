<template>
  <div class="referral-system">
    <!-- 헤더 섹션 -->
    <div class="referral-header">
      <div class="header-content">
        <div class="header-main">
          <h1 class="page-title">
            <span class="title-icon">🤝</span>
            {{ $t('referral.title') }}
          </h1>
          <p class="page-subtitle">{{ $t('referral.subtitle') }}</p>
        </div>
        
        <!-- 통계 요약 -->
        <div class="stats-summary">
          <div class="stat-card">
            <div class="stat-value">{{ referralStats.totalInvited }}</div>
            <div class="stat-label">{{ $t('referral.totalInvited') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ referralStats.activeReferrals }}</div>
            <div class="stat-label">{{ $t('referral.activeReferrals') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ formatGLI(referralStats.totalRewards) }}</div>
            <div class="stat-label">{{ $t('referral.totalRewards') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="referral-content">
      <!-- 추천인 코드 섹션 -->
      <div class="section-card main-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">🎯</span>
            {{ $t('referral.myReferralCode') }}
          </h2>
          <p class="section-description">{{ $t('referral.codeDescription') }}</p>
        </div>
        
        <div class="code-section">
          <div class="code-display">
            <div class="code-box">
              <span class="code-text">{{ userReferralCode }}</span>
              <button 
                class="copy-btn primary" 
                @click="copyToClipboard(userReferralCode, 'code')"
                :class="{ copied: copiedStates.code }"
              >
                <span class="btn-icon">{{ copiedStates.code ? '✅' : '📋' }}</span>
                {{ copiedStates.code ? $t('common.copied') : $t('common.copy') }}
              </button>
            </div>
          </div>
          
          <div class="link-display">
            <label class="input-label">{{ $t('referral.referralLink') }}</label>
            <div class="link-box">
              <input 
                :value="referralUrl" 
                readonly 
                class="link-input"
                @click="selectAll"
                ref="linkInput"
              >
              <button 
                class="copy-btn secondary" 
                @click="copyToClipboard(referralUrl, 'link')"
                :class="{ copied: copiedStates.link }"
              >
                <span class="btn-icon">{{ copiedStates.link ? '✅' : '🔗' }}</span>
                {{ copiedStates.link ? $t('common.copied') : $t('referral.copyLink') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 커스텀 링크 생성기 -->
      <div class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">🔧</span>
            {{ $t('referral.customLinkGenerator') }}
          </h2>
          <p class="section-description">{{ $t('referral.customLinkDescription') }}</p>
        </div>
        
        <div class="custom-link-form">
          <div class="form-group">
            <label class="input-label">{{ $t('referral.campaignName') }}</label>
            <input 
              v-model="customLink.campaign"
              type="text" 
              class="form-input"
              :placeholder="$t('referral.campaignPlaceholder')"
              @input="generateCustomLink"
            >
          </div>
          
          <div class="form-group">
            <label class="input-label">{{ $t('referral.medium') }}</label>
            <select v-model="customLink.medium" class="form-select" @change="generateCustomLink">
              <option value="">{{ $t('referral.selectMedium') }}</option>
              <option value="social">{{ $t('referral.social') }}</option>
              <option value="email">{{ $t('referral.email') }}</option>
              <option value="website">{{ $t('referral.website') }}</option>
              <option value="qr">{{ $t('referral.qr') }}</option>
            </select>
          </div>
          
          <div v-if="customLinkUrl" class="generated-link">
            <label class="input-label">{{ $t('referral.generatedLink') }}</label>
            <div class="link-box">
              <input 
                :value="customLinkUrl" 
                readonly 
                class="link-input"
                @click="selectAll"
              >
              <button 
                class="copy-btn secondary" 
                @click="copyToClipboard(customLinkUrl, 'custom')"
                :class="{ copied: copiedStates.custom }"
              >
                <span class="btn-icon">{{ copiedStates.custom ? '✅' : '🔗' }}</span>
                {{ copiedStates.custom ? $t('common.copied') : $t('common.copy') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 소셜 미디어 공유 -->
      <div class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">📱</span>
            {{ $t('referral.socialSharing') }}
          </h2>
          <p class="section-description">{{ $t('referral.socialDescription') }}</p>
        </div>
        
        <div class="share-options">
          <button 
            v-for="platform in socialPlatforms" 
            :key="platform.id"
            class="share-btn" 
            :class="platform.id"
            @click="shareToSocial(platform.id)"
          >
            <span class="share-icon">{{ platform.icon }}</span>
            <span class="share-label">{{ platform.name }}</span>
          </button>
        </div>
        
        <div class="share-message">
          <label class="input-label">{{ $t('referral.customMessage') }}</label>
          <textarea 
            v-model="shareMessage"
            class="message-textarea"
            :placeholder="$t('referral.messagePlaceholder')"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- QR 코드 생성기 -->
      <div class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">📱</span>
            {{ $t('referral.qrCode') }}
          </h2>
          <p class="section-description">{{ $t('referral.qrDescription') }}</p>
        </div>
        
        <div class="qr-section">
          <div class="qr-generator">
            <select v-model="qrLinkType" class="form-select" @change="generateQRCode">
              <option value="basic">{{ $t('referral.basicLink') }}</option>
              <option value="custom">{{ $t('referral.customLink') }}</option>
            </select>
            <button class="generate-btn" @click="generateQRCode">
              {{ $t('referral.generateQR') }}
            </button>
          </div>
          
          <div v-if="qrCodeUrl" class="qr-display">
            <div class="qr-code">
              <img :src="qrCodeUrl" :alt="$t('referral.qrCodeAlt')" />
            </div>
            <div class="qr-actions">
              <button class="download-btn" @click="downloadQRCode">
                <span class="btn-icon">💾</span>
                {{ $t('referral.downloadQR') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 추천인 리스트 -->
      <div class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">👥</span>
            {{ $t('referral.referralList') }}
          </h2>
          <p class="section-description">{{ $t('referral.listDescription') }}</p>
        </div>
        
        <div class="referral-table">
          <div class="table-header">
            <div class="header-cell">{{ $t('referral.user') }}</div>
            <div class="header-cell">{{ $t('referral.joinDate') }}</div>
            <div class="header-cell">{{ $t('referral.status') }}</div>
            <div class="header-cell">{{ $t('referral.rewards') }}</div>
          </div>
          
          <div class="table-body">
            <div 
              v-for="referral in referralList" 
              :key="referral.id"
              class="table-row"
            >
              <div class="cell user-cell">
                <div class="user-avatar">{{ referral.name.charAt(0) }}</div>
                <div class="user-info">
                  <div class="user-name">{{ referral.name }}</div>
                  <div class="user-email">{{ referral.email }}</div>
                </div>
              </div>
              <div class="cell">{{ formatDate(referral.joinDate) }}</div>
              <div class="cell">
                <span class="status-badge" :class="referral.status.toLowerCase()">
                  {{ $t(`referral.status.${referral.status.toLowerCase()}`) }}
                </span>
              </div>
              <div class="cell rewards-cell">
                <span class="reward-amount">{{ formatGLI(referral.rewards) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="referralList.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <p>{{ $t('referral.noReferrals') }}</p>
            <p class="empty-help">{{ $t('referral.startReferring') }}</p>
          </div>
        </div>
      </div>

      <!-- 리워드 히스토리 -->
      <div class="section-card">
        <div class="card-header">
          <h2 class="section-title">
            <span class="section-icon">🎁</span>
            {{ $t('referral.rewardHistory') }}
          </h2>
          <p class="section-description">{{ $t('referral.rewardDescription') }}</p>
        </div>
        
        <div class="reward-timeline">
          <div 
            v-for="reward in rewardHistory" 
            :key="reward.id"
            class="timeline-item"
          >
            <div class="timeline-marker">
              <span class="marker-icon">💰</span>
            </div>
            <div class="timeline-content">
              <div class="reward-header">
                <span class="reward-amount">+{{ formatGLI(reward.amount) }}</span>
                <span class="reward-date">{{ formatDate(reward.date) }}</span>
              </div>
              <div class="reward-description">{{ reward.description }}</div>
            </div>
          </div>
          
          <div v-if="rewardHistory.length === 0" class="empty-timeline">
            <div class="empty-icon">🎁</div>
            <p>{{ $t('referral.noRewards') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeb3Store } from '@/stores/web3'

const { t } = useI18n()
const web3Store = useWeb3Store()

// 상태 관리
const userReferralCode = ref('GLI2024ABC123')
const copiedStates = ref({
  code: false,
  link: false,
  custom: false
})

// 커스텀 링크 생성
const customLink = ref({
  campaign: '',
  medium: ''
})

const shareMessage = ref('Join GLI Platform and unlock exclusive benefits with blockchain technology! 🚀')

// QR 코드
const qrLinkType = ref('basic')
const qrCodeUrl = ref('')

// 통계 데이터
const referralStats = ref({
  totalInvited: 15,
  activeReferrals: 12,
  totalRewards: 25000,
  monthlyRewards: 3500
})

// 추천인 리스트
const referralList = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    joinDate: new Date('2024-01-15'),
    status: 'Active',
    rewards: 1500
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    joinDate: new Date('2024-02-20'),
    status: 'Active',
    rewards: 2000
  },
  {
    id: 3,
    name: 'Bob Wilson',
    email: 'bob@example.com',
    joinDate: new Date('2024-03-10'),
    status: 'Pending',
    rewards: 0
  }
])

// 리워드 히스토리
const rewardHistory = ref([
  {
    id: 1,
    amount: 1500,
    date: new Date('2024-07-25'),
    description: 'Referral bonus for John Doe activation'
  },
  {
    id: 2,
    amount: 2000,
    date: new Date('2024-07-20'),
    description: 'Referral bonus for Jane Smith activation'
  },
  {
    id: 3,
    amount: 500,
    date: new Date('2024-07-15'),
    description: 'Monthly referral activity bonus'
  }
])

// 소셜 플랫폼
const socialPlatforms = [
  { id: 'twitter', name: 'Twitter', icon: '🐦' },
  { id: 'telegram', name: 'Telegram', icon: '✈️' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'kakao', name: 'KakaoTalk', icon: '💛' },
  { id: 'discord', name: 'Discord', icon: '🎮' }
]

// 계산된 속성
const referralUrl = computed(() => 
  `https://gli.io/signup?ref=${userReferralCode.value}`
)

const customLinkUrl = computed(() => {
  if (!customLink.value.campaign) return ''
  
  let url = `https://gli.io/signup?ref=${userReferralCode.value}`
  if (customLink.value.campaign) {
    url += `&campaign=${encodeURIComponent(customLink.value.campaign)}`
  }
  if (customLink.value.medium) {
    url += `&medium=${customLink.value.medium}`
  }
  return url
})

// 메서드
const copyToClipboard = async (text: string, type: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedStates.value[type] = true
    
    // 2초 후 상태 리셋
    setTimeout(() => {
      copiedStates.value[type] = false
    }, 2000)
    
    showNotification(t('referral.copied'), 'success')
  } catch (err) {
    console.error('Failed to copy: ', err)
    showNotification(t('referral.copyFailed'), 'error')
  }
}

const selectAll = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.select()
}

const generateCustomLink = () => {
  // 커스텀 링크는 computed에서 자동 생성됨
}

const shareToSocial = (platform: string) => {
  const url = customLinkUrl.value || referralUrl.value
  const message = encodeURIComponent(shareMessage.value + ' ' + url)
  
  switch (platform) {
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${message}`, '_blank')
      break
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareMessage.value)}`, '_blank')
      break
    case 'whatsapp':
      window.open(`https://wa.me/?text=${message}`, '_blank')
      break
    case 'kakao':
      // 카카오톡 공유 API 구현 (실제 환경에서)
      console.log('Share to KakaoTalk:', url)
      showNotification(t('referral.kakaoShareNotImplemented'), 'info')
      break
    case 'discord':
      // 디스코드는 직접 공유 링크가 없으므로 클립보드에 복사
      copyToClipboard(`${shareMessage.value} ${url}`, 'custom')
      showNotification(t('referral.discordCopied'), 'info')
      break
  }
}

const generateQRCode = () => {
  const linkToEncode = qrLinkType.value === 'custom' && customLinkUrl.value 
    ? customLinkUrl.value 
    : referralUrl.value
  
  // QR 코드 생성 (실제로는 QR 코드 라이브러리 사용)
  qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(linkToEncode)}`
}

const downloadQRCode = () => {
  if (qrCodeUrl.value) {
    const link = document.createElement('a')
    link.href = qrCodeUrl.value
    link.download = `GLI-referral-qr-${userReferralCode.value}.png`
    link.click()
  }
}

const formatGLI = (amount: number) => {
  return `${amount.toLocaleString()} GLI`
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const showNotification = (message: string, type: string) => {
  // 간단한 알림 (실제로는 Toast 컴포넌트 사용)
  console.log(`${type.toUpperCase()}: ${message}`)
}

onMounted(() => {
  // 초기 QR 코드 생성
  generateQRCode()
})
</script>

<style scoped>
.referral-system {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 헤더 섹션 */
.referral-header {
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

.stats-summary {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 컨텐츠 영역 */
.referral-content {
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

.section-card.main-card {
  border: 2px solid var(--gli-gold);
  box-shadow: 0 8px 25px rgba(212, 175, 55, 0.2);
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

/* 코드 섹션 */
.code-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.code-display,
.link-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.code-box,
.link-box {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.code-text {
  background: var(--gradient-gold);
  color: var(--gli-gray-dark);
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 2px;
  flex: 1;
  text-align: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.link-input {
  flex: 1;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: monospace;
  font-size: 0.9rem;
}

.link-input:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.copy-btn {
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  white-space: nowrap;
}

.copy-btn.primary {
  background: var(--gradient-primary);
  color: white;
}

.copy-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.copy-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.copy-btn.copied {
  background: var(--gli-green);
  color: white;
}

/* 폼 요소 */
.custom-link-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-input,
.form-select {
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.generated-link {
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

/* 소셜 공유 */
.share-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.share-btn {
  padding: 1rem;
  border-radius: 0.75rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
}

.share-btn.twitter {
  background: #1da1f2;
  color: white;
}

.share-btn.telegram {
  background: #0088cc;
  color: white;
}

.share-btn.whatsapp {
  background: #25d366;
  color: white;
}

.share-btn.kakao {
  background: #fee500;
  color: #3c1e1e;
}

.share-btn.discord {
  background: #5865f2;
  color: white;
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.message-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

/* QR 섹션 */
.qr-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.qr-generator {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.generate-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.qr-display {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.qr-code {
  padding: 1rem;
  background: white;
  border-radius: 1rem;
  box-shadow: var(--shadow);
}

.qr-code img {
  display: block;
  width: 200px;
  height: 200px;
}

.download-btn {
  background: var(--gli-green);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

/* 테이블 */
.referral-table {
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.header-cell {
  padding: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  border-bottom: 1px solid var(--border-light);
  transition: background-color 0.3s ease;
}

.table-row:hover {
  background: var(--bg-tertiary);
}

.cell {
  padding: 1rem;
  display: flex;
  align-items: center;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: var(--gli-green);
  color: white;
}

.status-badge.pending {
  background: var(--gli-gold);
  color: var(--gli-gray-dark);
}

.rewards-cell {
  font-weight: 600;
  color: var(--gli-blue);
}

/* 타임라인 */
.reward-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.timeline-marker {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--gradient-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reward-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gli-green);
}

.reward-date {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.reward-description {
  color: var(--text-primary);
  line-height: 1.5;
}

/* 빈 상태 */
.empty-state,
.empty-timeline {
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
  
  .stats-summary {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .referral-header {
    padding: 2rem 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .code-section {
    gap: 1.5rem;
  }
  
  .code-box,
  .link-box {
    flex-direction: column;
    align-items: stretch;
  }
  
  .share-options {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  
  .qr-display {
    flex-direction: column;
    text-align: center;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .table-row {
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .cell {
    padding: 0.75rem;
    border-bottom: 1px solid var(--border-light);
  }
  
  .cell:last-child {
    border-bottom: none;
  }
  
  .header-cell {
    display: none;
  }
  
  .cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-secondary);
    margin-right: 1rem;
    min-width: 100px;
  }
}
</style>