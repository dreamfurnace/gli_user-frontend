import { ref, computed } from 'vue'
import { referralAPI } from '../services/api'
import { sanitizeInput, validateInput, securityLogger } from '../utils/security'

// Referral system types
export interface ReferralCode {
  id: string
  code: string
  user_id: string
  created_at: string
  expires_at?: string
  is_active: boolean
  max_uses?: number
  current_uses: number
}

export interface ReferralRecord {
  id: string
  referrer_id: string
  referee_id: string
  referral_code: string
  status: 'pending' | 'confirmed' | 'rewarded' | 'expired'
  reward_amount_glib: number
  reward_sent_at?: string
  created_at: string
}

export interface ReferralStats {
  total_referrals: number
  confirmed_referrals: number
  pending_referrals: number
  total_rewards_glib: number
  current_month_referrals: number
  conversion_rate: number
}

// Global state
const referralCode = ref<ReferralCode | null>(null)
const referralStats = ref<ReferralStats | null>(null)
const referralHistory = ref<ReferralRecord[]>([])
const isLoading = ref(false)
const error = ref<string>('')

export function useReferral() {
  // Generate a new referral code
  const generateReferralCode = async (): Promise<string> => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'GLI'
    
    // Add random characters
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    
    // Add timestamp suffix for uniqueness
    const timestamp = Date.now().toString(36).toUpperCase().slice(-3)
    result += timestamp
    
    return result
  }

  // Get or create user's referral code
  const getReferralCode = async (userId: string): Promise<ReferralCode | null> => {
    try {
      isLoading.value = true
      error.value = ''

      // Log referral code access
      securityLogger.log('REFERRAL_CODE_ACCESS', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.getReferralCode(userId)
      
      if (response.data) {
        referralCode.value = response.data
        return response.data
      }
      
      return null
    } catch (err: any) {
      console.error('Failed to get referral code:', err)
      
      if (err.response?.status === 404) {
        // Create new referral code if doesn't exist
        return await createReferralCode(userId)
      }
      
      error.value = err.response?.data?.message || 'Failed to get referral code'
      securityLogger.log('REFERRAL_CODE_ACCESS_FAILED', {
        userId: sanitizeInput.text(userId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Create a new referral code
  const createReferralCode = async (userId: string): Promise<ReferralCode | null> => {
    try {
      isLoading.value = true
      error.value = ''

      const newCode = await generateReferralCode()
      
      const response = await referralAPI.createReferralCode({
        user_id: userId,
        code: newCode,
        max_uses: 1000, // Default max uses
        expires_at: undefined // No expiration by default
      })

      // Log referral code creation
      securityLogger.log('REFERRAL_CODE_CREATED', {
        userId: sanitizeInput.text(userId),
        code: sanitizeInput.text(newCode),
        timestamp: new Date().toISOString()
      })

      referralCode.value = response.data
      return response.data
    } catch (err: any) {
      console.error('Failed to create referral code:', err)
      error.value = err.response?.data?.message || 'Failed to create referral code'
      
      securityLogger.log('REFERRAL_CODE_CREATION_FAILED', {
        userId: sanitizeInput.text(userId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Validate and use referral code
  const useReferralCode = async (code: string, newUserId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      // Sanitize and validate input
      const sanitizedCode = sanitizeInput.text(code.toUpperCase())
      const codeError = validateInput.required(sanitizedCode, 'Referral code')
      
      if (codeError) {
        error.value = codeError
        return false
      }

      // Log referral code usage attempt
      securityLogger.log('REFERRAL_CODE_USE_ATTEMPT', {
        code: sanitizedCode,
        newUserId: sanitizeInput.text(newUserId),
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.useReferralCode({
        referral_code: sanitizedCode,
        referee_id: newUserId
      })

      if (response.data.success) {
        // Log successful referral
        securityLogger.log('REFERRAL_CODE_USE_SUCCESS', {
          code: sanitizedCode,
          newUserId: sanitizeInput.text(newUserId),
          referrerId: response.data.referrer_id,
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to use referral code:', err)
      error.value = err.response?.data?.message || 'Invalid or expired referral code'
      
      securityLogger.log('REFERRAL_CODE_USE_FAILED', {
        code: sanitizeInput.text(code),
        newUserId: sanitizeInput.text(newUserId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Get referral statistics
  const getReferralStats = async (userId: string): Promise<ReferralStats | null> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await referralAPI.getReferralStats(userId)
      referralStats.value = response.data
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get referral stats:', err)
      error.value = err.response?.data?.message || 'Failed to get referral statistics'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Get referral history
  const getReferralHistory = async (userId: string, page: number = 1, limit: number = 20): Promise<ReferralRecord[]> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await referralAPI.getReferralHistory(userId, { page, limit })
      
      referralHistory.value = response.data.results || []
      return referralHistory.value
    } catch (err: any) {
      console.error('Failed to get referral history:', err)
      error.value = err.response?.data?.message || 'Failed to get referral history'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Process referral rewards
  const processReferralReward = async (referralId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      securityLogger.log('REFERRAL_REWARD_PROCESS_ATTEMPT', {
        referralId: sanitizeInput.text(referralId),
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.processReferralReward(referralId)
      
      if (response.data.success) {
        securityLogger.log('REFERRAL_REWARD_PROCESS_SUCCESS', {
          referralId: sanitizeInput.text(referralId),
          rewardAmount: response.data.reward_amount,
          timestamp: new Date().toISOString()
        })
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to process referral reward:', err)
      error.value = err.response?.data?.message || 'Failed to process referral reward'
      
      securityLogger.log('REFERRAL_REWARD_PROCESS_FAILED', {
        referralId: sanitizeInput.text(referralId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Generate referral link
  const generateReferralLink = (code: string): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/signup?ref=${encodeURIComponent(code)}`
  }

  // Format referral code for display
  const formatReferralCode = (code: string): string => {
    if (!code) return ''
    return code.replace(/(.{3})(.{3})(.{3})/, '$1-$2-$3')
  }

  // Computed properties
  const hasReferralCode = computed(() => referralCode.value !== null)
  const formattedReferralCode = computed(() => 
    referralCode.value ? formatReferralCode(referralCode.value.code) : ''
  )
  const referralLink = computed(() => 
    referralCode.value ? generateReferralLink(referralCode.value.code) : ''
  )
  
  const isCodeActive = computed(() => 
    referralCode.value?.is_active && 
    (!referralCode.value.expires_at || new Date(referralCode.value.expires_at) > new Date())
  )

  return {
    // State
    referralCode: computed(() => referralCode.value),
    referralStats: computed(() => referralStats.value),
    referralHistory: computed(() => referralHistory.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed
    hasReferralCode,
    formattedReferralCode,
    referralLink,
    isCodeActive,
    
    // Methods
    getReferralCode,
    createReferralCode,
    useReferralCode,
    getReferralStats,
    getReferralHistory,
    processReferralReward,
    generateReferralLink,
    formatReferralCode,
    
    // Constants
    generateReferralCode
  }
}