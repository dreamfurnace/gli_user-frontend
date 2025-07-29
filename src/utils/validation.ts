// 공통 유효성 검사 프레임워크
import { ref, readonly } from 'vue'

// 기본 유효성 검사 규칙
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
  message?: string
}

// 유효성 검사 결과
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  firstError?: string
}

// 폼 필드 상태
export interface FieldState {
  value: any
  isValid: boolean
  errors: string[]
  isDirty: boolean
  isTouched: boolean
  isFocused: boolean
}

// 폼 전체 상태
export interface FormState {
  fields: Record<string, FieldState>
  isValid: boolean
  isDirty: boolean
  isSubmitted: boolean
  errors: string[]
}

// 실시간 유효성 검사 옵션
export interface ValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
  validateOnInput?: boolean
  debounceMs?: number
}

// 기본 유효성 검사 함수
export const validateField = (value: any, rules: ValidationRule[]): ValidationResult => {
  const errors: string[] = []

  for (const rule of rules) {
    const error = validateRule(value, rule)
    if (error) {
      errors.push(error)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0],
  }
}

// 개별 규칙 검사
const validateRule = (value: any, rule: ValidationRule): string | null => {
  // 필수 입력 검사
  if (rule.required) {
    if (value === null || value === undefined || value === '') {
      return rule.message || '필수 입력 항목입니다.'
    }
  }

  // 빈 값이면 다른 검사 건너뛰기 (필수가 아닌 경우)
  if (value === null || value === undefined || value === '') {
    return null
  }

  const stringValue = String(value)

  // 최소 길이 검사
  if (rule.minLength && stringValue.length < rule.minLength) {
    return rule.message || `최소 ${rule.minLength}자 이상 입력해주세요.`
  }

  // 최대 길이 검사
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return rule.message || `최대 ${rule.maxLength}자 이하로 입력해주세요.`
  }

  // 패턴 검사
  if (rule.pattern && !rule.pattern.test(stringValue)) {
    return rule.message || '올바른 형식이 아닙니다.'
  }

  // 커스텀 검사
  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return rule.message || customError
    }
  }

  return null
}

// 일반적인 유효성 검사 규칙들
export const validationRules = {
  // 이름 검사
  name: [
    { required: true, message: '이름을 입력해주세요.' },
    { minLength: 2, message: '이름은 2자 이상 입력해주세요.' },
    { maxLength: 20, message: '이름은 20자 이하로 입력해주세요.' },
    { pattern: /^[가-힣a-zA-Z\s]+$/, message: '이름은 한글, 영문, 공백만 입력 가능합니다.' },
  ],

  // 이메일 검사
  email: [
    { required: true, message: '이메일을 입력해주세요.' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '올바른 이메일 형식이 아닙니다.' },
  ],

  // 전화번호 검사
  phone: [
    { required: true, message: '전화번호를 입력해주세요.' },
    { pattern: /^[0-9-]+$/, message: '전화번호는 숫자와 하이픈(-)만 입력 가능합니다.' },
    { minLength: 10, message: '전화번호는 10자 이상 입력해주세요.' },
    { maxLength: 13, message: '전화번호는 13자 이하로 입력해주세요.' },
  ],

  // 주민등록번호 검사
  residentNumber: [
    { required: true, message: '주민등록번호를 입력해주세요.' },
    { pattern: /^\d{6}-\d{7}$/, message: '주민등록번호 형식이 올바르지 않습니다.' },
    {
      custom: (value: string) => {
        if (!isValidResidentNumber(value)) {
          return '올바른 주민등록번호가 아닙니다.'
        }
        return null
      },
    },
  ],

  // 사업자등록번호 검사
  businessNumber: [
    { required: true, message: '사업자등록번호를 입력해주세요.' },
    { pattern: /^\d{3}-\d{2}-\d{5}$/, message: '사업자등록번호 형식이 올바르지 않습니다.' },
    {
      custom: (value: string) => {
        if (!isValidBusinessNumber(value)) {
          return '올바른 사업자등록번호가 아닙니다.'
        }
        return null
      },
    },
  ],

  // 주소 검사
  address: [
    { required: true, message: '주소를 입력해주세요.' },
    { minLength: 5, message: '주소는 5자 이상 입력해주세요.' },
  ],

  // 금액 검사
  amount: [
    { required: true, message: '금액을 입력해주세요.' },
    {
      custom: (value: any) => {
        const numValue = Number(value)
        if (isNaN(numValue)) {
          return '올바른 금액을 입력해주세요.'
        }
        if (numValue < 0) {
          return '금액은 0 이상이어야 합니다.'
        }
        return null
      },
    },
  ],

  // 날짜 검사
  date: [
    { required: true, message: '날짜를 선택해주세요.' },
    {
      custom: (value: any) => {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return '올바른 날짜를 선택해주세요.'
        }
        return null
      },
    },
  ],

  // 파일 검사
  file: [
    { required: true, message: '파일을 선택해주세요.' },
    {
      custom: (value: File | File[]) => {
        const files = Array.isArray(value) ? value : [value]
        for (const file of files) {
          if (file.size > 10 * 1024 * 1024) {
            // 10MB
            return '파일 크기는 10MB 이하여야 합니다.'
          }
        }
        return null
      },
    },
  ],

  // 계약서 번호 검사
  contractNumber: [
    { required: true, message: '계약서 번호를 입력해주세요.' },
    {
      pattern: /^[A-Z]{2}-\d{6}$/,
      message: '계약서 번호 형식이 올바르지 않습니다. (예: AB-123456)',
    },
  ],

  // 부동산 등기번호 검사
  propertyNumber: [
    { required: true, message: '부동산 등기번호를 입력해주세요.' },
    { pattern: /^\d{4}-\d{4}-\d{6}$/, message: '부동산 등기번호 형식이 올바르지 않습니다.' },
  ],
}

// 주민등록번호 유효성 검사
export const isValidResidentNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/-/g, '')
  if (cleanNumber.length !== 13) return false

  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5]
  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanNumber[i]) * weights[i]
  }

  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === parseInt(cleanNumber[12])
}

// 사업자등록번호 유효성 검사
export const isValidBusinessNumber = (number: string): boolean => {
  const cleanNumber = number.replace(/-/g, '')
  if (cleanNumber.length !== 10) return false

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNumber[i]) * weights[i]
  }

  sum += Math.floor((parseInt(cleanNumber[8]) * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10
  return checkDigit === parseInt(cleanNumber[9])
}

// 전화번호 포맷팅
export const formatPhoneNumber = (value: string): string => {
  const cleanValue = value.replace(/[^0-9]/g, '')

  if (cleanValue.length <= 3) {
    return cleanValue
  } else if (cleanValue.length <= 7) {
    return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3)
  } else {
    return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3, 7) + '-' + cleanValue.slice(7, 11)
  }
}

// 주민등록번호 포맷팅
export const formatResidentNumber = (value: string): string => {
  const cleanValue = value.replace(/[^0-9]/g, '')

  if (cleanValue.length > 6) {
    return cleanValue.slice(0, 6) + '-' + cleanValue.slice(6, 13)
  }

  return cleanValue
}

// 사업자등록번호 포맷팅
export const formatBusinessNumber = (value: string): string => {
  const cleanValue = value.replace(/[^0-9]/g, '')

  if (cleanValue.length > 3) {
    return cleanValue.slice(0, 3) + '-' + cleanValue.slice(3, 5) + '-' + cleanValue.slice(5, 10)
  }

  return cleanValue
}

// 금액 포맷팅 (천 단위 콤마)
export const formatAmount = (value: number): string => {
  return value.toLocaleString('ko-KR')
}

// 날짜 포맷팅
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day)
}

// 복합 유효성 검사 (여러 필드)
export interface CompositeValidationRule {
  fields: string[]
  validator: (values: Record<string, any>) => string | null
  message?: string
}

export const validateComposite = (
  values: Record<string, any>,
  rules: CompositeValidationRule[],
): ValidationResult => {
  const errors: string[] = []

  for (const rule of rules) {
    const error = rule.validator(values)
    if (error) {
      errors.push(rule.message || error)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    firstError: errors[0],
  }
}

// 일반적인 복합 검사 규칙들
export const compositeValidationRules = {
  // 시작일이 종료일보다 늦을 수 없음
  dateRange: (startDateField: string, endDateField: string) => ({
    fields: [startDateField, endDateField],
    validator: (values: Record<string, any>) => {
      const startDate = new Date(values[startDateField])
      const endDate = new Date(values[endDateField])

      if (startDate > endDate) {
        return '시작일은 종료일보다 늦을 수 없습니다.'
      }

      return null
    },
  }),

  // 비밀번호 확인
  passwordConfirm: (passwordField: string, confirmField: string) => ({
    fields: [passwordField, confirmField],
    validator: (values: Record<string, any>) => {
      if (values[passwordField] !== values[confirmField]) {
        return '비밀번호가 일치하지 않습니다.'
      }

      return null
    },
  }),

  // 최소 금액 검사
  minAmount: (amountField: string, minAmount: number) => ({
    fields: [amountField],
    validator: (values: Record<string, any>) => {
      const amount = Number(values[amountField])

      if (amount < minAmount) {
        return `최소 ${formatAmount(minAmount)}원 이상 입력해주세요.`
      }

      return null
    },
  }),

  // 계약서 필수 항목 검사
  contractRequired: (fields: string[]) => ({
    fields,
    validator: (values: Record<string, any>) => {
      for (const field of fields) {
        if (!values[field] || values[field].toString().trim() === '') {
          return '계약서 작성에 필요한 필수 항목이 누락되었습니다.'
        }
      }
      return null
    },
  }),

  // 부동산 정보 검증
  propertyInfo: (addressField: string, areaField: string, priceField: string) => ({
    fields: [addressField, areaField, priceField],
    validator: (values: Record<string, any>) => {
      if (!values[addressField] || values[addressField].toString().trim() === '') {
        return '부동산 주소를 입력해주세요.'
      }
      if (!values[areaField] || Number(values[areaField]) <= 0) {
        return '부동산 면적을 입력해주세요.'
      }
      if (!values[priceField] || Number(values[priceField]) <= 0) {
        return '부동산 가격을 입력해주세요.'
      }
      return null
    },
  }),
}

// 유효성 검사 헬퍼 함수들
export const validationHelpers = {
  // 필수 입력 검사
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== ''
  },

  // 이메일 형식 검사
  isEmail: (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },

  // 전화번호 형식 검사
  isPhone: (value: string): boolean => {
    return /^[0-9-]+$/.test(value) && value.length >= 10 && value.length <= 13
  },

  // 숫자 검사
  isNumber: (value: any): boolean => {
    return !isNaN(Number(value)) && isFinite(Number(value))
  },

  // 정수 검사
  isInteger: (value: any): boolean => {
    return Number.isInteger(Number(value))
  },

  // 양수 검사
  isPositive: (value: any): boolean => {
    return Number(value) > 0
  },

  // 날짜 검사
  isDate: (value: any): boolean => {
    const date = new Date(value)
    return !isNaN(date.getTime())
  },

  // URL 검사
  isUrl: (value: string): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },

  // 파일 크기 검사
  isValidFileSize: (file: File, maxSizeMB: number): boolean => {
    return file.size <= maxSizeMB * 1024 * 1024
  },

  // 파일 타입 검사
  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type)
  },
}

// 폼 상태 관리 클래스
export class FormValidator {
  private state: FormState
  private fieldRules: Record<string, ValidationRule[]>
  private compositeRules: CompositeValidationRule[]
  private options: ValidationOptions

  constructor(
    initialValues: Record<string, any> = {},
    fieldRules: Record<string, ValidationRule[]> = {},
    compositeRules: CompositeValidationRule[] = [],
    options: ValidationOptions = {},
  ) {
    this.fieldRules = fieldRules
    this.compositeRules = compositeRules
    this.options = {
      validateOnChange: true,
      validateOnBlur: true,
      validateOnInput: false,
      debounceMs: 300,
      ...options,
    }

    this.state = {
      fields: {},
      isValid: true,
      isDirty: false,
      isSubmitted: false,
      errors: [],
    }

    // 초기 필드 상태 설정
    Object.keys(initialValues).forEach((fieldName) => {
      this.state.fields[fieldName] = {
        value: initialValues[fieldName],
        isValid: true,
        errors: [],
        isDirty: false,
        isTouched: false,
        isFocused: false,
      }
    })
  }

  // 필드 값 업데이트
  updateField(fieldName: string, value: any): void {
    if (!this.state.fields[fieldName]) {
      this.state.fields[fieldName] = {
        value,
        isValid: true,
        errors: [],
        isDirty: false,
        isTouched: false,
        isFocused: false,
      }
    } else {
      const field = this.state.fields[fieldName]
      field.value = value
      field.isDirty = true
    }

    if (this.options.validateOnChange) {
      this.validateField(fieldName)
    }
  }

  // 필드 포커스
  focusField(fieldName: string): void {
    if (this.state.fields[fieldName]) {
      this.state.fields[fieldName].isFocused = true
    }
  }

  // 필드 블러
  blurField(fieldName: string): void {
    if (this.state.fields[fieldName]) {
      const field = this.state.fields[fieldName]
      field.isFocused = false
      field.isTouched = true

      if (this.options.validateOnBlur) {
        this.validateField(fieldName)
      }
    }
  }

  // 개별 필드 유효성 검사
  validateField(fieldName: string): ValidationResult {
    const field = this.state.fields[fieldName]
    if (!field || !this.fieldRules[fieldName]) {
      return { isValid: true, errors: [] }
    }

    const result = validateField(field.value, this.fieldRules[fieldName])
    field.isValid = result.isValid
    field.errors = result.errors

    this.updateFormValidity()
    return result
  }

  // 전체 폼 유효성 검사
  validateForm(): ValidationResult {
    // 개별 필드 검사
    Object.keys(this.fieldRules).forEach((fieldName) => {
      this.validateField(fieldName)
    })

    // 복합 검사
    const compositeResult = validateComposite(this.getFormValues(), this.compositeRules)

    this.state.errors = compositeResult.errors
    this.updateFormValidity()

    return {
      isValid: this.state.isValid,
      errors: this.state.errors,
      firstError: this.state.errors[0],
    }
  }

  // 폼 제출
  submitForm(): ValidationResult {
    this.state.isSubmitted = true
    return this.validateForm()
  }

  // 폼 값들 가져오기
  getFormValues(): Record<string, any> {
    const values: Record<string, any> = {}
    Object.keys(this.state.fields).forEach((fieldName) => {
      values[fieldName] = this.state.fields[fieldName].value
    })
    return values
  }

  // 폼 상태 가져오기
  getFormState(): FormState {
    return { ...this.state }
  }

  // 필드 상태 가져오기
  getFieldState(fieldName: string): FieldState | null {
    return this.state.fields[fieldName] ? { ...this.state.fields[fieldName] } : null
  }

  // 폼 유효성 업데이트
  private updateFormValidity(): void {
    const fieldValid = Object.values(this.state.fields).every((field) => field.isValid)
    const compositeValid = this.state.errors.length === 0
    this.state.isValid = fieldValid && compositeValid
  }

  // 폼 리셋
  resetForm(): void {
    Object.keys(this.state.fields).forEach((fieldName) => {
      const field = this.state.fields[fieldName]
      field.value = ''
      field.isValid = true
      field.errors = []
      field.isDirty = false
      field.isTouched = false
      field.isFocused = false
    })
    this.state.isSubmitted = false
    this.state.errors = []
    this.updateFormValidity()
  }
}

// 디바운스 유틸리티
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 유효성 검사 데코레이터 (클래스 메서드용)
export function Validate(rules: ValidationRule[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      const value = args[0]
      const result = validateField(value, rules)

      if (!result.isValid) {
        throw new Error(result.firstError || '유효성 검사 실패')
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// Vue 3 Composition API용 유효성 검사 훅
export function useFormValidation(
  initialValues: Record<string, any> = {},
  fieldRules: Record<string, ValidationRule[]> = {},
  compositeRules: CompositeValidationRule[] = [],
  options: ValidationOptions = {},
) {
  const validator = new FormValidator(initialValues, fieldRules, compositeRules, options)

  const formState = ref<FormState>(validator.getFormState())
  const fieldStates = ref<Record<string, FieldState>>(validator.getFormState().fields)

  const updateField = (fieldName: string, value: any) => {
    validator.updateField(fieldName, value)
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
  }

  const focusField = (fieldName: string) => {
    validator.focusField(fieldName)
    formState.value = validator.getFormState()
  }

  const blurField = (fieldName: string) => {
    validator.blurField(fieldName)
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
  }

  const validateField = (fieldName: string) => {
    const result = validator.validateField(fieldName)
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
    return result
  }

  const validateForm = () => {
    const result = validator.validateForm()
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
    return result
  }

  const submitForm = () => {
    const result = validator.submitForm()
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
    return result
  }

  const resetForm = () => {
    validator.resetForm()
    formState.value = validator.getFormState()
    fieldStates.value = validator.getFormState().fields
  }

  const getFormValues = () => validator.getFormValues()

  return {
    formState: readonly(formState),
    fieldStates: readonly(fieldStates),
    updateField,
    focusField,
    blurField,
    validateField,
    validateForm,
    submitForm,
    resetForm,
    getFormValues,
  }
}

// 유효성 검사 믹스인 (Vue 컴포넌트용)
export const validationMixin = {
  methods: {
    validateField,
    validateComposite,
    isValidResidentNumber,
    isValidBusinessNumber,
    formatPhoneNumber,
    formatResidentNumber,
    formatBusinessNumber,
    formatAmount,
    formatDate,
    validationRules,
    compositeValidationRules,
    validationHelpers,
  },
}

export default {
  validateField,
  validateComposite,
  isValidResidentNumber,
  isValidBusinessNumber,
  formatPhoneNumber,
  formatResidentNumber,
  formatBusinessNumber,
  formatAmount,
  formatDate,
  validationRules,
  compositeValidationRules,
  validationHelpers,
  validationMixin,
  Validate,
  FormValidator,
  useFormValidation,
}
