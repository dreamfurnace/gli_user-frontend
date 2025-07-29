/**
 * ComponentManager - 컴포넌트 생명주기 관리 시스템
 *
 * 이 클래스는 Vue 컴포넌트의 초기화, 상태 관리, 정리를 위한 중앙화된 시스템을 제공합니다.
 * 컴포넌트 간의 의존성 해결, 메모리 관리, 에러 처리 등을 담당합니다.
 */

// 컴포넌트 상태 열거형
export enum ComponentState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  ERROR = 'error',
}

// 컴포넌트 메타데이터 인터페이스
export interface ComponentMetadata {
  id: string
  name: string
  version: string
  dependencies: string[]
  state: ComponentState
  createdAt: Date
  lastUpdated: Date
  errorCount: number
  retryCount: number
}

// 컴포넌트 인스턴스 인터페이스
export interface ComponentInstance {
  id: string
  component: any
  metadata: ComponentMetadata
  state: ComponentState
  errorBoundary?: ErrorBoundary
  eventListeners: Map<string, Function>
  cleanupTasks: Function[]
}

// 에러 바운더리 인터페이스
export interface ErrorBoundary {
  onError: (error: Error, componentId: string) => void
  onRecover: (componentId: string) => void
  maxRetries: number
}

// 컴포넌트 등록 옵션 인터페이스
export interface ComponentRegistrationOptions {
  name?: string
  version?: string
  dependencies?: string[]
  errorBoundary?: ErrorBoundary
  autoInitialize?: boolean
  lazy?: boolean
}

// 컴포넌트 업데이트 옵션 인터페이스
export interface ComponentUpdateOptions {
  force?: boolean
  preserveState?: boolean
  validateDependencies?: boolean
}

// 이벤트 타입 정의
export type ComponentEvent =
  | 'registered'
  | 'initialized'
  | 'updated'
  | 'suspended'
  | 'resumed'
  | 'destroyed'
  | 'error'

// 이벤트 리스너 타입
export type ComponentEventListener = (
  event: ComponentEvent,
  componentId: string,
  data?: any,
) => void

/**
 * ComponentManager 클래스
 *
 * 주요 기능:
 * - 컴포넌트 등록 및 해제
 * - 의존성 해결 및 초기화 순서 관리
 * - 상태 관리 및 업데이트
 * - 에러 처리 및 복구
 * - 메모리 정리 및 최적화
 * - 디버깅 및 모니터링
 */
export class ComponentManager {
  private static instance: ComponentManager
  private components: Map<string, ComponentInstance> = new Map()
  private eventListeners: Map<ComponentEvent, ComponentEventListener[]> = new Map()
  private initializationQueue: string[] = []
  private isInitializing: boolean = false
  private debugMode: boolean = false

  // 싱글톤 패턴 구현
  public static getInstance(): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager()
    }
    return ComponentManager.instance
  }

  private constructor() {
    this.initializeEventSystem()
    this.log('ComponentManager 초기화됨')
  }

  /**
   * 컴포넌트 등록
   * @param id 컴포넌트 고유 식별자
   * @param component 컴포넌트 인스턴스
   * @param options 등록 옵션
   */
  public register(id: string, component: any, options: ComponentRegistrationOptions = {}): boolean {
    try {
      if (this.components.has(id)) {
        this.log(`컴포넌트 ${id}가 이미 등록되어 있습니다.`, 'warn')
        return false
      }

      // 컴포넌트 유효성 검증
      if (!this.validateComponent(component, id)) {
        return false
      }

      const metadata: ComponentMetadata = {
        id,
        name: options.name || id,
        version: options.version || '1.0.0',
        dependencies: options.dependencies || [],
        state: ComponentState.UNINITIALIZED,
        createdAt: new Date(),
        lastUpdated: new Date(),
        errorCount: 0,
        retryCount: 0,
      }

      const instance: ComponentInstance = {
        id,
        component,
        metadata,
        state: ComponentState.UNINITIALIZED,
        errorBoundary: options.errorBoundary,
        eventListeners: new Map(),
        cleanupTasks: [],
      }

      this.components.set(id, instance)
      this.emit('registered', id, { metadata })

      this.log(`컴포넌트 ${id} 등록됨`)

      // 자동 초기화 옵션이 활성화된 경우
      if (options.autoInitialize && !options.lazy) {
        this.initialize(id)
      }

      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 등록 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 벌크 컴포넌트 등록
   * @param components 등록할 컴포넌트 배열
   */
  public registerBulk(
    components: Array<{
      id: string
      component: any
      options?: ComponentRegistrationOptions
    }>,
  ): { success: string[]; failed: string[] } {
    const success: string[] = []
    const failed: string[] = []

    for (const { id, component, options } of components) {
      try {
        if (this.register(id, component, options)) {
          success.push(id)
        } else {
          failed.push(id)
        }
      } catch (error) {
        this.log(`벌크 등록 중 컴포넌트 ${id} 실패: ${error}`, 'error')
        failed.push(id)
      }
    }

    this.log(`벌크 등록 완료: 성공 ${success.length}개, 실패 ${failed.length}개`)
    return { success, failed }
  }

  /**
   * 컴포넌트 등록 해제
   * @param id 컴포넌트 ID
   */
  public unregister(id: string): boolean {
    return this.remove(id)
  }

  /**
   * 컴포넌트 재등록
   * @param id 컴포넌트 ID
   * @param component 새로운 컴포넌트 인스턴스
   * @param options 등록 옵션
   */
  public reregister(
    id: string,
    component: any,
    options: ComponentRegistrationOptions = {},
  ): boolean {
    try {
      // 기존 컴포넌트 제거
      this.remove(id)

      // 새 컴포넌트 등록
      return this.register(id, component, options)
    } catch (error) {
      this.log(`컴포넌트 ${id} 재등록 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 컴포넌트 유효성 검증
   * @param component 컴포넌트 인스턴스
   * @param id 컴포넌트 ID
   */
  private validateComponent(component: any, id: string): boolean {
    if (!component) {
      this.log(`컴포넌트 ${id}: 컴포넌트 인스턴스가 null입니다.`, 'error')
      return false
    }

    if (typeof component !== 'object') {
      this.log(`컴포넌트 ${id}: 컴포넌트가 객체가 아닙니다.`, 'error')
      return false
    }

    // 필수 메서드 검증 (선택적)
    const requiredMethods = ['init', 'destroy']
    const missingMethods = requiredMethods.filter(
      (method) => typeof component[method] !== 'function',
    )

    if (missingMethods.length > 0) {
      this.log(`컴포넌트 ${id}: 필수 메서드가 누락되었습니다: ${missingMethods.join(', ')}`, 'warn')
      // 경고만 하고 계속 진행 (선택적 검증)
    }

    return true
  }

  /**
   * 컴포넌트 등록 상태 확인
   * @param id 컴포넌트 ID
   */
  public isRegistered(id: string): boolean {
    return this.components.has(id)
  }

  /**
   * 등록된 컴포넌트 수 반환
   */
  public getRegisteredCount(): number {
    return this.components.size
  }

  /**
   * 컴포넌트 등록 정보 반환
   * @param id 컴포넌트 ID
   */
  public getRegistrationInfo(id: string): ComponentMetadata | null {
    const instance = this.get(id)
    return instance ? instance.metadata : null
  }

  /**
   * 모든 등록 정보 반환
   */
  public getAllRegistrationInfo(): ComponentMetadata[] {
    return Array.from(this.components.values()).map((instance) => instance.metadata)
  }

  /**
   * 컴포넌트 검색
   * @param id 컴포넌트 ID
   */
  public get(id: string): ComponentInstance | null {
    const instance = this.components.get(id)
    if (!instance) {
      this.log(`컴포넌트 ${id}를 찾을 수 없습니다.`, 'warn')
      return null
    }
    return instance
  }

  /**
   * 모든 컴포넌트 목록 반환
   */
  public getAll(): ComponentInstance[] {
    return Array.from(this.components.values())
  }

  /**
   * 고급 컴포넌트 검색
   * @param options 검색 옵션
   */
  public search(
    options: {
      name?: string
      state?: ComponentState
      version?: string
      createdAfter?: Date
      createdBefore?: Date
      hasErrors?: boolean
      dependencies?: string[]
      limit?: number
      offset?: number
      sortBy?: 'name' | 'createdAt' | 'lastUpdated' | 'errorCount'
      sortOrder?: 'asc' | 'desc'
    } = {},
  ): ComponentInstance[] {
    let results = Array.from(this.components.values())

    // 이름으로 필터링
    if (options.name) {
      const nameRegex = new RegExp(options.name, 'i')
      results = results.filter(
        (instance) => nameRegex.test(instance.metadata.name) || nameRegex.test(instance.id),
      )
    }

    // 상태로 필터링
    if (options.state) {
      results = results.filter((instance) => instance.state === options.state)
    }

    // 버전으로 필터링
    if (options.version) {
      results = results.filter((instance) => instance.metadata.version === options.version)
    }

    // 생성 날짜 범위로 필터링
    if (options.createdAfter) {
      results = results.filter((instance) => instance.metadata.createdAt >= options.createdAfter!)
    }

    if (options.createdBefore) {
      results = results.filter((instance) => instance.metadata.createdAt <= options.createdBefore!)
    }

    // 에러가 있는 컴포넌트 필터링
    if (options.hasErrors !== undefined) {
      results = results.filter((instance) =>
        options.hasErrors ? instance.metadata.errorCount > 0 : instance.metadata.errorCount === 0,
      )
    }

    // 의존성으로 필터링
    if (options.dependencies && options.dependencies.length > 0) {
      results = results.filter((instance) =>
        options.dependencies!.some((dep) => instance.metadata.dependencies.includes(dep)),
      )
    }

    // 정렬
    if (options.sortBy) {
      results.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (options.sortBy) {
          case 'name':
            aValue = a.metadata.name
            bValue = b.metadata.name
            break
          case 'createdAt':
            aValue = a.metadata.createdAt
            bValue = b.metadata.createdAt
            break
          case 'lastUpdated':
            aValue = a.metadata.lastUpdated
            bValue = b.metadata.lastUpdated
            break
          case 'errorCount':
            aValue = a.metadata.errorCount
            bValue = b.metadata.errorCount
            break
          default:
            return 0
        }

        if (options.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        }
      })
    }

    // 페이지네이션
    if (options.offset) {
      results = results.slice(options.offset)
    }

    if (options.limit) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /**
   * 상태별 컴포넌트 검색
   * @param state 컴포넌트 상태
   */
  public getByState(state: ComponentState): ComponentInstance[] {
    return this.search({ state })
  }

  /**
   * 활성 컴포넌트 검색
   */
  public getActiveComponents(): ComponentInstance[] {
    return this.getByState(ComponentState.ACTIVE)
  }

  /**
   * 에러가 있는 컴포넌트 검색
   */
  public getErrorComponents(): ComponentInstance[] {
    return this.search({ hasErrors: true })
  }

  /**
   * 의존성이 있는 컴포넌트 검색
   * @param dependencyId 의존성 컴포넌트 ID
   */
  public getComponentsWithDependency(dependencyId: string): ComponentInstance[] {
    return this.search({ dependencies: [dependencyId] })
  }

  /**
   * 이름으로 컴포넌트 검색 (부분 일치)
   * @param name 검색할 이름
   */
  public findByName(name: string): ComponentInstance[] {
    return this.search({ name })
  }

  /**
   * 정규식으로 컴포넌트 검색
   * @param pattern 정규식 패턴
   */
  public findByPattern(pattern: RegExp): ComponentInstance[] {
    const results: ComponentInstance[] = []

    for (const instance of this.components.values()) {
      if (pattern.test(instance.id) || pattern.test(instance.metadata.name)) {
        results.push(instance)
      }
    }

    return results
  }

  /**
   * 컴포넌트 존재 여부 확인
   * @param id 컴포넌트 ID
   */
  public exists(id: string): boolean {
    return this.components.has(id)
  }

  /**
   * 컴포넌트 개수 반환
   * @param options 검색 옵션 (search 메서드와 동일)
   */
  public count(options: Parameters<typeof this.search>[0] = {}): number {
    return this.search(options).length
  }

  /**
   * 컴포넌트 메타데이터만 반환
   * @param id 컴포넌트 ID
   */
  public getMetadata(id: string): ComponentMetadata | null {
    const instance = this.get(id)
    return instance ? instance.metadata : null
  }

  /**
   * 모든 컴포넌트 메타데이터 반환
   */
  public getAllMetadata(): ComponentMetadata[] {
    return Array.from(this.components.values()).map((instance) => instance.metadata)
  }

  /**
   * 컴포넌트 상태 통계 반환
   */
  public getStateStatistics(): Record<ComponentState, number> {
    const stats: Record<ComponentState, number> = {
      [ComponentState.UNINITIALIZED]: 0,
      [ComponentState.INITIALIZING]: 0,
      [ComponentState.ACTIVE]: 0,
      [ComponentState.SUSPENDED]: 0,
      [ComponentState.DESTROYING]: 0,
      [ComponentState.DESTROYED]: 0,
      [ComponentState.ERROR]: 0,
    }

    for (const instance of this.components.values()) {
      stats[instance.state]++
    }

    return stats
  }

  /**
   * 컴포넌트 의존성 그래프 반환
   */
  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {}

    for (const [id, instance] of this.components) {
      graph[id] = [...instance.metadata.dependencies]
    }

    return graph
  }

  /**
   * 순환 의존성 검사
   */
  public hasCircularDependencies(): boolean {
    const graph = this.getDependencyGraph()
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        return true
      }

      if (visited.has(node)) {
        return false
      }

      visited.add(node)
      recursionStack.add(node)

      for (const neighbor of graph[node] || []) {
        if (hasCycle(neighbor)) {
          return true
        }
      }

      recursionStack.delete(node)
      return false
    }

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * 컴포넌트 초기화 순서 반환 (위상 정렬)
   */
  public getInitializationOrder(): string[] {
    const graph = this.getDependencyGraph()
    const inDegree: Record<string, number> = {}
    const queue: string[] = []
    const result: string[] = []

    // 진입 차수 계산
    for (const node of Object.keys(graph)) {
      inDegree[node] = 0
    }

    for (const dependencies of Object.values(graph)) {
      for (const dep of dependencies) {
        inDegree[dep] = (inDegree[dep] || 0) + 1
      }
    }

    // 진입 차수가 0인 노드들을 큐에 추가
    for (const node of Object.keys(inDegree)) {
      if (inDegree[node] === 0) {
        queue.push(node)
      }
    }

    // 위상 정렬 수행
    while (queue.length > 0) {
      const node = queue.shift()!
      result.push(node)

      for (const neighbor of graph[node] || []) {
        inDegree[neighbor]--
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor)
        }
      }
    }

    // 순환 의존성이 있는 경우 빈 배열 반환
    if (result.length !== Object.keys(graph).length) {
      this.log('순환 의존성이 감지되어 초기화 순서를 결정할 수 없습니다.', 'error')
      return []
    }

    return result
  }

  /**
   * 컴포넌트 제거
   * @param id 컴포넌트 ID
   */
  public remove(id: string): boolean {
    try {
      const instance = this.components.get(id)
      if (!instance) {
        this.log(`컴포넌트 ${id}를 찾을 수 없습니다.`, 'warn')
        return false
      }

      // 의존성이 있는 컴포넌트 확인
      const dependents = this.getDependents(id)
      if (dependents.length > 0) {
        this.log(`컴포넌트 ${id}에 의존하는 컴포넌트가 있습니다: ${dependents.join(', ')}`, 'warn')
        return false
      }

      // 정리 작업 실행
      this.cleanupComponent(instance)

      this.components.delete(id)
      this.emit('destroyed', id)

      this.log(`컴포넌트 ${id} 제거됨`)
      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 제거 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 안전한 컴포넌트 제거 (의존성 무시)
   * @param id 컴포넌트 ID
   * @param force 강제 제거 여부
   */
  public removeSafe(id: string, force: boolean = false): boolean {
    try {
      const instance = this.components.get(id)
      if (!instance) {
        this.log(`컴포넌트 ${id}를 찾을 수 없습니다.`, 'warn')
        return false
      }

      // 강제 제거가 아닌 경우 의존성 확인
      if (!force) {
        const dependents = this.getDependents(id)
        if (dependents.length > 0) {
          this.log(
            `컴포넌트 ${id}에 의존하는 컴포넌트가 있습니다: ${dependents.join(', ')}`,
            'warn',
          )
          return false
        }
      }

      // 정리 작업 실행
      this.cleanupComponent(instance)

      this.components.delete(id)
      this.emit('destroyed', id)

      this.log(`컴포넌트 ${id} 안전하게 제거됨`)
      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 안전 제거 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 벌크 컴포넌트 제거
   * @param ids 제거할 컴포넌트 ID 배열
   * @param options 제거 옵션
   */
  public removeBulk(
    ids: string[],
    options: {
      force?: boolean
      ignoreDependencies?: boolean
      removeDependents?: boolean
    } = {},
  ): { success: string[]; failed: string[]; skipped: string[] } {
    const success: string[] = []
    const failed: string[] = []
    const skipped: string[] = []

    // 의존성 순서대로 정렬 (의존성이 있는 컴포넌트를 먼저 제거)
    const sortedIds = this.sortByDependencies(ids, options.removeDependents || false)

    for (const id of sortedIds) {
      try {
        if (options.ignoreDependencies) {
          // 의존성 무시하고 제거
          if (this.removeSafe(id, options.force)) {
            success.push(id)
          } else {
            failed.push(id)
          }
        } else {
          // 일반 제거
          if (this.remove(id)) {
            success.push(id)
          } else {
            // 의존성 문제로 제거할 수 없는 경우
            const dependents = this.getDependents(id)
            if (dependents.length > 0 && !options.removeDependents) {
              skipped.push(id)
            } else {
              failed.push(id)
            }
          }
        }
      } catch (error) {
        this.log(`벌크 제거 중 컴포넌트 ${id} 실패: ${error}`, 'error')
        failed.push(id)
      }
    }

    this.log(
      `벌크 제거 완료: 성공 ${success.length}개, 실패 ${failed.length}개, 건너뜀 ${skipped.length}개`,
    )
    return { success, failed, skipped }
  }

  /**
   * 조건부 컴포넌트 제거
   * @param condition 제거 조건 함수
   * @param options 제거 옵션
   */
  public removeByCondition(
    condition: (instance: ComponentInstance) => boolean,
    options: {
      force?: boolean
      ignoreDependencies?: boolean
    } = {},
  ): { success: string[]; failed: string[] } {
    const matchingIds = Array.from(this.components.values())
      .filter(condition)
      .map((instance) => instance.id)

    return this.removeBulk(matchingIds, options)
  }

  /**
   * 상태별 컴포넌트 제거
   * @param state 제거할 컴포넌트 상태
   * @param options 제거 옵션
   */
  public removeByState(
    state: ComponentState,
    options: {
      force?: boolean
      ignoreDependencies?: boolean
    } = {},
  ): { success: string[]; failed: string[] } {
    return this.removeByCondition((instance) => instance.state === state, options)
  }

  /**
   * 에러가 있는 컴포넌트 제거
   * @param options 제거 옵션
   */
  public removeErrorComponents(
    options: {
      force?: boolean
      ignoreDependencies?: boolean
    } = {},
  ): { success: string[]; failed: string[] } {
    return this.removeByCondition((instance) => instance.metadata.errorCount > 0, options)
  }

  /**
   * 사용하지 않는 컴포넌트 제거 (의존성이 없는 컴포넌트)
   * @param options 제거 옵션
   */
  public removeUnusedComponents(
    options: {
      force?: boolean
    } = {},
  ): { success: string[]; failed: string[] } {
    return this.removeByCondition(
      (instance) => this.getDependents(instance.id).length === 0,
      options,
    )
  }

  /**
   * 모든 컴포넌트 제거
   * @param options 제거 옵션
   */
  public removeAll(
    options: {
      force?: boolean
      ignoreDependencies?: boolean
    } = {},
  ): { success: string[]; failed: string[] } {
    const allIds = Array.from(this.components.keys())
    return this.removeBulk(allIds, options)
  }

  /**
   * 컴포넌트 제거 전 검증
   * @param id 컴포넌트 ID
   */
  public validateRemoval(id: string): {
    canRemove: boolean
    reason?: string
    dependents: string[]
    warnings: string[]
  } {
    const instance = this.components.get(id)
    if (!instance) {
      return {
        canRemove: false,
        reason: '컴포넌트를 찾을 수 없습니다.',
        dependents: [],
        warnings: [],
      }
    }

    const dependents = this.getDependents(id)
    const warnings: string[] = []

    // 경고 사항 수집
    if (instance.state === ComponentState.ACTIVE) {
      warnings.push('활성 상태의 컴포넌트입니다.')
    }

    if (instance.metadata.errorCount > 0) {
      warnings.push('에러가 발생한 컴포넌트입니다.')
    }

    if (instance.eventListeners.size > 0) {
      warnings.push('등록된 이벤트 리스너가 있습니다.')
    }

    if (instance.cleanupTasks.length > 0) {
      warnings.push('정리 작업이 등록되어 있습니다.')
    }

    const canRemove = dependents.length === 0

    return {
      canRemove,
      reason: canRemove ? undefined : '의존성이 있는 컴포넌트가 있습니다.',
      dependents,
      warnings,
    }
  }

  /**
   * 의존성 순서로 정렬
   * @param ids 컴포넌트 ID 배열
   * @param includeDependents 의존성 컴포넌트 포함 여부
   */
  private sortByDependencies(ids: string[], includeDependents: boolean = false): string[] {
    const allIds = new Set(ids)

    if (includeDependents) {
      // 의존성 컴포넌트들도 포함
      for (const id of ids) {
        const dependents = this.getDependents(id)
        dependents.forEach((depId) => allIds.add(depId))
      }
    }

    const graph = this.getDependencyGraph()
    const inDegree: Record<string, number> = {}
    const queue: string[] = []
    const result: string[] = []

    // 진입 차수 계산
    for (const id of allIds) {
      inDegree[id] = 0
    }

    for (const id of allIds) {
      const dependencies = graph[id] || []
      for (const dep of dependencies) {
        if (allIds.has(dep)) {
          inDegree[id]++
        }
      }
    }

    // 진입 차수가 0인 노드들을 큐에 추가
    for (const id of allIds) {
      if (inDegree[id] === 0) {
        queue.push(id)
      }
    }

    // 위상 정렬 수행
    while (queue.length > 0) {
      const id = queue.shift()!
      result.push(id)

      const dependencies = graph[id] || []
      for (const dep of dependencies) {
        if (allIds.has(dep)) {
          inDegree[dep]--
          if (inDegree[dep] === 0) {
            queue.push(dep)
          }
        }
      }
    }

    // 순환 의존성이 있는 경우 원래 순서 반환
    if (result.length !== allIds.size) {
      this.log('순환 의존성이 감지되어 원래 순서로 제거합니다.', 'warn')
      return Array.from(allIds)
    }

    return result
  }

  /**
   * 컴포넌트 제거 통계
   */
  public getRemovalStatistics(): {
    totalComponents: number
    removableComponents: number
    componentsWithDependents: number
    errorComponents: number
    activeComponents: number
  } {
    const components = Array.from(this.components.values())

    return {
      totalComponents: components.length,
      removableComponents: components.filter((c) => this.getDependents(c.id).length === 0).length,
      componentsWithDependents: components.filter((c) => this.getDependents(c.id).length > 0)
        .length,
      errorComponents: components.filter((c) => c.metadata.errorCount > 0).length,
      activeComponents: components.filter((c) => c.state === ComponentState.ACTIVE).length,
    }
  }

  /**
   * 컴포넌트 초기화
   * @param id 컴포넌트 ID
   */
  public async initialize(id: string): Promise<boolean> {
    try {
      const instance = this.get(id)
      if (!instance) {
        return false
      }

      if (instance.state === ComponentState.ACTIVE) {
        this.log(`컴포넌트 ${id}가 이미 활성 상태입니다.`)
        return true
      }

      // 의존성 확인 및 초기화
      const dependencies = instance.metadata.dependencies
      for (const depId of dependencies) {
        const depInstance = this.get(depId)
        if (!depInstance) {
          throw new Error(`의존성 컴포넌트 ${depId}를 찾을 수 없습니다.`)
        }
        if (depInstance.state !== ComponentState.ACTIVE) {
          await this.initialize(depId)
        }
      }

      // 상태 업데이트
      instance.state = ComponentState.INITIALIZING
      instance.metadata.lastUpdated = new Date()

      // 컴포넌트 초기화 로직 실행
      if (typeof instance.component.init === 'function') {
        await instance.component.init()
      }

      instance.state = ComponentState.ACTIVE
      this.emit('initialized', id)

      this.log(`컴포넌트 ${id} 초기화 완료`)
      return true
    } catch (error) {
      this.handleComponentError(id, error as Error)
      return false
    }
  }

  /**
   * 컴포넌트 업데이트
   * @param id 컴포넌트 ID
   * @param options 업데이트 옵션
   */
  public async update(id: string, options: ComponentUpdateOptions = {}): Promise<boolean> {
    const startTime = Date.now()

    try {
      const instance = this.get(id)
      if (!instance) {
        this.addToUpdateHistory(id, options, false, '컴포넌트를 찾을 수 없습니다.')
        return false
      }

      // 의존성 검증
      if (options.validateDependencies) {
        const dependencies = instance.metadata.dependencies
        for (const depId of dependencies) {
          const depInstance = this.get(depId)
          if (!depInstance || depInstance.state !== ComponentState.ACTIVE) {
            const error = `의존성 컴포넌트 ${depId}가 활성 상태가 아닙니다.`
            this.addToUpdateHistory(id, options, false, error)
            throw new Error(error)
          }
        }
      }

      // 상태 보존 옵션 처리
      const previousState = options.preserveState ? this.getComponentState(id) : null

      // 컴포넌트 업데이트 로직 실행
      if (typeof instance.component.update === 'function') {
        await instance.component.update(options)
      }

      instance.metadata.lastUpdated = new Date()
      this.emit('updated', id, { options })

      const duration = Date.now() - startTime
      this.recordUpdatePerformance(id, duration)
      this.addToUpdateHistory(id, options, true)

      this.log(`컴포넌트 ${id} 업데이트 완료 (${duration}ms)`)
      return true
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordUpdatePerformance(id, duration)
      this.addToUpdateHistory(id, options, false, (error as Error).message)
      this.handleComponentError(id, error as Error)
      return false
    }
  }

  /**
   * 벌크 컴포넌트 업데이트
   * @param ids 업데이트할 컴포넌트 ID 배열
   * @param options 업데이트 옵션
   */
  public async updateBulk(
    ids: string[],
    options: ComponentUpdateOptions & {
      parallel?: boolean
      retryFailed?: boolean
      maxRetries?: number
    } = {},
  ): Promise<{
    success: string[]
    failed: string[]
    skipped: string[]
  }> {
    const success: string[] = []
    const failed: string[] = []
    const skipped: string[] = []

    const { parallel = false, retryFailed = false, maxRetries = 3, ...updateOptions } = options

    if (parallel) {
      // 병렬 업데이트
      const updatePromises = ids.map(async (id) => {
        try {
          const result = await this.update(id, updateOptions)
          return { id, success: result }
        } catch (error) {
          return { id, success: false, error }
        }
      })

      const results = await Promise.all(updatePromises)

      results.forEach(({ id, success: result, error }) => {
        if (result) {
          success.push(id)
        } else {
          failed.push(id)
          if (error) {
            this.log(`컴포넌트 ${id} 업데이트 실패: ${error}`, 'error')
          }
        }
      })
    } else {
      // 순차 업데이트
      for (const id of ids) {
        try {
          const result = await this.update(id, updateOptions)
          if (result) {
            success.push(id)
          } else {
            failed.push(id)
          }
        } catch (error) {
          this.log(`컴포넌트 ${id} 업데이트 실패: ${error}`, 'error')
          failed.push(id)
        }
      }
    }

    // 실패한 컴포넌트 재시도
    if (retryFailed && failed.length > 0) {
      this.log(`실패한 ${failed.length}개 컴포넌트 재시도 중...`)

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const retryIds = [...failed]
        failed.length = 0

        for (const id of retryIds) {
          try {
            const result = await this.update(id, updateOptions)
            if (result) {
              success.push(id)
            } else {
              failed.push(id)
            }
          } catch (error) {
            this.log(`컴포넌트 ${id} 재시도 ${attempt} 실패: ${error}`, 'error')
            failed.push(id)
          }
        }

        if (failed.length === 0) {
          this.log(`모든 컴포넌트 업데이트 성공 (재시도 ${attempt}회)`)
          break
        }
      }
    }

    this.log(
      `벌크 업데이트 완료: 성공 ${success.length}개, 실패 ${failed.length}개, 건너뜀 ${skipped.length}개`,
    )
    return { success, failed, skipped }
  }

  /**
   * 조건부 컴포넌트 업데이트
   * @param condition 업데이트 조건 함수
   * @param options 업데이트 옵션
   */
  public async updateByCondition(
    condition: (instance: ComponentInstance) => boolean,
    options: ComponentUpdateOptions & {
      parallel?: boolean
      retryFailed?: boolean
      maxRetries?: number
    } = {},
  ): Promise<{
    success: string[]
    failed: string[]
  }> {
    const matchingIds = Array.from(this.components.values())
      .filter(condition)
      .map((instance) => instance.id)

    const result = await this.updateBulk(matchingIds, options)
    return {
      success: result.success,
      failed: result.failed,
    }
  }

  /**
   * 상태별 컴포넌트 업데이트
   * @param state 업데이트할 컴포넌트 상태
   * @param options 업데이트 옵션
   */
  public async updateByState(
    state: ComponentState,
    options: ComponentUpdateOptions & {
      parallel?: boolean
      retryFailed?: boolean
      maxRetries?: number
    } = {},
  ): Promise<{
    success: string[]
    failed: string[]
  }> {
    return this.updateByCondition((instance) => instance.state === state, options)
  }

  /**
   * 활성 컴포넌트 업데이트
   * @param options 업데이트 옵션
   */
  public async updateActiveComponents(
    options: ComponentUpdateOptions & {
      parallel?: boolean
      retryFailed?: boolean
      maxRetries?: number
    } = {},
  ): Promise<{
    success: string[]
    failed: string[]
  }> {
    return this.updateByState(ComponentState.ACTIVE, options)
  }

  /**
   * 컴포넌트 업데이트 전 검증
   * @param id 컴포넌트 ID
   * @param options 업데이트 옵션
   */
  public validateUpdate(
    id: string,
    options: ComponentUpdateOptions = {},
  ): {
    canUpdate: boolean
    reason?: string
    warnings: string[]
    dependencies: string[]
  } {
    const instance = this.get(id)
    if (!instance) {
      return {
        canUpdate: false,
        reason: '컴포넌트를 찾을 수 없습니다.',
        warnings: [],
        dependencies: [],
      }
    }

    const warnings: string[] = []
    const dependencies: string[] = []

    // 상태 확인
    if (instance.state === ComponentState.ERROR) {
      warnings.push('에러 상태의 컴포넌트입니다.')
    }

    if (
      instance.state === ComponentState.DESTROYING ||
      instance.state === ComponentState.DESTROYED
    ) {
      return {
        canUpdate: false,
        reason: '제거 중이거나 이미 제거된 컴포넌트입니다.',
        warnings,
        dependencies,
      }
    }

    // 의존성 확인
    if (options.validateDependencies) {
      const deps = instance.metadata.dependencies
      for (const depId of deps) {
        const depInstance = this.get(depId)
        if (!depInstance) {
          warnings.push(`의존성 컴포넌트 ${depId}를 찾을 수 없습니다.`)
        } else if (depInstance.state !== ComponentState.ACTIVE) {
          warnings.push(`의존성 컴포넌트 ${depId}가 활성 상태가 아닙니다.`)
        }
        dependencies.push(depId)
      }
    }

    // 업데이트 메서드 확인
    if (typeof instance.component.update !== 'function') {
      warnings.push('업데이트 메서드가 정의되지 않았습니다.')
    }

    const canUpdate =
      instance.state === ComponentState.ACTIVE || instance.state === ComponentState.SUSPENDED

    return {
      canUpdate,
      reason: canUpdate ? undefined : '컴포넌트가 업데이트 가능한 상태가 아닙니다.',
      warnings,
      dependencies,
    }
  }

  /**
   * 컴포넌트 롤백 (이전 상태로 복원)
   * @param id 컴포넌트 ID
   * @param targetState 복원할 상태
   */
  public async rollback(id: string, targetState: ComponentState): Promise<boolean> {
    try {
      const instance = this.get(id)
      if (!instance) {
        return false
      }

      // 현재 상태 저장
      const currentState = instance.state

      // 상태 변경
      instance.state = targetState
      instance.metadata.lastUpdated = new Date()

      // 롤백 이벤트 발생
      this.emit('updated', id, {
        rollback: true,
        fromState: currentState,
        toState: targetState,
      })

      this.log(`컴포넌트 ${id} 롤백 완료: ${currentState} → ${targetState}`)
      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 롤백 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 컴포넌트 업데이트 히스토리 관리
   */
  private updateHistory: Array<{
    id: string
    timestamp: Date
    options: any
    success: boolean
    error?: string
  }> = []

  /**
   * 업데이트 히스토리 추가
   * @param id 컴포넌트 ID
   * @param options 업데이트 옵션
   * @param success 성공 여부
   * @param error 에러 메시지
   */
  private addToUpdateHistory(id: string, options: any, success: boolean, error?: string): void {
    this.updateHistory.push({
      id,
      timestamp: new Date(),
      options,
      success,
      error,
    })

    // 히스토리 크기 제한 (최근 1000개만 유지)
    if (this.updateHistory.length > 1000) {
      this.updateHistory = this.updateHistory.slice(-1000)
    }
  }

  /**
   * 업데이트 히스토리 조회
   * @param id 컴포넌트 ID (선택적)
   * @param limit 조회할 개수
   */
  public getUpdateHistory(
    id?: string,
    limit: number = 50,
  ): Array<{
    id: string
    timestamp: Date
    options: any
    success: boolean
    error?: string
  }> {
    let history = this.updateHistory

    if (id) {
      history = history.filter((entry) => entry.id === id)
    }

    return history.slice(-limit)
  }

  /**
   * 업데이트 통계 반환
   */
  public getUpdateStatistics(): {
    totalUpdates: number
    successfulUpdates: number
    failedUpdates: number
    averageUpdateTime: number
    lastUpdateTime: Date | null
  } {
    const history = this.updateHistory

    if (history.length === 0) {
      return {
        totalUpdates: 0,
        successfulUpdates: 0,
        failedUpdates: 0,
        averageUpdateTime: 0,
        lastUpdateTime: null,
      }
    }

    const successfulUpdates = history.filter((entry) => entry.success).length
    const failedUpdates = history.length - successfulUpdates
    const lastUpdateTime = history[history.length - 1].timestamp

    return {
      totalUpdates: history.length,
      successfulUpdates,
      failedUpdates,
      averageUpdateTime: 0, // 실제 구현에서는 업데이트 시간을 측정해야 함
      lastUpdateTime,
    }
  }

  /**
   * 업데이트 성능 모니터링
   */
  private updatePerformance: Map<
    string,
    {
      totalTime: number
      count: number
      averageTime: number
      lastUpdateTime: Date
    }
  > = new Map()

  /**
   * 업데이트 성능 기록
   * @param id 컴포넌트 ID
   * @param duration 업데이트 소요 시간 (ms)
   */
  private recordUpdatePerformance(id: string, duration: number): void {
    const performance = this.updatePerformance.get(id) || {
      totalTime: 0,
      count: 0,
      averageTime: 0,
      lastUpdateTime: new Date(),
    }

    performance.totalTime += duration
    performance.count++
    performance.averageTime = performance.totalTime / performance.count
    performance.lastUpdateTime = new Date()

    this.updatePerformance.set(id, performance)
  }

  /**
   * 업데이트 성능 통계 조회
   * @param id 컴포넌트 ID (선택적)
   */
  public getUpdatePerformance(id?: string): any {
    if (id) {
      return this.updatePerformance.get(id) || null
    }

    return Object.fromEntries(this.updatePerformance)
  }

  /**
   * 컴포넌트 일시 중단
   * @param id 컴포넌트 ID
   */
  public suspend(id: string): boolean {
    try {
      const instance = this.get(id)
      if (!instance || instance.state !== ComponentState.ACTIVE) {
        return false
      }

      instance.state = ComponentState.SUSPENDED
      this.emit('suspended', id)

      this.log(`컴포넌트 ${id} 일시 중단됨`)
      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 일시 중단 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 컴포넌트 재개
   * @param id 컴포넌트 ID
   */
  public resume(id: string): boolean {
    try {
      const instance = this.get(id)
      if (!instance || instance.state !== ComponentState.SUSPENDED) {
        return false
      }

      instance.state = ComponentState.ACTIVE
      this.emit('resumed', id)

      this.log(`컴포넌트 ${id} 재개됨`)
      return true
    } catch (error) {
      this.log(`컴포넌트 ${id} 재개 실패: ${error}`, 'error')
      return false
    }
  }

  /**
   * 의존성 컴포넌트 목록 반환
   * @param id 컴포넌트 ID
   */
  public getDependents(id: string): string[] {
    const dependents: string[] = []

    for (const [componentId, instance] of this.components) {
      if (instance.metadata.dependencies.includes(id)) {
        dependents.push(componentId)
      }
    }

    return dependents
  }

  /**
   * 컴포넌트 상태 반환
   * @param id 컴포넌트 ID
   */
  public getComponentState(id: string): ComponentState | null {
    const instance = this.get(id)
    return instance ? instance.state : null
  }

  /**
   * 전체 시스템 상태 반환
   */
  public getSystemStatus(): {
    totalComponents: number
    activeComponents: number
    suspendedComponents: number
    errorComponents: number
  } {
    const components = Array.from(this.components.values())

    return {
      totalComponents: components.length,
      activeComponents: components.filter((c) => c.state === ComponentState.ACTIVE).length,
      suspendedComponents: components.filter((c) => c.state === ComponentState.SUSPENDED).length,
      errorComponents: components.filter((c) => c.state === ComponentState.ERROR).length,
    }
  }

  /**
   * 디버그 모드 설정
   * @param enabled 디버그 모드 활성화 여부
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
    this.log(`디버그 모드 ${enabled ? '활성화' : '비활성화'}됨`)
  }

  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  public on(event: ComponentEvent, listener: ComponentEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  public off(event: ComponentEvent, listener: ComponentEventListener): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param componentId 컴포넌트 ID
   * @param data 추가 데이터
   */
  private emit(event: ComponentEvent, componentId: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event, componentId, data)
        } catch (error) {
          this.log(`이벤트 리스너 실행 중 오류: ${error}`, 'error')
        }
      })
    }
  }

  /**
   * 컴포넌트 정리
   * @param instance 컴포넌트 인스턴스
   */
  private cleanupComponent(instance: ComponentInstance): void {
    try {
      // 정리 작업 실행
      instance.cleanupTasks.forEach((task) => {
        try {
          task()
        } catch (error) {
          this.log(`정리 작업 실행 중 오류: ${error}`, 'error')
        }
      })

      // 이벤트 리스너 제거
      instance.eventListeners.clear()

      // 컴포넌트 destroy 메서드 호출
      if (typeof instance.component.destroy === 'function') {
        instance.component.destroy()
      }

      instance.state = ComponentState.DESTROYED
    } catch (error) {
      this.log(`컴포넌트 ${instance.id} 정리 중 오류: ${error}`, 'error')
    }
  }

  /**
   * 컴포넌트 에러 처리
   * @param id 컴포넌트 ID
   * @param error 에러 객체
   */
  private handleComponentError(id: string, error: Error): void {
    const instance = this.get(id)
    if (!instance) {
      return
    }

    instance.state = ComponentState.ERROR
    instance.metadata.errorCount++
    instance.metadata.lastUpdated = new Date()

    this.log(`컴포넌트 ${id} 에러 발생: ${error.message}`, 'error')

    // 에러 바운더리 처리
    if (instance.errorBoundary) {
      try {
        instance.errorBoundary.onError(error, id)
      } catch (boundaryError) {
        this.log(`에러 바운더리 실행 중 오류: ${boundaryError}`, 'error')
      }
    }

    this.emit('error', id, { error })
  }

  /**
   * 이벤트 시스템 초기화
   */
  private initializeEventSystem(): void {
    const events: ComponentEvent[] = [
      'registered',
      'initialized',
      'updated',
      'suspended',
      'resumed',
      'destroyed',
      'error',
    ]

    events.forEach((event) => {
      this.eventListeners.set(event, [])
    })
  }

  /**
   * 로깅
   * @param message 메시지
   * @param level 로그 레벨
   */
  private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
    if (!this.debugMode && level === 'log') {
      return
    }

    const timestamp = new Date().toISOString()
    const prefix = `[ComponentManager ${timestamp}]`

    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`)
        break
      case 'error':
        console.error(`${prefix} ${message}`)
        break
      default:
        console.log(`${prefix} ${message}`)
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const componentManager = ComponentManager.getInstance()
