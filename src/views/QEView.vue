<template>
  <div class="contract-view">
    <BaseHeader
      @toggleRightSidebar="handleToggleRightSidebar"
      @toggleLeftSidebar="handleToggleLeftSidebar"
    />
    <LeftSidebar :isHidden="sideMenuStore.leftSidebarHidden" />
    <RightSidebar :isHidden="sideMenuStore.rightSidebarHidden" @logout="handleLogout" />
    <!-- 3단 레이아웃 -->
    <div class="layout-container">
      <!-- 좌측 패널 -->
      <div class="left-panel">
        <LeftPanelComponent
          :contract-info="contractInfo"
          :property-info="propertyInfo"
          :authors="authors"
          :status="contractStatus"
          @status-change="handleStatusChange"
          @save="handleSave"
          @preview="handlePreview"
          @export="handleExport"
        />
      </div>

      <!-- 중앙 입력 폼 -->
      <div class="center-panel">
        <div class="form-container">
          <h1 class="page-title">전대차 계약서</h1>

          <!-- 1. 원임대차계약서 업로드 -->
          <section class="form-section">
            <h2 class="section-title">1. 원임대차계약서 업로드</h2>
            <div class="form-group">
              <label class="form-label">원임대차계약서 파일</label>
              <FileUploadComponent
                v-model="originalLeaseDocument"
                :accept="'.pdf,.jpg,.jpeg,.png'"
                :max-size="10"
                @upload-success="handleOriginalLeaseUpload"
                @text-extracted="handleOriginalLeaseTextExtracted"
              />
            </div>
            <div v-if="originalLeaseDocument" class="upload-info">
              <p class="info-text">원임대차계약서가 업로드되었습니다.</p>
              <p class="info-text">파일명: {{ originalLeaseDocument.name }}</p>
            </div>
          </section>

          <!-- 2. 동의 확인 -->
          <section class="form-section">
            <h2 class="section-title">2. 원임대인 동의 확인</h2>

            <!-- 동의 확인 체크박스 -->
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="consentAgreements" type="checkbox" value="written" />
                서면 동의서 확인
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="consentAgreements" type="checkbox" value="verbal" />
                구두 동의 확인
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="consentAgreements" type="checkbox" value="legal" />
                법적 요건 충족
              </label>
            </div>
            <p class="helper-text">원임대인의 전대 동의가 법적으로 필수입니다.</p>

            <!-- 동의 상세 정보 -->
            <div v-if="consentInfo.landlordConsent" class="consent-details">
              <h3 class="sub-section-title">동의 상세 정보</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">동의 확인 방법</label>
                  <select v-model="consentInfo.consentMethod" class="form-input">
                    <option value="written">서면 동의서</option>
                    <option value="verbal">구두 동의</option>
                    <option value="email">이메일</option>
                    <option value="sms">SMS</option>
                    <option value="other">기타</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">동의 확인일</label>
                  <DateInputComponent v-model="consentInfo.consentDate" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">동의 확인자</label>
                <input
                  v-model="consentInfo.confirmedBy"
                  type="text"
                  class="form-input"
                  placeholder="동의를 확인한 사람의 이름"
                />
              </div>

              <div class="form-group">
                <label class="form-label">동의 확인 내용</label>
                <textarea
                  v-model="consentInfo.consentDetails"
                  class="form-textarea"
                  rows="3"
                  placeholder="동의 확인 과정에서 확인된 내용을 기록하세요"
                ></textarea>
              </div>

              <!-- 동의서 업로드 -->
              <div class="form-group">
                <label class="form-label">동의서 파일 업로드</label>
                <FileUploadComponent
                  v-model="consentInfo.consentDocument"
                  :accept="'.pdf,.jpg,.jpeg,.png'"
                  :max-size="10"
                  @upload-success="handleConsentDocumentUpload"
                />
              </div>
            </div>
          </section>

          <!-- 3. 전대차 조건 입력 -->
          <section class="form-section">
            <h2 class="section-title">3. 전대차 조건</h2>

            <!-- 3-1. 전대인 정보 -->
            <div class="sub-section">
              <h3 class="sub-section-title">3-1. 전대인 정보</h3>
              <div class="form-group">
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      v-model="sublessorInfo.type"
                      type="radio"
                      value="individual"
                      @change="handleSublessorTypeChange"
                    />
                    개인
                  </label>
                  <label class="radio-label">
                    <input
                      v-model="sublessorInfo.type"
                      type="radio"
                      value="corporate"
                      @change="handleSublessorTypeChange"
                    />
                    법인
                  </label>
                </div>
              </div>

              <div v-if="sublessorInfo.type === 'individual'" class="sublessor-individual">
                <PersonInfoComponent
                  v-model="sublessorInfo.individual"
                  :required="true"
                  @update:model-value="handleSublessorInfoUpdate"
                />
              </div>

              <div v-if="sublessorInfo.type === 'corporate'" class="sublessor-corporate">
                <div class="form-group">
                  <label class="form-label">법인등기부등본</label>
                  <FileUploadComponent
                    v-model="sublessorInfo.corporate.registrationDocument"
                    :accept="'.pdf,.jpg,.jpeg,.png'"
                    :max-size="10"
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">회사명</label>
                    <input
                      v-model="sublessorInfo.corporate.companyName"
                      type="text"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">대표자</label>
                    <input
                      v-model="sublessorInfo.corporate.representative"
                      type="text"
                      class="form-input"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">본점 주소</label>
                  <input v-model="sublessorInfo.corporate.address" type="text" class="form-input" />
                </div>
              </div>
            </div>

            <!-- 3-2. 전차인 정보 -->
            <div class="sub-section">
              <h3 class="sub-section-title">3-2. 전차인 정보</h3>
              <div class="form-group">
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      v-model="sublesseeInfo.type"
                      type="radio"
                      value="individual"
                      @change="handleSublesseeTypeChange"
                    />
                    개인
                  </label>
                  <label class="radio-label">
                    <input
                      v-model="sublesseeInfo.type"
                      type="radio"
                      value="corporate"
                      @change="handleSublesseeTypeChange"
                    />
                    법인
                  </label>
                </div>
              </div>

              <div v-if="sublesseeInfo.type === 'individual'" class="sublessee-individual">
                <PersonInfoComponent
                  v-model="sublesseeInfo.individual"
                  :required="true"
                  @update:model-value="handleSublesseeInfoUpdate"
                />
              </div>

              <div v-if="sublesseeInfo.type === 'corporate'" class="sublessee-corporate">
                <div class="form-group">
                  <label class="form-label">법인등기부등본</label>
                  <FileUploadComponent
                    v-model="sublesseeInfo.corporate.registrationDocument"
                    :accept="'.pdf,.jpg,.jpeg,.png'"
                    :max-size="10"
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">회사명</label>
                    <input
                      v-model="sublesseeInfo.corporate.companyName"
                      type="text"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">대표자</label>
                    <input
                      v-model="sublesseeInfo.corporate.representative"
                      type="text"
                      class="form-input"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">본점 주소</label>
                  <input v-model="sublesseeInfo.corporate.address" type="text" class="form-input" />
                </div>
              </div>
            </div>

            <!-- 3-3. 전대차 금액 -->
            <div class="sub-section">
              <h3 class="sub-section-title">3-3. 전대차 금액</h3>

              <!-- 보증금 정보 -->
              <div class="form-group">
                <label class="form-label">전대차 보증금</label>
                <AmountInputComponent
                  v-model="contractInfo.subleaseDeposit"
                  :required="true"
                  @update:model-value="handleSubleaseDepositChange"
                />
                <div class="amount-info">
                  <span class="info-text"
                    >원계약 보증금: {{ formatAmount(originalLeaseInfo.deposit) }}</span
                  >
                  <span class="info-text"
                    >차액:
                    {{
                      formatAmount(contractInfo.subleaseDeposit - originalLeaseInfo.deposit)
                    }}</span
                  >
                </div>
              </div>

              <!-- 월세 정보 -->
              <div class="form-group">
                <label class="form-label">전대차 월세</label>
                <AmountInputComponent
                  v-model="contractInfo.subleaseRent"
                  :required="true"
                  @update:model-value="handleSubleaseRentChange"
                />
                <div class="amount-info">
                  <span class="info-text"
                    >원계약 월세: {{ formatAmount(originalLeaseInfo.rent) }}</span
                  >
                  <span class="info-text"
                    >차액:
                    {{ formatAmount(contractInfo.subleaseRent - originalLeaseInfo.rent) }}</span
                  >
                </div>
              </div>

              <!-- 관리비 정보 -->
              <div class="form-group">
                <label class="form-label">관리비</label>
                <AmountInputComponent
                  v-model="contractInfo.subleaseMaintenanceFee"
                  :required="false"
                />
                <div class="amount-info">
                  <span class="info-text"
                    >원계약 관리비: {{ formatAmount(originalLeaseInfo.maintenanceFee) }}</span
                  >
                </div>
              </div>

              <!-- 공과금 정보 -->
              <div class="form-group">
                <label class="form-label">공과금 납부 방식</label>
                <div class="utility-payment-options">
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input v-model="contractInfo.utilities.electricity" type="checkbox" />
                      전기료 직접 납부
                    </label>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input v-model="contractInfo.utilities.water" type="checkbox" />
                      수도료 직접 납부
                    </label>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input v-model="contractInfo.utilities.gas" type="checkbox" />
                      가스료 직접 납부
                    </label>
                  </div>
                </div>
              </div>

              <!-- 지급 조건 -->
              <div class="form-group">
                <label class="form-label">지급 조건</label>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">보증금 지급일</label>
                    <DateInputComponent v-model="contractInfo.depositPaymentDate" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">월세 지급일</label>
                    <input
                      v-model="contractInfo.rentPaymentDay"
                      type="number"
                      class="form-input"
                      min="1"
                      max="31"
                      placeholder="매월"
                    />
                    <span class="unit-text">일</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 3-4. 전대차 기간 -->
            <div class="sub-section">
              <h3 class="sub-section-title">3-4. 전대차 기간</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">전대차 개시일</label>
                  <DateInputComponent
                    v-model="contractInfo.subleasePeriod.startDate"
                    :required="true"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">전대차 종료일</label>
                  <DateInputComponent
                    v-model="contractInfo.subleasePeriod.endDate"
                    :required="true"
                  />
                </div>
              </div>
            </div>
          </section>

          <!-- 4. 원계약서 비교 결과 -->
          <section class="form-section">
            <h2 class="section-title">4. 원계약서 비교 결과</h2>
            <div v-if="originalLeaseDocument" class="comparison-results">
              <!-- 비교 요약 -->
              <div class="comparison-summary">
                <h3>비교 요약</h3>
                <div class="summary-stats">
                  <div class="stat-item">
                    <span class="stat-label">적정 항목:</span>
                    <span class="stat-value">{{ getComplianceCount() }}개</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">주의 항목:</span>
                    <span class="stat-value">{{ getWarningCount() }}개</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">위험 항목:</span>
                    <span class="stat-value">{{ getRiskCount() }}개</span>
                  </div>
                </div>
              </div>

              <!-- 보증금 비교 -->
              <div class="comparison-item">
                <h4>보증금 비교</h4>
                <div class="comparison-details">
                  <div class="comparison-row">
                    <span class="label">원계약 보증금:</span>
                    <span class="value">{{ formatAmount(originalLeaseInfo.deposit) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">전대차 보증금:</span>
                    <span class="value">{{ formatAmount(contractInfo.subleaseDeposit) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">차액:</span>
                    <span class="value" :class="getAmountDifferenceClass('deposit')">
                      {{ formatAmount(contractInfo.subleaseDeposit - originalLeaseInfo.deposit) }}
                    </span>
                  </div>
                  <div class="comparison-analysis">
                    <p class="comparison-status" :class="getComparisonStatusClass('deposit')">
                      {{ getComparisonStatus('deposit') }}
                    </p>
                    <p class="analysis-text">{{ getComparisonAnalysis('deposit') }}</p>
                  </div>
                </div>
              </div>

              <!-- 월세 비교 -->
              <div class="comparison-item">
                <h4>월세 비교</h4>
                <div class="comparison-details">
                  <div class="comparison-row">
                    <span class="label">원계약 월세:</span>
                    <span class="value">{{ formatAmount(originalLeaseInfo.rent) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">전대차 월세:</span>
                    <span class="value">{{ formatAmount(contractInfo.subleaseRent) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">차액:</span>
                    <span class="value" :class="getAmountDifferenceClass('rent')">
                      {{ formatAmount(contractInfo.subleaseRent - originalLeaseInfo.rent) }}
                    </span>
                  </div>
                  <div class="comparison-analysis">
                    <p class="comparison-status" :class="getComparisonStatusClass('rent')">
                      {{ getComparisonStatus('rent') }}
                    </p>
                    <p class="analysis-text">{{ getComparisonAnalysis('rent') }}</p>
                  </div>
                </div>
              </div>

              <!-- 관리비 비교 -->
              <div class="comparison-item">
                <h4>관리비 비교</h4>
                <div class="comparison-details">
                  <div class="comparison-row">
                    <span class="label">원계약 관리비:</span>
                    <span class="value">{{ formatAmount(originalLeaseInfo.maintenanceFee) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">전대차 관리비:</span>
                    <span class="value">{{
                      formatAmount(contractInfo.subleaseMaintenanceFee)
                    }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">차액:</span>
                    <span class="value" :class="getAmountDifferenceClass('maintenance')">
                      {{
                        formatAmount(
                          contractInfo.subleaseMaintenanceFee - originalLeaseInfo.maintenanceFee,
                        )
                      }}
                    </span>
                  </div>
                  <div class="comparison-analysis">
                    <p class="comparison-status" :class="getComparisonStatusClass('maintenance')">
                      {{ getComparisonStatus('maintenance') }}
                    </p>
                    <p class="analysis-text">{{ getComparisonAnalysis('maintenance') }}</p>
                  </div>
                </div>
              </div>

              <!-- 계약 기간 비교 -->
              <div class="comparison-item">
                <h4>계약 기간 비교</h4>
                <div class="comparison-details">
                  <div class="comparison-row">
                    <span class="label">원계약 기간:</span>
                    <span class="value">{{ formatDateRange(originalLeaseInfo.period) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">전대차 기간:</span>
                    <span class="value">{{ formatDateRange(contractInfo.subleasePeriod) }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">기간 겹침:</span>
                    <span class="value">{{ getPeriodOverlap() }}</span>
                  </div>
                  <div class="comparison-analysis">
                    <p class="comparison-status" :class="getComparisonStatusClass('period')">
                      {{ getComparisonStatus('period') }}
                    </p>
                    <p class="analysis-text">{{ getComparisonAnalysis('period') }}</p>
                  </div>
                </div>
              </div>

              <!-- 공과금 비교 -->
              <div class="comparison-item">
                <h4>공과금 납부 방식 비교</h4>
                <div class="comparison-details">
                  <div class="comparison-row">
                    <span class="label">원계약 공과금:</span>
                    <span class="value">{{ getOriginalUtilitiesText() }}</span>
                  </div>
                  <div class="comparison-row">
                    <span class="label">전대차 공과금:</span>
                    <span class="value">{{ getSubleaseUtilitiesText() }}</span>
                  </div>
                  <div class="comparison-analysis">
                    <p class="comparison-status" :class="getComparisonStatusClass('utilities')">
                      {{ getComparisonStatus('utilities') }}
                    </p>
                    <p class="analysis-text">{{ getComparisonAnalysis('utilities') }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="no-comparison">
              <p class="info-text">원임대차계약서를 업로드하면 비교 결과가 표시됩니다.</p>
            </div>
          </section>

          <!-- 5. 경고 시스템 -->
          <section class="form-section">
            <h2 class="section-title">5. 경고 및 주의사항</h2>
            <div class="warnings-section">
              <div v-if="warnings.length > 0" class="warnings-list">
                <div
                  v-for="(warning, index) in warnings"
                  :key="index"
                  class="warning-item"
                  :class="warning.level"
                >
                  <div class="warning-icon">
                    {{ warning.level === 'high' ? '⚠️' : warning.level === 'medium' ? '⚠️' : 'ℹ️' }}
                  </div>
                  <div class="warning-content">
                    <h4 class="warning-title">{{ warning.title }}</h4>
                    <p class="warning-description">{{ warning.description }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="no-warnings">
                <p class="info-text">현재 경고사항이 없습니다.</p>
              </div>
            </div>
          </section>

          <!-- 6. 특약사항 -->
          <section class="form-section">
            <h2 class="section-title">6. 특약사항</h2>
            <div class="special-clauses">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.specialClauses.rentalProtection" type="checkbox" />
                  주택임대차보호법 적용
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="contractInfo.specialClauses.originalLandlordRights"
                    type="checkbox"
                  />
                  원임대인 권리 보장
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="contractInfo.specialClauses.subleaseTermination"
                    type="checkbox"
                  />
                  원계약 해지 시 전대차 자동 해지
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">추가 특약사항</label>
              <textarea
                v-model="contractInfo.additionalClauses"
                class="form-textarea"
                rows="4"
                placeholder="추가 특약사항을 입력하세요"
              ></textarea>
            </div>
          </section>
        </div>
      </div>

      <!-- 우측 채팅 패널 -->
      <div class="right-panel">
        <div class="chat-placeholder">
          <p>계약서 작성 도움말</p>
          <p>계약서 작성 중 궁금한 점이 있으시면 도움을 요청하세요.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { useAuthStore } from '@/stores/auth'
import LeftPanelComponent from '@/components/LeftPanelComponent.vue'
import PersonInfoComponent from '@/components/PersonInfoComponent.vue'
import AmountInputComponent from '@/components/AmountInputComponent.vue'
import DateInputComponent from '@/components/DateInputComponent.vue'
import FileUploadComponent from '@/components/FileUploadComponent.vue'
import BaseHeader from '@/components/BaseHeader.vue'
import LeftSidebar from '@/components/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar.vue'
import '@/styles/layouts/contract-layout.css'

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()
const router = useRouter()

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
  console.log('QEView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })
})

// 계약 정보
const contractInfo = reactive({
  subleaseDeposit: 0,
  subleaseRent: 0,
  subleaseMaintenanceFee: 0,
  subleasePeriod: {
    startDate: '',
    endDate: '',
  },
  utilities: {
    electricity: false,
    water: false,
    gas: false,
  },
  depositPaymentDate: '',
  rentPaymentDay: 1,
  specialClauses: {
    rentalProtection: false,
    originalLandlordRights: false,
    subleaseTermination: false,
  },
  additionalClauses: '',
})

// 부동산 정보
const propertyInfo = reactive({
  address: '',
  originalLeaseDocument: null,
})

// 원임대차계약서 정보
const originalLeaseDocument = ref(null)
const originalLeaseInfo = reactive({
  deposit: 0,
  rent: 0,
  period: {
    startDate: '',
    endDate: '',
  },
  landlord: {
    name: '',
    type: 'individual', // 'individual' | 'corporate'
  },
  tenant: {
    name: '',
    type: 'individual', // 'individual' | 'corporate'
  },
  property: {
    address: '',
    area: 0,
    type: '', // 'residential' | 'commercial'
  },
  maintenanceFee: 0,
  utilities: {
    electricity: false,
    water: false,
    gas: false,
  },
})

// 동의 정보
const consentInfo = reactive({
  landlordConsent: false,
  writtenConsent: false,
  verbalConsent: false,
  consentMethod: '',
  consentDate: '',
  confirmedBy: '',
  consentDetails: '',
  consentDocument: null,
})

// 동의 확인 항목들
const consentAgreements = ref([
  {
    id: 'landlord-consent',
    title: '원임대인의 전대 동의 확인',
    description: '원임대인이 전대를 허락한다는 동의를 받았습니다.',
    required: true,
    checked: false,
  },
  {
    id: 'written-consent',
    title: '서면 동의서 보유',
    description: '원임대인의 서면 동의서를 보유하고 있습니다.',
    required: false,
    checked: false,
  },
  {
    id: 'verbal-consent',
    title: '구두 동의 확인',
    description: '원임대인의 구두 동의를 확인했습니다.',
    required: false,
    checked: false,
  },
  {
    id: 'legal-compliance',
    title: '법적 요건 준수',
    description: '전대차 계약이 관련 법령을 준수합니다.',
    required: true,
    checked: false,
  },
])

// 전대인 정보
const sublessorInfo = reactive({
  type: 'individual',
  individual: {
    name: '',
    residentNumber: '',
    address: '',
    phone: '',
    email: '',
  },
  corporate: {
    companyName: '',
    representative: '',
    address: '',
    businessNumber: '',
    phone: '',
    registrationDocument: null,
  },
})

// 전차인 정보
const sublesseeInfo = reactive({
  type: 'individual',
  individual: {
    name: '',
    residentNumber: '',
    address: '',
    phone: '',
    email: '',
  },
  corporate: {
    companyName: '',
    representative: '',
    address: '',
    businessNumber: '',
    phone: '',
    registrationDocument: null,
  },
})

// 계약 상태
const contractStatus = ref('draft')
const authors = ref(['사용자'])

// 채팅 관련
const chatMessages = ref([])
const isTyping = ref(false)

// 경고 목록
interface Warning {
  level: 'high' | 'medium' | 'low'
  title: string
  description: string
}

const warnings = ref<Warning[]>([])

// 계산된 속성들
const convertedSubleaseDeposit = computed(() => {
  return contractInfo.subleaseDeposit * 10000
})

const convertedSubleaseRent = computed(() => {
  return contractInfo.subleaseRent * 10000
})

const convertedSubleaseMaintenanceFee = computed(() => {
  return contractInfo.subleaseMaintenanceFee * 10000
})

// 이벤트 핸들러들
const handleOriginalLeaseUpload = (file: File) => {
  console.log('원임대차계약서 업로드:', file)
  // 파일 업로드 후 텍스트 추출 및 정보 파싱
}

const handleOriginalLeaseTextExtracted = (text: string) => {
  console.log('원임대차계약서 텍스트 추출:', text)
  // 텍스트에서 계약 정보 추출
  parseOriginalLeaseInfo(text)
}

const handleSublessorTypeChange = () => {
  console.log('전대인 타입 변경:', sublessorInfo.type)
}

const handleSublesseeTypeChange = () => {
  console.log('전차인 타입 변경:', sublesseeInfo.type)
}

const handleSublessorInfoUpdate = (info: any) => {
  console.log('전대인 정보 업데이트:', info)
}

const handleSublesseeInfoUpdate = (info: any) => {
  console.log('전차인 정보 업데이트:', info)
}

const handleSubleaseDepositChange = (value: number) => {
  console.log('전대차 보증금 변경:', value)
  updateWarnings()
}

const handleSubleaseRentChange = (value: number) => {
  console.log('전대차 월세 변경:', value)
  updateWarnings()
}

const handleStatusChange = (status: string) => {
  contractStatus.value = status
}

const handleSave = () => {
  console.log('계약서 저장')
}

const handlePreview = () => {
  console.log('계약서 미리보기')
}

const handleExport = () => {
  console.log('계약서 내보내기')
}

const handleChatMessage = (message: string) => {
  console.log('채팅 메시지:', message)
}

const handleAISuggestion = (suggestion: any) => {
  console.log('AI 제안:', suggestion)
}

const handleConsentChange = (items: any[]) => {
  console.log('동의 항목 변경:', items)

  // 동의 상태 업데이트
  const landlordConsentItem = items.find((item) => item.id === 'landlord-consent')
  const writtenConsentItem = items.find((item) => item.id === 'written-consent')
  const verbalConsentItem = items.find((item) => item.id === 'verbal-consent')

  if (landlordConsentItem) {
    consentInfo.landlordConsent = landlordConsentItem.checked
  }
  if (writtenConsentItem) {
    consentInfo.writtenConsent = writtenConsentItem.checked
  }
  if (verbalConsentItem) {
    consentInfo.verbalConsent = verbalConsentItem.checked
  }

  // 경고 업데이트
  updateWarnings()
}

const handleConsentDocumentUpload = (file: File) => {
  console.log('동의서 업로드:', file)
  // 동의서 파일 처리
}

// 유틸리티 함수들
const parseOriginalLeaseInfo = (text: string) => {
  // 텍스트에서 원임대차계약서 정보 추출
  console.log('원임대차계약서 정보 파싱:', text)

  // 보증금 추출 (정규식 패턴)
  const depositPattern = /보증금[:\s]*([0-9,]+)원?/g
  const depositMatch = depositPattern.exec(text)
  if (depositMatch) {
    originalLeaseInfo.deposit = parseInt(depositMatch[1].replace(/,/g, ''))
  }

  // 월세 추출
  const rentPattern = /월세[:\s]*([0-9,]+)원?/g
  const rentMatch = rentPattern.exec(text)
  if (rentMatch) {
    originalLeaseInfo.rent = parseInt(rentMatch[1].replace(/,/g, ''))
  }

  // 임대인 정보 추출
  const landlordPattern = /임대인[:\s]*([가-힣\s]+)/g
  const landlordMatch = landlordPattern.exec(text)
  if (landlordMatch) {
    originalLeaseInfo.landlord.name = landlordMatch[1].trim()
  }

  // 임차인 정보 추출
  const tenantPattern = /임차인[:\s]*([가-힣\s]+)/g
  const tenantMatch = tenantPattern.exec(text)
  if (tenantMatch) {
    originalLeaseInfo.tenant.name = tenantMatch[1].trim()
  }

  // 부동산 주소 추출
  const addressPattern = /주소[:\s]*([가-힣0-9\s\-]+)/g
  const addressMatch = addressPattern.exec(text)
  if (addressMatch) {
    originalLeaseInfo.property.address = addressMatch[1].trim()
  }

  // 계약 기간 추출
  const periodPattern =
    /계약기간[:\s]*([0-9]{4}[년\s]*[0-9]{1,2}[월\s]*[0-9]{1,2}[일\s]*부터[0-9]{4}[년\s]*[0-9]{1,2}[월\s]*[0-9]{1,2}[일\s]*까지)/g
  const periodMatch = periodPattern.exec(text)
  if (periodMatch) {
    const periodText = periodMatch[1]
    const startMatch = periodText.match(
      /([0-9]{4})[년\s]*([0-9]{1,2})[월\s]*([0-9]{1,2})[일\s]*부터/,
    )
    const endMatch = periodText.match(/부터[0-9]{4}[년\s]*[0-9]{1,2}[월\s]*[0-9]{1,2}[일\s]*까지/)

    if (startMatch) {
      originalLeaseInfo.period.startDate = `${startMatch[1]}-${startMatch[2].padStart(2, '0')}-${startMatch[3].padStart(2, '0')}`
    }
    if (endMatch) {
      const endText = endMatch[0].replace('부터', '').replace('까지', '')
      const endDateMatch = endText.match(/([0-9]{4})[년\s]*([0-9]{1,2})[월\s]*([0-9]{1,2})[일]/)
      if (endDateMatch) {
        originalLeaseInfo.period.endDate = `${endDateMatch[1]}-${endDateMatch[2].padStart(2, '0')}-${endDateMatch[3].padStart(2, '0')}`
      }
    }
  }

  // 관리비 추출
  const maintenancePattern = /관리비[:\s]*([0-9,]+)원?/g
  const maintenanceMatch = maintenancePattern.exec(text)
  if (maintenanceMatch) {
    originalLeaseInfo.maintenanceFee = parseInt(maintenanceMatch[1].replace(/,/g, ''))
  }

  // 공과금 정보 추출
  if (text.includes('전기료') || text.includes('전기')) {
    originalLeaseInfo.utilities.electricity = true
  }
  if (text.includes('수도료') || text.includes('수도')) {
    originalLeaseInfo.utilities.water = true
  }
  if (text.includes('가스료') || text.includes('가스')) {
    originalLeaseInfo.utilities.gas = true
  }

  // 부동산 유형 판단
  if (text.includes('주택') || text.includes('아파트') || text.includes('빌라')) {
    originalLeaseInfo.property.type = 'residential'
  } else if (text.includes('상가') || text.includes('사무실') || text.includes('점포')) {
    originalLeaseInfo.property.type = 'commercial'
  }

  console.log('파싱된 원임대차계약서 정보:', originalLeaseInfo)

  // 경고 업데이트
  updateWarnings()
}

const updateWarnings = () => {
  warnings.value = []

  // 보증금 경고
  if (contractInfo.subleaseDeposit > originalLeaseInfo.deposit) {
    const excess = contractInfo.subleaseDeposit - originalLeaseInfo.deposit
    const excessRate = (excess / originalLeaseInfo.deposit) * 100

    if (excessRate > 20) {
      warnings.value.push({
        level: 'high',
        title: '보증금 대폭 초과',
        description: `전대차 보증금이 원계약을 ${excessRate.toFixed(1)}% 초과합니다. 법적 위험이 높습니다.`,
      })
    } else if (excessRate > 10) {
      warnings.value.push({
        level: 'medium',
        title: '보증금 초과',
        description: `전대차 보증금이 원계약을 ${excessRate.toFixed(1)}% 초과합니다. 검토가 필요합니다.`,
      })
    } else {
      warnings.value.push({
        level: 'low',
        title: '보증금 소폭 초과',
        description: `전대차 보증금이 원계약을 ${excessRate.toFixed(1)}% 초과합니다.`,
      })
    }
  }

  // 월세 경고
  if (contractInfo.subleaseRent > originalLeaseInfo.rent) {
    const excess = contractInfo.subleaseRent - originalLeaseInfo.rent
    const excessRate = (excess / originalLeaseInfo.rent) * 100

    if (excessRate > 20) {
      warnings.value.push({
        level: 'high',
        title: '월세 대폭 초과',
        description: `전대차 월세가 원계약을 ${excessRate.toFixed(1)}% 초과합니다. 법적 위험이 높습니다.`,
      })
    } else if (excessRate > 10) {
      warnings.value.push({
        level: 'medium',
        title: '월세 초과',
        description: `전대차 월세가 원계약을 ${excessRate.toFixed(1)}% 초과합니다. 검토가 필요합니다.`,
      })
    } else {
      warnings.value.push({
        level: 'low',
        title: '월세 소폭 초과',
        description: `전대차 월세가 원계약을 ${excessRate.toFixed(1)}% 초과합니다.`,
      })
    }
  }

  // 관리비 경고
  if (contractInfo.subleaseMaintenanceFee > originalLeaseInfo.maintenanceFee) {
    const excess = contractInfo.subleaseMaintenanceFee - originalLeaseInfo.maintenanceFee
    const excessRate = (excess / originalLeaseInfo.maintenanceFee) * 100

    if (excessRate > 30) {
      warnings.value.push({
        level: 'medium',
        title: '관리비 대폭 초과',
        description: `전대차 관리비가 원계약을 ${excessRate.toFixed(1)}% 초과합니다.`,
      })
    } else {
      warnings.value.push({
        level: 'low',
        title: '관리비 초과',
        description: `전대차 관리비가 원계약을 ${excessRate.toFixed(1)}% 초과합니다.`,
      })
    }
  }

  // 동의 확인 경고
  if (!consentInfo.landlordConsent) {
    warnings.value.push({
      level: 'high',
      title: '동의 미확인',
      description: '원임대인의 전대 동의가 확인되지 않았습니다. 법적 요건을 충족하지 않습니다.',
    })
  }

  // 서면 동의서 경고
  if (consentInfo.landlordConsent && !consentInfo.writtenConsent) {
    warnings.value.push({
      level: 'medium',
      title: '서면 동의서 부족',
      description: '원임대인의 서면 동의서가 없습니다. 증빙 자료를 확보하세요.',
    })
  }

  // 계약 기간 경고
  if (contractInfo.subleasePeriod.startDate && contractInfo.subleasePeriod.endDate) {
    const subleaseStart = new Date(contractInfo.subleasePeriod.startDate)
    const subleaseEnd = new Date(contractInfo.subleasePeriod.endDate)

    if (originalLeaseInfo.period.startDate && originalLeaseInfo.period.endDate) {
      const originalStart = new Date(originalLeaseInfo.period.startDate)
      const originalEnd = new Date(originalLeaseInfo.period.endDate)

      if (subleaseStart < originalStart) {
        warnings.value.push({
          level: 'high',
          title: '계약 기간 범위 초과',
          description: '전대차 시작일이 원계약 시작일보다 빠릅니다.',
        })
      }

      if (subleaseEnd > originalEnd) {
        warnings.value.push({
          level: 'high',
          title: '계약 기간 범위 초과',
          description: '전대차 종료일이 원계약 종료일보다 늦습니다.',
        })
      }
    }
  }

  // 공과금 불일치 경고
  if (
    originalLeaseInfo.utilities.electricity !== contractInfo.utilities.electricity ||
    originalLeaseInfo.utilities.water !== contractInfo.utilities.water ||
    originalLeaseInfo.utilities.gas !== contractInfo.utilities.gas
  ) {
    warnings.value.push({
      level: 'medium',
      title: '공과금 납부 방식 불일치',
      description: '원계약과 전대차의 공과금 납부 방식이 다릅니다.',
    })
  }

  // 전대인 정보 누락 경고
  if (sublessorInfo.type === 'individual' && !sublessorInfo.individual.name) {
    warnings.value.push({
      level: 'medium',
      title: '전대인 정보 누락',
      description: '전대인의 정보가 입력되지 않았습니다.',
    })
  }

  // 전차인 정보 누락 경고
  if (sublesseeInfo.type === 'individual' && !sublesseeInfo.individual.name) {
    warnings.value.push({
      level: 'medium',
      title: '전차인 정보 누락',
      description: '전차인의 정보가 입력되지 않았습니다.',
    })
  }

  // 특약사항 경고
  if (
    !contractInfo.specialClauses.rentalProtection &&
    originalLeaseInfo.property.type === 'residential'
  ) {
    warnings.value.push({
      level: 'medium',
      title: '주택임대차보호법 미적용',
      description: '주택의 경우 주택임대차보호법 적용을 권장합니다.',
    })
  }

  // 법적 위험도 높은 경우
  const highRiskCount = warnings.value.filter((w) => w.level === 'high').length
  if (highRiskCount >= 3) {
    warnings.value.push({
      level: 'high',
      title: '법적 위험도 높음',
      description: '다수의 위험 요소가 발견되었습니다. 법률 검토를 권장합니다.',
    })
  }
}

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원'
}

const formatDateRange = (period: any) => {
  if (!period.startDate || !period.endDate) return '미정'
  return `${period.startDate} ~ ${period.endDate}`
}

const getComparisonStatus = (type: string) => {
  switch (type) {
    case 'deposit':
      if (contractInfo.subleaseDeposit <= originalLeaseInfo.deposit) return '적정'
      if (contractInfo.subleaseDeposit <= originalLeaseInfo.deposit * 1.1) return '주의'
      return '위험'
    case 'rent':
      if (contractInfo.subleaseRent <= originalLeaseInfo.rent) return '적정'
      if (contractInfo.subleaseRent <= originalLeaseInfo.rent * 1.1) return '주의'
      return '위험'
    case 'maintenance':
      if (contractInfo.subleaseMaintenanceFee <= originalLeaseInfo.maintenanceFee) return '적정'
      if (contractInfo.subleaseMaintenanceFee <= originalLeaseInfo.maintenanceFee * 1.2)
        return '주의'
      return '위험'
    case 'period':
      return '검토 필요'
    case 'utilities':
      return '확인 필요'
    default:
      return '확인 필요'
  }
}

const getComparisonStatusClass = (type: string) => {
  const status = getComparisonStatus(type)
  return status === '적정' ? 'status-ok' : 'status-warning'
}

// 비교 분석 함수들
const getComplianceCount = () => {
  let count = 0
  if (getComparisonStatus('deposit') === '적정') count++
  if (getComparisonStatus('rent') === '적정') count++
  if (getComparisonStatus('period') === '적정') count++
  if (getComparisonStatus('utilities') === '적정') count++
  return count
}

const getWarningCount = () => {
  let count = 0
  if (getComparisonStatus('deposit') === '주의') count++
  if (getComparisonStatus('rent') === '주의') count++
  if (getComparisonStatus('period') === '주의') count++
  if (getComparisonStatus('utilities') === '주의') count++
  return count
}

const getRiskCount = () => {
  let count = 0
  if (getComparisonStatus('deposit') === '위험') count++
  if (getComparisonStatus('rent') === '위험') count++
  if (getComparisonStatus('period') === '위험') count++
  if (getComparisonStatus('utilities') === '위험') count++
  return count
}

const getAmountDifferenceClass = (type: string) => {
  let difference = 0
  switch (type) {
    case 'deposit':
      difference = contractInfo.subleaseDeposit - originalLeaseInfo.deposit
      break
    case 'rent':
      difference = contractInfo.subleaseRent - originalLeaseInfo.rent
      break
    case 'maintenance':
      difference = contractInfo.subleaseMaintenanceFee - originalLeaseInfo.maintenanceFee
      break
  }
  return difference > 0 ? 'amount-increase' : difference < 0 ? 'amount-decrease' : 'amount-same'
}

const getComparisonAnalysis = (type: string) => {
  switch (type) {
    case 'deposit':
      if (contractInfo.subleaseDeposit > originalLeaseInfo.deposit) {
        return '전대차 보증금이 원계약을 초과합니다. 법적 위험이 있을 수 있습니다.'
      } else if (contractInfo.subleaseDeposit < originalLeaseInfo.deposit) {
        return '전대차 보증금이 원계약보다 낮습니다. 적정한 수준입니다.'
      } else {
        return '전대차 보증금이 원계약과 동일합니다.'
      }
    case 'rent':
      if (contractInfo.subleaseRent > originalLeaseInfo.rent) {
        return '전대차 월세가 원계약을 초과합니다. 법적 위험이 있을 수 있습니다.'
      } else if (contractInfo.subleaseRent < originalLeaseInfo.rent) {
        return '전대차 월세가 원계약보다 낮습니다. 적정한 수준입니다.'
      } else {
        return '전대차 월세가 원계약과 동일합니다.'
      }
    case 'maintenance':
      if (contractInfo.subleaseMaintenanceFee > originalLeaseInfo.maintenanceFee) {
        return '전대차 관리비가 원계약을 초과합니다. 검토가 필요합니다.'
      } else if (contractInfo.subleaseMaintenanceFee < originalLeaseInfo.maintenanceFee) {
        return '전대차 관리비가 원계약보다 낮습니다. 적정한 수준입니다.'
      } else {
        return '전대차 관리비가 원계약과 동일합니다.'
      }
    case 'period':
      return '계약 기간이 원계약 범위 내에 있는지 확인하세요.'
    case 'utilities':
      return '공과금 납부 방식이 원계약과 일치하는지 확인하세요.'
    default:
      return ''
  }
}

const getPeriodOverlap = () => {
  if (
    !originalLeaseInfo.period.startDate ||
    !originalLeaseInfo.period.endDate ||
    !contractInfo.subleasePeriod.startDate ||
    !contractInfo.subleasePeriod.endDate
  ) {
    return '기간 정보 부족'
  }

  const originalStart = new Date(originalLeaseInfo.period.startDate)
  const originalEnd = new Date(originalLeaseInfo.period.endDate)
  const subleaseStart = new Date(contractInfo.subleasePeriod.startDate)
  const subleaseEnd = new Date(contractInfo.subleasePeriod.endDate)

  if (subleaseStart >= originalStart && subleaseEnd <= originalEnd) {
    return '완전 포함'
  } else if (subleaseStart < originalStart || subleaseEnd > originalEnd) {
    return '범위 초과'
  } else {
    return '부분 겹침'
  }
}

const getOriginalUtilitiesText = () => {
  const utilities = []
  if (originalLeaseInfo.utilities.electricity) utilities.push('전기료')
  if (originalLeaseInfo.utilities.water) utilities.push('수도료')
  if (originalLeaseInfo.utilities.gas) utilities.push('가스료')
  return utilities.length > 0 ? utilities.join(', ') : '없음'
}

const getSubleaseUtilitiesText = () => {
  const utilities = []
  if (contractInfo.utilities.electricity) utilities.push('전기료')
  if (contractInfo.utilities.water) utilities.push('수도료')
  if (contractInfo.utilities.gas) utilities.push('가스료')
  return utilities.length > 0 ? utilities.join(', ') : '없음'
}

// 감시자
watch([() => contractInfo.subleaseDeposit, () => contractInfo.subleaseRent], () => {
  updateWarnings()
})

watch(
  () => consentInfo.landlordConsent,
  () => {
    updateWarnings()
  },
)

// 채팅 관련 함수들
const handleSendMessage = (message: string) => {
  // 채팅 메시지 전송 로직
  console.log('메시지 전송:', message)
}

const handleChatFileUpload = (file: File) => {
  // 채팅 파일 업로드 로직
  console.log('채팅 파일 업로드:', file)
}

function handleToggleRightSidebar() {
  // BaseHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QEView: 우측 사이드바 토글 이벤트 수신')
}
function handleToggleLeftSidebar() {
  // BaseHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QEView: 좌측 사이드바 토글 이벤트 수신')
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.qe-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-container {
  display: flex;
  height: 100%;
  gap: 1rem;
  padding: 1rem;
}

.left-panel {
  width: 300px;
  flex-shrink: 0;
}

.center-panel {
  margin-top: 60px;
  flex: 1;
  overflow-y: auto;
}

.right-panel {
  width: 350px;
  flex-shrink: 0;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 2rem;
  text-align: center;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #f8f9fa;
}

.section-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #3498db;
}

.sub-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
}

.sub-section-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #495057;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.15s ease-in-out;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 1rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.upload-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e8;
  border-radius: 4px;
  border-left: 4px solid #28a745;
}

.info-text {
  margin: 0.25rem 0;
  color: #155724;
}

.consent-verification {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.consent-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.comparison-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.comparison-item {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
}

.comparison-item h4 {
  margin: 0 0 0.5rem 0;
  color: #495057;
  font-size: 1rem;
}

.comparison-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.comparison-details p {
  margin: 0;
  font-size: 0.9rem;
}

.comparison-status {
  font-weight: bold;
  margin-top: 0.5rem;
}

.status-ok {
  color: #28a745;
}

.status-warning {
  color: #dc3545;
}

.no-comparison {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.warnings-section {
  margin-top: 1rem;
}

.warnings-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.warning-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid;
}

.warning-item.high {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.warning-item.medium {
  background: #fff3cd;
  border-left-color: #ffc107;
}

.warning-item.low {
  background: #d1ecf1;
  border-left-color: #17a2b8;
}

.warning-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: bold;
}

.warning-description {
  margin: 0;
  font-size: 0.9rem;
}

.no-warnings {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.special-clauses {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 1200px) {
  .layout-container {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
  }
}
</style>
