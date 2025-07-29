import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 라우트 변경 감지 및 사이드 메뉴 자동 숨김 가드
 */
export function setupSideMenuGuards(router: Router) {
  // case-search 화면 진입 시 자동으로 사이드 메뉴 숨김
  router.beforeEach((to, from, next) => {
    // case-search 화면으로 진입하는 경우
    if (to.name === 'case-search') {
      // 세션 스토리지에 사이드 메뉴 숨김 상태 저장
      sessionStorage.setItem('autoHideSideMenus', 'true')
      sessionStorage.setItem('leftSidebarHidden', 'true')
      sessionStorage.setItem('rightSidebarHidden', 'true')
    }

    // case-detail 화면으로 진입하는 경우 - 양쪽 사이드바 모두 숨김
    if (to.name === 'case-detail') {
      sessionStorage.setItem('leftSidebarHidden', 'true')
      sessionStorage.setItem('rightSidebarHidden', 'true')
    }

    // profile-edit 화면으로 진입하는 경우 - 양쪽 사이드바 모두 숨김
    if (to.name === 'profile-edit') {
      sessionStorage.setItem('leftSidebarHidden', 'true')
      sessionStorage.setItem('rightSidebarHidden', 'true')
    }

    // case-search 화면에서 다른 화면으로 이동하는 경우
    if (from.name === 'case-search' && to.name !== 'case-search') {
      // 자동 숨김 상태 해제
      sessionStorage.removeItem('autoHideSideMenus')
      sessionStorage.removeItem('leftSidebarHidden')
      sessionStorage.removeItem('rightSidebarHidden')
    }

    // profile-edit 화면에서 다른 화면으로 이동하는 경우
    if (from.name === 'profile-edit' && to.name !== 'profile-edit') {
      // 자동 숨김 상태 해제
      sessionStorage.removeItem('leftSidebarHidden')
      sessionStorage.removeItem('rightSidebarHidden')
    }

    next()
  })

  // 라우트 변경 후 사이드 메뉴 상태 복원
  router.afterEach((to) => {
    // case-search 또는 profile-edit 화면이 아닌 경우 이전 상태 복원
    if (to.name !== 'case-search' && to.name !== 'profile-edit') {
      const autoHide = sessionStorage.getItem('autoHideSideMenus')
      if (!autoHide) {
        // 사용자 설정 복원
        const savedLeftState = localStorage.getItem('leftSidebarState')
        const savedRightState = localStorage.getItem('rightSidebarState')

        if (savedLeftState) {
          sessionStorage.setItem('leftSidebarHidden', savedLeftState)
        }
        if (savedRightState) {
          sessionStorage.setItem('rightSidebarHidden', savedRightState)
        }
      }
    }
  })
}

/**
 * 인증 가드 - 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트
 */
export function setupAuthGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 로그인/회원가입 페이지는 인증 불필요
    if (to.name === 'login' || to.name === 'signup') {
      // 이미 로그인된 사용자가 로그인 페이지에 접근하면 홈으로 리다이렉트
      if (authStore.isAuthenticated) {
        next({ name: 'home' })
        return
      }
      next()
      return
    }

    // 공개 페이지 (로그인 없이 접근 가능)
    const publicRoutes = ['business', 'rwa-assets', 'shopping', 'help-center', 'home']
    
    // 보호된 라우트 체크
    if (to.meta.requiresAuth !== false && !publicRoutes.includes(to.name as string)) {
      // 인증 상태 확인
      if (!authStore.isAuthenticated) {
        // 로그인 페이지로 리다이렉트하고 원래 목적지 저장
        next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
        return
      }
    }

    next()
  })
}

/**
 * 사이드 메뉴 상태 관리 유틸리티
 */
export class SideMenuStateManager {
  private static instance: SideMenuStateManager

  private constructor() {}

  static getInstance(): SideMenuStateManager {
    if (!SideMenuStateManager.instance) {
      SideMenuStateManager.instance = new SideMenuStateManager()
    }
    return SideMenuStateManager.instance
  }

  /**
   * 왼쪽 사이드바 숨김 상태 설정
   */
  setLeftSidebarHidden(hidden: boolean): void {
    sessionStorage.setItem('leftSidebarHidden', hidden.toString())
    localStorage.setItem('leftSidebarState', hidden.toString())
  }

  /**
   * 오른쪽 사이드바 숨김 상태 설정
   */
  setRightSidebarHidden(hidden: boolean): void {
    sessionStorage.setItem('rightSidebarHidden', hidden.toString())
    localStorage.setItem('rightSidebarState', hidden.toString())
  }

  /**
   * 왼쪽 사이드바 숨김 상태 가져오기
   */
  isLeftSidebarHidden(): boolean {
    const sessionState = sessionStorage.getItem('leftSidebarHidden')
    if (sessionState !== null) {
      return sessionState === 'true'
    }

    const localState = localStorage.getItem('leftSidebarState')
    return localState === 'true'
  }

  /**
   * 오른쪽 사이드바 숨김 상태 가져오기
   */
  isRightSidebarHidden(): boolean {
    const sessionState = sessionStorage.getItem('rightSidebarHidden')
    if (sessionState !== null) {
      return sessionState === 'true'
    }

    const localState = localStorage.getItem('rightSidebarState')
    return localState === 'true'
  }

  /**
   * 자동 숨김 모드 활성화 여부 확인
   */
  isAutoHideMode(): boolean {
    return sessionStorage.getItem('autoHideSideMenus') === 'true'
  }

  /**
   * 자동 숨김 모드 해제
   */
  disableAutoHideMode(): void {
    sessionStorage.removeItem('autoHideSideMenus')
  }

  /**
   * 모든 상태 초기화
   */
  resetStates(): void {
    sessionStorage.removeItem('leftSidebarHidden')
    sessionStorage.removeItem('rightSidebarHidden')
    sessionStorage.removeItem('autoHideSideMenus')
    localStorage.removeItem('leftSidebarState')
    localStorage.removeItem('rightSidebarState')
  }

  /**
   * 현재 라우트가 case-search인지 확인
   */
  isCaseSearchRoute(): boolean {
    return window.location.pathname === '/case-search'
  }
}

/**
 * 라우트 변경 이벤트 리스너
 */
export class RouteChangeListener {
  private static instance: RouteChangeListener
  private listeners: Array<(to: string, from: string) => void> = []

  private constructor() {
    this.setupPopStateListener()
  }

  static getInstance(): RouteChangeListener {
    if (!RouteChangeListener.instance) {
      RouteChangeListener.instance = new RouteChangeListener()
    }
    return RouteChangeListener.instance
  }

  /**
   * popstate 이벤트 리스너 설정
   */
  private setupPopStateListener(): void {
    window.addEventListener('popstate', (event) => {
      const currentPath = window.location.pathname
      const previousPath = event.state?.previousPath || '/'

      this.notifyListeners(currentPath, previousPath)
    })
  }

  /**
   * 라우트 변경 리스너 추가
   */
  addListener(listener: (to: string, from: string) => void): void {
    this.listeners.push(listener)
  }

  /**
   * 라우트 변경 리스너 제거
   */
  removeListener(listener: (to: string, from: string) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * 모든 리스너에게 라우트 변경 알림
   */
  private notifyListeners(to: string, from: string): void {
    this.listeners.forEach((listener) => {
      try {
        listener(to, from)
      } catch (error) {
        console.error('Route change listener error:', error)
      }
    })
  }

  /**
   * 수동으로 라우트 변경 알림
   */
  notifyRouteChange(to: string, from: string): void {
    this.notifyListeners(to, from)
  }
}
