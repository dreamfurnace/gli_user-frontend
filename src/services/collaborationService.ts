import { useContractStore, type ContractData } from '@/stores/contractStore'

export interface CollaborationMessage {
  type:
    | 'contract_update'
    | 'user_joined'
    | 'user_left'
    | 'typing'
    | 'sync_request'
    | 'sync_response'
  contractId: string
  userId: string
  userName: string
  timestamp: number
  data?: any
}

export interface UserInfo {
  userId: string
  userName: string
  userRole: string
  isOnline: boolean
  lastSeen: Date
}

export interface CollaborationState {
  isConnected: boolean
  participants: Map<string, UserInfo>
  lastSyncTimestamp: number
  pendingChanges: CollaborationMessage[]
  isTyping: Map<string, boolean>
}

class CollaborationService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private contractStore = useContractStore()

  public state: CollaborationState = {
    isConnected: false,
    participants: new Map(),
    lastSyncTimestamp: 0,
    pendingChanges: [],
    isTyping: new Map(),
  }

  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.setupContractStoreWatchers()
  }

  // WebSocket 연결 설정
  public async connect(contractId: string, token: string, userName: string): Promise<void> {
    try {
      const wsUrl = `${process.env.VUE_APP_WS_URL || 'ws://localhost:8080'}`
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.state.isConnected = true
        this.reconnectAttempts = 0

        // 인증 메시지 전송
        this.sendMessage({
          type: 'auth',
          token,
          userAgent: navigator.userAgent,
        })

        // 방 참가
        this.sendMessage({
          type: 'join_room',
          roomId: contractId,
          roomType: 'contract',
          userName,
        })

        // 하트비트 시작
        this.startHeartbeat()

        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data))
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.state.isConnected = false
        this.stopHeartbeat()
        this.emit('disconnected')

        // 자동 재연결
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect(contractId, token, userName)
          }, this.reconnectDelay * this.reconnectAttempts)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      }
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error)
      throw error
    }
  }

  // 연결 해제
  public disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stopHeartbeat()
    this.state.isConnected = false
    this.state.participants.clear()
    this.state.isTyping.clear()
  }

  // 메시지 전송
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  // 계약서 업데이트 전송
  public sendContractUpdate(contractId: string, updates: Partial<ContractData>): void {
    if (!this.state.isConnected) return

    const message: CollaborationMessage = {
      type: 'contract_update',
      contractId,
      userId: this.getCurrentUserId(),
      userName: this.getCurrentUserName(),
      timestamp: Date.now(),
      data: updates,
    }

    this.sendMessage({
      type: 'contract_update',
      contractId,
      updates: JSON.stringify(updates),
      timestamp: message.timestamp,
    })

    // 로컬 상태 업데이트
    this.contractStore.updateContractPartial(updates)
  }

  // 타이핑 상태 전송
  public sendTypingStatus(contractId: string, isTyping: boolean): void {
    if (!this.state.isConnected) return

    this.sendMessage({
      type: 'typing',
      contractId,
      isTyping,
    })
  }

  // 동기화 요청
  public requestSync(contractId: string): void {
    if (!this.state.isConnected) return

    this.sendMessage({
      type: 'sync_request',
      contractId,
      lastSyncTimestamp: this.state.lastSyncTimestamp,
    })
  }

  // 메시지 처리
  private handleMessage(data: any): void {
    switch (data.type) {
      case 'auth_success':
        this.handleAuthSuccess(data.data)
        break
      case 'room_joined':
        this.handleRoomJoined(data.data)
        break
      case 'user_joined':
        this.handleUserJoined(data.data)
        break
      case 'user_left':
        this.handleUserLeft(data.data)
        break
      case 'contract_update':
        this.handleContractUpdate(data)
        break
      case 'typing':
        this.handleTypingUpdate(data)
        break
      case 'sync_response':
        this.handleSyncResponse(data)
        break
      case 'error':
        this.handleError(data.error)
        break
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  // 인증 성공 처리
  private handleAuthSuccess(data: any): void {
    console.log('Authentication successful:', data)
    this.emit('auth_success', data)
  }

  // 방 참가 처리
  private handleRoomJoined(data: any): void {
    console.log('Joined room:', data)
    this.state.participants.clear()

    // 참가자 목록 업데이트
    data.participants.forEach((participant: any) => {
      this.state.participants.set(participant.userId, {
        userId: participant.userId,
        userName: participant.userName || 'Unknown User',
        userRole: participant.userRole || 'user',
        isOnline: true,
        lastSeen: new Date(),
      })
    })

    this.emit('room_joined', data)
  }

  // 사용자 참가 처리
  private handleUserJoined(data: any): void {
    const userInfo: UserInfo = {
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole || 'user',
      isOnline: true,
      lastSeen: new Date(),
    }

    this.state.participants.set(data.userId, userInfo)
    this.emit('user_joined', userInfo)
  }

  // 사용자 퇴장 처리
  private handleUserLeft(data: any): void {
    const userInfo = this.state.participants.get(data.userId)
    if (userInfo) {
      userInfo.isOnline = false
      userInfo.lastSeen = new Date()
      this.state.participants.set(data.userId, userInfo)
    }
    this.emit('user_left', data)
  }

  // 계약서 업데이트 처리
  private handleContractUpdate(data: any): void {
    try {
      const updates = JSON.parse(data.updates)
      const timestamp = data.timestamp

      // 자신이 보낸 업데이트는 무시
      if (data.userId === this.getCurrentUserId()) {
        return
      }

      // 타임스탬프 확인하여 순서 보장
      if (timestamp > this.state.lastSyncTimestamp) {
        this.state.lastSyncTimestamp = timestamp

        // 계약서 스토어 업데이트
        this.contractStore.updateContractPartial(updates)

        this.emit('contract_updated', {
          updates,
          userId: data.userId,
          userName: data.userName,
          timestamp,
        })
      }
    } catch (error) {
      console.error('Failed to parse contract update:', error)
    }
  }

  // 타이핑 상태 업데이트 처리
  private handleTypingUpdate(data: any): void {
    if (data.userId === this.getCurrentUserId()) return

    if (data.isTyping) {
      this.state.isTyping.set(data.userId, true)
      // 3초 후 타이핑 상태 해제
      setTimeout(() => {
        this.state.isTyping.delete(data.userId)
        this.emit('typing_stopped', data.userId)
      }, 3000)
    } else {
      this.state.isTyping.delete(data.userId)
    }

    this.emit('typing_updated', {
      userId: data.userId,
      userName: data.userName,
      isTyping: data.isTyping,
    })
  }

  // 동기화 응답 처리
  private handleSyncResponse(data: any): void {
    try {
      const contractData = JSON.parse(data.contractData)
      const timestamp = data.timestamp

      if (timestamp > this.state.lastSyncTimestamp) {
        this.state.lastSyncTimestamp = timestamp

        // 전체 계약서 데이터 동기화
        this.contractStore.updateContract(data.contractId, contractData)

        this.emit('sync_completed', {
          contractData,
          timestamp,
        })
      }
    } catch (error) {
      console.error('Failed to parse sync response:', error)
    }
  }

  // 에러 처리
  private handleError(error: string): void {
    console.error('Collaboration error:', error)
    this.emit('error', error)
  }

  // 하트비트 시작
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'heartbeat' })
      }
    }, 30000) // 30초마다
  }

  // 하트비트 중지
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 계약서 스토어 감시자 설정
  private setupContractStoreWatchers(): void {
    // 계약서 변경 감지 시 자동 동기화
    this.contractStore.$subscribe((mutation, state) => {
      if (mutation.type === 'direct' && this.state.isConnected) {
        const currentContract = this.contractStore.currentContract
        if (currentContract) {
          // 디바운스된 업데이트 전송
          this.debouncedContractUpdate(currentContract)
        }
      }
    })
  }

  // 디바운스된 계약서 업데이트
  private debouncedContractUpdate = this.debounce((contract: ContractData) => {
    this.sendContractUpdate(contract.basicInfo.id, contract)
  }, 1000)

  // 디바운스 유틸리티
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 이벤트 리스너 관리
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  // 유틸리티 메서드들
  private getCurrentUserId(): string {
    // 실제 구현에서는 인증 스토어에서 가져옴
    return 'current-user-id'
  }

  private getCurrentUserName(): string {
    // 실제 구현에서는 사용자 스토어에서 가져옴
    return 'Current User'
  }

  // 공개 메서드들
  public getParticipants(): UserInfo[] {
    return Array.from(this.state.participants.values())
  }

  public isUserTyping(userId: string): boolean {
    return this.state.isTyping.has(userId)
  }

  public getOnlineParticipants(): UserInfo[] {
    return this.getParticipants().filter((p) => p.isOnline)
  }
}

// 싱글톤 인스턴스 생성
export const collaborationService = new CollaborationService()
