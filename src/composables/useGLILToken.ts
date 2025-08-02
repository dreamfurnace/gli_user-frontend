import { ref, computed } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { walletAPI } from '../services/api'

// GLI-L Token configuration
const GLIL_TOKEN_MINT = new PublicKey('GLiLTokenMintAddressHere') // Replace with actual GLI-L token mint address
const GLIL_DECIMALS = 8

// Global state
const glilBalance = ref<number>(0)
const isLoading = ref(false)
const error = ref<string>('')

// Solana connection
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

export function useGLILToken() {
  // Get GLI-L token balance from blockchain
  const getGLILBalanceFromChain = async (walletAddress: string): Promise<number> => {
    try {
      const walletPubkey = new PublicKey(walletAddress)
      
      // Get associated token account address
      const associatedTokenAddress = await getAssociatedTokenAddress(
        GLIL_TOKEN_MINT,
        walletPubkey
      )
      
      // Get token account info
      const tokenAccount = await getAccount(connection, associatedTokenAddress)
      
      // Convert from token units to human readable
      const balance = Number(tokenAccount.amount) / Math.pow(10, GLIL_DECIMALS)
      return balance
      
    } catch (error) {
      // Token account might not exist (balance = 0)
      if (error instanceof Error && error.message.includes('could not find account')) {
        return 0
      }
      throw error
    }
  }

  // Get GLI-L balance from API (if available)
  const getGLILBalanceFromAPI = async (walletAddress: string): Promise<number> => {
    try {
      const response = await walletAPI.getGLILBalance(walletAddress)
      return parseFloat(response.data.balance || '0')
    } catch (error) {
      console.warn('API balance check failed, falling back to blockchain:', error)
      throw error
    }
  }

  // Update GLI-L balance
  const updateGLILBalance = async (walletAddress: string): Promise<void> => {
    if (!walletAddress) {
      glilBalance.value = 0
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      // Try API first, fallback to blockchain
      let balance: number
      try {
        balance = await getGLILBalanceFromAPI(walletAddress)
      } catch (apiError) {
        balance = await getGLILBalanceFromChain(walletAddress)
      }
      
      glilBalance.value = balance
    } catch (err: any) {
      console.error('Failed to fetch GLI-L balance:', err)
      error.value = err.message || 'Failed to fetch GLI-L balance'
      glilBalance.value = 0
    } finally {
      isLoading.value = false
    }
  }

  // Format GLI-L amount for display
  const formatGLILAmount = (amount: number): string => {
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

  // Check if user has enough GLI-L for purchase
  const hasEnoughGLIL = (requiredAmount: number): boolean => {
    return glilBalance.value >= requiredAmount
  }

  // Get available balance after considering minimum required balance
  const getAvailableBalance = (minReserve: number = 0): number => {
    return Math.max(0, glilBalance.value - minReserve)
  }

  // Validate purchase amount
  const validatePurchaseAmount = (amount: number, product: any) => {
    const errors: string[] = []
    
    if (!amount || amount <= 0) {
      errors.push('구매 금액을 확인해주세요')
    }
    
    if (!product.is_in_stock) {
      errors.push('현재 품절된 상품입니다')
    }
    
    if (!hasEnoughGLIL(amount)) {
      errors.push(`GLI-L 토큰이 부족합니다. 필요: ${formatGLILAmount(amount)}, 보유: ${formatGLILAmount(glilBalance.value)}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Calculate total amount for cart items
  const calculateCartTotal = (cartItems: any[]): number => {
    return cartItems.reduce((total, item) => {
      return total + (item.price_glil * item.quantity)
    }, 0)
  }

  // Validate cart checkout
  const validateCartCheckout = (cartItems: any[]) => {
    const errors: string[] = []
    
    if (cartItems.length === 0) {
      errors.push('장바구니가 비어있습니다')
      return { isValid: false, errors }
    }

    // Check for out of stock items
    const outOfStockItems = cartItems.filter(item => !item.is_in_stock)
    if (outOfStockItems.length > 0) {
      errors.push(`품절된 상품이 ${outOfStockItems.length}개 있습니다`)
    }

    const totalAmount = calculateCartTotal(cartItems.filter(item => item.is_in_stock))
    
    if (!hasEnoughGLIL(totalAmount)) {
      errors.push(`GLI-L 토큰이 부족합니다. 필요: ${formatGLILAmount(totalAmount)}, 보유: ${formatGLILAmount(glilBalance.value)}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      totalAmount
    }
  }

  // Computed properties
  const formattedBalance = computed(() => formatGLILAmount(glilBalance.value))
  
  const balanceStatus = computed(() => {
    if (isLoading.value) return 'loading'
    if (error.value) return 'error'
    if (glilBalance.value === 0) return 'empty'
    return 'loaded'
  })

  return {
    // State
    glilBalance: computed(() => glilBalance.value),
    formattedBalance,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    balanceStatus,
    
    // Methods
    updateGLILBalance,
    formatGLILAmount,
    hasEnoughGLIL,
    getAvailableBalance,
    validatePurchaseAmount,
    calculateCartTotal,
    validateCartCheckout,
    
    // Blockchain methods
    getGLILBalanceFromChain,
    getGLILBalanceFromAPI,
    
    // Constants
    GLIL_TOKEN_MINT,
    GLIL_DECIMALS
  }
}