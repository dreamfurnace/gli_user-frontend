import { ref, computed } from 'vue'
import { profileAPI } from '../services/api'
import { sanitizeInput, validateInput, securityLogger } from '../utils/security'

// KYC system types
export interface KYCPersonalInfo {
  first_name: string
  last_name: string
  date_of_birth: string
  nationality: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface KYCDocument {
  id: string
  type: 'passport' | 'driver_license' | 'national_id' | 'address_proof'
  file_url: string
  status: 'pending' | 'approved' | 'rejected'
  uploaded_at: string
  reviewed_at?: string
  rejection_reason?: string
}

export interface KYCStatus {
  user_id: string
  level: 'unverified' | 'basic' | 'intermediate' | 'advanced'
  email_verified: boolean
  phone_verified: boolean
  identity_verified: boolean
  address_verified: boolean
  documents_submitted: boolean
  status: 'incomplete' | 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  rejected_reason?: string
}

export interface KYCVerificationStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  required: boolean
  order: number
}

// Global state
const kycStatus = ref<KYCStatus | null>(null)
const personalInfo = ref<KYCPersonalInfo | null>(null)
const documents = ref<KYCDocument[]>([])
const verificationSteps = ref<KYCVerificationStep[]>([])
const isLoading = ref(false)
const error = ref<string>('')

export function useKYC() {
  // Initialize KYC verification steps
  const initializeSteps = () => {
    verificationSteps.value = [
      {
        id: 'email',
        title: '이메일 인증',
        description: '이메일 주소를 인증하여 계정 보안을 강화합니다',
        status: 'pending',
        required: true,
        order: 1
      },
      {
        id: 'phone',
        title: '휴대폰 인증',
        description: '휴대폰 번호를 인증하여 2단계 인증을 활성화합니다',
        status: 'pending',
        required: true,
        order: 2
      },
      {
        id: 'personal_info',
        title: '개인정보 입력',
        description: '본인 확인을 위한 기본 개인정보를 입력합니다',
        status: 'pending',
        required: true,
        order: 3
      },
      {
        id: 'identity_document',
        title: '신분증 업로드',
        description: '정부 발행 신분증을 업로드하여 신원을 확인합니다',
        status: 'pending',
        required: true,
        order: 4
      },
      {
        id: 'address_proof',
        title: '주소 증명',
        description: '거주지 확인을 위한 주소 증명 서류를 업로드합니다',
        status: 'pending',
        required: false,
        order: 5
      }
    ]
  }

  // Get KYC status
  const getKYCStatus = async (userId: string): Promise<KYCStatus | null> => {
    try {
      isLoading.value = true
      error.value = ''

      securityLogger.log('KYC_STATUS_ACCESS', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await profileAPI.getKYCStatus(userId)
      kycStatus.value = response.data
      
      // Update step statuses based on KYC status
      updateStepStatuses()
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get KYC status:', err)
      error.value = err.response?.data?.message || 'Failed to get KYC status'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Submit personal information
  const submitPersonalInfo = async (userId: string, info: KYCPersonalInfo): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      // Validate input
      const validationErrors = validatePersonalInfo(info)
      if (validationErrors.length > 0) {
        error.value = validationErrors.join(', ')
        return false
      }

      // Sanitize input
      const sanitizedInfo = sanitizePersonalInfo(info)

      securityLogger.log('KYC_PERSONAL_INFO_SUBMIT', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await profileAPI.submitKYCPersonalInfo(userId, sanitizedInfo)
      
      if (response.data.success) {
        personalInfo.value = sanitizedInfo
        updateStepStatus('personal_info', 'completed')
        
        securityLogger.log('KYC_PERSONAL_INFO_SUCCESS', {
          userId: sanitizeInput.text(userId),
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to submit personal info:', err)
      error.value = err.response?.data?.message || 'Failed to submit personal information'
      
      securityLogger.log('KYC_PERSONAL_INFO_FAILED', {
        userId: sanitizeInput.text(userId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Upload document
  const uploadDocument = async (userId: string, file: File, type: KYCDocument['type']): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      // Validate file
      const fileValidation = validateDocumentFile(file)
      if (!fileValidation.valid) {
        error.value = fileValidation.message
        return false
      }

      securityLogger.log('KYC_DOCUMENT_UPLOAD_ATTEMPT', {
        userId: sanitizeInput.text(userId),
        documentType: type,
        fileSize: file.size,
        timestamp: new Date().toISOString()
      })

      const formData = new FormData()
      formData.append('document', file)
      formData.append('type', type)
      formData.append('user_id', userId)

      const response = await profileAPI.uploadKYCDocument(formData)
      
      if (response.data.success) {
        // Add document to local state
        const newDocument: KYCDocument = {
          id: response.data.document_id,
          type,
          file_url: response.data.file_url,
          status: 'pending',
          uploaded_at: new Date().toISOString()
        }
        
        documents.value.push(newDocument)
        
        // Update step status
        if (type === 'passport' || type === 'driver_license' || type === 'national_id') {
          updateStepStatus('identity_document', 'completed')
        } else if (type === 'address_proof') {
          updateStepStatus('address_proof', 'completed')
        }
        
        securityLogger.log('KYC_DOCUMENT_UPLOAD_SUCCESS', {
          userId: sanitizeInput.text(userId),
          documentType: type,
          documentId: response.data.document_id,
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to upload document:', err)
      error.value = err.response?.data?.message || 'Failed to upload document'
      
      securityLogger.log('KYC_DOCUMENT_UPLOAD_FAILED', {
        userId: sanitizeInput.text(userId),
        documentType: type,
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Verify email
  const verifyEmail = async (userId: string, verificationCode: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      const sanitizedCode = sanitizeInput.text(verificationCode)
      
      securityLogger.log('KYC_EMAIL_VERIFICATION_ATTEMPT', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await profileAPI.verifyKYCEmail(userId, sanitizedCode)
      
      if (response.data.success) {
        updateStepStatus('email', 'completed')
        
        securityLogger.log('KYC_EMAIL_VERIFICATION_SUCCESS', {
          userId: sanitizeInput.text(userId),
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to verify email:', err)
      error.value = err.response?.data?.message || 'Failed to verify email'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Verify phone
  const verifyPhone = async (userId: string, phoneNumber: string, verificationCode: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      const sanitizedPhone = sanitizeInput.phone(phoneNumber)
      const sanitizedCode = sanitizeInput.text(verificationCode)
      
      securityLogger.log('KYC_PHONE_VERIFICATION_ATTEMPT', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await profileAPI.verifyKYCPhone(userId, sanitizedPhone, sanitizedCode)
      
      if (response.data.success) {
        updateStepStatus('phone', 'completed')
        
        securityLogger.log('KYC_PHONE_VERIFICATION_SUCCESS', {
          userId: sanitizeInput.text(userId),
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to verify phone:', err)
      error.value = err.response?.data?.message || 'Failed to verify phone'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Get documents
  const getDocuments = async (userId: string): Promise<KYCDocument[]> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await profileAPI.getKYCDocuments(userId)
      documents.value = response.data
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get documents:', err)
      error.value = err.response?.data?.message || 'Failed to get documents'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Helper functions
  const validatePersonalInfo = (info: KYCPersonalInfo): string[] => {
    const errors: string[] = []
    
    if (!info.first_name?.trim()) errors.push('First name is required')
    if (!info.last_name?.trim()) errors.push('Last name is required')
    if (!info.date_of_birth) errors.push('Date of birth is required')
    if (!info.nationality?.trim()) errors.push('Nationality is required')
    if (!info.address_line1?.trim()) errors.push('Address is required')
    if (!info.city?.trim()) errors.push('City is required')
    if (!info.state?.trim()) errors.push('State is required')
    if (!info.postal_code?.trim()) errors.push('Postal code is required')
    if (!info.country?.trim()) errors.push('Country is required')
    
    return errors
  }

  const sanitizePersonalInfo = (info: KYCPersonalInfo): KYCPersonalInfo => {
    return {
      first_name: sanitizeInput.text(info.first_name),
      last_name: sanitizeInput.text(info.last_name),
      date_of_birth: info.date_of_birth,
      nationality: sanitizeInput.text(info.nationality),
      address_line1: sanitizeInput.text(info.address_line1),
      address_line2: info.address_line2 ? sanitizeInput.text(info.address_line2) : undefined,
      city: sanitizeInput.text(info.city),
      state: sanitizeInput.text(info.state),
      postal_code: sanitizeInput.text(info.postal_code),
      country: sanitizeInput.text(info.country)
    }
  }

  const validateDocumentFile = (file: File): { valid: boolean; message: string } => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    
    if (file.size > maxSize) {
      return { valid: false, message: 'File size must be less than 10MB' }
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Only JPEG, PNG, and PDF files are allowed' }
    }
    
    return { valid: true, message: '' }
  }

  const updateStepStatus = (stepId: string, status: KYCVerificationStep['status']) => {
    const step = verificationSteps.value.find(s => s.id === stepId)
    if (step) {
      step.status = status
    }
  }

  const updateStepStatuses = () => {
    if (!kycStatus.value) return
    
    // Update based on KYC status
    updateStepStatus('email', kycStatus.value.email_verified ? 'completed' : 'pending')
    updateStepStatus('phone', kycStatus.value.phone_verified ? 'completed' : 'pending')
    updateStepStatus('identity_document', kycStatus.value.identity_verified ? 'completed' : 'pending')
    updateStepStatus('address_proof', kycStatus.value.address_verified ? 'completed' : 'pending')
  }

  // Computed properties
  const currentStep = computed(() => {
    return verificationSteps.value.find(step => step.status === 'in_progress') ||
           verificationSteps.value.find(step => step.status === 'pending')
  })

  const completedSteps = computed(() => 
    verificationSteps.value.filter(step => step.status === 'completed')
  )

  const totalSteps = computed(() => verificationSteps.value.length)

  const progressPercentage = computed(() => 
    Math.round((completedSteps.value.length / totalSteps.value) * 100)
  )

  const isKYCComplete = computed(() => 
    kycStatus.value?.status === 'approved'
  )

  const canSubmitForReview = computed(() => {
    const requiredSteps = verificationSteps.value.filter(step => step.required)
    const completedRequiredSteps = requiredSteps.filter(step => step.status === 'completed')
    return completedRequiredSteps.length === requiredSteps.length
  })

  // Initialize steps on composable creation
  initializeSteps()

  return {
    // State
    kycStatus: computed(() => kycStatus.value),
    personalInfo: computed(() => personalInfo.value),
    documents: computed(() => documents.value),
    verificationSteps: computed(() => verificationSteps.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed
    currentStep,
    completedSteps,
    totalSteps,
    progressPercentage,
    isKYCComplete,
    canSubmitForReview,
    
    // Methods
    getKYCStatus,
    submitPersonalInfo,
    uploadDocument,
    verifyEmail,
    verifyPhone,
    getDocuments,
    updateStepStatus,
    initializeSteps
  }
}