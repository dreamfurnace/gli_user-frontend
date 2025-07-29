<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>{{ roomTitle }}</h3>
      <div class="connection-status" :class="{ connected: isConnected }">
        {{ isConnected ? '연결됨' : '연결 끊김' }}
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message"
        :class="{ 'own-message': message.userId === currentUserId }"
      >
        <div class="message-header">
          <span class="user-name">{{ message.userName || 'Unknown User' }}</span>
          <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">
          <div v-if="message.messageType === 'text'" class="text-message">
            {{ message.message }}
          </div>
          <div v-else-if="message.messageType === 'file'" class="file-message">
            <div class="file-info">
              <i class="file-icon">📎</i>
              <span class="file-name">{{ message.fileName }}</span>
            </div>
            <button @click="downloadFile(message)" class="download-btn">다운로드</button>
          </div>
        </div>
      </div>

      <div v-if="typingUsers.length > 0" class="typing-indicator">
        <span v-for="user in typingUsers" :key="user.userId" class="typing-user">
          {{ user.userName }}이(가) 입력 중...
        </span>
      </div>
    </div>

    <div class="chat-input">
      <div class="input-container">
        <input
          v-model="newMessage"
          @keydown.enter="sendMessage"
          @input="handleTyping"
          placeholder="메시지를 입력하세요..."
          class="message-input"
          :disabled="!isConnected"
        />
        <button
          @click="sendMessage"
          class="send-btn"
          :disabled="!isConnected || !newMessage.trim()"
        >
          전송
        </button>
      </div>

      <div class="file-upload">
        <input
          ref="fileInput"
          type="file"
          @change="handleFileUpload"
          multiple
          class="file-input"
          :disabled="!isConnected"
        />
        <button @click="() => fileInput?.click()" class="upload-btn" :disabled="!isConnected">
          📎 파일 첨부
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { connectWebSocket, getWebSocketService, disconnectWebSocket } from '@/services/websocket'

interface ChatMessage {
  id: string
  userId: string
  userName?: string
  message: string
  messageType: 'text' | 'file'
  fileName?: string
  fileUrl?: string
  timestamp: string
}

interface TypingUser {
  userId: string
  userName: string
  timestamp: string
}

interface Props {
  roomId: string
  roomType: string
  roomTitle: string
}

const props = defineProps<Props>()

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

// 상태
const messages = ref<ChatMessage[]>([])
const newMessage = ref('')
const isConnected = ref(false)
const typingUsers = ref<TypingUser[]>([])
const messagesContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()

// 타이핑 디바운스
let typingTimeout: NodeJS.Timeout | null = null

// 웹소켓 연결
onMounted(async () => {
  try {
    const wsService = await connectWebSocket({
      onOpen: () => {
        isConnected.value = true
        // 방 참가
        wsService.joinRoom(props.roomId, props.roomType, authStore.user?.name)
      },
      onMessage: handleWebSocketMessage,
      onClose: () => {
        isConnected.value = false
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        isConnected.value = false
      },
    })
  } catch (error) {
    console.error('Failed to connect WebSocket:', error)
  }
})

// 컴포넌트 언마운트 시 연결 해제
onUnmounted(() => {
  const wsService = getWebSocketService()
  if (wsService) {
    wsService.leaveRoom(props.roomId, props.roomType)
  }
  disconnectWebSocket()
})

// 웹소켓 메시지 처리
const handleWebSocketMessage = (message: any) => {
  switch (message.type) {
    case 'chat_message':
      messages.value.push(message.data)
      scrollToBottom()
      break
    case 'user_joined':
      addSystemMessage(`${message.data.userName}님이 입장했습니다.`)
      break
    case 'user_left':
      addSystemMessage(`${message.data.userName}님이 퇴장했습니다.`)
      break
    case 'typing':
      handleTypingUpdate(message.data)
      break
    case 'room_joined':
      console.log('Joined room:', message.data)
      break
    case 'error':
      console.error('WebSocket error:', message.data.message)
      break
  }
}

// 시스템 메시지 추가
const addSystemMessage = (text: string) => {
  messages.value.push({
    id: Date.now().toString(),
    userId: 'system',
    message: text,
    messageType: 'text',
    timestamp: new Date().toISOString(),
  })
  scrollToBottom()
}

// 타이핑 상태 업데이트
const handleTypingUpdate = (data: any) => {
  const { userId, userName, isTyping, timestamp } = data

  if (isTyping) {
    // 기존 타이핑 사용자 제거
    typingUsers.value = typingUsers.value.filter((user) => user.userId !== userId)

    // 새로운 타이핑 사용자 추가
    typingUsers.value.push({
      userId,
      userName: userName || 'Unknown User',
      timestamp,
    })

    // 3초 후 타이핑 상태 제거
    setTimeout(() => {
      typingUsers.value = typingUsers.value.filter((user) => user.userId !== userId)
    }, 3000)
  } else {
    typingUsers.value = typingUsers.value.filter((user) => user.userId !== userId)
  }
}

// 메시지 전송
const sendMessage = () => {
  if (!newMessage.value.trim() || !isConnected.value) return

  const wsService = getWebSocketService()
  if (wsService) {
    wsService.sendChatMessage(props.roomId, props.roomType, newMessage.value.trim())
    newMessage.value = ''

    // 타이핑 상태 해제
    wsService.sendTyping(props.roomId, props.roomType, false)
  }
}

// 타이핑 처리
const handleTyping = () => {
  const wsService = getWebSocketService()
  if (wsService) {
    wsService.sendTyping(props.roomId, props.roomType, true)

    // 타이핑 타임아웃 리셋
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    typingTimeout = setTimeout(() => {
      wsService.sendTyping(props.roomId, props.roomType, false)
    }, 1000)
  }
}

// 파일 업로드 처리
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  Array.from(files).forEach((file) => {
    // 실제 구현에서는 파일을 서버에 업로드하고 URL을 받아야 함
    const fileMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId.value || '',
      message: '파일이 업로드되었습니다.',
      messageType: 'file',
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
    }

    messages.value.push(fileMessage)

    // 웹소켓으로 파일 업로드 알림 전송
    const wsService = getWebSocketService()
    if (wsService) {
      wsService.sendDocumentUpload(props.roomId, props.roomType, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })
    }
  })

  // 파일 입력 초기화
  target.value = ''
  scrollToBottom()
}

// 파일 다운로드
const downloadFile = (message: ChatMessage) => {
  if (message.fileUrl) {
    const link = document.createElement('a')
    link.href = message.fileUrl
    link.download = message.fileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// 스크롤을 맨 아래로
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 시간 포맷팅
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.connection-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: #dc3545;
  color: white;
}

.connection-status.connected {
  background: #28a745;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: 400px;
}

.message {
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9fa;
  max-width: 80%;
}

.message.own-message {
  margin-left: auto;
  background: #007bff;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.user-name {
  font-weight: 600;
}

.timestamp {
  opacity: 0.7;
}

.message-content {
  word-break: break-word;
}

.file-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 16px;
}

.file-name {
  font-size: 14px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.download-btn {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
}

.download-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.typing-indicator {
  font-size: 12px;
  color: #666;
  font-style: italic;
  padding: 8px 0;
}

.typing-user {
  margin-right: 8px;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.input-container {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.message-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
}

.send-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.file-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.upload-btn {
  padding: 6px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.upload-btn:hover:not(:disabled) {
  background: #545b62;
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
