<template>
  <aside class="gli-sidebar" :class="{ 'collapsed': isCollapsed }">
    <div class="sidebar-header">
      <button class="collapse-btn" @click="toggleCollapse">
        <span v-if="isCollapsed">▶️</span>
        <span v-else>◀️</span>
      </button>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link 
              to="/business" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/business') }"
            >
              <span class="nav-icon">📄</span>
              <span class="nav-text" v-if="!isCollapsed">사업 소개</span>
              <span class="nav-tooltip" v-if="isCollapsed">사업 소개</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/rwa-assets" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/rwa-assets') }"
            >
              <span class="nav-icon">🏗️</span>
              <span class="nav-text" v-if="!isCollapsed">RWA 자산 목록</span>
              <span class="nav-tooltip" v-if="isCollapsed">RWA 자산 목록</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/auth" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/auth') }"
            >
              <span class="nav-icon">🔐</span>
              <span class="nav-text" v-if="!isCollapsed">{{ $t('nav.auth') }}</span>
              <span class="nav-tooltip" v-if="isCollapsed">{{ $t('nav.auth') }}</span>
              <span v-if="!isCollapsed && authProgress < 100" class="progress-badge">
                {{ authProgress }}%
              </span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/conversion" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/conversion') }"
            >
              <span class="nav-icon">💱</span>
              <span class="nav-text" v-if="!isCollapsed">{{ $t('nav.conversion') }}</span>
              <span class="nav-tooltip" v-if="isCollapsed">{{ $t('nav.conversion') }}</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/shopping" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/shopping') }"
            >
              <span class="nav-icon">🛍️</span>
              <span class="nav-text" v-if="!isCollapsed">GLI-L 쇼핑몰</span>
              <span class="nav-tooltip" v-if="isCollapsed">GLI-L 쇼핑몰</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/mypage" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/mypage') }"
            >
              <span class="nav-icon">🧑</span>
              <span class="nav-text" v-if="!isCollapsed">{{ $t('nav.mypage') }}</span>
              <span class="nav-tooltip" v-if="isCollapsed">{{ $t('nav.mypage') }}</span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/referral" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/referral') }"
            >
              <span class="nav-icon">🤝</span>
              <span class="nav-text" v-if="!isCollapsed">{{ $t('nav.referral') }}</span>
              <span class="nav-tooltip" v-if="isCollapsed">{{ $t('nav.referral') }}</span>
              <span v-if="!isCollapsed && referralCount > 0" class="count-badge">
                {{ referralCount }}
              </span>
            </router-link>
          </li>

          <li class="nav-item">
            <router-link 
              to="/help-center" 
              class="nav-link"
              :class="{ active: $route.path.startsWith('/help-center') }"
            >
              <span class="nav-icon">📑</span>
              <span class="nav-text" v-if="!isCollapsed">안내 센터</span>
              <span class="nav-tooltip" v-if="isCollapsed">안내 센터</span>
            </router-link>
          </li>
        </ul>
      </div>

      <!-- 토큰 잔액 표시 (확장된 상태에서만) -->
      <div v-if="!isCollapsed && isConnected" class="token-balances">
        <h4 class="balance-title">💰 {{ $t('common.balance') }}</h4>
        <div class="balance-list">
          <div class="balance-item">
            <span class="token-name">GLIB</span>
            <span class="token-amount">{{ tokenBalances.glib }}</span>
          </div>
          <div class="balance-item">
            <span class="token-name">GLID</span>  
            <span class="token-amount">{{ tokenBalances.glid }}</span>
          </div>
          <div class="balance-item">
            <span class="token-name">GLIL</span>
            <span class="token-amount">{{ tokenBalances.glil }}</span>
          </div>
          <div class="balance-item">
            <span class="token-name">USDT</span>
            <span class="token-amount">{{ tokenBalances.usdt }}</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useWeb3Store } from '@/stores/web3'

const route = useRoute()
const { t } = useI18n()
const web3Store = useWeb3Store()

const isCollapsed = ref(false)
const authProgress = ref(65) // 예시 진행률
const referralCount = ref(3) // 예시 레퍼럴 수

const isConnected = computed(() => web3Store.isConnected)
const tokenBalances = computed(() => web3Store.tokenBalances)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.gli-sidebar {
  position: fixed;
  left: 0;
  top: 80px; /* 헤더 높이만큼 */
  height: calc(100vh - 80px);
  width: 280px;
  background: var(--gradient-dark);
  color: white;
  transition: all 0.3s ease;
  z-index: 50;
  box-shadow: var(--shadow-lg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.gli-sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.collapse-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  height: calc(100% - 80px);
}

.nav-section {
  flex: 1;
  padding: 1rem 0;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.collapsed .nav-link {
  padding: 1rem;
  justify-content: center;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: linear-gradient(90deg, var(--gli-blue), var(--gli-purple));
  color: white;
  border-right: 3px solid var(--gli-gold);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.nav-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.nav-text {
  font-weight: 500;
  white-space: nowrap;
}

.nav-tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  margin-left: 1rem;
}

.collapsed .nav-link:hover .nav-tooltip {
  opacity: 1;
}

.progress-badge {
  background: linear-gradient(45deg, #f59e0b, #d97706);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  margin-left: auto;
}

.count-badge {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 50%;
  font-weight: 600;
  margin-left: auto;
  min-width: 1.5rem;
  text-align: center;
}

.token-balances {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
}

.balance-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #fbbf24;
}

.balance-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 3px solid transparent;
}

.balance-item:nth-child(1) {
  border-left-color: #3b82f6; /* GLIB - 파란색 */
}

.balance-item:nth-child(2) {
  border-left-color: #8b5cf6; /* GLID - 보라색 */
}

.balance-item:nth-child(3) {
  border-left-color: #10b981; /* GLIL - 초록색 */
}

.balance-item:nth-child(4) {
  border-left-color: #f59e0b; /* USDT - 주황색 */
}

.token-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.token-amount {
  font-family: monospace;
  font-weight: 600;
  color: #94a3b8;
}

/* 다크 테마 */
:global(.dark) .gli-sidebar {
  background: var(--gradient-dark);
}

:global(.dark) .nav-link.active {
  background: linear-gradient(90deg, var(--gli-blue), var(--gli-purple));
  border-right: 3px solid var(--gli-gold);
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

/* 스크롤바 스타일 */
.gli-sidebar::-webkit-scrollbar {
  width: 6px;
}

.gli-sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.gli-sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.gli-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 반응형 */
@media (max-width: 768px) {
  .gli-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .gli-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>