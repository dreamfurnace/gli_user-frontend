/**
 * 이벤트 핸들링 최적화 유틸리티
 */

// 디바운스 함수 타입
type DebounceFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

// 쓰로틀 함수 타입
type ThrottleFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void
  cancel: () => void
  flush: () => void
}

/**
 * 디바운스 함수 생성
 * 연속된 호출을 그룹화하여 마지막 호출만 실행
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {},
): DebounceFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let maxWait: number | undefined = options.maxWait
  let result: ReturnType<T>
  let lastCallTime: number | undefined
  let lastInvokeTime = 0
  let leading = !!options.leading
  let trailing = options.trailing !== false

  function invokeFunc(time: number) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args!)
    return result
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    return setTimeout(pendingFunc, wait)
  }

  function cancelTimer(id: ReturnType<typeof setTimeout>) {
    clearTimeout(id)
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time
    timeoutId = startTimer(timerExpired, wait)
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0)
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeoutId = startTimer(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number) {
    timeoutId = undefined

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = lastThis = undefined
    return result
  }

  function cancel() {
    if (timeoutId !== undefined) {
      cancelTimer(timeoutId)
    }
    lastInvokeTime = 0
    lastArgs = lastCallTime = lastThis = timeoutId = undefined
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now())
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait !== undefined) {
        timeoutId = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeoutId === undefined) {
      timeoutId = startTimer(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  return debounced
}

/**
 * 쓰로틀 함수 생성
 * 일정 시간 간격으로 함수 실행을 제한
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): ThrottleFunction<T> {
  let leading = true
  let trailing = true

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function')
  }
  if (options.leading !== undefined) {
    leading = !!options.leading
  }
  if (options.trailing !== undefined) {
    trailing = !!options.trailing
  }

  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait,
  })
}

/**
 * 이벤트 위임 핸들러 생성
 * 동적 요소에 대한 이벤트 처리를 최적화
 */
export function createEventDelegation<T extends Event>(
  selector: string,
  eventType: string,
  handler: (event: T, target: Element) => void,
  options: AddEventListenerOptions = {},
) {
  return function (event: T) {
    const target = event.target as Element
    const matchedElement = target.closest(selector)

    if (matchedElement) {
      handler(event, matchedElement)
    }
  }
}

/**
 * 이벤트 리스너 관리자
 * 메모리 누수 방지를 위한 이벤트 리스너 관리
 */
export class EventManager {
  private listeners: Map<
    string,
    Set<{ element: Element; handler: EventListener; options?: AddEventListenerOptions }>
  > = new Map()

  /**
   * 이벤트 리스너 추가
   */
  addEventListener(
    element: Element,
    eventType: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ) {
    const key = `${eventType}-${this.getElementId(element)}`

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    const listenerSet = this.listeners.get(key)!
    const listenerInfo = { element, handler, options }

    listenerSet.add(listenerInfo)
    element.addEventListener(eventType, handler, options)

    return () => this.removeEventListener(element, eventType, handler)
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(element: Element, eventType: string, handler: EventListener) {
    const key = `${eventType}-${this.getElementId(element)}`
    const listenerSet = this.listeners.get(key)

    if (listenerSet) {
      for (const listenerInfo of listenerSet) {
        if (listenerInfo.handler === handler) {
          element.removeEventListener(eventType, handler, listenerInfo.options)
          listenerSet.delete(listenerInfo)
          break
        }
      }

      if (listenerSet.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  /**
   * 특정 요소의 모든 이벤트 리스너 제거
   */
  removeAllListenersForElement(element: Element) {
    for (const [key, listenerSet] of this.listeners.entries()) {
      const elementId = this.getElementId(element)
      if (key.includes(elementId)) {
        for (const listenerInfo of listenerSet) {
          if (listenerInfo.element === element) {
            listenerInfo.element.removeEventListener(
              key.split('-')[0],
              listenerInfo.handler,
              listenerInfo.options,
            )
          }
        }
        listenerSet.clear()
        this.listeners.delete(key)
      }
    }
  }

  /**
   * 모든 이벤트 리스너 제거
   */
  removeAllListeners() {
    for (const [key, listenerSet] of this.listeners.entries()) {
      for (const listenerInfo of listenerSet) {
        listenerInfo.element.removeEventListener(
          key.split('-')[0],
          listenerInfo.handler,
          listenerInfo.options,
        )
      }
      listenerSet.clear()
    }
    this.listeners.clear()
  }

  /**
   * 요소 ID 생성
   */
  private getElementId(element: Element): string {
    if (!element.id) {
      element.id = `element-${Math.random().toString(36).substr(2, 9)}`
    }
    return element.id
  }

  /**
   * 현재 등록된 리스너 수 반환
   */
  getListenerCount(): number {
    let count = 0
    for (const listenerSet of this.listeners.values()) {
      count += listenerSet.size
    }
    return count
  }
}

/**
 * 터치 이벤트 최적화
 * 모바일 환경에서 터치 이벤트 성능 향상
 */
export class TouchEventOptimizer {
  private touchStartTime = 0
  private touchStartPosition = { x: 0, y: 0 }
  private readonly minSwipeDistance = 50
  private readonly maxSwipeTime = 300

  /**
   * 스와이프 제스처 감지
   */
  detectSwipe(
    touchStartEvent: TouchEvent,
    touchEndEvent: TouchEvent,
    onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  ) {
    const startTime = touchStartEvent.timeStamp
    const endTime = touchEndEvent.timeStamp
    const duration = endTime - startTime

    if (duration > this.maxSwipeTime) return

    const startTouch = touchStartEvent.touches[0]
    const endTouch = touchEndEvent.changedTouches[0]

    const deltaX = endTouch.clientX - startTouch.clientX
    const deltaY = endTouch.clientY - startTouch.clientY

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    if (distance < this.minSwipeDistance) return

    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI

    if (angle >= -45 && angle <= 45) {
      onSwipe('right')
    } else if (angle >= 45 && angle <= 135) {
      onSwipe('down')
    } else if (angle >= 135 || angle <= -135) {
      onSwipe('left')
    } else {
      onSwipe('up')
    }
  }

  /**
   * 더블 탭 감지
   */
  detectDoubleTap(touchEvent: TouchEvent, onDoubleTap: () => void, doubleTapDelay = 300) {
    const currentTime = touchEvent.timeStamp
    const timeDiff = currentTime - this.touchStartTime

    if (timeDiff < doubleTapDelay && timeDiff > 0) {
      onDoubleTap()
      this.touchStartTime = 0
    } else {
      this.touchStartTime = currentTime
    }
  }
}

/**
 * 키보드 이벤트 최적화
 * 키보드 입력 성능 향상
 */
export class KeyboardEventOptimizer {
  private keyStates = new Map<string, boolean>()
  private keyHandlers = new Map<string, Set<() => void>>()

  /**
   * 키 이벤트 핸들러 등록
   */
  onKey(key: string, handler: () => void) {
    if (!this.keyHandlers.has(key)) {
      this.keyHandlers.set(key, new Set())
    }
    this.keyHandlers.get(key)!.add(handler)
  }

  /**
   * 키 이벤트 핸들러 제거
   */
  offKey(key: string, handler: () => void) {
    const handlers = this.keyHandlers.get(key)
    if (handlers) {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.keyHandlers.delete(key)
      }
    }
  }

  /**
   * 키보드 이벤트 처리
   */
  handleKeyEvent(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    const isKeyDown = event.type === 'keydown'

    if (isKeyDown && !this.keyStates.get(key)) {
      this.keyStates.set(key, true)
      const handlers = this.keyHandlers.get(key)
      if (handlers) {
        handlers.forEach((handler) => handler())
      }
    } else if (!isKeyDown) {
      this.keyStates.set(key, false)
    }
  }

  /**
   * 모든 키 상태 초기화
   */
  resetKeyStates() {
    this.keyStates.clear()
  }
}

/**
 * 글로벌 이벤트 매니저 인스턴스
 */
export const globalEventManager = new EventManager()

/**
 * 글로벌 터치 이벤트 최적화 인스턴스
 */
export const globalTouchOptimizer = new TouchEventOptimizer()

/**
 * 글로벌 키보드 이벤트 최적화 인스턴스
 */
export const globalKeyboardOptimizer = new KeyboardEventOptimizer()

// 글로벌 이벤트 리스너 설정
if (typeof window !== 'undefined') {
  // 키보드 이벤트 리스너
  window.addEventListener('keydown', (event) => {
    globalKeyboardOptimizer.handleKeyEvent(event)
  })

  window.addEventListener('keyup', (event) => {
    globalKeyboardOptimizer.handleKeyEvent(event)
  })

  // 페이지 언로드 시 이벤트 리스너 정리
  window.addEventListener('beforeunload', () => {
    globalEventManager.removeAllListeners()
    globalKeyboardOptimizer.resetKeyStates()
  })
}
