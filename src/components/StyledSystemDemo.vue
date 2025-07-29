<template>
  <div class="styled-system-demo">
    <div class="demo-header">
      <h1>CSS-in-JS 스타일 시스템 데모</h1>
      <p>디자인 토큰 기반의 타입 안전한 스타일링 시스템</p>
    </div>

    <!-- 버튼 데모 -->
    <section class="demo-section">
      <h2>버튼 컴포넌트</h2>
      <div class="demo-grid">
        <div class="demo-item">
          <h3>Primary 버튼</h3>
          <div class="button-group">
            <StyledButton size="sm">Small</StyledButton>
            <StyledButton size="md">Medium</StyledButton>
            <StyledButton size="lg">Large</StyledButton>
          </div>
        </div>

        <div class="demo-item">
          <h3>Secondary 버튼</h3>
          <div class="button-group">
            <StyledButton variant="secondary" size="sm">Small</StyledButton>
            <StyledButton variant="secondary" size="md">Medium</StyledButton>
            <StyledButton variant="secondary" size="lg">Large</StyledButton>
          </div>
        </div>

        <div class="demo-item">
          <h3>Outline 버튼</h3>
          <div class="button-group">
            <StyledButton variant="outline" size="sm">Small</StyledButton>
            <StyledButton variant="outline" size="md">Medium</StyledButton>
            <StyledButton variant="outline" size="lg">Large</StyledButton>
          </div>
        </div>

        <div class="demo-item">
          <h3>Disabled 버튼</h3>
          <div class="button-group">
            <StyledButton disabled>Disabled</StyledButton>
            <StyledButton variant="secondary" disabled>Disabled</StyledButton>
            <StyledButton variant="outline" disabled>Disabled</StyledButton>
          </div>
        </div>
      </div>
    </section>

    <!-- 스타일 유틸리티 데모 -->
    <section class="demo-section">
      <h2>스타일 유틸리티</h2>
      <div class="demo-grid">
        <div class="demo-item">
          <h3>색상 유틸리티</h3>
          <div class="color-demo">
            <div
              v-for="shade in ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']"
              :key="shade"
              class="color-box"
              :style="{ backgroundColor: `var(--color-primary-${shade})` }"
            >
              {{ shade }}
            </div>
          </div>
        </div>

        <div class="demo-item">
          <h3>타이포그래피 유틸리티</h3>
          <div class="typography-demo">
            <div
              v-for="size in ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']"
              :key="size"
              class="text-sample"
              :style="{ fontSize: `var(--font-size-${size})` }"
            >
              폰트 크기 {{ size }}
            </div>
          </div>
        </div>

        <div class="demo-item">
          <h3>간격 유틸리티</h3>
          <div class="spacing-demo">
            <div
              v-for="space in ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']"
              :key="space"
              class="spacing-box"
              :style="{
                width: `var(--spacing-${space})`,
                height: `var(--spacing-${space})`,
              }"
            >
              {{ space }}
            </div>
          </div>
        </div>

        <div class="demo-item">
          <h3>그림자 유틸리티</h3>
          <div class="shadow-demo">
            <div
              v-for="shadow in ['sm', 'md', 'lg']"
              :key="shadow"
              class="shadow-box"
              :style="{ boxShadow: `var(--shadow-${shadow})` }"
            >
              {{ shadow }} 그림자
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 코드 예제 -->
    <section class="demo-section">
      <h2>사용법 예제</h2>
      <div class="code-example">
        <h3>버튼 컴포넌트 사용</h3>
        <pre><code>&lt;StyledButton variant="primary" size="md"&gt;
  클릭하세요
&lt;/StyledButton&gt;</code></pre>

        <h3>스타일 유틸리티 사용</h3>
        <pre><code>import { createButtonStyle, color, typography } from '@/styles/styled-system'

const buttonStyle = createButtonStyle('primary', 'md')
const primaryColor = color('primary', '500')
const fontSize = typography.fontSize('lg')</code></pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import StyledButton from './StyledButton.vue'
</script>

<style scoped>
.styled-system-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  font-family: var(--font-family-primary);
}

.demo-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-2xl);
  background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100));
  border-radius: var(--border-radius-lg);
}

.demo-header h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.demo-header p {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.demo-section {
  margin-bottom: var(--spacing-3xl);
  padding: var(--spacing-xl);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
}

.demo-section h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
  border-bottom: 2px solid var(--color-border-light);
  padding-bottom: var(--spacing-md);
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.demo-item {
  padding: var(--spacing-lg);
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
}

.demo-item h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.color-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: var(--spacing-sm);
}

.color-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: var(--border-radius-sm);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border-light);
}

.typography-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.text-sample {
  padding: var(--spacing-sm);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-sm);
  border-left: 3px solid var(--color-primary-500);
}

.spacing-demo {
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

.shadow-demo {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.shadow-box {
  padding: var(--spacing-lg);
  background-color: var(--color-background-primary);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border-light);
  text-align: center;
  font-weight: var(--font-weight-medium);
}

.code-example {
  background-color: var(--color-background-secondary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border-light);
}

.code-example h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.code-example pre {
  background-color: var(--color-background-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--color-border-light);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  overflow-x: auto;
  margin-bottom: var(--spacing-lg);
}

.code-example code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .styled-system-demo {
    padding: var(--spacing-lg);
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .color-demo {
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  }
}
</style>
