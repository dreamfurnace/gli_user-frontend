# Lawide Frontend Documentation

## 📋 개요

이 문서는 Lawide 프로젝트의 프론트엔드 개발 가이드와 문서를 통합한 것입니다.

## 🏗️ 프로젝트 구조

### 주요 기능

#### 1. UI/UX 시스템

- 반응형/접근성 유틸리티 및 컴포저블 구현 (`src/utils/accessibility.ts`, `src/composables/useAccessibility.ts`)
- Button, Input 등 핵심 UI 컴포넌트 및 타입/테스트/스토리북 문서화
- `/accessibility-demo` 페이지에서 실제 접근성/반응형 데모 제공

#### 2. 애니메이션/트랜지션

- Fade/Slide/Scale 트랜지션 컴포넌트, Spinner 등 로딩 컴포넌트 구현
- 글로벌 애니메이션 스타일(`keyframes.css`, `transitions.css`) 적용
- `/animation-demo` 페이지에서 트랜지션/스피너 데모 제공

#### 3. 테스트/문서화 인프라

- Storybook 기반 UI 문서화 및 시나리오별 데모
- Vitest 기반 단위 테스트, Playwright 기반 E2E 테스트 환경 구축
- 앱/스토리북 환경 분리 및 통합 테스트 스크립트 제공

#### 4. 로그인/세션/동시 로그인 UX 개선

- 동시 로그인 제한 시, 세션 정보(IP, 장비, 시간 등)를 모달(SessionConflictModal.vue)로 표시하고, 강제 로그아웃/취소 버튼 제공
- 로그인/더미 로그인 모두 세션 충돌 시 모달에 세션 정보 표시
- 강제 로그아웃 후 재로그인 자동 시도, localStorage user/tokens 저장 및 인증 상태 관리
- 429(Too Many Requests) 등 에러 발생 시 UX 분기 및 안내 강화
- router/index.ts에서 / → HomeView로 라우팅 수정, 로그인 성공 시 홈으로 이동 보장

## 🎨 디자인 시스템

### 디자인 토큰 시스템

#### 색상 시스템

- **Primary Colors**: 메인 브랜드 색상 (#0d6efd 기반)
- **Secondary Colors**: 보조 색상 (회색 계열)
- **Brand Colors**: 브랜드 특화 색상 (녹색, 골드, 오렌지)
- **Semantic Colors**: 의미론적 색상 (성공, 경고, 오류, 정보)
- **Background Colors**: 배경 색상
- **Text Colors**: 텍스트 색상
- **Border Colors**: 테두리 색상

#### 타이포그래피

- **Font Family**: Noto Sans KR
- **Font Sizes**: xs(11px) ~ 3xl(24px)
- **Font Weights**: normal(400) ~ bold(700)
- **Line Heights**: tight(1.2) ~ loose(1.8)

#### 간격 시스템

- **Spacing**: xs(4px) ~ 4xl(70px)
- 8px 기반 스케일링 시스템

#### 그림자 시스템

- **Shadows**: sm, md, lg, sidebar, chip
- 다양한 깊이와 용도별 그림자

#### 테두리 반경

- **Border Radius**: sm(4px) ~ full(50%)
- 일관된 둥근 모서리 시스템

#### Z-인덱스

- **Z-Index**: base(0) ~ tooltip(1070)
- 레이어링 시스템

#### 애니메이션

- **Duration**: fast(0.2s) ~ slow(0.5s)
- **Easing**: ease, ease-in, ease-out, ease-in-out

### 사용 방법

#### 1. CSS 커스텀 프로퍼티 사용

```css
.my-component {
  background-color: var(--color-primary-500);
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}
```

#### 2. TypeScript 유틸리티 함수 사용

```typescript
import { colors, typography, spacing, shadows } from '@/styles/utils'

const styles = {
  backgroundColor: colors.primary('500'),
  color: colors.text('primary'),
  fontSize: typography.fontSize('lg'),
  padding: spacing('xl'),
  boxShadow: shadows('md'),
}
```

#### 3. 컴포넌트 스타일 프리셋 사용

```typescript
import { componentStyles } from '@/styles/utils'

// 버튼 스타일 적용
const buttonStyle = componentStyles.button.primary

// 카드 스타일 적용
const cardStyle = componentStyles.card.default
```

### 반응형 디자인

브레이크포인트 시스템:

- **sm**: 576px
- **md**: 768px
- **lg**: 992px
- **xl**: 1200px
- **2xl**: 1400px

```css
@media (min-width: var(--breakpoint-md)) {
  .responsive-component {
    /* 태블릿 이상 스타일 */
  }
}
```

## 🧪 테스트 URL

### 개발 및 테스트용 페이지

1. **디자인 토큰 데모**: `/design-tokens`

   - 디자인 토큰 시스템 시각화
   - 색상 팔레트, 타이포그래피, 간격, 컴포넌트 스타일 확인

2. **토큰 테스트**: `/token-test`

   - 디자인 토큰 기능 테스트
   - 토큰 시스템 검증

3. **스타일드 시스템 데모**: `/styled-system`

   - 스타일드 시스템 컴포넌트 데모
   - 스타일링 시스템 검증

4. **접근성 데모**: `/accessibility-demo`

   - 접근성 기능 테스트
   - 반응형 디자인 검증

5. **애니메이션 데모**: `/animation-demo`
   - 트랜지션 및 애니메이션 데모
   - 로딩 컴포넌트 테스트

### 사용 방법

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 각 테스트 URL 접속
3. 기능별 데모 및 테스트 수행

## 🎯 디자인 원칙

1. **일관성**: 모든 UI 요소에서 동일한 디자인 토큰 사용
2. **확장성**: 새로운 색상이나 스타일 추가 시 토큰 시스템 확장
3. **접근성**: WCAG 2.1 AA 기준 준수
4. **반응형**: 모바일-퍼스트 접근법
5. **성능**: CSS 커스텀 프로퍼티 활용으로 최적화

## 🔧 커스터마이징

새로운 디자인 토큰을 추가하려면:

1. `design-tokens.ts`에 토큰 정의 추가
2. `tokens.css`에 CSS 변수 추가
3. `utils.ts`에 유틸리티 함수 추가
4. 데모 컴포넌트에서 테스트

## 📚 참고 자료

- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Design Tokens](https://www.designtokens.org/)
- [Vue.js Style Guide](https://vuejs.org/style-guide/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 📋 체크리스트

### ✅ 완료된 작업

- [x] lawide_publishing CSS 파일 분석
- [x] 디자인 토큰 추출 및 정의
- [x] TypeScript 인터페이스 생성
- [x] CSS 커스텀 프로퍼티 생성
- [x] 유틸리티 함수 구현
- [x] 컴포넌트 스타일 프리셋 생성
- [x] 데모 컴포넌트 생성
- [x] 라우터 설정
- [x] 문서화

### 🔄 다음 단계

- [ ] CSS-in-JS/Styled Components 기반 스타일링 시스템 구축
- [ ] ThemeProvider 설정
- [ ] 공통 스타일 유틸리티 함수 생성
- [ ] 기본 스타일 컴포넌트 구현
