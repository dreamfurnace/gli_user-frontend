<template>
  <header class="header">
    <div class="header__content">
      <button
        v-if="showLeftToggle"
        class="header__toggle header__toggle--left"
        @click="toggleLeftSidebar"
        :aria-label="leftSidebarHidden ? '왼쪽 사이드바 열기' : '왼쪽 사이드바 닫기'"
        :aria-expanded="!leftSidebarHidden"
        tabindex="0"
      >
        <span class="header__toggle-icon" aria-hidden="true">⇄</span>
      </button>
      <router-link to="/" class="header__logo">
        <img src="../assets/logo_byLee.svg" alt="GLI Platform" class="header__logo-image" />
      </router-link>
      <h1 class="header__title">/ GLI Platform</h1>
      <div class="header__contract-info" v-if="showContractInfo">
        <span class="header__contract-text">{{ contractInfoText }}</span>
        <button
          class="header__exit-btn"
          @click="exitContract"
          @keydown.enter="exitContract"
          @keydown.space.prevent="exitContract"
          aria-label="계약 나가기"
          tabindex="0"
        >
          (계약 나가기)
        </button>
      </div>
    </div>
    <div class="header__controls">
      <div class="header__greeting" v-if="auth.user">안녕하세요! {{ auth.user.name }}님.</div>
      <button
        v-if="showHomeButton"
        class="header__btn header__btn--home"
        @click="$router.push('/')"
        @keydown.enter="$router.push('/')"
        @keydown.space.prevent="$router.push('/')"
        aria-label="홈으로 이동"
        tabindex="0"
      >
        <span class="header__btn-icon" aria-hidden="true">⌂</span>
      </button>
      <button
        v-if="showRightToggle"
        class="header__btn header__btn--menu"
        @click="toggleRightSidebar"
        :aria-label="rightSidebarHidden ? '우측 사이드바 열기' : '우측 사이드바 닫기'"
        :aria-expanded="!rightSidebarHidden"
        tabindex="0"
        ref="rightSidebarButton"
      >
        <span class="header__btn-icon" aria-hidden="true">☰</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()

// Props
interface Props {
  showContractInfo?: boolean
  contractInfoText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showContractInfo: false,
  contractInfoText: '',
})

// Emits
const emit = defineEmits<{
  toggleLeftSidebar: []
  toggleRightSidebar: []
  exitContract: []
}>()

// Refs
const rightSidebarButton = ref<HTMLButtonElement>()

// Computed properties based on route meta
const showHomeButton = computed(() => {
  console.log(
    'BaseHeader: showHomeButton computed, route.meta.showHomeButton:',
    route.meta.showHomeButton,
  )
  return route.meta.showHomeButton !== false
})
const showLeftToggle = computed(() => {
  console.log(
    'BaseHeader: showLeftToggle computed, route.meta.showLeftToggle:',
    route.meta.showLeftToggle,
  )
  // 기본값을 true로 설정하여 메타데이터가 없어도 토글 버튼이 보이도록 함
  return route.meta.showLeftToggle !== false
})
const showRightToggle = computed(() => {
  console.log(
    'BaseHeader: showRightToggle computed, route.meta.showRightToggle:',
    route.meta.showRightToggle,
  )
  // 기본값을 true로 설정하여 메타데이터가 없어도 토글 버튼이 보이도록 함
  return route.meta.showRightToggle !== false
})

// 사이드바 상태
const leftSidebarHidden = computed(() => sideMenuStore.leftSidebarHidden)
const rightSidebarHidden = computed(() => sideMenuStore.rightSidebarHidden)

// Methods
// Toggle functions
const toggleLeftSidebar = () => {
  try {
    console.log('BaseHeader: toggleLeftSidebar 호출됨')
    console.log('BaseHeader: 토글 전 상태:', sideMenuStore.leftSidebarHidden)
    sideMenuStore.toggleLeftSidebar()
    console.log('BaseHeader: 스토어 업데이트 완료, 상태:', sideMenuStore.leftSidebarHidden)
    emit('toggleLeftSidebar')
    console.log('BaseHeader: emit 완료')
    console.log('BaseHeader: toggleLeftSidebar 완료, 상태:', sideMenuStore.leftSidebarHidden)
  } catch (error) {
    console.error('BaseHeader: toggleLeftSidebar 오류:', error)
  }
}

const toggleRightSidebar = () => {
  try {
    console.log('BaseHeader: toggleRightSidebar 호출됨')
    console.log('BaseHeader: 토글 전 상태:', sideMenuStore.rightSidebarHidden)
    sideMenuStore.toggleRightSidebar()
    console.log('BaseHeader: 스토어 업데이트 완료, 상태:', sideMenuStore.rightSidebarHidden)
    emit('toggleRightSidebar') // Emit after store update
    console.log('BaseHeader: emit 완료')
    console.log('BaseHeader: toggleRightSidebar 완료, 상태:', sideMenuStore.rightSidebarHidden)

    // 포커스 관리
    setTimeout(() => {
      const rightToggleBtn = document.getElementById('rightToggleBtn')
      if (rightToggleBtn) {
        rightToggleBtn.focus()
      }
    }, 100)
  } catch (error) {
    console.error('BaseHeader: toggleRightSidebar 오류:', error)
  }
}

const exitContract = () => {
  try {
    emit('exitContract')
  } catch (error) {
    console.error('Failed to exit contract:', error)
  }
}

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}

// 컴포넌트 마운트 시 접근성 초기화
onMounted(() => {
  // 키보드 네비게이션 지원
  const handleKeyNavigation = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement

    if (target.closest('.header__controls')) {
      const buttons = target.closest('.header__controls')?.querySelectorAll('button')
      if (!buttons) return

      const currentIndex = Array.from(buttons).indexOf(target as HTMLButtonElement)

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          const prevButton = buttons[currentIndex - 1] as HTMLButtonElement
          if (prevButton) prevButton.focus()
          break
        case 'ArrowRight':
          event.preventDefault()
          const nextButton = buttons[currentIndex + 1] as HTMLButtonElement
          if (nextButton) nextButton.focus()
          break
        case 'Home':
          event.preventDefault()
          const firstButton = buttons[0] as HTMLButtonElement
          if (firstButton) firstButton.focus()
          break
        case 'End':
          event.preventDefault()
          const lastButton = buttons[buttons.length - 1] as HTMLButtonElement
          if (lastButton) lastButton.focus()
          break
      }
    }
  }

  // 이벤트 리스너 추가
  document.addEventListener('keydown', handleKeyNavigation)

  // 클린업 함수 반환
  return () => {
    document.removeEventListener('keydown', handleKeyNavigation)
  }
})
</script>

<style scoped>
/* Header Component Styles */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg);
  height: var(--header-height);
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  z-index: var(--z-index-header);
}

.header__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  transition: opacity var(--transition-fast);
}

.header__logo:hover {
  opacity: 0.8;
}

.header__logo:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--border-radius-sm);
}

.header__logo-image {
  height: var(--icon-size-md);
  vertical-align: middle;
  filter: var(--filter-logo);
}

.header__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.header__contract-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-lg);
}

.header__contract-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.header__exit-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);
}

.header__exit-btn:hover {
  background-color: var(--color-background-hover);
  color: var(--color-text-primary);
}

.header__exit-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background-color: var(--color-background-hover);
  color: var(--color-text-primary);
}

.header__controls {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.header__greeting {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-right: var(--spacing-md);
  white-space: nowrap;
}

.header__btn {
  width: var(--button-size-md);
  height: var(--button-size-md);
  border-radius: 50%;
  border: 1px solid var(--color-border-light);
  background-color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  transition: all var(--transition-fast);
  position: relative;
}

.header__btn:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-medium);
  transform: translateY(-1px);
}

.header__btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background-color: var(--color-background-hover);
  border-color: var(--color-primary);
}

.header__btn:active {
  transform: translateY(0);
}

.header__btn--home {
  /* Home button specific styles */
}

.header__btn--menu {
  /* Menu button specific styles */
}

.header__btn--menu[aria-expanded='true'] {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.header__btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.header__toggle {
  width: var(--button-size-md);
  height: var(--button-size-md);
  border-radius: 50%;
  border: 1px solid var(--color-border-light);
  background-color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-md);
  transition: all var(--transition-fast);
  position: relative;
}

.header__toggle:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-medium);
}

.header__toggle:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background-color: var(--color-background-hover);
  border-color: var(--color-primary);
}

.header__toggle--left {
  /* Left toggle specific styles */
}

.header__toggle--left[aria-expanded='true'] {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.header__toggle-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .header__btn,
  .header__toggle {
    border-width: 2px;
  }

  .header__btn:focus,
  .header__toggle:focus {
    outline-width: 3px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .header__btn,
  .header__toggle,
  .header__logo,
  .header__exit-btn {
    transition: none;
  }

  .header__btn:hover,
  .header__toggle:hover {
    transform: none;
  }
}

/* Responsive Design */
@media (max-width: var(--breakpoint-md)) {
  .header {
    padding: 0 var(--spacing-md);
  }

  .header__title {
    font-size: var(--font-size-md);
  }

  .header__contract-info {
    margin-left: var(--spacing-md);
  }
}

@media (max-width: var(--breakpoint-sm)) {
  .header__content {
    gap: var(--spacing-sm);
  }

  .header__title {
    display: none;
  }

  .header__contract-info {
    display: none;
  }

  .header__btn,
  .header__toggle {
    width: var(--button-size-sm);
    height: var(--button-size-sm);
    font-size: var(--font-size-sm);
  }
}
</style>
