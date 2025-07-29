import axios from 'axios'
import type { AxiosResponse } from 'axios'

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 응답 인터셉터 - 토큰 갱신 및 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh_token: refreshToken,
          })

          const { access_token } = response.data
          localStorage.setItem('access_token', access_token)

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // 리프레시 토큰도 만료된 경우 로그아웃
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

// 타입 정의
interface LoginCredentials {
  email: string
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

export interface ProfileData {
  id?: string
  email?: string
  name?: string
  phone?: string
  profile_image?: string
  account_type?: string
  is_phone_verified?: boolean
  phone_verified_at?: string
  subscription_type?: string
  subscription_status?: string
  subscription_start_date?: string
  subscription_end_date?: string
  payment_method_registered?: boolean
  payment_card_number?: string
  payment_card_type?: string
  payment_card_expiry?: string
  role?: string
  created_at?: string
  updated_at?: string
}

interface ApiParams {
  [key: string]: any
}

// 인증 관련 API
export const authAPI = {
  // 로그인
  login: (credentials: LoginCredentials): Promise<AxiosResponse> =>
    apiClient.post('/auth/login/', credentials),

  // 회원가입
  register: (userData: RegisterData): Promise<AxiosResponse> =>
    apiClient.post('/auth/register/', userData),

  // 로그아웃
  logout: (): Promise<AxiosResponse> => apiClient.post('/auth/logout/'),

  // 세션 목록 조회
  getSessions: (): Promise<AxiosResponse> => apiClient.get('/auth/sessions/'),

  // 세션 삭제
  deleteSession: (sessionId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/auth/sessions/${sessionId}/`),
}

// 프로필 관련 API
export const profileAPI = {
  // 프로필 조회
  getProfile: (): Promise<AxiosResponse> => apiClient.get('/profile/'),

  // 특정 사용자 프로필 조회
  getProfileById: (userId: string): Promise<AxiosResponse> => apiClient.get(`/profile/${userId}/`),

  // 프로필 업데이트
  updateProfile: (profileData: ProfileData): Promise<AxiosResponse> =>
    apiClient.patch('/profile/', profileData),

  // 프로필 부분 업데이트
  patchProfile: (profileData: ProfileData): Promise<AxiosResponse> =>
    apiClient.patch('/profile/', profileData),

  // 아바타 업로드
  uploadAvatar: (file: File): Promise<AxiosResponse> => {
    const formData = new FormData()
    formData.append('avatar', file)

    console.log('[DEBUG] uploadAvatar 호출됨')
    console.log('[DEBUG] baseURL:', API_BASE_URL)
    console.log('[DEBUG] 요청 URL:', `${API_BASE_URL}/profile/avatar/`)
    console.log('[DEBUG] 파일 정보:', { name: file.name, size: file.size, type: file.type })

    return apiClient.post('/profile/avatar/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // 아바타 삭제
  deleteAvatar() {
    return apiClient.delete('/profile/avatar/')
  },

  // 비밀번호 변경
  changePassword: (passwordData: {
    current_password: string
    new_password: string
    confirm_password: string
  }): Promise<AxiosResponse> => apiClient.post('/profile/change-password/', passwordData),

  // 휴대폰 인증
  verifyPhone: (phoneData: { phone: string; verification_code: string }): Promise<AxiosResponse> =>
    apiClient.post('/profile/verify-phone/', phoneData),

  // 구독 변경
  updateSubscription: (subscriptionData: {
    subscription_type: string
    subscription_status?: string
  }): Promise<AxiosResponse> => apiClient.post('/profile/update-subscription/', subscriptionData),

  // 회원 탈퇴
  deleteAccount: (): Promise<AxiosResponse> => apiClient.delete('/profile/'),
}

// 사용자 관련 API
export const userAPI = {
  // 사용자 목록 조회
  getUsers: (params?: ApiParams): Promise<AxiosResponse> => apiClient.get('/users/', { params }),

  // 사용자 상세 조회
  getUser: (userId: string): Promise<AxiosResponse> => apiClient.get(`/users/${userId}/`),

  // 사용자 생성
  createUser: (userData: any): Promise<AxiosResponse> => apiClient.post('/users/', userData),

  // 사용자 수정
  updateUser: (userId: string, userData: any): Promise<AxiosResponse> =>
    apiClient.put(`/users/${userId}/`, userData),

  // 사용자 삭제
  deleteUser: (userId: string): Promise<AxiosResponse> => apiClient.delete(`/users/${userId}/`),
}

// 케이스룸 관련 API
export const caseRoomAPI = {
  // 케이스룸 목록 조회
  getCaseRooms: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/case-rooms/', { params }),

  // 케이스룸 상세 조회
  getCaseRoom: (caseRoomId: string): Promise<AxiosResponse> =>
    apiClient.get(`/case-rooms/${caseRoomId}/`),

  // 케이스룸 생성
  createCaseRoom: (caseRoomData: any): Promise<AxiosResponse> =>
    apiClient.post('/case-rooms/', caseRoomData),

  // 케이스룸 수정
  updateCaseRoom: (caseRoomId: string, caseRoomData: any): Promise<AxiosResponse> =>
    apiClient.put(`/case-rooms/${caseRoomId}/`, caseRoomData),

  // 케이스룸 삭제
  deleteCaseRoom: (caseRoomId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/case-rooms/${caseRoomId}/`),
}

// 파트너 관련 API
export const partnerAPI = {
  // 파트너 목록 조회
  getPartners: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/partners/', { params }),

  // 파트너 상세 조회
  getPartner: (partnerId: string): Promise<AxiosResponse> =>
    apiClient.get(`/partners/${partnerId}/`),

  // 파트너 생성
  createPartner: (partnerData: any): Promise<AxiosResponse> =>
    apiClient.post('/partners/', partnerData),

  // 파트너 수정
  updatePartner: (partnerId: string, partnerData: any): Promise<AxiosResponse> =>
    apiClient.put(`/partners/${partnerId}/`, partnerData),

  // 파트너 삭제
  deletePartner: (partnerId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/partners/${partnerId}/`),
}

// 계약 관련 API
export const contractAPI = {
  // 계약 목록 조회
  getContracts: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/contracts/', { params }),

  // 계약 상세 조회
  getContract: (contractId: string): Promise<AxiosResponse> =>
    apiClient.get(`/contracts/${contractId}/`),

  // 계약 생성
  createContract: (contractData: any): Promise<AxiosResponse> =>
    apiClient.post('/contracts/', contractData),

  // 계약 수정
  updateContract: (contractId: string, contractData: any): Promise<AxiosResponse> =>
    apiClient.put(`/contracts/${contractId}/`, contractData),

  // 계약 삭제
  deleteContract: (contractId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/contracts/${contractId}/`),

  // 계약 템플릿 목록 조회
  getContractTemplates: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/contract-templates/', { params }),
}

// 문서 관련 API
export const documentAPI = {
  // 문서 목록 조회
  getDocuments: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/documents/', { params }),

  // 문서 상세 조회
  getDocument: (documentId: string): Promise<AxiosResponse> =>
    apiClient.get(`/documents/${documentId}/`),

  // 문서 생성
  createDocument: (documentData: any): Promise<AxiosResponse> =>
    apiClient.post('/documents/', documentData),

  // 문서 수정
  updateDocument: (documentId: string, documentData: any): Promise<AxiosResponse> =>
    apiClient.put(`/documents/${documentId}/`, documentData),

  // 문서 삭제
  deleteDocument: (documentId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/documents/${documentId}/`),
}

// 발급 요청 관련 API
export const issuanceAPI = {
  // 발급 요청 목록 조회
  getIssuanceRequests: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/issuance-requests/', { params }),

  // 발급 요청 상세 조회
  getIssuanceRequest: (requestId: string): Promise<AxiosResponse> =>
    apiClient.get(`/issuance-requests/${requestId}/`),

  // 발급 요청 생성
  createIssuanceRequest: (requestData: any): Promise<AxiosResponse> =>
    apiClient.post('/issuance-requests/', requestData),

  // 발급 요청 수정
  updateIssuanceRequest: (requestId: string, requestData: any): Promise<AxiosResponse> =>
    apiClient.put(`/issuance-requests/${requestId}/`, requestData),

  // 발급 요청 삭제
  deleteIssuanceRequest: (requestId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/issuance-requests/${requestId}/`),
}

// 법률/판례 관련 API
export const lawAPI = {
  // 법률/판례 목록 조회
  getLaws: (params?: ApiParams): Promise<AxiosResponse> => apiClient.get('/laws/', { params }),

  // 법률/판례 상세 조회
  getLaw: (lawId: string): Promise<AxiosResponse> => apiClient.get(`/laws/${lawId}/`),

  // 법률/판례 생성
  createLaw: (lawData: any): Promise<AxiosResponse> => apiClient.post('/laws/', lawData),

  // 법률/판례 수정
  updateLaw: (lawId: string, lawData: any): Promise<AxiosResponse> =>
    apiClient.put(`/laws/${lawId}/`, lawData),

  // 법률/판례 삭제
  deleteLaw: (lawId: string): Promise<AxiosResponse> => apiClient.delete(`/laws/${lawId}/`),
}

// 채팅 관련 API
export const chatAPI = {
  // 채팅방 목록 조회
  getChatRooms: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/chat-rooms/', { params }),

  // 채팅방 상세 조회
  getChatRoom: (chatRoomId: string): Promise<AxiosResponse> =>
    apiClient.get(`/chat-rooms/${chatRoomId}/`),

  // 채팅방 생성
  createChatRoom: (chatRoomData: any): Promise<AxiosResponse> =>
    apiClient.post('/chat-rooms/', chatRoomData),

  // 채팅 메시지 목록 조회
  getChatMessages: (params?: ApiParams): Promise<AxiosResponse> =>
    apiClient.get('/chat-messages/', { params }),

  // 채팅 메시지 생성
  createChatMessage: (messageData: any): Promise<AxiosResponse> =>
    apiClient.post('/chat-messages/', messageData),
}

// 댓글 관련 API
export const commentAPI = {
  // 계약 댓글 목록 조회
  getContractComments: (contractId: string): Promise<AxiosResponse> =>
    apiClient.get(`/contract-comments/?contract=${contractId}`),

  // 계약 댓글 생성
  createContractComment: (commentData: any): Promise<AxiosResponse> =>
    apiClient.post('/contract-comments/', commentData),

  // 계약 댓글 수정
  updateContractComment: (commentId: string, commentData: any): Promise<AxiosResponse> =>
    apiClient.put(`/contract-comments/${commentId}/`, commentData),

  // 계약 댓글 삭제
  deleteContractComment: (commentId: string): Promise<AxiosResponse> =>
    apiClient.delete(`/contract-comments/${commentId}/`),
}

// 활동 로그 관련 API
export const activityAPI = {
  // 계약 활동 로그 조회
  getContractActivityLogs: (contractId: string): Promise<AxiosResponse> =>
    apiClient.get(`/contract-activity-logs/?contract=${contractId}`),

  // 활동 로그 생성
  createActivityLog: (logData: any): Promise<AxiosResponse> =>
    apiClient.post('/contract-activity-logs/', logData),
}

export default apiClient
