// Service Worker básico para permitir a instalação do PWA (Critério do Chrome)
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Estratégia simples de Network First, caindo para cache se offline (se implementado cache)
  // Para este estágio, apenas permitimos que o fetch passe para que o site funcione
  e.respondWith(
    fetch(e.request).catch(() => {
      // Fallback básico se necessário
      return new Response("Você está offline.");
    })
  );
});