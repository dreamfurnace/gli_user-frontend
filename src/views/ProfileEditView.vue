<template>
  <div class="profile-edit-container">
    <Header
      @toggleLeftSidebar="handleToggleLeftSidebar"
      @toggleRightSidebar="handleToggleRightSidebar"
    />
    <LeftSidebar :isHidden="leftSidebarHidden" />
    <RightSidebar
      :isHidden="rightSidebarHidden"
      @toggleSidebar="handleToggleRightSidebar"
      @logout="handleLogout"
    />
    <div class="main-content" :class="{ 'sidebar-hidden': leftSidebarHidden }">
      <div class="profile-edit-wrapper">
        <div class="profile-header">
          <div class="profile-image-section">
            <div class="profile-image-wrapper">
              <img
                :src="
                  avatarPreview ||
                  ((profileData.profile_image_url ?? '')
                    ? (profileData.profile_image_url ?? '').startsWith('/media/')
                      ? (profileData.profile_image_url ?? '')
                      : (profileData.profile_image_url ?? '')
                    : '/src/assets/sample_profile.jpg')
                "
                alt="프로필 이미지"
                class="profile-image"
                @click="triggerImageUpload"
              />
              <!-- 업로드 진행률 표시 -->
              <div v-if="isAvatarUploading" class="upload-progress-overlay">
                <div class="upload-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: avatarUploadProgress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ avatarUploadProgress }}%</span>
                </div>
              </div>
            </div>
            <label class="image-upload-label" @click="triggerImageUpload" title="프로필 사진 변경"
              >📷</label
            >
            <button class="image-delete-btn" @click="handleDeleteAvatar" title="프로필 사진 삭제">
              🗑️
            </button>
            <input
              ref="imageInput"
              type="file"
              accept="image/*"
              class="image-upload-input"
              @change="handleImageUpload"
            />
          </div>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- 기본 정보 섹션 -->
          <div class="form-section">
            <h2 class="form-section-title">기본 정보</h2>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">아이디</label>
                <input type="text" class="form-input" :value="profileData.email" readonly />
                <div class="account-type">
                  <i class="icon-email">📧</i>
                  {{ getAccountTypeDisplay(profileData.account_type) }} 계정
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">이름</label>
                <input
                  v-model="profileData.name"
                  type="text"
                  class="form-input"
                  :class="{ error: formErrors.name }"
                  required
                />
                <div v-if="formErrors.name" class="field-error">{{ formErrors.name }}</div>
              </div>
            </div>
          </div>

          <!-- 계정 보안 섹션 -->
          <div class="form-section">
            <h2 class="form-section-title">계정 보안</h2>
            <div class="form-group">
              <label class="form-label">현재 비밀번호</label>
              <input
                v-model="passwordData.currentPassword"
                type="password"
                class="form-input"
                placeholder="현재 비밀번호 입력"
              />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">새 비밀번호</label>
                <input
                  v-model="passwordData.newPassword"
                  type="password"
                  class="form-input"
                  placeholder="새 비밀번호 입력"
                />
              </div>
              <div class="form-group">
                <label class="form-label">새 비밀번호 확인</label>
                <input
                  v-model="passwordData.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="새 비밀번호 다시 입력"
                />
              </div>
            </div>
            <div class="form-group" style="text-align: right; margin-top: 10px">
              <button
                type="button"
                class="btn btn-secondary"
                @click="handlePasswordChange"
                :disabled="!isPasswordFormValid"
              >
                비밀번호 변경하기
              </button>
            </div>
          </div>

          <!-- 본인 인증 섹션 -->
          <div class="form-section verification-section">
            <div class="section-header">
              <h2 class="form-section-title">본인 인증</h2>
              <div
                class="verification-checkbox"
                :class="{ verified: profileData.is_phone_verified }"
              >
                <i v-if="profileData.is_phone_verified" class="check-icon">✓</i>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">휴대폰 번호</label>
                <input
                  type="text"
                  class="form-input"
                  :value="
                    profileData.is_phone_verified ? maskPhoneNumber(profileData.phone ?? '') : ''
                  "
                  :placeholder="profileData.is_phone_verified ? '' : '본인 인증을 완료해주세요'"
                  readonly
                />
              </div>
              <div class="form-group">
                <label class="form-label" style="opacity: 0">본인 인증</label>
                <button
                  type="button"
                  class="form-input verification-btn"
                  @click="showPhoneModal = true"
                >
                  {{ profileData.is_phone_verified ? '본인인증 다시 하기' : '본인인증 하기' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 본인 인증 임시 모달 -->
          <div v-if="showPhoneModal" class="modal-overlay">
            <div class="modal-content">
              <h3>임시 본인 인증</h3>
              <p>임시로 본인 인증을 완료하시겠습니까?</p>
              <button class="btn btn-primary" @click="handleTempPhoneVerify">
                임시 본인 인증 완료
              </button>
              <button class="btn btn-secondary" @click="showPhoneModal = false">닫기</button>
            </div>
          </div>

          <!-- 결제 수단 정보 섹션 -->
          <div class="form-section payment-section">
            <div class="section-header">
              <h2 class="form-section-title">결제 수단 정보</h2>
              <div
                class="verification-checkbox"
                :class="{ verified: profileData.payment_method_registered }"
              >
                <i v-if="profileData.payment_method_registered" class="check-icon">✓</i>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">카드 번호</label>
                <input
                  type="text"
                  class="form-input"
                  :value="
                    profileData.payment_method_registered ? profileData.payment_card_number : ''
                  "
                  :placeholder="
                    profileData.payment_method_registered ? '' : '결제 수단을 등록해주세요'
                  "
                  readonly
                />
              </div>
              <div class="form-group">
                <label class="form-label" style="opacity: 0">결제 수단</label>
                <button
                  type="button"
                  class="form-input payment-btn"
                  @click="showPaymentModal = true"
                >
                  {{
                    profileData.payment_method_registered
                      ? '결제 수단 등록 다시하기'
                      : '결제 수단 등록하기'
                  }}
                </button>
              </div>
            </div>
          </div>

          <!-- 결제 수단 임시 모달 -->
          <div v-if="showPaymentModal" class="modal-overlay">
            <div class="modal-content">
              <h3>임시 결제 수단 등록</h3>
              <p>임시로 결제 수단을 등록하시겠습니까?</p>
              <button class="btn btn-primary" @click="handleTempPaymentRegister">
                임시 결제 수단 등록 완료
              </button>
              <button class="btn btn-secondary" @click="showPaymentModal = false">닫기</button>
            </div>
          </div>

          <!-- 구독 정보 섹션 -->
          <div class="form-section">
            <h2 class="form-section-title">구독 정보</h2>
            <div class="subscription-container">
              <div
                v-for="plan in subscriptionPlans"
                :key="plan.type"
                class="subscription-info"
                :class="{ active: profileData.subscription_type === plan.type }"
              >
                <div class="subscription-type">{{ plan.name }}</div>
                <div class="subscription-status">{{ plan.status }}</div>
                <div class="subscription-features" v-html="plan.features"></div>
                <button
                  type="button"
                  class="subscription-change"
                  @click="handleSubscriptionChange(plan.type)"
                >
                  {{ plan.buttonText }}
                </button>
              </div>
            </div>

            <!-- 메시지 표시 -->
            <div v-if="error" class="error-message">{{ error }}</div>
            <div v-if="success" class="success-message">{{ success }}</div>

            <!-- 액션 버튼 -->
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="handleCancel">취소</button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading || !isFormValidExtended"
              >
                {{ loading ? '저장 중...' : '저장' }}
              </button>
            </div>
          </div>

          <!-- 회원 탈퇴 -->
          <div class="delete-account">
            <a href="#" class="delete-link" @click.prevent="handleDeleteAccount">회원 탈퇴</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Header from '../components/BaseHeader.vue'
import LeftSidebar from '../components/LeftSidebar.vue'
import RightSidebar from '../components/RightSidebar.vue'
import { useProfileEditStore } from '@/stores/profileEditStore'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { profileAPI } from '@/services/api'
import type { ProfileData } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
  console.log('ProfileEditView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })
})

// 사이드바 상태를 computed로 만들어 반응형으로 변경
const leftSidebarHidden = computed(() => sideMenuStore.leftSidebarHidden)
const rightSidebarHidden = computed(() => sideMenuStore.rightSidebarHidden)

const handleToggleLeftSidebar = () => {
  console.log('ProfileEditView: handleToggleLeftSidebar 호출됨')
  console.log('ProfileEditView: 좌측 사이드바 상태:', sideMenuStore.leftSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const handleToggleRightSidebar = () => {
  console.log('ProfileEditView: handleToggleRightSidebar 호출됨')
  console.log('ProfileEditView: 우측 사이드바 상태:', sideMenuStore.rightSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const handleLogout = async () => {
  try {
    console.log('로그아웃 시작')

    const authStore = useAuthStore()
    await authStore.logout()

    console.log('로그아웃 완료, 로그인 페이지로 이동')
    router.push('/login')
  } catch (error) {
    console.error('로그아웃 중 오류:', error)
    // 오류가 발생해도 로그인 페이지로 이동
    router.push('/login')
  }
}

const router = useRouter()
const profileEditStore = useProfileEditStore()
const { profileData, loading, error, success, isFormValid } = storeToRefs(profileEditStore)
const { fetchProfile, updateProfile, uploadAvatar, updateProfileImage, clearMessages } =
  profileEditStore

// 폼 변경 상태 추적
const originalProfileData = ref<ProfileData | null>(null)
const isFormDirty = computed(() => {
  if (!originalProfileData.value) return false
  return (
    profileData.value.name !== originalProfileData.value.name ||
    profileData.value.phone !== originalProfileData.value.phone ||
    profileData.value.subscription_type !== originalProfileData.value.subscription_type
  )
})

// 폼 유효성 검사
const formErrors = ref<Record<string, string>>({})
const isFormValidExtended = computed(() => {
  return isFormValid.value && Object.keys(formErrors.value).length === 0 && isFormDirty.value
})

const imageInput = ref<HTMLInputElement>()

// 아바타 업로드 관련 상태
const avatarPreview = ref<string | null>(null)
const avatarUploadProgress = ref(0)
const isAvatarUploading = ref(false)
const avatarError = ref<string | null>(null)

// 비밀번호 변경 데이터
const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 구독 플랜 정보
const subscriptionPlans = ref([
  {
    type: 'free',
    name: 'Free',
    status: '현재 무료 체험 중',
    features: '- 등기 분석 5건/월<br>- 기본 계약서 미리보기<br>- AI 상담 3회 제공',
    buttonText: '요금제 변경',
  },
  {
    type: 'standard',
    name: 'Standard',
    status: '월 39,000원',
    features: '- 등기 분석 무제한<br>- 판례 검색 가능<br>- 계약서 생성 10건/월',
    buttonText: '변경하기',
  },
  {
    type: 'pro',
    name: 'Pro',
    status: '월 99,000원',
    features:
      '- 고급 등기 AI 분석<br>- 판례 유사도 기반 추천<br>- 계약서 작성 + 인쇄 지원<br>- 팀 공유 기능 포함',
    buttonText: '변경하기',
  },
  {
    type: 'enterprise',
    name: 'Enterprise',
    status: '문의 필요',
    features: '- 전자서명 연동<br>- API 연동 서비스<br>- 데이터 내재화 컨설팅 포함',
    buttonText: '문의하기',
  },
])

// 비밀번호 폼 유효성 검사
const isPasswordFormValid = computed(() => {
  return (
    passwordData.value.currentPassword &&
    passwordData.value.newPassword &&
    passwordData.value.confirmPassword &&
    passwordData.value.newPassword === passwordData.value.confirmPassword
  )
})

onMounted(async () => {
  await fetchProfile()
  // 원본 데이터 저장
  originalProfileData.value = { ...profileData.value }
})

// 폼 유효성 검사 함수
function validateForm() {
  formErrors.value = {}

  // 이름 검증
  if (!(profileData.value.name ?? '').trim()) {
    formErrors.value.name = '이름을 입력해주세요.'
  } else if ((profileData.value.name ?? '').trim().length < 2) {
    formErrors.value.name = '이름은 2자 이상 입력해주세요.'
  }

  // 휴대폰 번호 검증
  if (profileData.value.phone) {
    const phonePattern = /^01[0-9]-\d{3,4}-\d{4}$/
    if (!phonePattern.test(profileData.value.phone ?? '')) {
      formErrors.value.phone = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)'
    }
  }

  return Object.keys(formErrors.value).length === 0
}

function triggerImageUpload() {
  imageInput.value?.click()
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  console.log('[DEBUG] handleImageUpload 호출됨')
  console.log('[DEBUG] 파일 정보:', { name: file.name, size: file.size, type: file.type })

  // 파일 검증
  const validationError = validateImageFile(file)
  if (validationError) {
    avatarError.value = validationError
    setTimeout(() => {
      avatarError.value = null
    }, 3000)
    target.value = ''
    return
  }

  // 이미지 미리보기 생성
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
    console.log('avatarPreview set:', avatarPreview.value)
  }
  reader.readAsDataURL(file)

  // 업로드 진행
  try {
    isAvatarUploading.value = true
    avatarUploadProgress.value = 0
    avatarError.value = null

    // 진행률 시뮬레이션 (실제로는 axios의 onUploadProgress 사용)
    const progressInterval = setInterval(() => {
      if (avatarUploadProgress.value < 90) {
        avatarUploadProgress.value += 10
      }
    }, 100)

    console.log('[DEBUG] uploadAvatar 함수 호출 전')
    await uploadAvatar(file)
    console.log('[DEBUG] uploadAvatar 함수 호출 완료')

    clearInterval(progressInterval)
    avatarUploadProgress.value = 100

    // 업로드 성공 후 프로필 정보 새로고침
    await fetchProfile()
    // fetchProfile()이 끝난 뒤에만 미리보기 제거
    avatarPreview.value = null

    setTimeout(() => {
      clearMessages()
      avatarUploadProgress.value = 0
    }, 2000)
  } catch (err: any) {
    console.error('아바타 업로드 실패:', err)
    console.error('에러 응답:', err.response)
    avatarError.value = err.response?.data?.message || '아바타 업로드에 실패했습니다.'
    avatarPreview.value = null
  } finally {
    isAvatarUploading.value = false
    target.value = ''
  }
}

// 이미지 파일 검증
function validateImageFile(file: File): string | null {
  // 파일 크기 검증 (5MB 제한)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return '파일 크기는 5MB 이하여야 합니다.'
  }

  // 파일 타입 검증
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return 'JPG, PNG, GIF 형식의 이미지만 업로드 가능합니다.'
  }

  return null
}

async function handleSubmit() {
  try {
    // 폼 유효성 검사
    if (!validateForm()) {
      return
    }

    // 변경사항이 없으면 API 호출하지 않음
    if (!isFormDirty.value) {
      alert('변경된 내용이 없습니다.')
      return
    }

    // 업데이트할 데이터만 추출
    const updateData = {
      name: profileData.value.name,
      phone: profileData.value.phone,
      subscription_type: profileData.value.subscription_type,
      subscription_status: profileData.value.subscription_status,
    }

    const response = await profileAPI.updateProfile(updateData)

    // 성공 시 원본 데이터 업데이트
    originalProfileData.value = { ...profileData.value }

    success.value = '프로필이 성공적으로 업데이트되었습니다.'
    setTimeout(() => {
      clearMessages()
    }, 3000)

    return response.data
  } catch (err: any) {
    console.error('프로필 업데이트 실패:', err)
    error.value = err.response?.data?.message || '프로필 업데이트에 실패했습니다.'
    throw err
  }
}

async function handlePasswordChange() {
  try {
    const response = await profileAPI.changePassword({
      current_password: passwordData.value.currentPassword,
      new_password: passwordData.value.newPassword,
      confirm_password: passwordData.value.confirmPassword,
    })

    alert('비밀번호가 성공적으로 변경되었습니다.')
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  } catch (err: any) {
    console.error('비밀번호 변경 실패:', err)
    alert(err.response?.data?.message || '비밀번호 변경에 실패했습니다.')
  }
}

async function handlePhoneVerification() {
  try {
    // TODO: 본인 인증 모달 또는 페이지로 이동
    // 현재는 간단한 알림으로 처리
    alert('본인 인증 페이지로 이동합니다.')
  } catch (err: any) {
    console.error('본인 인증 실패:', err)
    alert(err.response?.data?.message || '본인 인증에 실패했습니다.')
  }
}

async function handlePaymentMethod() {
  try {
    // TODO: 결제 수단 등록 모달 또는 페이지로 이동
    // 현재는 간단한 알림으로 처리
    alert('결제 수단 등록 페이지로 이동합니다.')
  } catch (err: any) {
    console.error('결제 수단 등록 실패:', err)
    alert(err.response?.data?.message || '결제 수단 등록에 실패했습니다.')
  }
}

async function handleSubscriptionChange(planType: string) {
  try {
    if (planType === 'enterprise') {
      router.push('/contact')
    } else {
      const confirmed = confirm(`${planType} 요금제로 변경하시겠습니까?`)
      if (confirmed) {
        const response = await profileAPI.updateSubscription({
          subscription_type: planType,
          subscription_status: 'active',
        })
        alert('구독이 성공적으로 변경되었습니다.')
        // 프로필 데이터 새로고침
        await fetchProfile()
      }
    }
  } catch (err: any) {
    console.error('구독 변경 실패:', err)
    alert(err.response?.data?.message || '구독 변경에 실패했습니다.')
  }
}

async function handleDeleteAccount() {
  try {
    if (confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      const response = await profileAPI.deleteAccount()
      alert('회원 탈퇴가 완료되었습니다.')
      router.push('/login')
    }
  } catch (err: any) {
    console.error('회원 탈퇴 실패:', err)
    alert(err.response?.data?.message || '회원 탈퇴에 실패했습니다.')
  }
}

function handleCancel() {
  router.back()
}

function getAccountTypeDisplay(accountType: string) {
  const types = {
    email: '이메일',
    google: 'Google',
    kakao: '카카오',
    naver: '네이버',
  }
  return types[accountType as keyof typeof types] || '이메일'
}

function maskPhoneNumber(phone?: string) {
  if (!phone) return '****-****-****'
  return phone.replace(/(\d{3})-(\d{3,4})-(\d{4})/, '****-****-$3')
}

const showPhoneModal = ref(false)
const showPaymentModal = ref(false)

async function handleTempPhoneVerify() {
  try {
    await profileAPI.updateProfile({
      is_phone_verified: true,
      phone: '010-1234-5678', // 임시값
    })
    await fetchProfile()
    showPhoneModal.value = false
  } catch (err) {
    alert('본인 인증 처리 실패')
  }
}
async function handleTempPaymentRegister() {
  try {
    await profileAPI.updateProfile({
      payment_method_registered: true,
      payment_card_number: '1234-****-****-5678', // 임시값
      payment_card_type: 'VISA',
      payment_card_expiry: '12/29',
    })
    await fetchProfile()
    showPaymentModal.value = false
  } catch (err) {
    alert('결제 수단 등록 실패')
  }
}

async function handleDeleteAvatar() {
  if (!confirm('정말로 프로필 이미지를 삭제하시겠습니까?')) return
  try {
    await profileAPI.deleteAvatar()
    await fetchProfile()
    avatarPreview.value = null
  } catch (err) {
    alert('프로필 이미지 삭제에 실패했습니다.')
  }
}
</script>

<style scoped>
.profile-edit-container {
  display: flex;
  min-height: 100vh;
  background-color: #fafafa;
}

.profile-edit-wrapper {
  max-width: 800px;
  height: 98%;
  margin: 10px auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  overflow-y: auto;
  overflow-x: hidden;
}

.profile-header {
  text-align: center;
  margin-bottom: 40px;
}

.profile-image-section {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
}

.profile-image-wrapper {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.profile-image:hover {
  transform: scale(1.05);
}

.upload-progress-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.upload-progress {
  text-align: center;
  color: white;
}

.progress-bar {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin: 0 auto 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #0d6efd;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 500;
}

.phone-verification-container {
  position: relative;
}

.verification-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.verification-label {
  font-size: 14px;
  color: #666;
}

.verification-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.verification-checkbox.verified {
  border-color: #28a745;
  background: #28a745;
}

.check-icon {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.verification-btn {
  background: #f8f9fa !important;
  color: #333 !important;
  border: 1px solid #ddd !important;
}

.verification-btn:hover {
  background: #e9ecef !important;
}

.payment-btn {
  background: #f8f9fa !important;
  color: #333 !important;
  border: 1px solid #ddd !important;
}

.payment-btn:hover {
  background: #e9ecef !important;
}

.image-upload-label {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 36px;
  height: 36px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  padding-bottom: 5px;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    background 0.2s,
    transform 0.2s;
}

.image-upload-label:hover {
  background: #92ffb2;
  transform: scale(1.05);
}

.image-upload-input {
  display: none;
}

.form-section {
  margin-bottom: 10px;
}

.form-section-title {
  font-size: 20px;
  font-weight: 600;
  margin-top: 30px;
  margin-bottom: 10px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 10px;
}

.form-group {
  margin-bottom: 10px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #0d6efd;
}

.form-input[readonly] {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.form-input.error {
  border-color: #dc3545;
  background-color: #fff5f5;
}

.field-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  margin-bottom: 8px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 40px;
}

.btn {
  padding: 12px 30px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #0d6efd;
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background: #0b5ed7;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f8f9fa;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-secondary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.subscription-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: space-between;
}

.subscription-info {
  flex: 0 0 calc(25% - 15px);
  box-sizing: border-box;
  min-width: 200px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 25px 20px;
  background: #fdfdfd;
  border-radius: 10px;
  border: 2px solid #ddd;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s,
    border-color 0.2s;
}

.subscription-info.active {
  border-color: #0d6efd;
  background-color: #e8f0ff;
}

.subscription-info:hover {
  transform: translateY(-3px);
}

.subscription-type {
  font-weight: 500;
  color: #0d6efd;
  font-size: 18px;
}

.subscription-status {
  font-size: 14px;
  color: #666;
  margin: 5px 0;
}

.subscription-features {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  text-align: center;
}

.subscription-change {
  margin-top: 15px;
  padding: 8px 20px;
  border: 1px solid #0d6efd;
  border-radius: 6px;
  background: transparent;
  color: #0d6efd;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subscription-change:hover {
  background: #0d6efd;
  color: white;
}

.subscription-info.active .subscription-change {
  background: #0d6efd;
  color: white;
}

.subscription-info.active .subscription-change:hover {
  background: #0b5ed7;
}

.delete-account {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.delete-link {
  color: #dc3545;
  text-decoration: none;
  font-size: 14px;
}

.delete-link:hover {
  text-decoration: underline;
}

.account-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
  color: #777;
}

.account-type i {
  font-size: 16px;
}

.error-message {
  color: #d32f2f;
  text-align: center;
  margin: 10px 0;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
}

.success-message {
  color: #2e7d32;
  text-align: center;
  margin: 10px 0;
  padding: 10px;
  background: #e8f5e8;
  border-radius: 4px;
}

.loading {
  text-align: center;
  color: #1976d2;
  padding: 40px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 10px;
}
.verification-section .verification-checkbox,
.payment-section .verificatio1-checkbox {
  margin-left: 10px;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 10px;
  padding: 32px 24px;
  min-width: 320px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  text-align: center;
}
.modal-content h3 {
  margin-bottom: 16px;
}
.modal-content button {
  margin: 8px 4px 0 4px;
}

.image-delete-btn {
  position: absolute;
  bottom: -5px;
  left: -5px;
  width: 36px;
  height: 36px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #dc3545;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: none;
  transition:
    background 0.2s,
    transform 0.2s;
  z-index: 2;
}
.image-delete-btn:hover {
  background: #ffeaea;
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .subscription-container {
    flex-direction: column;
  }

  .subscription-info {
    flex: none;
    width: 100%;
  }
}
</style>
