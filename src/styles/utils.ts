// 디자인 토큰 기반 유틸리티 함수들
import { designTokens } from './design-tokens'

// 색상 유틸리티
export const colors = {
  primary: (shade: string = '500') =>
    designTokens.colors.primary[shade as unknown as keyof typeof designTokens.colors.primary] ||
    designTokens.colors.primary['500'],
  secondary: (shade: string = '500') =>
    designTokens.colors.secondary[shade as unknown as keyof typeof designTokens.colors.secondary] ||
    designTokens.colors.secondary['500'],
  brand: (name: string) =>
    designTokens.colors.brand[name as keyof typeof designTokens.colors.brand],
  semantic: (name: string) =>
    designTokens.colors.semantic[name as keyof typeof designTokens.colors.semantic],
  background: (name: string) =>
    designTokens.colors.background[name as keyof typeof designTokens.colors.background],
  text: (name: string) => designTokens.colors.text[name as keyof typeof designTokens.colors.text],
  border: (name: string) =>
    designTokens.colors.border[name as keyof typeof designTokens.colors.border],
}

// 타이포그래피 유틸리티
export const typography = {
  fontSize: (size: string) =>
    designTokens.typography.fontSize[size as keyof typeof designTokens.typography.fontSize] ||
    designTokens.typography.fontSize['base'],
  fontWeight: (weight: string) =>
    designTokens.typography.fontWeight[weight as keyof typeof designTokens.typography.fontWeight] ||
    designTokens.typography.fontWeight['normal'],
  lineHeight: (height: string) =>
    designTokens.typography.lineHeight[height as keyof typeof designTokens.typography.lineHeight] ||
    designTokens.typography.lineHeight['relaxed'],
  fontFamily: () => designTokens.typography.fontFamily.primary,
}

// 간격 유틸리티
export const spacing = (size: string) =>
  designTokens.spacing[size as keyof typeof designTokens.spacing] || designTokens.spacing['md']

// 그림자 유틸리티
export const shadows = (shadow: string) =>
  designTokens.shadows[shadow as keyof typeof designTokens.shadows] || designTokens.shadows['md']

// 테두리 반경 유틸리티
export const borderRadius = (radius: string) =>
  designTokens.borderRadius[radius as keyof typeof designTokens.borderRadius] ||
  designTokens.borderRadius['md']

// Z-인덱스 유틸리티
export const zIndex = (index: string) =>
  designTokens.zIndex[index as keyof typeof designTokens.zIndex] || designTokens.zIndex['base']

// 애니메이션 유틸리티
export const animations = {
  duration: (duration: string) =>
    designTokens.animations.duration[duration as keyof typeof designTokens.animations.duration] ||
    designTokens.animations.duration['normal'],
  easing: (easing: string) =>
    designTokens.animations.easing[easing as keyof typeof designTokens.animations.easing] ||
    designTokens.animations.easing['ease'],
}

// 반응형 브레이크포인트 유틸리티
export const breakpoints = {
  sm: designTokens.breakpoints.sm,
  md: designTokens.breakpoints.md,
  lg: designTokens.breakpoints.lg,
  xl: designTokens.breakpoints.xl,
  '2xl': designTokens.breakpoints['2xl'],
}

// CSS 스타일 객체 생성 유틸리티
export const createStyles = {
  // 색상 스타일
  color: (colorName: string) => ({
    color: colors.text(colorName),
  }),

  backgroundColor: (colorName: string) => ({
    backgroundColor: colors.background(colorName),
  }),

  // 타이포그래피 스타일
  text: (size: string, weight?: string) => ({
    fontSize: typography.fontSize(size),
    fontWeight: weight ? typography.fontWeight(weight) : typography.fontWeight('normal'),
    lineHeight: typography.lineHeight('relaxed'),
    fontFamily: typography.fontFamily(),
  }),

  // 간격 스타일
  padding: (size: string) => ({
    padding: spacing(size),
  }),

  margin: (size: string) => ({
    margin: spacing(size),
  }),

  // 그림자 스타일
  shadow: (shadowName: string) => ({
    boxShadow: shadows(shadowName),
  }),

  // 테두리 스타일
  border: (radius: string, color?: string) => ({
    borderRadius: borderRadius(radius),
    border: color ? `1px solid ${colors.border(color)}` : 'none',
  }),

  // Z-인덱스 스타일
  zIndex: (index: string) => ({
    zIndex: zIndex(index),
  }),

  // 애니메이션 스타일
  transition: (duration: string = 'normal', easing: string = 'ease') => ({
    transition: `all ${animations.duration(duration)} ${animations.easing(easing)}`,
  }),
}

// 컴포넌트별 스타일 프리셋
export const componentStyles = {
  // 버튼 스타일
  button: {
    primary: {
      backgroundColor: colors.primary('500'),
      color: colors.text('inverse'),
      fontSize: typography.fontSize('base'),
      fontWeight: typography.fontWeight('medium'),
      padding: spacing('md'),
      borderRadius: borderRadius('md'),
      transition: `all ${animations.duration('normal')} ${animations.easing('ease')}`,
      cursor: 'pointer',
      border: 'none',
      '&:hover': {
        backgroundColor: colors.primary('600'),
      },
    },
    secondary: {
      backgroundColor: colors.secondary('50'),
      color: colors.text('primary'),
      fontSize: typography.fontSize('base'),
      fontWeight: typography.fontWeight('medium'),
      padding: spacing('md'),
      borderRadius: borderRadius('md'),
      border: `1px solid ${colors.border('medium')}`,
      transition: `all ${animations.duration('normal')} ${animations.easing('ease')}`,
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: colors.secondary('100'),
      },
    },
  },

  // 카드 스타일
  card: {
    default: {
      backgroundColor: colors.background('primary'),
      boxShadow: shadows('md'),
      borderRadius: borderRadius('lg'),
      padding: spacing('xl'),
    },
  },

  // 입력 필드 스타일
  input: {
    default: {
      fontSize: typography.fontSize('base'),
      padding: spacing('md'),
      borderRadius: borderRadius('md'),
      border: `1px solid ${colors.border('medium')}`,
      backgroundColor: colors.background('primary'),
      transition: `all ${animations.duration('normal')} ${animations.easing('ease')}`,
      outline: 'none',
      '&:focus': {
        borderColor: colors.primary('500'),
        boxShadow: `0 0 0 2px ${colors.primary('100')}`,
      },
    },
  },

  // 모달 스타일
  modal: {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background('overlay'),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: zIndex('modalBackdrop'),
    },
    container: {
      backgroundColor: colors.background('primary'),
      boxShadow: shadows('lg'),
      borderRadius: borderRadius('xl'),
      maxWidth: '400px',
      width: '90%',
      animation: 'modalFadeIn 0.3s ease',
    },
  },
}

// 반응형 유틸리티
export const responsive = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
}

export default {
  colors,
  typography,
  spacing,
  shadows,
  borderRadius,
  zIndex,
  animations,
  breakpoints,
  createStyles,
  componentStyles,
  responsive,
}
