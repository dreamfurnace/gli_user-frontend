<template>
  <div class="business-page">
    <!-- 히어로 섹션 -->
    <section class="hero-section" ref="heroSection">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="emoji">🏖️</span>
          <span class="text-gradient">GLI Platform</span>
        </h1>
        <p class="hero-subtitle">
          🌟 {{ $t('business.hero.subtitle') }}
        </p>
        <div class="hero-features">
          <div class="feature-badge">🪙 RWA 토큰</div>
          <div class="feature-badge">🏨 리조트 예약</div>
          <div class="feature-badge">🎮 게임 생태계</div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="floating-tokens">
          <div class="token glib">GLIB</div>
          <div class="token glid">GLID</div>
          <div class="token glil">GLIL</div>
        </div>
      </div>
    </section>

    <!-- 네비게이션 -->
    <nav class="section-nav" :class="{ sticky: isNavSticky }">
      <div class="nav-container">
        <a 
          v-for="section in sections" 
          :key="section.id"
          :href="`#${section.id}`"
          class="nav-link"
          :class="{ active: activeSection === section.id }"
          @click.prevent="scrollToSection(section.id)"
        >
          <span class="nav-emoji">{{ section.emoji }}</span>
          <span class="nav-text">{{ $t(`business.nav.${section.id}`) }}</span>
        </a>
      </div>
    </nav>

    <!-- 배경 섹션 -->
    <section id="background" class="content-section" ref="backgroundSection">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">🎯</span>
          {{ $t('business.background.title') }}
        </h2>
        <div class="background-grid">
          <div class="background-card">
            <div class="card-icon">🌊</div>
            <h3>{{ $t('business.background.vision.title') }}</h3>
            <p>{{ $t('business.background.vision.description') }}</p>
          </div>
          <div class="background-card">
            <div class="card-icon">🔗</div>
            <h3>{{ $t('business.background.blockchain.title') }}</h3>
            <p>{{ $t('business.background.blockchain.description') }}</p>
          </div>
          <div class="background-card">
            <div class="card-icon">🏖️</div>
            <h3>{{ $t('business.background.resort.title') }}</h3>
            <p>{{ $t('business.background.resort.description') }}</p>
          </div>
          <div class="background-card">
            <div class="card-icon">🎮</div>
            <h3>{{ $t('business.background.gaming.title') }}</h3>
            <p>{{ $t('business.background.gaming.description') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 팀원 섹션 -->
    <section id="team" class="content-section" ref="teamSection">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">👥</span>
          {{ $t('business.team.title') }}
        </h2>
        <div class="team-grid">
          <div v-for="member in teamMembers" :key="member.id" class="team-card">
            <div class="member-avatar">{{ member.emoji }}</div>
            <h3 class="member-name">{{ member.name }}</h3>
            <p class="member-role">{{ $t(`business.team.roles.${member.role}`) }}</p>
            <p class="member-description">{{ $t(`business.team.descriptions.${member.role}`) }}</p>
            <div class="member-skills">
              <span v-for="skill in member.skills" :key="skill" class="skill-tag">
                {{ skill }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 전략 섹션 -->
    <section id="strategy" class="content-section" ref="strategySection">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">📊</span>
          {{ $t('business.strategy.title') }}
        </h2>
        <div class="strategy-timeline">
          <div v-for="(phase, index) in strategyPhases" :key="phase.id" class="timeline-item">
            <div class="timeline-marker">
              <span class="phase-number">{{ index + 1 }}</span>
            </div>
            <div class="timeline-content">
              <h3 class="phase-title">
                <span class="phase-emoji">{{ phase.emoji }}</span>
                {{ $t(`business.strategy.phases.${phase.id}.title`) }}
              </h3>
              <p class="phase-description">
                {{ $t(`business.strategy.phases.${phase.id}.description`) }}
              </p>
              <ul class="phase-features">
                <li v-for="feature in phase.features" :key="feature">
                  ✅ {{ $t(`business.strategy.phases.${phase.id}.features.${feature}`) }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 일정 섹션 -->
    <section id="roadmap" class="content-section" ref="roadmapSection">
      <div class="section-container">
        <h2 class="section-title">
          <span class="emoji">🗓️</span>
          {{ $t('business.roadmap.title') }}
        </h2>
        <div class="roadmap-container">
          <div v-for="milestone in roadmapMilestones" :key="milestone.id" class="milestone">
            <div class="milestone-header">
              <div class="milestone-date">{{ milestone.date }}</div>
              <div class="milestone-status" :class="milestone.status">
                <span v-if="milestone.status === 'completed'">✅</span>
                <span v-else-if="milestone.status === 'current'">🔄</span>
                <span v-else>⏳</span>
              </div>
            </div>
            <div class="milestone-content">
              <h3 class="milestone-title">
                <span class="milestone-emoji">{{ milestone.emoji }}</span>
                {{ $t(`business.roadmap.milestones.${milestone.id}.title`) }}
              </h3>
              <p class="milestone-description">
                {{ $t(`business.roadmap.milestones.${milestone.id}.description`) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const activeSection = ref('background')
const isNavSticky = ref(false)

// 섹션 정의
const sections = [
  { id: 'background', emoji: '🎯' },
  { id: 'team', emoji: '👥' },
  { id: 'strategy', emoji: '📊' },
  { id: 'roadmap', emoji: '🗓️' }
]

// 팀 멤버 데이터
const teamMembers = [
  {
    id: 'ceo',
    name: 'GLI CEO',
    role: 'ceo',
    emoji: '👨‍💼',
    skills: ['Blockchain', 'Business Strategy', 'Leadership']
  },
  {
    id: 'cto',
    name: 'GLI CTO',
    role: 'cto',
    emoji: '👨‍💻',
    skills: ['Smart Contracts', 'DeFi', 'Architecture']
  },
  {
    id: 'designer',
    name: 'GLI Designer',
    role: 'designer',
    emoji: '🎨',
    skills: ['UI/UX', 'Brand Design', 'User Research']
  },
  {
    id: 'marketing',
    name: 'GLI Marketing',
    role: 'marketing',
    emoji: '📢',
    skills: ['Digital Marketing', 'Community', 'Growth']
  }
]

// 전략 페이즈
const strategyPhases = [
  {
    id: 'phase1',
    emoji: '🚀',
    features: ['platform', 'tokens', 'wallet']
  },
  {
    id: 'phase2', 
    emoji: '🏨',
    features: ['resort', 'booking', 'rewards']
  },
  {
    id: 'phase3',
    emoji: '🎮',
    features: ['gaming', 'nft', 'metaverse']
  },
  {
    id: 'phase4',
    emoji: '🌍',
    features: ['global', 'partnerships', 'expansion']
  }
]

// 로드맵 마일스톤
const roadmapMilestones = [
  {
    id: 'q1_2024',
    date: '2024 Q1',
    status: 'completed',
    emoji: '✅'
  },
  {
    id: 'q2_2024',
    date: '2024 Q2', 
    status: 'completed',
    emoji: '✅'
  },
  {
    id: 'q3_2024',
    date: '2024 Q3',
    status: 'current',
    emoji: '🔄'
  },
  {
    id: 'q4_2024',
    date: '2024 Q4',
    status: 'upcoming',
    emoji: '⏳'
  }
]

// 스크롤 관련 함수
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleScroll = () => {
  const scrollY = window.scrollY
  
  // 네비게이션 sticky 상태
  isNavSticky.value = scrollY > 400
  
  // 활성 섹션 감지
  sections.forEach(section => {
    const element = document.getElementById(section.id)
    if (element) {
      const rect = element.getBoundingClientRect()
      if (rect.top <= 200 && rect.bottom >= 200) {
        activeSection.value = section.id
      }
    }
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.business-page {
  min-height: 100vh;
}

/* 히어로 섹션 */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80vh;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-title .emoji {
  font-size: 4rem;
  display: block;
  margin-bottom: 0.5rem;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-features {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.feature-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  font-weight: 600;
}

.hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.floating-tokens {
  position: relative;
  width: 300px;
  height: 300px;
}

.token {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  animation: float 3s ease-in-out infinite;
}

.token.glib {
  background: linear-gradient(45deg, #3b82f6, #1d4ed8);
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.token.glid {
  background: linear-gradient(45deg, #8b5cf6, #7c3aed);
  top: 10%;
  right: 20%;
  animation-delay: 1s;
}

.token.glil {
  background: linear-gradient(45deg, #10b981, #059669);
  bottom: 30%;
  left: 30%;
  animation-delay: 2s;
}

/* 섹션 네비게이션 */
.section-nav {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  transition: all 0.3s ease;
  z-index: 10;
}

.section-nav.sticky {
  position: sticky;
  top: 80px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 0 2rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  font-weight: 500;
}

.nav-link:hover,
.nav-link.active {
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  color: white;
  transform: translateY(-2px);
}

.nav-emoji {
  font-size: 1.2rem;
}

/* 콘텐츠 섹션 */
.content-section {
  padding: 5rem 0;
}

.content-section:nth-child(even) {
  background: var(--bg-primary);
}

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

/* 배경 그리드 */
.background-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.background-card {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.background-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.background-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.background-card p {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 팀 그리드 */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
}

.team-card {
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-5px);
}

.member-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1rem;
}

.member-name {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.member-role {
  color: var(--gli-purple);
  font-weight: 600;
  margin-bottom: 1rem;
}

.member-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.member-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.skill-tag {
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 전략 타임라인 */
.strategy-timeline {
  position: relative;
}

.strategy-timeline::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--gli-blue);
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  margin-bottom: 4rem;
  position: relative;
}

.timeline-item:nth-child(even) {
  flex-direction: row-reverse;
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 2rem;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, var(--gli-blue), var(--gli-purple));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  z-index: 2;
}

.timeline-content {
  flex: 1;
  max-width: 45%;
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
}

.timeline-item:nth-child(even) .timeline-content {
  margin-right: auto;
}

.timeline-item:nth-child(odd) .timeline-content {
  margin-left: auto;
}

.phase-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.phase-emoji {
  font-size: 1.8rem;
  margin-right: 0.5rem;
}

.phase-description {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.phase-features {
  list-style: none;
  padding: 0;
}

.phase-features li {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

/* 로드맵 */
.roadmap-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.milestone {
  background: var(--bg-primary);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.milestone:hover {
  transform: translateY(-5px);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.milestone-date {
  background: var(--bg-secondary);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.milestone-status {
  font-size: 1.5rem;
}

.milestone-status.completed {
  color: var(--gli-green);
}

.milestone-status.current {
  color: var(--gli-gold);
}

.milestone-status.upcoming {
  color: var(--text-secondary);
}

.milestone-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.milestone-emoji {
  font-size: 1.5rem;
  margin-right: 0.5rem;
}

.milestone-description {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* 애니메이션 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* 반응형 */
@media (max-width: 768px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1rem;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .nav-container {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .strategy-timeline::before {
    left: 2rem;
  }
  
  .timeline-marker {
    left: 2rem;
  }
  
  .timeline-content {
    max-width: calc(100% - 6rem);
    margin-left: 6rem !important;
    margin-right: 0 !important;
  }
}
</style>