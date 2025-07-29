// 성능 최적화 유틸리티 함수들

// 이미지 지연 로딩
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src
        observer.unobserve(img)
      }
    })
  })

  observer.observe(img)
}

// 컴포넌트 지연 로딩
export const lazyLoadComponent = (importFn: () => Promise<any>) => {
  return () => ({
    component: importFn(),
    loading: {
      template: '<div class="loading">로딩 중...</div>',
    },
    error: {
      template: '<div class="error">로딩 실패</div>',
    },
    delay: 200,
    timeout: 3000,
  })
}

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 쓰로틀 함수
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 메모이제이션 함수
export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

// 성능 측정
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} 실행 시간: ${end - start}ms`)
}

// 가상 스크롤링을 위한 아이템 계산
export const calculateVisibleItems = (
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number,
) => {
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, totalItems)

  return {
    startIndex,
    endIndex,
    visibleItems: Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i),
  }
}

// 리소스 프리로딩
export const preloadResource = (href: string, as: string = 'fetch') => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

// 캐시 관리
export const clearCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
  }
}

// 메모리 사용량 모니터링
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    }
  }
  return null
}

// 네트워크 상태 확인
export const getNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
    }
  }
  return null
}
