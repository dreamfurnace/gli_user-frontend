<template>
  <div class="auto-save-status">
    <div class="status-indicator" :class="statusClass">
      <div class="status-icon">
        <i v-if="saveStatus.isSaving" class="fas fa-spinner fa-spin"></i>
        <i v-else-if="saveStatus.lastError" class="fas fa-exclamation-triangle"></i>
        <i v-else-if="saveStatus.lastSaved" class="fas fa-check-circle"></i>
        <i v-else class="fas fa-clock"></i>
      </div>

      <div class="status-text">
        <span v-if="saveStatus.isSaving">저장 중...</span>
        <span v-else-if="saveStatus.lastError" class="error-text">
          저장 실패: {{ saveStatus.lastError }}
        </span>
        <span v-else-if="saveStatus.lastSaved" class="success-text">
          마지막 저장: {{ formatTime(saveStatus.lastSaved) }}
        </span>
        <span v-else-if="saveStatus.pendingChanges" class="pending-text">
          변경사항 대기 중...
        </span>
        <span v-else>저장됨</span>
      </div>

      <div v-if="saveStatus.pendingChanges && !saveStatus.isSaving" class="pending-indicator">
        <div class="pulse-dot"></div>
      </div>
    </div>

    <div class="save-stats">
      <span class="stat-item">
        <i class="fas fa-save"></i>
        {{ saveStatus.saveCount }}회 저장
      </span>

      <button
        v-if="saveStatus.pendingChanges && !saveStatus.isSaving"
        @click="forceSave"
        class="force-save-btn"
        :disabled="saveStatus.isSaving"
      >
        <i class="fas fa-save"></i>
        강제 저장
      </button>
    </div>

    <!-- 백업 히스토리 모달 -->
    <div v-if="showHistory" class="backup-history-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>백업 히스토리</h3>
          <button @click="showHistory = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="history-list">
          <div
            v-for="(backup, index) in backupHistory"
            :key="index"
            class="history-item"
            @click="restoreFromBackup(backup)"
          >
            <div class="backup-info">
              <div class="backup-time">{{ formatTime(new Date(backup.timestamp)) }}</div>
              <div class="backup-title">{{ backup.contract.basicInfo.title }}</div>
            </div>
            <button class="restore-btn">
              <i class="fas fa-undo"></i>
              복원
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 백업 히스토리 버튼 -->
    <button @click="showBackupHistory" class="history-btn" title="백업 히스토리 보기">
      <i class="fas fa-history"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAutoSave, type SaveStatus } from '@/services/autoSaveService'
import { useContractStore } from '@/stores/contractStore'

const props = defineProps<{
  contractId?: string
}>()

const contractStore = useContractStore()
const autoSaveService = useAutoSave()

const saveStatus = ref<SaveStatus>({
  isSaving: false,
  lastSaved: null,
  lastError: null,
  saveCount: 0,
  pendingChanges: false,
})

const showHistory = ref(false)
const backupHistory = ref<Array<{ contract: any; timestamp: string }>>([])

const statusClass = computed(() => ({
  saving: saveStatus.value.isSaving,
  error: saveStatus.value.lastError,
  success: saveStatus.value.lastSaved && !saveStatus.value.pendingChanges,
  pending: saveStatus.value.pendingChanges && !saveStatus.value.isSaving,
}))

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

const forceSave = async () => {
  try {
    await autoSaveService.forceSave()
  } catch (error) {
    console.error('강제 저장 실패:', error)
  }
}

const showBackupHistory = () => {
  if (props.contractId) {
    backupHistory.value = autoSaveService.getBackupHistory(props.contractId)
    showHistory.value = true
  }
}

const restoreFromBackup = async (backup: { contract: any; timestamp: string }) => {
  try {
    const restored = await autoSaveService.restoreFromBackup(backup.contract.basicInfo.id)
    if (restored) {
      contractStore.updateContract(restored.basicInfo.id, restored)
      showHistory.value = false
      console.log('백업에서 복원 완료')
    }
  } catch (error) {
    console.error('백업 복원 실패:', error)
  }
}

onMounted(() => {
  // 자동 저장 상태 구독
  const statusRef = autoSaveService.getSaveStatus()
  saveStatus.value = statusRef.value

  // 상태 변경 감지
  const unwatch = watch(statusRef, (newStatus) => {
    saveStatus.value = newStatus
  })

  onUnmounted(() => {
    unwatch()
  })
})
</script>

<style scoped>
.auto-save-status {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-size: 14px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.status-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-icon i {
  font-size: 14px;
}

.status-text {
  flex: 1;
  white-space: nowrap;
}

.error-text {
  color: #dc3545;
}

.success-text {
  color: #28a745;
}

.pending-text {
  color: #ffc107;
}

.pending-indicator {
  position: relative;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #ffc107;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.save-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #6c757d;
  font-size: 12px;
}

.force-save-btn {
  padding: 4px 8px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.force-save-btn:hover {
  background: #0056b3;
}

.force-save-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.history-btn {
  padding: 4px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.history-btn:hover {
  background: #545b62;
}

/* 모달 스타일 */
.backup-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
}

.close-btn:hover {
  color: #343a40;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: #f8f9fa;
}

.backup-info {
  flex: 1;
}

.backup-time {
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.backup-title {
  font-weight: 500;
}

.restore-btn {
  padding: 4px 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.restore-btn:hover {
  background: #218838;
}
</style>
