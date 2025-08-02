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
              <h4 class="benefits-title">{{ $t('auth.benefits') }}</h4>
              <ul class="benefits-list">
                <li v-for="benefit in grade.benefits" :key="benefit" class="benefit-item">
                  <span class="benefit-icon">✓</span>
                  <span class="benefit-text">{{ $t(`auth.benefits.${benefit}`) }}</span>
                </li>
              </ul>
            </div>
            <div class="grade-requirements">
              <h4 class="requirements-title">{{ $t('auth.requirements') }}</h4>
              <div class="requirement-item">
                <span class="req-label">{{ $t('auth.minBalance') }}:</span>
                <span class="req-value">{{ grade.minGlibBalance.toLocaleString() }} GLIB</span>
              </div>
              <div class="requirement-item">
                <span class="req-label">{{ $t('auth.staking') }}:</span>
                <span class="req-value">{{ grade.stakingRequired ? $t('common.yes') : $t('common.no') }}</span>
              </div>
            </div>
            <div class="upgrade-progress" v-if="userGrade !== grade.id && isGradeUnlocked(grade.id)">
              <button class="upgrade-btn" @click="upgradeGrade(grade.id)">
                <span class="upgrade-icon">⬆️</span>
                {{ $t('auth.upgrade') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 인증 가이드 섹션 -->
    <section class="auth-guide">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">📋</span>
          {{ $t('auth.guide.title') }}
        </h2>
        <div class="guide-content">
          <p class="guide-description">{{ $t('auth.guide.description') }}</p>
          <div class="guide-steps">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>{{ $t('auth.guide.step1.title') }}</h4>
                <p>{{ $t('auth.guide.step1.description') }}</p>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>{{ $t('auth.guide.step2.title') }}</h4>
                <p>{{ $t('auth.guide.step2.description') }}</p>
              </div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>{{ $t('auth.guide.step3.title') }}</h4>
                <p>{{ $t('auth.guide.step3.description') }}</p>
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

const { t } = useI18n()

// 사용자 현재 등급
const userGrade = ref('READER')

// 등급별 이모지
const gradeEmojis = {
  READER: '🥉',
  WRITER: '🥈', 
  EXPERT: '🥇'
}

// 등급 시스템
const grades = [
  {
    id: 'READER',
    name: 'Reader',
    emoji: '🥉',
    minGlibBalance: 1000,
    stakingRequired: false,
    benefits: ['basicAccess', 'communityForum', 'weeklyReports']
  },
  {
    id: 'WRITER',
    name: 'Writer',
    emoji: '🥈',
    minGlibBalance: 10000,
    stakingRequired: true,
    benefits: ['premiumContent', 'prioritySupport', 'monthlyAnalysis', 'earlyAccess']
  },
  {
    id: 'EXPERT',
    name: 'Expert',
    emoji: '🥇',
    minGlibBalance: 100000,
    stakingRequired: true,
    benefits: ['exclusiveEvents', 'personalConsultation', 'customReports', 'vipLounge']
  }
]

// 등급 해제 여부 확인
const isGradeUnlocked = (gradeId: string) => {
  const gradeIndex = grades.findIndex(g => g.id === gradeId)
  const currentGradeIndex = grades.findIndex(g => g.id === userGrade.value)
  return gradeIndex <= currentGradeIndex + 1
}

// 등급 업그레이드
const upgradeGrade = async (gradeId: string) => {
  try {
    // 실제로는 백엔드 API 호출 및 조건 확인
    console.log('Upgrading to grade:', gradeId)
    userGrade.value = gradeId
  } catch (error) {
    console.error('Grade upgrade failed:', error)
  }
}

onMounted(() => {
  console.log('Auth Center mounted')
})
</script>

<style scoped>
.auth-center {
  min-height: calc(100vh - 80px);
  background: var(--bg-primary);
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 헤더 섹션 */
.auth-header {
  background: linear-gradient(135deg, var(--gli-blue), var(--gli-purple));
  color: white;
  padding: 5rem 0 3rem;
  text-align: center;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-emoji {
  font-size: 3.5rem;
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto 3rem;
}

.grade-showcase {
  display: flex;
  justify-content: center;
}

.current-grade {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.grade-icon {
  font-size: 3rem;
}

.grade-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.grade-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.grade-name {
  font-size: 1.5rem;
  font-weight: 600;
}

/* 등급 시스템 */
.grade-system {
  padding: 5rem 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.emoji {
  font-size: 2.5rem;
}

.grades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.grade-card {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.grade-card.active {
  border-color: var(--gli-gold);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  transform: translateY(-5px);
}

.grade-card.locked {
  opacity: 0.6;
  filter: grayscale(0.5);
}

.grade-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.grade-emoji {
  font-size: 3rem;
}

.grade-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.current {
  background: linear-gradient(45deg, var(--gli-gold), #ffd700);
  color: #000;
}

.status-badge.unlocked {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
}

.status-badge.locked {
  background: #6b7280;
  color: white;
}

.grade-benefits,
.grade-requirements {
  margin-bottom: 1.5rem;
}

.benefits-title,
.requirements-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.benefits-list {
  list-style: none;
  padding: 0;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.benefit-icon {
  color: var(--gli-green);
  font-weight: bold;
}

.requirement-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.req-label {
  color: var(--text-secondary);
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
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 인증 가이드 */
.auth-guide {
  padding: 5rem 0;
  background: var(--bg-secondary);
}

.guide-description {
  text-align: center;
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.step-item {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  background: var(--bg-primary);
  border-radius: 16px;
  border-left: 4px solid var(--gli-blue);
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.step-content p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 반응형 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .title-emoji {
    font-size: 2.5rem;
  }
  
  .current-grade {
    flex-direction: column;
    text-align: center;
  }
  
  .grades-grid {
    grid-template-columns: 1fr;
  }
  
  .guide-steps {
    grid-template-columns: 1fr;
  }
}
</style>