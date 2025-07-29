import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { collaborationService, type UserInfo } from '@/services/collaborationService'
import { useAuthStore } from '@/stores/auth'

export function useCollaboration(contractId: string) {
  const authStore = useAuthStore()

  // 반응형 상태
  const isConnected = ref(false)
  const participants = ref<UserInfo[]>([])
  const isTyping = ref<Map<string, boolean>>(new Map())
  const lastSyncTimestamp = ref(0)
  const connectionError = ref<string | null>(null)

  // 계산된 속성
  const onlineParticipants = computed(() => participants.value.filter((p) => p.isOnline))

  const typingParticipants = computed(() =>
    participants.value.filter((p) => isTyping.value.get(p.userId)),
  )

  const participantCount = computed(() => onlineParticipants.value.length)

  // 연결 상태 관리
  const connect = async () => {
    try {
      connectionError.value = null

      const token = authStore.accessToken
      const userName = authStore.user?.name || 'Unknown User'

      if (!token) {
        throw new Error('인증 토큰이 필요합니다.')
      }

      await collaborationService.connect(contractId, token, userName)

      // 이벤트 리스너 등록
      setupEventListeners()
    } catch (error) {
      connectionError.value = error instanceof Error ? error.message : '연결 실패'
      console.error('Collaboration connection failed:', error)
    }
  }

  const disconnect = () => {
    collaborationService.disconnect()
    isConnected.value = false
    participants.value = []
    isTyping.value.clear()
  }

  // 이벤트 리스너 설정
  const setupEventListeners = () => {
    collaborationService.on('connected', () => {
      isConnected.value = true
      connectionError.value = null
    })

    collaborationService.on('disconnected', () => {
      isConnected.value = false
    })

    collaborationService.on('room_joined', (data: any) => {
      participants.value = collaborationService.getParticipants()
    })

    collaborationService.on('user_joined', (userInfo: UserInfo) => {
      participants.value = collaborationService.getParticipants()
    })

    collaborationService.on('user_left', (data: any) => {
      participants.value = collaborationService.getParticipants()
    })

    collaborationService.on('contract_updated', (data: any) => {
      lastSyncTimestamp.value = data.timestamp
      // 계약서 업데이트 알림 (선택적)
      console.log(`${data.userName}님이 계약서를 업데이트했습니다.`)
    })

    collaborationService.on('typing_updated', (data: any) => {
      if (data.isTyping) {
        isTyping.value.set(data.userId, true)
      } else {
        isTyping.value.delete(data.userId)
      }
    })

    collaborationService.on('typing_stopped', (userId: string) => {
      isTyping.value.delete(userId)
    })

    collaborationService.on('sync_completed', (data: any) => {
      lastSyncTimestamp.value = data.timestamp
      console.log('계약서 동기화가 완료되었습니다.')
    })

    collaborationService.on('error', (error: string) => {
      connectionError.value = error
      console.error('Collaboration error:', error)
    })
  }

  // 타이핑 상태 전송
  const sendTypingStatus = (isTyping: boolean) => {
    if (isConnected.value) {
      collaborationService.sendTypingStatus(contractId, isTyping)
    }
  }

  // 동기화 요청
  const requestSync = () => {
    if (isConnected.value) {
      collaborationService.requestSync(contractId)
    }
  }

  // 계약서 업데이트 전송
  const sendContractUpdate = (updates: any) => {
    if (isConnected.value) {
      collaborationService.sendContractUpdate(contractId, updates)
    }
  }

  // 특정 사용자가 타이핑 중인지 확인
  const isUserTyping = (userId: string): boolean => {
    return isTyping.value.get(userId) || false
  }

  // 특정 사용자 정보 가져오기
  const getParticipant = (userId: string): UserInfo | undefined => {
    return participants.value.find((p) => p.userId === userId)
  }

  // 컴포넌트 마운트 시 자동 연결
  onMounted(() => {
    connect()
  })

  // 컴포넌트 언마운트 시 연결 해제
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 상태
    isConnected: readonly(isConnected),
    participants: readonly(participants),
    isTyping: readonly(isTyping),
    lastSyncTimestamp: readonly(lastSyncTimestamp),
    connectionError: readonly(connectionError),

    // 계산된 속성
    onlineParticipants,
    typingParticipants,
    participantCount,

    // 메서드
    connect,
    disconnect,
    sendTypingStatus,
    requestSync,
    sendContractUpdate,
    isUserTyping,
    getParticipant,
  }
}
