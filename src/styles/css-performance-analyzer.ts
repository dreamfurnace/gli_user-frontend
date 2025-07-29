/**
 * CSS 성능 분석 도구
 *
 * 이 도구는 CSS의 성능과 품질을 분석하여 개선 방안을 제시합니다.
 */

export interface CSSAnalysisResult {
  complexity: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  performance: {
    selectorComplexity: number
    specificityIssues: string[]
    optimizationOpportunities: string[]
  }
  maintainability: {
    duplicationRate: number
    namingConsistency: number
    structureIssues: string[]
  }
  accessibility: {
    contrastIssues: string[]
    focusManagement: string[]
    recommendations: string[]
  }
}

export interface CSSRule {
  selector: string
  properties: Record<string, string>
  specificity: number
  lineNumber?: number
  file?: string
}

export class CSSPerformanceAnalyzer {
  private rules: CSSRule[] = []
  private issues: string[] = []

  /**
   * CSS 규칙 추가
   */
  addRule(rule: CSSRule): void {
    this.rules.push(rule)
  }

  /**
   * CSS 복잡도 분석
   */
  analyzeComplexity(): {
    score: number
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []
    let score = 100

    // 선택자 복잡도 분석
    const complexSelectors = this.rules.filter((rule) =>
      rule.selector.split(',').some((selector) => selector.trim().split(' ').length > 3),
    )

    if (complexSelectors.length > 0) {
      score -= 20
      issues.push(`${complexSelectors.length}개의 복잡한 선택자가 발견되었습니다.`)
      recommendations.push('선택자를 단순화하여 성능을 개선하세요.')
    }

    // 특이성 분석
    const highSpecificityRules = this.rules.filter((rule) => rule.specificity > 100)
    if (highSpecificityRules.length > 0) {
      score -= 15
      issues.push(`${highSpecificityRules.length}개의 높은 특이성을 가진 규칙이 발견되었습니다.`)
      recommendations.push('CSS 특이성을 낮춰 유지보수성을 개선하세요.')
    }

    // 중복 속성 분석
    const duplicateProperties = this.findDuplicateProperties()
    if (duplicateProperties.length > 0) {
      score -= 10
      issues.push(`${duplicateProperties.length}개의 중복 속성이 발견되었습니다.`)
      recommendations.push('중복된 속성을 제거하여 CSS 크기를 줄이세요.')
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations,
    }
  }

  /**
   * 성능 분석
   */
  analyzePerformance(): {
    selectorComplexity: number
    specificityIssues: string[]
    optimizationOpportunities: string[]
  } {
    const specificityIssues: string[] = []
    const optimizationOpportunities: string[] = []

    // 선택자 복잡도 계산
    const selectorComplexity =
      this.rules.reduce((total, rule) => {
        const complexity = this.calculateSelectorComplexity(rule.selector)
        return total + complexity
      }, 0) / this.rules.length

    // 특이성 문제 분석
    this.rules.forEach((rule) => {
      if (rule.specificity > 100) {
        specificityIssues.push(`높은 특이성: ${rule.selector} (${rule.specificity})`)
      }
    })

    // 최적화 기회 분석
    const unusedSelectors = this.findUnusedSelectors()
    if (unusedSelectors.length > 0) {
      optimizationOpportunities.push(
        `${unusedSelectors.length}개의 사용되지 않는 선택자를 제거할 수 있습니다.`,
      )
    }

    const redundantRules = this.findRedundantRules()
    if (redundantRules.length > 0) {
      optimizationOpportunities.push(`${redundantRules.length}개의 중복 규칙을 통합할 수 있습니다.`)
    }

    return {
      selectorComplexity,
      specificityIssues,
      optimizationOpportunities,
    }
  }

  /**
   * 유지보수성 분석
   */
  analyzeMaintainability(): {
    duplicationRate: number
    namingConsistency: number
    structureIssues: string[]
  } {
    const structureIssues: string[] = []

    // 중복률 계산
    const duplicationRate = this.calculateDuplicationRate()

    // 명명 일관성 분석
    const namingConsistency = this.analyzeNamingConsistency()

    // 구조 문제 분석
    if (this.rules.length > 1000) {
      structureIssues.push('CSS 규칙이 너무 많습니다. 모듈화를 고려하세요.')
    }

    const longSelectors = this.rules.filter((rule) => rule.selector.length > 100)
    if (longSelectors.length > 0) {
      structureIssues.push(`${longSelectors.length}개의 긴 선택자가 발견되었습니다.`)
    }

    return {
      duplicationRate,
      namingConsistency,
      structureIssues,
    }
  }

  /**
   * 접근성 분석
   */
  analyzeAccessibility(): {
    contrastIssues: string[]
    focusManagement: string[]
    recommendations: string[]
  } {
    const contrastIssues: string[] = []
    const focusManagement: string[] = []
    const recommendations: string[] = []

    // 색상 대비 분석
    this.rules.forEach((rule) => {
      Object.entries(rule.properties).forEach(([property, value]) => {
        if (property === 'color' || property === 'background-color') {
          const contrastIssue = this.checkColorContrast(value)
          if (contrastIssue) {
            contrastIssues.push(`${rule.selector}: ${contrastIssue}`)
          }
        }
      })
    })

    // 포커스 관리 분석
    const focusRules = this.rules.filter(
      (rule) => rule.selector.includes(':focus') || rule.properties['outline'] !== undefined,
    )

    if (focusRules.length === 0) {
      focusManagement.push('포커스 관리 스타일이 없습니다.')
      recommendations.push('키보드 접근성을 위한 포커스 스타일을 추가하세요.')
    }

    return {
      contrastIssues,
      focusManagement,
      recommendations,
    }
  }

  /**
   * 전체 분석 실행
   */
  analyze(): CSSAnalysisResult {
    return {
      complexity: this.analyzeComplexity(),
      performance: this.analyzePerformance(),
      maintainability: this.analyzeMaintainability(),
      accessibility: this.analyzeAccessibility(),
    }
  }

  /**
   * 선택자 복잡도 계산
   */
  private calculateSelectorComplexity(selector: string): number {
    const parts = selector.split(',').map((s) => s.trim())
    return (
      parts.reduce((total, part) => {
        const elements = part.split(' ').filter((s) => s.length > 0)
        const pseudoClasses = (part.match(/:[^:]+/g) || []).length
        const pseudoElements = (part.match(/::[^:]+/g) || []).length
        const classes = (part.match(/\.[^.#\s]+/g) || []).length
        const ids = (part.match(/#[^.#\s]+/g) || []).length

        return total + elements.length + pseudoClasses + pseudoElements + classes + ids
      }, 0) / parts.length
    )
  }

  /**
   * 중복 속성 찾기
   */
  private findDuplicateProperties(): string[] {
    const duplicates: string[] = []
    const propertyCounts: Record<string, number> = {}

    this.rules.forEach((rule) => {
      Object.keys(rule.properties).forEach((property) => {
        propertyCounts[property] = (propertyCounts[property] || 0) + 1
      })
    })

    Object.entries(propertyCounts).forEach(([property, count]) => {
      if (count > 10) {
        duplicates.push(`${property}: ${count}회 사용`)
      }
    })

    return duplicates
  }

  /**
   * 사용되지 않는 선택자 찾기 (시뮬레이션)
   */
  private findUnusedSelectors(): string[] {
    // 실제 구현에서는 DOM 분석이 필요
    return this.rules
      .filter((rule) => rule.selector.includes('.unused-'))
      .map((rule) => rule.selector)
  }

  /**
   * 중복 규칙 찾기
   */
  private findRedundantRules(): string[] {
    const redundant: string[] = []
    const ruleMap = new Map<string, CSSRule[]>()

    this.rules.forEach((rule) => {
      const key = Object.keys(rule.properties).sort().join(',')
      if (!ruleMap.has(key)) {
        ruleMap.set(key, [])
      }
      ruleMap.get(key)!.push(rule)
    })

    ruleMap.forEach((rules, properties) => {
      if (rules.length > 1) {
        redundant.push(`${rules.length}개의 유사한 규칙: ${properties}`)
      }
    })

    return redundant
  }

  /**
   * 중복률 계산
   */
  private calculateDuplicationRate(): number {
    const totalProperties = this.rules.reduce(
      (total, rule) => total + Object.keys(rule.properties).length,
      0,
    )

    const uniqueProperties = new Set<string>()
    this.rules.forEach((rule) => {
      Object.keys(rule.properties).forEach((property) => {
        uniqueProperties.add(property)
      })
    })

    return ((totalProperties - uniqueProperties.size) / totalProperties) * 100
  }

  /**
   * 명명 일관성 분석
   */
  private analyzeNamingConsistency(): number {
    const classNames = this.rules
      .flatMap((rule) => rule.selector.match(/\.[^.#\s]+/g) || [])
      .map((className) => className.slice(1))

    const namingPatterns = {
      kebabCase: /^[a-z][a-z0-9-]*$/,
      camelCase: /^[a-z][a-zA-Z0-9]*$/,
      snakeCase: /^[a-z][a-z0-9_]*$/,
    }

    const patternCounts = {
      kebabCase: 0,
      camelCase: 0,
      snakeCase: 0,
      other: 0,
    }

    classNames.forEach((name) => {
      if (namingPatterns.kebabCase.test(name)) {
        patternCounts.kebabCase++
      } else if (namingPatterns.camelCase.test(name)) {
        patternCounts.camelCase++
      } else if (namingPatterns.snakeCase.test(name)) {
        patternCounts.snakeCase++
      } else {
        patternCounts.other++
      }
    })

    const total = classNames.length
    const dominantPattern = Math.max(
      patternCounts.kebabCase,
      patternCounts.camelCase,
      patternCounts.snakeCase,
    )

    return (dominantPattern / total) * 100
  }

  /**
   * 색상 대비 검사
   */
  private checkColorContrast(color: string): string | null {
    // 간단한 색상 대비 검사 (실제로는 더 정교한 알고리즘 필요)
    if (color.includes('rgba') && color.includes('0.5')) {
      return '투명도가 높은 색상은 대비가 부족할 수 있습니다.'
    }

    if (color === '#fff' || color === '#ffffff') {
      return '흰색 배경에서 텍스트 색상을 확인하세요.'
    }

    return null
  }

  /**
   * 분석 결과 출력
   */
  generateReport(): string {
    const analysis = this.analyze()

    return `
# CSS 성능 분석 보고서

## 📊 복잡도 분석
- **점수**: ${analysis.complexity.score}/100
- **문제점**: ${analysis.complexity.issues.length}개
- **권장사항**: ${analysis.complexity.recommendations.length}개

## ⚡ 성능 분석
- **선택자 복잡도**: ${analysis.performance.selectorComplexity.toFixed(2)}
- **특이성 문제**: ${analysis.performance.specificityIssues.length}개
- **최적화 기회**: ${analysis.performance.optimizationOpportunities.length}개

## 🔧 유지보수성 분석
- **중복률**: ${analysis.maintainability.duplicationRate.toFixed(1)}%
- **명명 일관성**: ${analysis.maintainability.namingConsistency.toFixed(1)}%
- **구조 문제**: ${analysis.maintainability.structureIssues.length}개

## ♿ 접근성 분석
- **대비 문제**: ${analysis.accessibility.contrastIssues.length}개
- **포커스 관리**: ${analysis.accessibility.focusManagement.length}개
- **권장사항**: ${analysis.accessibility.recommendations.length}개

## 🎯 개선 우선순위
1. ${analysis.complexity.issues[0] || '복잡도 문제 없음'}
2. ${analysis.performance.optimizationOpportunities[0] || '성능 최적화 기회 없음'}
3. ${analysis.maintainability.structureIssues[0] || '구조 문제 없음'}
    `.trim()
  }
}

// 사용 예제
export function analyzeCSSPerformance(cssRules: CSSRule[]): CSSAnalysisResult {
  const analyzer = new CSSPerformanceAnalyzer()

  cssRules.forEach((rule) => {
    analyzer.addRule(rule)
  })

  return analyzer.analyze()
}
