import { z } from 'zod'

// 기본 필드 스키마들
const addressSchema = z.string().min(1, '주소는 필수입니다.')
const phoneSchema = z.string().regex(/^[0-9-]+$/, '전화번호 형식이 올바르지 않습니다.')
const emailSchema = z.string().email('이메일 형식이 올바르지 않습니다.')
const amountSchema = z.number().min(0, '금액은 0 이상이어야 합니다.')
const dateSchema = z.string().min(1, '날짜는 필수입니다.')

// 당사자 정보 스키마
const partyInfoSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  type: z.enum(['individual', 'corporate']),
  phone: phoneSchema,
  email: emailSchema,
  address: addressSchema,
  registrationNumber: z.string().optional(),
  representative: z.string().optional(),
  documents: z.array(z.any()).optional(),
})

// 물건 정보 스키마
const propertyInfoSchema = z.object({
  address: addressSchema,
  lot: z.string().min(1, '지번은 필수입니다.'),
  type: z.string().min(1, '물건 유형은 필수입니다.'),
  area: z.number().min(0, '면적은 0 이상이어야 합니다.'),
  floor: z.number().min(0, '층수는 0 이상이어야 합니다.'),
  rooms: z.number().min(0, '방 개수는 0 이상이어야 합니다.'),
  bathrooms: z.number().min(0, '욕실 개수는 0 이상이어야 합니다.'),
  parking: z.boolean(),
  description: z.string().optional(),
})

// 공과금 정보 스키마
const utilitiesSchema = z.object({
  electricity: z.boolean(),
  water: z.boolean(),
  gas: z.boolean(),
})

// 결제 일정 스키마
const paymentScheduleSchema = z.object({
  depositDate: dateSchema,
  rentDay: z.number().min(1).max(31, '월세 납부일은 1-31 사이여야 합니다.'),
})

// 계약 기간 스키마
const contractPeriodSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      return end > start
    },
    {
      message: '종료일은 시작일보다 늦어야 합니다.',
      path: ['endDate'],
    },
  )

// 법적 보호 스키마
const legalProtectionSchema = z.object({
  rentalProtection: z.boolean(),
  originalLandlordRights: z.boolean(),
  subleaseTermination: z.boolean(),
})

// 문서 정보 스키마
const documentInfoSchema = z.object({
  propertyRegistration: z.any().optional(),
  encumbranceCertificate: z.any().optional(),
  businessRegistration: z.any().optional(),
  tenantRegistration: z.any().optional(),
  originalLeaseDocument: z.any().optional(),
  consentDocument: z.any().optional(),
  additionalDocuments: z.array(z.any()).default([]),
})

// 동의 정보 스키마
const agreementInfoSchema = z.object({
  termsAgreement: z.boolean(),
  privacyAgreement: z.boolean(),
  contractAgreement: z.boolean(),
  paymentAgreement: z.boolean(),
  legalAgreement: z.boolean(),
  customAgreements: z.record(z.string(), z.boolean()).default({}),
})

// QA (부동산 매매계약서) 스키마
export const qaContractSchema = z.object({
  basicInfo: z.object({
    id: z.string(),
    type: z.literal('QA'),
    title: z.string().min(1, '계약서 제목은 필수입니다.'),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.enum(['draft', 'completed', 'archived']),
    participants: z.array(z.string()),
  }),
  propertyInfo: propertyInfoSchema,
  parties: z.object({
    seller: partyInfoSchema,
    buyer: partyInfoSchema,
  }),
  financial: z.object({
    purchasePrice: amountSchema,
    depositAmount: amountSchema,
    utilities: utilitiesSchema,
    paymentSchedule: paymentScheduleSchema,
  }),
  legal: z.object({
    contractPeriod: contractPeriodSchema,
    specialClauses: z.record(z.string(), z.boolean()).default({}),
    additionalClauses: z.string().optional(),
    legalProtection: legalProtectionSchema,
  }),
  documents: documentInfoSchema.extend({
    propertyRegistration: z.any().optional(),
    encumbranceCertificate: z.any().optional(),
  }),
  agreements: agreementInfoSchema,
  customFields: z.record(z.string(), z.any()).default({}),
})

// QB (주택 임대차계약서) 스키마
export const qbContractSchema = z.object({
  basicInfo: z.object({
    id: z.string(),
    type: z.literal('QB'),
    title: z.string().min(1, '계약서 제목은 필수입니다.'),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.enum(['draft', 'completed', 'archived']),
    participants: z.array(z.string()),
  }),
  propertyInfo: propertyInfoSchema,
  parties: z.object({
    landlord: partyInfoSchema,
    tenant: partyInfoSchema,
  }),
  financial: z.object({
    depositAmount: amountSchema,
    monthlyRent: amountSchema,
    maintenanceFee: z.number().min(0, '관리비는 0 이상이어야 합니다.'),
    utilities: utilitiesSchema,
    paymentSchedule: paymentScheduleSchema,
  }),
  legal: z.object({
    contractPeriod: contractPeriodSchema,
    specialClauses: z.record(z.string(), z.boolean()).default({}),
    additionalClauses: z.string().optional(),
    legalProtection: legalProtectionSchema.extend({
      rentalProtection: z.boolean().default(true), // 주택임대차보호법 기본 적용
    }),
  }),
  documents: documentInfoSchema.extend({
    propertyRegistration: z.any().optional(),
    tenantRegistration: z.any().optional(),
  }),
  agreements: agreementInfoSchema,
  customFields: z.record(z.string(), z.any()).default({}),
})

// QC (상가 임대차계약서) 스키마
export const qcContractSchema = z.object({
  basicInfo: z.object({
    id: z.string(),
    type: z.literal('QC'),
    title: z.string().min(1, '계약서 제목은 필수입니다.'),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.enum(['draft', 'completed', 'archived']),
    participants: z.array(z.string()),
  }),
  propertyInfo: propertyInfoSchema,
  parties: z.object({
    landlord: partyInfoSchema,
    tenant: partyInfoSchema,
  }),
  financial: z.object({
    depositAmount: amountSchema,
    monthlyRent: amountSchema,
    maintenanceFee: z.number().min(0, '관리비는 0 이상이어야 합니다.'),
    utilities: utilitiesSchema,
    paymentSchedule: paymentScheduleSchema,
  }),
  legal: z.object({
    contractPeriod: contractPeriodSchema,
    specialClauses: z.record(z.string(), z.boolean()).default({}),
    additionalClauses: z.string().optional(),
    legalProtection: legalProtectionSchema,
    usagePurpose: z.string().min(1, '사용 목적은 필수입니다.'),
  }),
  documents: documentInfoSchema.extend({
    propertyRegistration: z.any().optional(),
    businessRegistration: z.any().optional(),
  }),
  agreements: agreementInfoSchema,
  customFields: z.record(z.string(), z.any()).default({}),
})

// QE (전대차 계약서) 스키마
export const qeContractSchema = z.object({
  basicInfo: z.object({
    id: z.string(),
    type: z.literal('QE'),
    title: z.string().min(1, '계약서 제목은 필수입니다.'),
    createdAt: z.date(),
    updatedAt: z.date(),
    status: z.enum(['draft', 'completed', 'archived']),
    participants: z.array(z.string()),
  }),
  propertyInfo: propertyInfoSchema,
  parties: z.object({
    sublessor: partyInfoSchema,
    sublessee: partyInfoSchema,
  }),
  financial: z.object({
    depositAmount: amountSchema,
    monthlyRent: amountSchema,
    maintenanceFee: z.number().min(0, '관리비는 0 이상이어야 합니다.'),
    utilities: utilitiesSchema,
    paymentSchedule: paymentScheduleSchema,
  }),
  legal: z.object({
    contractPeriod: contractPeriodSchema,
    specialClauses: z.record(z.string(), z.boolean()).default({}),
    additionalClauses: z.string().optional(),
    legalProtection: legalProtectionSchema,
    originalLeaseConsent: z.boolean().default(false),
    originalLeaseDocument: z.any().optional(),
  }),
  documents: documentInfoSchema.extend({
    originalLeaseDocument: z.any().optional(),
    consentDocument: z.any().optional(),
  }),
  agreements: agreementInfoSchema,
  customFields: z.record(z.string(), z.any()).default({}),
})

// 계약서 타입별 스키마 매핑
export const contractSchemas = {
  QA: qaContractSchema,
  QB: qbContractSchema,
  QC: qcContractSchema,
  QE: qeContractSchema,
} as const

// 스키마 검증 함수
export const validateContract = (contractType: keyof typeof contractSchemas, data: any) => {
  const schema = contractSchemas[contractType]
  return schema.safeParse(data)
}

// 부분 검증 함수 (특정 섹션만 검증)
export const validateContractSection = (
  contractType: keyof typeof contractSchemas,
  section: keyof typeof qaContractSchema.shape,
  data: any,
) => {
  const schema = contractSchemas[contractType]
  const sectionSchema = schema.shape[section]
  return sectionSchema.safeParse(data)
}

// 필수 필드 검증 함수
export const validateRequiredFields = (contractType: keyof typeof contractSchemas, data: any) => {
  const schema = contractSchemas[contractType]
  const result = schema.safeParse(data)

  if (!result.success) {
    const errors = result.error.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }))
    return { isValid: false, errors }
  }

  return { isValid: true, errors: [] }
}

// 스키마 타입 정의
export type QAContract = z.infer<typeof qaContractSchema>
export type QBContract = z.infer<typeof qbContractSchema>
export type QCContract = z.infer<typeof qcContractSchema>
export type QEContract = z.infer<typeof qeContractSchema>

export type ContractSchema = QAContract | QBContract | QCContract | QEContract

// 스키마 유틸리티 함수들
export const getRequiredFields = (contractType: keyof typeof contractSchemas) => {
  const schema = contractSchemas[contractType]
  const shape = schema.shape

  const requiredFields: string[] = []

  // 기본 정보 필수 필드
  requiredFields.push('basicInfo.title')

  // 물건 정보 필수 필드
  requiredFields.push('propertyInfo.address', 'propertyInfo.lot', 'propertyInfo.type')

  // 계약서 타입별 필수 필드
  switch (contractType) {
    case 'QA':
      requiredFields.push(
        'parties.seller.name',
        'parties.seller.phone',
        'parties.buyer.name',
        'parties.buyer.phone',
        'financial.purchasePrice',
        'financial.depositAmount',
      )
      break
    case 'QB':
      requiredFields.push(
        'parties.landlord.name',
        'parties.landlord.phone',
        'parties.tenant.name',
        'parties.tenant.phone',
        'financial.depositAmount',
        'financial.monthlyRent',
      )
      break
    case 'QC':
      requiredFields.push(
        'parties.landlord.name',
        'parties.landlord.phone',
        'parties.tenant.name',
        'parties.tenant.phone',
        'financial.depositAmount',
        'financial.monthlyRent',
        'legal.usagePurpose',
      )
      break
    case 'QE':
      requiredFields.push(
        'parties.sublessor.name',
        'parties.sublessor.phone',
        'parties.sublessee.name',
        'parties.sublessee.phone',
        'financial.depositAmount',
        'financial.monthlyRent',
        'legal.originalLeaseConsent',
      )
      break
  }

  return requiredFields
}

export const getFieldValidationRules = (fieldPath: string) => {
  const rules: Record<string, any> = {}

  // 전화번호 필드
  if (fieldPath.includes('phone')) {
    rules.pattern = /^[0-9-]+$/
    rules.message = '전화번호 형식이 올바르지 않습니다.'
  }

  // 이메일 필드
  if (fieldPath.includes('email')) {
    rules.type = 'email'
    rules.message = '이메일 형식이 올바르지 않습니다.'
  }

  // 금액 필드
  if (
    fieldPath.includes('Price') ||
    fieldPath.includes('Amount') ||
    fieldPath.includes('Rent') ||
    fieldPath.includes('Fee')
  ) {
    rules.min = 0
    rules.message = '금액은 0 이상이어야 합니다.'
  }

  // 날짜 필드
  if (fieldPath.includes('Date')) {
    rules.type = 'date'
    rules.message = '날짜를 선택해주세요.'
  }

  return rules
}

// 스키마 초기화 함수
export const createInitialContractData = (contractType: keyof typeof contractSchemas) => {
  const now = new Date()

  const baseData = {
    basicInfo: {
      id: '',
      type: contractType,
      title: `${contractType} 계약서`,
      createdAt: now,
      updatedAt: now,
      status: 'draft' as const,
      participants: [],
    },
    propertyInfo: {
      address: '',
      lot: '',
      type: '',
      area: 0,
      floor: 0,
      rooms: 0,
      bathrooms: 0,
      parking: false,
      description: '',
    },
    financial: {
      depositAmount: 0,
      utilities: {
        electricity: false,
        water: false,
        gas: false,
      },
      paymentSchedule: {
        depositDate: '',
        rentDay: 1,
      },
    },
    legal: {
      contractPeriod: {
        startDate: '',
        endDate: '',
      },
      specialClauses: {},
      additionalClauses: '',
      legalProtection: {
        rentalProtection: false,
        originalLandlordRights: false,
        subleaseTermination: false,
      },
    },
    documents: {
      additionalDocuments: [],
    },
    agreements: {
      termsAgreement: false,
      privacyAgreement: false,
      contractAgreement: false,
      paymentAgreement: false,
      legalAgreement: false,
      customAgreements: {},
    },
    customFields: {},
  }

  // 계약서 타입별 추가 필드
  switch (contractType) {
    case 'QA':
      return {
        ...baseData,
        parties: {
          seller: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
          buyer: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
        },
        financial: {
          ...baseData.financial,
          purchasePrice: 0,
        },
      }
    case 'QB':
      return {
        ...baseData,
        parties: {
          landlord: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
          tenant: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
        },
        financial: {
          ...baseData.financial,
          monthlyRent: 0,
          maintenanceFee: 0,
        },
        legal: {
          ...baseData.legal,
          legalProtection: {
            ...baseData.legal.legalProtection,
            rentalProtection: true,
          },
        },
      }
    case 'QC':
      return {
        ...baseData,
        parties: {
          landlord: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
          tenant: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
        },
        financial: {
          ...baseData.financial,
          monthlyRent: 0,
          maintenanceFee: 0,
        },
        legal: {
          ...baseData.legal,
          usagePurpose: '',
        },
      }
    case 'QE':
      return {
        ...baseData,
        parties: {
          sublessor: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
          sublessee: {
            name: '',
            type: 'individual' as const,
            phone: '',
            email: '',
            address: '',
          },
        },
        financial: {
          ...baseData.financial,
          monthlyRent: 0,
          maintenanceFee: 0,
        },
        legal: {
          ...baseData.legal,
          originalLeaseConsent: false,
        },
      }
  }
}
