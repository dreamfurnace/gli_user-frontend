export type ContractType = 'QA' | 'QB' | 'QC' | 'QE'

export interface BasicInfo {
  id: string
  type: ContractType
  title: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'completed' | 'archived'
  participants: string[]
}

export interface PropertyInfo {
  address: string
  buildingName?: string
  floor?: string
  roomNumber?: string
  area?: number
  purpose: string
  registrationNumber?: string
}

export interface Party {
  id: string
  name: string
  type: 'lessor' | 'lessee' | 'sublessor' | 'sublessee' | 'agent'
  identificationNumber?: string
  phone?: string
  email?: string
  address?: string
  representative?: string
  businessNumber?: string
}

export interface Financial {
  deposit?: number
  rent?: number
  maintenanceFee?: number
  vat?: number
  totalAmount?: number
  paymentMethod?: string
  paymentSchedule?: string
  securityDeposit?: number
}

export interface Legal {
  startDate?: Date
  endDate?: Date
  renewalTerms?: string
  terminationNotice?: number
  disputeResolution?: string
  governingLaw?: string
  specialConditions?: string[]
}

export interface Document {
  id: string
  name: string
  type: 'contract' | 'attachment' | 'certificate' | 'other'
  url?: string
  uploadedAt: Date
  size?: number
  description?: string
}

export interface Agreement {
  participantId: string
  agreed: boolean
  agreedAt?: Date
  ipAddress?: string
  userAgent?: string
}

export interface ContractData {
  basicInfo: BasicInfo
  propertyInfo: PropertyInfo
  parties: Party[]
  financial: Financial
  legal: Legal
  documents: Document[]
  agreements: Agreement[]
  customFields: Record<string, any>
}

export interface ContractValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  completionRate: number
  missingFields: string[]
}
