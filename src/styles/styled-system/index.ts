// Vue.js CSS-in-JS 스타일 시스템
// 디자인 토큰을 활용한 타입 안전한 스타일링

import { computed, type ComputedRef } from 'vue'
import { designTokens } from '../design-tokens'

// 테마 타입 정의
export interface Theme {
  colors: typeof designTokens.colors
  typography: typeof designTokens.typography
  spacing: typeof designTokens.spacing
  shadows: typeof designTokens.shadows
  borderRadius: typeof designTokens.borderRadius
  zIndex: typeof designTokens.zIndex
  animations: typeof designTokens.animations
}

// 기본 테마
export const defaultTheme: Theme = designTokens

// 스타일 유틸리티 함수들
export const createStyle = (styleFn: (theme: Theme) => Record<string, any>) => {
  return computed(() => styleFn(defaultTheme))
}

// 색상 유틸리티
export const color = (colorKey: keyof Theme['colors'], shade?: string) => {
  return computed(() => {
    const colorValue = defaultTheme.colors[colorKey]
    if (typeof colorValue === 'string') return colorValue
    if (shade && typeof colorValue === 'object' && '500' in colorValue) {
      return (colorValue as any)[shade] || (colorValue as any)['500']
    }
    return (colorValue as any)['500'] || '#000000'
  })
}

// 타이포그래피 유틸리티
export const typography = {
  fontSize: (size: keyof Theme['typography']['fontSize']) =>
    computed(() => defaultTheme.typography.fontSize[size]),
  fontWeight: (weight: keyof Theme['typography']['fontWeight']) =>
    computed(() => defaultTheme.typography.fontWeight[weight]),
  lineHeight: (height: keyof Theme['typography']['lineHeight']) =>
    computed(() => defaultTheme.typography.lineHeight[height]),
}

// 간격 유틸리티
export const spacing = (size: keyof Theme['spacing']) => computed(() => defaultTheme.spacing[size])

// 그림자 유틸리티
export const shadow = (level: keyof Theme['shadows']) => computed(() => defaultTheme.shadows[level])

// 테두리 반경 유틸리티
export const borderRadius = (radius: keyof Theme['borderRadius']) =>
  computed(() => defaultTheme.borderRadius[radius])

// Z-인덱스 유틸리티
export const zIndex = (level: keyof Theme['zIndex']) => computed(() => defaultTheme.zIndex[level])

// 애니메이션 유틸리티
export const animation = {
  duration: (duration: keyof Theme['animations']['duration']) =>
    computed(() => defaultTheme.animations.duration[duration]),
  easing: (easing: keyof Theme['animations']['easing']) =>
    computed(() => defaultTheme.animations.easing[easing]),
}

// 스타일 믹스인들
export const mixins = {
  // 버튼 기본 스타일
  button: (variant: 'primary' | 'secondary' | 'outline' = 'primary') =>
    createStyle((theme) => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.medium,
      borderRadius: theme.borderRadius.md,
      border: 'none',
      cursor: 'pointer',
      transition: `all ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut}`,
      textDecoration: 'none',
      ...(variant === 'primary' && {
        backgroundColor: theme.colors.primary['500'],
        color: theme.colors.text.inverse,
        '&:hover': {
          backgroundColor: theme.colors.primary['600'],
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows.md,
        },
      }),
      ...(variant === 'secondary' && {
        backgroundColor: theme.colors.secondary['500'],
        color: theme.colors.text.inverse,
        '&:hover': {
          backgroundColor: theme.colors.secondary['600'],
        },
      }),
      ...(variant === 'outline' && {
        backgroundColor: 'transparent',
        color: theme.colors.primary['500'],
        border: `1px solid ${theme.colors.primary['500']}`,
        '&:hover': {
          backgroundColor: theme.colors.primary['50'],
          borderColor: theme.colors.primary['600'],
        },
      }),
    })),

  // 카드 기본 스타일
  card: () =>
    createStyle((theme) => ({
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.sm,
      padding: theme.spacing.lg,
      border: `1px solid ${theme.colors.border.light}`,
    })),

  // 입력 필드 기본 스타일
  input: () =>
    createStyle((theme) => ({
      width: '100%',
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.base,
      border: `1px solid ${theme.colors.border.light}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      transition: `border-color ${theme.animations.duration.fast} ${theme.animations.easing.easeInOut}`,
      '&:focus': {
        outline: 'none',
        borderColor: theme.colors.primary['500'],
        boxShadow: `0 0 0 3px ${theme.colors.primary['100']}`,
      },
      '&::placeholder': {
        color: theme.colors.text.tertiary,
      },
    })),
}

// 반응형 유틸리티
export const responsive = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (min-width: 769px) and (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)',
}

// 스타일 컴포지션 함수
export const composeStyles = (...styles: ComputedRef<Record<string, any>>[]) => {
  return computed(() => {
    return styles.reduce((acc, style) => ({ ...acc, ...style.value }), {})
  })
}

// 내보내기
export * from './components'
