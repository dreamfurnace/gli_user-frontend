<template>
  <div class="main-html-root">
    <BaseHeader
      @toggleLeftSidebar="handleToggleLeftSidebar"
      @toggleRightSidebar="handleToggleRightSidebar"
    />
    <LeftSidebar :isHidden="leftSidebarHidden" />
    <RightSidebar
      :isHidden="rightSidebarHidden"
      @toggleSidebar="handleToggleRightSidebar"
      @logout="handleLogout"
    />

    <div class="main-content">
      <div class="content-wrapper">
        <div class="contract-mode" :class="{ active: isContractModeActive }">
          <!-- 계약 정보 및 문서, 채팅, 법령 기록 등 (기존대로) -->
          <div class="contract-info-section">
            <div class="contract-info-header">
              <div class="contract-address">{{ selectedContractAddress }}</div>
              <div class="contract-status">진행중</div>
            </div>
            <div class="document-list">
              <div class="document-item">
                <span class="document-icon">📄</span>
                <span class="document-name">부동산 매매 계약서.docx</span>
                <span class="document-date">2024/04/25</span>
              </div>
              <div class="document-item">
                <span class="document-icon">📄</span>
                <span class="document-name">등기부등본.pdf</span>
                <span class="document-date">2024/04/24</span>
              </div>
            </div>
            <div class="chat-section">
              <div class="chat-message">최근 채팅 내용이 여기에 표시됩니다...</div>
              <div class="chat-time">오후 3:45</div>
            </div>
            <div class="law-history">
              <div class="law-item">
                <span class="law-title">부동산등기법 제123조</span>
                <span class="law-date">2024/04/25</span>
              </div>
              <div class="law-item">
                <span class="law-title">민법 제570조</span>
                <span class="law-date">2024/04/24</span>
              </div>
            </div>
          </div>
        </div>
        <div class="prompt-container">
          <div class="prompt-input">
            <textarea
              v-model="promptText"
              class="prompt-textarea"
              placeholder="Ask Me Anything..."
            ></textarea>
            <label class="upload-button" for="fileUpload">
              <span class="check-icon">✓</span>UPLOAD
            </label>
            <input type="file" id="fileUpload" @change="handleFileUpload" />
          </div>
        </div>
        <div class="tutorials" :class="{ active: !isContractModeActive }">
          <div class="tutorial-card">
            <strong>튜토리얼(1)</strong><br />판례/법령 검색<br />(텍스트/동영상)
          </div>
          <div class="tutorial-card">
            <strong>튜토리얼(2)</strong><br />계약서 검토<br />(텍스트/동영상)
          </div>
          <div class="tutorial-card">
            <strong>튜토리얼(3)</strong><br />리스크 점검<br />(텍스트/동영상)
          </div>
          <div class="tutorial-card">
            <strong>튜토리얼(4)</strong><br />문서 작성<br />(텍스트/동영상)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '../components/BaseHeader.vue'
import LeftSidebar from '../components/LeftSidebar.vue'
import RightSidebar from '../components/RightSidebar.vue'
import { useSideMenuStore } from '@/stores/sideMenuStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

// 사이드 메뉴 스토어
const sideMenuStore = useSideMenuStore()
const auth = useAuthStore()

// 사이드바 상태를 computed로 만들어 반응형으로 변경
const leftSidebarHidden = computed(() => sideMenuStore.leftSidebarHidden)
const rightSidebarHidden = computed(() => sideMenuStore.rightSidebarHidden)

// 로컬 상태
const isContractModeActive = ref(false)
const showContractInfo = ref(false)
const contractInfoText = ref('')
const selectedContractAddress = ref('')
const promptText = ref('')

// 사이드바 토글 핸들러들
const handleToggleLeftSidebar = () => {
  console.log('HomeView: handleToggleLeftSidebar 호출됨')
  console.log('HomeView: 좌측 사이드바 상태:', sideMenuStore.leftSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const handleToggleRightSidebar = () => {
  console.log('HomeView: handleToggleRightSidebar 호출됨')
  console.log('HomeView: 우측 사이드바 상태:', sideMenuStore.rightSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const exitContract = () => {
  isContractModeActive.value = false
  showContractInfo.value = false
  contractInfoText.value = ''
  selectedContractAddress.value = ''
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    console.log('File uploaded:', target.files[0].name)
  }
}

const handleLogout = async () => {
  await auth.logout()
  router.push('/login')
}

const selectContract = (contract: any) => {
  selectedContractAddress.value = contract.address
  contractInfoText.value = `/${contract.address} 계약 진행 중`
  showContractInfo.value = true
  isContractModeActive.value = true
}

// 로그인 상태 확인
const checkAuthStatus = () => {
  console.log('=== HomeView checkAuthStatus started ===')
  const user = localStorage.getItem('user')
  const tokens = localStorage.getItem('tokens')

  console.log('localStorage user:', user)
  console.log('localStorage tokens:', tokens)

  if (!user || !tokens) {
    console.log('User not authenticated, redirecting to login')
    router.push('/login')
    return false
  }

  try {
    const userData = JSON.parse(user)
    console.log('Authenticated user:', userData)
    console.log('=== HomeView checkAuthStatus completed successfully ===')
    return true
  } catch (error) {
    console.error('Error parsing user data:', error)
    localStorage.removeItem('user')
    localStorage.removeItem('tokens')
    router.push('/login')
    return false
  }
}

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  if (checkAuthStatus()) {
    // 사용자 프로필 정보 최신화
    try {
      await auth.fetchProfile()
    } catch (error) {
      console.error('프로필 정보 가져오기 실패:', error)
    }
  }
})
</script>

<style scoped>
.main-html-root {
  min-height: 100vh;
  background: #fafafa;
  width: 100vw;
  overflow-x: hidden;
}
.header-bar {
  width: 100vw;
  min-width: 100vw;
  background: #f8f8f8;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}
.main-content {
  padding: 60px 0;
}
.main-container {
  display: flex;
  height: calc(100vh - 60px);
  background-color: #fafafa;
  padding-top: 60px;
  position: relative;
  overflow-x: hidden;
}
.content-wrapper {
  height: 100vh;
  flex-direction: column;
  align-items: center;
}

.contract-mode {
  display: none;
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
}
.contract-mode.active {
  display: block;
}
.prompt-container {
  margin-bottom: 30px;
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
}
.prompt-input {
  width: 100%;
  position: relative;
}
.prompt-textarea {
  width: 100%;
  min-height: 120px;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;
}
.prompt-textarea:focus {
  outline: none;
  border-color: #007bff;
}
.upload-button {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background-color: #007bff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s ease;
}
.upload-button:hover {
  background-color: #0056b3;
}
.check-icon {
  font-size: 10px;
}
#fileUpload {
  display: none;
}
.tutorials {
  display: none;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 30px;
}
.tutorials.active {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 800px;
}
@media (max-width: 1024px) {
  .tutorials.active {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .tutorials.active {
    grid-template-columns: 1fr;
  }
}
.tutorial-card {
  width: 100%;
  min-width: 0;
  padding: 18px 15px;
  border-radius: 12px;
  text-align: center;
  font-size: 15px;
  background-color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  color: #333;
  border: 1px solid #ddd;
  font-weight: 500;
  cursor: pointer;
}
.tutorial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
  background-color: #fdfdfd;
}
.contract-info-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.contract-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.contract-address {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.contract-status {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.document-list {
  margin-bottom: 20px;
}
.document-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.document-icon {
  margin-right: 10px;
  font-size: 16px;
}
.document-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}
.document-date {
  font-size: 12px;
  color: #666;
}
.chat-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}
.chat-message {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}
.chat-time {
  font-size: 12px;
  color: #666;
}
.law-history {
  margin-top: 20px;
}
.law-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.law-title {
  flex: 1;
  font-size: 14px;
}
.law-date {
  font-size: 12px;
  color: #666;
}
</style>
