<template>
  <div class="phone-verification-step">
    <div class="step-description">
      <p>보안을 위해 휴대폰 번호를 인증해주세요.</p>
    </div>

    <div class="verification-form">
      <!-- Phone Number Input -->
      <div v-if="!isVerified" class="phone-input-section">
        <label class="form-label">휴대폰 번호</label>
        <div class="phone-input-wrapper">
          <select v-model="countryCode" class="country-select">
            <option value="+82">🇰🇷 +82</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+86">🇨🇳 +86</option>
            <option value="+81">🇯🇵 +81</option>
          </select>
          <input 
            type="tel"
            v-model="phoneNumber"
            class="phone-input"
            placeholder="휴대폰 번호를 입력하세요"
            @input="onPhoneInput"
            :disabled="codeSent && !canChangeNumber"
          />
          <button 
            v-if="!codeSent"
            class="send-code-btn"
            @click="sendVerificationCode"
            :disabled="isLoading || !isValidPhone"
          >
            인증 코드 전송
          </button>
          <button 
            v-else-if="canChangeNumber"
            class="change-number-btn"
            @click="changePhoneNumber"
            :disabled="isLoading"
          >
            번호 변경
          </button>
        </div>
        <div class="phone-help">
          <p class="help-text">'-' 없이 숫자만 입력해주세요 (예: 01012345678)</p>
        </div>
      </div>

      <!-- Verification Code Input -->
      <div v-if="codeSent && !isVerified" class="code-input-section">
        <label class="form-label">인증 코드</label>
        <div class="code-input-wrapper">
          <input 
            type="text"
            v-model="verificationCode"
            class="code-input"
            placeholder="6자리 인증 코드를 입력하세요"
            maxlength="6"
            @input="onCodeInput"
            @keyup.enter="verifyCode"
          />
          <button 
            class="verify-btn"
            @click="verifyCode"
            :disabled="isLoading || verificationCode.length !== 6"
          >
            인증
          </button>
        </div>
        
        <div class="code-help">
          <p>{{ formattedPhoneNumber }}으로 전송된 6자리 인증 코드를 입력해주세요.</p>
          <button 
            v-if="canResendCode"
            class="resend-link"
            @click="resendVerificationCode"
            :disabled="isLoading"
          >
            코드 재전송
          </button>
          <span v-else class="resend-timer">
            {{ resendCountdown }}초 후 재전송 가능
          </span>
        </div>
      </div>

      <!-- Verification Success -->
      <div v-if="isVerified" class="verification-success">
        <div class="success-icon">✅</div>
        <h4>휴대폰 인증 완료</h4>
        <p>휴대폰 번호가 성공적으로 인증되었습니다.</p>
        <div class="verified-phone">
          인증된 번호: {{ formattedPhoneNumber }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-section">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-section">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button class="retry-btn" @click="retryVerification">
          다시 시도
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useKYC } from '@/composables/useKYC'
import { profileAPI } from '@/services/api'
import { securityLogger } from '@/utils/security'

interface Props {
  userId: string
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  verified: []
  error: [string]
}>()

// Composables
const { verifyPhone } = useKYC()

// State
const countryCode = ref('+82')
const phoneNumber = ref('')
const verificationCode = ref('')
const codeSent = ref(false)
const isVerified = ref(false)
const error = ref('')
const isLocalLoading = ref(false)
const loadingMessage = ref('')
const resendCountdown = ref(0)
const resendTimer = ref<NodeJS.Timeout | null>(null)
const canChangeNumber = ref(true)

// Computed
const isLoading = computed(() => props.isLoading || isLocalLoading.value)
const canResendCode = computed(() => resendCountdown.value === 0 && !isLoading.value)

const isValidPhone = computed(() => {
  const cleanPhone = phoneNumber.value.replace(/[^0-9]/g, '')
  if (countryCode.value === '+82') {
    // Korean phone number validation
    return /^01[016789][0-9]{7,8}$/.test(cleanPhone)
  }
  // Basic validation for other countries
  return cleanPhone.length >= 10 && cleanPhone.length <= 15
})

const formattedPhoneNumber = computed(() => {
  if (!phoneNumber.value) return ''
  
  const cleanPhone = phoneNumber.value.replace(/[^0-9]/g, '')
  if (countryCode.value === '+82' && cleanPhone.length === 11) {
    return `${countryCode.value} ${cleanPhone.slice(0,3)}-${cleanPhone.slice(3,7)}-${cleanPhone.slice(7)}`
  }
  return `${countryCode.value} ${cleanPhone}`
})

// Methods
const loadUserPhone = async () => {
  try {
    isLocalLoading.value = true
    loadingMessage.value = '사용자 정보를 불러오는 중...'
    
    const response = await profileAPI.getProfile(props.userId)
    if (response.data.phone) {
      phoneNumber.value = response.data.phone.replace(countryCode.value, '').trim()
    }
    
    // Check if phone is already verified
    const kycResponse = await profileAPI.getKYCStatus(props.userId)
    if (kycResponse.data.phone_verified) {
      isVerified.value = true
      emit('verified')
    }
    
  } catch (err: any) {
    console.error('Failed to load user phone:', err)
    // Don't show error for missing phone, just continue
  } finally {
    isLocalLoading.value = false
  }
}

const onPhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Remove non-numeric characters and format
  let value = target.value.replace(/[^0-9]/g, '')
  
  if (countryCode.value === '+82') {
    // Korean phone formatting
    if (value.length > 11) value = value.slice(0, 11)
  } else {
    // General phone formatting
    if (value.length > 15) value = value.slice(0, 15)
  }
  
  phoneNumber.value = value
  target.value = value
}

const sendVerificationCode = async () => {
  if (!isValidPhone.value) {
    error.value = '올바른 휴대폰 번호를 입력해주세요.'
    emit('error', error.value)
    return
  }

  try {
    isLocalLoading.value = true
    loadingMessage.value = 'SMS 인증 코드를 전송하는 중...'
    error.value = ''

    const fullPhoneNumber = countryCode.value + phoneNumber.value
    
    // Send SMS verification
    await profileAPI.sendPhoneVerification(props.userId, fullPhoneNumber)
    
    codeSent.value = true
    canChangeNumber.value = false
    startResendCountdown()
    
    securityLogger.log('PHONE_VERIFICATION_CODE_SENT', {
      userId: props.userId,
      phone: formattedPhoneNumber.value,
      timestamp: new Date().toISOString()
    })
    
  } catch (err: any) {
    console.error('Failed to send verification code:', err)
    error.value = err.response?.data?.message || 'SMS 인증 코드 전송에 실패했습니다.'
    emit('error', error.value)
  } finally {
    isLocalLoading.value = false
  }
}

const verifyCode = async () => {
  if (verificationCode.value.length !== 6) {
    error.value = '6자리 인증 코드를 입력해주세요.'
    return
  }

  try {
    isLocalLoading.value = true
    loadingMessage.value = '인증 코드를 확인하는 중...'
    error.value = ''

    const fullPhoneNumber = countryCode.value + phoneNumber.value
    const success = await verifyPhone(props.userId, fullPhoneNumber, verificationCode.value)
    
    if (success) {
      isVerified.value = true
      emit('verified')
      
      securityLogger.log('PHONE_VERIFICATION_SUCCESS', {
        userId: props.userId,
        phone: formattedPhoneNumber.value,
        timestamp: new Date().toISOString()
      })
    } else {
      error.value = '인증 코드가 올바르지 않습니다.'
      emit('error', error.value)
    }
    
  } catch (err: any) {
    console.error('Failed to verify phone:', err)
    error.value = err.response?.data?.message || '휴대폰 인증에 실패했습니다.'
    emit('error', error.value)
  } finally {
    isLocalLoading.value = false
  }
}

const resendVerificationCode = async () => {
  if (!canResendCode.value) return
  
  verificationCode.value = ''
  await sendVerificationCode()
}

const changePhoneNumber = () => {
  codeSent.value = false
  canChangeNumber.value = true
  verificationCode.value = ''
  error.value = ''
  
  if (resendTimer.value) {
    clearInterval(resendTimer.value)
    resendTimer.value = null
  }
  resendCountdown.value = 0
}

const onCodeInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // Only allow numbers
  target.value = target.value.replace(/[^0-9]/g, '')
  verificationCode.value = target.value
  
  // Auto-verify when 6 digits are entered
  if (target.value.length === 6 && !isLoading.value) {
    verifyCode()
  }
}

const startResendCountdown = () => {
  resendCountdown.value = 60 // 60 seconds
  
  resendTimer.value = setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      clearInterval(resendTimer.value!)
      resendTimer.value = null
    }
  }, 1000)
}

const retryVerification = () => {
  error.value = ''
  verificationCode.value = ''
  codeSent.value = false
  canChangeNumber.value = true
  isVerified.value = false
  
  if (resendTimer.value) {
    clearInterval(resendTimer.value)
    resendTimer.value = null
  }
  resendCountdown.value = 0
}

// Initialize
onMounted(async () => {
  await loadUserPhone()
})

onUnmounted(() => {
  if (resendTimer.value) {
    clearInterval(resendTimer.value)
  }
})
</script>

<style scoped>
.phone-verification-step {
  max-width: 500px;
  margin: 0 auto;
}

.step-description {
  text-align: center;
  margin-bottom: 24px;
}

.step-description p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.verification-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.phone-input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.phone-input-wrapper {
  display: flex;
  gap: 8px;
}

.country-select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  min-width: 100px;
}

.phone-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.phone-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2);
}

.phone-input:disabled {
  background: #f8f9fa;
  color: #6c757d;
}

.send-code-btn,
.change-number-btn {
  padding: 12px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  font-size: 14px;
}

.send-code-btn:hover:not(:disabled),
.change-number-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.send-code-btn:disabled,
.change-number-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.change-number-btn {
  background: #6c757d;
}

.change-number-btn:hover:not(:disabled) {
  background: #5a6268;
}

.phone-help {
  font-size: 12px;
  color: #666;
}

.help-text {
  margin: 0;
}

.code-input-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-input-wrapper {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 2px;
  font-family: 'Courier New', monospace;
}

.code-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2);
}

.verify-btn {
  padding: 12px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
}

.verify-btn:hover:not(:disabled) {
  background: #218838;
}

.verify-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.code-help {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.code-help p {
  margin: 0 0 8px 0;
}

.resend-link {
  background: none;
  border: none;
  color: #0d6efd;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;
}

.resend-link:hover:not(:disabled) {
  color: #0b5ed7;
}

.resend-timer {
  color: #6c757d;
  font-size: 14px;
}

.verification-success {
  text-align: center;
  padding: 24px;
  background: #d4edda;
  border-radius: 8px;
  border: 1px solid #28a745;
}

.success-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.verification-success h4 {
  font-size: 18px;
  font-weight: 600;
  color: #155724;
  margin: 0 0 8px 0;
}

.verification-success p {
  font-size: 14px;
  color: #155724;
  margin: 0 0 12px 0;
}

.verified-phone {
  font-size: 14px;
  color: #155724;
  font-weight: 500;
  background: rgba(21, 87, 36, 0.1);
  padding: 8px 12px;
  border-radius: 6px;
  display: inline-block;
}

.loading-section {
  text-align: center;
  padding: 24px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-section p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.error-section {
  text-align: center;
  padding: 20px;
  background: #f8d7da;
  border-radius: 8px;
  border: 1px solid #f5c6cb;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: #721c24;
  margin: 0 0 16px 0;
}

.retry-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .phone-input-wrapper {
    flex-direction: column;
  }
  
  .country-select {
    width: 100%;
  }
  
  .send-code-btn,
  .change-number-btn {
    width: 100%;
  }
  
  .code-input-wrapper {
    flex-direction: column;
  }
  
  .verify-btn {
    width: 100%;
  }
}
</style>