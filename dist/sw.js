// Service Worker for caching and performance optimization
const CACHE_NAME = 'lawide-cache-v1'
const STATIC_CACHE_NAME = 'lawide-static-v1'
const DYNAMIC_CACHE_NAME = 'lawide-dynamic-v1'

// 정적 자산 캐시할 파일들
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico'
]

// 설치 시 정적 자산 캐시
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets')
                return cache.addAll(STATIC_ASSETS)
            })
    )
})

// 활성화 시 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // API 요청은 네트워크 우선 전략
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // 성공한 API 응답을 동적 캐시에 저장
                    if (response.status === 200) {
                        const responseClone = response.clone()
                        caches.open(DYNAMIC_CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseClone)
                            })
                    }
                    return response
                })
                .catch(() => {
                    // 네트워크 실패 시 캐시된 응답 반환
                    return caches.match(request)
                })
        )
        return
    }

    // 정적 자산은 캐시 우선 전략
    if (request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image') {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response
                    }
                    return fetch(request)
                        .then((response) => {
                            if (response.status === 200) {
                                const responseClone = response.clone()
                                caches.open(STATIC_CACHE_NAME)
                                    .then((cache) => {
                                        cache.put(request, responseClone)
                                    })
                            }
                            return response
                        })
                })
        )
        return
    }

    // 기타 요청은 네트워크 우선 전략
    event.respondWith(
        fetch(request)
            .catch(() => {
                return caches.match(request)
            })
    )
})

// 백그라운드 동기화 (선택적)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // 백그라운드 동기화 작업 수행
            console.log('Background sync triggered')
        )
    }
})

// 푸시 알림 처리 (선택적)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    }

    event.waitUntil(
        self.registration.showNotification('Lawide', options)
    )
}) 