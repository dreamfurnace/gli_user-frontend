/**
 * ComponentManager 사용 예제
 *
 * 이 파일은 ComponentManager를 사용하여 컴포넌트를 등록하고 관리하는 방법을 보여줍니다.
 */

import {
  componentManager,
  ComponentState,
  type ComponentRegistrationOptions,
} from './ComponentManager'

// 예제 컴포넌트 클래스들
class ExampleComponent {
  private id: string
  private state: any = {}

  constructor(id: string) {
    this.id = id
  }

  async init(): Promise<void> {
    console.log(`컴포넌트 ${this.id} 초기화 중...`)
    // 초기화 로직
    await new Promise((resolve) => setTimeout(resolve, 100))
    console.log(`컴포넌트 ${this.id} 초기화 완료`)
  }

  async update(options?: any): Promise<void> {
    console.log(`컴포넌트 ${this.id} 업데이트 중...`, options)
    // 업데이트 로직
    await new Promise((resolve) => setTimeout(resolve, 50))
    console.log(`컴포넌트 ${this.id} 업데이트 완료`)
  }

  destroy(): void {
    console.log(`컴포넌트 ${this.id} 정리 중...`)
    // 정리 로직
    this.state = null
    console.log(`컴포넌트 ${this.id} 정리 완료`)
  }

  getState(): any {
    return this.state
  }

  setState(newState: any): void {
    this.state = { ...this.state, ...newState }
  }
}

// 에러 바운더리 예제
const exampleErrorBoundary = {
  onError: (error: Error, componentId: string) => {
    console.error(`컴포넌트 ${componentId} 에러 발생:`, error.message)
    // 에러 복구 로직
  },
  onRecover: (componentId: string) => {
    console.log(`컴포넌트 ${componentId} 복구됨`)
  },
  maxRetries: 3,
}

/**
 * 기본 컴포넌트 등록 예제
 */
export function basicRegistrationExample(): void {
  console.log('=== 기본 컴포넌트 등록 예제 ===')

  // 1. 단일 컴포넌트 등록
  const component1 = new ExampleComponent('example-1')
  const success = componentManager.register('example-1', component1, {
    name: 'Example Component 1',
    version: '1.0.0',
    autoInitialize: true,
  })

  console.log('등록 성공:', success)
  console.log('등록된 컴포넌트 수:', componentManager.getRegisteredCount())
}

/**
 * 의존성이 있는 컴포넌트 등록 예제
 */
export function dependencyRegistrationExample(): void {
  console.log('=== 의존성 컴포넌트 등록 예제 ===')

  // 1. 기본 컴포넌트 등록
  const baseComponent = new ExampleComponent('base-component')
  componentManager.register('base-component', baseComponent, {
    name: 'Base Component',
    autoInitialize: true,
  })

  // 2. 의존성이 있는 컴포넌트 등록
  const dependentComponent = new ExampleComponent('dependent-component')
  componentManager.register('dependent-component', dependentComponent, {
    name: 'Dependent Component',
    dependencies: ['base-component'],
    autoInitialize: true,
  })

  console.log('의존성 컴포넌트 등록 완료')
}

/**
 * 벌크 등록 예제
 */
export function bulkRegistrationExample(): void {
  console.log('=== 벌크 등록 예제 ===')

  const components = [
    {
      id: 'bulk-1',
      component: new ExampleComponent('bulk-1'),
      options: { name: 'Bulk Component 1' },
    },
    {
      id: 'bulk-2',
      component: new ExampleComponent('bulk-2'),
      options: { name: 'Bulk Component 2' },
    },
    {
      id: 'bulk-3',
      component: new ExampleComponent('bulk-3'),
      options: { name: 'Bulk Component 3' },
    },
  ]

  const result = componentManager.registerBulk(components)
  console.log('벌크 등록 결과:', result)
}

/**
 * 컴포넌트 상태 관리 예제
 */
export async function stateManagementExample(): Promise<void> {
  console.log('=== 상태 관리 예제 ===')

  // 컴포넌트 등록
  const component = new ExampleComponent('state-example')
  componentManager.register('state-example', component, {
    name: 'State Management Example',
    errorBoundary: exampleErrorBoundary,
  })

  // 초기화
  await componentManager.initialize('state-example')
  console.log('초기 상태:', componentManager.getComponentState('state-example'))

  // 일시 중단
  componentManager.suspend('state-example')
  console.log('일시 중단 상태:', componentManager.getComponentState('state-example'))

  // 재개
  componentManager.resume('state-example')
  console.log('재개 상태:', componentManager.getComponentState('state-example'))

  // 업데이트
  await componentManager.update('state-example', { force: true })
}

/**
 * 이벤트 리스너 예제
 */
export function eventListenerExample(): void {
  console.log('=== 이벤트 리스너 예제 ===')

  // 이벤트 리스너 등록
  componentManager.on('registered', (event, componentId, data) => {
    console.log(`이벤트: ${event}, 컴포넌트: ${componentId}`, data)
  })

  componentManager.on('initialized', (event, componentId) => {
    console.log(`이벤트: ${event}, 컴포넌트: ${componentId} 초기화됨`)
  })

  componentManager.on('error', (event, componentId, data) => {
    console.error(`이벤트: ${event}, 컴포넌트: ${componentId} 에러:`, data?.error)
  })

  // 컴포넌트 등록 (이벤트 발생)
  const component = new ExampleComponent('event-example')
  componentManager.register('event-example', component, {
    name: 'Event Example Component',
  })
}

/**
 * 시스템 상태 모니터링 예제
 */
export function systemMonitoringExample(): void {
  console.log('=== 시스템 모니터링 예제 ===')

  // 디버그 모드 활성화
  componentManager.setDebugMode(true)

  // 여러 컴포넌트 등록
  for (let i = 1; i <= 5; i++) {
    const component = new ExampleComponent(`monitor-${i}`)
    componentManager.register(`monitor-${i}`, component, {
      name: `Monitor Component ${i}`,
      autoInitialize: i % 2 === 0, // 짝수만 자동 초기화
    })
  }

  // 시스템 상태 확인
  const status = componentManager.getSystemStatus()
  console.log('시스템 상태:', status)

  // 모든 등록 정보 확인
  const allInfo = componentManager.getAllRegistrationInfo()
  console.log('모든 등록 정보:', allInfo)
}

/**
 * 에러 처리 예제
 */
export function errorHandlingExample(): void {
  console.log('=== 에러 처리 예제 ===')

  // 에러가 발생하는 컴포넌트
  const errorComponent = {
    async init(): Promise<void> {
      throw new Error('초기화 중 의도적인 에러 발생')
    },
    destroy(): void {
      console.log('에러 컴포넌트 정리')
    },
  }

  // 에러 바운더리와 함께 등록
  componentManager.register('error-example', errorComponent, {
    name: 'Error Example Component',
    errorBoundary: exampleErrorBoundary,
  })

  // 초기화 시도 (에러 발생)
  componentManager.initialize('error-example')
}

/**
 * 컴포넌트 검색 기능 예제
 */
export function searchFunctionalityExample(): void {
  console.log('=== 컴포넌트 검색 기능 예제 ===')

  // 여러 컴포넌트 등록
  const components = [
    { id: 'search-1', name: 'Search Component 1', version: '1.0.0' },
    { id: 'search-2', name: 'Search Component 2', version: '1.1.0' },
    { id: 'search-3', name: 'Another Component', version: '2.0.0' },
    { id: 'search-4', name: 'Test Component', version: '1.0.0' },
    { id: 'search-5', name: 'Final Component', version: '1.2.0' },
  ]

  components.forEach(({ id, name, version }) => {
    const component = new ExampleComponent(id)
    componentManager.register(id, component, {
      name,
      version,
      dependencies: id === 'search-2' ? ['search-1'] : [],
    })
  })

  // 1. 기본 검색
  console.log(
    '1. 모든 컴포넌트:',
    componentManager.getAll().map((c) => c.id),
  )

  // 2. 이름으로 검색
  const searchResults = componentManager.findByName('Search')
  console.log(
    '2. "Search"가 포함된 컴포넌트:',
    searchResults.map((c) => c.id),
  )

  // 3. 정규식 검색
  const patternResults = componentManager.findByPattern(/Component \d/)
  console.log(
    '3. 정규식 검색 결과:',
    patternResults.map((c) => c.id),
  )

  // 4. 고급 검색 (필터링 + 정렬)
  const advancedResults = componentManager.search({
    name: 'Component',
    sortBy: 'name',
    sortOrder: 'asc',
    limit: 3,
  })
  console.log(
    '4. 고급 검색 결과:',
    advancedResults.map((c) => c.metadata.name),
  )

  // 5. 상태별 검색
  const activeComponents = componentManager.getActiveComponents()
  console.log(
    '5. 활성 컴포넌트:',
    activeComponents.map((c) => c.id),
  )

  // 6. 의존성이 있는 컴포넌트 검색
  const dependentComponents = componentManager.getComponentsWithDependency('search-1')
  console.log(
    '6. search-1에 의존하는 컴포넌트:',
    dependentComponents.map((c) => c.id),
  )

  // 7. 통계 정보
  const stats = componentManager.getStateStatistics()
  console.log('7. 상태 통계:', stats)

  // 8. 의존성 그래프
  const graph = componentManager.getDependencyGraph()
  console.log('8. 의존성 그래프:', graph)

  // 9. 순환 의존성 검사
  const hasCircular = componentManager.hasCircularDependencies()
  console.log('9. 순환 의존성 존재:', hasCircular)

  // 10. 초기화 순서
  const initOrder = componentManager.getInitializationOrder()
  console.log('10. 초기화 순서:', initOrder)

  // 11. 컴포넌트 개수
  const totalCount = componentManager.count()
  const searchCount = componentManager.count({ name: 'Search' })
  console.log('11. 컴포넌트 개수 - 전체:', totalCount, '검색 관련:', searchCount)

  // 12. 메타데이터만 조회
  const allMetadata = componentManager.getAllMetadata()
  console.log(
    '12. 모든 메타데이터:',
    allMetadata.map((m) => ({ id: m.id, name: m.name, version: m.version })),
  )
}

/**
 * 페이지네이션 예제
 */
export function paginationExample(): void {
  console.log('=== 페이지네이션 예제 ===')

  // 10개의 컴포넌트 등록
  for (let i = 1; i <= 10; i++) {
    const component = new ExampleComponent(`page-${i}`)
    componentManager.register(`page-${i}`, component, {
      name: `Page Component ${i}`,
      version: '1.0.0',
    })
  }

  // 페이지 1 (처음 3개)
  const page1 = componentManager.search({
    name: 'Page Component',
    limit: 3,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc',
  })
  console.log(
    '페이지 1:',
    page1.map((c) => c.id),
  )

  // 페이지 2 (다음 3개)
  const page2 = componentManager.search({
    name: 'Page Component',
    limit: 3,
    offset: 3,
    sortBy: 'name',
    sortOrder: 'asc',
  })
  console.log(
    '페이지 2:',
    page2.map((c) => c.id),
  )

  // 페이지 3 (나머지)
  const page3 = componentManager.search({
    name: 'Page Component',
    limit: 3,
    offset: 6,
    sortBy: 'name',
    sortOrder: 'asc',
  })
  console.log(
    '페이지 3:',
    page3.map((c) => c.id),
  )
}

/**
 * 날짜 범위 검색 예제
 */
export function dateRangeSearchExample(): void {
  console.log('=== 날짜 범위 검색 예제 ===')

  // 현재 시간 기준으로 컴포넌트 등록
  const now = new Date()

  // 1시간 전
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // 30분 전
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

  // 컴포넌트 등록 (시간 간격을 두고)
  setTimeout(() => {
    const component1 = new ExampleComponent('date-1')
    componentManager.register('date-1', component1, { name: 'Date Component 1' })
  }, 1000)

  setTimeout(() => {
    const component2 = new ExampleComponent('date-2')
    componentManager.register('date-2', component2, { name: 'Date Component 2' })
  }, 2000)

  setTimeout(() => {
    const component3 = new ExampleComponent('date-3')
    componentManager.register('date-3', component3, { name: 'Date Component 3' })
  }, 3000)

  // 2초 후에 날짜 범위 검색 실행
  setTimeout(() => {
    // 최근 1분 내에 생성된 컴포넌트
    const recentComponents = componentManager.search({
      createdAfter: new Date(Date.now() - 60 * 1000),
    })
    console.log(
      '최근 1분 내 생성된 컴포넌트:',
      recentComponents.map((c) => c.id),
    )

    // 특정 시간 범위 내 컴포넌트
    const rangeComponents = componentManager.search({
      createdAfter: new Date(Date.now() - 5000),
      createdBefore: new Date(Date.now() - 1000),
    })
    console.log(
      '특정 시간 범위 내 컴포넌트:',
      rangeComponents.map((c) => c.id),
    )
  }, 4000)
}

/**
 * 전체 예제 실행
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 ComponentManager 예제 시작')

  try {
    basicRegistrationExample()
    dependencyRegistrationExample()
    bulkRegistrationExample()
    eventListenerExample()
    systemMonitoringExample()
    await stateManagementExample()
    errorHandlingExample()
    searchFunctionalityExample()
    paginationExample()
    dateRangeSearchExample()
    removalFunctionalityExample()
    dependencyBasedRemovalExample()
    removalValidationExample()
    updateFunctionalityExample()
    rollbackFunctionalityExample()
    updateHistoryExample()
    updateErrorHandlingExample()

    console.log('✅ 모든 예제 완료')
  } catch (error) {
    console.error('❌ 예제 실행 중 오류:', error)
  }
}

/**
 * 컴포넌트 제거 기능 예제
 */
export function removalFunctionalityExample(): void {
  console.log('=== 컴포넌트 제거 기능 예제 ===')

  // 여러 컴포넌트 등록 (의존성 포함)
  const components = [
    { id: 'remove-1', name: 'Remove Component 1', dependencies: [] },
    { id: 'remove-2', name: 'Remove Component 2', dependencies: ['remove-1'] },
    { id: 'remove-3', name: 'Remove Component 3', dependencies: ['remove-2'] },
    { id: 'remove-4', name: 'Remove Component 4', dependencies: [] },
    { id: 'remove-5', name: 'Remove Component 5', dependencies: ['remove-4'] },
  ]

  components.forEach(({ id, name, dependencies }) => {
    const component = new ExampleComponent(id)
    componentManager.register(id, component, {
      name,
      dependencies,
    })
  })

  // 1. 제거 전 검증
  console.log('1. 제거 전 검증:')
  const validation = componentManager.validateRemoval('remove-1')
  console.log('remove-1 제거 가능:', validation.canRemove)
  console.log('이유:', validation.reason)
  console.log('의존성:', validation.dependents)
  console.log('경고:', validation.warnings)

  // 2. 안전한 제거 (의존성 무시)
  console.log('2. 안전한 제거:')
  const safeRemoveResult = componentManager.removeSafe('remove-1', true)
  console.log('remove-1 안전 제거 결과:', safeRemoveResult)

  // 3. 벌크 제거
  console.log('3. 벌크 제거:')
  const bulkRemoveResult = componentManager.removeBulk(['remove-4', 'remove-5'], {
    ignoreDependencies: true,
  })
  console.log('벌크 제거 결과:', bulkRemoveResult)

  // 4. 조건부 제거
  console.log('4. 조건부 제거:')
  const conditionalRemoveResult = componentManager.removeByCondition(
    (instance) => instance.metadata.name.includes('Remove'),
    { ignoreDependencies: true },
  )
  console.log('조건부 제거 결과:', conditionalRemoveResult)

  // 5. 상태별 제거
  console.log('5. 상태별 제거:')
  // 먼저 몇 개 컴포넌트를 다시 등록
  for (let i = 1; i <= 3; i++) {
    const component = new ExampleComponent(`state-remove-${i}`)
    componentManager.register(`state-remove-${i}`, component, {
      name: `State Remove Component ${i}`,
    })
  }

  const stateRemoveResult = componentManager.removeByState(ComponentState.UNINITIALIZED)
  console.log('상태별 제거 결과:', stateRemoveResult)

  // 6. 에러 컴포넌트 제거
  console.log('6. 에러 컴포넌트 제거:')
  // 에러가 있는 컴포넌트 등록
  const errorComponent = {
    async init(): Promise<void> {
      throw new Error('의도적인 에러')
    },
    destroy(): void {
      console.log('에러 컴포넌트 정리')
    },
  }

  componentManager.register('error-remove', errorComponent, {
    name: 'Error Remove Component',
  })

  // 초기화 시도 (에러 발생)
  componentManager.initialize('error-remove')

  // 에러 컴포넌트 제거
  const errorRemoveResult = componentManager.removeErrorComponents()
  console.log('에러 컴포넌트 제거 결과:', errorRemoveResult)

  // 7. 사용하지 않는 컴포넌트 제거
  console.log('7. 사용하지 않는 컴포넌트 제거:')
  // 독립적인 컴포넌트들 등록
  for (let i = 1; i <= 3; i++) {
    const component = new ExampleComponent(`unused-${i}`)
    componentManager.register(`unused-${i}`, component, {
      name: `Unused Component ${i}`,
    })
  }

  const unusedRemoveResult = componentManager.removeUnusedComponents()
  console.log('사용하지 않는 컴포넌트 제거 결과:', unusedRemoveResult)

  // 8. 제거 통계
  console.log('8. 제거 통계:')
  const removalStats = componentManager.getRemovalStatistics()
  console.log('제거 통계:', removalStats)
}

/**
 * 의존성 기반 제거 예제
 */
export function dependencyBasedRemovalExample(): void {
  console.log('=== 의존성 기반 제거 예제 ===')

  // 복잡한 의존성 구조 생성
  const dependencyComponents = [
    { id: 'dep-a', dependencies: [] },
    { id: 'dep-b', dependencies: ['dep-a'] },
    { id: 'dep-c', dependencies: ['dep-a', 'dep-b'] },
    { id: 'dep-d', dependencies: ['dep-c'] },
    { id: 'dep-e', dependencies: ['dep-b'] },
    { id: 'dep-f', dependencies: ['dep-d', 'dep-e'] },
  ]

  dependencyComponents.forEach(({ id, dependencies }) => {
    const component = new ExampleComponent(id)
    componentManager.register(id, component, {
      name: `Dependency Component ${id.toUpperCase()}`,
      dependencies,
    })
  })

  console.log('의존성 그래프:', componentManager.getDependencyGraph())

  // 1. 의존성 순서대로 제거
  console.log('1. 의존성 순서대로 제거:')
  const orderedRemoveResult = componentManager.removeBulk(['dep-a', 'dep-c'], {
    removeDependents: true,
  })
  console.log('순서대로 제거 결과:', orderedRemoveResult)

  // 2. 의존성 무시하고 제거
  console.log('2. 의존성 무시하고 제거:')
  const ignoreDepsResult = componentManager.removeBulk(['dep-b', 'dep-e'], {
    ignoreDependencies: true,
  })
  console.log('의존성 무시 제거 결과:', ignoreDepsResult)

  // 3. 모든 컴포넌트 제거
  console.log('3. 모든 컴포넌트 제거:')
  const allRemoveResult = componentManager.removeAll({
    ignoreDependencies: true,
  })
  console.log('모든 컴포넌트 제거 결과:', allRemoveResult)
}

/**
 * 제거 전 검증 예제
 */
export function removalValidationExample(): void {
  console.log('=== 제거 전 검증 예제 ===')

  // 다양한 상태의 컴포넌트들 등록
  const validationComponents = [
    { id: 'validate-1', name: 'Validation Component 1', hasErrors: false },
    { id: 'validate-2', name: 'Validation Component 2', hasErrors: true },
    { id: 'validate-3', name: 'Validation Component 3', hasErrors: false },
  ]

  validationComponents.forEach(({ id, name, hasErrors }) => {
    const component = new ExampleComponent(id)
    if (hasErrors) {
      // 에러가 있는 컴포넌트로 만들기
      component['init'] = async () => {
        throw new Error('검증용 에러')
      }
    }

    componentManager.register(id, component, {
      name,
      dependencies: id === 'validate-3' ? ['validate-1'] : [],
    })
  })

  // 에러 컴포넌트 초기화 시도
  componentManager.initialize('validate-2')

  // 각 컴포넌트의 제거 가능성 검증
  validationComponents.forEach(({ id }) => {
    console.log(`\n${id} 제거 검증:`)
    const validation = componentManager.validateRemoval(id)
    console.log('- 제거 가능:', validation.canRemove)
    console.log('- 이유:', validation.reason)
    console.log('- 의존성:', validation.dependents)
    console.log('- 경고:', validation.warnings)
  })

  // 검증 후 안전한 제거
  console.log('\n검증 후 안전한 제거:')
  validationComponents.forEach(({ id }) => {
    const validation = componentManager.validateRemoval(id)
    if (validation.canRemove) {
      const result = componentManager.remove(id)
      console.log(`${id} 제거 결과:`, result)
    } else {
      console.log(`${id} 제거 불가:`, validation.reason)
    }
  })
}

/**
 * 컴포넌트 업데이트 기능 예제
 */
export function updateFunctionalityExample(): void {
  console.log('=== 컴포넌트 업데이트 기능 예제 ===')

  // 여러 컴포넌트 등록
  const components = [
    { id: 'update-1', name: 'Update Component 1' },
    { id: 'update-2', name: 'Update Component 2' },
    { id: 'update-3', name: 'Update Component 3' },
    { id: 'update-4', name: 'Update Component 4' },
    { id: 'update-5', name: 'Update Component 5' },
  ]

  components.forEach(({ id, name }) => {
    const component = new ExampleComponent(id)
    componentManager.register(id, component, { name })
  })

  // 1. 기본 업데이트
  console.log('1. 기본 업데이트:')
  const basicUpdateResult = componentManager.update('update-1', { force: true })
  console.log('update-1 업데이트 결과:', basicUpdateResult)

  // 2. 업데이트 전 검증
  console.log('2. 업데이트 전 검증:')
  const validation = componentManager.validateUpdate('update-2', { validateDependencies: true })
  console.log('update-2 업데이트 가능:', validation.canUpdate)
  console.log('이유:', validation.reason)
  console.log('경고:', validation.warnings)
  console.log('의존성:', validation.dependencies)

  // 3. 벌크 업데이트 (순차)
  console.log('3. 벌크 업데이트 (순차):')
  const bulkUpdateResult = componentManager.updateBulk(['update-2', 'update-3'], {
    force: true,
    retryFailed: true,
    maxRetries: 2,
  })
  console.log('벌크 업데이트 결과:', bulkUpdateResult)

  // 4. 벌크 업데이트 (병렬)
  console.log('4. 벌크 업데이트 (병렬):')
  const parallelUpdateResult = componentManager.updateBulk(['update-4', 'update-5'], {
    parallel: true,
    force: true,
  })
  console.log('병렬 업데이트 결과:', parallelUpdateResult)

  // 5. 조건부 업데이트
  console.log('5. 조건부 업데이트:')
  const conditionalUpdateResult = componentManager.updateByCondition(
    (instance) => instance.metadata.name.includes('Update'),
    { force: true },
  )
  console.log('조건부 업데이트 결과:', conditionalUpdateResult)

  // 6. 상태별 업데이트
  console.log('6. 상태별 업데이트:')
  const stateUpdateResult = componentManager.updateByState(ComponentState.ACTIVE, {
    force: true,
  })
  console.log('상태별 업데이트 결과:', stateUpdateResult)

  // 7. 활성 컴포넌트 업데이트
  console.log('7. 활성 컴포넌트 업데이트:')
  const activeUpdateResult = componentManager.updateActiveComponents({
    force: true,
    parallel: true,
  })
  console.log('활성 컴포넌트 업데이트 결과:', activeUpdateResult)
}

/**
 * 롤백 기능 예제
 */
export function rollbackFunctionalityExample(): void {
  console.log('=== 롤백 기능 예제 ===')

  // 롤백 테스트용 컴포넌트 등록
  const rollbackComponent = new ExampleComponent('rollback-test')
  componentManager.register('rollback-test', rollbackComponent, {
    name: 'Rollback Test Component',
  })

  // 초기화
  componentManager.initialize('rollback-test')

  // 1. 현재 상태 확인
  console.log('1. 현재 상태:', componentManager.getComponentState('rollback-test'))

  // 2. 일시 중단
  componentManager.suspend('rollback-test')
  console.log('2. 일시 중단 후 상태:', componentManager.getComponentState('rollback-test'))

  // 3. 롤백 (ACTIVE 상태로 복원)
  const rollbackResult = componentManager.rollback('rollback-test', ComponentState.ACTIVE)
  console.log('3. 롤백 결과:', rollbackResult)
  console.log('롤백 후 상태:', componentManager.getComponentState('rollback-test'))

  // 4. 에러 상태로 변경 후 롤백
  const errorComponent = {
    async init(): Promise<void> {
      throw new Error('롤백 테스트용 에러')
    },
    destroy(): void {
      console.log('에러 컴포넌트 정리')
    },
  }

  componentManager.register('rollback-error', errorComponent, {
    name: 'Rollback Error Component',
  })

  componentManager.initialize('rollback-error')
  console.log('4. 에러 상태:', componentManager.getComponentState('rollback-error'))

  const errorRollbackResult = componentManager.rollback(
    'rollback-error',
    ComponentState.UNINITIALIZED,
  )
  console.log('5. 에러 상태 롤백 결과:', errorRollbackResult)
  console.log('에러 롤백 후 상태:', componentManager.getComponentState('rollback-error'))
}

/**
 * 업데이트 히스토리 예제
 */
export function updateHistoryExample(): void {
  console.log('=== 업데이트 히스토리 예제 ===')

  // 히스토리 테스트용 컴포넌트 등록
  const historyComponent = new ExampleComponent('history-test')
  componentManager.register('history-test', historyComponent, {
    name: 'History Test Component',
  })

  // 여러 번 업데이트 실행
  const updatePromises = []
  for (let i = 1; i <= 5; i++) {
    updatePromises.push(
      componentManager.update('history-test', {
        force: true,
        preserveState: i % 2 === 0,
      }),
    )
  }

  // 모든 업데이트 완료 후 히스토리 확인
  Promise.all(updatePromises).then(() => {
    console.log('1. 전체 업데이트 히스토리:')
    const allHistory = componentManager.getUpdateHistory()
    console.log('전체 히스토리 개수:', allHistory.length)
    console.log('최근 3개 히스토리:', allHistory.slice(-3))

    console.log('2. 특정 컴포넌트 히스토리:')
    const componentHistory = componentManager.getUpdateHistory('history-test', 10)
    console.log(
      '컴포넌트 히스토리:',
      componentHistory.map((h) => ({
        timestamp: h.timestamp.toISOString(),
        success: h.success,
        options: h.options,
      })),
    )

    console.log('3. 업데이트 통계:')
    const updateStats = componentManager.getUpdateStatistics()
    console.log('업데이트 통계:', updateStats)

    console.log('4. 업데이트 성능:')
    const performance = componentManager.getUpdatePerformance('history-test')
    console.log('성능 통계:', performance)
  })
}

/**
 * 업데이트 에러 처리 예제
 */
export function updateErrorHandlingExample(): void {
  console.log('=== 업데이트 에러 처리 예제 ===')

  // 에러가 발생하는 컴포넌트 등록
  const errorUpdateComponent = {
    async init(): Promise<void> {
      console.log('에러 업데이트 컴포넌트 초기화')
    },
    async update(options: any): Promise<void> {
      if (options.force) {
        throw new Error('강제 업데이트 중 의도적인 에러 발생')
      }
      console.log('에러 업데이트 컴포넌트 업데이트')
    },
    destroy(): void {
      console.log('에러 업데이트 컴포넌트 정리')
    },
  }

  componentManager.register('error-update', errorUpdateComponent, {
    name: 'Error Update Component',
  })

  componentManager.initialize('error-update')

  // 1. 에러가 발생하는 업데이트
  console.log('1. 에러가 발생하는 업데이트:')
  const errorUpdateResult = componentManager.update('error-update', { force: true })
  console.log('에러 업데이트 결과:', errorUpdateResult)

  // 2. 재시도 옵션을 사용한 벌크 업데이트
  console.log('2. 재시도 옵션을 사용한 벌크 업데이트:')
  const retryUpdateResult = componentManager.updateBulk(['error-update'], {
    retryFailed: true,
    maxRetries: 3,
    force: true,
  })
  console.log('재시도 업데이트 결과:', retryUpdateResult)

  // 3. 에러 상태에서 업데이트 시도
  console.log('3. 에러 상태에서 업데이트 시도:')
  const errorStateValidation = componentManager.validateUpdate('error-update', {
    validateDependencies: true,
  })
  console.log('에러 상태 업데이트 검증:', errorStateValidation)

  // 4. 에러 복구 후 업데이트
  console.log('4. 에러 복구 후 업데이트:')
  const recoveryResult = componentManager.rollback('error-update', ComponentState.ACTIVE)
  console.log('복구 결과:', recoveryResult)

  const recoveryUpdateResult = componentManager.update('error-update', { force: false })
  console.log('복구 후 업데이트 결과:', recoveryUpdateResult)
}

// 개발 환경에서 자동 실행 (선택적)
if (process.env.NODE_ENV === 'development') {
  // runAllExamples()
}
