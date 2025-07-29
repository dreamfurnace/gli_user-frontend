import { ref, computed } from 'vue'
import { useSolanaWallet } from './useSolanaWallet'
import axios from 'axios'

// Django API 베이스 URL - 환경 변수에서 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')

// LocalStorage 키 - 환경 변수에서 가져오기
const JWT_STORAGE_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'gli_auth_token'
const USER_PROFILE_STORAGE_KEY = import.meta.env.VITE_USER_PROFILE_STORAGE_KEY || 'gli_user_profile'

// 인증 상태 관리
const isAuthenticated = ref(false)
const authToken = ref<string | null>(null)
const userProfile = ref<any>(null)
const isAuthenticating = ref(false)

export function useSolanaAuth() {
  const { publicKey, isConnected, fullAddress } = useSolanaWallet()

  // 지갑 서명을 통한 인증
  const authenticateWithWallet = async () => {
    if (!isConnected.value || !publicKey.value) {
      throw new Error('지갑이 연결되지 않았습니다')
    }

    try {
      isAuthenticating.value = true

      // 1. 서버에서 nonce 가져오기
      const nonceResponse = await axios.post(`${API_BASE_URL}/api/auth/nonce/`, {
        wallet_address: fullAddress.value
      })

      const { nonce } = nonceResponse.data

      // 2. 메시지 생성 및 서명
      const message = `GLI Platform 로그인 인증\n\n지갑 주소: ${fullAddress.value}\n시간: ${new Date().toISOString()}\nNonce: ${nonce}`
      
      // 서명 요청 (Phantom 지갑)
      const encodedMessage = new TextEncoder().encode(message)
      const signedMessage = await window.phantom?.solana?.signMessage(encodedMessage, 'utf8')

      if (!signedMessage) {
        throw new Error('메시지 서명에 실패했습니다')
      }

      // 3. 서명 검증 및 토큰 발급
      const authResponse = await axios.post(`${API_BASE_URL}/api/auth/verify/`, {
        wallet_address: fullAddress.value,
        signature: Array.from(signedMessage.signature),
        message: message,
        nonce: nonce
      })

      const { access_token, user } = authResponse.data

      // 4. 인증 상태 업데이트
      authToken.value = access_token
      userProfile.value = user
      isAuthenticated.value = true

      // localStorage에 토큰 저장
      localStorage.setItem(JWT_STORAGE_KEY, access_token)
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user))

      console.log('🎉 GLI Platform 인증 성공!')
      return { success: true, user }

    } catch (error: any) {
      console.error('인증 실패:', error)
      throw new Error(error.response?.data?.message || '인증에 실패했습니다')
    } finally {
      isAuthenticating.value = false
    }
  }

  // 로그아웃
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청
      if (authToken.value) {
        await axios.post(`${API_BASE_URL}/api/auth/logout/`, {}, {
          headers: {
            'Authorization': `Bearer ${authToken.value}`
          }
        })
      }
    } catch (error) {
      console.error('로그아웃 요청 실패:', error)
    }

    // 로컬 상태 초기화
    authToken.value = null
    userProfile.value = null
    isAuthenticated.value = false

    // localStorage 정리
    localStorage.removeItem(JWT_STORAGE_KEY)
    localStorage.removeItem(USER_PROFILE_STORAGE_KEY)

    console.log('👋 GLI Platform 로그아웃 완료')
  }

  // 토큰 새로고침
  const refreshToken = async () => {
    const token = authToken.value || localStorage.getItem(JWT_STORAGE_KEY)
    
    if (!token) return false

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const { access_token } = response.data
      authToken.value = access_token
      localStorage.setItem(JWT_STORAGE_KEY, access_token)

      return true
    } catch (error) {
      console.error('토큰 갱신 실패:', error)
      await logout()
      return false
    }
  }

  // 사용자 프로필 업데이트
  const updateProfile = async (profileData: any) => {
    if (!authToken.value) {
      throw new Error('로그인이 필요합니다')
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/profile/`, profileData, {
        headers: {
          'Authorization': `Bearer ${authToken.value}`
        }
      })

      userProfile.value = response.data
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(response.data))

      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '프로필 업데이트에 실패했습니다')
    }
  }

  // 초기화 시 로컬 스토리지에서 복원
  const initializeAuth = () => {
    const token = localStorage.getItem(JWT_STORAGE_KEY)
    const profile = localStorage.getItem(USER_PROFILE_STORAGE_KEY)

    if (token && profile) {
      authToken.value = token
      userProfile.value = JSON.parse(profile)
      isAuthenticated.value = true

      // 토큰 유효성 검사
      refreshToken().catch(() => {
        // 토큰이 유효하지 않으면 로그아웃
        logout()
      })
    }
  }

  // 초기화 실행
  initializeAuth()

  return {
    // 상태
    isAuthenticated: computed(() => isAuthenticated.value),
    isAuthenticating: computed(() => isAuthenticating.value),
    authToken: computed(() => authToken.value),
    userProfile: computed(() => userProfile.value),
    
    // 메서드
    authenticateWithWallet,
    logout,
    refreshToken,
    updateProfile,
    initializeAuth
  }
}