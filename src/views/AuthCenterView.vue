<template>
  <div class="auth-center">
    <!-- 헤더 섹션 -->
    <section class="auth-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-emoji">🔐</span>
          {{ $t('nav.auth') }}
        </h1>
        <p class="page-subtitle">
          {{ $t('auth.subtitle') }}
        </p>
      </div>
      <div class="grade-showcase">
        <div class="current-grade" :class="userGrade.toLowerCase()">
          <div class="grade-icon">{{ gradeEmojis[userGrade] }}</div>
          <div class="grade-info">
            <span class="grade-label">{{ $t('auth.currentGrade') }}</span>
            <span class="grade-name">{{ $t(`auth.grades.${userGrade.toLowerCase()}`) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 회원 등급 시스템 -->
    <section class="grade-system">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">💎</span>
          {{ $t('auth.gradeSystem.title') }}
        </h2>
        <div class="grades-grid">
          <div 
            v-for="grade in grades" 
            :key="grade.id"
            class="grade-card"
            :class="{ 
              active: userGrade === grade.id,
              locked: !isGradeUnlocked(grade.id)
            }"
          >
            <div class="grade-header">
              <div class="grade-emoji">{{ grade.emoji }}</div>
              <h3 class="grade-title">{{ grade.name }}</h3>
              <div class="grade-status">
                <span v-if="userGrade === grade.id" class="status-badge current">
                  {{ $t('auth.current') }}
                </span>
                <span v-else-if="isGradeUnlocked(grade.id)" class="status-badge unlocked">
                  {{ $t('auth.unlocked') }}
                </span>
                <span v-else class="status-badge locked">
                  {{ $t('auth.locked') }}
                </span>
              </div>
            </div>
            <div class="grade-benefits">
              <h4>{{ $t('auth.benefits') }}</h4>
              <ul>
                <li v-for="benefit in grade.benefits" :key="benefit">
                  ✨ {{ $t(`auth.gradeBenefits.${benefit}`) }}
                </li>
              </ul>
            </div>
            <div class="grade-requirements">
              <h4>{{ $t('auth.requirements') }}</h4>
              <div class="requirement-item">
                <span class="req-label">GLIB {{ $t('common.balance') }}:</span>
                <span class="req-value">{{ grade.minGlibBalance.toLocaleString() }} GLIB</span>
              </div>
              <div class="requirement-item">
                <span class="req-label">{{ $t('auth.staking') }}:</span>
                <span class="req-value">{{ grade.stakingRequired ? $t('common.yes') : $t('common.no') }}</span>
              </div>
            </div>
            <div class="upgrade-progress" v-if="userGrade !== grade.id && isGradeUnlocked(grade.id)">
              <button class="upgrade-btn" @click="upgradeGrade(grade.id)">
                <span class="btn-emoji">⬆️</span>
                {{ $t('auth.upgrade') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 토큰 변환 센터 -->
    <section class="conversion-center">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">💱</span>
          {{ $t('auth.conversion.title') }}
        </h2>
        <div class="conversion-panels">
          <!-- GLIB ↔ GLID 양방향 변환 -->
          <div class="conversion-panel">
            <h3 class="panel-title">
              <span class="panel-emoji">🔄</span>
              {{ $t('auth.conversion.glibGlidTitle') }}
            </h3>
            <div class="conversion-form">
              <div class="token-input-group">
                <div class="token-input">
                  <label>{{ $t('tokens.from') }}</label>
                  <div class="input-container">
                    <select v-model="glibGlidConversion.fromToken" class="token-select">
                      <option value="GLIB">GLIB</option>
                      <option value="GLID">GLID</option>
                    </select>
                    <input 
                      v-model="glibGlidConversion.amount" 
                      type="number" 
                      :placeholder="$t('tokens.amount')"
                      class="amount-input"
                      @input="calculateGlibGlidConversion"
                    >
                  </div>
                </div>
                <button class="swap-button" @click="swapGlibGlidTokens">
                  <span class="swap-icon">🔄</span>
                </button>
                <div class="token-input">
                  <label>{{ $t('tokens.to') }}</label>
                  <div class="input-container">
                    <select v-model="glibGlidConversion.toToken" class="token-select" disabled>
                      <option value="GLID">GLID</option>
                      <option value="GLIB">GLIB</option>
                    </select>
                    <input 
                      :value="glibGlidConversion.convertedAmount" 
                      type="number" 
                      :placeholder="$t('tokens.amount')"
                      class="amount-input"
                      readonly
                    >
                  </div>
                </div>
              </div>
              <div class="conversion-info">
                <div class="rate-info">
                  <span class="label">{{ $t('tokens.rate') }}:</span>
                  <span class="value">1 {{ glibGlidConversion.fromToken }} = {{ glibGlidConversion.rate }} {{ glibGlidConversion.toToken }}</span>
                </div>
                <div class="fee-info">
                  <span class="label">{{ $t('tokens.fee') }}:</span>
                  <span class="value">{{ glibGlidConversion.fee }}%</span>
                </div>
              </div>
              <button 
                class="convert-btn primary"
                :disabled="!canConvertGlibGlid"
                @click="executeGlibGlidConversion"
              >
                <span class="btn-emoji">💱</span>
                {{ $t('tokens.convert') }}
              </button>
            </div>
          </div>

          <!-- GLIB → GLIL 단방향 변환 -->
          <div class="conversion-panel">
            <h3 class="panel-title">
              <span class="panel-emoji">➡️</span>
              {{ $t('auth.conversion.glibGlilTitle') }}
            </h3>
            <div class="conversion-form">
              <div class="token-input-group single-direction">
                <div class="token-input">
                  <label>{{ $t('tokens.from') }}</label>
                  <div class="input-container">
                    <div class="token-display">GLIB</div>
                    <input 
                      v-model="glibGlilConversion.amount" 
                      type="number" 
                      :placeholder="$t('tokens.amount')"
                      class="amount-input"
                      @input="calculateGlibGlilConversion"
                    >
                  </div>
                </div>
                <div class="arrow-indicator">➡️</div>
                <div class="token-input">
                  <label>{{ $t('tokens.to') }}</label>
                  <div class="input-container">
                    <div class="token-display">GLIL</div>
                    <input 
                      :value="glibGlilConversion.convertedAmount" 
                      type="number" 
                      :placeholder="$t('tokens.amount')"
                      class="amount-input"
                      readonly
                    >
                  </div>
                </div>
              </div>
              <div class="conversion-info">
                <div class="rate-info">
                  <span class="label">{{ $t('tokens.rate') }}:</span>
                  <span class="value">1 GLIB = {{ glibGlilConversion.rate }} GLIL</span>
                </div>
                <div class="fee-info">
                  <span class="label">{{ $t('tokens.fee') }}:</span>
                  <span class="value">{{ glibGlilConversion.fee }}%</span>
                </div>
                <div class="warning-info">
                  <span class="warning-icon">⚠️</span>
                  <span class="warning-text">{{ $t('auth.conversion.oneWayWarning') }}</span>
                </div>
              </div>
              <button 
                class="convert-btn secondary"
                :disabled="!canConvertGlibGlil"
                @click="executeGlibGlilConversion"
              >
                <span class="btn-emoji">🎮</span>
                {{ $t('auth.conversion.convertToGame') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 스테이킹 센터 -->
    <section class="staking-center">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">🏦</span>
          {{ $t('auth.staking.title') }}
        </h2>
        <div class="staking-dashboard">
          <div class="staking-stats">
            <div class="stat-card">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <span class="stat-label">{{ $t('auth.staking.totalStaked') }}</span>
                <span class="stat-value">{{ stakingInfo.totalStaked.toLocaleString() }} GLIB</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📈</div>
              <div class="stat-info">
                <span class="stat-label">{{ $t('auth.staking.apy') }}</span>
                <span class="stat-value">{{ stakingInfo.apy }}%</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎁</div>
              <div class="stat-info">
                <span class="stat-label">{{ $t('auth.staking.rewards') }}</span>
                <span class="stat-value">{{ stakingInfo.pendingRewards.toLocaleString() }} GLIB</span>
              </div>
            </div>
          </div>
          <div class="staking-actions">
            <div class="action-group">
              <h4>{{ $t('auth.staking.stake') }}</h4>
              <div class="input-group">
                <input 
                  v-model="stakingForm.stakeAmount" 
                  type="number" 
                  :placeholder="$t('tokens.amount')"
                  class="stake-input"
                >
                <button class="stake-btn" @click="stakeTokens">
                  <span class="btn-emoji">🔒</span>
                  {{ $t('auth.staking.stake') }}
                </button>
              </div>
            </div>
            <div class="action-group">
              <h4>{{ $t('auth.staking.unstake') }}</h4>
              <div class="input-group">
                <input 
                  v-model="stakingForm.unstakeAmount" 
                  type="number" 
                  :placeholder="$t('tokens.amount')"
                  class="stake-input"
                >
                <button class="unstake-btn" @click="unstakeTokens">
                  <span class="btn-emoji">🔓</span>
                  {{ $t('auth.staking.unstake') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 성취 시스템 -->
    <section class="achievement-system">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">🏆</span>
          {{ $t('auth.achievements.title') }}
        </h2>
        <div class="achievements-grid">
          <div 
            v-for="achievement in achievements" 
            :key="achievement.id"
            class="achievement-card"
            :class="{ 
              completed: achievement.completed,
              progress: achievement.progress > 0 && !achievement.completed
            }"
          >
            <div class="achievement-icon">
              {{ achievement.completed ? achievement.completedEmoji : achievement.emoji }}
            </div>
            <div class="achievement-info">
              <h4 class="achievement-title">{{ $t(`auth.achievements.${achievement.id}.title`) }}</h4>
              <p class="achievement-description">{{ $t(`auth.achievements.${achievement.id}.description`) }}</p>
              <div class="achievement-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${(achievement.progress / achievement.target) * 100}%` }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ achievement.progress }}/{{ achievement.target }}
                </span>
              </div>
              <div class="achievement-reward" v-if="achievement.completed">
                <span class="reward-emoji">🎁</span>
                <span class="reward-text">{{ $t(`auth.achievements.${achievement.id}.reward`) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWeb3Store } from '@/stores/web3'

const { t } = useI18n()
const web3Store = useWeb3Store()

// 사용자 등급 데이터
const userGrade = ref('R') // R, W, X

const gradeEmojis = {
  R: '🥉',
  W: '🥈', 
  X: '🥇'
}

// 등급 시스템
const grades = [
  {
    id: 'R',
    name: 'Reader',
    emoji: '🥉',
    minGlibBalance: 1000,
    stakingRequired: false,
    benefits: ['basicAccess', 'communityForum', 'weeklyReports']
  },
  {
    id: 'W',
    name: 'Writer',
    emoji: '🥈',
    minGlibBalance: 10000,
    stakingRequired: true,
    benefits: ['premiumContent', 'prioritySupport', 'monthlyAnalysis', 'earlyAccess']
  },
  {
    id: 'X',
    name: 'Expert',
    emoji: '🥇',
    minGlibBalance: 100000,
    stakingRequired: true,
    benefits: ['exclusiveEvents', 'personalConsultation', 'customReports', 'vipLounge']
  }
]

// 토큰 변환 상태
const glibGlidConversion = ref({
  fromToken: 'GLIB',
  toToken: 'GLID',
  amount: 0,
  convertedAmount: 0,
  rate: 1.2,
  fee: 0.5
})

const glibGlilConversion = ref({
  amount: 0,
  convertedAmount: 0,
  rate: 2.5,
  fee: 1.0
})

// 스테이킹 정보
const stakingInfo = ref({
  totalStaked: 25000,
  apy: 12.5,
  pendingRewards: 1250
})

const stakingForm = ref({
  stakeAmount: 0,
  unstakeAmount: 0
})

// 성취 시스템
const achievements = ref([
  {
    id: 'firstStake',
    emoji: '🔒',
    completedEmoji: '✅',
    progress: 1,
    target: 1,
    completed: true
  },
  {
    id: 'tokenConverter',
    emoji: '💱',
    completedEmoji: '✅',
    progress: 5,
    target: 10,
    completed: false
  },
  {
    id: 'stakingMaster',
    emoji: '🏦',
    completedEmoji: '✅',
    progress: 3,
    target: 30,
    completed: false
  },
  {
    id: 'gradeExpert',
    emoji: '🏆',
    completedEmoji: '✅',
    progress: 0,
    target: 1,
    completed: false
  }
])

// 계산된 속성
const canConvertGlibGlid = computed(() => {
  return glibGlidConversion.value.amount > 0 && web3Store.isConnected
})

const canConvertGlibGlil = computed(() => {
  return glibGlilConversion.value.amount > 0 && web3Store.isConnected
})

// 메서드
const isGradeUnlocked = (gradeId: string): boolean => {
  const grade = grades.find(g => g.id === gradeId)
  if (!grade) return false
  
  // 현재 사용자의 GLIB 잔액으로 체크 (실제로는 web3Store에서 가져와야 함)
  const userGlibBalance = 50000 // 임시 값
  return userGlibBalance >= grade.minGlibBalance
}

const upgradeGrade = (gradeId: string) => {
  userGrade.value = gradeId
  // 실제로는 스마트 컨트랙트 호출
  console.log(`Upgrading to grade: ${gradeId}`)
}

const calculateGlibGlidConversion = () => {
  const amount = parseFloat(glibGlidConversion.value.amount.toString()) || 0
  glibGlidConversion.value.convertedAmount = amount * glibGlidConversion.value.rate
}

const calculateGlibGlilConversion = () => {
  const amount = parseFloat(glibGlilConversion.value.amount.toString()) || 0
  glibGlilConversion.value.convertedAmount = amount * glibGlilConversion.value.rate
}

const swapGlibGlidTokens = () => {
  const temp = glibGlidConversion.value.fromToken
  glibGlidConversion.value.fromToken = glibGlidConversion.value.toToken
  glibGlidConversion.value.toToken = temp
  
  // 환율 조정
  glibGlidConversion.value.rate = glibGlidConversion.value.fromToken === 'GLIB' ? 1.2 : 0.83
  calculateGlibGlidConversion()
}

const executeGlibGlidConversion = async () => {
  try {
    // 실제로는 스마트 컨트랙트 호출
    console.log('Converting GLIB/GLID:', glibGlidConversion.value)
    
    // 성취 진행도 업데이트
    const conversionAchievement = achievements.value.find(a => a.id === 'tokenConverter')
    if (conversionAchievement && !conversionAchievement.completed) {
      conversionAchievement.progress += 1
      if (conversionAchievement.progress >= conversionAchievement.target) {
        conversionAchievement.completed = true
      }
    }
  } catch (error) {
    console.error('Conversion failed:', error)
  }
}

const executeGlibGlilConversion = async () => {
  try {
    // 실제로는 스마트 컨트랙트 호출
    console.log('Converting GLIB to GLIL:', glibGlilConversion.value)
  } catch (error) {
    console.error('Conversion failed:', error)
  }
}

const stakeTokens = async () => {
  try {
    // 실제로는 스마트 컨트랙트 호출
    console.log('Staking tokens:', stakingForm.value.stakeAmount)
    stakingInfo.value.totalStaked += stakingForm.value.stakeAmount
    stakingForm.value.stakeAmount = 0
    
    // 성취 진행도 업데이트
    const stakingAchievement = achievements.value.find(a => a.id === 'stakingMaster')
    if (stakingAchievement && !stakingAchievement.completed) {
      stakingAchievement.progress += 1
      if (stakingAchievement.progress >= stakingAchievement.target) {
        stakingAchievement.completed = true
      }
    }
  } catch (error) {
    console.error('Staking failed:', error)
  }
}

const unstakeTokens = async () => {
  try {
    // 실제로는 스마트 컨트랙트 호출
    console.log('Unstaking tokens:', stakingForm.value.unstakeAmount)
    stakingInfo.value.totalStaked -= stakingForm.value.unstakeAmount
    stakingForm.value.unstakeAmount = 0
  } catch (error) {
    console.error('Unstaking failed:', error)
  }
}

onMounted(() => {
  calculateGlibGlidConversion()
  calculateGlibGlilConversion()
})
</script>

<style scoped>
.auth-center {
  min-height: 100vh;
  padding-top: 2rem;
}

/* 헤더 섹션 */
.auth-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--gli-blue) 0%, var(--gli-purple) 100%);
  color: white;
  border-radius: 16px;
  margin: 0 2rem 3rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.title-emoji {
  font-size: 3rem;
  margin-right: 1rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

.grade-showcase {
  display: flex;
  align-items: center;
}

.current-grade {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);
}

.current-grade.r {
  border: 2px solid #cd7f32;
}

.current-grade.w {
  border: 2px solid #c0c0c0;
}

.current-grade.x {
  border: 2px solid #ffd700;
}

.grade-icon {
  font-size: 2rem;
}

.grade-info {
  display: flex;
  flex-direction: column;
}

.grade-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.grade-name {
  font-size: 1.2rem;
  font-weight: 600;
}

/* 섹션 공통 스타일 */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: var(--text-primary);
}

.section-title .emoji {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* 등급 시스템 */
.grade-system {
  padding: 5rem 0;
  background: var(--bg-primary);
}

.grades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.grade-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.grade-card.active {
  border-color: var(--gli-gold);
  transform: translateY(-5px);
}

.grade-card.locked {
  opacity: 0.6;
  filter: grayscale(50%);
}

.grade-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.grade-emoji {
  font-size: 2.5rem;
}

.grade-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.current {
  background: var(--gli-gold);
  color: white;
}

.status-badge.unlocked {
  background: var(--gli-green);
  color: white;
}

.status-badge.locked {
  background: var(--text-secondary);
  color: white;
}

.grade-benefits,
.grade-requirements {
  margin-bottom: 1.5rem;
}

.grade-benefits h4,
.grade-requirements h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.grade-benefits ul {
  list-style: none;
  padding: 0;
}

.grade-benefits li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.req-label {
  font-weight: 500;
}

.req-value {
  font-weight: 600;
  color: var(--text-primary);
}

.upgrade-btn {
  width: 100%;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(103, 126, 234, 0.3);
}

.btn-emoji {
  margin-right: 0.5rem;
}

/* 토큰 변환 센터 */
.conversion-center {
  padding: 5rem 0;
}

.conversion-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 3rem;
}

.conversion-panel {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--text-primary);
}

.panel-emoji {
  font-size: 1.8rem;
  margin-right: 0.75rem;
}

.token-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.token-input-group.single-direction {
  gap: 2rem;
}

.token-input {
  flex: 1;
}

.token-input label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.input-container {
  display: flex;
  gap: 0.5rem;
}

.token-select,
.token-display {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  min-width: 80px;
  text-align: center;
  font-weight: 600;
  color: var(--text-primary);
}

.token-display {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gli-blue);
  color: white;
}

.amount-input {
  flex: 1;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-primary);
}

.amount-input:focus {
  outline: none;
  border-color: var(--gli-blue);
}

.swap-button {
  background: var(--gli-blue);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.swap-button:hover {
  transform: rotate(180deg);
}

.arrow-indicator {
  font-size: 2rem;
  color: var(--gli-blue);
}

.conversion-info {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.rate-info,
.fee-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.warning-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--warning-color);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.warning-icon {
  font-size: 1.2rem;
}

.convert-btn {
  width: 100%;
  padding: 1rem 2rem;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.convert-btn.primary {
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
}

.convert-btn.secondary {
  background: linear-gradient(45deg, var(--gli-green), var(--gli-teal));
  color: white;
}

.convert-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.convert-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 스테이킹 센터 */
.staking-center {
  padding: 5rem 0;
  background: var(--bg-primary);
}

.staking-dashboard {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
}

.staking-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.staking-actions {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.action-group {
  margin-bottom: 2rem;
}

.action-group h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stake-input {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-primary);
}

.stake-btn,
.unstake-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stake-btn {
  background: var(--gli-green);
  color: white;
}

.unstake-btn {
  background: var(--gli-orange);
  color: white;
}

.stake-btn:hover,
.unstake-btn:hover {
  transform: translateY(-2px);
}

/* 성취 시스템 */
.achievement-system {
  padding: 5rem 0;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.achievement-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.achievement-card.completed {
  border-color: var(--gli-gold);
}

.achievement-card.progress {
  border-color: var(--gli-blue);
}

.achievement-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.achievement-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  text-align: center;
}

.achievement-description {
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.achievement-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  display: block;
}

.achievement-reward {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--gli-gold);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.reward-emoji {
  font-size: 1.1rem;
}

/* 반응형 */
@media (max-width: 768px) {
  .auth-header {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .conversion-panels {
    grid-template-columns: 1fr;
  }
  
  .staking-dashboard {
    grid-template-columns: 1fr;
  }
  
  .token-input-group {
    flex-direction: column;
  }
  
  .swap-button {
    align-self: center;
    transform: rotate(90deg);
  }
  
  .swap-button:hover {
    transform: rotate(270deg);
  }
}
</style>