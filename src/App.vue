<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import GLIHeader from '@/components/GLIHeader.vue'
import GLILeftSidebar from '@/components/GLILeftSidebar.vue'
import GLIRightPanel from '@/components/GLIRightPanel.vue'
import { useThemeStore } from '@/stores/theme'
import { useWeb3Store } from '@/stores/web3'
import '@/styles/animations/transitions.css'
import '@/styles/animations/keyframes.css'

const themeStore = useThemeStore()
const web3Store = useWeb3Store()

onMounted(() => {
  // 테마 초기화
  themeStore.loadTheme()
  
  // Web3 초기화
  web3Store.init()
})
</script>

<template>
  <div class="app-container">
    <GLIHeader />
    <GLILeftSidebar />
    
    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </RouterView>
    </main>
    
    <GLIRightPanel />
  </div>
</template>

<style>
/* CSS 변수 정의 */
:root {
  /* Light theme */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* GLI Brand Colors - Metallic Theme */
  --gli-blue: #1e40af; /* Metallic Blue */
  --gli-blue-light: #3b82f6;
  --gli-blue-dark: #1e3a8a;
  --gli-gold: #d4af37; /* Metallic Gold */
  --gli-gold-light: #f7e98b;
  --gli-gold-dark: #b8860b;
  --gli-gray: #374151; /* Dark Gray */
  --gli-gray-light: #6b7280;
  --gli-gray-dark: #1f2937;
  
  /* Extended Brand Palette */
  --gli-purple: #8b5cf6;
  --gli-green: #10b981;
  --gli-orange: #f97316;
  --gli-teal: #14b8a6;
  --gli-red: #ef4444;
  
  /* Semantic Colors */
  --success-color: var(--gli-green);
  --warning-color: var(--gli-gold);
  --error-color: var(--gli-red);
  --info-color: var(--gli-blue);
  
  /* Gradients */
  --gradient-primary: linear-gradient(135deg, var(--gli-blue), var(--gli-purple));
  --gradient-gold: linear-gradient(135deg, var(--gli-gold), var(--gli-gold-light));
  --gradient-dark: linear-gradient(135deg, var(--gli-gray), var(--gli-gray-dark));
}

.dark {
  /* Dark theme */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --border-color: #334155;
  --border-light: #475569;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
  
  /* Dark theme brand adjustments */
  --gli-blue: #3b82f6;
  --gli-blue-light: #60a5fa;
  --gli-blue-dark: #1d4ed8;
  --gli-gold: #fbbf24;
  --gli-gold-light: #fcd34d;
  --gli-gold-dark: #d97706;
  --gli-gray: #6b7280;
  --gli-gray-light: #9ca3af;
  --gli-gray-dark: #374151;
  
  /* Dark theme gradients */
  --gradient-primary: linear-gradient(135deg, var(--gli-blue), var(--gli-purple));
  --gradient-gold: linear-gradient(135deg, var(--gli-gold), var(--gli-gold-light));
  --gradient-dark: linear-gradient(135deg, var(--gli-gray-dark), #111827);
}

/* 기본 리셋 스타일 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: 'Inter', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-primary);
}

body {
  min-height: 100vh;
  overflow-x: hidden;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* App 레이아웃 */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-left: 280px; /* 사이드바 너비 */
  margin-right: 320px; /* Right Panel 너비 */
  margin-top: 80px; /* 헤더 높이 */
  padding: 2rem;
  background: var(--bg-secondary);
  min-height: calc(100vh - 80px);
  transition: margin-left 0.3s ease, margin-right 0.3s ease;
}

/* 기본 링크 스타일 */
a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s ease;
}

/* 기본 버튼 스타일 */
button {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: all 0.3s ease;
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--gli-blue);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gli-purple);
}

/* 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 반응형 */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    margin-right: 0;
    padding: 1rem;
  }
}

/* 유틸리티 클래스 */
.text-gradient {
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.btn-primary {
  background: var(--gradient-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.btn-gold {
  background: var(--gradient-gold);
  color: var(--gli-gray-dark);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}
</style>
