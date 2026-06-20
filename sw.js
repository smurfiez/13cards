const CACHE_VERSION = '5';
const CACHE_NAME = `13cards-${CACHE_VERSION}`;

const PRECACHE = [
    './',
    './index.html',
    './payouts.html',
    './random.html',
    './compare.html',
    './ofc.html',
    '/',
    '/random',
    '/payouts',
    '/compare',
    '/ofc',
    './cards.js',
    './config.js',
    './solver.js',
    './testcase.js',
    './haptic.js',
    './ui.js',
    './editor.js',
    './scoring.js',
    './app.css',
    './manifest.webmanifest',
    './pwa.js',
    './pwa.css',
    './icons/icon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

/** Map clean URLs (Cloudflare Pages) to cached .html assets */
const PATH_TO_HTML = {
    '/': './index.html',
    '/random': './random.html',
    '/payouts': './payouts.html',
    '/compare': './compare.html',
    '/ofc': './ofc.html'
};

async function lookupCache(request) {
    const hit = await caches.match(request);
    if (hit) return hit;

    const { pathname } = new URL(request.url);
    const htmlPath = PATH_TO_HTML[pathname];
    if (htmlPath) {
        const alias = await caches.match(htmlPath);
        if (alias) return alias;
    }
    if (pathname.endsWith('.html')) {
        const bare = pathname.replace(/\.html$/, '');
        const mapped = PATH_TO_HTML[bare];
        if (mapped) return caches.match(mapped);
    }
    return null;
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        lookupCache(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(async () => {
                    const fallback = await lookupCache(event.request);
                    if (fallback) return fallback;
                    return caches.match('./index.html');
                });
        })
    );
});
