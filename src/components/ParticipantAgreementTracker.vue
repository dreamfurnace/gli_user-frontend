<template>
  <div class="participant-agreement-tracker">
    <div class="tracker-header">
      <h3 class="tracker-title">참여자 동의 현황</h3>
      <div class="completion-summary">
        <span class="completion-rate">{{ completionRate }}% 완료</span>
        <div class="completion-bar">
          <div class="completion-fill" :style="{ width: `${completionRate}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 참여자 목록 -->
    <div class="participants-list">
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="participant-item"
        :class="{
          completed: participant.agreementStatus === 'completed',
          pending: participant.agreementStatus === 'pending',
          'not-required': participant.agreementStatus === 'not_required',
          'ai-participant': participant.type === 'ai',
        }"
      >
        <div class="participant-header">
          <div class="participant-info">
            <div class="participant-name">
              {{ participant.name }}
              <span v-if="participant.type === 'ai'" class="ai-badge">AI</span>
            </div>
            <div class="participant-type">
              {{ getParticipantTypeLabel(participant.type) }}
            </div>
          </div>

          <div class="agreement-status">
            <div class="status-indicator" :class="getStatusClass(participant.agreementStatus)">
              <svg
                v-if="participant.agreementStatus === 'completed'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
              <svg
                v-else-if="participant.agreementStatus === 'pending'"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
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
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <span class="status-text">{{ getStatusText(participant.agreementStatus) }}</span>
          </div>
        </div>

        <!-- 필드 완성도 -->
        <div v-if="participant.type === 'human'" class="field-completion">
          <div class="field-summary">
            <span class="field-label">필수 항목:</span>
            <span class="field-count"
              >{{ participant.completedFields.length }}/{{
                participant.requiredFields.length
              }}</span
            >
          </div>
          <div class="field-progress">
            <div
              class="field-progress-fill"
              :style="{ width: `${getFieldCompletionRate(participant)}%` }"
            ></div>
          </div>
        </div>

        <!-- 마지막 업데이트 -->
        <div class="last-updated">
          <span class="update-label">마지막 업데이트:</span>
          <span class="update-time">{{ formatLastUpdated(participant.lastUpdated) }}</span>
        </div>

        <!-- 동의 버튼 (인간 참여자만) -->
        <div
          v-if="participant.type === 'human' && participant.agreementStatus === 'pending'"
          class="agreement-actions"
        >
          <button
            @click="markAsAgreed(participant.id)"
            type="button"
            class="agree-button"
            :disabled="!canAgree(participant)"
          >
            동의 완료
          </button>
          <button
            @click="markAsNotRequired(participant.id)"
            type="button"
            class="not-required-button"
          >
            불필요
          </button>
        </div>

        <!-- 동의 취소 버튼 -->
        <div
          v-if="participant.type === 'human' && participant.agreementStatus === 'completed'"
          class="agreement-actions"
        >
          <button
            @click="markAsPending(participant.id)"
            type="button"
            class="cancel-agreement-button"
          >
            동의 취소
          </button>
        </div>
      </div>
    </div>

    <!-- 전체 동의 요약 -->
    <div class="agreement-summary">
      <div class="summary-item">
        <span class="summary-label">전체 참여자:</span>
        <span class="summary-value">{{ totalParticipants }}명</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">동의 완료:</span>
        <span class="summary-value completed">{{ completedParticipants }}명</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">대기 중:</span>
        <span class="summary-value pending">{{ pendingParticipants }}명</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">불필요:</span>
        <span class="summary-value not-required">{{ notRequiredParticipants }}명</span>
      </div>
    </div>

    <!-- 동의 가능 여부 안내 -->
    <div v-if="!allHumanParticipantsAgreed" class="agreement-notice">
      <div class="notice-icon">
        <svg
          width="20"
          height="20"
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
      <div class="notice-content">
        <p class="notice-title">모든 참여자의 동의가 필요합니다</p>
        <p class="notice-description">
          계약서 출력을 위해서는 모든 인간 참여자의 동의가 완료되어야 합니다.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  contractValidationService,
  type ParticipantStatus,
} from '@/services/ContractValidationService'

// Props 정의
interface Props {
  contractType?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  contractType: '',
  autoRefresh: true,
  refreshInterval: 5000,
})

// Emits 정의
const emit = defineEmits<{
  'agreement-complete': [participantId: string]
  'agreement-cancel': [participantId: string]
  'all-agreed': []
  'validation-update': [result: any]
}>()

// 반응형 상태
let refreshTimer: NodeJS.Timeout | null = null

// 계산된 속성들
const participants = computed(
  () => contractValidationService.validationResult.value.participantStatus,
)

const completionRate = computed(() => {
  const humanParticipants = participants.value.filter((p) => p.type === 'human')
  if (humanParticipants.length === 0) return 100

  const completed = humanParticipants.filter((p) => p.agreementStatus === 'completed').length
  return Math.round((completed / humanParticipants.length) * 100)
})

const totalParticipants = computed(() => participants.value.length)

const completedParticipants = computed(
  () => participants.value.filter((p) => p.agreementStatus === 'completed').length,
)

const pendingParticipants = computed(
  () => participants.value.filter((p) => p.agreementStatus === 'pending').length,
)

const notRequiredParticipants = computed(
  () => participants.value.filter((p) => p.agreementStatus === 'not_required').length,
)

const allHumanParticipantsAgreed = computed(() => {
  const humanParticipants = participants.value.filter((p) => p.type === 'human')
  return (
    humanParticipants.length > 0 &&
    humanParticipants.every((p) => p.agreementStatus === 'completed')
  )
})

// 메서드들
const getParticipantTypeLabel = (type: 'human' | 'ai') => {
  return type === 'human' ? '인간 참여자' : 'AI 어시스턴트'
}

const getStatusClass = (status: 'pending' | 'completed' | 'not_required') => {
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

const getStatusText = (status: 'pending' | 'completed' | 'not_required') => {
  switch (status) {
    case 'completed':
      return '동의 완료'
    case 'pending':
      return '대기 중'
    case 'not_required':
      return '불필요'
    default:
      return '알 수 없음'
  }
}

const getFieldCompletionRate = (participant: ParticipantStatus) => {
  if (participant.requiredFields.length === 0) return 100
  return Math.round((participant.completedFields.length / participant.requiredFields.length) * 100)
}

const formatLastUpdated = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

const canAgree = (participant: ParticipantStatus) => {
  if (participant.type === 'ai') return false
  return participant.completedFields.length >= participant.requiredFields.length
}

const markAsAgreed = (participantId: string) => {
  contractValidationService.updateParticipantStatus(participantId, {
    agreementStatus: 'completed',
  })

  emit('agreement-complete', participantId)

  if (allHumanParticipantsAgreed.value) {
    emit('all-agreed')
  }

  emit('validation-update', contractValidationService.validationResult.value)
}

const markAsNotRequired = (participantId: string) => {
  contractValidationService.updateParticipantStatus(participantId, {
    agreementStatus: 'not_required',
  })

  emit('validation-update', contractValidationService.validationResult.value)
}

const markAsPending = (participantId: string) => {
  contractValidationService.updateParticipantStatus(participantId, {
    agreementStatus: 'pending',
  })

  emit('agreement-cancel', participantId)
  emit('validation-update', contractValidationService.validationResult.value)
}

// 자동 새로고침 설정
const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = setInterval(() => {
      // 검증 상태 업데이트
      emit('validation-update', contractValidationService.validationResult.value)
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 생명주기 훅
onMounted(() => {
  if (props.contractType) {
    contractValidationService.setContractType(props.contractType)
  }
  startAutoRefresh()
})

// 컴포넌트 언마운트 시 타이머 정리
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.participant-agreement-tracker {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tracker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.tracker-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.completion-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.completion-rate {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.completion-bar {
  width: 100px;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.completion-fill {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #38a169);
  transition: width 0.3s ease;
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.participant-item {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 15px;
  transition: all 0.2s ease;
}

.participant-item.completed {
  background: #f0fff4;
  border-color: #9ae6b4;
}

.participant-item.pending {
  background: #fffaf0;
  border-color: #fbd38d;
}

.participant-item.not-required {
  background: #f7fafc;
  border-color: #cbd5e0;
  opacity: 0.7;
}

.participant-item.ai-participant {
  background: #f0f9ff;
  border-color: #90cdf4;
}

.participant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.participant-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-badge {
  background: #3182ce;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.participant-type {
  font-size: 12px;
  color: #718096;
}

.agreement-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.status-indicator.status-completed {
  background: #48bb78;
}

.status-indicator.status-pending {
  background: #ed8936;
}

.status-indicator.status-not-required {
  background: #a0aec0;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.status-text.status-completed {
  color: #48bb78;
}

.status-text.status-pending {
  color: #ed8936;
}

.status-text.status-not-required {
  color: #a0aec0;
}

.field-completion {
  margin: 10px 0;
}

.field-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.field-label {
  font-size: 12px;
  color: #718096;
}

.field-count {
  font-size: 12px;
  font-weight: 500;
  color: #4a5568;
}

.field-progress {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.field-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #3182ce);
  transition: width 0.3s ease;
}

.last-updated {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0;
}

.update-label {
  font-size: 11px;
  color: #a0aec0;
}

.update-time {
  font-size: 11px;
  color: #718096;
}

.agreement-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.agree-button,
.not-required-button,
.cancel-agreement-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.agree-button {
  background: #48bb78;
  color: white;
}

.agree-button:hover:not(:disabled) {
  background: #38a169;
}

.agree-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.not-required-button {
  background: #a0aec0;
  color: white;
}

.not-required-button:hover {
  background: #718096;
}

.cancel-agreement-button {
  background: #f56565;
  color: white;
}

.cancel-agreement-button:hover {
  background: #e53e3e;
}

.agreement-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 6px;
  margin-bottom: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.summary-label {
  font-size: 12px;
  color: #718096;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
}

.summary-value.completed {
  color: #48bb78;
}

.summary-value.pending {
  color: #ed8936;
}

.summary-value.not-required {
  color: #a0aec0;
}

.agreement-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: #fffaf0;
  border: 1px solid #fbd38d;
  border-radius: 6px;
}

.notice-icon {
  color: #ed8936;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 14px;
  font-weight: 600;
  color: #c05621;
  margin: 0 0 5px 0;
}

.notice-description {
  font-size: 12px;
  color: #744210;
  margin: 0;
  line-height: 1.4;
}
</style>
