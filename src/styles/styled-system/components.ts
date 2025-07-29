// 기본 스타일 컴포넌트들
import { computed } from 'vue'
import { mixins, color, typography, spacing, shadow, borderRadius } from './index'

// 버튼 컴포넌트 스타일
export const createButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
) => {
  return computed(() => {
    const baseStyle = mixins.button(variant).value
    const sizeStyles = {
      sm: {
        padding: `${spacing('sm').value} ${spacing('md').value}`,
        fontSize: typography.fontSize('sm').value,
      },
      md: {
        padding: `${spacing('md').value} ${spacing('lg').value}`,
        fontSize: typography.fontSize('base').value,
      },
      lg: {
        padding: `${spacing('lg').value} ${spacing('xl').value}`,
        fontSize: typography.fontSize('lg').value,
      },
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
    }
  })
}

// 카드 컴포넌트 스타일
export const createCardStyle = (elevation: 'sm' | 'md' | 'lg' = 'sm') => {
  return computed(() => {
    const baseStyle = mixins.card().value
    const elevationStyles = {
      sm: { boxShadow: shadow('sm').value },
      md: { boxShadow: shadow('md').value },
      lg: { boxShadow: shadow('lg').value },
    }

    return {
      ...baseStyle,
      ...elevationStyles[elevation],
    }
  })
}

// 입력 필드 컴포넌트 스타일
export const createInputStyle = (state: 'default' | 'focus' | 'error' = 'default') => {
  return computed(() => {
    const baseStyle = mixins.input().value
    const stateStyles = {
      default: {},
      focus: {
        borderColor: color('primary', '500').value,
        boxShadow: `0 0 0 3px ${color('primary', '100').value}`,
      },
      error: {
        borderColor: color('semantic', 'error').value,
        boxShadow: `0 0 0 3px ${color('semantic', 'error').value}20`,
      },
    }

    return {
      ...baseStyle,
      ...stateStyles[state],
    }
  })
}

// 텍스트 컴포넌트 스타일
export const createTextStyle = (variant: 'h1' | 'h2' | 'h3' | 'body' | 'caption' = 'body') => {
  return computed(() => {
    const variantStyles = {
      h1: {
        fontSize: typography.fontSize('3xl').value,
        fontWeight: typography.fontWeight('bold').value,
        lineHeight: typography.lineHeight('tight').value,
        color: color('text', 'primary').value,
        marginBottom: spacing('lg').value,
      },
      h2: {
        fontSize: typography.fontSize('2xl').value,
        fontWeight: typography.fontWeight('semibold').value,
        lineHeight: typography.lineHeight('tight').value,
        color: color('text', 'primary').value,
        marginBottom: spacing('md').value,
      },
      h3: {
        fontSize: typography.fontSize('xl').value,
        fontWeight: typography.fontWeight('semibold').value,
        lineHeight: typography.lineHeight('normal').value,
        color: color('text', 'primary').value,
        marginBottom: spacing('sm').value,
      },
      body: {
        fontSize: typography.fontSize('base').value,
        fontWeight: typography.fontWeight('normal').value,
        lineHeight: typography.lineHeight('relaxed').value,
        color: color('text', 'primary').value,
      },
      caption: {
        fontSize: typography.fontSize('sm').value,
        fontWeight: typography.fontWeight('normal').value,
        lineHeight: typography.lineHeight('normal').value,
        color: color('text', 'tertiary').value,
      },
    }

    return variantStyles[variant]
  })
}

// 레이아웃 컴포넌트 스타일
export const createLayoutStyle = (
  type: 'container' | 'section' | 'flex' | 'grid' = 'container',
) => {
  return computed(() => {
    const layoutStyles = {
      container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `0 ${spacing('lg').value}`,
        width: '100%',
      },
      section: {
        padding: `${spacing('2xl').value} 0`,
        width: '100%',
      },
      flex: {
        display: 'flex',
        alignItems: 'center',
        gap: spacing('md').value,
      },
      grid: {
        display: 'grid',
        gap: spacing('lg').value,
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      },
    }

    return layoutStyles[type]
  })
}
