import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'

// 계약서 타입 정의
export type ContractType = 'QA' | 'QB' | 'QC' | 'QE'

// 계약서 기본 정보 인터페이스
export interface ContractBasicInfo {
  id: string
  type: ContractType
  title: string
  createdAt: Date
  updatedAt: Date
  status: 'draft' | 'completed' | 'archived'
  participants: string[]
}

// 계약서 데이터 인터페이스
export interface ContractData {
  basicInfo: ContractBasicInfo
  propertyInfo: PropertyInfo
  parties: PartiesInfo
  financial: FinancialInfo
  legal: LegalInfo
  documents: DocumentInfo
  agreements: AgreementInfo
  customFields: Record<string, any>
}

// 물건 정보 인터페이스
export interface PropertyInfo {
  address: string
  lot: string
  type: string
  area: number
  floor: number
  rooms: number
  bathrooms: number
  parking: boolean
  description: string
}

// 당사자 정보 인터페이스
export interface PartiesInfo {
  seller?: PartyInfo
  buyer?: PartyInfo
  landlord?: PartyInfo
  tenant?: PartyInfo
  sublessor?: PartyInfo
  sublessee?: PartyInfo
}

// 당사자 개별 정보 인터페이스
export interface PartyInfo {
  name: string
  type: 'individual' | 'corporate'
  phone: string
  email: string
  address: string
  registrationNumber?: string
  representative?: string
  documents?: File[]
}

// 금융 정보 인터페이스
export interface FinancialInfo {
  purchasePrice?: number
  depositAmount: number
  monthlyRent?: number
  maintenanceFee?: number
  utilities: {
    electricity: boolean
    water: boolean
    gas: boolean
  }
  paymentSchedule: {
    depositDate: string
    rentDay: number
  }
}

// 법적 정보 인터페이스
export interface LegalInfo {
  contractPeriod: {
    startDate: string
    endDate: string
  }
  specialClauses: Record<string, boolean>
  additionalClauses: string
  legalProtection: {
    rentalProtection: boolean
    originalLandlordRights: boolean
    subleaseTermination: boolean
  }
}

// 문서 정보 인터페이스
export interface DocumentInfo {
  propertyRegistration?: File
  encumbranceCertificate?: File
  businessRegistration?: File
  tenantRegistration?: File
  originalLeaseDocument?: File
  consentDocument?: File
  additionalDocuments: File[]
}

// 동의 정보 인터페이스
export interface AgreementInfo {
  termsAgreement: boolean
  privacyAgreement: boolean
  contractAgreement: boolean
  paymentAgreement: boolean
  legalAgreement: boolean
  customAgreements: Record<string, boolean>
}

// 계약서 스토어
export const useContractStore = defineStore('contract', () => {
  // 상태
  const contracts = ref<Map<string, ContractData>>(new Map())
  const currentContractId = ref<string>('')
  const autoSaveEnabled = ref(true)
  const autoSaveInterval = ref(5000) // 5초
  const lastSaved = ref<Date | null>(null)
  const isSaving = ref(false)
  const saveError = ref<string | null>(null)

  // 계산된 속성
  const currentContract = computed(() => {
    if (!currentContractId.value) return null
    return contracts.value.get(currentContractId.value) || null
  })

  const hasUnsavedChanges = computed(() => {
    if (!currentContract.value) return false
    const lastModified = currentContract.value.basicInfo.updatedAt
    return lastSaved.value ? lastModified > lastSaved.value : true
  })

  const contractCount = computed(() => contracts.value.size)

  // 메서드들
  const createContract = (type: ContractType, title: string = ''): string => {
    const id = generateContractId()
    const now = new Date()

    const contractData: ContractData = {
      basicInfo: {
        id,
        type,
        title: title || `${type} 계약서`,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
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
      parties: {},
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

    contracts.value.set(id, contractData)
    currentContractId.value = id

    // 로컬 스토리지에 저장
    saveToLocalStorage()

    return id
  }

  const updateContract = (id: string, contract: ContractData) => {
    const existingContract = contracts.value.get(id)
    if (existingContract) {
      contracts.value.set(id, contract)
      contract.basicInfo.updatedAt = new Date()

      // 자동 저장
      if (autoSaveEnabled.value) {
        debouncedSave()
      }
    }
  }

  const updateContractPartial = (updates: Partial<ContractData>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!

    // 업데이트 적용
    Object.assign(contract, updates)
    contract.basicInfo.updatedAt = new Date()

    // 자동 저장
    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateBasicInfo = (updates: Partial<ContractBasicInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.basicInfo, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updatePropertyInfo = (updates: Partial<PropertyInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.propertyInfo, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateParties = (updates: Partial<PartiesInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.parties, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateFinancial = (updates: Partial<FinancialInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.financial, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateLegal = (updates: Partial<LegalInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.legal, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateDocuments = (updates: Partial<DocumentInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.documents, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const updateAgreements = (updates: Partial<AgreementInfo>) => {
    if (!currentContract.value) return

    const contract = contracts.value.get(currentContractId.value)!
    Object.assign(contract.agreements, updates)
    contract.basicInfo.updatedAt = new Date()

    if (autoSaveEnabled.value) {
      debouncedSave()
    }
  }

  const setCurrentContract = (contractId: string) => {
    if (contracts.value.has(contractId)) {
      currentContractId.value = contractId
    }
  }

  const deleteContract = (contractId: string) => {
    contracts.value.delete(contractId)

    if (currentContractId.value === contractId) {
      currentContractId.value =
        contracts.value.size > 0 ? Array.from(contracts.value.keys())[0] : ''
    }

    saveToLocalStorage()
  }

  const duplicateContract = (contractId: string): string => {
    const original = contracts.value.get(contractId)
    if (!original) throw new Error('계약서를 찾을 수 없습니다.')

    const newId = generateContractId()
    const duplicated = JSON.parse(JSON.stringify(original))

    duplicated.basicInfo.id = newId
    duplicated.basicInfo.title = `${original.basicInfo.title} (복사본)`
    duplicated.basicInfo.createdAt = new Date()
    duplicated.basicInfo.updatedAt = new Date()
    duplicated.basicInfo.status = 'draft'

    contracts.value.set(newId, duplicated)
    saveToLocalStorage()

    return newId
  }

  // 저장 관련 메서드
  let saveTimeout: NodeJS.Timeout | null = null

  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    saveTimeout = setTimeout(() => {
      saveToLocalStorage()
    }, 1000) // 1초 딜레이
  }

  const saveToLocalStorage = () => {
    try {
      isSaving.value = true
      saveError.value = null

      const data = {
        contracts: Object.fromEntries(contracts.value),
        currentContractId: currentContractId.value,
        lastSaved: new Date(),
      }

      localStorage.setItem('gli_contracts', JSON.stringify(data))
      lastSaved.value = new Date()
    } catch (error) {
      saveError.value = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'
      console.error('저장 오류:', error)
    } finally {
      isSaving.value = false
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('gli_contracts')
      if (!data) return

      const parsed = JSON.parse(data)

      // 계약서 데이터 복원
      if (parsed.contracts) {
        const contractMap = new Map()
        Object.entries(parsed.contracts).forEach(([id, contractData]: [string, any]) => {
          // 날짜 객체 복원
          contractData.basicInfo.createdAt = new Date(contractData.basicInfo.createdAt)
          contractData.basicInfo.updatedAt = new Date(contractData.basicInfo.updatedAt)
          contractMap.set(id, contractData)
        })
        contracts.value = contractMap
      }

      // 현재 계약서 ID 복원
      if (parsed.currentContractId) {
        currentContractId.value = parsed.currentContractId
      }

      // 마지막 저장 시간 복원
      if (parsed.lastSaved) {
        lastSaved.value = new Date(parsed.lastSaved)
      }
    } catch (error) {
      console.error('로컬 스토리지 로드 오류:', error)
      saveError.value = '데이터 로드 중 오류가 발생했습니다.'
    }
  }

  const exportContractData = (contractId: string): string => {
    const contract = contracts.value.get(contractId)
    if (!contract) throw new Error('계약서를 찾을 수 없습니다.')

    return JSON.stringify(contract, null, 2)
  }

  const importContractData = (data: string): string => {
    try {
      const contractData: ContractData = JSON.parse(data)

      // ID 재생성
      const newId = generateContractId()
      contractData.basicInfo.id = newId
      contractData.basicInfo.createdAt = new Date()
      contractData.basicInfo.updatedAt = new Date()

      contracts.value.set(newId, contractData)
      saveToLocalStorage()

      return newId
    } catch (error) {
      throw new Error('계약서 데이터 가져오기 실패')
    }
  }

  const clearAllData = () => {
    contracts.value.clear()
    currentContractId.value = ''
    lastSaved.value = null
    localStorage.removeItem('gli_contracts')
  }

  // 유틸리티 함수
  const generateContractId = (): string => {
    return `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const getContractById = (contractId: string): ContractData | null => {
    return contracts.value.get(contractId) || null
  }

  const getAllContracts = (): ContractData[] => {
    return Array.from(contracts.value.values())
  }

  const getContractsByType = (type: ContractType): ContractData[] => {
    return getAllContracts().filter((contract) => contract.basicInfo.type === type)
  }

  // 감시자
  watch(currentContractId, (newId) => {
    if (newId && contracts.value.has(newId)) {
      // 현재 계약서 변경 시 자동 저장
      debouncedSave()
    }
  })

  // 초기화
  const initialize = () => {
    loadFromLocalStorage()
  }

  return {
    // 상태
    contracts,
    currentContractId,
    autoSaveEnabled,
    autoSaveInterval,
    lastSaved,
    isSaving,
    saveError,

    // 계산된 속성
    currentContract,
    hasUnsavedChanges,
    contractCount,

    // 메서드
    createContract,
    updateContract,
    updateContractPartial,
    updateBasicInfo,
    updatePropertyInfo,
    updateParties,
    updateFinancial,
    updateLegal,
    updateDocuments,
    updateAgreements,
    setCurrentContract,
    deleteContract,
    duplicateContract,
    saveToLocalStorage,
    loadFromLocalStorage,
    exportContractData,
    importContractData,
    clearAllData,
    getContractById,
    getAllContracts,
    getContractsByType,
    initialize,
  }
})
