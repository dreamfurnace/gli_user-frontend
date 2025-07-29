/**
 * CSS Performance Monitor
 *
 * CSS 성능을 모니터링하고 분석하는 도구입니다.
 * 파일 크기, 로딩 시간, 렌더링 성능 등을 추적합니다.
 */

interface CSSPerformanceMetrics {
  fileSize: number
  loadTime: number
  parseTime: number
  renderTime: number
  unusedRules: number
  duplicateRules: number
  specificityScore: number
  complexityScore: number
  maintainabilityScore: number
  accessibilityScore: number
}

interface CSSPerformanceReport {
  timestamp: Date
  metrics: CSSPerformanceMetrics
  recommendations: string[]
  score: number
}

class CSSPerformanceMonitor {
  private metrics: Map<string, CSSPerformanceMetrics> = new Map()
  private reports: CSSPerformanceReport[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  /**
   * 성능 관찰자 초기화
   */
  private initializeObservers(): void {
    // CSS 로딩 성능 관찰
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if ((entry as PerformanceResourceTiming).initiatorType === 'css') {
            this.measureCSSLoadTime(entry as PerformanceResourceTiming)
          }
        })
      })

      resourceObserver.observe({ entryTypes: ['resource'] })

      // 레이아웃 변경 관찰
      const layoutObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.measureLayoutPerformance(entry as PerformanceEntry)
        })
      })

      layoutObserver.observe({ entryTypes: ['layout-shift'] })

      this.observers.push(resourceObserver, layoutObserver)
    }
  }

  /**
   * CSS 파일 크기 측정
   */
  public measureCSSFileSize(cssContent: string): number {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(cssContent)
    return bytes.length
  }

  /**
   * CSS 로딩 시간 측정
   */
  private measureCSSLoadTime(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.fetchStart
    const parseTime = entry.responseEnd - entry.responseStart

    this.metrics.set(entry.name, {
      ...this.metrics.get(entry.name),
      loadTime,
      parseTime,
    } as CSSPerformanceMetrics)
  }

  /**
   * 레이아웃 성능 측정
   */
  private measureLayoutPerformance(entry: PerformanceEntry): void {
    // 레이아웃 변경 성능 분석
    console.log('Layout performance:', entry)
  }

  /**
   * CSS 규칙 분석
   */
  public analyzeCSSRules(cssContent: string): {
    totalRules: number
    unusedRules: number
    duplicateRules: number
    specificityScore: number
    complexityScore: number
  } {
    const rules = this.parseCSSRules(cssContent)
    const totalRules = rules.length
    const unusedRules = this.countUnusedRules(rules)
    const duplicateRules = this.countDuplicateRules(rules)
    const specificityScore = this.calculateSpecificityScore(rules)
    const complexityScore = this.calculateComplexityScore(rules)

    return {
      totalRules,
      unusedRules,
      duplicateRules,
      specificityScore,
      complexityScore,
    }
  }

  /**
   * CSS 규칙 파싱
   */
  private parseCSSRules(cssContent: string): string[] {
    const rules: string[] = []
    const regex = /[^{}]+\{[^}]+\}/g
    let match

    while ((match = regex.exec(cssContent)) !== null) {
      rules.push(match[0])
    }

    return rules
  }

  /**
   * 사용하지 않는 규칙 카운트
   */
  private countUnusedRules(rules: string[]): number {
    // 실제 DOM에서 사용되지 않는 규칙 추정
    // 이는 근사치이며, 실제 분석을 위해서는 더 정교한 도구가 필요
    return Math.floor(rules.length * 0.1) // 10% 추정
  }

  /**
   * 중복 규칙 카운트
   */
  private countDuplicateRules(rules: string[]): number {
    const seen = new Set<string>()
    let duplicates = 0

    rules.forEach((rule) => {
      const normalized = rule.replace(/\s+/g, ' ').trim()
      if (seen.has(normalized)) {
        duplicates++
      } else {
        seen.add(normalized)
      }
    })

    return duplicates
  }

  /**
   * 특이성 점수 계산
   */
  private calculateSpecificityScore(rules: string[]): number {
    let totalSpecificity = 0

    rules.forEach((rule) => {
      const selector = rule.split('{')[0]
      const specificity = this.calculateSelectorSpecificity(selector)
      totalSpecificity += specificity
    })

    return totalSpecificity / rules.length
  }

  /**
   * 선택자 특이성 계산
   */
  private calculateSelectorSpecificity(selector: string): number {
    let specificity = 0

    // ID 선택자
    const idMatches = selector.match(/#[a-zA-Z0-9_-]+/g)
    if (idMatches) {
      specificity += idMatches.length * 100
    }

    // 클래스 선택자, 속성 선택자, 의사 클래스
    const classMatches = selector.match(/\.|\[|:/g)
    if (classMatches) {
      specificity += classMatches.length * 10
    }

    // 요소 선택자, 의사 요소
    const elementMatches = selector.match(/[a-zA-Z]+|::/g)
    if (elementMatches) {
      specificity += elementMatches.length
    }

    return specificity
  }

  /**
   * 복잡도 점수 계산
   */
  private calculateComplexityScore(rules: string[]): number {
    let totalComplexity = 0

    rules.forEach((rule) => {
      const complexity = this.calculateRuleComplexity(rule)
      totalComplexity += complexity
    })

    return totalComplexity / rules.length
  }

  /**
   * 규칙 복잡도 계산
   */
  private calculateRuleComplexity(rule: string): number {
    let complexity = 0

    // 선택자 수
    const selectors = rule.split('{')[0].split(',').length
    complexity += selectors * 2

    // 속성 수
    const properties = rule.match(/[a-zA-Z-]+:/g)?.length || 0
    complexity += properties

    // 중첩 수준
    const nesting = (rule.match(/\s+/g) || []).length
    complexity += nesting * 0.5

    // 미디어 쿼리
    if (rule.includes('@media')) {
      complexity += 5
    }

    // 애니메이션
    if (rule.includes('@keyframes') || rule.includes('animation')) {
      complexity += 3
    }

    return complexity
  }

  /**
   * 유지보수성 점수 계산
   */
  public calculateMaintainabilityScore(cssContent: string): number {
    let score = 100

    // 주석 비율
    const commentRatio = (cssContent.match(/\/\*[\s\S]*?\*\//g) || []).length
    if (commentRatio < 5) score -= 10

    // 일관된 들여쓰기
    const inconsistentIndentation = cssContent.match(/^\s*[^\s]/gm)?.length || 0
    score -= inconsistentIndentation * 2

    // 긴 선택자
    const longSelectors = cssContent.match(/[^{}]{50,}/g)?.length || 0
    score -= longSelectors * 5

    // 마법 숫자
    const magicNumbers = cssContent.match(/\b\d{1,3}px\b/g)?.length || 0
    score -= magicNumbers * 3

    return Math.max(0, score)
  }

  /**
   * 접근성 점수 계산
   */
  public calculateAccessibilityScore(cssContent: string): number {
    let score = 100

    // 고대비 모드 지원
    if (!cssContent.includes('prefers-contrast')) {
      score -= 15
    }

    // 모션 감소 지원
    if (!cssContent.includes('prefers-reduced-motion')) {
      score -= 15
    }

    // 포커스 표시
    if (!cssContent.includes(':focus')) {
      score -= 20
    }

    // 스크린 리더 지원
    if (!cssContent.includes('sr-only') && !cssContent.includes('screen-reader')) {
      score -= 10
    }

    // 색상 의존성
    const colorOnlyRules = cssContent.match(/color:\s*#[a-fA-F0-9]{3,6}/g)?.length || 0
    score -= colorOnlyRules * 2

    return Math.max(0, score)
  }

  /**
   * 성능 점수 계산
   */
  public calculatePerformanceScore(metrics: CSSPerformanceMetrics): number {
    let score = 100

    // 파일 크기 (100KB 기준)
    if (metrics.fileSize > 100 * 1024) {
      score -= 20
    } else if (metrics.fileSize > 50 * 1024) {
      score -= 10
    }

    // 로딩 시간 (1초 기준)
    if (metrics.loadTime > 1000) {
      score -= 25
    } else if (metrics.loadTime > 500) {
      score -= 15
    }

    // 파싱 시간 (100ms 기준)
    if (metrics.parseTime > 100) {
      score -= 15
    } else if (metrics.parseTime > 50) {
      score -= 8
    }

    // 사용하지 않는 규칙 비율
    const unusedRatio = metrics.unusedRules / (metrics.unusedRules + 100)
    score -= unusedRatio * 20

    // 중복 규칙 비율
    const duplicateRatio = metrics.duplicateRules / (metrics.duplicateRules + 50)
    score -= duplicateRatio * 15

    return Math.max(0, score)
  }

  /**
   * 성능 보고서 생성
   */
  public generatePerformanceReport(cssContent: string): CSSPerformanceReport {
    const fileSize = this.measureCSSFileSize(cssContent)
    const ruleAnalysis = this.analyzeCSSRules(cssContent)
    const maintainabilityScore = this.calculateMaintainabilityScore(cssContent)
    const accessibilityScore = this.calculateAccessibilityScore(cssContent)

    const metrics: CSSPerformanceMetrics = {
      fileSize,
      loadTime: 0, // 실제 측정값으로 업데이트
      parseTime: 0, // 실제 측정값으로 업데이트
      renderTime: 0, // 실제 측정값으로 업데이트
      unusedRules: ruleAnalysis.unusedRules,
      duplicateRules: ruleAnalysis.duplicateRules,
      specificityScore: ruleAnalysis.specificityScore,
      complexityScore: ruleAnalysis.complexityScore,
      maintainabilityScore,
      accessibilityScore,
    }

    const performanceScore = this.calculatePerformanceScore(metrics)
    const recommendations = this.generateRecommendations(metrics)

    const report: CSSPerformanceReport = {
      timestamp: new Date(),
      metrics,
      recommendations,
      score: performanceScore,
    }

    this.reports.push(report)
    return report
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(metrics: CSSPerformanceMetrics): string[] {
    const recommendations: string[] = []

    if (metrics.fileSize > 100 * 1024) {
      recommendations.push('CSS 파일 크기를 100KB 이하로 줄이세요.')
    }

    if (metrics.unusedRules > 10) {
      recommendations.push('사용하지 않는 CSS 규칙을 제거하세요.')
    }

    if (metrics.duplicateRules > 5) {
      recommendations.push('중복된 CSS 규칙을 통합하세요.')
    }

    if (metrics.specificityScore > 50) {
      recommendations.push('선택자 특이성을 낮춰 유지보수성을 향상시키세요.')
    }

    if (metrics.complexityScore > 20) {
      recommendations.push('CSS 규칙의 복잡도를 줄이세요.')
    }

    if (metrics.maintainabilityScore < 70) {
      recommendations.push('CSS 코드의 가독성과 구조를 개선하세요.')
    }

    if (metrics.accessibilityScore < 80) {
      recommendations.push('접근성 관련 CSS 규칙을 추가하세요.')
    }

    return recommendations
  }

  /**
   * 성능 보고서 내보내기
   */
  public exportReport(): string {
    const latestReport = this.reports[this.reports.length - 1]
    if (!latestReport) {
      return 'No performance report available.'
    }

    return JSON.stringify(latestReport, null, 2)
  }

  /**
   * 성능 히스토리 조회
   */
  public getPerformanceHistory(): CSSPerformanceReport[] {
    return [...this.reports]
  }

  /**
   * 모니터링 정리
   */
  public destroy(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
    this.metrics.clear()
    this.reports = []
  }
}

// 전역 인스턴스 생성
const cssPerformanceMonitor = new CSSPerformanceMonitor()

// 개발 모드에서만 전역 객체에 추가
if (process.env.NODE_ENV === 'development') {
  ;(window as any).cssPerformanceMonitor = cssPerformanceMonitor
}

export default cssPerformanceMonitor
