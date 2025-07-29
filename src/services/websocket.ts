import { useAuthStore } from '@/stores/auth'

interface WebSocketMessage {
  type: string
  data: any
}

interface WebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
  onOpen?: (event: Event) => void
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private messageQueue: WebSocketMessage[] = []
  private options: WebSocketOptions = {}

  private wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'

  constructor(options: WebSocketOptions = {}) {
    this.options = options
  }

  // 연결 시작
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'))
        return
      }

      this.isConnecting = true

      try {
        this.ws = new WebSocket(this.wsUrl)

        this.ws.onopen = (event) => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.options.onOpen?.(event)

          // 인증 메시지 전송
          this.authenticate()

          // 큐에 있는 메시지들 전송
          this.flushMessageQueue()

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.options.onMessage?.(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
          }
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.isConnecting = false
          this.options.onError?.(error)
          reject(error)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.options.onClose?.(event)

          // 자동 재연결 시도
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          }
        }
      } catch (error) {
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // 연결 해제
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
  }

  // 인증
  private authenticate(): void {
    const authStore = useAuthStore()
    const token = authStore.accessToken

    if (token) {
      this.send({
        type: 'auth',
        data: {
          token,
          userAgent: navigator.userAgent,
        },
      })
    }
  }

  // 메시지 전송
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // 연결이 안 되어 있으면 큐에 추가
      this.messageQueue.push(message)
    }
  }

  // 큐에 있는 메시지들 전송
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.ws?.send(JSON.stringify(message))
      }
    }
  }

  // 재연결 스케줄링
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.connect().catch((error) => {
          console.error('Reconnect failed:', error)
        })
      }
    }, delay)
  }

  // 방 참가
  joinRoom(roomId: string, roomType: string, userName?: string): void {
    this.send({
      type: 'join_room',
      data: {
        roomId,
        roomType,
        userName,
      },
    })
  }

  // 방 나가기
  leaveRoom(roomId: string, roomType: string): void {
    this.send({
      type: 'leave_room',
      data: {
        roomId,
        roomType,
      },
    })
  }

  // 채팅 메시지 전송
  sendChatMessage(
    roomId: string,
    roomType: string,
    message: string,
    messageType: string = 'text',
  ): void {
    this.send({
      type: 'chat_message',
      data: {
        roomId,
        roomType,
        message,
        messageType,
      },
    })
  }

  // 계약 업데이트 알림
  sendContractUpdate(contractId: string, updateType: string, updateData: any): void {
    this.send({
      type: 'contract_update',
      data: {
        contractId,
        updateType,
        updateData,
      },
    })
  }

  // 문서 업로드 알림
  sendDocumentUpload(roomId: string, roomType: string, documentData: any): void {
    this.send({
      type: 'document_upload',
      data: {
        roomId,
        roomType,
        documentData,
      },
    })
  }

  // 타이핑 상태 전송
  sendTyping(roomId: string, roomType: string, isTyping: boolean): void {
    this.send({
      type: 'typing',
      data: {
        roomId,
        roomType,
        isTyping,
      },
    })
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // 연결 상태 가져오기
  getConnectionState(): number {
    return this.ws?.readyState || WebSocket.CLOSED
  }
}

// 싱글톤 인스턴스
let wsService: WebSocketService | null = null

// 웹소켓 서비스 초기화
export function initWebSocketService(options: WebSocketOptions = {}): WebSocketService {
  if (!wsService) {
    wsService = new WebSocketService(options)
  }
  return wsService
}

// 웹소켓 서비스 가져오기
export function getWebSocketService(): WebSocketService | null {
  return wsService
}

// 웹소켓 서비스 연결
export async function connectWebSocket(options: WebSocketOptions = {}): Promise<WebSocketService> {
  const service = initWebSocketService(options)
  await service.connect()
  return service
}

// 웹소켓 서비스 연결 해제
export function disconnectWebSocket(): void {
  if (wsService) {
    wsService.disconnect()
    wsService = null
  }
}

export default WebSocketService
