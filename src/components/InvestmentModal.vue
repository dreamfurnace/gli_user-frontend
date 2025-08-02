<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ asset.name }} 투자하기</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 자산 정보 -->
        <div class="asset-info">
          <div class="asset-image">
            <img :src="asset.main_image_url || '/placeholder-asset.jpg'" :alt="asset.name">
          </div>
          <div class="asset-details">
            <h3>{{ asset.name }}</h3>
            <p class="asset-description">{{ asset.short_description }}</p>
            
            <div class="asset-stats">
              <div class="stat-item">
                <span class="label">예상 APY</span>
                <span class="value apy">{{ asset.expected_apy }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">위험도</span>
                <span class="value" :class="`risk-${asset.risk_level}`">
                  {{ getRiskLevelDisplay(asset.risk_level) }}
                </span>
              </div>
              <div class="stat-item">
                <span class="label">투자 기간</span>
                <span class="value">{{ asset.investment_period_months }}개월</span>
              </div>
              <div class="stat-item">
                <span class="label">펀딩 진행률</span>
                <span class="value">{{ asset.funding_progress?.toFixed(1) || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- GLI-B 토큰 잔액 -->
        <div class="balance-section">
          <div class="balance-header">
            <h4>💰 GLI-B 토큰 잔액</h4>
            <button v-if="isConnected" class="refresh-btn" @click="refreshBalance" :disabled="isBalanceLoading">
              <span v-if="isBalanceLoading" class="loading-spinner small"></span>
              <span v-else>🔄</span>
            </button>
          </div>
          <div class="balance-display">
            <div v-if="!isConnected" class="balance-warning">
              ⚠️ 지갑을 연결해주세요
            </div>
            <div v-else-if="isBalanceLoading" class="balance-loading">
              <span class="loading-spinner small"></span>
              잔액 확인 중...
            </div>
            <div v-else class="balance-amount">
              <span class="balance-value">{{ formattedBalance }}</span>
              <span class="balance-unit">GLI-B</span>
            </div>
          </div>
        </div>

        <!-- 투자 폼 -->
        <div class="investment-form">
          <div class="form-group">
            <label for="investment-amount">투자 금액 (GLI-B)</label>
            <div class="input-group">
              <input 
                id="investment-amount"
                v-model="investmentAmount" 
                type="number" 
                :min="asset.min_investment_gleb"
                :max="asset.max_investment_gleb || undefined"
                :placeholder="`최소 ${asset.min_investment_gleb} GLEB`"
                step="0.00000001"
                @input="calculateReturns"
              >
              <span class="input-unit">GLEB</span>
            </div>
            <div class="input-constraints">
              <div class="constraint-row">
                <span class="min-amount">최소: {{ formatNumber(asset.min_investment_gleb) }} GLI-B</span>
                <span v-if="asset.max_investment_gleb" class="max-amount">
                  최대: {{ formatNumber(asset.max_investment_gleb) }} GLI-B
                </span>
              </div>
              <div class="balance-constraint">
                <span class="available-balance">보유: {{ formattedBalance }} GLI-B</span>
                <button 
                  v-if="isConnected && glibBalance > 0" 
                  class="max-btn" 
                  @click="setMaxAmount"
                  type="button"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <!-- 예상 수익 계산 -->
          <div v-if="expectedReturns" class="returns-preview">
            <h4>예상 수익 ({{ asset.investment_period_months }}개월 후)</h4>
            <div class="returns-info">
              <div class="return-item">
                <span class="label">투자 원금</span>
                <span class="value">{{ formatNumber(investmentAmount) }} GLEB</span>
              </div>
              <div class="return-item">
                <span class="label">예상 수익</span>
                <span class="value profit">+{{ formatNumber(expectedReturns.profit) }} GLEB</span>
              </div>
              <div class="return-item total">
                <span class="label">예상 총액</span>
                <span class="value">{{ formatNumber(expectedReturns.total) }} GLEB</span>
              </div>
            </div>
          </div>

          <!-- 투자 조건 동의 -->
          <div class="agreement-section">
            <label class="checkbox-label">
              <input v-model="agreedToTerms" type="checkbox">
              <span class="checkmark"></span>
              투자 약관 및 위험 고지사항에 동의합니다
            </label>
            <label class="checkbox-label">
              <input v-model="understoodRisks" type="checkbox">
              <span class="checkmark"></span>
              투자 위험을 충분히 이해했습니다
            </label>
          </div>

          <!-- 투자 유효성 검사 오류 -->
          <div v-if="validationErrors.length > 0" class="validation-errors">
            <h5>⚠️ 투자 조건 확인</h5>
            <ul>
              <li v-for="error in validationErrors" :key="error" class="validation-error">
                {{ error }}
              </li>
            </ul>
          </div>

          <!-- 에러/성공 메시지 -->
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal" :disabled="isLoading">
          취소
        </button>
        <button 
          class="btn-invest" 
          @click="submitInvestment" 
          :disabled="!canInvest || isLoading"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>{{ formatNumber(investmentAmount || 0) }} GLEB 투자하기</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { investInRWAAsset, walletAPI } from '../services/api'
import { useGLIBToken } from '../composables/useGLIBToken'
import { useSolanaWallet } from '../composables/useSolanaWallet'

interface RWAAsset {
  id: string
  name: string
  short_description: string
  expected_apy: number
  risk_level: string
  investment_period_months: number
  min_investment_gleb: number
  max_investment_gleb?: number
  main_image_url?: string
  funding_progress?: number
}

interface Props {
  show: boolean
  asset: RWAAsset
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  'investment-success': [investment: any]
}>()

// Composables
const { 
  glibBalance, 
  formattedBalance, 
  isLoading: isBalanceLoading,
  updateGLIBBalance,
  validateInvestmentAmount,
  hasEnoughGLIB
} = useGLIBToken()

const { fullAddress, isConnected } = useSolanaWallet()

// 반응형 데이터
const investmentAmount = ref<number | null>(null)
const agreedToTerms = ref(false)
const understoodRisks = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationErrors = ref<string[]>([])

// 예상 수익 계산
const expectedReturns = computed(() => {
  if (!investmentAmount.value || investmentAmount.value <= 0) return null
  
  const principal = investmentAmount.value
  const monthlyRate = props.asset.expected_apy / 100 / 12
  const months = props.asset.investment_period_months
  
  // 복리 계산
  const total = principal * Math.pow(1 + monthlyRate, months)
  const profit = total - principal
  
  return {
    principal,
    profit,
    total
  }
})

// 실시간 투자 유효성 검사
const validateInvestment = () => {
  if (!investmentAmount.value) {
    validationErrors.value = []
    return
  }
  
  const validation = validateInvestmentAmount(investmentAmount.value, props.asset)
  validationErrors.value = validation.errors
}

// 투자 가능 여부
const canInvest = computed(() => {
  if (!investmentAmount.value) return false
  if (!isConnected.value) return false
  if (validationErrors.value.length > 0) return false
  if (!agreedToTerms.value || !understoodRisks.value) return false
  return true
})

// 위험도 표시 텍스트
const getRiskLevelDisplay = (riskLevel: string): string => {
  const riskLevels: Record<string, string> = {
    'low': '낮음',
    'medium': '보통',
    'high': '높음',
    'very_high': '매우 높음'
  }
  return riskLevels[riskLevel] || riskLevel
}

// 숫자 포맷팅
const formatNumber = (value: number): string => {
  if (!value) return '0'
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(value)
}

// 수익 계산 및 유효성 검사
const calculateReturns = () => {
  // computed에서 자동으로 계산됨
  validateInvestment()
}

// GLI-B 잔액 새로고침
const refreshBalance = async () => {
  if (fullAddress.value) {
    await updateGLIBBalance(fullAddress.value)
  }
}

// 최대 투자 가능 금액 설정
const setMaxAmount = () => {
  if (!glibBalance.value) return
  
  const maxPossible = Math.min(
    glibBalance.value,
    props.asset.max_investment_gleb || glibBalance.value
  )
  
  const maxAllowed = Math.max(props.asset.min_investment_gleb, maxPossible)
  investmentAmount.value = Math.floor(maxAllowed * 100000000) / 100000000 // Round to 8 decimals
  
  validateInvestment()
}

// 모달 닫기
const closeModal = () => {
  if (isLoading.value) return
  resetForm()
  emit('update:show', false)
}

// 폼 리셋
const resetForm = () => {
  investmentAmount.value = null
  agreedToTerms.value = false
  understoodRisks.value = false
  errorMessage.value = ''
  successMessage.value = ''
  validationErrors.value = []
  isLoading.value = false
}

// 투자 실행
const submitInvestment = async () => {
  if (!canInvest.value || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  validationErrors.value = []
  
  try {
    // 투자 전 마지막 유효성 검사
    if (fullAddress.value) {
      const validationResult = await walletAPI.validateInvestment({
        asset_id: props.asset.id,
        amount_gleb: investmentAmount.value!,
        wallet_address: fullAddress.value
      })
      
      if (!validationResult.data.valid) {
        validationErrors.value = [validationResult.data.message || '투자 조건을 만족하지 않습니다']
        return
      }
    }
    
    const investmentData = {
      amount_gleb: investmentAmount.value!,
      amount_usd_at_time: 0, // USD 가치는 백엔드에서 계산
    }
    
    const response = await investInRWAAsset(props.asset.id, investmentData)
    
    successMessage.value = '🎉 투자가 성공적으로 완료되었습니다!'
    emit('investment-success', response.data)
    
    // GLI-B 잔액 업데이트
    if (fullAddress.value) {
      await updateGLIBBalance(fullAddress.value)
    }
    
    // 3초 후 모달 닫기
    setTimeout(() => {
      closeModal()
    }, 3000)
    
  } catch (error: any) {
    console.error('Investment failed:', error)
    const errorMsg = error.response?.data?.error || error.response?.data?.message || '투자 처리 중 오류가 발생했습니다.'
    
    if (error.response?.data?.validation_errors) {
      validationErrors.value = error.response.data.validation_errors
    } else {
      errorMessage.value = errorMsg
    }
  } finally {
    isLoading.value = false
  }
}

// 모달이 열릴 때마다 폼 리셋 및 잔액 로드
watch(() => props.show, async (newValue) => {
  if (newValue) {
    resetForm()
    // 최소 투자 금액을 기본값으로 설정
    investmentAmount.value = props.asset.min_investment_gleb
    
    // GLI-B 잔액 업데이트
    if (fullAddress.value) {
      await updateGLIBBalance(fullAddress.value)
    }
  }
})

// 투자 금액 변경 시 실시간 유효성 검사
watch(investmentAmount, () => {
  validateInvestment()
})

// 컴포넌트 마운트 시 지갑이 연결되어 있으면 잔액 로드
onMounted(() => {
  if (fullAddress.value) {
    updateGLIBBalance(fullAddress.value)
  }
})
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
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
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
  padding: 24px;
}

.asset-info {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.asset-image {
  flex-shrink: 0;
}

.asset-image img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}

.asset-details h3 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.asset-description {
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.5;
}

.asset-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-item .value {
  font-weight: 600;
  color: #111827;
}

.value.apy {
  color: #059669;
}

.value.risk-low {
  color: #059669;
}

.value.risk-medium {
  color: #d97706;
}

.value.risk-high,
.value.risk-very_high {
  color: #dc2626;
}

/* GLI-B Balance Section */
.balance-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.balance-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.refresh-btn {
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.refresh-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-warning {
  color: #f59e0b;
  font-weight: 500;
}

.balance-loading {
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.balance-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

.balance-unit {
  font-size: 1rem;
  color: #64748b;
  font-weight: 500;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.investment-form {
  space-y: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group input {
  width: 100%;
  padding: 12px 60px 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.input-unit {
  position: absolute;
  right: 16px;
  color: #6b7280;
  font-weight: 500;
}

.input-constraints {
  margin-top: 8px;
  font-size: 0.875rem;
}

.constraint-row {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  margin-bottom: 6px;
}

.balance-constraint {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.available-balance {
  color: #059669;
  font-weight: 500;
}

.max-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.max-btn:hover {
  background: #2563eb;
}

.returns-preview {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.returns-preview h4 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.returns-info {
  space-y: 12px;
}

.return-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.return-item.total {
  border-top: 2px solid #e2e8f0;
  padding-top: 12px;
  margin-top: 12px;
  font-weight: 600;
}

.return-item .label {
  color: #64748b;
}

.return-item .value {
  font-weight: 600;
  color: #1e293b;
}

.return-item .value.profit {
  color: #059669;
}

.agreement-section {
  margin-bottom: 24px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 12px;
  width: 18px;
  height: 18px;
}

/* Validation Errors */
.validation-errors {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.validation-errors h5 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #dc2626;
}

.validation-errors ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.validation-error {
  color: #b91c1c;
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 4px;
}

.validation-error:last-child {
  margin-bottom: 0;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.success-message {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #059669;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 16px 16px;
}

.btn-cancel,
.btn-invest {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-invest {
  background: #3b82f6;
  color: white;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-invest:hover:not(:disabled) {
  background: #2563eb;
}

.btn-invest:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff40;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .asset-info {
    flex-direction: column;
  }
  
  .asset-stats {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}
</style>