// Input 컴포넌트 타입 정의

export interface InputProps {
  // 기본 속성
  type?:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'search'
    | 'date'
    | 'time'
    | 'datetime-local'
  placeholder?: string
  value?: string | number
  defaultValue?: string | number

  // 상태 속성
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  loading?: boolean

  // 접근성 속성
  id?: string
  name?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaRequired?: boolean

  // 유효성 검사
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string

  // 스타일 속성
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  rounded?: boolean

  // 아이콘 속성
  icon?: string
  iconPosition?: 'left' | 'right'

  // 이벤트 핸들러
  onInput?: (event: Event) => void
  onChange?: (event: Event) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onKeydown?: (event: KeyboardEvent) => void
}

export interface InputEmits {
  input: [event: Event]
  change: [event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  'update:value': [value: string | number]
}

export interface InputSlots {
  prefix?: () => any
  suffix?: () => any
  error?: () => any
  help?: () => any
}
