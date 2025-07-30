<template>
  <div class="contract-view">
    <GLIHeader
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
          <h1 class="page-title">상가 임대차계약서</h1>

          <!-- 1. 임대 대상 부동산 정보 -->
          <section class="form-section">
            <h2 class="section-title">1. 상가 대상 주소</h2>
            <div class="form-group">
              <label class="form-label">주소</label>
              <div class="address-input-group">
                <input
                  v-model="propertyInfo.address"
                  type="text"
                  class="form-input"
                  placeholder="상가 주소를 입력하세요"
                />
                <button @click="searchAddress" class="btn btn-secondary">주소 찾기</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">등기부등본 업로드</label>
              <FileUploadComponent
                v-model="propertyInfo.registrationDocument"
                :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                :max-size="10"
                @upload-success="handleRegistrationUpload"
                @text-extracted="handleTextExtracted"
              />
            </div>
          </section>

          <!-- 2. 임차 범위 -->
          <section class="form-section">
            <h2 class="section-title">2. 전체/일부 여부</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="propertyInfo.partialRent"
                  type="checkbox"
                  @change="handlePartialRentChange"
                />
                일부 임대 (도면 업로드)
              </label>
            </div>

            <div v-if="propertyInfo.partialRent" class="partial-rent-details">
              <div class="form-group">
                <label class="form-label">임차 범위 도면</label>
                <FileUploadComponent
                  v-model="propertyInfo.floorPlan"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">임차 면적 (㎡)</label>
                <input
                  v-model="propertyInfo.rentalArea"
                  type="number"
                  class="form-input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </section>

          <!-- 3. 임대인 정보 -->
          <section class="form-section">
            <h2 class="section-title">3. 임대인 정보</h2>
            <div class="form-group">
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    v-model="landlordInfo.type"
                    type="radio"
                    value="individual"
                    @change="handleLandlordTypeChange"
                  />
                  개인
                </label>
                <label class="radio-label">
                  <input
                    v-model="landlordInfo.type"
                    type="radio"
                    value="corporate"
                    @change="handleLandlordTypeChange"
                  />
                  법인
                </label>
              </div>
            </div>

            <div v-if="landlordInfo.type === 'individual'" class="landlord-individual">
              <PersonInfoComponent
                v-model="landlordInfo.individual"
                :required="true"
                @update:model-value="handleLandlordInfoUpdate"
              />
            </div>

            <div v-if="landlordInfo.type === 'corporate'" class="landlord-corporate">
              <div class="form-group">
                <label class="form-label">법인등기부등본</label>
                <FileUploadComponent
                  v-model="landlordInfo.corporate.registrationDocument"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">법인인감증명서</label>
                <FileUploadComponent
                  v-model="landlordInfo.corporate.sealCertificate"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">회사명</label>
                  <input
                    v-model="landlordInfo.corporate.companyName"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">대표자</label>
                  <input
                    v-model="landlordInfo.corporate.representative"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">본점 주소</label>
                <input v-model="landlordInfo.corporate.address" type="text" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">사업자등록번호</label>
                  <input
                    v-model="landlordInfo.corporate.businessNumber"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">전화번호</label>
                  <input v-model="landlordInfo.corporate.phone" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </section>

          <!-- 4. 임차인 정보 -->
          <section class="form-section">
            <h2 class="section-title">4. 임차인 정보</h2>
            <div class="form-group">
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    v-model="tenantInfo.type"
                    type="radio"
                    value="individual"
                    @change="handleTenantTypeChange"
                  />
                  개인
                </label>
                <label class="radio-label">
                  <input
                    v-model="tenantInfo.type"
                    type="radio"
                    value="corporate"
                    @change="handleTenantTypeChange"
                  />
                  법인
                </label>
              </div>
            </div>

            <div v-if="tenantInfo.type === 'individual'" class="tenant-individual">
              <PersonInfoComponent
                v-model="tenantInfo.individual"
                :required="true"
                @update:model-value="handleTenantInfoUpdate"
              />
            </div>

            <div v-if="tenantInfo.type === 'corporate'" class="tenant-corporate">
              <div class="form-group">
                <label class="form-label">법인등기부등본</label>
                <FileUploadComponent
                  v-model="tenantInfo.corporate.registrationDocument"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">법인인감증명서</label>
                <FileUploadComponent
                  v-model="tenantInfo.corporate.sealCertificate"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">회사명</label>
                  <input
                    v-model="tenantInfo.corporate.companyName"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">대표자</label>
                  <input
                    v-model="tenantInfo.corporate.representative"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">본점 주소</label>
                <input v-model="tenantInfo.corporate.address" type="text" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">사업자등록번호</label>
                  <input
                    v-model="tenantInfo.corporate.businessNumber"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">전화번호</label>
                  <input v-model="tenantInfo.corporate.phone" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </section>

          <!-- 5. 금액 정보 -->
          <section class="form-section">
            <h2 class="section-title">5. 보증금 / 차임</h2>
            <div class="form-group">
              <label class="form-label">보증금 총액</label>
              <AmountInputComponent
                v-model="contractInfo.totalDeposit"
                :required="true"
                @update:model-value="handleTotalDepositChange"
              />
            </div>

            <div class="deposit-schedule">
              <div class="deposit-item">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">계약금</label>
                    <AmountInputComponent
                      v-model="contractInfo.downPayment.amount"
                      :required="true"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">지급일</label>
                    <DateInputComponent v-model="contractInfo.downPayment.date" :required="true" />
                  </div>
                </div>
              </div>

              <div class="deposit-item">
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">잔금</label>
                    <AmountInputComponent
                      v-model="contractInfo.finalPayment.amount"
                      :required="true"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">지급일</label>
                    <DateInputComponent v-model="contractInfo.finalPayment.date" :required="true" />
                  </div>
                </div>
              </div>
            </div>

            <div class="rental-fee-section">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">차임(월세)</label>
                  <AmountInputComponent
                    v-model="contractInfo.monthlyRent.amount"
                    :required="true"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">매월</label>
                  <input
                    v-model="contractInfo.monthlyRent.paymentDay"
                    type="number"
                    class="form-input"
                    min="1"
                    max="31"
                  />
                  <span class="unit-text">일 지급</span>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">VAT 포함</label>
                  <select v-model="contractInfo.monthlyRent.vatIncluded" class="form-input">
                    <option value="included">포함</option>
                    <option value="excluded">불포함</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">입금계좌</label>
                  <input v-model="contractInfo.paymentAccount" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </section>

          <!-- 6. 관리비 상세 -->
          <section class="form-section">
            <h2 class="section-title">6. 관리비</h2>
            <div class="form-group">
              <label class="form-label">정액 여부</label>
              <select
                v-model="contractInfo.maintenanceFee.type"
                class="form-input"
                @change="handleMaintenanceFeeTypeChange"
              >
                <option value="fixed">정액</option>
                <option value="proportional">비례산정</option>
              </select>
            </div>

            <div class="maintenance-fee-details">
              <div class="form-group">
                <label class="form-label">총 관리비</label>
                <AmountInputComponent
                  v-model="contractInfo.maintenanceFee.totalAmount"
                  :required="true"
                />
              </div>

              <div v-if="contractInfo.maintenanceFee.type === 'fixed'" class="fixed-fee-details">
                <h4>세부항목</h4>
                <div class="fee-items">
                  <div
                    class="fee-item"
                    v-for="(item, index) in contractInfo.maintenanceFee.items"
                    :key="index"
                  >
                    <div class="form-row">
                      <div class="form-group">
                        <label class="form-label">항목명</label>
                        <input v-model="item.name" type="text" class="form-input" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">금액</label>
                        <AmountInputComponent v-model="item.amount" />
                      </div>
                      <button @click="removeMaintenanceFeeItem(index)" class="btn btn-danger">
                        삭제
                      </button>
                    </div>
                  </div>
                  <button @click="addMaintenanceFeeItem" class="btn btn-secondary">
                    + 항목 추가
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- 7. 공과금 직접 납부 여부 -->
          <section class="form-section">
            <h2 class="section-title">7. 공과금 직접 납부</h2>
            <div class="utility-payment-options">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.directPayment.electricity" type="checkbox" />
                  전기료
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.directPayment.water" type="checkbox" />
                  수도료
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.directPayment.gas" type="checkbox" />
                  가스료
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.directPayment.other" type="checkbox" />
                  기타 (직접입력)
                </label>
              </div>
              <div v-if="contractInfo.directPayment.other" class="form-group">
                <input
                  v-model="contractInfo.directPayment.otherDetails"
                  type="text"
                  class="form-input"
                  placeholder="기타 공과금 항목"
                />
              </div>
            </div>
          </section>

          <!-- 8. 계약 기간 -->
          <section class="form-section">
            <h2 class="section-title">8. 계약 기간</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">개시일</label>
                <DateInputComponent v-model="contractInfo.leasePeriod.startDate" :required="true" />
              </div>
              <div class="form-group">
                <label class="form-label">종료일</label>
                <DateInputComponent v-model="contractInfo.leasePeriod.endDate" :required="true" />
              </div>
            </div>
          </section>

          <!-- 9. 사용 목적 -->
          <section class="form-section">
            <h2 class="section-title">9. 사용 용도</h2>
            <div class="form-group">
              <label class="form-label">임차 용도</label>
              <input
                v-model="contractInfo.usagePurpose"
                type="text"
                class="form-input"
                placeholder="예: 음식점 영업 목적"
              />
            </div>
          </section>

          <!-- 10. 등기부 상 위험요소 존재 시 팝업 대응 -->
          <section class="form-section">
            <h2 class="section-title">10. 저당권 대응 특약</h2>
            <div class="risk-factors">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.riskFactors.mortgage" type="checkbox" />
                  저당권 존재
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.riskFactors.attachment" type="checkbox" />
                  가압류 존재
                </label>
              </div>
            </div>

            <div
              v-if="contractInfo.riskFactors.mortgage || contractInfo.riskFactors.attachment"
              class="special-clauses"
            >
              <h3>저당권 처리 방안</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.mortgageOptions.cancellation" type="checkbox" />
                  말소
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.mortgageOptions.agreement" type="checkbox" />
                  유지 동의
                </label>
              </div>
            </div>
          </section>

          <!-- 11. AI 추천 특약 -->
          <section class="form-section">
            <h2 class="section-title">11. AI 추천 특약</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.recommendedClauses"
                  type="checkbox"
                  value="maintenance"
                />
                관리비 분리
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.recommendedClauses"
                  type="checkbox"
                  value="restoration"
                />
                원상복구 의무
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.recommendedClauses"
                  type="checkbox"
                  value="insurance"
                />
                보험 가입 의무
              </label>
            </div>
          </section>

          <!-- 12. 추가 특약 -->
          <section class="form-section">
            <h2 class="section-title">12. 추가 특약</h2>
            <div class="form-group">
              <textarea
                v-model="contractInfo.additionalClauses"
                class="form-textarea"
                placeholder="예: 원상복구 항목 지정 등"
                rows="4"
              ></textarea>
            </div>
          </section>

          <!-- 계산 결과 표시 -->
          <section class="form-section calculation-results">
            <h2 class="section-title">계산 결과</h2>
            <div class="calculation-grid">
              <div class="calculation-item">
                <label>환산보증금</label>
                <span class="amount">{{ formatCurrency(convertedDeposit) }}</span>
              </div>
              <div class="calculation-item">
                <label>보호법 적용 여부</label>
                <span class="status" :class="protectionLawStatus.class">{{
                  protectionLawStatus.text
                }}</span>
              </div>
              <div class="calculation-item">
                <label
                  >월세 (VAT
                  {{
                    contractInfo.monthlyRent.vatIncluded === 'included' ? '포함' : '불포함'
                  }})</label
                >
                <span class="amount">{{ formatCurrency(monthlyRentWithVAT) }}</span>
              </div>
              <div class="calculation-item">
                <label>총 관리비</label>
                <span class="amount">{{ formatCurrency(totalMaintenanceFee) }}</span>
              </div>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { useAuthStore } from '@/stores/auth'
import LeftPanelComponent from '@/components/LeftPanelComponent.vue'
import PersonInfoComponent from '@/components/PersonInfoComponent.vue'
import AmountInputComponent from '@/components/AmountInputComponent.vue'
import DateInputComponent from '@/components/DateInputComponent.vue'
import FileUploadComponent from '@/components/FileUploadComponent.vue'
import GLIHeader from '@/components/GLIHeader.vue'
import LeftSidebar from '@/components/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar.vue'
import '@/styles/layouts/contract-layout.css'

// 계약서 정보
const contractInfo = reactive({
  totalDeposit: 0,
  downPayment: { amount: 0, date: '' },
  finalPayment: { amount: 0, date: '' },
  monthlyRent: {
    amount: 0,
    paymentDay: 1,
    vatIncluded: 'included' as 'included' | 'excluded',
  },
  maintenanceFee: {
    type: 'fixed' as 'fixed' | 'proportional',
    totalAmount: 0,
    items: [] as Array<{ name: string; amount: number }>,
  },
  directPayment: {
    electricity: false,
    water: false,
    gas: false,
    other: false,
    otherDetails: '',
  },
  leasePeriod: {
    startDate: '',
    endDate: '',
  },
  usagePurpose: '',
  riskFactors: {
    mortgage: false,
    attachment: false,
  },
  mortgageOptions: {
    cancellation: false,
    agreement: false,
  },
  recommendedClauses: [] as string[],
  additionalClauses: '',
  paymentAccount: '',
})

// 부동산 정보
const propertyInfo = reactive({
  address: '',
  registrationDocument: null as File | null,
  partialRent: false,
  floorPlan: null as File | null,
  rentalArea: 0,
})

// 임대인 정보
const landlordInfo = reactive({
  type: 'individual' as 'individual' | 'corporate',
  individual: {
    name: '',
    address: '',
    residentNumber: '',
    phone: '',
  },
  corporate: {
    registrationDocument: null as File | null,
    sealCertificate: null as File | null,
    companyName: '',
    representative: '',
    address: '',
    businessNumber: '',
    phone: '',
  },
})

// 임차인 정보
const tenantInfo = reactive({
  type: 'individual' as 'individual' | 'corporate',
  individual: {
    name: '',
    address: '',
    residentNumber: '',
    phone: '',
  },
  corporate: {
    registrationDocument: null as File | null,
    sealCertificate: null as File | null,
    companyName: '',
    representative: '',
    address: '',
    businessNumber: '',
    phone: '',
  },
})

// 계약서 상태
const contractStatus = ref('draft')

// 작성자 정보
const authors = computed(() => [
  {
    name:
      landlordInfo.type === 'individual'
        ? landlordInfo.individual.name
        : landlordInfo.corporate.companyName,
    role: '임대인',
  },
  {
    name:
      tenantInfo.type === 'individual'
        ? tenantInfo.individual.name
        : tenantInfo.corporate.companyName,
    role: '임차인',
  },
])

// AI 추천 특약사항
const recommendedClauses = [
  {
    id: 'pandemic',
    title: '감염병 해지권',
    content: '감염병 등으로 인한 영업 중단 시 계약 해지권을 보장합니다.',
  },
  {
    id: 'rights',
    title: '권리금 회수 기회 보장',
    content: '계약 종료 시 권리금 회수 기회를 보장합니다.',
  },
  { id: 'overdue', title: '연체 면책 조건', content: '합리적인 연체 면책 조건을 설정합니다.' },
  {
    id: 'restoration',
    title: '원상복구 의무',
    content: '임대차 종료 시 원상복구 의무를 명시합니다.',
  },
  {
    id: 'sublease',
    title: '전대차 제한',
    content: '임대인의 동의 없이 전대차를 할 수 없음을 명시합니다.',
  },
]

// 채팅 관련
const chatMessages = ref([])
const isTyping = ref(false)

// 계산된 값들
const convertedDeposit = computed(() => {
  // 환산보증금 = 보증금 + (월세 × 12개월)
  return contractInfo.totalDeposit + contractInfo.monthlyRent.amount * 12
})

const protectionLawStatus = computed(() => {
  // 상가건물 임대차보호법 적용 여부 판단
  // 보증금 1억원 초과 시 적용
  if (convertedDeposit.value > 100000000) {
    return { text: '보호법 미적용', class: 'not-applied' }
  } else {
    return { text: '보호법 적용', class: 'applied' }
  }
})

const monthlyRentWithVAT = computed(() => {
  if (contractInfo.monthlyRent.vatIncluded === 'included') {
    return contractInfo.monthlyRent.amount
  } else {
    return Math.floor(contractInfo.monthlyRent.amount * 1.1) // VAT 10% 추가
  }
})

const totalMaintenanceFee = computed(() => {
  if (contractInfo.maintenanceFee.type === 'fixed') {
    return contractInfo.maintenanceFee.totalAmount
  } else {
    // 비례산정 로직 (임차면적 비례)
    const totalArea = 100 // 전체 면적 (실제로는 입력받아야 함)
    const rentalArea = propertyInfo.rentalArea || totalArea
    return Math.floor((contractInfo.maintenanceFee.totalAmount * rentalArea) / totalArea)
  }
})

// 유틸리티 함수
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

// 이벤트 핸들러들
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

const searchAddress = () => {
  console.log('주소 검색')
}

const handleRegistrationUpload = (file: File) => {
  propertyInfo.registrationDocument = file
}

const handleTextExtracted = (text: string) => {
  console.log('추출된 텍스트:', text)
}

const handlePartialRentChange = () => {
  if (!propertyInfo.partialRent) {
    propertyInfo.floorPlan = null
    propertyInfo.rentalArea = 0
  }
}

const handleLandlordTypeChange = () => {
  // 임대인 타입 변경 처리
}

const handleTenantTypeChange = () => {
  // 임차인 타입 변경 처리
}

const handleLandlordInfoUpdate = (info: any) => {
  if (landlordInfo.type === 'individual') {
    landlordInfo.individual = info
  }
}

const handleTenantInfoUpdate = (info: any) => {
  if (tenantInfo.type === 'individual') {
    tenantInfo.individual = info
  }
}

const handleTotalDepositChange = (amount: number) => {
  contractInfo.totalDeposit = amount
  calculateDeposits()
}

const calculateDeposits = () => {
  const total = contractInfo.totalDeposit
  if (total > 0) {
    // 기본 계약금 10%
    contractInfo.downPayment.amount = Math.floor(total * 0.1)
    // 잔금 계산
    contractInfo.finalPayment.amount = total - contractInfo.downPayment.amount
  }
}

const handleMaintenanceFeeTypeChange = () => {
  if (contractInfo.maintenanceFee.type === 'proportional') {
    // 비례산정 시 세부항목 초기화
    contractInfo.maintenanceFee.items = []
  }
}

const addMaintenanceFeeItem = () => {
  contractInfo.maintenanceFee.items.push({ name: '', amount: 0 })
}

const removeMaintenanceFeeItem = (index: number) => {
  contractInfo.maintenanceFee.items.splice(index, 1)
}

const handleRecommendedClausesUpdate = (clauses: string[]) => {
  contractInfo.recommendedClauses = clauses
}

const handleSendMessage = (message: string) => {
  console.log('메시지 전송:', message)
}

const handleChatFileUpload = (file: File) => {
  console.log('채팅 파일 업로드:', file)
}

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}

const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()
const router = useRouter()

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
  console.log('QCView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })
})

function handleToggleRightSidebar() {
  // GLIHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QCView: 우측 사이드바 토글 이벤트 수신')
}
function handleToggleLeftSidebar() {
  // GLIHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QCView: 좌측 사이드바 토글 이벤트 수신')
}
</script>

<style scoped>
.contract-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 300px;
  border-right: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.center-panel {
  margin-top: 60px;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #ffffff;
}

.right-panel {
  width: 350px;
  border-left: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.form-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
  text-align: center;
}

.form-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #007bff;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-end;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.form-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.address-input-group {
  display: flex;
  gap: 10px;
}

.address-input-group .form-input {
  flex: 1;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
}

.partial-rent-details {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.deposit-schedule {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.deposit-item {
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.rental-fee-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.unit-text {
  margin-left: 5px;
  color: #666;
}

.maintenance-fee-details {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.fixed-fee-details {
  margin-top: 15px;
}

.fixed-fee-details h4 {
  margin-bottom: 15px;
  color: #333;
}

.fee-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.fee-item {
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: #ffffff;
}

.utility-payment-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-factors {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.special-clauses {
  margin-top: 20px;
  padding: 15px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
}

.special-clauses h3 {
  margin-bottom: 15px;
  color: #856404;
}

.landlord-individual,
.landlord-corporate,
.tenant-individual,
.tenant-corporate {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.calculation-results {
  background-color: #e8f5e8;
  border-color: #28a745;
}

.calculation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.calculation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.calculation-item label {
  font-weight: 600;
  color: #333;
}

.calculation-item .amount {
  font-size: 18px;
  font-weight: bold;
  color: #28a745;
}

.calculation-item .status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.calculation-item .status.applied {
  background-color: #d4edda;
  color: #155724;
}

.calculation-item .status.not-applied {
  background-color: #f8d7da;
  color: #721c24;
}

@media (max-width: 1200px) {
  .layout-container {
    flex-direction: column;
  }

  .left-panel,
  .right-panel {
    width: 100%;
    height: auto;
  }

  .center-panel {
    order: 2;
  }
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }

  .address-input-group {
    flex-direction: column;
  }

  .calculation-grid {
    grid-template-columns: 1fr;
  }
}
</style>
