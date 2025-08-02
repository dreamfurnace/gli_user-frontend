import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authAPI, profileAPI } from '@/services/api'
import { useSideMenuStore } from '@/stores/sideMenuStore'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  profile_image?: string
  profile_image_url?: string
  role: string
  created_at: string
  updated_at: string
}

interface LoginCredentials {
  username: string
  password: string
  device_type?: string
}

interface RegisterData {
  email: string
  name: string
  phone?: string
  password: string
  password_confirm: string
}

interface ProfileData {
  name?: string
  phone?: string
  profile_image?: string
}

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  )
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refresh_token'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const router = useRouter()

  // 계산된 속성
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const userRole = computed(() => user.value?.role || 'guest')

  // 액션
  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.login(credentials)
      const { token, user: userData } = response.data

      // 토큰 저장 (backend response format: token.access, token.refresh)
      accessToken.value = token.access
      refreshToken.value = token.refresh
      localStorage.setItem('access_token', token.access)
      localStorage.setItem('refresh_token', token.refresh)
      localStorage.setItem('tokens', JSON.stringify(token))

      // 사용자 정보 저장
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || '로그인에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.register(userData)
      const { tokens, user: newUser } = response.data

      // 토큰 저장
      accessToken.value = tokens.access_token
      refreshToken.value = tokens.refresh_token
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      localStorage.setItem('tokens', JSON.stringify(tokens))

      // 사용자 정보 저장
      user.value = newUser
      localStorage.setItem('user', JSON.stringify(newUser))

      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || '회원가입에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    try {
      // 백엔드 로그아웃 API 호출
      await authAPI.logout()
      console.log('[DEBUG] 백엔드 로그아웃 API 호출 완료')
    } catch (err: any) {
      console.error('백엔드 로그아웃 실패:', err)
      // 백엔드 로그아웃이 실패해도 프론트엔드는 정리
    } finally {
      // 프론트엔드 상태 정리
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('tokens')
      localStorage.removeItem('user')
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      error.value = null

      console.log('[DEBUG] 프론트엔드 상태 정리 완료')

      // 사이드바 상태 초기화
      const sideMenuStore = useSideMenuStore()
      sideMenuStore.resetState()

      // 로그인 페이지로 이동
      await router.push('/login')
    }
  }

  const fetchProfile = async () => {
    if (!accessToken.value) return

    try {
      const response = await profileAPI.getProfile()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
    } catch (err: any) {
      // 401 (인증 실패) 또는 404 (프로필 없음) 에러 처리
      if (err.response?.status === 401 || err.response?.status === 404) {
        console.warn('토큰이 유효하지 않거나 프로필을 찾을 수 없습니다. 로그아웃 처리됩니다.')
        await logout()
      } else {
        console.error('프로필 조회 중 오류:', err)
      }
    }
  }

  const updateProfile = async (profileData: ProfileData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await profileAPI.updateProfile(profileData)
      user.value = { ...user.value, ...response.data }
      localStorage.setItem('user', JSON.stringify(user.value))
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || '프로필 업데이트에 실패했습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const getSessions = async () => {
    try {
      const response = await authAPI.getSessions()
      return response.data
    } catch (err) {
      console.error('세션 조회 중 오류:', err)
      throw err
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await authAPI.deleteSession(sessionId)
    } catch (err) {
      console.error('세션 삭제 중 오류:', err)
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  // 초기화 시 토큰 유효성 검사 및 프로필 조회
  const initialize = async () => {
    if (accessToken.value && user.value) {
      // 토큰과 사용자 정보가 모두 있는 경우에만 프로필 조회
      await fetchProfile()
    } else if (accessToken.value && !user.value) {
      // 토큰은 있지만 사용자 정보가 없는 경우
      await fetchProfile()
    } else {
      // 토큰이 없는 경우 로컬 스토리지 정리
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('tokens')
      localStorage.removeItem('user')
      accessToken.value = null
      refreshToken.value = null
      user.value = null
    }
  }

  return {
    // 상태
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // 계산된 속성
    isAuthenticated,
    userRole,

    // 액션
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    getSessions,
    deleteSession,
    clearError,
    initialize,
  }
})
