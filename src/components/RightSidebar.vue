<!--
  ========================================
  우측 사이드바 컴포넌트 개발 매뉴얼
  ========================================
  
  ⚠️  중요: 새로운 페이지에서 우측 사이드바 토글 버튼이 작동하지 않는 문제 해결
  
  1. 필수 구현 사항:
     - 모든 페이지에서 우측 사이드바 토글 버튼이 작동하려면 다음이 필요:
       a) BaseHeader 컴포넌트 사용 (우측 토글 버튼 포함)
       b) useSideMenuStore 스토어 사용
       c) isHidden prop을 올바르게 전달
  
  2. 구현 패턴:
     template:
       BaseHeader /
       div.page-content
         페이지 내용
       RightSidebar :is-hidden="sideMenuStore.rightSidebarHidden" @logout="handleLogout" /
     
     script setup:
       import { useSideMenuStore } from '@/stores/sideMenuStore'
       const sideMenuStore = useSideMenuStore()
  
  3. 문제가 발생한 페이지들:
     - 등기&대장 발급 화면: 우측 사이드바 토글 작동 안함
     - 계약 목록 관리 화면: 우측 사이드바 토글 작동 안함
  
  4. 해결 방법:
     - BaseHeader 컴포넌트가 페이지에 포함되어 있는지 확인
     - useSideMenuStore가 import되어 있는지 확인
     - RightSidebar 컴포넌트에 isHidden prop이 올바르게 전달되는지 확인
     - 페이지에서 사이드바 상태를 직접 관리하지 말고 스토어 사용
  
  5. 디버깅 팁:
     - 브라우저 콘솔에서 "RightSidebar: handleToggleSidebar 호출됨" 로그 확인
     - 스토어 상태 변경 로그 확인
     - DOM 클래스 변경 확인
  
  ========================================
-->

<template>
  <!-- 오버레이 -->
  <div
    class="right-sidebar-overlay"
    :class="{ 'right-sidebar-overlay--active': !isHidden }"
    @click="handleToggleSidebar"
  ></div>

  <aside class="sidebar sidebar--right" :class="{ 'sidebar--hidden': isHidden }">
    <button class="sidebar__close-btn" @click="handleToggleSidebar">
      <span class="sidebar__close-icon">☰</span>
    </button>

    <div class="sidebar__profile">
      <div class="sidebar__profile-wrapper">
        <img
          :src="userProfileImage || defaultProfileImage"
          :alt="`${userName}의 프로필 이미지`"
          class="sidebar__profile-image"
        />
      </div>
      <div class="sidebar__profile-name">{{ userName }}</div>
    </div>

    <nav class="sidebar__nav">
      <router-link to="/profile-edit" class="sidebar__nav-link">내 정보 수정</router-link>
      <router-link to="/user-doc-mgmt" class="sidebar__nav-link">개인 문서 관리</router-link>
      <router-link to="/contractcase-partner-management" class="sidebar__nav-link"
        >파트너 & 계약 목록 관리</router-link
      >
    </nav>

    <div class="sidebar__section">
      <h3 class="sidebar__section-title">계약 목록</h3>
      <div class="sidebar__contract-list">
        <div
          v-for="contract in contracts"
          :key="contract.id"
          class="sidebar__contract-item"
          :class="{ 'sidebar__contract-item--active': selectedContractId === contract.id }"
          @click="selectContract(contract)"
        >
          <span class="sidebar__contract-address">{{ contract.address }}</span>
          <span class="sidebar__contract-date">{{ contract.date }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar__footer">
      <button class="sidebar__logout-btn" @click="$emit('logout')">로그아웃</button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { useAuthStore } from '@/stores/auth'

interface Contract {
  id: string
  address: string
  date: string
}

const props = defineProps<{ isHidden?: boolean }>()
const emit = defineEmits<{
  toggleSidebar: []
  logout: []
}>()
const sideMenuStore = useSideMenuStore()
const authStore = useAuthStore()

// 사용자 정보 computed
const userName = computed(() => authStore.user?.name || '사용자')
const userProfileImage = computed(
  () => authStore.user?.profile_image_url || authStore.user?.profile_image,
)
const defaultProfileImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2U1ZTdlYSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOWNhM2FmIi8+PHBhdGggZD0iTTEwIDgwIEMxMCA2MCAyMCA1MCA1MCA1MCBDODAgNTAgOTAgNjAgOTAgODAgWiIgZmlsbD0iIzljYTNhZiIvPjwvc3ZnPg=='

// isHidden prop 변화 감지
watch(
  () => props.isHidden,
  (newValue, oldValue) => {
    console.log('RightSidebar: isHidden 변경됨', { oldValue, newValue })

    // DOM 요소 확인
    nextTick(() => {
      const sidebar = document.querySelector('.sidebar--right') as HTMLElement
      console.log('RightSidebar: 현재 DOM 클래스:', sidebar?.className)
      console.log(
        'RightSidebar: sidebar--hidden 클래스 포함 여부:',
        sidebar?.classList.contains('sidebar--hidden'),
      )
      console.log('RightSidebar: 현재 right 스타일:', sidebar?.style.right)
    })
  },
  { immediate: true },
)

const selectedContractId = ref<string | null>(null)
const contracts: Contract[] = [
  { id: 'contract-1', address: '성수동 6층 빌라', date: '25/04' },
  { id: 'contract-2', address: '서초1동 지파이브1층', date: '25/01' },
  { id: 'contract-3', address: '강남구 역삼동 123-45', date: '24/12' },
  { id: 'contract-4', address: '마포구 서교동 678-90', date: '24/11' },
]

function selectContract(contract: Contract) {
  selectedContractId.value = contract.id
  // 필요시 emit 등 추가
}

function handleToggleSidebar() {
  console.log('RightSidebar: handleToggleSidebar 호출됨')
  console.log('RightSidebar: 토글 전 상태:', sideMenuStore.rightSidebarHidden)
  console.log('RightSidebar: 토글 전 isHidden prop:', props.isHidden)

  // 스토어 토글 호출
  sideMenuStore.toggleRightSidebar()

  console.log('RightSidebar: 토글 후 상태:', sideMenuStore.rightSidebarHidden)
  console.log('RightSidebar: 토글 후 isHidden prop:', props.isHidden)

  // DOM 상태 확인
  nextTick(() => {
    const sidebar = document.querySelector('.sidebar--right') as HTMLElement
    console.log('RightSidebar: DOM 업데이트 후 클래스:', sidebar?.className)
    console.log(
      'RightSidebar: sidebar--hidden 클래스 포함 여부:',
      sidebar?.classList.contains('sidebar--hidden'),
    )
    console.log('RightSidebar: 현재 right 스타일:', sidebar?.style.right)
  })
}
</script>

<style scoped>
/* Right Sidebar Component Styles */

/* 오버레이 스타일 */
.right-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: none;
  z-index: calc(var(--z-index-right-sidebar) - 1);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.right-sidebar-overlay--active {
  display: block;
  pointer-events: all;
}

/* 오버레이가 활성화되어 있을 때 사이드바는 항상 클릭 가능하도록 설정 */
.right-sidebar-overlay--active + .sidebar--right {
  pointer-events: all;
}

.sidebar--right {
  position: fixed !important;
  top: 0 !important;
  right: -250px; /* 초기 상태를 숨김으로 설정 */
  width: 250px !important;
  height: 100vh !important;
  background-color: #ffffff !important;
  border-left: 1px solid #eee !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  transition: right 0.3s ease !important;
  z-index: var(--z-index-right-sidebar) !important;
  padding: 15px !important;
  pointer-events: all !important;
  display: flex !important;
  flex-direction: column !important;
}

.sidebar--right:not(.sidebar--hidden) {
  right: 0; /* 숨김 상태가 아닐 때 보임 */
}

.sidebar--right.sidebar--hidden {
  /* 오른쪽 사이드바 숨김 시 화면 오른쪽 너머로 이동 */
  right: -250px;
}

.sidebar__close-btn {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  font-size: var(--font-size-lg);
  background: transparent;
  border: 1px solid var(--color-border-light);
  border-radius: 50%;
  width: var(--button-size-md);
  height: var(--button-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.sidebar__close-btn:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-medium);
}

.sidebar__close-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__profile {
  text-align: center;
  margin-top: calc(var(--spacing-lg) * 2);
  margin-bottom: var(--spacing-xl);
}

.sidebar__profile-wrapper {
  width: var(--profile-image-size);
  height: var(--profile-image-size);
  border-radius: 50%;
  border: 3px solid var(--color-border-light);
  margin: 0 auto var(--spacing-sm);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.sidebar__profile-wrapper:hover {
  border-color: var(--color-primary);
}

.sidebar__profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar__profile-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.sidebar__nav-link {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  color: var(--color-text-primary);
  text-decoration: none;
  background-color: var(--color-background-light);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.sidebar__nav-link:hover {
  background-color: var(--color-background-hover);
  transform: translateX(var(--spacing-xs));
}

.sidebar__nav-link.router-link-active {
  border: 2px solid var(--color-primary);
  background-color: var(--color-primary-light);
  font-weight: var(--font-weight-bold);
}

.sidebar__section {
  /* flex: 1; */
  margin-bottom: var(--spacing-lg);
}

.sidebar__section-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar__contract-list {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  background-color: var(--color-background-light);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sidebar__contract-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-white);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-xs);
  user-select: none;
}

.sidebar__contract-item:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-primary);
  transform: translateX(var(--spacing-xs));
  box-shadow: var(--shadow-sm);
}

.sidebar__contract-item--active {
  background-color: var(--color-primary-light);
  border: 2px solid var(--color-primary);
  box-shadow: var(--shadow-md);
}

.sidebar__contract-address {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.sidebar__contract-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  background-color: var(--color-background-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--color-border-light);
  white-space: nowrap;
}

.sidebar__footer {
  margin-top: auto;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.sidebar__logout-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-danger);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-fast);
}

.sidebar__logout-btn:hover {
  background-color: var(--color-danger-dark);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: var(--breakpoint-md)) {
  .sidebar--right {
    width: var(--sidebar-width-mobile) !important;
  }

  .sidebar--right.sidebar--hidden {
    right: calc(100vw + var(--sidebar-width-mobile)) !important;
  }

  .sidebar__contract-address {
    max-width: 120px;
  }
}

@media (max-width: var(--breakpoint-sm)) {
  .sidebar--right {
    padding: var(--spacing-md);
  }

  .sidebar__profile-wrapper {
    width: calc(var(--profile-image-size) * 0.8);
    height: calc(var(--profile-image-size) * 0.8);
  }

  .sidebar__contract-address {
    max-width: 100px;
  }
}
</style>
