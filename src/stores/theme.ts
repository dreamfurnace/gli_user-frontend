import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export type ConceptTheme = 'default' | 'luxury' | 'minimal'
export type ColorMode = 'light' | 'dark'

export interface ConceptThemeConfig {
  name: string
  displayName: string
  description: string
  defaultColorMode: ColorMode
  status: 'available' | 'coming-soon'
}

export const conceptThemeConfigs: Record<ConceptTheme, ConceptThemeConfig> = {
  default: {
    name: 'default',
    displayName: 'Default',
    description: 'Clean and modern default theme',
    defaultColorMode: 'light',
    status: 'available'
  },
  luxury: {
    name: 'luxury',
    displayName: 'Luxury',
    description: 'Premium theme with gold accents',
    defaultColorMode: 'dark',
    status: 'coming-soon'
  },
  minimal: {
    name: 'minimal',
    displayName: 'Minimal',
    description: 'Clean minimal black and white theme',
    defaultColorMode: 'light',
    status: 'available'
  }
}

export const useThemeStore = defineStore('theme', () => {
  const conceptTheme = ref<ConceptTheme>('default')
  const colorMode = ref<ColorMode>('light')
  const isTransitioning = ref(false)

  // 현재 컨셉 테마 설정 정보
  const currentConceptThemeConfig = computed(() => conceptThemeConfigs[conceptTheme.value])
  
  // 사용 가능한 모든 컨셉 테마 목록
  const availableConceptThemes = computed(() => Object.values(conceptThemeConfigs))

  // 다크 모드 여부
  const isDarkMode = computed(() => colorMode.value === 'dark')
  
  // 전체 테마 문자열 (컨셉테마-라이트/다크)
  const fullTheme = computed(() => `${conceptTheme.value}-${colorMode.value}`)

  // 로컬 스토리지에서 테마 로드
  const loadTheme = () => {
    const savedConceptTheme = localStorage.getItem('gli-concept-theme') as ConceptTheme
    const savedColorMode = localStorage.getItem('gli-color-mode') as ColorMode
    
    if (savedConceptTheme && Object.keys(conceptThemeConfigs).includes(savedConceptTheme)) {
      conceptTheme.value = savedConceptTheme
    }
    
    if (savedColorMode && ['light', 'dark'].includes(savedColorMode)) {
      colorMode.value = savedColorMode
    } else {
      // 시스템 테마 감지하여 기본 컬러 모드 설정
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      colorMode.value = prefersDark ? 'dark' : 'light'
    }
    
    applyTheme()
  }

  // 테마 적용
  const applyTheme = () => {
    const root = document.documentElement
    
    // 기존 테마 클래스 제거
    Object.keys(conceptThemeConfigs).forEach(themeName => {
      root.classList.remove(themeName)
      root.classList.remove(`${themeName}-light`)
      root.classList.remove(`${themeName}-dark`)
    })
    root.classList.remove('light', 'dark')
    
    // 새 테마 클래스 적용
    root.classList.add(conceptTheme.value)
    root.classList.add(colorMode.value)
    root.classList.add(fullTheme.value)
    
    // data 속성 설정
    root.setAttribute('data-concept-theme', conceptTheme.value)
    root.setAttribute('data-color-mode', colorMode.value)
    root.setAttribute('data-theme', fullTheme.value)
    
    // 색상 체계 설정 (접근성을 위한 meta 태그)
    root.style.colorScheme = colorMode.value
    
    // meta theme-color 업데이트 (모바일 브라우저)
    updateMetaThemeColor()
  }

  // 메타 테마 컬러 업데이트 (PWA/모바일 지원)
  const updateMetaThemeColor = () => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.setAttribute('name', 'theme-color')
      document.head.appendChild(metaThemeColor)
    }
    
    // 테마별 메타 컬러 설정
    const themeColors: Record<string, string> = {
      'default-light': '#0ea5e9',
      'default-dark': '#1e293b',
      'luxury-light': '#d4af37',
      'luxury-dark': '#1a237e',
      'minimal-light': '#ffffff',
      'minimal-dark': '#000000'
    }
    
    metaThemeColor.setAttribute('content', themeColors[fullTheme.value] || '#0ea5e9')
  }

  // light/dark 모드 토글 (기존 헤더 버튼용)
  const toggleTheme = () => {
    colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
  }

  // 컨셉 테마 변경 (부드러운 전환)
  const setConceptThemeWithTransition = async (newConceptTheme: ConceptTheme) => {
    if (newConceptTheme === conceptTheme.value) return
    
    isTransitioning.value = true
    
    // CSS 트랜지션 활성화
    document.documentElement.style.setProperty('--transition-duration', '0.3s')
    
    // 컨셉 테마 변경
    conceptTheme.value = newConceptTheme
    
    // 트랜지션 완료 대기
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 트랜지션 비활성화
    document.documentElement.style.removeProperty('--transition-duration')
    isTransitioning.value = false
  }

  // 컨셉 테마 설정 (즉시 적용)
  const setConceptTheme = (newConceptTheme: ConceptTheme) => {
    conceptTheme.value = newConceptTheme
  }

  // 컬러 모드 설정
  const setColorMode = (newColorMode: ColorMode) => {
    colorMode.value = newColorMode
  }

  // 다음 컨셉 테마로 순환
  const cycleConceptTheme = () => {
    const themes = Object.keys(conceptThemeConfigs) as ConceptTheme[]
    const currentIndex = themes.indexOf(conceptTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setConceptThemeWithTransition(themes[nextIndex])
  }

  // 시스템 테마 감지 및 자동 적용 (컬러 모드만)
  const enableSystemThemeDetection = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // 사용자가 수동으로 설정한 컬러 모드가 있으면 무시
      const hasManualColorMode = localStorage.getItem('gli-color-mode-manual') === 'true'
      if (hasManualColorMode) return
      
      const newColorMode = e.matches ? 'dark' : 'light'
      setColorMode(newColorMode)
    }
    
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    
    // 정리 함수 반환
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }

  // 컨셉 테마 변경 시 로컬 스토리지에 저장
  watch(conceptTheme, (newConceptTheme) => {
    localStorage.setItem('gli-concept-theme', newConceptTheme)
    localStorage.setItem('gli-concept-theme-manual', 'true') // 수동 설정 표시
    applyTheme()
    
    // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지 가능)
    window.dispatchEvent(new CustomEvent('concept-theme-changed', { 
      detail: { 
        conceptTheme: newConceptTheme, 
        config: currentConceptThemeConfig.value 
      } 
    }))
  })

  // 컬러 모드 변경 시 로컬 스토리지에 저장
  watch(colorMode, (newColorMode) => {
    localStorage.setItem('gli-color-mode', newColorMode)
    localStorage.setItem('gli-color-mode-manual', 'true') // 수동 설정 표시
    applyTheme()
    
    // 커스텀 이벤트 발생 (다른 컴포넌트에서 감지 가능)
    window.dispatchEvent(new CustomEvent('color-mode-changed', { 
      detail: { 
        colorMode: newColorMode
      } 
    }))
  })

  // 테마 초기화 (시스템 기본값으로)
  const resetTheme = () => {
    localStorage.removeItem('gli-concept-theme')
    localStorage.removeItem('gli-concept-theme-manual')
    localStorage.removeItem('gli-color-mode')
    localStorage.removeItem('gli-color-mode-manual')
    loadTheme()
  }

  return {
    // State
    conceptTheme,
    colorMode,
    isTransitioning,
    
    // Computed
    currentConceptThemeConfig,
    availableConceptThemes,
    isDarkMode,
    fullTheme,
    
    // Legacy compatibility
    theme: colorMode, // for existing GLIHeader.vue
    
    // Actions
    loadTheme,
    applyTheme,
    toggleTheme, // for existing GLIHeader.vue light/dark toggle
    setConceptTheme,
    setConceptThemeWithTransition,
    setColorMode,
    cycleConceptTheme,
    resetTheme,
    enableSystemThemeDetection
  }
})