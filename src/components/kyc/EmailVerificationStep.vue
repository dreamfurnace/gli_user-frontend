<template>
  <div class="email-verification-step">
    <div class="step-description">
      <p>보안을 위해 등록된 이메일 주소를 인증해주세요.</p>
    </div>

    <div class="verification-form">
      <!-- Email Display -->
      <div class="email-display">
        <label class="form-label">인증할 이메일 주소</label>
        <div class="email-value">
          <span class="email">{{ userEmail || '이메일을 불러오는 중...' }}</span>
          <button 
            v-if="!isVerified"
            class="send-code-btn"
            @click="sendVerificationCode"
            :disabled="isLoading || codeSent"
          >
            {{ codeSent ? '코드 전송됨' : '인증 코드 전송' }}
          </button>
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
          <p>이메일로 전송된 6자리 인증 코드를 입력해주세요.</p>
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
        <h4>이메일 인증 완료</h4>
        <p>이메일 주소가 성공적으로 인증되었습니다.</p>
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
const { verifyEmail } = useKYC()

// State
const userEmail = ref('')
const verificationCode = ref('')
const codeSent = ref(false)
const isVerified = ref(false)
const error = ref('')
const isLocalLoading = ref(false)
const loadingMessage = ref('')
const resendCountdown = ref(0)
const resendTimer = ref<NodeJS.Timeout | null>(null)

// Computed
const isLoading = computed(() => props.isLoading || isLocalLoading.value)
const canResendCode = computed(() => resendCountdown.value === 0 && !isLoading.value)

// Methods
const loadUserEmail = async () => {
  try {
    isLocalLoading.value = true
    loadingMessage.value = '사용자 정보를 불러오는 중...'
    
    const response = await profileAPI.getProfile(props.userId)
    userEmail.value = response.data.email
    
    // Check if email is already verified
    const kycResponse = await profileAPI.getKYCStatus(props.userId)
    if (kycResponse.data.email_verified) {
      isVerified.value = true
      emit('verified')
    }
    
  } catch (err: any) {
    console.error('Failed to load user email:', err)
    error.value = '사용자 정보를 불러오는데 실패했습니다.'
    emit('error', error.value)
  } finally {
    isLocalLoading.value = false
  }
}

const sendVerificationCode = async () => {
  if (!userEmail.value) {
    error.value = '이메일 주소가 없습니다.'
    emit('error', error.value)
    return
  }

  try {
    isLocalLoading.value = true
    loadingMessage.value = '인증 코드를 전송하는 중...'
    error.value = ''

    // Send verification email
    await profileAPI.sendEmailVerification(props.userId, userEmail.value)
    
    codeSent.value = true
    startResendCountdown()
    
    securityLogger.log('EMAIL_VERIFICATION_CODE_SENT', {
      userId: props.userId,
      email: userEmail.value,
      timestamp: new Date().toISOString()
    })
    
  } catch (err: any) {
    console.error('Failed to send verification code:', err)
    error.value = err.response?.data?.message || '인증 코드 전송에 실패했습니다.'
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

    const success = await verifyEmail(props.userId, verificationCode.value)
    
    if (success) {
      isVerified.value = true
      emit('verified')
      
      securityLogger.log('EMAIL_VERIFICATION_SUCCESS', {
        userId: props.userId,
        email: userEmail.value,
        timestamp: new Date().toISOString()
      })
    } else {
      error.value = '인증 코드가 올바르지 않습니다.'
      emit('error', error.value)
    }
    
  } catch (err: any) {
    console.error('Failed to verify email:', err)
    error.value = err.response?.data?.message || '이메일 인증에 실패했습니다.'
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
  isVerified.value = false
  
  if (resendTimer.value) {
    clearInterval(resendTimer.value)
    resendTimer.value = null
  }
  resendCountdown.value = 0
}

// Initialize
onMounted(async () => {
  await loadUserEmail()
})

onUnmounted(() => {
  if (resendTimer.value) {
    clearInterval(resendTimer.value)
  }
})
</script>

<style scoped>
.email-verification-step {
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

.email-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.email-value {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.email {
  flex: 1;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.send-code-btn {
  padding: 8px 16px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.send-code-btn:hover:not(:disabled) {
  background: #0b5ed7;
}

.send-code-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
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
  margin: 0;
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
  .email-value {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .send-code-btn {
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