<template>
  <div class="design-token-demo">
    <h1>디자인 토큰 시스템 데모</h1>

    <!-- 색상 팔레트 -->
    <section class="color-palette">
      <h2>색상 팔레트</h2>

      <div class="color-group">
        <h3>Primary Colors</h3>
        <div class="color-swatches">
          <div
            v-for="shade in primaryShades"
            :key="shade"
            class="color-swatch"
            :style="{ backgroundColor: `var(--color-primary-${shade})` }"
          >
            <span class="color-name">{{ shade }}</span>
            <span class="color-value">{{ getColorValue('primary', shade) }}</span>
          </div>
        </div>
      </div>

      <div class="color-group">
        <h3>Brand Colors</h3>
        <div class="color-swatches">
          <div
            v-for="color in brandColors"
            :key="color"
            class="color-swatch"
            :style="{ backgroundColor: `var(--color-brand-${color})` }"
          >
            <span class="color-name">{{ color }}</span>
            <span class="color-value">{{ getColorValue('brand', color) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 타이포그래피 -->
    <section class="typography">
      <h2>타이포그래피</h2>

      <div class="font-sizes">
        <div
          v-for="size in fontSizes"
          :key="size"
          class="font-size-demo"
          :style="{ fontSize: `var(--font-size-${size})` }"
        >
          <span class="size-label">{{ size }}:</span>
          <span class="sample-text">안녕하세요, 디자인 토큰 시스템입니다.</span>
        </div>
      </div>
    </section>

    <!-- 간격 -->
    <section class="spacing">
      <h2>간격 시스템</h2>

      <div class="spacing-demos">
        <div v-for="space in spacingSizes" :key="space" class="spacing-demo">
          <span class="spacing-label">{{ space }}:</span>
          <div
            class="spacing-box"
            :style="{ width: `var(--spacing-${space})`, height: `var(--spacing-${space})` }"
          ></div>
          <span class="spacing-value">{{ getSpacingValue(space) }}</span>
        </div>
      </div>
    </section>

    <!-- 컴포넌트 스타일 -->
    <section class="component-styles">
      <h2>컴포넌트 스타일</h2>

      <div class="component-demos">
        <div class="button-demos">
          <h3>버튼</h3>
          <button class="btn-primary">Primary Button</button>
          <button class="btn-secondary">Secondary Button</button>
        </div>

        <div class="card-demo">
          <h3>카드</h3>
          <div class="card">
            <h4>카드 제목</h4>
            <p>이것은 디자인 토큰을 사용한 카드 컴포넌트입니다.</p>
          </div>
        </div>

        <div class="input-demo">
          <h3>입력 필드</h3>
          <input type="text" class="input-field" placeholder="입력해주세요..." />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { designTokens } from '@/styles/design-tokens'

// 색상 팔레트 데이터
const primaryShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
const brandColors = ['green', 'gold', 'orange']
const fontSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']
const spacingSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']

// 색상 값 가져오기
const getColorValue = (category: string, name: string) => {
  if (category === 'primary') {
    return designTokens.colors.primary[name as unknown as keyof typeof designTokens.colors.primary]
  } else if (category === 'brand') {
    return designTokens.colors.brand[name as keyof typeof designTokens.colors.brand]
  }
  return ''
}

// 간격 값 가져오기
const getSpacingValue = (size: string) => {
  return designTokens.spacing[size as keyof typeof designTokens.spacing]
}
</script>

<style scoped>
.design-token-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  font-family: var(--font-family-primary);
}

.design-token-demo h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.design-token-demo h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-border-light);
  padding-bottom: var(--spacing-md);
}

.design-token-demo h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.design-token-demo section {
  margin-bottom: var(--spacing-3xl);
}

/* 색상 팔레트 스타일 */
.color-group {
  margin-bottom: var(--spacing-2xl);
}

.color-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.color-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
  min-height: 100px;
  justify-content: center;
}

.color-swatch .color-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-bottom: var(--spacing-xs);
}

.color-swatch .color-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 타이포그래피 스타일 */
.font-sizes {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.font-size-demo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.size-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  min-width: 60px;
}

.sample-text {
  color: var(--color-text-primary);
}

/* 간격 스타일 */
.spacing-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.spacing-demo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.spacing-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  min-width: 60px;
}

.spacing-box {
  background-color: var(--color-primary-500);
  border-radius: var(--border-radius-sm);
  min-width: 20px;
}

.spacing-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* 컴포넌트 스타일 */
.component-demos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-2xl);
}

.button-demos {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.btn-primary {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: none;
  cursor: pointer;
  transition: all var(--animation-duration-normal) var(--animation-easing-ease);
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
}

.btn-secondary {
  background-color: var(--color-secondary-50);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-medium);
  cursor: pointer;
  transition: all var(--animation-duration-normal) var(--animation-easing-ease);
}

.btn-secondary:hover {
  background-color: var(--color-secondary-100);
}

.card {
  background-color: var(--color-background-primary);
  box-shadow: var(--shadow-md);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border-light);
}

.card h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.card p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
}

.input-field {
  width: 100%;
  font-size: var(--font-size-base);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-medium);
  background-color: var(--color-background-primary);
  transition: all var(--animation-duration-normal) var(--animation-easing-ease);
  outline: none;
}

.input-field:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px var(--color-primary-100);
}

.input-field::placeholder {
  color: var(--color-text-muted);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .design-token-demo {
    padding: var(--spacing-lg);
  }

  .color-swatches {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .spacing-demos {
    grid-template-columns: 1fr;
  }

  .component-demos {
    grid-template-columns: 1fr;
  }
}
</style>
