<template>
  <div class="validation-result-feedback">
    <!-- 검증 상태 배너 -->
    <div class="validation-banner" :class="getBannerClass()">
      <div class="banner-icon">
        <svg
          v-if="validationResult.isValid"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        <svg
          v-else-if="hasCriticalErrors"
          width="24"
          height="24"
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
          width="24"
          height="24"
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
      <div class="banner-content">
        <h3 class="banner-title">{{ getBannerTitle() }}</h3>
        <p class="banner-description">{{ getBannerDescription() }}</p>
      </div>
    </div>

    <!-- 출력 버튼 -->
    <div class="output-section">
      <button
        @click="handleOutput"
        type="button"
        class="output-button"
        :class="getOutputButtonClass()"
        :disabled="!validationResult.isValid"
      >
        <div class="button-content">
          <svg
            v-if="validationResult.isValid"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7,10 12,15 17,10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <svg
            v-else
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span class="button-text">{{ getOutputButtonText() }}</span>
        </div>
      </button>

      <div v-if="!validationResult.isValid" class="output-disabled-reason">
        <p class="reason-text">{{ getOutputDisabledReason() }}</p>
      </div>
    </div>

    <!-- 미완료 항목 목록 -->
    <div v-if="!validationResult.isValid" class="incomplete-items">
      <h4 class="section-title">미완료 항목</h4>

      <!-- 누락된 필드 -->
      <div v-if="validationResult.missingFields.length > 0" class="missing-fields">
        <h5 class="subsection-title">필수 입력 항목</h5>
        <div class="items-list">
          <div v-for="field in validationResult.missingFields" :key="field" class="missing-item">
            <div class="item-icon">
              <svg
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
            </div>
            <span class="item-text">{{ getFieldDisplayName(field) }}</span>
            <button @click="scrollToField(field)" type="button" class="locate-button">
              위치 찾기
            </button>
          </div>
        </div>
      </div>

      <!-- 누락된 동의 -->
      <div v-if="validationResult.missingAgreements.length > 0" class="missing-agreements">
        <h5 class="subsection-title">필수 동의 항목</h5>
        <div class="items-list">
          <div
            v-for="agreement in validationResult.missingAgreements"
            :key="agreement"
            class="missing-item"
          >
            <div class="item-icon">
              <svg
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
            </div>
            <span class="item-text">{{ getAgreementDisplayName(agreement) }}</span>
            <button @click="scrollToAgreement(agreement)" type="button" class="locate-button">
              위치 찾기
            </button>
          </div>
        </div>
      </div>

      <!-- 참여자 동의 상태 -->
      <div v-if="pendingParticipants.length > 0" class="pending-participants">
        <h5 class="subsection-title">대기 중인 참여자</h5>
        <div class="items-list">
          <div
            v-for="participant in pendingParticipants"
            :key="participant.id"
            class="missing-item"
          >
            <div class="item-icon">
              <svg
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
            </div>
            <span class="item-text">{{ participant.name }}의 동의 필요</span>
            <button
              @click="scrollToParticipant(participant.id)"
              type="button"
              class="locate-button"
            >
              위치 찾기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 완성도 요약 -->
    <div class="completion-summary">
      <div class="summary-header">
        <h4 class="section-title">완성도 요약</h4>
        <span class="completion-rate">{{ validationResult.completionRate.toFixed(1) }}%</span>
      </div>

      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">필수 항목</span>
          <span class="stat-value"
            >{{ getCompletedFieldsCount() }}/{{ getTotalFieldsCount() }}</span
          >
        </div>
        <div class="stat-item">
          <span class="stat-label">동의 완료</span>
          <span class="stat-value"
            >{{ getCompletedAgreementsCount() }}/{{ getTotalAgreementsCount() }}</span
          >
        </div>
        <div class="stat-item">
          <span class="stat-label">참여자 동의</span>
          <span class="stat-value"
            >{{ getAgreedParticipantsCount() }}/{{ getHumanParticipantsCount() }}</span
          >
        </div>
      </div>

      <div class="completion-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :class="getProgressBarClass()"
            :style="{ width: `${validationResult.completionRate}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 빠른 수정 가이드 -->
    <div v-if="!validationResult.isValid" class="quick-fix-guide">
      <h4 class="section-title">빠른 수정 가이드</h4>
      <div class="guide-content">
        <div class="guide-item">
          <div class="guide-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
          </div>
          <div class="guide-text">
            <p class="guide-title">필수 입력 항목 완료</p>
            <p class="guide-description">빨간색으로 표시된 필수 항목들을 모두 입력해주세요.</p>
          </div>
        </div>

        <div class="guide-item">
          <div class="guide-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          <div class="guide-text">
            <p class="guide-title">동의 체크 완료</p>
            <p class="guide-description">모든 필수 동의 항목에 체크를 완료해주세요.</p>
          </div>
        </div>

        <div class="guide-item">
          <div class="guide-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="guide-text">
            <p class="guide-title">참여자 동의 확인</p>
            <p class="guide-description">모든 인간 참여자의 동의가 완료되었는지 확인해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  contractValidationService,
  type ValidationResult,
} from '@/services/ContractValidationService'

// Props 정의
interface Props {
  validationResult?: ValidationResult
  showQuickFixGuide?: boolean
  enableFieldNavigation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  validationResult: () => contractValidationService.validationResult.value,
  showQuickFixGuide: true,
  enableFieldNavigation: true,
})

// Emits 정의
const emit = defineEmits<{
  'output-request': []
  'field-navigate': [field: string]
  'agreement-navigate': [agreement: string]
  'participant-navigate': [participantId: string]
}>()

// 계산된 속성
const hasCriticalErrors = computed(() => {
  return props.validationResult.errors.some((error) => error.severity === 'error')
})

const pendingParticipants = computed(() => {
  return props.validationResult.participantStatus.filter(
    (p) => p.type === 'human' && p.agreementStatus === 'pending',
  )
})

// 메서드들
const getBannerClass = () => {
  if (props.validationResult.isValid) return 'banner-success'
  if (hasCriticalErrors.value) return 'banner-error'
  return 'banner-warning'
}

const getBannerTitle = () => {
  if (props.validationResult.isValid) return '계약서 출력 준비 완료'
  if (hasCriticalErrors.value) return '계약서 출력 불가'
  return '계약서 출력 준비 중'
}

const getBannerDescription = () => {
  if (props.validationResult.isValid) {
    return '모든 필수 항목이 완료되었습니다. 계약서를 출력할 수 있습니다.'
  }
  if (hasCriticalErrors.value) {
    return '필수 항목이 누락되어 계약서를 출력할 수 없습니다.'
  }
  return '일부 항목이 누락되어 계약서 출력이 제한됩니다.'
}

const getOutputButtonClass = () => {
  if (props.validationResult.isValid) return 'button-enabled'
  return 'button-disabled'
}

const getOutputButtonText = () => {
  if (props.validationResult.isValid) return '계약서 출력'
  return '출력 불가'
}

const getOutputDisabledReason = () => {
  const reasons = []

  if (props.validationResult.missingFields.length > 0) {
    reasons.push(`필수 입력 항목 ${props.validationResult.missingFields.length}개 누락`)
  }

  if (props.validationResult.missingAgreements.length > 0) {
    reasons.push(`필수 동의 항목 ${props.validationResult.missingAgreements.length}개 누락`)
  }

  if (pendingParticipants.value.length > 0) {
    reasons.push(`참여자 동의 ${pendingParticipants.value.length}명 대기`)
  }

  return reasons.join(', ')
}

const getFieldDisplayName = (field: string) => {
  const fieldNames: Record<string, string> = {
    propertyAddress: '부동산 주소',
    propertyType: '부동산 유형',
    contractPeriod: '계약 기간',
    sellerName: '매도인 이름',
    buyerName: '매수인 이름',
    sellerPhone: '매도인 연락처',
    buyerPhone: '매수인 연락처',
    purchasePrice: '매매 가격',
    depositAmount: '보증금',
    monthlyRent: '월세',
    landlordName: '임대인 이름',
    tenantName: '임차인 이름',
    landlordPhone: '임대인 연락처',
    tenantPhone: '임차인 연락처',
    maintenanceFee: '관리비',
    subleaseDeposit: '전대차 보증금',
    subleaseRent: '전대차 월세',
    sublessorName: '전대인 이름',
    sublesseeName: '전차인 이름',
    originalLeaseConsent: '원임대인 동의',
    originalLeaseDocument: '원임대차계약서',
  }

  return fieldNames[field] || field
}

const getAgreementDisplayName = (agreement: string) => {
  const agreementNames: Record<string, string> = {
    terms_agreement: '이용약관 동의',
    privacy_agreement: '개인정보처리방침 동의',
    contract_agreement: '계약 조건 동의',
    payment_agreement: '결제 조건 동의',
    legal_agreement: '법적 고지 동의',
  }

  return agreementNames[agreement] || agreement
}

const getCompletedFieldsCount = () => {
  const totalFields = getTotalFieldsCount()
  return totalFields - props.validationResult.missingFields.length
}

const getTotalFieldsCount = () => {
  // 실제 구현에서는 계약서 타입별 필수 필드 수를 반환
  return 15 // 예시 값
}

const getCompletedAgreementsCount = () => {
  const totalAgreements = getTotalAgreementsCount()
  return totalAgreements - props.validationResult.missingAgreements.length
}

const getTotalAgreementsCount = () => {
  // 실제 구현에서는 필수 동의 항목 수를 반환
  return 5 // 예시 값
}

const getAgreedParticipantsCount = () => {
  return props.validationResult.participantStatus.filter(
    (p) => p.type === 'human' && p.agreementStatus === 'completed',
  ).length
}

const getHumanParticipantsCount = () => {
  return props.validationResult.participantStatus.filter((p) => p.type === 'human').length
}

const getProgressBarClass = () => {
  const rate = props.validationResult.completionRate
  if (rate >= 90) return 'progress-excellent'
  if (rate >= 70) return 'progress-good'
  if (rate >= 50) return 'progress-fair'
  return 'progress-poor'
}

const handleOutput = () => {
  if (props.validationResult.isValid) {
    emit('output-request')
  }
}

const scrollToField = (field: string) => {
  if (props.enableFieldNavigation) {
    emit('field-navigate', field)
  }
}

const scrollToAgreement = (agreement: string) => {
  if (props.enableFieldNavigation) {
    emit('agreement-navigate', agreement)
  }
}

const scrollToParticipant = (participantId: string) => {
  if (props.enableFieldNavigation) {
    emit('participant-navigate', participantId)
  }
}
</script>

<style scoped>
.validation-result-feedback {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.validation-banner {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.validation-banner.banner-success {
  background: #f0fff4;
  border: 1px solid #9ae6b4;
}

.validation-banner.banner-warning {
  background: #fffaf0;
  border: 1px solid #fbd38d;
}

.validation-banner.banner-error {
  background: #fed7d7;
  border: 1px solid #feb2b2;
}

.banner-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.validation-banner.banner-success .banner-icon {
  color: #48bb78;
}

.validation-banner.banner-warning .banner-icon {
  color: #ed8936;
}

.validation-banner.banner-error .banner-icon {
  color: #f56565;
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.validation-banner.banner-success .banner-title {
  color: #22543d;
}

.validation-banner.banner-warning .banner-title {
  color: #c05621;
}

.validation-banner.banner-error .banner-title {
  color: #c53030;
}

.banner-description {
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.validation-banner.banner-success .banner-description {
  color: #2f855a;
}

.validation-banner.banner-warning .banner-description {
  color: #744210;
}

.validation-banner.banner-error .banner-description {
  color: #742a2a;
}

.output-section {
  margin-bottom: 25px;
}

.output-button {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
}

.output-button.button-enabled {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.output-button.button-enabled:hover {
  background: linear-gradient(135deg, #38a169, #2f855a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.output-button.button-disabled {
  background: #e2e8f0;
  color: #a0aec0;
  cursor: not-allowed;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.output-disabled-reason {
  text-align: center;
  padding: 10px;
  background: #f7fafc;
  border-radius: 6px;
}

.reason-text {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.incomplete-items {
  margin-bottom: 25px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 15px 0;
}

.subsection-title {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  margin: 0 0 10px 0;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.missing-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f7fafc;
  border-radius: 6px;
  border-left: 3px solid #f56565;
}

.item-icon {
  color: #f56565;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-size: 14px;
  color: #4a5568;
}

.locate-button {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  color: #4a5568;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.locate-button:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.completion-summary {
  margin-bottom: 25px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.completion-rate {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f7fafc;
  border-radius: 6px;
}

.stat-label {
  font-size: 12px;
  color: #718096;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.completion-progress {
  margin-bottom: 15px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.progress-fill.progress-excellent {
  background: linear-gradient(90deg, #48bb78, #38a169);
}

.progress-fill.progress-good {
  background: linear-gradient(90deg, #4299e1, #3182ce);
}

.progress-fill.progress-fair {
  background: linear-gradient(90deg, #ed8936, #dd6b20);
}

.progress-fill.progress-poor {
  background: linear-gradient(90deg, #f56565, #e53e3e);
}

.quick-fix-guide {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 6px;
  border-left: 4px solid #4299e1;
}

.guide-icon {
  flex-shrink: 0;
  color: #4299e1;
  margin-top: 2px;
}

.guide-text {
  flex: 1;
}

.guide-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 5px 0;
}

.guide-description {
  font-size: 12px;
  color: #718096;
  margin: 0;
  line-height: 1.4;
}
</style>
