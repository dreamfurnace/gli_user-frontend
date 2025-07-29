import './assets/main.css'
import './assets/common.css'
import './assets/gli-luxury-theme.css'
import './styles/tokens.css'
import './styles/architecture/index.css'
import './styles/responsive.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useSideMenuStore } from './stores/sideMenuStore'
import { useAuthStore } from './stores/auth'

// 서비스 워커 등록 (프로덕션 환경에서만)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

// 스토어 초기화
const sideMenuStore = useSideMenuStore()
sideMenuStore.initialize()
sideMenuStore.resetState() // 올바른 기본 상태로 초기화

// 인증 스토어 초기화
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
