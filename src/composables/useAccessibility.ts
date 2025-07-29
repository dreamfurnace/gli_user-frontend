// 접근성 관련 Vue 컴포지션 훅
// WCAG 2.1 AA 기준 준수

import { ref, onMounted, onUnmounted, nextTick, computed, type Ref } from 'vue'
import {
  generateId,
  FocusTrap,
  createKeyboardHandler,
  focusManagement,
  ariaState,
} from '@/utils/accessibility'

// 접근성 훅 기본 인터페이스
export interface UseAccessibilityOptions {
  autoFocus?: boolean
  trapFocus?: boolean
  restoreFocus?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
}

// 접근성 훅 반환 타입
export interface UseAccessibilityReturn {
  id: string
  ariaLabel: string
  ariaDescribedBy: string
  focusTrap: FocusTrap | null
  isFocused: Ref<boolean>
  focus: () => void
  blur: () => void
  handleKeydown: (event: KeyboardEvent) => void
  // === 아래 라인 추가! ===
  colorContrast?: number
  focusVisible?: boolean
  prefersReducedMotion?: boolean
  prefersHighContrast?: boolean
  runAccessibilityCheck: () => Promise<any[]>
}

// 기본 접근성 훅
export function useAccessibility(options: UseAccessibilityOptions = {}): UseAccessibilityReturn {
  const {
    autoFocus = false,
    trapFocus = false,
    restoreFocus = false,
    ariaLabel = '',
    ariaDescribedBy = '',
  } = options

  const id = ref(generateId())
  const isFocused = ref(false)
  const focusTrap = ref<FocusTrap | null>(null)
  const savedFocus = ref<HTMLElement | null>(null)

  // 포커스 관리
  const focus = () => {
    isFocused.value = true
  }

  const blur = () => {
    isFocused.value = false
  }

  // 키보드 이벤트 핸들러
  const handleKeydown = createKeyboardHandler({
    Escape: () => {
      if (trapFocus && focusTrap.value) {
        blur()
      }
    },
  })

  // 포커스 트랩 설정
  const setupFocusTrap = (element: HTMLElement) => {
    if (trapFocus) {
      focusTrap.value = new FocusTrap(element)

      const handleTrapKeydown = (event: KeyboardEvent) => {
        focusTrap.value?.trap(event)
      }

      element.addEventListener('keydown', handleTrapKeydown)

      return () => {
        element.removeEventListener('keydown', handleTrapKeydown)
      }
    }
    return () => {}
  }

  // 자동 포커스 설정
  const setupAutoFocus = (element: HTMLElement) => {
    if (autoFocus) {
      nextTick(() => {
        element.focus()
        focus()
      })
    }
  }

  // 포커스 복원 설정
  const setupFocusRestore = () => {
    if (restoreFocus) {
      savedFocus.value = focusManagement.saveFocus()

      return () => {
        if (savedFocus.value) {
          focusManagement.restoreFocus(savedFocus.value)
        }
      }
    }
    return () => {}
  }

  const runAccessibilityCheck = async (): Promise<any[]> => {
    // 실제 구현이 없으면, 임시로라도 빈 배열 반환
    return []
  }

  return {
    id: id.value,
    ariaLabel,
    ariaDescribedBy,
    focusTrap: focusTrap.value,
    isFocused,
    focus,
    blur,
    handleKeydown,
    runAccessibilityCheck,
  }
}

// 모달 접근성 훅
export function useModalAccessibility(
  options: {
    title?: string
    description?: string
    closeOnEscape?: boolean
    closeOnOverlayClick?: boolean
  } = {},
) {
  const { title = '', description = '', closeOnEscape = true, closeOnOverlayClick = true } = options

  const isOpen = ref(false)
  const modalId = ref(generateId('modal'))
  const titleId = ref(generateId('modal-title'))
  const descriptionId = ref(generateId('modal-description'))
  const focusTrap = ref<FocusTrap | null>(null)
  const savedFocus = ref<HTMLElement | null>(null)

  // 모달 열기
  const open = () => {
    savedFocus.value = focusManagement.saveFocus()
    isOpen.value = true

    nextTick(() => {
      const modalElement = document.getElementById(modalId.value)
      if (modalElement) {
        focusTrap.value = new FocusTrap(modalElement)
        focusTrap.value.focusFirst()
      }
    })
  }

  // 모달 닫기
  const close = () => {
    isOpen.value = false
    focusTrap.value = null

    if (savedFocus.value) {
      focusManagement.restoreFocus(savedFocus.value)
      savedFocus.value = null
    }
  }

  // 키보드 이벤트 핸들러
  const handleKeydown = createKeyboardHandler({
    Escape: () => {
      if (closeOnEscape) {
        close()
      }
    },
  })

  // 오버레이 클릭 핸들러
  const handleOverlayClick = (event: Event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      close()
    }
  }

  // 포커스 트랩 이벤트 핸들러
  const handleTrapKeydown = (event: KeyboardEvent) => {
    if (focusTrap.value) {
      focusTrap.value.trap(event)
    }
  }

  return {
    isOpen,
    modalId: modalId.value,
    titleId: titleId.value,
    descriptionId: descriptionId.value,
    open,
    close,
    handleKeydown,
    handleOverlayClick,
    handleTrapKeydown,
  }
}

// 버튼 접근성 훅
export function useButtonAccessibility(
  options: {
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    loading?: boolean
    icon?: string
    iconPosition?: 'left' | 'right'
  } = {},
) {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon = '',
    iconPosition = 'left',
  } = options

  const buttonId = ref(generateId('button'))
  const isPressed = ref(false)

  // 버튼 상태 관리
  const buttonState = computed(() => ({
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
    'aria-pressed': isPressed.value,
    'aria-label': loading ? '로딩 중...' : '',
  }))

  // 버튼 클릭 핸들러
  const handleClick = (event: MouseEvent) => {
    if (disabled || loading) {
      event.preventDefault()
      return
    }

    isPressed.value = !isPressed.value
  }

  // 키보드 이벤트 핸들러
  const handleKeydown = createKeyboardHandler({
    Enter: () => {
      if (!disabled && !loading) {
        isPressed.value = !isPressed.value
      }
    },
    Space: () => {
      if (!disabled && !loading) {
        isPressed.value = !isPressed.value
      }
    },
  })

  return {
    buttonId: buttonId.value,
    buttonState,
    isPressed,
    handleClick,
    handleKeydown,
  }
}

// 입력 필드 접근성 훅
export function useInputAccessibility(
  options: {
    type?: string
    required?: boolean
    invalid?: boolean
    errorMessage?: string
    helpText?: string
  } = {},
) {
  const {
    type = 'text',
    required = false,
    invalid = false,
    errorMessage = '',
    helpText = '',
  } = options

  const inputId = ref(generateId('input'))
  const errorId = ref(generateId('input-error'))
  const helpId = ref(generateId('input-help'))
  const isFocused = ref(false)

  // 입력 필드 상태
  const inputState = computed(() => ({
    'aria-invalid': invalid,
    'aria-required': required,
    'aria-describedby': [errorId.value, helpId.value].filter(Boolean).join(' ') || undefined,
  }))

  // 포커스 핸들러
  const handleFocus = () => {
    isFocused.value = true
  }

  const handleBlur = () => {
    isFocused.value = false
  }

  return {
    inputId: inputId.value,
    errorId: errorId.value,
    helpId: helpId.value,
    inputState,
    isFocused,
    handleFocus,
    handleBlur,
  }
}
