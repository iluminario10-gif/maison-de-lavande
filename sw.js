// Maison de Lavande — service worker.
// Mantém o app disponível sem internet. Ao publicar uma versão nova, troque VERSAO
// para que os aparelhos baixem os arquivos atualizados.
const VERSAO = 'mdl-1.0.0';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const mesmaOrigem = new URL(req.url).origin === self.location.origin;

  if (mesmaOrigem) {
    // Rede primeiro: a versão nova aparece na próxima abertura. Sem rede, usa a cópia salva.
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) caches.open(VERSAO).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
  } else {
    // Fontes e outros arquivos externos: cache primeiro, para abrir rápido.
    e.respondWith(
      caches.match(req).then((c) => c || fetch(req).then((res) => {
        caches.open(VERSAO).then((k) => k.put(req, res.clone()));
        return res;
      }))
    );
  }
});
