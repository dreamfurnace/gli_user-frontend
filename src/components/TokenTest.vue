<template>
  <div class="token-test">
    <h1>디자인 토큰 실시간 테스트</h1>

    <!-- 색상 테스트 -->
    <section class="test-section">
      <h2>색상 테스트</h2>
      <div class="color-test">
        <div
          v-for="shade in ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']"
          :key="shade"
          class="color-box"
          :style="{ backgroundColor: `var(--color-primary-${shade})` }"
        >
          {{ shade }}
        </div>
      </div>
    </section>

    <!-- 타이포그래피 테스트 -->
    <section class="test-section">
      <h2>타이포그래피 테스트</h2>
      <div class="typography-test">
        <div
          v-for="size in ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']"
          :key="size"
          class="text-sample"
          :style="{ fontSize: `var(--font-size-${size})` }"
        >
          폰트 크기 {{ size }}: 안녕하세요, 디자인 토큰입니다!
        </div>
      </div>
    </section>

    <!-- 간격 테스트 -->
    <section class="test-section">
      <h2>간격 테스트</h2>
      <div class="spacing-test">
        <div
          v-for="space in ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']"
          :key="space"
          class="spacing-box"
          :style="{
            width: `var(--spacing-${space})`,
            height: `var(--spacing-${space})`,
            margin: `var(--spacing-sm)`,
          }"
        >
          {{ space }}
        </div>
      </div>
    </section>

    <!-- 유틸리티 함수 테스트 -->
    <section class="test-section">
      <h2>유틸리티 함수 테스트</h2>
      <div class="utility-test">
        <button class="test-btn" :style="primaryButtonStyle" @click="showTokenInfo">
          Primary Button (유틸리티 함수 사용)
        </button>

        <div class="info-display" v-if="showInfo">
          <h3>현재 사용된 토큰 값:</h3>
          <pre>{{ tokenInfo }}</pre>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { colors, typography, spacing, shadows, borderRadius } from '@/styles/utils'

const showInfo = ref(false)

// 유틸리티 함수를 사용한 스타일 객체
const primaryButtonStyle = computed(() => ({
  backgroundColor: colors.primary('500'),
  color: colors.text('inverse'),
  fontSize: typography.fontSize('base'),
  fontWeight: typography.fontWeight('medium'),
  padding: spacing('md'),
  borderRadius: borderRadius('md'),
  border: 'none',
  cursor: 'pointer',
  boxShadow: shadows('md'),
  transition: 'all 0.3s ease',
}))

// 토큰 정보 표시
const tokenInfo = computed(() => ({
  primaryColor: colors.primary('500'),
  textColor: colors.text('inverse'),
  fontSize: typography.fontSize('base'),
  fontWeight: typography.fontWeight('medium'),
  padding: spacing('md'),
  borderRadius: borderRadius('md'),
  shadow: shadows('md'),
}))

const showTokenInfo = () => {
  showInfo.value = !showInfo.value
  console.log('디자인 토큰 정보:', tokenInfo.value)
}
</script>

<style scoped>
.token-test {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  font-family: var(--font-family-primary);
}

.token-test h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.test-section {
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-xl);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.test-section h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border-light);
  padding-bottom: var(--spacing-md);
}

/* 색상 테스트 */
.color-test {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-md);
}

.color-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  border-radius: var(--border-radius-md);
  color: white;
  font-weight: var(--font-weight-semibold);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-light);
}

/* 타이포그래피 테스트 */
.typography-test {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.text-sample {
  padding: var(--spacing-md);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  border-left: 4px solid var(--color-primary-500);
}

/* 간격 테스트 */
.spacing-test {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.spacing-box {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-primary-500);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--border-radius-sm);
  min-width: 20px;
  min-height: 20px;
}

/* 유틸리티 테스트 */
.utility-test {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.test-btn:hover {
  background-color: var(--color-primary-600) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg) !important;
}

.info-display {
  padding: var(--spacing-lg);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.info-display h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.info-display pre {
  background-color: var(--color-background-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow-x: auto;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .token-test {
    padding: var(--spacing-lg);
  }

  .color-test {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  }

  .spacing-test {
    justify-content: center;
  }
}
</style>
