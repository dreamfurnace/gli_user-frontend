<template>
  <div class="accessibility-demo">
    <header class="demo-header">
      <h1>접근성 및 반응형 컴포넌트 데모</h1>
      <p>WCAG 2.1 AA 수준의 접근성을 준수하는 컴포넌트들을 테스트해보세요.</p>
    </header>

    <main class="demo-content">
      <!-- 접근성 테스트 섹션 -->
      <section class="demo-section">
        <h2>접근성 테스트</h2>

        <div class="test-grid">
          <!-- 키보드 네비게이션 테스트 -->
          <div class="test-card">
            <h3>키보드 네비게이션</h3>
            <p>Tab 키를 사용하여 버튼들 사이를 이동해보세요.</p>
            <div class="button-group">
              <Button variant="primary" @click="handleClick">기본 버튼</Button>
              <Button variant="secondary" @click="handleClick">보조 버튼</Button>
              <Button variant="outline" @click="handleClick">아웃라인 버튼</Button>
              <Button variant="ghost" @click="handleClick">고스트 버튼</Button>
              <Button variant="danger" @click="handleClick">위험 버튼</Button>
            </div>
          </div>

          <!-- 스크린 리더 테스트 -->
          <div class="test-card">
            <h3>스크린 리더 지원</h3>
            <p>스크린 리더로 다음 요소들을 읽어보세요.</p>
            <div class="form-group">
              <Input
                v-model="formData.name"
                label="이름"
                placeholder="이름을 입력하세요"
                required
                :invalid="!!formData.nameError"
                :error-message="formData.nameError"
                help-text="실제 이름을 입력해주세요"
              />
            </div>
            <div class="form-group">
              <Input
                v-model="formData.email"
                type="email"
                label="이메일"
                placeholder="이메일을 입력하세요"
                required
                :invalid="!!formData.emailError"
                :error-message="formData.emailError"
                icon="fas fa-envelope"
              />
            </div>
          </div>

          <!-- 포커스 표시 테스트 -->
          <div class="test-card">
            <h3>포커스 표시</h3>
            <p>각 요소에 포커스를 주고 포커스 표시를 확인해보세요.</p>
            <div class="focus-test">
              <Button variant="primary">포커스 테스트 버튼</Button>
              <Input placeholder="포커스 테스트 입력" />
              <Button variant="outline">다른 버튼</Button>
            </div>
          </div>
        </div>
      </section>

      <!-- 반응형 디자인 테스트 -->
      <section class="demo-section">
        <h2>반응형 디자인 테스트</h2>

        <div class="responsive-test">
          <div class="size-indicator">
            <p>
              현재 화면 크기: <strong>{{ currentBreakpoint }}</strong>
            </p>
            <p>
              뷰포트 너비: <strong>{{ viewportWidth }}px</strong>
            </p>
          </div>

          <div class="responsive-grid">
            <div class="responsive-card">
              <h3>모바일 최적화</h3>
              <p>44px 최소 터치 타겟</p>
              <div class="touch-targets">
                <Button size="sm">소</Button>
                <Button size="md">중</Button>
                <Button size="lg">대</Button>
              </div>
            </div>

            <div class="responsive-card">
              <h3>반응형 입력 필드</h3>
              <p>화면 크기에 따라 크기가 조정됩니다</p>
              <div class="input-group">
                <Input
                  v-model="formData.search"
                  type="search"
                  placeholder="검색어를 입력하세요"
                  icon="fas fa-search"
                  full-width
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 컴포넌트 변형 테스트 -->
      <section class="demo-section">
        <h2>컴포넌트 변형</h2>

        <div class="variants-grid">
          <!-- 버튼 변형 -->
          <div class="variant-card">
            <h3>버튼 변형</h3>
            <div class="button-variants">
              <div class="variant-group">
                <h4>크기</h4>
                <Button size="xs">XS</Button>
                <Button size="sm">SM</Button>
                <Button size="md">MD</Button>
                <Button size="lg">LG</Button>
                <Button size="xl">XL</Button>
              </div>

              <div class="variant-group">
                <h4>스타일</h4>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>

              <div class="variant-group">
                <h4>상태</h4>
                <Button>기본</Button>
                <Button disabled>비활성화</Button>
                <Button loading>로딩</Button>
                <Button rounded>둥근 모서리</Button>
                <Button full-width>전체 너비</Button>
              </div>
            </div>
          </div>

          <!-- 입력 필드 변형 -->
          <div class="variant-card">
            <h3>입력 필드 변형</h3>
            <div class="input-variants">
              <div class="variant-group">
                <h4>크기</h4>
                <Input size="sm" placeholder="작은 입력" />
                <Input size="md" placeholder="중간 입력" />
                <Input size="lg" placeholder="큰 입력" />
              </div>

              <div class="variant-group">
                <h4>타입</h4>
                <Input type="text" placeholder="텍스트" />
                <Input type="email" placeholder="이메일" />
                <Input type="password" placeholder="비밀번호" />
                <Input type="number" placeholder="숫자" />
                <Input type="search" placeholder="검색" />
              </div>

              <div class="variant-group">
                <h4>상태</h4>
                <Input placeholder="기본" />
                <Input placeholder="비활성화" disabled />
                <Input placeholder="읽기 전용" readonly />
                <Input placeholder="오류" invalid />
                <Input placeholder="로딩" loading />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 접근성 도구 -->
      <section class="demo-section">
        <h2>접근성 도구</h2>

        <div class="accessibility-tools">
          <div class="tool-card">
            <h3>접근성 검사</h3>
            <div class="tool-controls">
              <Button @click="runAccessibilityCheck">접근성 검사 실행</Button>
              <Button @click="toggleHighContrast">고대비 모드 토글</Button>
              <Button @click="toggleReducedMotion">모션 감소 토글</Button>
            </div>
            <div v-if="accessibilityResults" class="accessibility-results">
              <h4>검사 결과:</h4>
              <ul>
                <li v-for="result in accessibilityResults" :key="result.id" :class="result.status">
                  {{ result.message }}
                </li>
              </ul>
            </div>
          </div>

          <div class="tool-card">
            <h3>접근성 정보</h3>
            <div class="accessibility-info">
              <p><strong>색상 대비:</strong> {{ colorContrast }}</p>
              <p><strong>포커스 표시:</strong> {{ focusVisible ? '활성화' : '비활성화' }}</p>
              <p><strong>모션 감소:</strong> {{ prefersReducedMotion ? '활성화' : '비활성화' }}</p>
              <p><strong>고대비 모드:</strong> {{ prefersHighContrast ? '활성화' : '비활성화' }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Button, Input } from '@/components/ui'
import { useAccessibility } from '@/composables/useAccessibility'

// 접근성 훅 사용
const {
  colorContrast,
  focusVisible,
  prefersReducedMotion,
  prefersHighContrast,
  runAccessibilityCheck: runCheck,
} = useAccessibility()

// 반응형 상태
const viewportWidth = ref(window.innerWidth)
const currentBreakpoint = ref('')

// 폼 데이터
const formData = reactive({
  name: '',
  email: '',
  search: '',
  nameError: '',
  emailError: '',
})

// 접근성 검사 결과
const accessibilityResults = ref<any[]>([])

// 이벤트 핸들러
const handleClick = () => {
  console.log('버튼 클릭됨')
}

const runAccessibilityCheck = async () => {
  //   const results = await runCheck()
  const results = runCheck ? await runCheck() : []
  accessibilityResults.value = results
}

const toggleHighContrast = () => {
  document.documentElement.classList.toggle('high-contrast')
}

const toggleReducedMotion = () => {
  document.documentElement.classList.toggle('reduced-motion')
}

// 반응형 브레이크포인트 계산
const calculateBreakpoint = (width: number) => {
  if (width < 640) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  return 'xl'
}

// 뷰포트 크기 변경 감지
const handleResize = () => {
  viewportWidth.value = window.innerWidth
  currentBreakpoint.value = calculateBreakpoint(window.innerWidth)
}

// 라이프사이클
onMounted(() => {
  currentBreakpoint.value = calculateBreakpoint(window.innerWidth)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.accessibility-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 40px;
}

.demo-header h1 {
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.demo-header p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.demo-section {
  margin-bottom: 60px;
}

.demo-section h2 {
  color: var(--color-text-primary);
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-border-light);
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.test-card {
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}

.test-card h3 {
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.test-card p {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.form-group {
  margin-bottom: 16px;
}

.focus-test {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.responsive-test {
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.size-indicator {
  background: var(--color-background-secondary);
  padding: 16px;
  border-radius: var(--border-radius-md);
  margin-bottom: 24px;
  text-align: center;
}

.size-indicator p {
  margin: 4px 0;
  color: var(--color-text-secondary);
}

.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.responsive-card {
  background: var(--color-background-secondary);
  padding: 20px;
  border-radius: var(--border-radius-md);
  text-align: center;
}

.responsive-card h3 {
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.responsive-card p {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.touch-targets {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.input-group {
  width: 100%;
}

.variants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 32px;
}

.variant-card {
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.variant-card h3 {
  color: var(--color-text-primary);
  margin-bottom: 20px;
}

.button-variants,
.input-variants {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.variant-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variant-group h4 {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.variant-group .ui-button,
.variant-group .ui-input-wrapper {
  align-self: flex-start;
}

.accessibility-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.tool-card {
  background: var(--color-background-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--border-radius-lg);
  padding: 24px;
}

.tool-card h3 {
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.tool-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.accessibility-results {
  background: var(--color-background-secondary);
  padding: 16px;
  border-radius: var(--border-radius-md);
}

.accessibility-results h4 {
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.accessibility-results ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.accessibility-results li {
  padding: 4px 0;
  color: var(--color-text-secondary);
}

.accessibility-results li.pass {
  color: var(--color-semantic-success);
}

.accessibility-results li.fail {
  color: var(--color-semantic-error);
}

.accessibility-results li.warning {
  color: var(--color-semantic-warning);
}

.accessibility-info p {
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.accessibility-info strong {
  color: var(--color-text-primary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .accessibility-demo {
    padding: 16px;
  }

  .test-grid,
  .responsive-grid,
  .variants-grid,
  .accessibility-tools {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .variant-group .ui-button,
  .variant-group .ui-input-wrapper {
    align-self: stretch;
  }
}

/* 고대비 모드 */
.high-contrast {
  --color-border-light: #000000;
  --color-text-primary: #000000;
  --color-text-secondary: #000000;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f0f0f0;
}

/* 모션 감소 */
.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}
</style>
