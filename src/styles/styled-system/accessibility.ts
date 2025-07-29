// 접근성 관련 스타일 유틸리티
// WCAG 2.1 AA 기준 준수

import { computed } from 'vue'
import { defaultTheme } from './index'

// 포커스 스타일 유틸리티
export const focusStyles = {
  // 기본 포커스 스타일 (WCAG 2.1 AA 기준)
  default: computed(() => ({
    outline: 'none',
    boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['100']}`,
    borderColor: defaultTheme.colors.primary['500'],
  })),

  // 고대비 포커스 스타일
  highContrast: computed(() => ({
    outline: 'none',
    boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['500']}`,
    borderColor: defaultTheme.colors.primary['700'],
  })),

  // 에러 상태 포커스 스타일
  error: computed(() => ({
    outline: 'none',
    boxShadow: `0 0 0 3px ${defaultTheme.colors.semantic.error}40`,
    borderColor: defaultTheme.colors.semantic.error,
  })),
}

// 스크린 리더 전용 텍스트 스타일
export const srOnly = computed(() => ({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
}))

// 키보드 네비게이션 스타일
export const keyboardNavigation = {
  // 포커스 가능한 요소 기본 스타일
  focusable: computed(() => ({
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['100']}`,
      transform: 'translateY(-1px)',
    },
  })),

  // 버튼 포커스 스타일
  button: computed(() => ({
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['100']}`,
      transform: 'translateY(-1px)',
    },
  })),

  // 입력 필드 포커스 스타일
  input: computed(() => ({
    '&:focus-visible': {
      outline: 'none',
      borderColor: defaultTheme.colors.primary['500'],
      boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['100']}`,
    },
  })),
}

// 색상 대비 유틸리티 (WCAG 2.1 AA 기준)
export const colorContrast = {
  // 텍스트 색상 대비 검증
  text: {
    primary: computed(() => ({
      color: defaultTheme.colors.text.primary,
      backgroundColor: defaultTheme.colors.background.primary,
    })),
    secondary: computed(() => ({
      color: defaultTheme.colors.text.secondary,
      backgroundColor: defaultTheme.colors.background.primary,
    })),
    inverse: computed(() => ({
      color: defaultTheme.colors.text.inverse,
      backgroundColor: defaultTheme.colors.primary['500'],
    })),
  },

  // 링크 색상 대비
  link: computed(() => ({
    color: defaultTheme.colors.primary['600'],
    textDecoration: 'underline',
    '&:hover': {
      color: defaultTheme.colors.primary['700'],
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${defaultTheme.colors.primary['100']}`,
      borderRadius: '2px',
    },
  })),
}

// ARIA 속성 관련 스타일
export const ariaStyles = {
  // 숨겨진 요소 (aria-hidden="true")
  hidden: computed(() => ({
    display: 'none',
  })),

  // 확장 가능한 요소 (aria-expanded)
  expandable: computed(() => ({
    cursor: 'pointer',
    '&[aria-expanded="true"]': {
      transform: 'rotate(180deg)',
    },
  })),

  // 선택된 요소 (aria-selected)
  selected: computed(() => ({
    backgroundColor: defaultTheme.colors.primary['100'],
    borderColor: defaultTheme.colors.primary['500'],
  })),

  // 활성 요소 (aria-current)
  current: computed(() => ({
    backgroundColor: defaultTheme.colors.primary['500'],
    color: defaultTheme.colors.text.inverse,
  })),
}

// 모션 감소 설정 지원
export const motionReduced = computed(() => ({
  '@media (prefers-reduced-motion: reduce)': {
    '*': {
      animationDuration: '0.01ms !important',
      animationIterationCount: '1 !important',
      transitionDuration: '0.01ms !important',
    },
  },
}))

// 고대비 모드 지원
export const highContrast = computed(() => ({
  '@media (prefers-contrast: high)': {
    '*': {
      borderColor: 'currentColor !important',
    },
    'button, input, select, textarea': {
      borderWidth: '2px !important',
    },
  },
}))

// 다크 모드 지원 (향후 확장용)
export const darkMode = computed(() => ({
  '@media (prefers-color-scheme: dark)': {
    ':root': {
      '--color-background-primary': '#1a1a1a',
      '--color-background-secondary': '#2d2d2d',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#cccccc',
      '--color-border-light': '#404040',
    },
  },
}))
