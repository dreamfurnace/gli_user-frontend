<template>
  <div class="contract-doc-choice-container">
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

    <div class="main-content" :class="{ 'sidebar-hidden': leftSidebarHidden }">
      <div class="contract-doc-choice-wrapper">
        <div class="page-header">
          <h1 class="page-title">계약서 작성</h1>
          <p class="page-description">작성하고자 하는 계약서 유형을 선택해주세요</p>
        </div>

        <div class="contract-categories">
          <!-- 부동산 매매계약서 섹션 -->
          <div class="contract-category">
            <h2 class="category-title">부동산 매매계약서</h2>
            <div class="category-grid">
              <button
                v-for="contract in realEstateSaleContracts"
                :key="contract.id"
                :class="[
                  'contract-button',
                  { 'contract-button--active': contract.isActive },
                  { 'contract-button--coming-soon': !contract.isActive },
                ]"
                :disabled="!contract.isActive"
                @click="selectContract(contract)"
                :aria-label="contract.name"
              >
                <div class="contract-button-content">
                  <div class="contract-icon">{{ contract.icon }}</div>
                  <div class="contract-info">
                    <h3 class="contract-name">{{ contract.name }}</h3>
                    <p class="contract-description">{{ contract.description }}</p>
                  </div>
                  <div v-if="!contract.isActive" class="coming-soon-badge">
                    <span class="coming-soon-text">Coming Soon</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- 부동산 임대차계약서 섹션 -->
          <div class="contract-category">
            <h2 class="category-title">부동산 임대차계약서</h2>
            <div class="category-grid">
              <button
                v-for="contract in realEstateRentContracts"
                :key="contract.id"
                :class="[
                  'contract-button',
                  { 'contract-button--active': contract.isActive },
                  { 'contract-button--coming-soon': !contract.isActive },
                ]"
                :disabled="!contract.isActive"
                @click="selectContract(contract)"
                :aria-label="contract.name"
              >
                <div class="contract-button-content">
                  <div class="contract-icon">{{ contract.icon }}</div>
                  <div class="contract-info">
                    <h3 class="contract-name">{{ contract.name }}</h3>
                    <p class="contract-description">{{ contract.description }}</p>
                  </div>
                  <div v-if="!contract.isActive" class="coming-soon-badge">
                    <span class="coming-soon-text">Coming Soon</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- 기타 섹션 -->
          <div class="contract-category">
            <h2 class="category-title">기타</h2>
            <div class="category-grid category-grid--others">
              <button
                v-for="contract in otherContracts"
                :key="contract.id"
                :class="[
                  'contract-button',
                  { 'contract-button--active': contract.isActive },
                  { 'contract-button--coming-soon': !contract.isActive },
                ]"
                :disabled="!contract.isActive"
                @click="selectContract(contract)"
                :aria-label="contract.name"
              >
                <div class="contract-button-content">
                  <div class="contract-icon">{{ contract.icon }}</div>
                  <div class="contract-info">
                    <h3 class="contract-name">{{ contract.name }}</h3>
                    <p class="contract-description">{{ contract.description }}</p>
                  </div>
                  <div v-if="!contract.isActive" class="coming-soon-badge">
                    <span class="coming-soon-text">Coming Soon</span>
                  </div>
                </div>
              </button>
            </div>
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

// 인증 스토어
const authStore = useAuthStore()

// 사이드바 상태를 computed로 만들어 반응형으로 변경
const leftSidebarHidden = computed(() => sideMenuStore.leftSidebarHidden)
const rightSidebarHidden = computed(() => sideMenuStore.rightSidebarHidden)

// 화면 진입 시 사이드바 비활성화
onMounted(() => {
  console.log('ContractDocChoiceView: 화면 진입, 사이드바 비활성화')
  sideMenuStore.importState({
    leftSidebarHidden: true,
    rightSidebarHidden: true,
  })
})

const handleToggleLeftSidebar = () => {
  console.log('ContractDocChoiceView: handleToggleLeftSidebar 호출됨')
  console.log('ContractDocChoiceView: 좌측 사이드바 상태:', sideMenuStore.leftSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const handleToggleRightSidebar = () => {
  console.log('ContractDocChoiceView: handleToggleRightSidebar 호출됨')
  console.log('ContractDocChoiceView: 우측 사이드바 상태:', sideMenuStore.rightSidebarHidden)
  // 스토어 토글은 BaseHeader에서 이미 처리됨
}

const handleLogout = async () => {
  try {
    console.log('로그아웃 시작')

    // 인증 스토어의 로그아웃 함수 호출
    await authStore.logout()

    console.log('로그아웃 완료, 로그인 페이지로 이동')

    // 로그인 페이지로 리다이렉트
    router.push('/login')
  } catch (error) {
    console.error('로그아웃 중 오류:', error)
    // 오류가 발생해도 로컬 상태는 초기화하고 로그인 페이지로 이동
    router.push('/login')
  }
}

interface Contract {
  id: number
  name: string
  description: string
  icon: string
  category: string
  isActive: boolean
  route?: string
}

// 부동산 매매계약서 (4개 버튼, 2×2)
const realEstateSaleContracts: Contract[] = [
  {
    id: 1,
    name: '일반주택(단독주택, 다가구주택)',
    description: '단독주택, 다가구주택 매매계약서',
    icon: '🏠',
    category: '매매계약서',
    isActive: true,
    route: '/contract/qa',
  },
  {
    id: 2,
    name: '집합건물(아파트, 다세대주택, 연립주택)',
    description: '아파트, 다세대주택, 연립주택 매매계약서',
    icon: '🏘️',
    category: '매매계약서',
    isActive: false,
  },
  {
    id: 3,
    name: '상가',
    description: '상가, 상업용 부동산 매매계약서',
    icon: '🏪',
    category: '매매계약서',
    isActive: true,
    route: '/contract/qc',
  },
  {
    id: 4,
    name: '토지',
    description: '토지, 논, 밭 매매계약서',
    icon: '🌾',
    category: '매매계약서',
    isActive: false,
  },
]

// 부동산 임대차계약서 (4개 버튼, 2×2)
const realEstateRentContracts: Contract[] = [
  {
    id: 5,
    name: '일반주택(단독·다가구)',
    description: '단독주택, 다가구주택 임대차계약서',
    icon: '🏡',
    category: '임대차계약서',
    isActive: true, // 활성 버튼
    route: '/contract/qb',
  },
  {
    id: 6,
    name: '집합건물(아파트·다세대·연립)',
    description: '아파트, 다세대주택, 연립주택 임대차계약서',
    icon: '🏢',
    category: '임대차계약서',
    isActive: false,
  },
  {
    id: 7,
    name: '상가',
    description: '상가, 상업용 부동산 임대차계약서',
    icon: '🏪',
    category: '임대차계약서',
    isActive: false,
  },
  {
    id: 8,
    name: '전대차계약서',
    description: '전대차계약서',
    icon: '📋',
    category: '임대차계약서',
    isActive: true,
    route: '/contract/qe',
  },
]

// 기타 (3개 버튼, 2×2 중 마지막 행 중앙 정렬)
const otherContracts: Contract[] = [
  {
    id: 9,
    name: '상가건물 임대차 권리금 계약서',
    description: '상가건물 임대차 권리금 계약서',
    icon: '💰',
    category: '기타',
    isActive: false,
  },
  {
    id: 10,
    name: '제소전 화해조서',
    description: '제소전 화해조서',
    icon: '🤝',
    category: '기타',
    isActive: false,
  },
  {
    id: 11,
    name: '임차권등기명령 신청서',
    description: '임차권등기명령 신청서',
    icon: '📄',
    category: '기타',
    isActive: false,
  },
]

const selectContract = (contract: Contract) => {
  if (!contract.isActive) {
    // Coming soon 상태인 경우 알림 표시
    alert('이 기능은 준비 중입니다. 곧 서비스될 예정입니다.')
    return
  }

  console.log('선택된 계약서:', contract)

  // 활성 버튼인 경우 해당 라우트로 이동
  if (contract.isActive && contract.route) {
    console.log(`${contract.name} 계약서 작성 페이지로 이동합니다: ${contract.route}`)
    router.push(contract.route)
  } else if (contract.isActive) {
    alert(`${contract.name} 계약서 작성 페이지로 이동합니다.`)
  }
}
</script>

<style scoped>
.contract-doc-choice-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-background-primary);
}

.main-content {
  flex: 1;
  padding: var(--spacing-6);
  justify-content: flex-start;
  transition: margin-left var(--duration-300) var(--ease-in-out);
}

.main-content.sidebar-hidden {
  margin-left: 0;
}

.contract-doc-choice-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  margin-top: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-4);
}

.page-description {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0;
}

.contract-categories {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.contract-category {
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-light);
}

.category-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-6) 0;
  text-align: center;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-4);
}

/* 기타 섹션의 경우 3개 버튼을 2×2 그리드에서 마지막 행 중앙 정렬 */
.category-grid--others {
  grid-template-columns: repeat(2, 1fr);
}

.category-grid--others .contract-button:nth-child(3) {
  grid-column: 1 / -1;
  justify-self: center;
  max-width: 300px;
}

.contract-button {
  display: block;
  width: 100%;
  padding: 24px;
  /* background-color: var(--color-background-primary); */
  border: 2px solid var(--color-border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--duration-200) var(--ease-in-out);
  text-align: left;
  position: relative;
  overflow: hidden;
}

.contract-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-500);
  background-color: var(--color-primary-50);
}

.contract-button:active {
  transform: translateY(0);
}

.contract-button--active {
  border-color: var(--color-primary-100);
  background-color: var(--color-primary-50);
}

.contract-button--active:hover {
  border-color: var(--color-primary-600);
  background-color: var(--color-primary-100);
}

.contract-button--coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: var(--color-disable);
}

.contract-button--coming-soon:hover {
  transform: none;
  box-shadow: none;
  border-color: var(--color-border-light);
  background-color: var(--color-gray-500);
}

.contract-button-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
}

.contract-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
}

.contract-button:hover .contract-icon {
  background-color: var(--color-primary-100);
}

.contract-info {
  flex: 1;
  min-width: 0;
}

.contract-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-1) 0;
  line-height: var(--line-height-tight);
}

.contract-description {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--line-height-relaxed);
}

.coming-soon-badge {
  position: absolute;
  bottom: var(--spacing-2);
  right: var(--spacing-2);
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.coming-soon-text {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-gray-200);
  border: 1px solid var(--color-gray-500);
  color: var(--color-gray-600);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-md);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-4);
  }

  .contract-category {
    padding: var(--spacing-4);
  }

  .category-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-3);
  }

  .category-grid--others .contract-button:nth-child(3) {
    grid-column: 1;
    max-width: none;
  }

  .page-title {
    font-size: var(--font-size-2xl);
  }

  .page-description {
    font-size: var(--font-size-base);
  }

  .category-title {
    font-size: var(--font-size-lg);
  }
}

@media (max-width: 480px) {
  .contract-button-content {
    flex-direction: column;
    text-align: center;
  }

  .contract-icon {
    align-self: center;
  }

  .contract-button {
    padding: var(--spacing-4);
  }

  .coming-soon-badge {
    position: static;
    margin-top: var(--spacing-3);
  }
}
</style>
