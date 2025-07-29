// Button 컴포넌트 타입 정의

export interface ButtonProps {
  // 기본 속성
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean

  // 접근성 속성
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaPressed?: boolean
  ariaExpanded?: boolean

  // 아이콘 속성
  icon?: string
  iconPosition?: 'left' | 'right'
  iconOnly?: boolean

  // 이벤트 핸들러
  onClick?: (event: MouseEvent) => void
  onKeydown?: (event: KeyboardEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void

  // HTML 속성
  type?: 'button' | 'submit' | 'reset'
  form?: string
  name?: string
  value?: string

  // 스타일 속성
  fullWidth?: boolean
  rounded?: boolean
}

export interface ButtonEmits {
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}

export interface ButtonSlots {
  default?: () => any
  icon?: () => any
  loading?: () => any
}
