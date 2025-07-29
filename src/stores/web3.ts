import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Web3 from 'web3'

export interface WalletInfo {
  address: string
  balance: string
  chainId: number
  networkName: string
}

export interface TokenBalance {
  glib: string
  glid: string
  glil: string
  usdt: string
}

export const useWeb3Store = defineStore('web3', () => {
  const web3 = ref<Web3 | null>(null)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const walletInfo = ref<WalletInfo | null>(null)
  const tokenBalances = ref<TokenBalance>({
    glib: '0',
    glid: '0', 
    glil: '0',
    usdt: '0'
  })
  const error = ref<string | null>(null)

  // 연결 상태 computed
  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    return 'disconnected'
  })

  // 지갑 연결
  const connectWallet = async () => {
    try {
      isConnecting.value = true
      error.value = null

      if (typeof window.ethereum !== 'undefined') {
        // MetaMask 연결
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          web3.value = new Web3(window.ethereum)
          const chainId = await web3.value.eth.getChainId()
          const balance = await web3.value.eth.getBalance(accounts[0])
          
          walletInfo.value = {
            address: accounts[0],
            balance: web3.value.utils.fromWei(balance, 'ether'),
            chainId: Number(chainId),
            networkName: getNetworkName(Number(chainId))
          }
          
          isConnected.value = true
          await loadTokenBalances()
        }
      } else {
        throw new Error('MetaMask is not installed')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to connect wallet'
      console.error('Wallet connection error:', err)
    } finally {
      isConnecting.value = false
    }
  }

  // 지갑 연결 해제
  const disconnectWallet = () => {
    web3.value = null
    isConnected.value = false
    walletInfo.value = null
    tokenBalances.value = {
      glib: '0',
      glid: '0',
      glil: '0', 
      usdt: '0'
    }
    error.value = null
  }

  // 토큰 잔액 로드
  const loadTokenBalances = async () => {
    if (!web3.value || !walletInfo.value) return

    try {
      // 실제 구현에서는 토큰 컨트랙트 주소와 ABI가 필요
      // 현재는 모의 데이터
      tokenBalances.value = {
        glib: '1000.5',
        glid: '500.25',
        glil: '2000.75',
        usdt: '100.0'
      }
    } catch (err) {
      console.error('Failed to load token balances:', err)
    }
  }

  // 네트워크 이름 가져오기
  const getNetworkName = (chainId: number): string => {
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      3: 'Ropsten',
      4: 'Rinkeby',
      5: 'Goerli',
      56: 'BSC Mainnet',
      97: 'BSC Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai'
    }
    return networks[chainId] || `Chain ID: ${chainId}`
  }

  // 네트워크 변경 감지
  const setupEventListeners = () => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          connectWallet()
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }
  }

  // 초기화
  const init = async () => {
    setupEventListeners()
    
    // 이전 세션 복구 시도
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        })
        if (accounts.length > 0) {
          await connectWallet()
        }
      } catch (err) {
        console.error('Failed to restore session:', err)
      }
    }
  }

  return {
    web3,
    isConnected,
    isConnecting,
    walletInfo,
    tokenBalances,
    error,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    loadTokenBalances,
    init
  }
})