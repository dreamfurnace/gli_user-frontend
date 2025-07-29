/**
 * 성능 모니터링 및 최적화 유틸리티
 */

// 성능 메트릭 타입
export interface PerformanceMetrics {
  timestamp: number
  fps: number
  memoryUsage: number
  renderTime: number
  eventCount: number
  domNodes: number
  jsHeapSize: number
  jsHeapUsed: number
}

// 성능 이벤트 타입
export interface PerformanceEvent {
  type: 'render' | 'memory' | 'fps' | 'error'
  timestamp: number
  data: any
  severity: 'low' | 'medium' | 'high' | 'critical'
}

// 성능 임계값 설정
export interface PerformanceThresholds {
  fps: { warning: number; critical: number }
  memoryUsage: { warning: number; critical: number }
  renderTime: { warning: number; critical: number }
  eventCount: { warning: number; critical: number }
}

/**
 * 성능 모니터링 클래스
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private events: PerformanceEvent[] = []
  private isMonitoring = false
  private monitoringInterval: number | null = null
  private frameCount = 0
  private lastFrameTime = performance.now()
  private eventCount = 0
  private thresholds: PerformanceThresholds
  private callbacks: {
    onMetric?: (metric: PerformanceMetrics) => void
    onEvent?: (event: PerformanceEvent) => void
    onWarning?: (event: PerformanceEvent) => void
    onCritical?: (event: PerformanceEvent) => void
  } = {}

  // 중복 경고 방지를 위한 마지막 경고 시간 추적
  private lastWarningTime: { [key: string]: number } = {}
  private readonly WARNING_COOLDOWN = 10000 // 10초 쿨다운

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = {
      fps: { warning: 20, critical: 10 }, // FPS 임계값을 더 낮게 조정
      memoryUsage: { warning: 90, critical: 98 }, // 메모리 사용량 임계값을 더 높게 조정
      renderTime: { warning: 100, critical: 200 }, // 렌더링 시간 임계값을 더 높게 조정
      eventCount: { warning: 5000, critical: 10000 }, // 이벤트 수 임계값을 더 높게 조정
      ...thresholds,
    }
  }

  /**
   * 모니터링 시작
   */
  startMonitoring(intervalMs = 5000) {
    // 모니터링 간격을 1초에서 5초로 늘림
    if (this.isMonitoring) return // 이미 모니터링 중이면 중복 시작 방지

    this.isMonitoring = true
    this.lastFrameTime = performance.now()
    this.frameCount = 0
    this.eventCount = 0

    // FPS 측정
    const measureFPS = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - this.lastFrameTime

      if (deltaTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / deltaTime)
        this.frameCount = 0
        this.lastFrameTime = currentTime

        this.recordMetric('fps', fps)
      }

      this.frameCount++
      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)

    // 주기적 메트릭 수집
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    console.log('Performance monitoring started')
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring() {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('Performance monitoring stopped')
  }

  /**
   * 메트릭 수집
   */
  private collectMetrics() {
    const timestamp = Date.now()

    // 메모리 사용량 (Chrome DevTools API)
    const memoryInfo = (performance as any).memory
    const memoryUsage = memoryInfo
      ? (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
      : 0

    // DOM 노드 수
    const domNodes = document.querySelectorAll('*').length

    // 렌더링 시간 측정
    const renderStart = performance.now()
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart
      this.recordMetric('renderTime', renderTime)
    })

    const metric: PerformanceMetrics = {
      timestamp,
      fps: this.getLatestMetric('fps') || 0,
      memoryUsage,
      renderTime: 0, // requestAnimationFrame에서 업데이트됨
      eventCount: this.eventCount,
      domNodes,
      jsHeapSize: memoryInfo?.totalJSHeapSize || 0,
      jsHeapUsed: memoryInfo?.usedJSHeapSize || 0,
    }

    this.metrics.push(metric)
    this.eventCount = 0

    // 임계값 체크
    this.checkThresholds(metric)

    // 콜백 호출
    if (this.callbacks.onMetric) {
      this.callbacks.onMetric(metric)
    }

    // 메트릭 히스토리 제한 (최근 100개만 유지)
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
  }

  /**
   * 메트릭 기록
   */
  private recordMetric(type: keyof PerformanceMetrics, value: number) {
    const event: PerformanceEvent = {
      type: type as any,
      timestamp: Date.now(),
      data: { value, type },
      severity: this.getSeverity(type, value),
    }

    this.events.push(event)

    if (this.callbacks.onEvent) {
      this.callbacks.onEvent(event)
    }

    if (event.severity === 'critical' && this.callbacks.onCritical) {
      this.callbacks.onCritical(event)
    } else if (event.severity === 'high' && this.callbacks.onWarning) {
      this.callbacks.onWarning(event)
    }
  }

  /**
   * 임계값 체크
   */
  private checkThresholds(metric: PerformanceMetrics) {
    if (metric.fps < this.thresholds.fps.critical) {
      this.recordEvent(
        'fps',
        { value: metric.fps, threshold: this.thresholds.fps.critical },
        'critical',
      )
    } else if (metric.fps < this.thresholds.fps.warning) {
      this.recordEvent('fps', { value: metric.fps, threshold: this.thresholds.fps.warning }, 'high')
    }

    if (metric.memoryUsage > this.thresholds.memoryUsage.critical) {
      this.recordEvent(
        'memory',
        { value: metric.memoryUsage, threshold: this.thresholds.memoryUsage.critical },
        'critical',
      )
    } else if (metric.memoryUsage > this.thresholds.memoryUsage.warning) {
      this.recordEvent(
        'memory',
        { value: metric.memoryUsage, threshold: this.thresholds.memoryUsage.warning },
        'high',
      )
    }

    if (metric.eventCount > this.thresholds.eventCount.critical) {
      this.recordEvent(
        'eventCount',
        { value: metric.eventCount, threshold: this.thresholds.eventCount.critical },
        'critical',
      )
    } else if (metric.eventCount > this.thresholds.eventCount.warning) {
      this.recordEvent(
        'eventCount',
        { value: metric.eventCount, threshold: this.thresholds.eventCount.warning },
        'high',
      )
    }
  }

  /**
   * 이벤트 기록
   */
  recordEvent(type: string, data: any, severity: PerformanceEvent['severity'] = 'medium') {
    // 중복 경고 방지: 같은 타입의 경고는 10초 쿨다운 적용
    const warningKey = `${type}-${severity}`
    const now = Date.now()
    if (
      this.lastWarningTime[warningKey] &&
      now - this.lastWarningTime[warningKey] < this.WARNING_COOLDOWN
    ) {
      return // 쿨다운 중이면 경고 생략
    }

    const event: PerformanceEvent = {
      type: type as any,
      timestamp: now,
      data,
      severity,
    }

    this.events.push(event)
    this.lastWarningTime[warningKey] = now // 마지막 경고 시간 업데이트

    if (this.callbacks.onEvent) {
      this.callbacks.onEvent(event)
    }

    if (severity === 'critical' && this.callbacks.onCritical) {
      this.callbacks.onCritical(event)
    } else if (severity === 'high' && this.callbacks.onWarning) {
      this.callbacks.onWarning(event)
    }
  }

  /**
   * 이벤트 카운터 증가
   */
  incrementEventCount() {
    this.eventCount++
  }

  /**
   * 최신 메트릭 가져오기
   */
  getLatestMetric(type: keyof PerformanceMetrics): number | undefined {
    const metric = this.metrics[this.metrics.length - 1]
    return metric ? (metric[type] as number) : undefined
  }

  /**
   * 메트릭 히스토리 가져오기
   */
  getMetricsHistory(limit = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit)
  }

  /**
   * 이벤트 히스토리 가져오기
   */
  getEventsHistory(limit = 100): PerformanceEvent[] {
    return this.events.slice(-limit)
  }

  /**
   * 성능 통계 가져오기
   */
  getPerformanceStats() {
    const recentMetrics = this.metrics.slice(-10)

    if (recentMetrics.length === 0) {
      return null
    }

    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length
    const avgMemoryUsage =
      recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length
    const avgRenderTime =
      recentMetrics.reduce((sum, m) => sum + m.renderTime, 0) / recentMetrics.length

    return {
      avgFPS: Math.round(avgFPS),
      avgMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      totalEvents: this.events.length,
      criticalEvents: this.events.filter((e) => e.severity === 'critical').length,
      warningEvents: this.events.filter((e) => e.severity === 'high').length,
    }
  }

  /**
   * 콜백 설정
   */
  on(event: 'metric' | 'event' | 'warning' | 'critical', callback: (data: any) => void) {
    switch (event) {
      case 'metric':
        this.callbacks.onMetric = callback
        break
      case 'event':
        this.callbacks.onEvent = callback
        break
      case 'warning':
        this.callbacks.onWarning = callback
        break
      case 'critical':
        this.callbacks.onCritical = callback
        break
    }
  }

  /**
   * 심각도 계산
   */
  private getSeverity(type: string, value: number): PerformanceEvent['severity'] {
    const thresholds = this.thresholds[type as keyof PerformanceThresholds]
    if (!thresholds) return 'medium'

    if (type === 'fps') {
      if (value < thresholds.critical) return 'critical'
      if (value < thresholds.warning) return 'high'
    } else {
      if (value > thresholds.critical) return 'critical'
      if (value > thresholds.warning) return 'high'
    }

    return 'medium'
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    this.stopMonitoring()
    this.metrics = []
    this.events = []
    this.callbacks = {}
  }
}

/**
 * 렌더링 성능 측정 유틸리티
 */
export class RenderPerformanceMonitor {
  private renderTimes: number[] = []
  private isMeasuring = false
  private measureCallback?: (renderTime: number) => void

  /**
   * 렌더링 시간 측정 시작
   */
  startMeasuring(callback?: (renderTime: number) => void) {
    this.isMeasuring = true
    this.measureCallback = callback
    this.measureRenderTime()
  }

  /**
   * 렌더링 시간 측정 중지
   */
  stopMeasuring() {
    this.isMeasuring = false
    this.measureCallback = undefined
  }

  /**
   * 렌더링 시간 측정
   */
  private measureRenderTime() {
    if (!this.isMeasuring) return

    const startTime = performance.now()

    requestAnimationFrame(() => {
      if (!this.isMeasuring) return // 중복 체크

      const renderTime = performance.now() - startTime
      this.renderTimes.push(renderTime)

      if (this.measureCallback) {
        this.measureCallback(renderTime)
      }

      // 다음 프레임 측정 - 무한 루프 방지를 위해 조건 확인
      if (this.isMeasuring) {
        requestAnimationFrame(() => this.measureRenderTime())
      }
    })
  }

  /**
   * 평균 렌더링 시간 가져오기
   */
  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0
    return this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
  }

  /**
   * 최대 렌더링 시간 가져오기
   */
  getMaxRenderTime(): number {
    return Math.max(...this.renderTimes, 0)
  }

  /**
   * 렌더링 시간 히스토리 가져오기
   */
  getRenderTimeHistory(): number[] {
    return [...this.renderTimes]
  }

  /**
   * 메모리 정리
   */
  cleanup() {
    this.stopMeasuring()
    this.renderTimes = []
  }
}

/**
 * 메모리 사용량 모니터링
 */
export class MemoryMonitor {
  private memoryHistory: Array<{ timestamp: number; used: number; total: number }> = []
  private monitoringInterval: number | null = null

  /**
   * 메모리 모니터링 시작
   */
  startMonitoring(intervalMs = 5000) {
    this.monitoringInterval = window.setInterval(() => {
      this.recordMemoryUsage()
    }, intervalMs)
  }

  /**
   * 메모리 모니터링 중지
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * 메모리 사용량 기록
   */
  private recordMemoryUsage() {
    const memoryInfo = (performance as any).memory
    if (!memoryInfo) return

    this.memoryHistory.push({
      timestamp: Date.now(),
      used: memoryInfo.usedJSHeapSize,
      total: memoryInfo.totalJSHeapSize,
    })

    // 히스토리 제한 (최근 100개만 유지)
    if (this.memoryHistory.length > 100) {
      this.memoryHistory = this.memoryHistory.slice(-100)
    }
  }

  /**
   * 현재 메모리 사용량 가져오기
   */
  getCurrentMemoryUsage(): { used: number; total: number; percentage: number } | null {
    const memoryInfo = (performance as any).memory
    if (!memoryInfo) return null

    return {
      used: memoryInfo.usedJSHeapSize,
      total: memoryInfo.totalJSHeapSize,
      percentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100,
    }
  }

  /**
   * 메모리 사용량 히스토리 가져오기
   */
  getMemoryHistory(): Array<{ timestamp: number; used: number; total: number }> {
    return [...this.memoryHistory]
  }

  /**
   * 메모리 누수 감지
   */
  detectMemoryLeak(): boolean {
    if (this.memoryHistory.length < 10) return false

    const recent = this.memoryHistory.slice(-10)
    const first = recent[0]
    const last = recent[recent.length - 1]

    // 10% 이상 증가하면 메모리 누수로 간주
    const increase = (last.used - first.used) / first.used
    return increase > 0.1
  }
}

/**
 * 글로벌 성능 모니터 인스턴스
 */
export const globalPerformanceMonitor = new PerformanceMonitor()
export const globalRenderMonitor = new RenderPerformanceMonitor()
export const globalMemoryMonitor = new MemoryMonitor()

// 개발 환경에서만 자동 시작 (렌더링 모니터링은 제외)
// 성능 모니터링을 기본적으로 비활성화하여 불필요한 경고 방지
if (process.env.NODE_ENV === 'development' && false) {
  // false로 설정하여 비활성화
  globalPerformanceMonitor.startMonitoring()
  globalMemoryMonitor.startMonitoring()

  // 성능 이벤트 로깅
  globalPerformanceMonitor.on('critical', (event) => {
    console.error('🚨 Critical performance issue:', event)
  })

  globalPerformanceMonitor.on('warning', (event) => {
    console.warn('⚠️ Performance warning:', event)
  })
}

// 페이지 언로드 시 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalPerformanceMonitor.cleanup()
    globalRenderMonitor.cleanup()
    globalMemoryMonitor.stopMonitoring()
  })
}
