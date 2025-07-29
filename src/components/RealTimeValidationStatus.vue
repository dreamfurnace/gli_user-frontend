<template>
  <div class="real-time-validation-status">
    <!-- 실시간 상태 표시 -->
    <div class="status-header">
      <div class="status-indicator" :class="getOverallStatusClass()">
        <div class="status-dot"></div>
        <span class="status-text">{{ getOverallStatusText() }}</span>
      </div>
      <div class="last-update">
        <span class="update-label">마지막 업데이트:</span>
        <span class="update-time">{{ formatLastUpdate() }}</span>
      </div>
    </div>

    <!-- 완성도 진행률 -->
    <div class="completion-section">
      <div class="completion-header">
        <h4 class="section-title">계약서 완성도</h4>
        <span class="completion-percentage">{{ validationResult.completionRate.toFixed(1) }}%</span>
      </div>
      <div class="completion-bar">
        <div
          class="completion-fill"
          :class="getCompletionBarClass()"
          :style="{ width: `${validationResult.completionRate}%` }"
        ></div>
      </div>
      <div class="completion-details">
        <span class="detail-text"
          >필수 항목 {{ validationResult.missingFields.length }}개 누락</span
        >
        <span class="detail-text">동의 {{ validationResult.missingAgreements.length }}개 대기</span>
      </div>
    </div>

    <!-- 실시간 오류 목록 -->
    <div v-if="validationResult.errors.length > 0" class="errors-section">
      <h4 class="section-title">검증 오류</h4>
      <div class="errors-list">
        <div
          v-for="(error, index) in validationResult.errors"
          :key="index"
          class="error-item"
          :class="getErrorSeverityClass(error.severity)"
        >
          <div class="error-icon">
            <svg
              v-if="error.severity === 'error'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="error-content">
            <p class="error-message">{{ error.message }}</p>
            <p v-if="error.participantId" class="error-participant">
              참여자: {{ getParticipantName(error.participantId) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 경고 목록 -->
    <div v-if="validationResult.warnings.length > 0" class="warnings-section">
      <h4 class="section-title">검증 경고</h4>
      <div class="warnings-list">
        <div
          v-for="(warning, index) in validationResult.warnings"
          :key="index"
          class="warning-item"
        >
          <div class="warning-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="warning-content">
            <p class="warning-message">{{ warning.message }}</p>
            <p class="warning-suggestion">{{ warning.suggestion }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 참여자 상태 -->
    <div class="participants-section">
      <h4 class="section-title">참여자 상태</h4>
      <div class="participants-grid">
        <div
          v-for="participant in validationResult.participantStatus"
          :key="participant.id"
          class="participant-status-item"
          :class="getParticipantStatusClass(participant.agreementStatus)"
        >
          <div class="participant-info">
            <span class="participant-name">{{ participant.name }}</span>
            <span class="participant-type">{{ participant.type === 'human' ? '인간' : 'AI' }}</span>
          </div>
          <div class="participant-status">
            <div
              class="status-dot"
              :class="getParticipantStatusDotClass(participant.agreementStatus)"
            ></div>
            <span class="status-text">{{
              getParticipantStatusText(participant.agreementStatus)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 업데이트 로그 -->
    <div v-if="showUpdateLog" class="update-log-section">
      <h4 class="section-title">업데이트 로그</h4>
      <div class="update-log">
        <div
          v-for="(log, index) in updateLogs"
          :key="index"
          class="log-item"
          :class="getLogTypeClass(log.type)"
        >
          <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 자동 새로고침 상태 -->
    <div class="auto-refresh-status">
      <div class="refresh-indicator" :class="{ active: isAutoRefreshing }">
        <div class="refresh-dot"></div>
        <span class="refresh-text">
          {{ isAutoRefreshing ? '실시간 업데이트 중' : '수동 모드' }}
        </span>
      </div>
      <button
        @click="toggleAutoRefresh"
        type="button"
        class="refresh-toggle-button"
        :class="{ active: isAutoRefreshing }"
      >
        {{ isAutoRefreshing ? '자동 새로고침 중지' : '자동 새로고침 시작' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  contractValidationService,
  type ValidationResult,
} from '@/services/ContractValidationService'

// Props 정의
interface Props {
  showUpdateLog?: boolean
  autoRefreshInterval?: number
  enableAutoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUpdateLog: false,
  autoRefreshInterval: 3000,
  enableAutoRefresh: true,
})

// Emits 정의
const emit = defineEmits<{
  'status-change': [result: ValidationResult]
  'validation-complete': []
  'validation-error': [errors: any[]]
}>()

// 반응형 상태
const isAutoRefreshing = ref(props.enableAutoRefresh)
const lastUpdateTime = ref(new Date())
const updateLogs = ref<
  Array<{
    timestamp: Date
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
  }>
>([])

let refreshTimer: NodeJS.Timeout | null = null

// 계산된 속성
const validationResult = computed(() => contractValidationService.validationResult.value)

// 메서드들
const getOverallStatusClass = () => {
  if (validationResult.value.isValid) return 'status-valid'
  if (validationResult.value.errors.some((e) => e.severity === 'error')) return 'status-error'
  return 'status-warning'
}

const getOverallStatusText = () => {
  if (validationResult.value.isValid) return '검증 완료'
  if (validationResult.value.errors.some((e) => e.severity === 'error')) return '검증 오류'
  return '검증 경고'
}

const formatLastUpdate = () => {
  const now = new Date()
  const diff = now.getTime() - lastUpdateTime.value.getTime()
  const seconds = Math.floor(diff / 1000)

  if (seconds < 1) return '방금 전'
  if (seconds < 60) return `${seconds}초 전`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  return `${hours}시간 전`
}

const getCompletionBarClass = () => {
  const rate = validationResult.value.completionRate
  if (rate >= 90) return 'completion-excellent'
  if (rate >= 70) return 'completion-good'
  if (rate >= 50) return 'completion-fair'
  return 'completion-poor'
}

const getErrorSeverityClass = (severity: 'error' | 'warning') => {
  return severity === 'error' ? 'error-critical' : 'error-warning'
}

const getParticipantName = (participantId: string) => {
  const participant = validationResult.value.participantStatus.find((p) => p.id === participantId)
  return participant ? participant.name : '알 수 없음'
}

const getParticipantStatusClass = (status: 'pending' | 'completed' | 'not_required') => {
  switch (status) {
    case 'completed':
      return 'status-completed'
    case 'pending':
      return 'status-pending'
    case 'not_required':
      return 'status-not-required'
    default:
      return ''
  }
}

const getParticipantStatusDotClass = (status: 'pending' | 'completed' | 'not_required') => {
  switch (status) {
    case 'completed':
      return 'dot-completed'
    case 'pending':
      return 'dot-pending'
    case 'not_required':
      return 'dot-not-required'
    default:
      return ''
  }
}

const getParticipantStatusText = (status: 'pending' | 'completed' | 'not_required') => {
  switch (status) {
    case 'completed':
      return '완료'
    case 'pending':
      return '대기'
    case 'not_required':
      return '불필요'
    default:
      return '알 수 없음'
  }
}

const getLogTypeClass = (type: 'info' | 'warning' | 'error' | 'success') => {
  return `log-${type}`
}

const formatLogTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const addUpdateLog = (message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
  updateLogs.value.unshift({
    timestamp: new Date(),
    message,
    type,
  })

  // 로그 개수 제한
  if (updateLogs.value.length > 50) {
    updateLogs.value = updateLogs.value.slice(0, 50)
  }
}

const toggleAutoRefresh = () => {
  isAutoRefreshing.value = !isAutoRefreshing.value

  if (isAutoRefreshing.value) {
    startAutoRefresh()
    addUpdateLog('자동 새로고침이 시작되었습니다.', 'info')
  } else {
    stopAutoRefresh()
    addUpdateLog('자동 새로고침이 중지되었습니다.', 'warning')
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) return

  refreshTimer = setInterval(() => {
    updateValidationStatus()
  }, props.autoRefreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const updateValidationStatus = () => {
  const previousResult = { ...validationResult.value }

  // 검증 상태 업데이트 (실제로는 서비스에서 자동으로 처리됨)
  lastUpdateTime.value = new Date()

  // 변경사항 감지
  const hasChanges = JSON.stringify(previousResult) !== JSON.stringify(validationResult.value)

  if (hasChanges) {
    addUpdateLog('검증 상태가 업데이트되었습니다.', 'info')
    emit('status-change', validationResult.value)

    // 검증 완료 시 이벤트 발생
    if (validationResult.value.isValid && !previousResult.isValid) {
      addUpdateLog('모든 검증 조건이 충족되었습니다!', 'success')
      emit('validation-complete')
    }

    // 오류 발생 시 이벤트 발생
    if (validationResult.value.errors.length > 0 && previousResult.errors.length === 0) {
      addUpdateLog('검증 오류가 발견되었습니다.', 'error')
      emit('validation-error', validationResult.value.errors)
    }
  }
}

// 감시자
watch(
  () => validationResult.value,
  (newResult, oldResult) => {
    if (oldResult && JSON.stringify(newResult) !== JSON.stringify(oldResult)) {
      updateValidationStatus()
    }
  },
  { deep: true },
)

// 생명주기 훅
onMounted(() => {
  if (props.enableAutoRefresh) {
    startAutoRefresh()
  }

  addUpdateLog('실시간 검증 모니터링이 시작되었습니다.', 'info')
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.real-time-validation-status {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.status-valid .status-dot {
  background: #48bb78;
}

.status-indicator.status-warning .status-dot {
  background: #ed8936;
}

.status-indicator.status-error .status-dot {
  background: #f56565;
}

.status-text {
  font-size: 14px;
  font-weight: 600;
}

.status-indicator.status-valid .status-text {
  color: #48bb78;
}

.status-indicator.status-warning .status-text {
  color: #ed8936;
}

.status-indicator.status-error .status-text {
  color: #f56565;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 5px;
}

.update-label {
  font-size: 12px;
  color: #a0aec0;
}

.update-time {
  font-size: 12px;
  color: #718096;
}

.completion-section {
  margin-bottom: 20px;
}

.completion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.completion-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
}

.completion-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.completion-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.completion-fill.completion-excellent {
  background: linear-gradient(90deg, #48bb78, #38a169);
}

.completion-fill.completion-good {
  background: linear-gradient(90deg, #4299e1, #3182ce);
}

.completion-fill.completion-fair {
  background: linear-gradient(90deg, #ed8936, #dd6b20);
}

.completion-fill.completion-poor {
  background: linear-gradient(90deg, #f56565, #e53e3e);
}

.completion-details {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #718096;
}

.errors-section,
.warnings-section {
  margin-bottom: 20px;
}

.errors-list,
.warnings-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-item,
.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid;
}

.error-item.error-critical {
  background: #fed7d7;
  border-left-color: #f56565;
}

.error-item.error-warning {
  background: #fef5e7;
  border-left-color: #ed8936;
}

.warning-item {
  background: #fef5e7;
  border-left-color: #ed8936;
}

.error-icon,
.warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.error-item.error-critical .error-icon {
  color: #f56565;
}

.error-item.error-warning .error-icon {
  color: #ed8936;
}

.warning-icon {
  color: #ed8936;
}

.error-content,
.warning-content {
  flex: 1;
}

.error-message,
.warning-message {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 4px 0;
}

.error-item.error-critical .error-message {
  color: #c53030;
}

.error-item.error-warning .error-message {
  color: #c05621;
}

.warning-message {
  color: #c05621;
}

.error-participant {
  font-size: 12px;
  color: #718096;
  margin: 0;
}

.warning-suggestion {
  font-size: 12px;
  color: #744210;
  margin: 0;
}

.participants-section {
  margin-bottom: 20px;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.participant-status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 6px;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
}

.participant-status-item.status-completed {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.participant-status-item.status-pending {
  background: #fffaf0;
  border-color: #fbd38d;
}

.participant-status-item.status-not-required {
  background: #f7fafc;
  border-color: #cbd5e0;
  opacity: 0.7;
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
}

.participant-type {
  font-size: 11px;
  color: #718096;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.dot-completed {
  background: #48bb78;
}

.status-dot.dot-pending {
  background: #ed8936;
}

.status-dot.dot-not-required {
  background: #a0aec0;
}

.participant-status .status-text {
  font-size: 12px;
  font-weight: 500;
}

.update-log-section {
  margin-bottom: 20px;
}

.update-log {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
  background: #f7fafc;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 12px;
}

.log-time {
  color: #718096;
  font-family: monospace;
  min-width: 80px;
}

.log-message {
  color: #4a5568;
}

.log-item.log-info .log-message {
  color: #3182ce;
}

.log-item.log-warning .log-message {
  color: #ed8936;
}

.log-item.log-error .log-message {
  color: #f56565;
}

.log-item.log-success .log-message {
  color: #48bb78;
}

.auto-refresh-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #a0aec0;
}

.refresh-indicator.active .refresh-dot {
  background: #48bb78;
  animation: pulse 1s infinite;
}

.refresh-text {
  font-size: 12px;
  color: #718096;
}

.refresh-toggle-button {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  color: #4a5568;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-toggle-button:hover {
  background: #f7fafc;
}

.refresh-toggle-button.active {
  background: #48bb78;
  color: white;
  border-color: #48bb78;
}

.refresh-toggle-button.active:hover {
  background: #38a169;
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
</style>
