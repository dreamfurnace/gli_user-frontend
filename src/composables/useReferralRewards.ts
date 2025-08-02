import { ref, computed } from 'vue'
import { referralAPI } from '../services/api'
import { sanitizeInput, securityLogger } from '../utils/security'

// Referral reward system types
export interface ReferralRewardConfig {
  base_reward_glib: number
  bonus_reward_glib: number
  bonus_threshold_referrals: number
  max_rewards_per_month: number
  reward_expiry_days: number
  minimum_referee_activity_days: number
}

export interface ReferralReward {
  id: string
  referral_id: string
  reward_amount_glib: number
  reward_type: 'base' | 'bonus' | 'special'
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'expired'
  created_at: string
  processed_at?: string
  transaction_hash?: string
  error_message?: string
}

export interface ReferralRewardStats {
  total_rewards_earned: number
  total_rewards_sent: number
  pending_rewards: number
  monthly_rewards: number
  reward_rate: number
  next_bonus_threshold: number
}

// Global state
const rewardConfig = ref<ReferralRewardConfig | null>(null)
const rewardStats = ref<ReferralRewardStats | null>(null)
const pendingRewards = ref<ReferralReward[]>([])
const rewardHistory = ref<ReferralReward[]>([])
const isLoading = ref(false)
const error = ref<string>('')

export function useReferralRewards() {
  // Get referral reward configuration
  const getRewardConfig = async (): Promise<ReferralRewardConfig | null> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await referralAPI.getRewardConfig()
      rewardConfig.value = response.data
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get reward config:', err)
      error.value = err.response?.data?.message || 'Failed to get reward configuration'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Get referral reward statistics
  const getRewardStats = async (userId: string): Promise<ReferralRewardStats | null> => {
    try {
      isLoading.value = true
      error.value = ''

      securityLogger.log('REFERRAL_REWARD_STATS_ACCESS', {
        userId: sanitizeInput.text(userId),
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.getRewardStats(userId)
      rewardStats.value = response.data
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get reward stats:', err)
      error.value = err.response?.data?.message || 'Failed to get reward statistics'
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Get pending rewards for user
  const getPendingRewards = async (userId: string): Promise<ReferralReward[]> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await referralAPI.getPendingRewards(userId)
      pendingRewards.value = response.data
      
      return response.data
    } catch (err: any) {
      console.error('Failed to get pending rewards:', err)
      error.value = err.response?.data?.message || 'Failed to get pending rewards'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Get reward history for user
  const getRewardHistory = async (userId: string, page: number = 1, limit: number = 20): Promise<ReferralReward[]> => {
    try {
      isLoading.value = true
      error.value = ''

      const response = await referralAPI.getRewardHistory(userId, { page, limit })
      rewardHistory.value = response.data.results || []
      
      return rewardHistory.value
    } catch (err: any) {
      console.error('Failed to get reward history:', err)
      error.value = err.response?.data?.message || 'Failed to get reward history'
      return []
    } finally {
      isLoading.value = false
    }
  }

  // Process a specific referral reward
  const processReward = async (rewardId: string): Promise<boolean> => {
    try {
      isLoading.value = true
      error.value = ''

      securityLogger.log('REFERRAL_REWARD_PROCESS_ATTEMPT', {
        rewardId: sanitizeInput.text(rewardId),
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.processReward(rewardId)
      
      if (response.data.success) {
        securityLogger.log('REFERRAL_REWARD_PROCESS_SUCCESS', {
          rewardId: sanitizeInput.text(rewardId),
          transactionHash: response.data.transaction_hash,
          rewardAmount: response.data.reward_amount,
          timestamp: new Date().toISOString()
        })
        
        // Refresh pending rewards
        if (rewardStats.value) {
          // Update pending rewards by removing the processed one
          pendingRewards.value = pendingRewards.value.filter(r => r.id !== rewardId)
        }
        
        return true
      }

      return false
    } catch (err: any) {
      console.error('Failed to process reward:', err)
      error.value = err.response?.data?.message || 'Failed to process reward'
      
      securityLogger.log('REFERRAL_REWARD_PROCESS_FAILED', {
        rewardId: sanitizeInput.text(rewardId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Process all pending rewards for user
  const processAllPendingRewards = async (userId: string): Promise<{ processed: number; failed: number }> => {
    try {
      isLoading.value = true
      error.value = ''

      securityLogger.log('REFERRAL_BATCH_REWARD_PROCESS_ATTEMPT', {
        userId: sanitizeInput.text(userId),
        pendingCount: pendingRewards.value.length,
        timestamp: new Date().toISOString()
      })

      const response = await referralAPI.processBatchRewards(userId)
      
      if (response.data.success) {
        const { processed, failed } = response.data
        
        securityLogger.log('REFERRAL_BATCH_REWARD_PROCESS_SUCCESS', {
          userId: sanitizeInput.text(userId),
          processed,
          failed,
          timestamp: new Date().toISOString()
        })

        // Refresh pending rewards and stats
        await getPendingRewards(userId)
        await getRewardStats(userId)
        
        return { processed, failed }
      }

      return { processed: 0, failed: pendingRewards.value.length }
    } catch (err: any) {
      console.error('Failed to process batch rewards:', err)
      error.value = err.response?.data?.message || 'Failed to process batch rewards'
      
      securityLogger.log('REFERRAL_BATCH_REWARD_PROCESS_FAILED', {
        userId: sanitizeInput.text(userId),
        error: error.value,
        timestamp: new Date().toISOString()
      })
      
      return { processed: 0, failed: pendingRewards.value.length }
    } finally {
      isLoading.value = false
    }
  }

  // Calculate potential reward for referral
  const calculatePotentialReward = (referralCount: number): number => {
    if (!rewardConfig.value) return 0
    
    const { base_reward_glib, bonus_reward_glib, bonus_threshold_referrals } = rewardConfig.value
    let totalReward = base_reward_glib
    
    // Add bonus if threshold is reached
    if (referralCount >= bonus_threshold_referrals) {
      totalReward += bonus_reward_glib
    }
    
    return totalReward
  }

  // Check if user is eligible for bonus rewards
  const isEligibleForBonus = (referralCount: number): boolean => {
    if (!rewardConfig.value) return false
    return referralCount >= rewardConfig.value.bonus_threshold_referrals
  }

  // Get next bonus threshold
  const getNextBonusThreshold = (currentReferrals: number): number => {
    if (!rewardConfig.value) return 0
    
    const threshold = rewardConfig.value.bonus_threshold_referrals
    return Math.ceil((currentReferrals + 1) / threshold) * threshold
  }

  // Format GLI-B amount
  const formatGLIBAmount = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`
    }
    return amount.toLocaleString()
  }

  // Get status display text
  const getStatusText = (status: string): string => {
    const statusMap = {
      'pending': '보상 대기',
      'processing': '처리 중',
      'sent': '지급 완료',
      'failed': '실패',
      'expired': '만료됨'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  // Get status color class
  const getStatusColor = (status: string): string => {
    const colorMap = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'sent': 'status-success',
      'failed': 'status-error',
      'expired': 'status-expired'
    }
    return colorMap[status as keyof typeof colorMap] || 'status-default'
  }

  // Computed properties
  const totalPendingAmount = computed(() => 
    pendingRewards.value.reduce((sum, reward) => sum + reward.reward_amount_glib, 0)
  )

  const hasConfig = computed(() => rewardConfig.value !== null)
  const hasStats = computed(() => rewardStats.value !== null)
  const hasPendingRewards = computed(() => pendingRewards.value.length > 0)

  const formattedTotalPending = computed(() => 
    formatGLIBAmount(totalPendingAmount.value)
  )

  return {
    // State
    rewardConfig: computed(() => rewardConfig.value),
    rewardStats: computed(() => rewardStats.value),
    pendingRewards: computed(() => pendingRewards.value),
    rewardHistory: computed(() => rewardHistory.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // Computed
    totalPendingAmount,
    hasConfig,
    hasStats,
    hasPendingRewards,
    formattedTotalPending,
    
    // Methods
    getRewardConfig,
    getRewardStats,
    getPendingRewards,
    getRewardHistory,
    processReward,
    processAllPendingRewards,
    calculatePotentialReward,
    isEligibleForBonus,
    getNextBonusThreshold,
    formatGLIBAmount,
    getStatusText,
    getStatusColor
  }
}