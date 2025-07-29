import { ref, computed, watch } from 'vue'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import type { WalletAdapter } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'

// 월렛 상태 관리
const walletAdapter = ref<WalletAdapter | null>(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const publicKey = ref<PublicKey | null>(null)
const balance = ref(0)

// Solana 네트워크 연결
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')

export function useSolanaWallet() {
  // 월렛 초기화
  const initializeWallet = () => {
    walletAdapter.value = new PhantomWalletAdapter()
    
    // 월렛 이벤트 리스너 설정
    walletAdapter.value.on('connect', (pk: PublicKey) => {
      isConnected.value = true
      publicKey.value = pk
      updateBalance()
      console.log('💎 Phantom wallet connected:', pk.toBase58())
    })

    walletAdapter.value.on('disconnect', () => {
      isConnected.value = false
      publicKey.value = null
      balance.value = 0
      console.log('👋 Phantom wallet disconnected')
    })

    walletAdapter.value.on('error', (error) => {
      console.error('🚨 Wallet error:', error)
      isConnecting.value = false
    })
  }

  // 월렛 연결
  const connectWallet = async () => {
    if (!walletAdapter.value) {
      initializeWallet()
    }

    if (isConnecting.value || isConnected.value) return

    try {
      isConnecting.value = true
      await walletAdapter.value?.connect()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      // Phantom이 설치되지 않은 경우 설치 페이지로 리다이렉트
      if (error instanceof Error && error.message.includes('not found')) {
        window.open('https://phantom.app/', '_blank')
      }
    } finally {
      isConnecting.value = false
    }
  }

  // 월렛 연결 해제
  const disconnectWallet = async () => {
    try {
      await walletAdapter.value?.disconnect()
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  // 잔액 업데이트
  const updateBalance = async () => {
    if (!publicKey.value) return

    try {
      const lamports = await connection.getBalance(publicKey.value)
      balance.value = lamports / 1000000000 // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  // 지갑 주소 단축 형태
  const shortAddress = computed(() => {
    if (!publicKey.value) return ''
    const address = publicKey.value.toBase58()
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  })

  // 지갑 주소 전체
  const fullAddress = computed(() => {
    return publicKey.value?.toBase58() || ''
  })

  // 연결 상태 확인
  const checkConnection = async () => {
    if (walletAdapter.value?.connected) {
      isConnected.value = true
      publicKey.value = walletAdapter.value.publicKey
      await updateBalance()
    }
  }

  // 초기화 시 연결 상태 확인
  initializeWallet()
  checkConnection()

  // publicKey 변경 시 자동으로 balance 업데이트
  watch(publicKey, () => {
    if (publicKey.value) {
      updateBalance()
    }
  })

  return {
    // 상태
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    publicKey: computed(() => publicKey.value),
    balance: computed(() => balance.value),
    shortAddress,
    fullAddress,
    connection,
    
    // 메서드
    connectWallet,
    disconnectWallet,
    updateBalance,
    checkConnection
  }
}