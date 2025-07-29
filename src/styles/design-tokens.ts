// GLI Platform 디자인 시스템 분석 결과를 바탕으로 한 디자인 토큰 정의

export interface DesignTokens {
  colors: ColorTokens
  typography: TypographyTokens
  spacing: SpacingTokens
  shadows: ShadowTokens
  borderRadius: BorderRadiusTokens
  breakpoints: BreakpointTokens
  animations: AnimationTokens
  zIndex: ZIndexTokens
}

export interface ColorTokens {
  // Primary Colors
  primary: {
    50: '#e9f1ff'
    100: '#d1e3ff'
    200: '#a3c7ff'
    300: '#75abff'
    400: '#478fff'
    500: '#0d6efd' // Main primary color
    600: '#0b5ed7' // Hover state
    700: '#094eb1'
    800: '#073e8b'
    900: '#052e65'
  }

  // Secondary Colors
  secondary: {
    50: '#f8f9fa'
    100: '#e9ecef'
    200: '#dee2e6'
    300: '#ced4da'
    400: '#adb5bd'
    500: '#6c757d'
    600: '#495057'
    700: '#343a40'
    800: '#212529'
    900: '#000000'
  }

  // Brand Colors
  brand: {
    green: '#00521e' // Header logo color
    gold: '#ffd700' // Premium chip gradient start
    orange: '#ffa500' // Premium chip gradient end
  }

  // Semantic Colors
  semantic: {
    success: '#28a745'
    warning: '#ffc107'
    error: '#dc3545'
    info: '#17a2b8'
  }

  // Background Colors
  background: {
    primary: '#ffffff'
    secondary: '#fafafa'
    tertiary: '#f8f8f8'
    overlay: 'rgba(0, 0, 0, 0.5)'
    sidebar: '#f8f8f8'
  }

  // Text Colors
  text: {
    primary: '#222222'
    secondary: '#333333'
    tertiary: '#666666'
    muted: '#999999'
    inverse: '#ffffff'
  }

  // Border Colors
  border: {
    light: '#eee'
    medium: '#ddd'
    dark: '#ccc'
  }
}

export interface TypographyTokens {
  fontFamily: {
    primary: "'Noto Sans KR', sans-serif"
  }

  fontSize: {
    xs: '11px'
    sm: '12px'
    base: '14px'
    lg: '16px'
    xl: '18px'
    '2xl': '20px'
    '3xl': '24px'
  }

  fontWeight: {
    normal: '400'
    medium: '500'
    semibold: '600'
    bold: '700'
  }

  lineHeight: {
    tight: '1.2'
    normal: '1.4'
    relaxed: '1.5'
    loose: '1.8'
  }
}

export interface SpacingTokens {
  xs: '4px'
  sm: '8px'
  md: '12px'
  lg: '15px'
  xl: '20px'
  '2xl': '30px'
  '3xl': '40px'
  '4xl': '70px'
}

export interface ShadowTokens {
  sm: '0 2px 4px rgba(0, 0, 0, 0.1)'
  md: '0 2px 5px rgba(0, 0, 0, 0.05)'
  lg: '0 4px 20px rgba(0, 0, 0, 0.15)'
  sidebar: '-2px 0 5px rgba(0, 0, 0, 0.1)'
  chip: '0 2px 4px rgba(0, 0, 0, 0.1)'
}

export interface BorderRadiusTokens {
  sm: '4px'
  md: '6px'
  lg: '8px'
  xl: '12px'
  full: '50%'
}

export interface BreakpointTokens {
  sm: '576px'
  md: '768px'
  lg: '992px'
  xl: '1200px'
  '2xl': '1400px'
}

export interface AnimationTokens {
  duration: {
    fast: '0.2s'
    normal: '0.3s'
    slow: '0.5s'
  }

  easing: {
    ease: 'ease'
    easeIn: 'ease-in'
    easeOut: 'ease-out'
    easeInOut: 'ease-in-out'
  }

  keyframes: {
    modalFadeIn: {
      from: {
        opacity: '0'
        transform: 'translateY(-20px)'
      }
      to: {
        opacity: '1'
        transform: 'translateY(0)'
      }
    }
  }
}

export interface ZIndexTokens {
  base: 0
  dropdown: 1000
  sticky: 1020
  fixed: 1030
  modalBackdrop: 1040
  modal: 1050
  popover: 1060
  tooltip: 1070
  sidebar: 1000
  sidebarOverlay: 998
}

// 디자인 토큰 객체 생성
export const designTokens: DesignTokens = {
  colors: {
    primary: {
      50: '#e9f1ff',
      100: '#d1e3ff',
      200: '#a3c7ff',
      300: '#75abff',
      400: '#478fff',
      500: '#0d6efd',
      600: '#0b5ed7',
      700: '#094eb1',
      800: '#073e8b',
      900: '#052e65',
    },
    secondary: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#000000',
    },
    brand: {
      green: '#00521e',
      gold: '#ffd700',
      orange: '#ffa500',
    },
    semantic: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8',
    },
    background: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f8f8f8',
      overlay: 'rgba(0, 0, 0, 0.5)',
      sidebar: '#f8f8f8',
    },
    text: {
      primary: '#222222',
      secondary: '#333333',
      tertiary: '#666666',
      muted: '#999999',
      inverse: '#ffffff',
    },
    border: {
      light: '#eee',
      medium: '#ddd',
      dark: '#ccc',
    },
  },
  typography: {
    fontFamily: {
      primary: "'Noto Sans KR', sans-serif",
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.5',
      loose: '1.8',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '15px',
    xl: '20px',
    '2xl': '30px',
    '3xl': '40px',
    '4xl': '70px',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 2px 5px rgba(0, 0, 0, 0.05)',
    lg: '0 4px 20px rgba(0, 0, 0, 0.15)',
    sidebar: '-2px 0 5px rgba(0, 0, 0, 0.1)',
    chip: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '50%',
  },
  breakpoints: {
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    '2xl': '1400px',
  },
  animations: {
    duration: {
      fast: '0.2s',
      normal: '0.3s',
      slow: '0.5s',
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
    keyframes: {
      modalFadeIn: {
        from: {
          opacity: '0',
          transform: 'translateY(-20px)',
        },
        to: {
          opacity: '1',
          transform: 'translateY(0)',
        },
      },
    },
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    sidebar: 1000,
    sidebarOverlay: 998,
  },
}

// CSS 커스텀 프로퍼티로 변환하는 유틸리티 함수
export function generateCSSVariables(tokens: DesignTokens): string {
  const variables: string[] = []

  // Colors
  Object.entries(tokens.colors).forEach(([category, colors]) => {
    if (typeof colors === 'object') {
      Object.entries(colors).forEach(([name, value]) => {
        variables.push(`--color-${category}-${name}: ${value};`)
      })
    }
  })

  // Typography
  Object.entries(tokens.typography.fontSize).forEach(([name, value]) => {
    variables.push(`--font-size-${name}: ${value};`)
  })

  Object.entries(tokens.typography.fontWeight).forEach(([name, value]) => {
    variables.push(`--font-weight-${name}: ${value};`)
  })

  // Spacing
  Object.entries(tokens.spacing).forEach(([name, value]) => {
    variables.push(`--spacing-${name}: ${value};`)
  })

  // Shadows
  Object.entries(tokens.shadows).forEach(([name, value]) => {
    variables.push(`--shadow-${name}: ${value};`)
  })

  // Border Radius
  Object.entries(tokens.borderRadius).forEach(([name, value]) => {
    variables.push(`--border-radius-${name}: ${value};`)
  })

  // Z-Index
  Object.entries(tokens.zIndex).forEach(([name, value]) => {
    variables.push(`--z-index-${name}: ${value};`)
  })

  return `:root {\n  ${variables.join('\n  ')}\n}`
}

// CSS 변수 문자열 생성
export const cssVariables = generateCSSVariables(designTokens)

export default designTokens
