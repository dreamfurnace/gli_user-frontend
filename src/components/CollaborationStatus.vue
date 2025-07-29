<template>
  <div class="collaboration-status">
    <!-- 연결 상태 -->
    <div class="connection-status" :class="{ connected: collaborationState.isConnected }">
      <div class="status-indicator">
        <i v-if="collaborationState.isConnected" class="fas fa-wifi"></i>
        <i v-else class="fas fa-wifi-slash"></i>
      </div>
      <span class="status-text">
        {{ collaborationState.isConnected ? '연결됨' : '연결 해제됨' }}
      </span>
    </div>

    <!-- 온라인 사용자 -->
    <div class="online-users">
      <div class="users-header">
        <i class="fas fa-users"></i>
        <span>온라인 사용자 ({{ onlineUsers.length }})</span>
      </div>

      <div class="users-list">
        <div
          v-for="user in onlineUsers"
          :key="user.id"
          class="user-item"
          :class="{ current: user.id === collaborationState.currentUser?.id }"
        >
          <div class="user-avatar">
            <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
            <div v-else class="avatar-placeholder">
              {{ user.name.charAt(0) }}
            </div>
          </div>

          <div class="user-info">
            <div class="user-name">
              {{ user.name }}
              <span v-if="user.id === collaborationState.currentUser?.id" class="current-badge">
                나
              </span>
            </div>
            <div class="user-section" v-if="user.currentSection">
              {{ user.currentSection }} 편집 중
            </div>
          </div>

          <div class="user-status">
            <div class="online-indicator"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 충돌 알림 -->
    <div v-if="collaborationState.conflicts.length > 0" class="conflicts-section">
      <div class="conflicts-header">
        <i class="fas fa-exclamation-triangle"></i>
        <span>충돌 해결됨 ({{ collaborationState.conflicts.length }})</span>
        <button @click="clearConflicts" class="clear-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="conflicts-list">
        <div v-for="(conflict, index) in recentConflicts" :key="index" class="conflict-item">
          <div class="conflict-info">
            <div class="conflict-field">{{ conflict.field }}</div>
            <div class="conflict-resolver">{{ conflict.resolvedBy }}님이 해결</div>
            <div class="conflict-time">
              {{ formatTime(conflict.timestamp) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 동기화 상태 -->
    <div class="sync-status">
      <div class="sync-info">
        <i class="fas fa-sync-alt"></i>
        <span>마지막 동기화</span>
      </div>
      <div class="sync-time">
        {{ collaborationState.lastSyncTime ? formatTime(collaborationState.lastSyncTime) : '없음' }}
      </div>
    </div>

    <!-- 이벤트 히스토리 (개발용) -->
    <div v-if="showEventHistory" class="event-history">
      <div class="history-header">
        <h4>이벤트 히스토리</h4>
        <button @click="showEventHistory = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="history-list">
        <div
          v-for="event in collaborationState.eventHistory.slice(-10)"
          :key="event.id"
          class="event-item"
        >
          <div class="event-type">{{ event.type }}</div>
          <div class="event-user">{{ event.userId }}</div>
          <div class="event-time">{{ formatTime(event.timestamp) }}</div>
        </div>
      </div>
    </div>

    <!-- 개발자 도구 버튼 -->
    <button @click="toggleEventHistory" class="dev-tools-btn" title="이벤트 히스토리 보기">
      <i class="fas fa-code"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCollaboration, type CollaborationState } from '@/services/collaborationService'

const props = defineProps<{
  contractId?: string
}>()

const collaborationService = useCollaboration()
const collaborationState = ref<CollaborationState>({
  isConnected: false,
  users: new Map(),
  currentUser: null,
  contractId: null,
  lastSyncTime: null,
  pendingChanges: false,
  conflicts: [],
  eventHistory: [],
})

const showEventHistory = ref(false)

const onlineUsers = computed(() => {
  return Array.from(collaborationState.value.users.values()).filter((user) => user.isOnline)
})

const recentConflicts = computed(() => {
  return collaborationState.value.conflicts.slice(-5) // 최근 5개만 표시
})

const formatTime = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) {
    // 1분 미만
    return '방금 전'
  } else if (diff < 3600000) {
    // 1시간 미만
    return `${Math.floor(diff / 60000)}분 전`
  } else if (diff < 86400000) {
    // 1일 미만
    return `${Math.floor(diff / 3600000)}시간 전`
  } else {
    return date.toLocaleDateString('ko-KR')
  }
}

const clearConflicts = () => {
  collaborationService.clearConflicts()
}

const toggleEventHistory = () => {
  showEventHistory.value = !showEventHistory.value
}

onMounted(() => {
  // 협업 상태 구독
  const stateRef = collaborationService.getState()
  collaborationState.value = stateRef.value

  // 상태 변경 감지
  const unwatch = watch(stateRef, (newState) => {
    collaborationState.value = newState
  })

  onUnmounted(() => {
    unwatch()
  })
})
</script>

<style scoped>
.collaboration-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  max-width: 300px;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.connection-status.connected {
  border-color: #28a745;
  background: #d4edda;
}

.status-indicator {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-indicator i {
  font-size: 14px;
  color: #6c757d;
}

.connection-status.connected .status-indicator i {
  color: #28a745;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.online-users {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.users-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 500;
}

.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.2s;
}

.user-item:hover {
  background: #f8f9fa;
}

.user-item.current {
  background: #e3f2fd;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-badge {
  background: #007bff;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
}

.user-section {
  font-size: 12px;
  color: #6c757d;
}

.user-status {
  display: flex;
  align-items: center;
}

.online-indicator {
  width: 8px;
  height: 8px;
  background: #28a745;
  border-radius: 50%;
}

.conflicts-section {
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ffc107;
  overflow: hidden;
}

.conflicts-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  font-weight: 500;
  color: #856404;
}

.clear-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #856404;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.clear-btn:hover {
  background: #ffeaa7;
}

.conflicts-list {
  max-height: 150px;
  overflow-y: auto;
}

.conflict-item {
  padding: 12px;
  border-bottom: 1px solid #f8f9fa;
}

.conflict-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conflict-field {
  font-weight: 500;
  font-size: 14px;
}

.conflict-resolver {
  font-size: 12px;
  color: #6c757d;
}

.conflict-time {
  font-size: 11px;
  color: #adb5bd;
}

.sync-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.sync-time {
  font-size: 12px;
  color: #6c757d;
}

.event-history {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.history-header h4 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #6c757d;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f8f9fa;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 12px;
}

.event-type {
  font-weight: 500;
  color: #007bff;
}

.event-user {
  color: #6c757d;
}

.event-time {
  color: #adb5bd;
}

.dev-tools-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.dev-tools-btn:hover {
  background: #545b62;
}
</style>
