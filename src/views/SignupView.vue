<template>
  <div class="signup-container">
    <div class="signup-header">
      <h1 class="signup-title">GLI Platform</h1>
      <p class="signup-subtitle">회원가입</p>
    </div>

    <form class="signup-form" @submit="handleSignup">
      <div class="input-group">
        <label for="name">이름</label>
        <input type="text" id="name" v-model="name" required />
      </div>
      <div class="input-group">
        <label for="email">이메일</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="input-group">
        <label for="password">비밀번호</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div class="input-group">
        <label for="confirmPassword">비밀번호 확인</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required />
      </div>
      <button type="submit" class="signup-button">회원가입</button>
    </form>

    <div class="login-section">
      <p class="login-text">이미 계정이 있으신가요?</p>
      <button class="login-button" @click="handleLogin">로그인 하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Reactive data
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Methods
const handleSignup = (event: Event) => {
  event.preventDefault()
  if (password.value !== confirmPassword.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }
  console.log('Signup attempt:', { name: name.value, email: email.value })
  router.push('/login')
}

const handleLogin = () => {
  router.push('/login')
}
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

.signup-button:hover {
  background-color: #0b5ed7;
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
