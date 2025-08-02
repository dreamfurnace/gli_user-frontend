# GLI Frontend Testing Guide

## 📋 테스트 구조 개요

GLI 프론트엔드 프로젝트는 다양한 유형의 테스트를 포함하고 있어 종합적인 품질 보증을 제공합니다.

## 📁 테스트 파일 구조

```
gli_user-frontend/
├── tests/                          # 새로운 Playwright E2E 테스트
│   ├── e2e/
│   │   ├── investment.spec.ts       # RWA 투자 플로우 테스트 (15개 시나리오)
│   │   ├── shopping.spec.ts         # 쇼핑몰 기능 테스트 (18개 시나리오)
│   │   ├── portfolio.spec.ts        # 투자 포트폴리오 테스트 (12개 시나리오)
│   │   └── face-verification.spec.ts # 얼굴 인증 테스트 (15개 시나리오)
│   ├── global-setup.ts              # 글로벌 테스트 설정
│   └── global-teardown.ts           # 글로벌 테스트 정리
├── e2e/                            # 기존 E2E 테스트 (레거시)
│   ├── tests/
│   │   ├── contract-workflow.spec.ts # 계약 워크플로우 테스트
│   │   ├── accessibility.spec.ts     # 접근성 테스트
│   │   ├── integration.spec.ts       # 통합 테스트
│   │   └── main-flow.spec.js         # 메인 플로우 테스트
│   ├── global-setup.js              # 레거시 글로벌 설정
│   ├── global-teardown.js           # 레거시 글로벌 정리
│   └── fixtures/                    # 테스트 픽스처 파일
├── src/tests/                      # 유닛/통합 테스트
│   └── integration.test.js          # Vue 컴포넌트 통합 테스트
├── playwright.config.ts            # Playwright 설정 파일
└── package.json                    # 테스트 스크립트 정의
```

## 🧪 테스트 유형별 분석

### 1. E2E 테스트 (End-to-End Tests)

#### A. 새로운 GLI 플랫폼 테스트 (`tests/e2e/`)

**📊 투자 플로우 테스트 (`investment.spec.ts`)**
- **총 15개 테스트 시나리오**
- **커버하는 기능:**
  - RWA 투자 자산 목록 조회 및 표시
  - 자산 필터링 (카테고리, 위험도, 검색)
  - 투자 모달 기능
  - 투자 금액 유효성 검사
  - 페이지네이션
  - 로딩/에러 상태 처리

**🛒 쇼핑몰 테스트 (`shopping.spec.ts`)**
- **총 18개 테스트 시나리오**
- **커버하는 기능:**
  - 상품 목록 조회
  - 카테고리 및 상품 유형 필터링
  - 상품 검색 및 정렬
  - 장바구니 및 구매 기능
  - 품절 상품 처리
  - 반응형 디자인

**📈 포트폴리오 테스트 (`portfolio.spec.ts`)**
- **총 12개 테스트 시나리오**
- **커버하는 기능:**
  - 투자 대시보드 표시
  - 카테고리별/위험도별 분산 분석
  - 최근 투자 내역
  - 손익 계산 및 표시
  - 빈 상태 처리

#### B. 레거시 테스트 (`e2e/tests/`)

**📋 계약 워크플로우 테스트 (`contract-workflow.spec.ts`)**
- **4개 그룹으로 구성된 대규모 테스트**
- **테스트 그룹:**
  - Group 1: 기본 네비게이션 (12개 테스트)
  - Group 2: 폼 입력 테스트
  - Group 3: 유효성 검사 및 UI 테스트
  - Group 4: 고급 기능

**♿ 접근성 테스트 (`accessibility.spec.ts`)**
- 웹 접근성 표준 준수 확인
- 키보드 내비게이션 테스트
- 스크린 리더 지원

**🔗 통합 테스트 (`integration.spec.ts`)**
- 컴포넌트 간 상호작용 테스트
- 전체 사용자 여정 검증

### 2. 유닛/통합 테스트 (`src/tests/`)

**🧩 Vue 컴포넌트 통합 테스트 (`integration.test.js`)**
- Vue Test Utils 사용
- Vitest 테스트 프레임워크
- Pinia 스토어 테스트
- 컴포넌트 마운팅 및 상호작용 테스트

## 🚀 테스트 실행 방법

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치 (처음만)
npx playwright install
```

### 2. 테스트 실행 명령어

#### E2E 테스트 (Playwright)

```bash
# 모든 E2E 테스트 실행 (헤드리스)
npm run test:e2e

# UI 모드로 실행 (시각적 디버깅)
npm run test:e2e:ui

# 브라우저를 보면서 실행
npm run test:e2e:headed

# 개별 테스트 파일 실행
npx playwright test tests/e2e/investment.spec.ts

# 특정 브라우저에서만 실행
npx playwright test --project=chromium

# 모바일에서 테스트
npx playwright test --project="Mobile Chrome"
```

#### 디버깅 모드

```bash
# 디버그 모드로 실행
npm run test:e2e:debug

# 특정 테스트만 디버그
npx playwright test tests/e2e/investment.spec.ts --debug

# 특정 테스트 케이스만 실행
npx playwright test -g "사용자가 RWA 투자 자산 목록을 조회할 수 있다"
```

#### 레거시 E2E 테스트

```bash
# 전체 레거시 테스트 실행
npx playwright test e2e/

# 계약 워크플로우 테스트 (그룹별)
TEST_GROUP=1 npx playwright test e2e/tests/contract-workflow.spec.ts
TEST_GROUP=2 npx playwright test e2e/tests/contract-workflow.spec.ts
TEST_GROUP=all npx playwright test e2e/tests/contract-workflow.spec.ts

# 접근성 테스트
npx playwright test e2e/tests/accessibility.spec.ts
```

#### 유닛/통합 테스트 (Vitest)

```bash
# 유닛 테스트 실행
npm run test:unit

# 워치 모드
npm run test:unit -- --watch

# 커버리지 포함
npm run test:unit -- --coverage
```

### 3. 테스트 결과 확인

```bash
# HTML 리포트 보기
npm run test:e2e:report

# 또는 직접 실행
npx playwright show-report
```

## 📊 테스트 범위 및 통계

### 전체 테스트 통계

| 테스트 유형 | 파일 수 | 테스트 케이스 수 | 주요 기능 |
|------------|---------|-----------------|-----------|
| **새로운 E2E** | 4 | **60개** | GLI 플랫폼 핵심 기능 + 얼굴 인증 |
| **레거시 E2E** | 4 | **30+개** | 계약 시스템, 접근성 |
| **유닛/통합** | 1 | **10+개** | Vue 컴포넌트 |
| **총계** | **9** | **100+개** | **전체 시스템** |

### 새로운 E2E 테스트 상세 분석

#### 📈 Investment Tests (15개 시나리오)
- ✅ 자산 목록 조회 및 표시
- ✅ 카테고리/위험도 필터링
- ✅ 검색 기능
- ✅ 투자 모달 (유효성 검사, 수익률 계산)
- ✅ 페이지네이션
- ✅ 로딩/에러 상태
- ✅ 모달 제어 (열기/닫기)

#### 🛒 Shopping Tests (18개 시나리오)
- ✅ 상품 목록 및 카테고리
- ✅ 필터링 (유형, 검색, 정렬)
- ✅ 장바구니 추가
- ✅ 바로 구매
- ✅ 품절 상품 처리
- ✅ 가격 정보 표시
- ✅ 모바일 반응형
- ✅ 상태 관리

#### 📊 Portfolio Tests (12개 시나리오)
- ✅ 투자 요약 대시보드
- ✅ 카테고리별 분산 분석
- ✅ 위험도별 분산
- ✅ 최근 투자 내역
- ✅ 손익 계산 및 표시
- ✅ 빈 상태 처리
- ✅ 수치 포맷팅

#### 🔐 Face Verification Tests (15개 시나리오)
- ✅ 얼굴 인증 버튼 표시 및 클릭
- ✅ 인증 카드 표시 및 UI 요소
- ✅ 카메라 권한 요청 및 로딩 상태
- ✅ 인증 취소 및 상태 초기화
- ✅ 실시간 상태 표시 (대기/감지/성공/실패)
- ✅ 진행률 표시 및 업데이트
- ✅ 에러 상황 처리 및 메시지
- ✅ 모바일 반응형 레이아웃
- ✅ 얼굴 가이드 표시
- ✅ 키보드 접근성 지원
- ✅ 인증 완료 후 상태 업데이트
- ✅ 재인증 기능
- ✅ 권한 거부 처리
- ✅ 브라우저 호환성 처리
- ✅ 성능 및 메모리 관리

## 🔧 테스트 설정 및 구성

### Playwright 설정 (`playwright.config.ts`)

```typescript
// 주요 설정 항목
- testDir: './tests/e2e'           # 테스트 디렉토리
- fullyParallel: true              # 병렬 실행
- retries: process.env.CI ? 2 : 0  # CI에서 재시도
- reporter: ['html', 'json']       # 리포트 형식
- baseURL: 'http://localhost:5173' # 기본 URL
- browsers: Chrome, Firefox, Safari, Edge
- mobile: Pixel 5, iPhone 12
```

### 글로벌 설정

**테스트 시작 전 (`global-setup.ts`)**
- 개발 서버 준비 상태 확인
- 모킹 데이터 설정
- 환경 변수 초기화

**테스트 종료 후 (`global-teardown.ts`)**
- 임시 파일 정리
- 연결 종료
- 상태 초기화

## ✅ 테스트 실행 상태 확인

### 현재 테스트 상태
- **테스트 구성**: ✅ 완료 (Playwright 설정, 글로벌 설정 파일)
- **테스트 파일**: ✅ 완료 (45개 새로운 E2E + 30+개 레거시 테스트)
- **테스트 문서**: ✅ 완료 (상세 가이드 및 실행 방법)
- **브라우저 호환성**: ✅ 지원 (Chrome, Firefox, Safari, Edge + 모바일)

## 🚨 테스트 실행 시 주의사항

### 1. 개발 서버 실행 필수

```bash
# 별도 터미널에서 개발 서버 실행
npm run dev

# 포트 충돌 시 다른 포트 사용
npm run dev -- --port 3001
```

### 2. 환경 변수 설정

```bash
# 테스트 환경별 설정
BASE_URL=http://localhost:5173 npm run test:e2e
TEST_GROUP=1 npm run test:e2e    # 레거시 테스트 그룹
```

### 3. 브라우저별 테스트

```bash
# 특정 브라우저에서만 실행
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### 4. 모바일 테스트

```bash
# 모바일 디바이스 테스트
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## 🐛 디버깅 및 문제 해결

### 1. 테스트 실패 시 디버깅

```bash
# 실패한 테스트만 재실행
npx playwright test --last-failed

# 디버그 모드로 실행
npx playwright test --debug

# 특정 테스트 라인에서 중단점
# 코드에 await page.pause() 추가
```

### 2. 스크린샷 및 비디오

```bash
# 실패 시 스크린샷 자동 촬영 (설정됨)
# 실패 시 비디오 자동 녹화 (설정됨)

# 결과는 test-results/ 폴더에 저장
```

### 3. 로그 및 추적

```bash
# 상세 로그와 함께 실행
DEBUG=pw:* npx playwright test

# 네트워크 로그 포함
npx playwright test --trace on
```

## 📈 테스트 결과 분석

### HTML 리포트 활용

```bash
# 리포트 생성 및 열기
npm run test:e2e:report
```

**리포트에서 확인 가능한 정보:**
- ✅ 테스트 통과/실패 현황
- 📊 실행 시간 통계
- 🖼️ 실패 시 스크린샷
- 🎬 실행 비디오
- 📋 상세 로그

### CI/CD 통합

**GitHub Actions 예시:**
```yaml
- name: Run Playwright tests
  run: |
    npm ci
    npx playwright install --with-deps
    npm run test:e2e
    
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: test-results/
```

## 🎯 테스트 베스트 프랙티스

### 1. 테스트 작성 원칙

- **명확한 테스트 이름**: 무엇을 테스트하는지 명확히 표현
- **독립적인 테스트**: 다른 테스트에 의존하지 않음
- **적절한 대기**: `waitForLoadState`, `waitForSelector` 활용
- **모킹 활용**: API 응답 모킹으로 안정성 확보

### 2. 선택자 사용 권장사항

```typescript
// 좋은 예
page.locator('[data-testid="submit-button"]')
page.locator('button:has-text("투자하기")')

// 피해야 할 예
page.locator('.btn-primary') // CSS 변경에 취약
page.locator('button:nth-child(2)') // 구조 변경에 취약
```

### 3. 에러 처리

```typescript
// 에러 상황도 테스트
await expect(page.locator('.error-message')).toBeVisible()
await expect(page.locator('.loading-spinner')).not.toBeVisible()
```

## 🔄 지속적인 테스트 관리

### 1. 정기적인 테스트 검토

- **주간**: 실패한 테스트 분석 및 수정
- **월간**: 테스트 커버리지 검토
- **릴리스 전**: 전체 테스트 실행 및 검증

### 2. 테스트 코드 품질 관리

- 중복 코드 제거
- 공통 유틸리티 함수 활용
- 테스트 데이터 관리

### 3. 성능 모니터링

```bash
# 테스트 실행 시간 모니터링
npx playwright test --reporter=dot
```

---

## 📞 문의 및 지원

테스트 관련 문의사항이나 문제가 발생할 경우:

1. **테스트 실패 시**: HTML 리포트 확인 후 디버깅
2. **새로운 테스트 추가**: 기존 패턴을 참고하여 작성
3. **성능 이슈**: 병렬 실행 설정 조정

**Happy Testing! 🎉**