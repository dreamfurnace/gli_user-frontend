<template>
  <nav class="sidebar sidebar--left" :class="{ 'sidebar--hidden': isHidden }" id="leftSidebar">

    <div
      class="sidebar__item"
      :class="{ 'sidebar__item--active': activeMenu === 'register-issuance' }"
      @click="goTo('register-issuance')"
    >
      <span class="sidebar__item-text">등기&대장 발급하기</span>
    </div>

    <div
      class="sidebar__item sidebar__item--has-submenu"
      :class="{ 'sidebar__item--active': openSubmenu.includes('contract') }"
      @click="toggleSubmenu('contract')"
    >
      <span class="sidebar__item-text">계약 도우미</span>
    </div>
    <ul
      class="sidebar__submenu"
      :class="{ 'sidebar__submenu--active': openSubmenu.includes('contract') }"
    >
      <li class="sidebar__submenu-item" @click="goTo('contract-doc-choice')">계약서 작성</li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">계약서 검토</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">권리분석</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">계약관리</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
    </ul>

    <div
      class="sidebar__item sidebar__item--has-submenu"
      :class="{ 'sidebar__item--active': openSubmenu.includes('content') }"
      @click="toggleSubmenu('content')"
    >
      <span class="sidebar__item-text">내용증명 도우미</span>
      <span class="sidebar__badge sidebar__badge--premium">
        <span class="sidebar__badge-icon">⭐</span>
        <span class="sidebar__badge-text">프리미엄</span>
      </span>
    </div>
    <ul
      class="sidebar__submenu"
      :class="{ 'sidebar__submenu--active': openSubmenu.includes('content') }"
    >
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">내용증명 작성</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">내용증명 검토</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
    </ul>

    <div
      class="sidebar__item sidebar__item--has-submenu"
      :class="{ 'sidebar__item--active': openSubmenu.includes('register') }"
      @click="toggleSubmenu('register')"
    >
      <span class="sidebar__item-text">등기 도우미</span>
      <span class="sidebar__badge sidebar__badge--premium">
        <span class="sidebar__item-text">⭐</span>
        <span class="sidebar__badge-text">프리미엄</span>
      </span>
    </div>
    <ul
      class="sidebar__submenu"
      :class="{ 'sidebar__submenu--active': openSubmenu.includes('register') }"
    >
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">등기 분석</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">권리 검토</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
    </ul>

    <div
      class="sidebar__item sidebar__item--has-submenu"
      :class="{ 'sidebar__item--active': openSubmenu.includes('tax') }"
      @click="toggleSubmenu('tax')"
    >
      <span class="sidebar__item-text">세금 도우미</span>
      <span class="sidebar__badge sidebar__badge--premium">
        <span class="sidebar__badge-icon">⭐</span>
        <span class="sidebar__badge-text">프리미엄</span>
      </span>
    </div>
    <ul
      class="sidebar__submenu"
      :class="{ 'sidebar__submenu--active': openSubmenu.includes('tax') }"
    >
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">절세 분석</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
      <li class="sidebar__submenu-item" @click="comingSoon()">
        <span class="sidebar__submenu-text">관련 법령</span>
        <span class="sidebar__badge sidebar__badge--coming-soon">Coming soon</span>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Props
interface Props {
  isHidden?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHidden: false,
})

// isHidden prop 변화 감지
watch(
  () => props.isHidden,
  (newValue, oldValue) => {
    console.log('LeftSidebar: isHidden 변경됨', { oldValue, newValue })

    // DOM 요소 확인
    nextTick(() => {
      const sidebar = document.querySelector('.sidebar--left') as HTMLElement
      console.log('LeftSidebar: 현재 DOM 클래스:', sidebar?.className)
      console.log(
        'LeftSidebar: sidebar--hidden 클래스 포함 여부:',
        sidebar?.classList.contains('sidebar--hidden'),
      )
      console.log('LeftSidebar: 현재 left 스타일:', sidebar?.style.left)
    })
  },
  { immediate: true },
)

// 모든 하위 메뉴를 기본적으로 열린 상태로 설정
const openSubmenu = ref('contract,content,register,tax')
const activeMenu = ref('')

// Methods
const toggleSubmenu = (name: string) => {
  // 모든 하위 메뉴가 항상 열린 상태를 유지하도록 수정
  // 클릭해도 접히지 않음
  if (!openSubmenu.value.includes(name)) {
    openSubmenu.value += ',' + name
  }
}

const goTo = (route: string) => {
  activeMenu.value = route
  if (route === 'register-issuance') router.push('/register-issuance')
  else if (route === 'contract-doc-choice') router.push('/contract-doc-choice')
}

const comingSoon = () => {
  alert('Coming soon 기능입니다.')
}
</script>

<style scoped>
/* Sidebar Component Styles */
.sidebar {
  position: fixed !important;
  top: 60px !important;
  left: -250px !important;
  width: 250px !important;
  height: calc(100vh - 60px) !important;
  background-color: #f8f8f8 !important;
  border-right: 1px solid #ddd !important;
  padding: 15px 0 !important;
  transition: left 0.3s ease !important;
  z-index: 997 !important;
  box-sizing: border-box !important;
  overflow-y: auto !important;
}

.sidebar--left {
  /* Left sidebar specific styles */
}

.sidebar--left:not(.sidebar--hidden) {
  left: 0 !important;
}

.sidebar--left.sidebar--hidden {
  /* 왼쪽 사이드바 숨김 시 화면 왼쪽 너머로 이동 */
  left: -250px !important;
}

.sidebar__item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar__item:hover,
.sidebar__submenu-item:hover {
  background-color: #eaeaea;
}

.sidebar__item--active {
  background-color: #eaeaea;
  color: #333;
}

.sidebar__item--has-submenu {
  padding-left: 40px;
}

.sidebar__item--has-submenu::before {
  content: '>';
  position: absolute;
  left: 20px;
  transform: rotate(0deg);
  transition: transform 0.2s;
  color: #333;
  font-weight: bold;
}

.sidebar__item--has-submenu.sidebar__item--active::before {
  transform: rotate(90deg);
}

.sidebar__item-text {
  font-size: 14px;
  font-weight: 500;
}

.sidebar__submenu {
  list-style-type: none;
  padding-left: 40px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
  background-color: transparent;
}

.sidebar__submenu--active {
  max-height: 500px;
}

.sidebar__submenu-item {
  padding: 8px 0;
  cursor: pointer;
  color: #555;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
}

.sidebar__submenu-text {
  flex: 1;
}

/* Badge Styles - publishing 스타일 완전 적용 */
.sidebar__badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar__badge--premium {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: #fff;
}

.sidebar__badge--coming-soon {
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  border: 1px solid #dee2e6;
}

.sidebar__badge-icon {
  margin-right: 4px;
  font-size: 12px;
}

.sidebar__badge-text {
  font-size: 11px;
}

.sidebar__submenu-item .sidebar__badge--coming-soon {
  margin-right: 8px;
  font-size: 12px;
  padding: 1px 6px;
}

/* Responsive Design */
@media (max-width: var(--breakpoint-md)) {
  .sidebar {
    width: var(--sidebar-width-mobile);
  }

  .sidebar--left:not(.sidebar--hidden) {
    left: 0;
  }

  .sidebar--left.sidebar--hidden {
    left: calc(-1 * var(--sidebar-width-mobile));
  }

  .sidebar__item {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .sidebar__item--has-submenu {
    padding-left: calc(var(--spacing-md) + var(--spacing-sm));
  }

  .sidebar__item--has-submenu::before {
    left: var(--spacing-md);
  }

  .sidebar__submenu {
    padding-left: calc(var(--spacing-md) + var(--spacing-sm));
  }
}

@media (max-width: var(--breakpoint-sm)) {
  .sidebar__item-text {
    font-size: var(--font-size-sm);
  }

  .sidebar__badge {
    font-size: var(--font-size-xs);
    padding: var(--spacing-xs);
  }
}
</style>
