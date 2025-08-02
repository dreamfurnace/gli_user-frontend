import { ref, computed, watch } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { walletAPI } from '../services/api'

// GLI-B Token configuration
const GLIB_TOKEN_MINT = new PublicKey('GLiBTokenMintAddressHere') // Replace with actual GLI-B token mint address
const GLIB_DECIMALS = 8

// Global state
const glibBalance = ref<number>(0)
const isLoading = ref(false)
const error = ref<string>('')

// Solana connection
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

export function useGLIBToken() {
  // Get GLI-B token balance from blockchain
  const getGLIBBalanceFromChain = async (walletAddress: string): Promise<number> => {
    try {
      const walletPubkey = new PublicKey(walletAddress)
      
      // Get associated token account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        GLIB_TOKEN_MINT,
        walletPubkey
      )
      
      // Get token account info
      const tokenAccount = await getAccount(connection, associatedTokenAddress)
      
      // Convert from token units to human readable
      const balance = Number(tokenAccount.amount) / Math.pow(10, GLIB_DECIMALS)
      return balance
      
    } catch (error) {
      // Token account might not exist (balance = 0)
      if (error instanceof Error && error.message.includes('could not find account')) {
        return 0
      }
      throw error
    }
  }

  // Get GLI-B balance from API (if available)
  const getGLIBBalanceFromAPI = async (walletAddress: string): Promise<number> => {
    try {
      const response = await walletAPI.getGLIBBalance(walletAddress)
      return parseFloat(response.data.balance || '0')
    } catch (error) {
      console.warn('API balance check failed, falling back to blockchain:', error)
      throw error
    }
  }

  // Update GLI-B balance
  const updateGLIBBalance = async (walletAddress: string): Promise<void> => {
    if (!walletAddress) {
      glibBalance.value = 0
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      // Try API first, fallback to blockchain
      let balance: number
      try {
        balance = await getGLIBBalanceFromAPI(walletAddress)
      } catch (apiError) {
        balance = await getGLIBBalanceFromChain(walletAddress)
      }
      
      glibBalance.value = balance
    } catch (err: any) {
      console.error('Failed to fetch GLI-B balance:', err)
      error.value = err.message || 'Failed to fetch GLI-B balance'
      glibBalance.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // Format GLI-B amount for display
  const formatGLIBAmount = (amount: number): string => {
    if (amount === 0) return '0'
    
    // Show appropriate decimal places based on amount size
    if (amount >= 1000) {
      return new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount)
    } else if (amount >= 1) {
      return new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      }).format(amount)
    } else {
      return new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
      }).format(amount)
    }
  }

  // Check if user has enough GLI-B for investment
  const hasEnoughGLIB = (requiredAmount: number): boolean => {
    return glibBalance.value >= requiredAmount
  }

  // Get available balance after considering minimum required balance
  const getAvailableBalance = (minReserve: number = 0): number => {
    return Math.max(0, glibBalance.value - minReserve)
  }

  // Validate investment amount
  const validateInvestmentAmount = (amount: number, asset: any) => {
    const errors: string[] = []
    
    if (!amount || amount <= 0) {
      errors.push('투자 금액을 입력해주세요')
    }
    
    if (amount < asset.min_investment_gleb) {
      errors.push(`최소 투자 금액은 ${formatGLIBAmount(asset.min_investment_gleb)} GLI-B입니다`)
    }
    
    if (asset.max_investment_gleb && amount > asset.max_investment_gleb) {
      errors.push(`최대 투자 금액은 ${formatGLIBAmount(asset.max_investment_gleb)} GLI-B입니다`)
    }
    
    if (!hasEnoughGLIB(amount)) {
      errors.push(`GLI-B 토큰이 부족합니다. 필요: ${formatGLIBAmount(amount)}, 보유: ${formatGLIBAmount(glibBalance.value)}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Computed properties
  const formattedBalance = computed(() => formatGLIBAmount(glibBalance.value))
  
  const balanceStatus = computed(() => {
    if (isLoading.value) return 'loading'
    if (error.value) return 'error'
    if (glibBalance.value === 0) return 'empty'
    return 'loaded'
  })

  return {
    // State
    glibBalance: computed(() => glibBalance.value),
    formattedBalance,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    balanceStatus,
    
    // Methods
    updateGLIBBalance,
    formatGLIBAmount,
    hasEnoughGLIB,
    getAvailableBalance,
    validateInvestmentAmount,
    
    // Blockchain methods
    getGLIBBalanceFromChain,
    getGLIBBalanceFromAPI,
    
    // Constants
    GLIB_TOKEN_MINT,
    GLIB_DECIMALS
  }
}