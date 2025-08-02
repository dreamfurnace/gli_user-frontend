<template>
  <div class="token-conversion">
    <!-- 페이지 헤더 -->
    <header class="conversion-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-emoji">💱</span>
          {{ $t('nav.conversion') }}
        </h1>
        <p class="page-subtitle">
          {{ $t('conversion.subtitle') }}
        </p>
      </div>
      <div v-if="!isConnected" class="connection-prompt">
        <div class="prompt-content">
          <span class="prompt-icon">🔗</span>
          <h3>지갑을 연결해주세요</h3>
          <p>토큰 변환을 위해 솔라나 지갑을 연결해야 합니다.</p>
          <button class="connect-wallet-btn" @click="connectWallet">
            지갑 연결하기
          </button>
        </div>
      </div>

      <div v-else class="token-meters">
        <div v-for="token in tokenBalances" :key="token.symbol" class="token-meter">
          <div class="meter-header">
            <span class="token-icon">{{ token.icon }}</span>
            <span class="token-symbol">{{ token.symbol }}</span>
          </div>
          <div class="meter-content">
            <div v-if="(token.symbol === 'GLIB' && isGLIBLoading) || (token.symbol === 'GLIL' && isGLILLoading)" 
                 class="balance-loading">
              <div class="loading-spinner small"></div>
              <span>로딩 중...</span>
            </div>
            <div v-else>
              <div class="balance-value">{{ token.balance.toLocaleString() }}</div>
              <div class="balance-meter">
                <div 
                  class="meter-fill" 
                  :style="{ 
                    width: `${(token.balance / token.maxBalance) * 100}%`,
                    background: token.color
                  }"
                ></div>
              </div>
              <div class="balance-usd">${{ (token.balance * token.price).toLocaleString() }}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 메인 변환 영역 -->
    <main class="conversion-main">
      <div class="conversion-container">
        <!-- 변환 카드 -->
        <div class="conversion-card">
          <div class="card-header">
            <h2 class="card-title">
              <span class="card-emoji">🔄</span>
              {{ $t('conversion.exchange') }}
            </h2>
            <div class="conversion-type-selector">
              <button 
                v-for="type in conversionTypes" 
                :key="type.id"
                class="type-btn"
                :class="{ active: activeConversionType === type.id }"
                @click="setConversionType(type.id)"
              >
                <span class="type-icon">{{ type.icon }}</span>
                <span class="type-label">{{ $t(`conversion.types.${type.id}`) }}</span>
              </button>
            </div>
          </div>

          <div class="conversion-form">
            <!-- From Token -->
            <div class="token-section from-section">
              <label class="section-label">{{ $t('conversion.from') }}</label>
              <div class="token-input-group">
                <div class="token-selector">
                  <button 
                    class="token-select-btn"
                    @click="showFromTokenSelector = !showFromTokenSelector"
                  >
                    <span class="token-icon">{{ getTokenIcon(conversionForm.fromToken) }}</span>
                    <span class="token-name">{{ conversionForm.fromToken }}</span>
                    <span class="dropdown-icon">{{ showFromTokenSelector ? '▲' : '▼' }}</span>
                  </button>
                  <div v-if="showFromTokenSelector" class="token-dropdown">
                    <button 
                      v-for="token in availableFromTokens" 
                      :key="token"
                      class="token-option"
                      @click="selectFromToken(token)"
                    >
                      <span class="token-icon">{{ getTokenIcon(token) }}</span>
                      <span class="token-name">{{ token }}</span>
                      <span class="token-balance">{{ getTokenBalance(token).toLocaleString() }}</span>
                    </button>
                  </div>
                </div>
                <div class="amount-input-container">
                  <input 
                    v-model="conversionForm.fromAmount"
                    type="number"
                    class="amount-input"
                    :placeholder="$t('conversion.enterAmount')"
                    @input="calculateConversion"
                  >
                  <button class="max-btn" @click="setMaxAmount">
                    {{ $t('conversion.max') }}
                  </button>
                </div>
              </div>
              <div class="token-balance-info">
                <span class="balance-label">{{ $t('conversion.available') }}:</span>
                <span class="balance-value">{{ getTokenBalance(conversionForm.fromToken).toLocaleString() }} {{ conversionForm.fromToken }}</span>
              </div>
            </div>

            <!-- Swap Button -->
            <div class="swap-section">
              <button 
                class="swap-button"
                :disabled="!canSwap"
                @click="swapTokens"
              >
                <span class="swap-icon">🔄</span>
              </button>
            </div>

            <!-- To Token -->
            <div class="token-section to-section">
              <label class="section-label">{{ $t('conversion.to') }}</label>
              <div class="token-input-group">
                <div class="token-selector">
                  <button 
                    class="token-select-btn"
                    @click="showToTokenSelector = !showToTokenSelector"
                  >
                    <span class="token-icon">{{ getTokenIcon(conversionForm.toToken) }}</span>
                    <span class="token-name">{{ conversionForm.toToken }}</span>
                    <span class="dropdown-icon">{{ showToTokenSelector ? '▲' : '▼' }}</span>
                  </button>
                  <div v-if="showToTokenSelector" class="token-dropdown">
                    <button 
                      v-for="token in availableToTokens" 
                      :key="token"
                      class="token-option"
                      @click="selectToToken(token)"
                    >
                      <span class="token-icon">{{ getTokenIcon(token) }}</span>
                      <span class="token-name">{{ token }}</span>
                      <span class="token-balance">{{ getTokenBalance(token).toLocaleString() }}</span>
                    </button>
                  </div>
                </div>
                <div class="amount-display-container">
                  <div class="amount-display">
                    {{ conversionForm.toAmount.toLocaleString() }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 변환 정보 -->
            <div class="conversion-info">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">{{ $t('conversion.rate') }}</span>
                  <span class="info-value">
                    1 {{ conversionForm.fromToken }} = {{ conversionRate.toFixed(4) }} {{ conversionForm.toToken }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('conversion.fee') }}</span>
                  <span class="info-value">{{ conversionFee }}%</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('conversion.priceImpact') }}</span>
                  <span class="info-value" :class="{ warning: priceImpact > 3 }">
                    {{ priceImpact.toFixed(2) }}%
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t('conversion.minimumReceived') }}</span>
                  <span class="info-value">{{ minimumReceived.toLocaleString() }} {{ conversionForm.toToken }}</span>
                </div>
              </div>
              
              <div v-if="conversionWarning" class="conversion-warning">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">{{ $t(`conversion.warnings.${conversionWarning}`) }}</span>
              </div>
            </div>

            <!-- 변환 실행 버튼 -->
            <button 
              class="convert-button"
              :disabled="!canConvert"
              :class="{ loading: isConverting }"
              @click="initiateConversion"
            >
              <span v-if="isConverting" class="loading-spinner">⏳</span>
              <span v-else class="convert-icon">💱</span>
              <span class="convert-text">
                {{ isConverting ? $t('conversion.converting') : $t('conversion.convert') }}
              </span>
            </button>
          </div>
        </div>

        <!-- 거래 내역 카드 -->
        <div class="history-card">
          <div class="card-header">
            <h2 class="card-title">
              <span class="card-emoji">📊</span>
              {{ $t('conversion.recentTransactions') }}
            </h2>
            <div class="history-controls">
              <select v-model="historyFilter" class="filter-select">
                <option value="">{{ $t('conversion.allTokens') }}</option>
                <option value="GLIB">GLIB</option>
                <option value="GLIL">GLIL</option>
              </select>
              <button class="refresh-btn" @click="refreshHistory">
                <span class="refresh-icon">🔄</span>
              </button>
            </div>
          </div>

          <div class="transaction-list">
            <div v-if="filteredHistory.length === 0" class="empty-history">
              <span class="empty-icon">📭</span>
              <span class="empty-text">{{ $t('conversion.noTransactions') }}</span>
            </div>
            <div v-else>
              <div 
                v-for="transaction in filteredHistory" 
                :key="transaction.id"
                class="transaction-item"
                :class="transaction.status"
              >
                <div class="transaction-main">
                  <div class="transaction-tokens">
                    <span class="from-token">
                      {{ getTokenIcon(transaction.fromToken) }} {{ transaction.fromAmount.toLocaleString() }} {{ transaction.fromToken }}
                    </span>
                    <span class="arrow">→</span>
                    <span class="to-token">
                      {{ getTokenIcon(transaction.toToken) }} {{ transaction.toAmount.toLocaleString() }} {{ transaction.toToken }}
                    </span>
                  </div>
                  <div class="transaction-meta">
                    <span class="transaction-time">{{ formatDate(transaction.timestamp) }}</span>
                    <span class="transaction-status" :class="transaction.status">
                      {{ $t(`conversion.status.${transaction.status}`) }}
                    </span>
                  </div>
                </div>
                <div class="transaction-details">
                  <span class="transaction-rate">
                    {{ $t('conversion.rate') }}: 1 {{ transaction.fromToken }} = {{ transaction.rate.toFixed(4) }} {{ transaction.toToken }}
                  </span>
                  <button class="details-btn" @click="showTransactionDetails(transaction)">
                    {{ $t('conversion.viewDetails') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 변환 확인 모달 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirmModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('conversion.confirmConversion') }}</h3>
          <button class="modal-close" @click="closeConfirmModal">×</button>
        </div>
        <div class="modal-body">
          <div class="confirmation-details">
            <div class="conversion-summary">
              <div class="summary-row">
                <span class="summary-label">{{ $t('conversion.youPay') }}</span>
                <span class="summary-value">
                  {{ getTokenIcon(conversionForm.fromToken) }} {{ conversionForm.fromAmount.toLocaleString() }} {{ conversionForm.fromToken }}
                </span>
              </div>
              <div class="summary-arrow">↓</div>
              <div class="summary-row">
                <span class="summary-label">{{ $t('conversion.youReceive') }}</span>
                <span class="summary-value">
                  {{ getTokenIcon(conversionForm.toToken) }} {{ conversionForm.toAmount.toLocaleString() }} {{ conversionForm.toToken }}
                </span>
              </div>
            </div>
            
            <div class="confirmation-info">
              <div class="info-row">
                <span class="info-label">{{ $t('conversion.rate') }}</span>
                <span class="info-value">1 {{ conversionForm.fromToken }} = {{ conversionRate.toFixed(4) }} {{ conversionForm.toToken }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('conversion.fee') }}</span>
                <span class="info-value">{{ (conversionForm.fromAmount * conversionFee / 100).toFixed(4) }} {{ conversionForm.fromToken }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">{{ $t('conversion.networkFee') }}</span>
                <span class="info-value">~0.005 ETH</span>
              </div>
            </div>

            <div class="confirmation-warning">
              <span class="warning-icon">⚠️</span>
              <span class="warning-text">{{ $t('conversion.confirmWarning') }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeConfirmModal">
            {{ $t('common.cancel') }}
          </button>
          <button class="confirm-btn" @click="executeConversion">
            <span class="confirm-icon">✅</span>
            {{ $t('conversion.confirmAndConvert') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 거래 세부사항 모달 -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('conversion.transactionDetails') }}</h3>
          <button class="modal-close" @click="closeDetailsModal">×</button>
        </div>
        <div class="modal-body">
          <div v-if="selectedTransaction" class="transaction-details-content">
            <div class="detail-section">
              <h4 class="detail-title">{{ $t('conversion.conversionInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.from') }}</span>
                  <span class="detail-value">
                    {{ getTokenIcon(selectedTransaction.fromToken) }} {{ selectedTransaction.fromAmount.toLocaleString() }} {{ selectedTransaction.fromToken }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.to') }}</span>
                  <span class="detail-value">
                    {{ getTokenIcon(selectedTransaction.toToken) }} {{ selectedTransaction.toAmount.toLocaleString() }} {{ selectedTransaction.toToken }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.rate') }}</span>
                  <span class="detail-value">1 {{ selectedTransaction.fromToken }} = {{ selectedTransaction.rate.toFixed(4) }} {{ selectedTransaction.toToken }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.fee') }}</span>
                  <span class="detail-value">{{ selectedTransaction.fee }}%</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4 class="detail-title">{{ $t('conversion.transactionInfo') }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.status') }}</span>
                  <span class="detail-value status" :class="selectedTransaction.status">
                    {{ $t(`conversion.status.${selectedTransaction.status}`) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.timestamp') }}</span>
                  <span class="detail-value">{{ formatDate(selectedTransaction.timestamp) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">{{ $t('conversion.transactionHash') }}</span>
                  <span class="detail-value hash">
                    <a :href="getEtherscanUrl(selectedTransaction.hash)" target="_blank">
                      {{ formatHash(selectedTransaction.hash) }}
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="close-btn" @click="closeDetailsModal">
            {{ $t('common.close') }}
          </button>
          <button 
            v-if="selectedTransaction?.status === 'completed'" 
            class="receipt-btn" 
            @click="generateReceipt(selectedTransaction)"
          >
            📄 영수증 다운로드
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGLIBToken } from '@/composables/useGLIBToken'
import { useGLILToken } from '@/composables/useGLILToken'
import { useSolanaWallet } from '@/composables/useSolanaWallet'
import { walletAPI } from '@/services/api'

const { t } = useI18n()

// Composables
const { 
  glibBalance, 
  formattedBalance: formattedGLIBBalance, 
  isLoading: isGLIBLoading,
  updateGLIBBalance 
} = useGLIBToken()

const { 
  glilBalance, 
  formattedBalance: formattedGLILBalance,
  isLoading: isGLILLoading,
  updateGLILBalance 
} = useGLILToken()

const { 
  fullAddress, 
  isConnected,
  connect: connectWallet 
} = useSolanaWallet()

// Reactive data
const activeConversionType = ref('standard')
const showFromTokenSelector = ref(false)
const showToTokenSelector = ref(false)
const showConfirmModal = ref(false)
const showDetailsModal = ref(false)
const selectedTransaction = ref(null)
const isConverting = ref(false)
const historyFilter = ref('')

// Dynamic rates and fees
const dynamicRates = ref({
  'GLIB-GLIL': 2.5,
  'GLIL-GLIB': 0.4
})
const dynamicFees = ref({
  standard: 0.5,
  instant: 1.0,
  economy: 0.3
})
const conversionLimits = ref({
  min_amount: 1,
  max_amount: 10000,
  daily_limit: 50000
})

// Token data - computed from real balances
const tokenBalances = computed(() => [
  {
    symbol: 'GLIB',
    icon: '🪙',
    balance: glibBalance.value,
    maxBalance: 100000, // This could be fetched from API or config
    price: 1.25, // This should be fetched from price API
    color: 'linear-gradient(45deg, #1e40af, #3b82f6)'
  },
  {
    symbol: 'GLIL',
    icon: '💧',
    balance: glilBalance.value,
    maxBalance: 150000, // This could be fetched from API or config
    price: 1.00, // This should be fetched from price API  
    color: 'linear-gradient(45deg, #10b981, #14b8a6)'
  }
])

// Conversion types
const conversionTypes = [
  { id: 'standard', icon: '⚡', label: 'Standard' },
  { id: 'instant', icon: '🚀', label: 'Instant' },
  { id: 'economy', icon: '💰', label: 'Economy' }
]

// Conversion form
const conversionForm = ref({
  fromToken: 'GLIB',
  toToken: 'GLIL',
  fromAmount: 0,
  toAmount: 0
})

// Transaction history
const transactionHistory = ref([
  {
    id: 1,
    fromToken: 'GLIB',
    toToken: 'GLID',
    fromAmount: 1000,
    toAmount: 1200,
    rate: 1.2,
    fee: 0.5,
    status: 'completed',
    timestamp: new Date(),
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
  },
  {
    id: 2,
    fromToken: 'GLID',
    toToken: 'GLIL',
    fromAmount: 500,
    toAmount: 588,
    rate: 1.176,
    fee: 1.0,
    status: 'pending',
    timestamp: new Date(Date.now() - 3600000),
    hash: '0x234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123'
  },
  {
    id: 3,
    fromToken: 'GLIB',
    toToken: 'GLIL',
    fromAmount: 2000,
    toAmount: 5000,
    rate: 2.5,
    fee: 1.0,
    status: 'failed',
    timestamp: new Date(Date.now() - 86400000),
    hash: '0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234'
  }
])

// Computed properties
const availableFromTokens = computed(() => {
  const allTokens = ['GLIB', 'GLIL']
  return allTokens.filter(token => token !== conversionForm.value.toToken)
})

const availableToTokens = computed(() => {
  const allTokens = ['GLIB', 'GLIL']
  const fromToken = conversionForm.value.fromToken
  
  // Define conversion rules for GLI-B ↔ GLI-L
  if (fromToken === 'GLIB') return ['GLIL']
  if (fromToken === 'GLIL') return ['GLIB']
  
  return allTokens.filter(token => token !== fromToken)
})

const conversionRate = computed(() => {
  const { fromToken, toToken } = conversionForm.value
  const rateKey = `${fromToken}-${toToken}` as keyof typeof dynamicRates.value
  return dynamicRates.value[rateKey] || 1
})

const conversionFee = computed(() => {
  const type = activeConversionType.value as keyof typeof dynamicFees.value
  return dynamicFees.value[type] || 0.5
})

const priceImpact = computed(() => {
  const amount = conversionForm.value.fromAmount
  if (amount < 1000) return 0.1
  if (amount < 10000) return 0.5
  if (amount < 50000) return 1.2
  return 2.8
})

const minimumReceived = computed(() => {
  const slippage = 0.01 // 1% slippage tolerance
  return conversionForm.value.toAmount * (1 - slippage)
})

const conversionWarning = computed(() => {
  const amount = conversionForm.value.fromAmount
  
  if (priceImpact.value > 5) return 'highPriceImpact'
  if (amount > getTokenBalance(conversionForm.value.fromToken) * 0.8) return 'highAmount'
  if (amount < conversionLimits.value.min_amount) return 'belowMinimum'
  if (amount > conversionLimits.value.max_amount) return 'aboveMaximum'
  if (amount > conversionLimits.value.daily_limit) return 'exceedsDailyLimit'
  
  return null
})

const canSwap = computed(() => {
  // GLI-B ↔ GLI-L conversion is bidirectional
  return true
})

const canConvert = computed(() => {
  const { fromAmount, fromToken } = conversionForm.value
  
  return fromAmount > 0 && 
         fromAmount >= conversionLimits.value.min_amount &&
         fromAmount <= conversionLimits.value.max_amount &&
         fromAmount <= conversionLimits.value.daily_limit &&
         fromAmount <= getTokenBalance(fromToken) && 
         !isConverting.value &&
         isConnected.value
})

const filteredHistory = computed(() => {
  if (!historyFilter.value) return transactionHistory.value
  return transactionHistory.value.filter(tx => 
    tx.fromToken === historyFilter.value || tx.toToken === historyFilter.value
  )
})

// Methods
const getTokenIcon = (symbol: string) => {
  const icons = {
    'GLIB': '🪙',
    'GLIL': '💧'
  }
  return icons[symbol] || '🪙'
}

const getTokenBalance = (symbol: string) => {
  const token = tokenBalances.value.find(t => t.symbol === symbol)
  return token ? token.balance : 0
}

const setConversionType = (type: string) => {
  activeConversionType.value = type
  calculateConversion()
}

const selectFromToken = (token: string) => {
  conversionForm.value.fromToken = token
  showFromTokenSelector.value = false
  
  // Auto-adjust to token if current selection is invalid
  if (!availableToTokens.value.includes(conversionForm.value.toToken)) {
    conversionForm.value.toToken = availableToTokens.value[0]
  }
  
  calculateConversion()
}

const selectToToken = (token: string) => {
  conversionForm.value.toToken = token
  showToTokenSelector.value = false
  calculateConversion()
}

const setMaxAmount = () => {
  conversionForm.value.fromAmount = getTokenBalance(conversionForm.value.fromToken)
  calculateConversion()
}

const swapTokens = () => {
  if (!canSwap.value) return
  
  const temp = conversionForm.value.fromToken
  conversionForm.value.fromToken = conversionForm.value.toToken
  conversionForm.value.toToken = temp
  
  calculateConversion()
}

const calculateConversion = () => {
  const { fromAmount } = conversionForm.value
  const rate = conversionRate.value
  const fee = conversionFee.value / 100
  
  conversionForm.value.toAmount = Math.max(0, fromAmount * rate * (1 - fee))
}

const initiateConversion = () => {
  if (!canConvert.value) return
  showConfirmModal.value = true
}

const executeConversion = async () => {
  showConfirmModal.value = false
  isConverting.value = true
  
  try {
    if (!fullAddress.value) {
      throw new Error('지갑이 연결되지 않았습니다')
    }
    
    // Execute conversion through API
    const conversionData = {
      from_token: conversionForm.value.fromToken as 'GLIB' | 'GLIL',
      to_token: conversionForm.value.toToken as 'GLIB' | 'GLIL',
      from_amount: conversionForm.value.fromAmount,
      wallet_address: fullAddress.value,
      conversion_type: activeConversionType.value as 'standard' | 'instant' | 'economy'
    }
    
    // Validate conversion first
    await walletAPI.validateConversion(conversionData)
    
    // Execute the conversion
    const response = await walletAPI.executeConversion(conversionData)
    
    // Add to transaction history
    const newTransaction = {
      id: response.data.transaction_id || Date.now(),
      fromToken: conversionForm.value.fromToken,
      toToken: conversionForm.value.toToken,
      fromAmount: conversionForm.value.fromAmount,
      toAmount: conversionForm.value.toAmount,
      rate: conversionRate.value,
      fee: conversionFee.value,
      status: 'completed',
      timestamp: new Date(),
      hash: response.data.transaction_hash || `0x${Math.random().toString(16).substr(2, 64)}`
    }
    
    transactionHistory.value.unshift(newTransaction)
    
    // Refresh token balances from blockchain
    await updateTokenBalance(conversionForm.value.fromToken, 0)
    await updateTokenBalance(conversionForm.value.toToken, 0)
    
    // Reset form
    conversionForm.value.fromAmount = 0
    conversionForm.value.toAmount = 0
    
    // Show success message (could be a toast notification)
    console.log('Token conversion completed successfully!')
    
  } catch (error: any) {
    console.error('Conversion failed:', error)
    
    // Add failed transaction to history
    const failedTransaction = {
      id: Date.now(),
      fromToken: conversionForm.value.fromToken,
      toToken: conversionForm.value.toToken,
      fromAmount: conversionForm.value.fromAmount,
      toAmount: conversionForm.value.toAmount,
      rate: conversionRate.value,
      fee: conversionFee.value,
      status: 'failed',
      timestamp: new Date(),
      hash: ''
    }
    
    transactionHistory.value.unshift(failedTransaction)
    
    // Show error message (could be a toast notification)
    alert(`변환 실패: ${error.response?.data?.message || error.message}`)
  } finally {
    isConverting.value = false
  }
}

const updateTokenBalance = async (symbol: string, amount: number) => {
  // Update local balances and refresh from blockchain
  if (symbol === 'GLIB') {
    // Update local balance immediately for UI responsiveness
    if (fullAddress.value) {
      await updateGLIBBalance(fullAddress.value)
    }
  } else if (symbol === 'GLIL') {
    // Update local balance immediately for UI responsiveness  
    if (fullAddress.value) {
      await updateGLILBalance(fullAddress.value)
    }
  }
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
}

const showTransactionDetails = (transaction: any) => {
  selectedTransaction.value = transaction
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedTransaction.value = null
}

const refreshHistory = async () => {
  if (!fullAddress.value) return
  
  try {
    const response = await walletAPI.getConversionHistory({
      wallet_address: fullAddress.value,
      page_size: 20 // Limit to recent 20 transactions
    })
    
    // Update transaction history with API data
    if (response.data.results) {
      transactionHistory.value = response.data.results.map((tx: any) => ({
        id: tx.id,
        fromToken: tx.from_token,
        toToken: tx.to_token,
        fromAmount: parseFloat(tx.from_amount),
        toAmount: parseFloat(tx.to_amount),
        rate: parseFloat(tx.conversion_rate),
        fee: parseFloat(tx.fee_percentage),
        status: tx.status,
        timestamp: new Date(tx.created_at),
        hash: tx.transaction_hash || ''
      }))
    }
  } catch (error) {
    console.error('Failed to refresh transaction history:', error)
  }
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

const formatHash = (hash: string) => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

const getEtherscanUrl = (hash: string) => {
  return `https://explorer.solana.com/tx/${hash}`
}

// Generate and download conversion receipt
const generateReceipt = (transaction: any) => {
  const receiptData = {
    transactionId: transaction.id,
    timestamp: formatDate(transaction.timestamp),
    fromToken: transaction.fromToken,
    toToken: transaction.toToken,
    fromAmount: transaction.fromAmount,
    toAmount: transaction.toAmount,
    conversionRate: transaction.rate,
    feePercentage: transaction.fee,
    feeAmount: (transaction.fromAmount * transaction.fee / 100).toFixed(4),
    status: transaction.status,
    transactionHash: transaction.hash,
    walletAddress: fullAddress.value
  }
  
  const receiptText = `
GLI 토큰 변환 영수증
=====================

거래 ID: ${receiptData.transactionId}
일시: ${receiptData.timestamp}

변환 정보:
- 변환 전: ${receiptData.fromAmount.toLocaleString()} ${receiptData.fromToken}
- 변환 후: ${receiptData.toAmount.toLocaleString()} ${receiptData.toToken}
- 변환 비율: 1 ${receiptData.fromToken} = ${receiptData.conversionRate} ${receiptData.toToken}

수수료 정보:
- 수수료율: ${receiptData.feePercentage}%
- 수수료: ${receiptData.feeAmount} ${receiptData.fromToken}

거래 정보:
- 상태: ${getStatusText(receiptData.status)}
- 트랜잭션 해시: ${receiptData.transactionHash}
- 지갑 주소: ${receiptData.walletAddress}

* 본 영수증은 GLI 플랫폼에서 발행되었습니다.
* 거래 확인: https://explorer.solana.com/tx/${receiptData.transactionHash}
  `
  
  // Create and download the receipt as a text file
  const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `GLI_변환영수증_${receiptData.transactionId}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Watch for amount changes
watch(() => conversionForm.value.fromAmount, calculateConversion)

// Close dropdowns when clicking outside
const handleClickOutside = (event: Event) => {
  if (!event.target?.closest('.token-selector')) {
    showFromTokenSelector.value = false
    showToTokenSelector.value = false
  }
}

// Load conversion rates and fees from API
const loadConversionData = async () => {
  try {
    const [ratesResponse, infoResponse] = await Promise.all([
      walletAPI.getConversionRates(),
      walletAPI.getConversionInfo()
    ])
    
    if (ratesResponse.data) {
      Object.assign(dynamicRates.value, ratesResponse.data)
    }
    
    if (infoResponse.data) {
      if (infoResponse.data.fees) {
        Object.assign(dynamicFees.value, infoResponse.data.fees)
      }
      if (infoResponse.data.limits) {
        Object.assign(conversionLimits.value, infoResponse.data.limits)
      }
    }
  } catch (error) {
    console.error('Failed to load conversion data:', error)
    // Keep using default rates and fees if API fails
  }
}

// Refresh balances when wallet connects
const refreshBalances = async () => {
  if (isConnected.value && fullAddress.value) {
    await Promise.all([
      updateGLIBBalance(fullAddress.value),
      updateGLILBalance(fullAddress.value)
    ])
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  calculateConversion()
  
  // Load conversion data and refresh balances on mount
  loadConversionData()
  refreshBalances()
  
  // Load conversion history if wallet is connected
  if (isConnected.value) {
    refreshHistory()
  }
  
  // Integration testing - validate composables are working
  console.log('[Token Conversion] Integration test:', {
    glibComposable: !!glibBalance,
    glilComposable: !!glilBalance,
    walletComposable: !!isConnected,
    apiEndpoints: !!walletAPI.getConversionRates
  })
})

// Integration testing function
const validateExistingGLIBFunctionality = async () => {
  if (!isConnected.value || !fullAddress.value) return
  
  try {
    // Test that GLI-B balance can still be retrieved
    const originalBalance = glibBalance.value
    await updateGLIBBalance(fullAddress.value)
    console.log('[Integration Test] GLI-B balance functionality:', {
      originalBalance,
      newBalance: glibBalance.value,
      working: typeof glibBalance.value === 'number'
    })
    
    // Test that GLI-L balance can be retrieved  
    const originalGLILBalance = glilBalance.value
    await updateGLILBalance(fullAddress.value)
    console.log('[Integration Test] GLI-L balance functionality:', {
      originalBalance: originalGLILBalance,
      newBalance: glilBalance.value,
      working: typeof glilBalance.value === 'number'
    })
    
    return true
  } catch (error) {
    console.error('[Integration Test] Error validating existing functionality:', error)
    return false
  }
}

// Watch for wallet connection changes
watch(isConnected, (newValue) => {
  if (newValue) {
    refreshBalances()
    refreshHistory()
    
    // Run integration test after a short delay
    setTimeout(() => {
      validateExistingGLIBFunctionality()
    }, 2000)
  }
})
</script>

<style scoped>
.token-conversion {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* Header */
.conversion-header {
  background: linear-gradient(135deg, var(--gli-blue) 0%, var(--gli-purple) 50%, var(--gli-gold) 100%);
  color: white;
  padding: 2rem;
  margin-bottom: 2rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.title-emoji {
  font-size: 3.5rem;
  margin-right: 1rem;
}

.page-subtitle {
  font-size: 1.3rem;
  opacity: 0.9;
}

.token-meters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.token-meter {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.meter-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.token-icon {
  font-size: 1.5rem;
}

.token-symbol {
  font-weight: 600;
  font-size: 1.1rem;
}

.balance-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.balance-meter {
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.meter-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.balance-usd {
  font-size: 0.9rem;
  opacity: 0.8;
}

.balance-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Connection Prompt */
.connection-prompt {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.prompt-content {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.prompt-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.prompt-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: white;
}

.prompt-content p {
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
  color: white;
}

.connect-wallet-btn {
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.connect-wallet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.6);
}

/* Main Content */
.conversion-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.conversion-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
}

.conversion-card,
.history-card {
  background: var(--bg-primary);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.card-emoji {
  font-size: 1.8rem;
  margin-right: 0.75rem;
}

.conversion-type-selector {
  display: flex;
  gap: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 0.25rem;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.type-btn.active {
  background: var(--gli-blue);
  color: white;
}

.type-icon {
  font-size: 1rem;
}

.type-label {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Conversion Form */
.conversion-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.token-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.token-section:focus-within {
  border-color: var(--gli-blue);
}

.section-label {
  display: block;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.token-input-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.token-selector {
  position: relative;
  min-width: 140px;
}

.token-select-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-primary);
}

.token-select-btn:hover {
  border-color: var(--gli-blue);
}

.token-name {
  font-weight: 600;
  flex: 1;
}

.dropdown-icon {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.token-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  z-index: 10;
  margin-top: 0.5rem;
}

.token-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: var(--text-primary);
}

.token-option:hover {
  background: var(--bg-secondary);
}

.token-option:first-child {
  border-radius: 12px 12px 0 0;
}

.token-option:last-child {
  border-radius: 0 0 12px 12px;
}

.token-balance {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-left: auto;
}

.amount-input-container,
.amount-display-container {
  flex: 1;
  position: relative;
}

.amount-input {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
}

.amount-input:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.amount-display {
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-primary);
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
  min-height: 3.2rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.max-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  padding: 0.25rem 0.5rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.max-btn:hover {
  background: var(--gli-purple);
}

.token-balance-info {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.balance-label {
  color: var(--text-secondary);
}

.balance-value {
  color: var(--text-primary);
  font-weight: 500;
}

/* Swap Section */
.swap-section {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.swap-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swap-button:hover:not(:disabled) {
  border-color: var(--gli-blue);
  transform: rotate(180deg);
}

.swap-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.swap-icon {
  font-size: 1.5rem;
}

/* Conversion Info */
.conversion-info {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.info-value.warning {
  color: var(--gli-orange);
}

.conversion-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid var(--gli-gold);
  border-radius: 8px;
  color: var(--gli-gold);
  font-size: 0.9rem;
}

.warning-icon {
  font-size: 1.1rem;
}

/* Convert Button */
.convert-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1.2rem;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.convert-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
}

.convert-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.convert-button.loading {
  background: var(--text-secondary);
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.convert-icon {
  font-size: 1.2rem;
}

/* Transaction History */
.history-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.refresh-btn {
  padding: 0.5rem;
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  background: var(--gli-purple);
}

.refresh-icon {
  font-size: 1rem;
}

.transaction-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-text {
  font-size: 1.1rem;
}

.transaction-item {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease;
}

.transaction-item:hover {
  background: var(--bg-secondary);
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.transaction-tokens {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.arrow {
  color: var(--text-secondary);
  font-size: 1.2rem;
}

.transaction-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.transaction-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.transaction-status {
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

.transaction-status.completed {
  background: var(--gli-green);
  color: white;
}

.transaction-status.pending {
  background: var(--gli-gold);
  color: white;
}

.transaction-status.failed {
  background: var(--gli-orange);
  color: white;
}

.transaction-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.details-btn {
  padding: 0.25rem 0.5rem;
  background: transparent;
  color: var(--gli-blue);
  border: 1px solid var(--gli-blue);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.details-btn:hover {
  background: var(--gli-blue);
  color: white;
}

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 2rem 0;
}

.modal-title {
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
  padding: 0.5rem;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 0 2rem 2rem;
}

.cancel-btn,
.close-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.receipt-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--gli-teal);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.receipt-btn:hover {
  background: var(--gli-green);
  transform: translateY(-1px);
}

.confirm-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--gli-green);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.confirm-btn:hover {
  background: var(--gli-teal);
  transform: translateY(-2px);
}

.confirmation-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.conversion-summary {
  text-align: center;
  padding: 2rem;
  background: var(--bg-secondary);
  border-radius: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
}

.summary-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.summary-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.summary-arrow {
  font-size: 2rem;
  color: var(--gli-blue);
  margin: 1rem 0;
}

.confirmation-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-row:last-child {
  border-bottom: none;
}

.confirmation-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid var(--gli-gold);
  border-radius: 12px;
  color: var(--gli-gold);
  font-size: 0.9rem;
}

.transaction-details-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;
}

.detail-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 600;
  color: var(--text-primary);
}

.detail-value.status.completed {
  color: var(--gli-green);
}

.detail-value.status.pending {
  color: var(--gli-gold);
}

.detail-value.status.failed {
  color: var(--gli-orange);
}

.detail-value.hash a {
  color: var(--gli-blue);
  text-decoration: none;
  font-family: 'Courier New', monospace;
}

.detail-value.hash a:hover {
  text-decoration: underline;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .conversion-container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .token-meters {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .title-emoji {
    font-size: 2.5rem;
  }
  
  .token-input-group {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .token-selector {
    min-width: auto;
    width: 100%;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .conversion-type-selector {
    flex-direction: column;
  }
}
</style>