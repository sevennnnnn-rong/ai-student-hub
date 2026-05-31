const CACHE_NAME = 'student-hub-v1'
const STATIC_ASSETS = [
  '/',
  '/tasks',
  '/schedule',
  '/notes',
  '/pomodoro',
  '/ai-chat',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 请求：网络优先，失败时用缓存
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        }
        return response
      })
    })
  )
})
