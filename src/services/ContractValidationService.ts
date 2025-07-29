import { reactive, computed } from 'vue'

// 검증 결과 인터페이스
export interface ValidationResult {
  isValid: boolean
  completionRate: number
  missingFields: string[]
  missingAgreements: string[]
  participantStatus: ParticipantStatus[]
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// 참여자 상태 인터페이스
export interface ParticipantStatus {
  id: string
  name: string
  type: 'human' | 'ai'
  agreementStatus: 'pending' | 'completed' | 'not_required'
  lastUpdated: Date
  requiredFields: string[]
  completedFields: string[]
}

// 검증 오류 인터페이스
export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  participantId?: string
}

// 검증 경고 인터페이스
export interface ValidationWarning {
  field: string
  message: string
  suggestion: string
}

// 계약서 타입별 필수 필드 정의
export interface RequiredFields {
  [contractType: string]: {
    basic: string[]
    parties: string[]
    financial: string[]
    legal: string[]
    documents: string[]
  }
}

// 계약서 타입별 필수 필드 정의
const REQUIRED_FIELDS: RequiredFields = {
  QA: {
    basic: ['propertyAddress', 'propertyType', 'contractPeriod'],
    parties: ['sellerName', 'buyerName', 'sellerPhone', 'buyerPhone'],
    financial: ['purchasePrice', 'depositAmount'],
    legal: ['propertyRegistration', 'encumbranceCheck'],
    documents: ['propertyRegistration', 'encumbranceCertificate'],
  },
  QB: {
    basic: ['propertyAddress', 'propertyType', 'leasePeriod'],
    parties: ['landlordName', 'tenantName', 'landlordPhone', 'tenantPhone'],
    financial: ['depositAmount', 'monthlyRent'],
    legal: ['rentalProtectionLaw', 'maintenanceFee'],
    documents: ['propertyRegistration', 'tenantRegistration'],
  },
  QC: {
    basic: ['propertyAddress', 'propertyType', 'leasePeriod'],
    parties: ['landlordName', 'tenantName', 'landlordPhone', 'tenantPhone'],
    financial: ['depositAmount', 'monthlyRent', 'maintenanceFee'],
    legal: ['businessRegistration', 'usagePurpose'],
    documents: ['propertyRegistration', 'businessRegistration'],
  },
  QE: {
    basic: ['propertyAddress', 'subleasePeriod'],
    parties: ['sublessorName', 'sublesseeName', 'sublessorPhone', 'sublesseePhone'],
    financial: ['subleaseDeposit', 'subleaseRent'],
    legal: ['originalLeaseConsent', 'originalLeaseDocument'],
    documents: ['originalLeaseDocument', 'consentDocument'],
  },
}

// 계약서 검증 서비스 클래스
export class ContractValidationService {
  private validationState = reactive({
    contractType: '',
    participants: [] as ParticipantStatus[],
    fieldValues: {} as Record<string, any>,
    agreementStatus: {} as Record<string, boolean>,
    lastValidation: null as Date | null,
  })

  // 검증 결과 계산된 속성
  public readonly validationResult = computed((): ValidationResult => {
    const missingFields = this.getMissingFields()
    const missingAgreements = this.getMissingAgreements()
    const errors = this.getValidationErrors()
    const warnings = this.getValidationWarnings()

    const totalRequiredFields = this.getTotalRequiredFields()
    const completedFields = totalRequiredFields - missingFields.length
    const completionRate =
      totalRequiredFields > 0 ? (completedFields / totalRequiredFields) * 100 : 0

    const isValid =
      missingFields.length === 0 &&
      missingAgreements.length === 0 &&
      errors.filter((e) => e.severity === 'error').length === 0

    return {
      isValid,
      completionRate,
      missingFields,
      missingAgreements,
      participantStatus: this.validationState.participants,
      errors,
      warnings,
    }
  })

  // 계약서 타입 설정
  public setContractType(contractType: string): void {
    this.validationState.contractType = contractType
    this.updateValidation()
  }

  // 참여자 추가
  public addParticipant(participant: Omit<ParticipantStatus, 'lastUpdated'>): void {
    const newParticipant: ParticipantStatus = {
      ...participant,
      lastUpdated: new Date(),
    }
    this.validationState.participants.push(newParticipant)
    this.updateValidation()
  }

  // 참여자 상태 업데이트
  public updateParticipantStatus(participantId: string, status: Partial<ParticipantStatus>): void {
    const participant = this.validationState.participants.find((p) => p.id === participantId)
    if (participant) {
      Object.assign(participant, status, { lastUpdated: new Date() })
      this.updateValidation()
    }
  }

  // 필드 값 설정
  public setFieldValue(field: string, value: any): void {
    this.validationState.fieldValues[field] = value
    this.updateValidation()
  }

  // 동의 상태 설정
  public setAgreementStatus(agreementId: string, agreed: boolean): void {
    this.validationState.agreementStatus[agreementId] = agreed
    this.updateValidation()
  }

  // 누락된 필드 확인
  private getMissingFields(): string[] {
    const requiredFields = this.getRequiredFields()
    const missing: string[] = []

    for (const category of Object.values(requiredFields)) {
      for (const field of category) {
        const value = this.validationState.fieldValues[field]
        if (this.isEmptyValue(value)) {
          missing.push(field)
        }
      }
    }

    return missing
  }

  // 누락된 동의 확인
  private getMissingAgreements(): string[] {
    const missing: string[] = []

    for (const [agreementId, agreed] of Object.entries(this.validationState.agreementStatus)) {
      if (!agreed) {
        missing.push(agreementId)
      }
    }

    return missing
  }

  // 검증 오류 확인
  private getValidationErrors(): ValidationError[] {
    const errors: ValidationError[] = []

    // 필수 필드 누락 오류
    const missingFields = this.getMissingFields()
    for (const field of missingFields) {
      errors.push({
        field,
        message: `필수 입력 항목 "${field}"이(가) 누락되었습니다.`,
        severity: 'error',
      })
    }

    // 참여자 동의 누락 오류
    const humanParticipants = this.validationState.participants.filter((p) => p.type === 'human')
    for (const participant of humanParticipants) {
      if (participant.agreementStatus === 'pending') {
        errors.push({
          field: 'participant_agreement',
          message: `${participant.name}의 동의가 필요합니다.`,
          severity: 'error',
          participantId: participant.id,
        })
      }
    }

    return errors
  }

  // 검증 경고 확인
  private getValidationWarnings(): ValidationWarning[] {
    const warnings: ValidationWarning[] = []

    // 필드 값 검증 경고
    for (const [field, value] of Object.entries(this.validationState.fieldValues)) {
      if (this.hasValidationWarning(field, value)) {
        warnings.push({
          field,
          message: `${field} 값에 대한 검토가 필요합니다.`,
          suggestion: this.getValidationSuggestion(field, value),
        })
      }
    }

    return warnings
  }

  // 필수 필드 목록 가져오기
  private getRequiredFields(): string[] {
    const contractType = this.validationState.contractType
    const requiredFields = REQUIRED_FIELDS[contractType]

    if (!requiredFields) {
      return []
    }

    return [
      ...requiredFields.basic,
      ...requiredFields.parties,
      ...requiredFields.financial,
      ...requiredFields.legal,
      ...requiredFields.documents,
    ]
  }

  // 총 필수 필드 수 계산
  private getTotalRequiredFields(): number {
    return this.getRequiredFields().length
  }

  // 값이 비어있는지 확인
  private isEmptyValue(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }

  // 검증 경고가 있는지 확인
  private hasValidationWarning(field: string, value: any): boolean {
    // 금액 필드 검증
    if (
      field.includes('Amount') ||
      field.includes('Price') ||
      field.includes('Rent') ||
      field.includes('Deposit')
    ) {
      if (typeof value === 'number' && value <= 0) return true
    }

    // 날짜 필드 검증
    if (field.includes('Date') || field.includes('Period')) {
      if (value && new Date(value) < new Date()) return true
    }

    // 전화번호 필드 검증
    if (field.includes('Phone')) {
      if (value && !/^[0-9-]+$/.test(value)) return true
    }

    return false
  }

  // 검증 제안 가져오기
  private getValidationSuggestion(field: string, value: any): string {
    if (
      field.includes('Amount') ||
      field.includes('Price') ||
      field.includes('Rent') ||
      field.includes('Deposit')
    ) {
      return '금액은 0보다 큰 값이어야 합니다.'
    }

    if (field.includes('Date') || field.includes('Period')) {
      return '날짜는 현재 날짜 이후여야 합니다.'
    }

    if (field.includes('Phone')) {
      return '전화번호는 숫자와 하이픈(-)만 포함할 수 있습니다.'
    }

    return '입력 값을 확인해주세요.'
  }

  // 검증 업데이트
  private updateValidation(): void {
    this.validationState.lastValidation = new Date()
  }

  // 검증 상태 초기화
  public reset(): void {
    this.validationState.contractType = ''
    this.validationState.participants = []
    this.validationState.fieldValues = {}
    this.validationState.agreementStatus = {}
    this.validationState.lastValidation = null
  }

  // 검증 상태 내보내기
  public exportValidationState(): any {
    return {
      contractType: this.validationState.contractType,
      participants: [...this.validationState.participants],
      fieldValues: { ...this.validationState.fieldValues },
      agreementStatus: { ...this.validationState.agreementStatus },
      lastValidation: this.validationState.lastValidation,
      validationResult: this.validationResult.value,
    }
  }

  // 검증 상태 가져오기
  public importValidationState(state: any): void {
    this.validationState.contractType = state.contractType || ''
    this.validationState.participants = state.participants || []
    this.validationState.fieldValues = state.fieldValues || {}
    this.validationState.agreementStatus = state.agreementStatus || {}
    this.validationState.lastValidation = state.lastValidation
      ? new Date(state.lastValidation)
      : null
  }
}

// 싱글톤 인스턴스 생성
export const contractValidationService = new ContractValidationService()
