<template>
  <div class="my-page">
    <!-- 페이지 헤더 -->
    <header class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-emoji">🧑</span>
          {{ $t('nav.mypage') }}
        </h1>
        <p class="page-subtitle">
          {{ $t('mypage.subtitle') }}
        </p>
      </div>
      <div class="user-summary">
        <div class="user-avatar">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" :alt="userInfo.name" />
          <div v-else class="avatar-placeholder">{{ userInfo.name.charAt(0) }}</div>
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ userInfo.name }}</h3>
          <span class="user-grade" :class="userInfo.grade.toLowerCase()">
            {{ gradeEmojis[userInfo.grade] }} {{ $t(`auth.grades.${userInfo.grade.toLowerCase()}`) }}
          </span>
        </div>
      </div>
    </header>

    <!-- 탭 네비게이션 -->
    <nav class="tab-navigation">
      <div class="tab-container">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-text">{{ $t(`mypage.tabs.${tab.id}`) }}</span>
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </div>
    </nav>

    <!-- 탭 콘텐츠 -->
    <main class="tab-content">
      <!-- 회원 정보 탭 -->
      <section v-show="activeTab === 'profile'" class="tab-panel">
        <div class="panel-container">
          <h2 class="panel-title">
            <span class="panel-emoji">👤</span>
            {{ $t('mypage.profile.title') }}
          </h2>
          
          <div class="profile-grid">
            <!-- 기본 정보 카드 -->
            <div class="info-card">
              <h3 class="card-title">{{ $t('mypage.profile.basicInfo') }}</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">{{ $t('mypage.profile.email') }}</span>
                  <span class="info-value">{{ userInfo.email }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('mypage.profile.phone') }}</span>
                  <span class="info-value">{{ userInfo.phone }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('mypage.profile.joinDate') }}</span>
                  <span class="info-value">{{ formatDate(userInfo.joinDate) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('mypage.profile.lastLogin') }}</span>
                  <span class="info-value">{{ formatDate(userInfo.lastLogin) }}</span>
                </div>
              </div>
            </div>

            <!-- 로그인 세션 카드 -->
            <div class="info-card">
              <h3 class="card-title">{{ $t('mypage.profile.recentSessions') }}</h3>
              <div class="sessions-list">
                <div v-for="session in loginSessions" :key="session.id" class="session-item">
                  <div class="session-info">
                    <span class="session-device">{{ session.device }}</span>
                    <span class="session-location">{{ session.location }}</span>
                  </div>
                  <div class="session-meta">
                    <span class="session-time">{{ formatDate(session.timestamp) }}</span>
                    <span class="session-status" :class="session.status">
                      {{ $t(`mypage.profile.sessionStatus.${session.status}`) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 보안 설정 카드 -->
            <div class="info-card">
              <h3 class="card-title">{{ $t('mypage.profile.security') }}</h3>
              <div class="security-options">
                <div class="security-item">
                  <div class="security-info">
                    <span class="security-label">얼굴 인증</span>
                    <span class="security-desc">실시간 얼굴 랜드마크 검증을 통한 본인 확인</span>
                  </div>
                  <button 
                    class="security-btn" 
                    :class="{ enabled: userInfo.faceVerified }"
                    @click="toggleFaceVerification"
                  >
                    {{ userInfo.faceVerified ? '✓ 인증 완료' : '얼굴 인증 시작' }}
                  </button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <span class="security-label">{{ $t('mypage.profile.twoFactor') }}</span>
                    <span class="security-desc">{{ $t('mypage.profile.twoFactorDesc') }}</span>
                  </div>
                  <button class="security-btn" :class="{ enabled: userInfo.twoFactorEnabled }">
                    {{ userInfo.twoFactorEnabled ? $t('common.enabled') : $t('common.disabled') }}
                  </button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <span class="security-label">{{ $t('mypage.profile.passwordChange') }}</span>
                    <span class="security-desc">{{ $t('mypage.profile.passwordChangeDesc') }}</span>
                  </div>
                  <button class="security-btn" @click="openPasswordChange">
                    {{ $t('mypage.profile.changePassword') }}
                  </button>
                </div>
                <div class="security-item">
                  <div class="security-info">
                    <span class="security-label">로그아웃</span>
                    <span class="security-desc">현재 세션에서 로그아웃합니다</span>
                  </div>
                  <button class="security-btn logout-btn" @click="handleLogout">
                    <LogoutIcon class="logout-icon" />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>

            <!-- 얼굴 인증 카드 -->
            <div class="info-card" v-if="showFaceVerification">
              <h3 class="card-title">🔐 얼굴 인증</h3>
              <FaceVerification 
                :auto-start="false"
                :required-confidence="0.8"
                :verification-duration="3000"
                @verified="onFaceVerified"
                @error="onFaceVerificationError"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 추천인 코드 탭 -->
      <section v-show="activeTab === 'referral'" class="tab-panel">
        <div class="panel-container">
          <h2 class="panel-title">
            <span class="panel-emoji">🤝</span>
            {{ $t('mypage.referral.title') }}
          </h2>
          
          <div class="referral-grid">
            <!-- 내 추천인 코드 -->
            <div class="referral-card">
              <h3 class="card-title">{{ $t('mypage.referral.myCode') }}</h3>
              <div class="code-display">
                <div class="code-box">
                  <span class="code-text">{{ userInfo.referralCode }}</span>
                  <button class="copy-btn" @click="copyToClipboard(userInfo.referralCode)">
                    <span class="copy-icon">📋</span>
                    {{ $t('common.copy') }}
                  </button>
                </div>
                <div class="code-url">
                  <input 
                    :value="referralUrl" 
                    readonly 
                    class="url-input"
                    @click="selectAll"
                  >
                  <button class="copy-btn" @click="copyToClipboard(referralUrl)">
                    <span class="copy-icon">🔗</span>
                    {{ $t('mypage.referral.copyLink') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 추천 통계 -->
            <div class="referral-card">
              <h3 class="card-title">{{ $t('mypage.referral.stats') }}</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ referralStats.totalInvited }}</span>
                  <span class="stat-label">{{ $t('mypage.referral.totalInvited') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ referralStats.activeReferrals }}</span>
                  <span class="stat-label">{{ $t('mypage.referral.activeReferrals') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ referralStats.totalRewards.toLocaleString() }} GLIB</span>
                  <span class="stat-label">{{ $t('mypage.referral.totalRewards') }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ referralStats.monthlyRewards.toLocaleString() }} GLIB</span>
                  <span class="stat-label">{{ $t('mypage.referral.monthlyRewards') }}</span>
                </div>
              </div>
            </div>

            <!-- 소셜 공유 -->
            <div class="referral-card">
              <h3 class="card-title">{{ $t('mypage.referral.share') }}</h3>
              <div class="share-buttons">
                <button class="share-btn twitter" @click="shareToTwitter">
                  <span class="share-icon">🐦</span>
                  Twitter
                </button>
                <button class="share-btn telegram" @click="shareToTelegram">
                  <span class="share-icon">✈️</span>
                  Telegram
                </button>
                <button class="share-btn whatsapp" @click="shareToWhatsApp">
                  <span class="share-icon">💬</span>
                  WhatsApp
                </button>
                <button class="share-btn kakao" @click="shareToKakao">
                  <span class="share-icon">💬</span>
                  KakaoTalk
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 토큰 주소 탭 -->
      <section v-show="activeTab === 'tokens'" class="tab-panel">
        <div class="panel-container">
          <h2 class="panel-title">
            <span class="panel-emoji">💰</span>
            {{ $t('mypage.tokens.title') }}
          </h2>
          
          <div class="tokens-grid">
            <div v-for="token in userTokens" :key="token.symbol" class="token-card">
              <div class="token-header">
                <div class="token-info">
                  <span class="token-icon">{{ token.icon }}</span>
                  <div class="token-details">
                    <h3 class="token-name">{{ token.name }}</h3>
                    <span class="token-symbol">{{ token.symbol }}</span>
                  </div>
                </div>
                <div class="token-balance">
                  <span class="balance-value">{{ token.balance.toLocaleString() }}</span>
                  <span class="balance-symbol">{{ token.symbol }}</span>
                </div>
              </div>
              
              <div class="token-address">
                <label class="address-label">{{ $t('mypage.tokens.address') }}</label>
                <div class="address-display">
                  <span class="address-text">{{ formatAddress(token.address) }}</span>
                  <button class="address-btn" @click="copyToClipboard(token.address)">
                    <span class="btn-icon">📋</span>
                  </button>
                  <button class="address-btn" @click="showQRCode(token)">
                    <span class="btn-icon">📱</span>
                  </button>
                </div>
              </div>

              <div class="token-price" v-if="token.price">
                <div class="price-info">
                  <span class="price-value">${{ token.price.toFixed(4) }}</span>
                  <span class="price-change" :class="{ positive: token.priceChange > 0, negative: token.priceChange < 0 }">
                    {{ token.priceChange > 0 ? '+' : '' }}{{ token.priceChange.toFixed(2) }}%
                  </span>
                </div>
                <div class="price-chart">
                  <!-- 미니 차트 플레이스홀더 -->
                  <div class="chart-placeholder">📈</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 거래 내역 탭 -->
      <section v-show="activeTab === 'transactions'" class="tab-panel">
        <div class="panel-container">
          <h2 class="panel-title">
            <span class="panel-emoji">📊</span>
            {{ $t('mypage.transactions.title') }}
          </h2>
          
          <!-- 필터 -->
          <div class="transaction-filters">
            <div class="filter-group">
              <label class="filter-label">{{ $t('mypage.transactions.tokenFilter') }}</label>
              <select v-model="transactionFilters.token" class="filter-select">
                <option value="">{{ $t('common.all') }}</option>
                <option value="GLIB">GLIB</option>
                <option value="GLID">GLID</option>
                <option value="GLIL">GLIL</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ $t('mypage.transactions.typeFilter') }}</label>
              <select v-model="transactionFilters.type" class="filter-select">
                <option value="">{{ $t('common.all') }}</option>
                <option value="deposit">{{ $t('mypage.transactions.types.deposit') }}</option>
                <option value="withdrawal">{{ $t('mypage.transactions.types.withdrawal') }}</option>
                <option value="conversion">{{ $t('mypage.transactions.types.conversion') }}</option>
                <option value="purchase">{{ $t('mypage.transactions.types.purchase') }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="filter-label">{{ $t('mypage.transactions.dateRange') }}</label>
              <input v-model="transactionFilters.startDate" type="date" class="filter-input">
              <input v-model="transactionFilters.endDate" type="date" class="filter-input">
            </div>
            <button class="export-btn" @click="exportTransactions">
              <span class="btn-icon">📥</span>
              {{ $t('mypage.transactions.export') }}
            </button>
          </div>

          <!-- 거래 내역 테이블 -->
          <div class="transactions-table">
            <div class="table-header">
              <div class="header-cell">{{ $t('mypage.transactions.date') }}</div>
              <div class="header-cell">{{ $t('mypage.transactions.type') }}</div>
              <div class="header-cell">{{ $t('mypage.transactions.token') }}</div>
              <div class="header-cell">{{ $t('mypage.transactions.amount') }}</div>
              <div class="header-cell">{{ $t('mypage.transactions.status') }}</div>
              <div class="header-cell">{{ $t('mypage.transactions.hash') }}</div>
            </div>
            <div class="table-body">
              <div v-for="transaction in filteredTransactions" :key="transaction.id" class="table-row">
                <div class="table-cell">{{ formatDate(transaction.timestamp) }}</div>
                <div class="table-cell">
                  <span class="transaction-type" :class="transaction.type">
                    {{ getTransactionIcon(transaction.type) }}
                    {{ $t(`mypage.transactions.types.${transaction.type}`) }}
                  </span>
                </div>
                <div class="table-cell">
                  <span class="token-badge">{{ transaction.token }}</span>
                </div>
                <div class="table-cell">
                  <span class="amount" :class="{ positive: transaction.amount > 0, negative: transaction.amount < 0 }">
                    {{ transaction.amount > 0 ? '+' : '' }}{{ transaction.amount.toLocaleString() }}
                  </span>
                </div>
                <div class="table-cell">
                  <span class="status-badge" :class="transaction.status">
                    {{ $t(`mypage.transactions.statuses.${transaction.status}`) }}
                  </span>
                </div>
                <div class="table-cell">
                  <button class="hash-btn" @click="copyToClipboard(transaction.hash)">
                    {{ formatHash(transaction.hash) }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 페이지네이션 -->
          <div class="pagination">
            <button 
              class="page-btn" 
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              {{ $t('common.previous') }}
            </button>
            <span class="page-info">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <button 
              class="page-btn" 
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              {{ $t('common.next') }}
            </button>
          </div>
        </div>
      </section>

      <!-- 입출금 탭 -->
      <section v-show="activeTab === 'wallet'" class="tab-panel">
        <div class="panel-container">
          <h2 class="panel-title">
            <span class="panel-emoji">💳</span>
            {{ $t('mypage.wallet.title') }}
          </h2>
          
          <div class="wallet-actions">
            <!-- 지갑 연결 상태 -->
            <div class="wallet-status">
              <div class="status-info">
                <span class="status-text">
                  {{ web3Store.isConnected ? '🟢 ' + $t('mypage.wallet.connected') : '🔴 ' + $t('mypage.wallet.disconnected') }}
                </span>
              </div>
              <button v-if="!web3Store.isConnected" class="connect-btn" @click="connectWallet">
                {{ $t('mypage.wallet.connect') }}
              </button>
              <span v-else class="wallet-address">{{ formatAddress(web3Store.account) }}</span>
            </div>

            <!-- 입출금 폼 -->
            <div v-if="web3Store.isConnected" class="wallet-forms">
              <!-- 입금 폼 -->
              <div class="wallet-form">
                <h3 class="form-title">{{ $t('mypage.wallet.deposit') }}</h3>
                <div class="form-group">
                  <label class="form-label">{{ $t('mypage.wallet.token') }}</label>
                  <select v-model="depositForm.token" class="form-select">
                    <option value="GLIB">GLIB</option>
                    <option value="GLID">GLID</option>
                    <option value="GLIL">GLIL</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t('mypage.wallet.amount') }}</label>
                  <input 
                    v-model="depositForm.amount" 
                    type="number" 
                    class="form-input"
                    :placeholder="$t('mypage.wallet.enterAmount')"
                  >
                </div>
                <div class="form-fee">
                  <span class="fee-label">{{ $t('mypage.wallet.networkFee') }}:</span>
                  <span class="fee-value">{{ depositForm.fee }} ETH</span>
                </div>
                <button class="form-btn deposit" @click="processDeposit">
                  <span class="btn-icon">⬇️</span>
                  {{ $t('mypage.wallet.deposit') }}
                </button>
              </div>

              <!-- 출금 폼 -->
              <div class="wallet-form">
                <h3 class="form-title">{{ $t('mypage.wallet.withdrawal') }}</h3>
                <div class="form-group">
                  <label class="form-label">{{ $t('mypage.wallet.token') }}</label>
                  <select v-model="withdrawalForm.token" class="form-select">
                    <option value="GLIB">GLIB</option>
                    <option value="GLID">GLID</option>
                    <option value="GLIL">GLIL</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t('mypage.wallet.amount') }}</label>
                  <input 
                    v-model="withdrawalForm.amount" 
                    type="number" 
                    class="form-input"
                    :placeholder="$t('mypage.wallet.enterAmount')"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">{{ $t('mypage.wallet.toAddress') }}</label>
                  <input 
                    v-model="withdrawalForm.toAddress" 
                    type="text" 
                    class="form-input"
                    :placeholder="$t('mypage.wallet.enterAddress')"
                  >
                </div>
                <div class="form-fee">
                  <span class="fee-label">{{ $t('mypage.wallet.withdrawalFee') }}:</span>
                  <span class="fee-value">{{ withdrawalForm.fee }} {{ withdrawalForm.token }}</span>
                </div>
                <button class="form-btn withdrawal" @click="processWithdrawal">
                  <span class="btn-icon">⬆️</span>
                  {{ $t('mypage.wallet.withdrawal') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- QR 코드 모달 -->
    <div v-if="qrModal.show" class="modal-overlay" @click="closeQRModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ qrModal.token?.name }} {{ $t('mypage.tokens.qrCode') }}</h3>
          <button class="modal-close" @click="closeQRModal">×</button>
        </div>
        <div class="modal-body">
          <div class="qr-code">
            <!-- QR 코드 플레이스홀더 -->
            <div class="qr-placeholder">📱 QR Code</div>
          </div>
          <p class="qr-address">{{ qrModal.token?.address }}</p>
          <button class="copy-btn" @click="copyToClipboard(qrModal.token?.address)">
            {{ $t('common.copy') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeb3Store } from '@/stores/web3'
import { useAuthStore } from '@/stores/auth'
import LogoutIcon from '@/components/icons/LogoutIcon.vue'
import FaceVerification from '@/components/FaceVerification.vue'

const { t } = useI18n()
const web3Store = useWeb3Store()
const authStore = useAuthStore()

// 활성 탭
const activeTab = ref('profile')

// 탭 정의
const tabs = [
  { id: 'profile', icon: '👤', badge: null },
  { id: 'referral', icon: '🤝', badge: null },
  { id: 'tokens', icon: '💰', badge: null },
  { id: 'transactions', icon: '📊', badge: null },
  { id: 'wallet', icon: '💳', badge: null }
]

// 등급 이모지
const gradeEmojis = {
  R: '🥉',
  W: '🥈',
  X: '🥇'
}

// 사용자 정보
const userInfo = ref({
  name: 'GLI User',
  email: 'user@gli.io',
  phone: '+82 10-1234-5678',
  grade: 'W',
  avatar: null,
  joinDate: new Date('2024-01-15'),
  lastLogin: new Date(),
  referralCode: 'GLI2024ABC123',
  twoFactorEnabled: false,
  faceVerified: false
})

// 얼굴 인증 관련 상태
const showFaceVerification = ref(false)

// 로그인 세션
const loginSessions = ref([
  {
    id: 1,
    device: 'Chrome on Windows',
    location: 'Seoul, South Korea',
    timestamp: new Date(),
    status: 'active'
  },
  {
    id: 2,
    device: 'Safari on iPhone',
    location: 'Seoul, South Korea',
    timestamp: new Date(Date.now() - 86400000),
    status: 'expired'
  }
])

// 추천인 통계
const referralStats = ref({
  totalInvited: 15,
  activeReferrals: 12,
  totalRewards: 25000,
  monthlyRewards: 3200
})

// 사용자 토큰
const userTokens = ref([
  {
    symbol: 'GLIB',
    name: 'GLI Base Token',
    icon: '🪙',
    balance: 50000,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    price: 1.25,
    priceChange: 5.2
  },
  {
    symbol: 'GLID',
    name: 'GLI Governance Token',
    icon: '🏛️',
    balance: 25000,
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    price: 0.85,
    priceChange: -2.1
  },
  {
    symbol: 'GLIL',
    name: 'GLI Liquid Token',
    icon: '💧',
    balance: 75000,
    address: '0x567890abcdef1234567890abcdef1234567890ab',
    price: 1.00,
    priceChange: 0.1
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    icon: '💵',
    balance: 10000,
    address: '0x90abcdef1234567890abcdef1234567890abcdef',
    price: 1.00,
    priceChange: 0.0
  }
])

// 거래 내역
const transactions = ref([
  {
    id: 1,
    timestamp: new Date(),
    type: 'deposit',
    token: 'GLIB',
    amount: 5000,
    status: 'completed',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 3600000),
    type: 'conversion',
    token: 'GLID',
    amount: -1000,
    status: 'completed',
    hash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 86400000),
    type: 'withdrawal',
    token: 'USDT',
    amount: -500,
    status: 'pending',
    hash: '0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
  }
])

// 거래 필터
const transactionFilters = ref({
  token: '',
  type: '',
  startDate: '',
  endDate: ''
})

// 페이지네이션
const currentPage = ref(1)
const itemsPerPage = 10

// 입출금 폼
const depositForm = ref({
  token: 'GLIB',
  amount: 0,
  fee: 0.005
})

const withdrawalForm = ref({
  token: 'GLIB',
  amount: 0,
  toAddress: '',
  fee: 50
})

// QR 코드 모달
const qrModal = ref({
  show: false,
  token: null
})

// 계산된 속성
const referralUrl = computed(() => 
  `https://gli.io/signup?ref=${userInfo.value.referralCode}`
)

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  if (transactionFilters.value.token) {
    filtered = filtered.filter(t => t.token === transactionFilters.value.token)
  }
  
  if (transactionFilters.value.type) {
    filtered = filtered.filter(t => t.type === transactionFilters.value.type)
  }

  // 날짜 필터링 로직은 실제 구현에서 추가
  
  return filtered.slice(
    (currentPage.value - 1) * itemsPerPage,
    currentPage.value * itemsPerPage
  )
})

const totalPages = computed(() => 
  Math.ceil(transactions.value.length / itemsPerPage)
)

// 메서드
const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatHash = (hash: string) => {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // 토스트 알림 표시 (실제 구현에서)
    console.log('Copied to clipboard:', text)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const selectAll = (event: Event) => {
  const target = event.target as HTMLInputElement
  target.select()
}

const showQRCode = (token: any) => {
  qrModal.value = {
    show: true,
    token
  }
}

const closeQRModal = () => {
  qrModal.value = {
    show: false,
    token: null
  }
}

const shareToTwitter = () => {
  const text = encodeURIComponent(`Join GLI Platform and get exclusive benefits! ${referralUrl.value}`)
  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
}

const shareToTelegram = () => {
  const text = encodeURIComponent(`Join GLI Platform and get exclusive benefits! ${referralUrl.value}`)
  window.open(`https://t.me/share/url?url=${referralUrl.value}&text=${text}`, '_blank')
}

const shareToWhatsApp = () => {
  const text = encodeURIComponent(`Join GLI Platform and get exclusive benefits! ${referralUrl.value}`)
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

const shareToKakao = () => {
  // 카카오톡 공유 API 구현 (실제 구현에서)
  console.log('Share to KakaoTalk:', referralUrl.value)
}

const getTransactionIcon = (type: string) => {
  const icons = {
    deposit: '⬇️',
    withdrawal: '⬆️',
    conversion: '🔄',
    purchase: '🛒'
  }
  return icons[type] || '💸'
}

const changePage = (page: number) => {
  currentPage.value = page
}

const exportTransactions = () => {
  // CSV/PDF 내보내기 구현 (실제 구현에서)
  console.log('Export transactions')
}

const connectWallet = async () => {
  await web3Store.connectWallet()
}

const processDeposit = async () => {
  // 입금 처리 로직 (실제 구현에서)
  console.log('Process deposit:', depositForm.value)
}

const processWithdrawal = async () => {
  // 출금 처리 로직 (실제 구현에서)
  console.log('Process withdrawal:', withdrawalForm.value)
}

const openPasswordChange = () => {
  // 비밀번호 변경 모달 열기 (실제 구현에서)
  console.log('Open password change modal')
}

const handleLogout = async () => {
  try {
    await authStore.logout()
  } catch (error) {
    console.error('로그아웃 실패:', error)
  }
}

// 얼굴 인증 관련 메서드
const toggleFaceVerification = () => {
  if (userInfo.value.faceVerified) {
    // 이미 인증된 경우 재인증 옵션 제공
    const confirm = window.confirm('이미 인증이 완료되었습니다. 다시 인증하시겠습니까?')
    if (confirm) {
      userInfo.value.faceVerified = false
      showFaceVerification.value = true
      // 스크롤을 얼굴 인증 카드로 이동
      setTimeout(() => {
        const element = document.querySelector('.info-card:last-child')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  } else {
    // 인증되지 않은 경우 인증 시작
    showFaceVerification.value = true
    // 스크롤을 얼굴 인증 카드로 이동
    setTimeout(() => {
      const element = document.querySelector('.info-card:last-child')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}

const onFaceVerified = (verified: boolean) => {
  if (verified) {
    userInfo.value.faceVerified = true
    showFaceVerification.value = false
    
    // 성공 알림
    alert('✅ 얼굴 인증이 성공적으로 완료되었습니다!')
    
    // 사용자 정보를 서버에 업데이트 (실제 구현에서)
    // await updateUserVerificationStatus({ faceVerified: true })
  }
}

const onFaceVerificationError = (error: string) => {
  console.error('Face verification error:', error)
  alert(`❌ 얼굴 인증 실패: ${error}`)
}

onMounted(() => {
  // 컴포넌트 초기화
})
</script>

<style scoped>
.my-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 페이지 헤더 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--gli-blue) 0%, var(--gli-purple) 100%);
  color: white;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.title-emoji {
  font-size: 3rem;
  margin-right: 1rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.user-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 600;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 600;
}

.user-grade {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.9rem;
  font-weight: 500;
}

/* 탭 네비게이션 */
.tab-navigation {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.tab-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-button:hover,
.tab-button.active {
  color: var(--gli-blue);
  border-bottom-color: var(--gli-blue);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-text {
  font-weight: 500;
}

.tab-badge {
  background: var(--gli-orange);
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
}

/* 탭 콘텐츠 */
.tab-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.tab-panel {
  animation: fadeIn 0.3s ease;
}

.panel-container {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.panel-emoji {
  font-size: 2.5rem;
  margin-right: 1rem;
}

/* 프로필 그리드 */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.info-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.session-info {
  display: flex;
  flex-direction: column;
}

.session-device {
  font-weight: 600;
  color: var(--text-primary);
}

.session-location {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.session-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.session-time {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.session-status {
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.session-status.active {
  background: var(--gli-green);
  color: white;
}

.session-status.expired {
  background: var(--text-secondary);
  color: white;
}

.security-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.security-info {
  display: flex;
  flex-direction: column;
}

.security-label {
  font-weight: 600;
  color: var(--text-primary);
}

.security-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.security-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.security-btn.enabled {
  background: var(--gli-green);
  color: white;
}

.security-btn:not(.enabled) {
  background: var(--text-secondary);
  color: white;
}

.security-btn.logout-btn {
  background: var(--gli-orange);
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.security-btn.logout-btn:hover {
  background: #e74c3c;
}

.logout-icon {
  width: 1rem;
  height: 1rem;
}

/* 추천인 그리드 */
.referral-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.referral-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.code-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.code-box {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.code-text {
  flex: 1;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--text-primary);
}

.code-url {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.url-input {
  flex: 1;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  transform: translateY(-2px);
}

.copy-icon {
  font-size: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gli-blue);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
}

.share-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.share-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
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

.share-btn:hover {
  transform: translateY(-2px);
}

/* 토큰 그리드 */
.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.token-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.token-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.token-icon {
  font-size: 2rem;
}

.token-details {
  display: flex;
  flex-direction: column;
}

.token-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.token-symbol {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.token-balance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.balance-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.balance-symbol {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.token-address {
  margin-bottom: 1.5rem;
}

.address-label {
  display: block;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.address-display {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.address-text {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
}

.address-btn {
  padding: 0.75rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.address-btn:hover {
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1rem;
}

.token-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-info {
  display: flex;
  flex-direction: column;
}

.price-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.price-change {
  font-size: 0.9rem;
  font-weight: 500;
}

.price-change.positive {
  color: var(--gli-green);
}

.price-change.negative {
  color: var(--gli-orange);
}

.chart-placeholder {
  font-size: 2rem;
}

/* 거래 내역 */
.transaction-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-select,
.filter-input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--gli-green);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
}

.transactions-table {
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.header-cell {
  padding: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  border-right: 1px solid var(--border-color);
}

.header-cell:last-child {
  border-right: none;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  border-bottom: 1px solid var(--border-color);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 1rem;
  color: var(--text-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  align-items: center;
}

.table-cell:last-child {
  border-right: none;
}

.transaction-type {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.token-badge {
  padding: 0.25rem 0.5rem;
  background: var(--gli-blue);
  color: white;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
}

.amount.positive {
  color: var(--gli-green);
}

.amount.negative {
  color: var(--gli-orange);
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.completed {
  background: var(--gli-green);
  color: white;
}

.status-badge.pending {
  background: var(--gli-gold);
  color: white;
}

.status-badge.failed {
  background: var(--gli-orange);
  color: white;
}

.hash-btn {
  background: none;
  border: none;
  color: var(--gli-blue);
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--gli-blue);
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-weight: 500;
  color: var(--text-primary);
}

/* 지갑 액션 */
.wallet-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  font-weight: 500;
  color: var(--text-primary);
}

.connect-btn {
  padding: 0.75rem 1.5rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.connect-btn:hover {
  transform: translateY(-2px);
}

.wallet-address {
  font-family: 'Courier New', monospace;
  color: var(--text-primary);
  font-weight: 500;
}

.wallet-forms {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.wallet-form {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--border-color);
}

.form-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-fee {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.fee-label {
  color: var(--text-secondary);
}

.fee-value {
  font-weight: 600;
  color: var(--text-primary);
}

.form-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.form-btn.deposit {
  background: var(--gli-green);
  color: white;
}

.form-btn.withdrawal {
  background: var(--gli-orange);
  color: white;
}

.form-btn:hover {
  transform: translateY(-2px);
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.modal-body {
  text-align: center;
}

.qr-code {
  margin-bottom: 1rem;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 2rem;
}

.qr-address {
  font-family: 'Courier New', monospace;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  word-break: break-all;
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 반응형 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }
  
  .tab-container {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .tab-button {
    padding: 0.75rem 1rem;
  }
  
  .profile-grid,
  .referral-grid,
  .tokens-grid,
  .wallet-forms {
    grid-template-columns: 1fr;
  }
  
  .transaction-filters {
    flex-direction: column;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
  }
  
  .table-cell {
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .share-buttons {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>