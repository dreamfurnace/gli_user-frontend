import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { SideMenuStateManager, RouteChangeListener } from '@/router/guards'

export interface SideMenuState {
  leftSidebarHidden: boolean
  rightSidebarHidden: boolean
  autoHideMode: boolean
  userPreferences: {
    leftSidebarDefault: boolean
    rightSidebarDefault: boolean
    enableAutoHide: boolean
  }
}

export const useSideMenuStore = defineStore('sideMenu', () => {
  // 상태
  const leftSidebarHidden = ref(false)
  const rightSidebarHidden = ref(true) // 기본적으로 우측 사이드바는 숨김
  const autoHideMode = ref(false)
  const isTransitioning = ref(false)

  // 사용자 기본 설정
  const userPreferences = ref({
    leftSidebarDefault: false,
    rightSidebarDefault: true, // 기본적으로 우측 사이드바는 숨김
    enableAutoHide: true,
  })

  // 상태 관리자 인스턴스
  const stateManager = SideMenuStateManager.getInstance()
  const routeChangeListener = RouteChangeListener.getInstance()

  // 현재 라우트
  const route = useRoute()

  // 계산된 속성
  const isCaseSearchRoute = computed(() => route.name === 'case-search')
  const shouldAutoHide = computed(
    () => isCaseSearchRoute.value && userPreferences.value.enableAutoHide,
  )

  const leftSidebarVisible = computed(() => !leftSidebarHidden.value)
  const rightSidebarVisible = computed(() => !rightSidebarHidden.value)

  // 메인 콘텐츠 영역 조정
  const mainContentClass = computed(() => ({
    'auto-hide-mode': autoHideMode.value,
  }))

  // 초기화 함수
  function initialize() {
    console.log('SideMenuStore: 초기화 시작')

    // 사용자 설정 로드
    loadUserPreferences()

    // 현재 라우트 확인
    const currentPath = window.location.pathname
    const isMainPage =
      currentPath.includes('/case-detail') ||
      currentPath.includes('/case-search') ||
      currentPath.includes('/law-search') ||
      currentPath === '/' ||
      currentPath === '/home'

    if (isMainPage) {
      // 메인 화면에서는 기본적으로 사이드바 숨김
      console.log('SideMenuStore: 메인 화면 감지, 사이드바 기본 숨김')
      leftSidebarHidden.value = true
      rightSidebarHidden.value = true
      stateManager.setLeftSidebarHidden(true)
      stateManager.setRightSidebarHidden(true)

      // DOM 업데이트를 위해 nextTick 사용
      nextTick(() => {
        console.log('SideMenuStore: DOM 업데이트 후 상태 확인', {
          leftHidden: leftSidebarHidden.value,
          rightHidden: rightSidebarHidden.value,
        })
      })
    } else {
      // 다른 화면에서는 저장된 상태 복원
      leftSidebarHidden.value = stateManager.isLeftSidebarHidden()
      rightSidebarHidden.value = stateManager.isRightSidebarHidden()
    }

    console.log('SideMenuStore: 초기화 완료', {
      leftHidden: leftSidebarHidden.value,
      rightHidden: rightSidebarHidden.value,
      autoHide: shouldAutoHide.value,
    })
  }

  // 로그아웃 시 상태 초기화
  function resetOnLogout() {
    console.log('SideMenuStore: 로그아웃 시 상태 초기화')

    // 사이드바 상태 초기화
    leftSidebarHidden.value = true
    rightSidebarHidden.value = true
    autoHideMode.value = false
    isTransitioning.value = false

    // 상태 관리자 초기화
    stateManager.setLeftSidebarHidden(true)
    stateManager.setRightSidebarHidden(true)
    stateManager.disableAutoHideMode()

    // 사용자 기본 설정 초기화
    userPreferences.value = {
      leftSidebarDefault: false,
      rightSidebarDefault: false,
      enableAutoHide: true,
    }

    // localStorage에서 사이드바 관련 데이터 제거
    try {
      localStorage.removeItem('sideMenuPreferences')
      localStorage.removeItem('leftSidebarHidden')
      localStorage.removeItem('rightSidebarHidden')
      localStorage.removeItem('autoHideMode')
    } catch (error) {
      console.error('Failed to clear side menu localStorage:', error)
    }

    console.log('SideMenuStore: 로그아웃 시 상태 초기화 완료')
  }

  // 사용자 설정 로드
  function loadUserPreferences() {
    try {
      const saved = localStorage.getItem('sideMenuPreferences')
      if (saved) {
        userPreferences.value = { ...userPreferences.value, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.error('Failed to load side menu preferences:', error)
    }
  }

  // 사용자 설정 저장
  function saveUserPreferences() {
    try {
      localStorage.setItem('sideMenuPreferences', JSON.stringify(userPreferences.value))
    } catch (error) {
      console.error('Failed to save side menu preferences:', error)
    }
  }

  // 상태 복원
  function restoreState() {
    leftSidebarHidden.value = stateManager.isLeftSidebarHidden()
    rightSidebarHidden.value = stateManager.isRightSidebarHidden()
    autoHideMode.value = stateManager.isAutoHideMode()

    // case-search 화면에서 자동 숨김 적용
    if (shouldAutoHide.value && !autoHideMode.value) {
      enableAutoHideMode()
    }
  }

  // 라우트 변경 리스너 설정
  function setupRouteChangeListener() {
    routeChangeListener.addListener((to, from) => {
      handleRouteChange(to, from)
    })
  }

  // 라우트 변경 감시
  function watchRouteChanges() {
    watch(
      () => route.name,
      (newRoute, oldRoute) => {
        if (newRoute && oldRoute) {
          handleRouteChange(`/${String(newRoute)}`, `/${String(oldRoute)}`)
        }
      },
    )
  }

  // 라우트 변경 처리
  function handleRouteChange(to: string, from: string) {
    console.log('SideMenuStore: 라우트 변경 감지', { to, from })

    const isEnteringCaseSearch = to.includes('/case-search')
    const isLeavingCaseSearch = from.includes('/case-search')
    const isEnteringMainPage =
      to.includes('/case-detail') || to.includes('/case-search') || to.includes('/law-search')

    if (isEnteringMainPage) {
      // 메인 화면 진입 시 양쪽 사이드바 자동 숨김
      console.log('SideMenuStore: 메인 화면 진입, 사이드바 자동 숨김')
      leftSidebarHidden.value = true
      rightSidebarHidden.value = true
      stateManager.setLeftSidebarHidden(true)
      stateManager.setRightSidebarHidden(true)
    } else if (isEnteringCaseSearch && shouldAutoHide.value) {
      enableAutoHideMode()
    } else if (isLeavingCaseSearch) {
      disableAutoHideMode()
      restoreUserPreferences()
    }
  }

  // 자동 숨김 모드 활성화
  function enableAutoHideMode() {
    if (autoHideMode.value) return

    isTransitioning.value = true
    autoHideMode.value = true

    // 양쪽 사이드바 모두 숨김
    leftSidebarHidden.value = true
    rightSidebarHidden.value = true

    // 상태 저장
    stateManager.setLeftSidebarHidden(true)
    stateManager.setRightSidebarHidden(true)

    // 트랜지션 완료 후 상태 업데이트
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }

  // 자동 숨김 모드 비활성화
  function disableAutoHideMode() {
    if (!autoHideMode.value) return

    autoHideMode.value = false
    stateManager.disableAutoHideMode()
  }

  // 사용자 기본 설정 복원
  function restoreUserPreferences() {
    leftSidebarHidden.value = userPreferences.value.leftSidebarDefault
    rightSidebarHidden.value = userPreferences.value.rightSidebarDefault

    stateManager.setLeftSidebarHidden(userPreferences.value.leftSidebarDefault)
    stateManager.setRightSidebarHidden(userPreferences.value.rightSidebarDefault)
  }

  // 토글 함수들
  function toggleLeftSidebar() {
    console.log('SideMenuStore: toggleLeftSidebar 호출됨')
    console.log('SideMenuStore: 토글 전 leftSidebarHidden:', leftSidebarHidden.value)

    leftSidebarHidden.value = !leftSidebarHidden.value
    stateManager.setLeftSidebarHidden(leftSidebarHidden.value)

    console.log('SideMenuStore: 토글 후 leftSidebarHidden:', leftSidebarHidden.value)

    // DOM 업데이트 확인
    nextTick(() => {
      const leftSidebar = document.querySelector('.sidebar--left')
      console.log('SideMenuStore: DOM 업데이트 후 leftSidebar 클래스:', leftSidebar?.className)
    })
  }

  function toggleRightSidebar() {
    console.log('SideMenuStore: toggleRightSidebar 호출됨')
    console.log('SideMenuStore: 토글 전 rightSidebarHidden:', rightSidebarHidden.value)

    rightSidebarHidden.value = !rightSidebarHidden.value
    stateManager.setRightSidebarHidden(rightSidebarHidden.value)

    console.log('SideMenuStore: 토글 후 rightSidebarHidden:', rightSidebarHidden.value)

    // DOM 업데이트 확인
    nextTick(() => {
      const rightSidebar = document.querySelector('.sidebar--right')
      console.log('SideMenuStore: DOM 업데이트 후 rightSidebar 클래스:', rightSidebar?.className)
    })
  }

  // 양쪽 사이드바 모두 토글
  function toggleBothSidebars() {
    if (autoHideMode.value && isCaseSearchRoute.value) {
      disableAutoHideMode()
    }

    const newState = !leftSidebarHidden.value || !rightSidebarHidden.value
    leftSidebarHidden.value = newState
    rightSidebarHidden.value = newState

    stateManager.setLeftSidebarHidden(newState)
    stateManager.setRightSidebarHidden(newState)

    // 사용자 기본 설정 업데이트
    userPreferences.value.leftSidebarDefault = newState
    userPreferences.value.rightSidebarDefault = newState
    saveUserPreferences()
  }

  // 자동 숨김 기능 토글
  function toggleAutoHide() {
    userPreferences.value.enableAutoHide = !userPreferences.value.enableAutoHide
    saveUserPreferences()

    if (userPreferences.value.enableAutoHide && isCaseSearchRoute.value) {
      enableAutoHideMode()
    } else if (!userPreferences.value.enableAutoHide) {
      disableAutoHideMode()
    }
  }

  // 상태 초기화
  function resetState() {
    stateManager.resetStates()
    leftSidebarHidden.value = false
    rightSidebarHidden.value = true // 기본적으로 우측 사이드바는 숨김
    autoHideMode.value = false
    isTransitioning.value = false
  }

  // 상태 내보내기
  function exportState(): SideMenuState {
    return {
      leftSidebarHidden: leftSidebarHidden.value,
      rightSidebarHidden: rightSidebarHidden.value,
      autoHideMode: autoHideMode.value,
      userPreferences: userPreferences.value,
    }
  }

  // 상태 가져오기
  function importState(state: Partial<SideMenuState>) {
    if (state.leftSidebarHidden !== undefined) {
      leftSidebarHidden.value = state.leftSidebarHidden
      stateManager.setLeftSidebarHidden(state.leftSidebarHidden)
    }

    if (state.rightSidebarHidden !== undefined) {
      rightSidebarHidden.value = state.rightSidebarHidden
      stateManager.setRightSidebarHidden(state.rightSidebarHidden)
    }

    if (state.autoHideMode !== undefined) {
      autoHideMode.value = state.autoHideMode
    }

    if (state.userPreferences) {
      userPreferences.value = { ...userPreferences.value, ...state.userPreferences }
      saveUserPreferences()
    }
  }

  return {
    // 상태
    leftSidebarHidden,
    rightSidebarHidden,
    autoHideMode,
    isTransitioning,
    userPreferences,

    // 계산된 속성
    isCaseSearchRoute,
    shouldAutoHide,
    leftSidebarVisible,
    rightSidebarVisible,
    mainContentClass,

    // 메서드
    initialize,
    toggleLeftSidebar,
    toggleRightSidebar,
    toggleBothSidebars,
    toggleAutoHide,
    enableAutoHideMode,
    disableAutoHideMode,
    restoreUserPreferences,
    resetState,
    exportState,
    importState,
    saveUserPreferences,
    resetOnLogout,
  }
})
