<template>
  <div class="signup-container">
    <div class="signup-header">
      <h1 class="signup-title">GLI Platform</h1>
      <p class="signup-subtitle">회원가입</p>
    </div>

    <form class="signup-form" @submit="handleSignup">
      <div class="input-group">
        <label for="name">이름</label>
        <input 
          type="text" 
          id="name" 
          v-model="name" 
          required 
          @blur="validateNameInput"
          :class="{ 'input-error': validationErrors.some(error => error.includes('이름')) }"
        />
      </div>
      <div class="input-group">
        <label for="email">이메일</label>
        <input 
          type="email" 
          id="email" 
          v-model="email" 
          required 
          @blur="validateEmailInput"
          :class="{ 'input-error': validationErrors.some(error => error.includes('이메일')) }"
        />
      </div>
      <div class="input-group">
        <label for="password">비밀번호</label>
        <input 
          type="password" 
          id="password" 
          v-model="password" 
          required 
          @blur="validatePasswordInput"
          :class="{ 'input-error': validationErrors.some(error => error.includes('비밀번호') && !error.includes('비밀번호 확인') && !error.includes('비밀번호가 일치하지')) }"
        />
      </div>
      <div class="input-group">
        <label for="confirmPassword">비밀번호 확인</label>
        <input 
          type="password" 
          id="confirmPassword" 
          v-model="confirmPassword" 
          required 
          @blur="validateConfirmPasswordInput"
          :class="{ 'input-error': validationErrors.some(error => error.includes('비밀번호 확인') || error.includes('비밀번호가 일치하지')) }"
        />
      </div>
      <button 
        type="submit" 
        class="signup-button"
        :disabled="isRateLimited"
      >
        회원가입
      </button>
    </form>

    <!-- Security validation errors -->
    <div v-if="validationErrors.length > 0" class="error-message">
      <div v-for="error in validationErrors" :key="error" class="error-item">
        {{ error }}
      </div>
    </div>

    <!-- Rate limiting message -->
    <div v-if="isRateLimited" class="error-message security-warning">
      ⚠️ {{ rateLimitMessage }}
    </div>

    <div class="login-section">
      <p class="login-text">이미 계정이 있으신가요?</p>
      <button class="login-button" @click="handleLogin">로그인 하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  sanitizeInput, 
  validateInput, 
  apiRateLimiter, 
  csrfProtection, 
  securityLogger 
} from '@/utils/security'

const router = useRouter()

// Reactive data
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Security-related reactive data
const validationErrors = ref<string[]>([])
const isRateLimited = ref(false)
const rateLimitMessage = ref('')
const csrfToken = ref('')

// Security validation helper
const validateSignupInput = (): boolean => {
  validationErrors.value = []
  
  // Sanitize inputs
  const sanitizedName = sanitizeInput.text(name.value)
  const sanitizedEmail = sanitizeInput.email(email.value)
  const sanitizedPassword = password.value // Don't sanitize password
  const sanitizedConfirmPassword = confirmPassword.value // Don't sanitize password
  
  // Validate name
  const nameError = validateInput.required(sanitizedName, '이름')
  if (nameError) {
    validationErrors.value.push(nameError)
  }
  
  // Validate email
  const emailError = validateInput.required(sanitizedEmail, '이메일') || validateInput.email(sanitizedEmail)
  if (emailError) {
    validationErrors.value.push(emailError)
  }
  
  // Validate password
  const passwordError = validateInput.required(sanitizedPassword, '비밀번호') || validateInput.password(sanitizedPassword)
  if (passwordError) {
    validationErrors.value.push(passwordError)
  }
  
  // Validate password confirmation
  const confirmPasswordError = validateInput.required(sanitizedConfirmPassword, '비밀번호 확인')
  if (confirmPasswordError) {
    validationErrors.value.push(confirmPasswordError)
  } else if (sanitizedPassword !== sanitizedConfirmPassword) {
    validationErrors.value.push('비밀번호가 일치하지 않습니다.')
  }
  
  // Update sanitized values
  if (sanitizedName !== name.value) {
    name.value = sanitizedName
  }
  if (sanitizedEmail !== email.value) {
    email.value = sanitizedEmail
  }
  
  return validationErrors.value.length === 0
}

// Rate limiting check
const checkRateLimit = (): boolean => {
  const identifier = email.value || 'anonymous'
  
  if (apiRateLimiter.isRateLimited(identifier)) {
    isRateLimited.value = true
    rateLimitMessage.value = '회원가입 시도 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.'
    securityLogger.logSuspiciousActivity('SIGNUP_RATE_LIMIT_EXCEEDED', { 
      identifier: sanitizeInput.email(identifier),
      timestamp: new Date().toISOString() 
    })
    return false
  }
  
  isRateLimited.value = false
  rateLimitMessage.value = ''
  return true
}

// Individual input validation methods
const validateNameInput = (): void => {
  const sanitizedName = sanitizeInput.text(name.value)
  const nameError = validateInput.required(sanitizedName, '이름')
  
  // Remove existing name errors
  validationErrors.value = validationErrors.value.filter(error => !error.includes('이름'))
  
  if (nameError) {
    validationErrors.value.push(nameError)
  }
  
  // Update sanitized value
  if (sanitizedName !== name.value) {
    name.value = sanitizedName
  }
}

const validateEmailInput = (): void => {
  const sanitizedEmail = sanitizeInput.email(email.value)
  const emailError = validateInput.required(sanitizedEmail, '이메일') || validateInput.email(sanitizedEmail)
  
  // Remove existing email errors
  validationErrors.value = validationErrors.value.filter(error => !error.includes('이메일'))
  
  if (emailError) {
    validationErrors.value.push(emailError)
  }
  
  // Update sanitized value
  if (sanitizedEmail !== email.value) {
    email.value = sanitizedEmail
  }
}

const validatePasswordInput = (): void => {
  const passwordError = validateInput.required(password.value, '비밀번호')
  
  // Remove existing password errors (but not strength validation during typing)
  validationErrors.value = validationErrors.value.filter(error => !error.includes('비밀번호를 입력해주세요'))
  
  if (passwordError) {
    validationErrors.value.push(passwordError)
  }
}

const validateConfirmPasswordInput = (): void => {
  const confirmPasswordError = validateInput.required(confirmPassword.value, '비밀번호 확인')
  
  // Remove existing confirm password errors
  validationErrors.value = validationErrors.value.filter(error => 
    !error.includes('비밀번호 확인') && !error.includes('비밀번호가 일치하지')
  )
  
  if (confirmPasswordError) {
    validationErrors.value.push(confirmPasswordError)
  } else if (password.value && password.value !== confirmPassword.value) {
    validationErrors.value.push('비밀번호가 일치하지 않습니다.')
  }
}

// Methods
const handleSignup = async (event: Event) => {
  event.preventDefault()
  validationErrors.value = []
  
  // Security validations
  if (!validateSignupInput()) {
    securityLogger.logSuspiciousActivity('INVALID_SIGNUP_INPUT', { 
      email: sanitizeInput.email(email.value),
      errors: validationErrors.value 
    })
    return
  }
  
  if (!checkRateLimit()) {
    return
  }

  try {
    // Log signup attempt
    securityLogger.log('SIGNUP_ATTEMPT', { 
      email: sanitizeInput.email(email.value),
      name: sanitizeInput.text(name.value),
      timestamp: new Date().toISOString() 
    })

    // TODO: Implement actual signup API call
    console.log('Signup attempt:', { 
      name: sanitizeInput.text(name.value), 
      email: sanitizeInput.email(email.value) 
    })

    // Log successful signup
    securityLogger.log('SIGNUP_SUCCESS', { 
      email: sanitizeInput.email(email.value),
      name: sanitizeInput.text(name.value),
      timestamp: new Date().toISOString() 
    })

    // Clear sensitive data
    password.value = ''
    confirmPassword.value = ''
    csrfProtection.clearToken()
    
    router.push('/login')

  } catch (error: any) {
    // Log failed signup
    securityLogger.log('SIGNUP_FAILED', { 
      email: sanitizeInput.email(email.value),
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString() 
    })
    
    // Clear passwords on failed signup
    password.value = ''
    confirmPassword.value = ''
    
    validationErrors.value.push('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.')
  }
}

const handleLogin = () => {
  router.push('/login')
}

// Component mount setup
onMounted(async () => {
  // Initialize CSRF protection
  const token = csrfProtection.generateToken()
  csrfProtection.storeToken(token)
  csrfToken.value = token
  
  // Log page access
  securityLogger.log('SIGNUP_PAGE_ACCESS', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  })
})
</script>

<style scoped>
.signup-container {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.signup-header {
  text-align: center;
  margin-bottom: 30px;
}

.signup-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.signup-subtitle {
  font-size: 14px;
  color: #666;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-group label {
  font-size: 14px;
  color: #333;
}

.input-group input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.input-group input:focus {
  outline: none;
  border-color: #0d6efd;
}

.input-group input.input-error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.input-group input.input-error:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.signup-button {
  padding: 12px;
  background-color: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.signup-button:hover:not(:disabled) {
  background-color: #0b5ed7;
}

.signup-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  font-size: 14px;
}

.error-item {
  margin-bottom: 5px;
}

.error-item:last-child {
  margin-bottom: 0;
}

.security-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  font-weight: 500;
}

.login-section {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.login-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.login-button {
  padding: 12px 24px;
  background-color: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.login-button:hover {
  background-color: #e9ecef;
  border-color: #ccc;
}

/* 페이지 전체 스타일 */
body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
