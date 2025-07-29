import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  // 로컬 스토리지에서 테마 로드
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('gli-theme') as Theme
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      theme.value = savedTheme
    } else {
      // 시스템 테마 감지
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme()
  }

  // 테마 적용
  const applyTheme = () => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme.value)
    root.setAttribute('data-theme', theme.value)
  }

  // 테마 토글
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  // 테마 설정
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  // 테마 변경 시 로컬 스토리지에 저장
  watch(theme, (newTheme) => {
    localStorage.setItem('gli-theme', newTheme)
    applyTheme()
  })

  return {
    theme,
    loadTheme,
    toggleTheme,
    setTheme,
    applyTheme
  }
})