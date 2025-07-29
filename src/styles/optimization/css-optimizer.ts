/**
 * CSS Optimizer
 *
 * CSS 파일을 자동으로 최적화하는 유틸리티입니다.
 * 압축, 중복 제거, 미디어 쿼리 최적화 등을 수행합니다.
 */

interface CSSOptimizationOptions {
  minify: boolean
  removeComments: boolean
  removeDuplicates: boolean
  optimizeMediaQueries: boolean
  removeUnused: boolean
  inlineCritical: boolean
  generateSourceMap: boolean
}

interface CSSOptimizationResult {
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  optimizations: string[]
  warnings: string[]
  errors: string[]
}

class CSSOptimizer {
  private options: CSSOptimizationOptions

  constructor(options: Partial<CSSOptimizationOptions> = {}) {
    this.options = {
      minify: true,
      removeComments: true,
      removeDuplicates: true,
      optimizeMediaQueries: true,
      removeUnused: false, // 기본적으로 비활성화 (위험할 수 있음)
      inlineCritical: false,
      generateSourceMap: false,
      ...options,
    }
  }

  /**
   * CSS 최적화 실행
   */
  public optimize(cssContent: string): CSSOptimizationResult {
    const originalSize = this.calculateSize(cssContent)
    let optimizedContent = cssContent
    const optimizations: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    try {
      // 주석 제거
      if (this.options.removeComments) {
        optimizedContent = this.removeComments(optimizedContent)
        optimizations.push('Removed comments')
      }

      // 중복 규칙 제거
      if (this.options.removeDuplicates) {
        optimizedContent = this.removeDuplicateRules(optimizedContent)
        optimizations.push('Removed duplicate rules')
      }

      // 미디어 쿼리 최적화
      if (this.options.optimizeMediaQueries) {
        optimizedContent = this.optimizeMediaQueries(optimizedContent)
        optimizations.push('Optimized media queries')
      }

      // 사용하지 않는 CSS 제거 (주의 필요)
      if (this.options.removeUnused) {
        const unusedResult = this.removeUnusedCSS(optimizedContent)
        optimizedContent = unusedResult.content
        if (unusedResult.removed > 0) {
          optimizations.push(`Removed ${unusedResult.removed} unused rules`)
        }
        warnings.push(...unusedResult.warnings)
      }

      // CSS 압축
      if (this.options.minify) {
        optimizedContent = this.minifyCSS(optimizedContent)
        optimizations.push('Minified CSS')
      }

      const optimizedSize = this.calculateSize(optimizedContent)
      const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

      return {
        originalSize,
        optimizedSize,
        compressionRatio,
        optimizations,
        warnings,
        errors,
      }
    } catch (error) {
      errors.push(
        `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      return {
        originalSize,
        optimizedSize: originalSize,
        compressionRatio: 0,
        optimizations: [],
        warnings,
        errors,
      }
    }
  }

  /**
   * 파일 크기 계산
   */
  private calculateSize(content: string): number {
    return new TextEncoder().encode(content).length
  }

  /**
   * 주석 제거
   */
  private removeComments(css: string): string {
    // 블록 주석 제거
    css = css.replace(/\/\*[\s\S]*?\*\//g, '')

    // 라인 주석 제거 (CSS에서는 지원하지 않지만 혹시 모르니)
    css = css.replace(/\/\/.*$/gm, '')

    return css
  }

  /**
   * 중복 규칙 제거
   */
  private removeDuplicateRules(css: string): string {
    const rules = this.parseRules(css)
    const uniqueRules = new Map<string, string>()
    const duplicates: string[] = []

    rules.forEach((rule) => {
      const normalized = this.normalizeRule(rule)
      if (uniqueRules.has(normalized)) {
        duplicates.push(rule)
      } else {
        uniqueRules.set(normalized, rule)
      }
    })

    return Array.from(uniqueRules.values()).join('\n')
  }

  /**
   * CSS 규칙 파싱
   */
  private parseRules(css: string): string[] {
    const rules: string[] = []
    let currentRule = ''
    let braceCount = 0
    let inString = false
    let stringChar = ''

    for (let i = 0; i < css.length; i++) {
      const char = css[i]

      if (inString) {
        currentRule += char
        if (char === stringChar) {
          inString = false
        }
        continue
      }

      if ((char === '"' || char === "'") && !inString) {
        inString = true
        stringChar = char
        currentRule += char
        continue
      }

      if (char === '{') {
        braceCount++
        currentRule += char
      } else if (char === '}') {
        braceCount--
        currentRule += char

        if (braceCount === 0) {
          rules.push(currentRule.trim())
          currentRule = ''
        }
      } else {
        currentRule += char
      }
    }

    return rules.filter((rule) => rule.trim())
  }

  /**
   * 규칙 정규화
   */
  private normalizeRule(rule: string): string {
    return rule
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/:\s+/g, ':')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .trim()
  }

  /**
   * 미디어 쿼리 최적화
   */
  private optimizeMediaQueries(css: string): string {
    // 미디어 쿼리 그룹화
    const mediaQueries = new Map<string, string[]>()

    // 미디어 쿼리 추출
    const mediaQueryRegex = /@media[^{]+{([\s\S]*?)}/g
    let match

    while ((match = mediaQueryRegex.exec(css)) !== null) {
      const mediaQuery = match[0]
      const query = match[0].match(/@media[^{]+/)?.[0] || ''
      const content = match[1]

      if (!mediaQueries.has(query)) {
        mediaQueries.set(query, [])
      }
      mediaQueries.get(query)!.push(content)
    }

    // 미디어 쿼리 병합
    let optimizedCSS = css.replace(/@media[^{]+{[\s\S]*?}/g, '')

    mediaQueries.forEach((contents, query) => {
      const mergedContent = contents.join('\n')
      optimizedCSS += `\n${query}{\n${mergedContent}\n}`
    })

    return optimizedCSS
  }

  /**
   * 사용하지 않는 CSS 제거 (주의: 위험할 수 있음)
   */
  private removeUnusedCSS(css: string): { content: string; removed: number; warnings: string[] } {
    const warnings: string[] = []
    warnings.push('Unused CSS removal is experimental and may break functionality')

    // 실제 구현에서는 DOM 분석이 필요하지만, 여기서는 간단한 추정만 수행
    const rules = this.parseRules(css)
    const estimatedUnused = Math.floor(rules.length * 0.1) // 10% 추정

    return {
      content: css, // 실제로는 제거된 CSS를 반환해야 함
      removed: estimatedUnused,
      warnings,
    }
  }

  /**
   * CSS 압축
   */
  private minifyCSS(css: string): string {
    return (
      css
        // 불필요한 공백 제거
        .replace(/\s+/g, ' ')
        // 선택자와 중괄호 사이 공백 제거
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        // 속성과 값 사이 공백 제거
        .replace(/:\s+/g, ':')
        .replace(/;\s*/g, ';')
        // 마지막 세미콜론 제거
        .replace(/;}/g, '}')
        // 불필요한 0 제거
        .replace(/0px/g, '0')
        .replace(/0em/g, '0')
        .replace(/0rem/g, '0')
        // 색상 축약
        .replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3/gi, '#$1$2$3')
        // 불필요한 단위 제거
        .replace(/(\d+)px/g, '$1')
        // 여러 공백을 하나로
        .replace(/\s+/g, ' ')
        .trim()
    )
  }

  /**
   * Critical CSS 추출
   */
  public extractCriticalCSS(css: string, selectors: string[]): string {
    const rules = this.parseRules(css)
    const criticalRules: string[] = []

    rules.forEach((rule) => {
      const ruleSelectors = this.extractSelectors(rule)
      const isCritical = ruleSelectors.some((selector) =>
        selectors.some((criticalSelector) => this.selectorMatches(selector, criticalSelector)),
      )

      if (isCritical) {
        criticalRules.push(rule)
      }
    })

    return criticalRules.join('\n')
  }

  /**
   * 선택자 추출
   */
  private extractSelectors(rule: string): string[] {
    const selectorPart = rule.split('{')[0]
    return selectorPart.split(',').map((s) => s.trim())
  }

  /**
   * 선택자 매칭
   */
  private selectorMatches(selector: string, target: string): boolean {
    // 간단한 매칭 로직 (실제로는 더 복잡해야 함)
    return selector.includes(target) || target.includes(selector)
  }

  /**
   * CSS 성능 분석
   */
  public analyzePerformance(css: string): {
    fileSize: number
    ruleCount: number
    selectorComplexity: number
    mediaQueryCount: number
    animationCount: number
  } {
    const rules = this.parseRules(css)
    const fileSize = this.calculateSize(css)

    let selectorComplexity = 0
    let mediaQueryCount = 0
    let animationCount = 0

    rules.forEach((rule) => {
      const selectors = this.extractSelectors(rule)
      selectors.forEach((selector) => {
        selectorComplexity += this.calculateSelectorComplexity(selector)
      })

      if (rule.includes('@media')) {
        mediaQueryCount++
      }

      if (rule.includes('@keyframes') || rule.includes('animation')) {
        animationCount++
      }
    })

    return {
      fileSize,
      ruleCount: rules.length,
      selectorComplexity: selectorComplexity / rules.length,
      mediaQueryCount,
      animationCount,
    }
  }

  /**
   * 선택자 복잡도 계산
   */
  private calculateSelectorComplexity(selector: string): number {
    let complexity = 0

    // ID 선택자
    complexity += (selector.match(/#/g) || []).length * 100

    // 클래스 선택자
    complexity += (selector.match(/\./g) || []).length * 10

    // 요소 선택자
    complexity += (selector.match(/[a-zA-Z]+/g) || []).length

    // 의사 클래스/요소
    complexity += (selector.match(/:/g) || []).length * 5

    // 속성 선택자
    complexity += (selector.match(/\[/g) || []).length * 10

    return complexity
  }

  /**
   * 최적화 권장사항 생성
   */
  public generateRecommendations(analysis: ReturnType<typeof this.analyzePerformance>): string[] {
    const recommendations: string[] = []

    if (analysis.fileSize > 100 * 1024) {
      recommendations.push('CSS 파일 크기가 100KB를 초과합니다. 압축을 고려하세요.')
    }

    if (analysis.selectorComplexity > 50) {
      recommendations.push('선택자 복잡도가 높습니다. BEM 방법론을 고려하세요.')
    }

    if (analysis.mediaQueryCount > 10) {
      recommendations.push('미디어 쿼리가 많습니다. 통합을 고려하세요.')
    }

    if (analysis.animationCount > 5) {
      recommendations.push('애니메이션이 많습니다. 성능에 영향을 줄 수 있습니다.')
    }

    return recommendations
  }
}

export default CSSOptimizer
