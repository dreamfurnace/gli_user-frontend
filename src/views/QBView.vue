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
          <h1 class="page-title">주택 임대차계약서</h1>

          <!-- 1. 임대 대상 부동산 정보 -->
          <section class="form-section">
            <h2 class="section-title">1. 임대 대상 부동산</h2>
            <div class="form-group">
              <label class="form-label">주소</label>
              <div class="address-input-group">
                <input
                  v-model="propertyInfo.address"
                  type="text"
                  class="form-input"
                  placeholder="부동산 주소를 입력하세요"
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

            <div class="property-details" v-if="propertyInfo.registrationDocument">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">소재지(동/호)</label>
                  <input v-model="propertyInfo.location" type="text" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">지목/면적</label>
                  <input v-model="propertyInfo.landInfo" type="text" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">건물 구조</label>
                <input v-model="propertyInfo.buildingInfo" type="text" class="form-input" />
              </div>
            </div>
          </section>

          <!-- 2. 임대인 정보 -->
          <section class="form-section">
            <h2 class="section-title">2. 임대인 정보</h2>
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

          <!-- 3. 임차인 정보 -->
          <section class="form-section">
            <h2 class="section-title">3. 임차인 정보</h2>
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

          <!-- 4. 보증금 및 지급일 -->
          <section class="form-section">
            <h2 class="section-title">4. 보증금 및 지급일</h2>
            <div class="form-group">
              <label class="form-label">총 보증금</label>
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

              <div
                class="deposit-item"
                v-for="(payment, index) in contractInfo.interimPayments"
                :key="index"
              >
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">중도금 {{ index + 1 }}</label>
                    <AmountInputComponent v-model="payment.amount" :required="true" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">지급일</label>
                    <DateInputComponent v-model="payment.date" :required="true" />
                  </div>
                  <button @click="removeInterimPayment(index)" class="btn btn-danger">삭제</button>
                </div>
              </div>

              <button @click="addInterimPayment" class="btn btn-secondary">+ 중도금 추가</button>

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
          </section>

          <!-- 5. 월세 조건 -->
          <section class="form-section">
            <h2 class="section-title">5. 월세 조건</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.hasMonthlyRent"
                  type="checkbox"
                  @change="handleMonthlyRentChange"
                />
                월세 있음
              </label>
            </div>

            <div v-if="contractInfo.hasMonthlyRent" class="monthly-rent-details">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">월세 금액</label>
                  <AmountInputComponent
                    v-model="contractInfo.monthlyRent.amount"
                    :required="true"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">지급일</label>
                  <input
                    v-model="contractInfo.monthlyRent.paymentDay"
                    type="number"
                    class="form-input"
                    min="1"
                    max="31"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">선불/후불</label>
                  <select v-model="contractInfo.monthlyRent.paymentType" class="form-input">
                    <option value="advance">선불</option>
                    <option value="arrears">후불</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- 6. 관리비 및 기타 부담 -->
          <section class="form-section">
            <h2 class="section-title">6. 관리비/기타 부담</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.hasMaintenanceFee"
                  type="checkbox"
                  @change="handleMaintenanceFeeChange"
                />
                관리비 있음
              </label>
            </div>

            <div v-if="contractInfo.hasMaintenanceFee" class="maintenance-fee-details">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">관리비</label>
                  <AmountInputComponent
                    v-model="contractInfo.maintenanceFee.amount"
                    :required="true"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">기타 비용</label>
                  <AmountInputComponent v-model="contractInfo.maintenanceFee.otherFees" />
                </div>
              </div>
            </div>
          </section>

          <!-- 7. 임대차 기간 -->
          <section class="form-section">
            <h2 class="section-title">7. 임대차 기간</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">시작일</label>
                <div class="start-date-group">
                  <DateInputComponent
                    v-model="contractInfo.leasePeriod.startDate"
                    :required="true"
                  />
                  <label class="checkbox-label">
                    <input
                      v-model="contractInfo.leasePeriod.startSameAsFinal"
                      type="checkbox"
                      @change="handleStartDateChange"
                    />
                    잔금일과 동일
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">종료일</label>
                <DateInputComponent v-model="contractInfo.leasePeriod.endDate" :required="true" />
              </div>
            </div>
          </section>

          <!-- 8. 등기부 저당권 등 확인 시 알림 -->
          <section class="form-section">
            <h2 class="section-title">8. 위험요소 확인</h2>
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
                  <input
                    v-model="contractInfo.mortgageOptions.landlordCancellation"
                    type="checkbox"
                  />
                  임대인 말소 예정
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.mortgageOptions.tenantAgreement" type="checkbox" />
                  유지 동의
                </label>
              </div>
            </div>
          </section>

          <!-- 9. 계좌 정보 -->
          <section class="form-section">
            <h2 class="section-title">9. 계좌 정보</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">은행</label>
                <input v-model="contractInfo.account.bank" type="text" class="form-input" />
              </div>
              <div class="form-group">
                <label class="form-label">계좌번호</label>
                <input v-model="contractInfo.account.number" type="text" class="form-input" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">예금주</label>
              <input v-model="contractInfo.account.holder" type="text" class="form-input" />
            </div>
          </section>

          <!-- 10. 필수 특약 -->
          <section class="form-section">
            <h2 class="section-title">10. 필수 특약</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="contractInfo.requiredClauses" type="checkbox" value="delivery" />
                인도 의무
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="contractInfo.requiredClauses" type="checkbox" value="maintenance" />
                유지보수 의무
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="contractInfo.requiredClauses" type="checkbox" value="payment" />
                임대료 지급 의무
              </label>
            </div>
          </section>

          <!-- 11. 추가 특약 -->
          <section class="form-section">
            <h2 class="section-title">11. 추가 특약</h2>
            <div class="form-group">
              <textarea
                v-model="contractInfo.additionalClauses"
                class="form-textarea"
                placeholder="예: 중도 해지 시 잔여 월세 정산 방식 등"
                rows="4"
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
  interimPayments: [] as Array<{ amount: number; date: string }>,
  finalPayment: { amount: 0, date: '' },
  hasMonthlyRent: false,
  monthlyRent: {
    amount: 0,
    paymentDay: 1,
    paymentType: 'advance' as 'advance' | 'arrears',
  },
  hasMaintenanceFee: false,
  maintenanceFee: {
    amount: 0,
    otherFees: 0,
  },
  leasePeriod: {
    startDate: '',
    endDate: '',
    startSameAsFinal: false,
  },
  riskFactors: {
    mortgage: false,
    attachment: false,
  },
  mortgageOptions: {
    landlordCancellation: false,
    tenantAgreement: false,
  },
  account: {
    bank: '',
    number: '',
    holder: '',
  },
  requiredClauses: [] as string[],
  additionalClauses: '',
})

// 부동산 정보
const propertyInfo = reactive({
  address: '',
  registrationDocument: null as File | null,
  location: '',
  landInfo: '',
  buildingInfo: '',
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

// 필수 특약사항
const requiredClauses = [
  {
    id: 'restoration',
    title: '임차인은 원상복구 의무가 있음',
    content: '임대차 종료 시 임차인은 임대목적물을 원상으로 복구할 의무가 있습니다.',
  },
  {
    id: 'pets',
    title: '반려동물 금지',
    content: '임대목적물 내에서 반려동물을 기르는 것을 금지합니다.',
  },
  {
    id: 'registration',
    title: '임대차 신고 협조',
    content: '임차인은 임대차 신고에 협조할 의무가 있습니다.',
  },
  {
    id: 'sublease',
    title: '전대차 금지',
    content: '임차인은 임대인의 동의 없이 전대차를 할 수 없습니다.',
  },
  {
    id: 'use',
    title: '목적 외 사용 금지',
    content: '임차인은 임대차 목적 외로 사용할 수 없습니다.',
  },
]

// 채팅 관련
const chatMessages = ref([])
const isTyping = ref(false)

// 이벤트 핸들러들
const handleStatusChange = (status: string) => {
  contractStatus.value = status
}

const handleSave = () => {
  // 저장 로직
  console.log('계약서 저장')
}

const handlePreview = () => {
  // 미리보기 로직
  console.log('계약서 미리보기')
}

const handleExport = () => {
  // 내보내기 로직
  console.log('계약서 내보내기')
}

const searchAddress = () => {
  // 주소 검색 로직
  console.log('주소 검색')
}

const handleRegistrationUpload = (file: File) => {
  propertyInfo.registrationDocument = file
}

const handleTextExtracted = (text: string) => {
  // 텍스트 추출 후 자동 입력 로직
  console.log('추출된 텍스트:', text)
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
  // 자동 계산 로직
  calculateDeposits()
}

const calculateDeposits = () => {
  // 보증금 자동 계산 로직
  const total = contractInfo.totalDeposit
  if (total > 0) {
    // 기본 계약금 10%
    contractInfo.downPayment.amount = Math.floor(total * 0.1)
    // 잔금 계산
    const interimTotal = contractInfo.interimPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    )
    contractInfo.finalPayment.amount = total - contractInfo.downPayment.amount - interimTotal
  }
}

const addInterimPayment = () => {
  contractInfo.interimPayments.push({ amount: 0, date: '' })
}

const removeInterimPayment = (index: number) => {
  contractInfo.interimPayments.splice(index, 1)
  calculateDeposits()
}

const handleMonthlyRentChange = () => {
  if (!contractInfo.hasMonthlyRent) {
    contractInfo.monthlyRent.amount = 0
  }
}

const handleMaintenanceFeeChange = () => {
  if (!contractInfo.hasMaintenanceFee) {
    contractInfo.maintenanceFee.amount = 0
    contractInfo.maintenanceFee.otherFees = 0
  }
}

const handleStartDateChange = () => {
  if (contractInfo.leasePeriod.startSameAsFinal) {
    contractInfo.leasePeriod.startDate = contractInfo.finalPayment.date
  }
}

const handleRequiredClausesUpdate = (clauses: string[]) => {
  contractInfo.requiredClauses = clauses
}

const handleSendMessage = (message: string) => {
  // 채팅 메시지 전송 로직
  console.log('메시지 전송:', message)
}

const handleChatFileUpload = (file: File) => {
  // 채팅 파일 업로드 로직
  console.log('채팅 파일 업로드:', file)
}

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()
const router = useRouter()

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
  console.log('QBView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })
})

function handleToggleRightSidebar() {
  // GLIHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QBView: 우측 사이드바 토글 이벤트 수신')
}
function handleToggleLeftSidebar() {
  // GLIHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QBView: 좌측 사이드바 토글 이벤트 수신')
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

.property-details {
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

.monthly-rent-details,
.maintenance-fee-details {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.start-date-group {
  display: flex;
  align-items: center;
  gap: 15px;
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

  .start-date-group {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
