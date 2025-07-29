// 접근성 유틸리티 함수들
// WCAG 2.1 AA 기준 준수

// 고유 ID 생성 (ARIA 속성용)
export const generateId = (prefix: string = 'component'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// 포커스 트랩 관리
export class FocusTrap {
  public container: HTMLElement
  public focusableElements: HTMLElement[]
  public firstElement: HTMLElement
  public lastElement: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.focusableElements = this.getFocusableElements()
    this.firstElement = this.focusableElements[0]
    this.lastElement = this.focusableElements[this.focusableElements.length - 1]
  }

  // 포커스 가능한 요소 조회
  public getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ')

    return Array.from(this.container.querySelectorAll(selector)) as HTMLElement[]
  }

  public trap(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstElement) {
        event.preventDefault()
        this.lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === this.lastElement) {
        event.preventDefault()
        this.firstElement.focus()
      }
    }
  }

  public focusFirst(): void {
    if (this.firstElement) {
      this.firstElement.focus()
    }
  }

  public focusLast(): void {
    if (this.lastElement) {
      this.lastElement.focus()
    }
  }
}

// 스크린 리더 전용 텍스트 생성
export const createScreenReaderText = (text: string): string => {
  return `<span class="sr-only">${text}</span>`
}

// ARIA 라벨 생성
export const createAriaLabel = (visibleText: string, screenReaderText?: string): string => {
  return screenReaderText ? `${visibleText} ${screenReaderText}` : visibleText
}

// 색상 대비 계산 (WCAG 2.1 기준)
export const calculateContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const [rs, gs, bs] = [r, g, b].map((c) => {
      if (c <= 0.03928) {
        return c / 12.92
      }
      return Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const luminance1 = getLuminance(color1)
  const luminance2 = getLuminance(color2)

  const lighter = Math.max(luminance1, luminance2)
  const darker = Math.min(luminance1, luminance2)

  return (lighter + 0.05) / (darker + 0.05)
}

// WCAG 2.1 AA 대비 검증
export const meetsWCAGAA = (contrastRatio: number, isLargeText: boolean = false): boolean => {
  const requiredRatio = isLargeText ? 3.0 : 4.5
  return contrastRatio >= requiredRatio
}

// 키보드 이벤트 핸들러
export const createKeyboardHandler = (handlers: {
  Enter?: () => void
  Escape?: () => void
  Space?: () => void
  ArrowUp?: () => void
  ArrowDown?: () => void
  ArrowLeft?: () => void
  ArrowRight?: () => void
}) => {
  return (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        handlers.Enter?.()
        break
      case 'Escape':
        handlers.Escape?.()
        break
      case ' ':
        event.preventDefault()
        handlers.Space?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        handlers.ArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        handlers.ArrowDown?.()
        break
      case 'ArrowLeft':
        event.preventDefault()
        handlers.ArrowLeft?.()
        break
      case 'ArrowRight':
        event.preventDefault()
        handlers.ArrowRight?.()
        break
    }
  }
}

// 포커스 관리
export const focusManagement = {
  // 포커스 저장
  saveFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement
  },

  // 포커스 복원
  restoreFocus: (element: HTMLElement | null): void => {
    if (element && typeof element.focus === 'function') {
      element.focus()
    }
  },

  // 포커스 이동
  moveFocus: (direction: 'next' | 'previous', container?: HTMLElement): void => {
    const focusableElements = container
      ? (Array.from(container.querySelectorAll('[tabindex]:not([tabindex="-1"]')) as HTMLElement[])
      : (Array.from(document.querySelectorAll('[tabindex]:not([tabindex="-1"]')) as HTMLElement[])

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    let nextIndex: number

    if (direction === 'next') {
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
    }

    focusableElements[nextIndex]?.focus()
  },
}

// ARIA 상태 관리
export const ariaState = {
  // 확장/축소 상태 토글
  toggleExpanded: (element: HTMLElement): void => {
    const currentState = element.getAttribute('aria-expanded')
    const newState = currentState === 'true' ? 'false' : 'true'
    element.setAttribute('aria-expanded', newState)
  },

  // 선택 상태 토글
  toggleSelected: (element: HTMLElement): void => {
    const currentState = element.getAttribute('aria-selected')
    const newState = currentState === 'true' ? 'false' : 'true'
    element.setAttribute('aria-selected', newState)
  },

  // 활성 상태 설정
  setCurrent: (element: HTMLElement, isCurrent: boolean = true): void => {
    if (isCurrent) {
      element.setAttribute('aria-current', 'page')
    } else {
      element.removeAttribute('aria-current')
    }
  },
}

// 접근성 검증 함수들
export const accessibilityValidation = {
  // 필수 ARIA 속성 검증
  validateRequiredAria: (element: HTMLElement, requiredAttributes: string[]): boolean => {
    return requiredAttributes.every((attr) => element.hasAttribute(attr))
  },

  // 색상 대비 검증
  validateColorContrast: (
    foreground: string,
    background: string,
    isLargeText: boolean = false,
  ): boolean => {
    const contrastRatio = calculateContrastRatio(foreground, background)
    return meetsWCAGAA(contrastRatio, isLargeText)
  },

  // 키보드 접근성 검증
  validateKeyboardAccessibility: (element: HTMLElement): boolean => {
    return (
      element.hasAttribute('tabindex') ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT' ||
      element.tagName === 'SELECT' ||
      element.tagName === 'TEXTAREA'
    )
  },
}
