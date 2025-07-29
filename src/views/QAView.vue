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
          <h1 class="page-title">부동산 매매계약서</h1>

          <!-- 1. 매매 대상 부동산 정보 -->
          <section class="form-section">
            <h2 class="section-title">1. 매매 대상 부동산 정보</h2>
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
                  <label class="form-label">토지 지목/면적</label>
                  <input v-model="propertyInfo.landInfo" type="text" class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">건물 구조/면적</label>
                <input v-model="propertyInfo.buildingInfo" type="text" class="form-input" />
              </div>
            </div>
          </section>

          <!-- 2. 매도인 정보 -->
          <section class="form-section">
            <h2 class="section-title">2. 매도인 정보</h2>
            <div class="form-group">
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    v-model="sellerInfo.type"
                    type="radio"
                    value="individual"
                    @change="handleSellerTypeChange"
                  />
                  개인
                </label>
                <label class="radio-label">
                  <input
                    v-model="sellerInfo.type"
                    type="radio"
                    value="corporate"
                    @change="handleSellerTypeChange"
                  />
                  법인
                </label>
              </div>
            </div>

            <div v-if="sellerInfo.type === 'individual'" class="seller-individual">
              <PersonInfoComponent
                v-model="sellerInfo.individual"
                :required="true"
                @update:model-value="handleSellerInfoUpdate"
              />
            </div>

            <div v-if="sellerInfo.type === 'corporate'" class="seller-corporate">
              <div class="form-group">
                <label class="form-label">법인등기부등본</label>
                <FileUploadComponent
                  v-model="sellerInfo.corporate.registrationDocument"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">법인인감증명서</label>
                <FileUploadComponent
                  v-model="sellerInfo.corporate.sealCertificate"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">회사명</label>
                  <input
                    v-model="sellerInfo.corporate.companyName"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">대표자</label>
                  <input
                    v-model="sellerInfo.corporate.representative"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">본점 주소</label>
                <input v-model="sellerInfo.corporate.address" type="text" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">사업자등록번호</label>
                  <input
                    v-model="sellerInfo.corporate.businessNumber"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">전화번호</label>
                  <input v-model="sellerInfo.corporate.phone" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </section>

          <!-- 3. 매수인 정보 -->
          <section class="form-section">
            <h2 class="section-title">3. 매수인 정보</h2>
            <div class="form-group">
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    v-model="buyerInfo.type"
                    type="radio"
                    value="individual"
                    @change="handleBuyerTypeChange"
                  />
                  개인
                </label>
                <label class="radio-label">
                  <input
                    v-model="buyerInfo.type"
                    type="radio"
                    value="corporate"
                    @change="handleBuyerTypeChange"
                  />
                  법인
                </label>
              </div>
            </div>

            <div v-if="buyerInfo.type === 'individual'" class="buyer-individual">
              <PersonInfoComponent
                v-model="buyerInfo.individual"
                :required="true"
                @update:model-value="handleBuyerInfoUpdate"
              />
            </div>

            <div v-if="buyerInfo.type === 'corporate'" class="buyer-corporate">
              <div class="form-group">
                <label class="form-label">법인등기부등본</label>
                <FileUploadComponent
                  v-model="buyerInfo.corporate.registrationDocument"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">법인인감증명서</label>
                <FileUploadComponent
                  v-model="buyerInfo.corporate.sealCertificate"
                  :accept="['.pdf', '.jpg', '.jpeg', '.png']"
                  :max-size="10"
                />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">회사명</label>
                  <input v-model="buyerInfo.corporate.companyName" type="text" class="form-input" />
                </div>
                <div class="form-group">
                  <label class="form-label">대표자</label>
                  <input
                    v-model="buyerInfo.corporate.representative"
                    type="text"
                    class="form-input"
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">본점 주소</label>
                <input v-model="buyerInfo.corporate.address" type="text" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">사업자등록번호</label>
                  <input
                    v-model="buyerInfo.corporate.businessNumber"
                    type="text"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">전화번호</label>
                  <input v-model="buyerInfo.corporate.phone" type="text" class="form-input" />
                </div>
              </div>
            </div>
          </section>

          <!-- 4. 매매대금 및 지급 일정 -->
          <section class="form-section">
            <h2 class="section-title">4. 매매대금 및 지급 일정</h2>
            <div class="form-group">
              <label class="form-label">총 매매대금</label>
              <AmountInputComponent
                v-model="contractInfo.totalAmount"
                :required="true"
                @update:model-value="handleTotalAmountChange"
              />
            </div>

            <div class="payment-schedule">
              <div class="payment-item">
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
                class="payment-item"
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

              <div class="payment-item">
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

              <div class="form-group">
                <label class="form-label">인도일</label>
                <div class="delivery-date-group">
                  <DateInputComponent v-model="contractInfo.deliveryDate" :required="true" />
                  <label class="checkbox-label">
                    <input
                      v-model="contractInfo.deliverySameAsFinal"
                      type="checkbox"
                      @change="handleDeliveryDateChange"
                    />
                    잔금일과 동일
                  </label>
                </div>
              </div>
            </div>
          </section>

          <!-- 5. 등기부 위험요소 확인 -->
          <section class="form-section">
            <h2 class="section-title">5. 등기부 위험요소 확인</h2>
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
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.riskFactors.tenant" type="checkbox" />
                  임차인 존재
                </label>
              </div>
            </div>

            <div
              v-if="contractInfo.riskFactors.mortgage || contractInfo.riskFactors.attachment"
              class="special-clauses"
            >
              <h3>특약 선택</h3>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    v-model="contractInfo.specialClauses.mortgageCancellation"
                    type="checkbox"
                  />
                  잔금일 말소
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.specialClauses.mortgageAssumption" type="checkbox" />
                  저당권 인수
                </label>
              </div>
            </div>
          </section>

          <!-- 6. 기존 임차인 존재 시 처리 옵션 -->
          <section v-if="contractInfo.riskFactors.tenant" class="form-section">
            <h2 class="section-title">6. 기존 임차인 존재 시</h2>
            <div class="tenant-options">
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.tenantOptions.vacantDelivery" type="checkbox" />
                  공실 인도
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.tenantOptions.tenantAssumption" type="checkbox" />
                  임차인 인수
                </label>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="contractInfo.tenantOptions.tenantEviction" type="checkbox" />
                  잔금 후 퇴거 예정
                </label>
              </div>
            </div>
          </section>

          <!-- 7. 계좌 정보 -->
          <section class="form-section">
            <h2 class="section-title">7. 계좌 정보</h2>
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

          <!-- 8. AI 추천 특약사항 -->
          <section class="form-section">
            <h2 class="section-title">8. AI 추천 특약사항</h2>
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="contractInfo.recommendedClauses"
                  type="checkbox"
                  value="registration"
                />
                소유권이전등기 의무
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="contractInfo.recommendedClauses" type="checkbox" value="delivery" />
                인도 의무
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input v-model="contractInfo.recommendedClauses" type="checkbox" value="payment" />
                매매대금 지급 의무
              </label>
            </div>
          </section>

          <!-- 9. 추가 특약 입력 -->
          <section class="form-section">
            <h2 class="section-title">9. 추가 특약사항</h2>
            <div class="form-group">
              <textarea
                v-model="contractInfo.additionalClauses"
                class="form-textarea"
                placeholder="직접 입력 (예: 중개보수 등)"
                rows="4"
              ></textarea>
            </div>
          </section>
        </div>
      </div>

      <!-- 우측 패널 -->
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
import BaseHeader from '@/components/BaseHeader.vue'
import LeftSidebar from '@/components/LeftSidebar.vue'
import RightSidebar from '@/components/RightSidebar.vue'
import '@/styles/layouts/contract-layout.css'

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()
const router = useRouter()

// 화면 진입 시 사이드바 비활성화
onMounted(async () => {
  console.log('QAView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })

  // 사용자 프로필 정보 최신화
  try {
    await auth.fetchProfile()
  } catch (error) {
    console.error('프로필 정보 가져오기 실패:', error)
  }
})

// 계약서 정보
const contractInfo = reactive({
  totalAmount: 0,
  downPayment: { amount: 0, date: '' },
  interimPayments: [] as Array<{ amount: number; date: string }>,
  finalPayment: { amount: 0, date: '' },
  deliveryDate: '',
  deliverySameAsFinal: false,
  riskFactors: {
    mortgage: false,
    attachment: false,
    tenant: false,
  },
  specialClauses: {
    mortgageCancellation: false,
    mortgageAssumption: false,
  },
  tenantOptions: {
    vacantDelivery: false,
    tenantAssumption: false,
    tenantEviction: false,
  },
  account: {
    bank: '',
    number: '',
    holder: '',
  },
  recommendedClauses: [] as string[],
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

// 매도인 정보
const sellerInfo = reactive({
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

// 매수인 정보
const buyerInfo = reactive({
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
      sellerInfo.type === 'individual'
        ? sellerInfo.individual.name
        : sellerInfo.corporate.companyName,
    role: '매도인',
  },
  {
    name:
      buyerInfo.type === 'individual' ? buyerInfo.individual.name : buyerInfo.corporate.companyName,
    role: '매수인',
  },
])

// AI 추천 특약사항
const recommendedClauses = [
  {
    id: 'ownership',
    title: '소유권은 잔금일에 이전한다',
    content: '매매대금의 잔금 지급과 동시에 소유권이 매수인에게 이전됩니다.',
  },
  {
    id: 'defect',
    title: '하자 고지 의무',
    content: '매도인은 매매목적물의 하자를 매수인에게 고지할 의무가 있습니다.',
  },
  {
    id: 'facility',
    title: '기존 시설 포함 인도',
    content: '매매목적물에 부착된 시설물은 매매대금에 포함되어 인도됩니다.',
  },
  {
    id: 'tax',
    title: '양도소득세 납부 의무',
    content: '매도인은 양도소득세를 납부할 의무가 있습니다.',
  },
  {
    id: 'registration',
    title: '소유권이전등기 의무',
    content: '매수인은 소유권이전등기를 신청할 의무가 있습니다.',
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

const handleSellerTypeChange = () => {
  // 매도인 타입 변경 처리
}

const handleBuyerTypeChange = () => {
  // 매수인 타입 변경 처리
}

const handleSellerInfoUpdate = (info: any) => {
  if (sellerInfo.type === 'individual') {
    sellerInfo.individual = info
  }
}

const handleBuyerInfoUpdate = (info: any) => {
  if (buyerInfo.type === 'individual') {
    buyerInfo.individual = info
  }
}

const handleTotalAmountChange = (amount: number) => {
  contractInfo.totalAmount = amount
  // 자동 계산 로직
  calculatePayments()
}

const calculatePayments = () => {
  // 매매대금 자동 계산 로직
  const total = contractInfo.totalAmount
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
  calculatePayments()
}

const handleDeliveryDateChange = () => {
  if (contractInfo.deliverySameAsFinal) {
    contractInfo.deliveryDate = contractInfo.finalPayment.date
  }
}

const handleRecommendedClausesUpdate = (clauses: string[]) => {
  contractInfo.recommendedClauses = clauses
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

function handleToggleRightSidebar() {
  // BaseHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QAView: 우측 사이드바 토글 이벤트 수신')
}
function handleToggleLeftSidebar() {
  // BaseHeader에서 이미 스토어를 토글했으므로 추가 토글 불필요
  console.log('QAView: 좌측 사이드바 토글 이벤트 수신')
}
</script>

<style scoped>
/* QAView 고유 스타일 */

.address-input-group {
  display: flex;
  gap: 10px;
}

.address-input-group .form-input {
  flex: 1;
}

.property-details {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.payment-schedule {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.payment-item {
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: #f8f9fa;
}

.delivery-date-group {
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

.tenant-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seller-individual,
.seller-corporate,
.buyer-individual,
.buyer-corporate {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  background-color: #f8f9fa;
}
</style>
