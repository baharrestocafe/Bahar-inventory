// Service Worker لتطبيق بهار - إدارة المخزون
// يخزن هيكل التطبيق (الواجهة) محلياً حتى يفتح بسرعة ويكون قابل للتثبيت،
// لكنه لا يخزن بيانات الـ API (Apps Script) أبداً - تلك دائماً تروح للشبكة مباشرة.

const CACHE_NAME = 'bahar-shell-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // لا تتدخل أبداً في طلبات الـ API (Google Apps Script) أو أي طلب غير GET
  // هذي البيانات الحية لازم تروح مباشرة للشبكة دائماً
  if (event.request.method !== 'GET' || url.hostname.includes('script.google.com')) {
    return;
  }

  // استراتيجية: جرب الشبكة أولاً، إذا فشلت (لا يوجد إنترنت) ارجع للنسخة المخزنة
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
