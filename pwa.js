(function () {
    const VARIANT_KEY = '13cards_variant';

    function loadVariantPreference() {
        const saved = localStorage.getItem(VARIANT_KEY);
        if (!saved) return;
        const input = document.querySelector(`input[name=variant][value="${saved}"]`);
        if (input) input.checked = true;
    }

    function saveVariantPreference() {
        const input = document.querySelector('input[name=variant]:checked');
        if (input) localStorage.setItem(VARIANT_KEY, input.value);
    }

    function bindVariantPersistence() {
        document.querySelectorAll('input[name=variant]').forEach((input) => {
            input.addEventListener('change', saveVariantPreference);
        });
    }

    function initVariantPersistence() {
        loadVariantPreference();
        bindVariantPersistence();
    }

    function initOfflineBadge() {
        const nav = document.querySelector('.top-nav');
        if (!nav) return;

        const badge = document.createElement('span');
        badge.className = 'pwa-offline-badge';
        badge.id = 'pwa-offline-badge';
        badge.textContent = navigator.onLine ? '' : 'Offline';
        badge.hidden = navigator.onLine;
        badge.setAttribute('aria-live', 'polite');
        if (!navigator.onLine) badge.classList.add('is-offline');
        nav.appendChild(badge);

        window.addEventListener('offline', () => {
            badge.hidden = false;
            badge.textContent = 'Offline';
            badge.classList.add('is-offline');
        });
        window.addEventListener('online', () => {
            badge.hidden = true;
            badge.textContent = '';
            badge.classList.remove('is-offline');
        });
    }

    function initInstallPrompt() {
        const nav = document.querySelector('.top-nav');
        if (!nav) return;

        let deferredPrompt = null;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pwa-install-btn';
        btn.textContent = 'Install app';
        btn.hidden = true;
        nav.appendChild(btn);

        window.addEventListener('beforeinstallprompt', (event) => {
            event.preventDefault();
            deferredPrompt = event;
            btn.hidden = false;
        });

        btn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            btn.hidden = true;
        });

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            btn.hidden = true;
        });
    }

    function showUpdateBar(worker) {
        if (document.getElementById('pwa-update-bar')) return;

        const bar = document.createElement('div');
        bar.id = 'pwa-update-bar';
        bar.className = 'pwa-update-bar';
        bar.innerHTML = '<span>New version ready</span>';
        const refresh = document.createElement('button');
        refresh.type = 'button';
        refresh.textContent = 'Refresh';
        refresh.addEventListener('click', () => {
            worker.postMessage({ type: 'SKIP_WAITING' });
        });
        bar.appendChild(refresh);
        document.body.appendChild(bar);
    }

    function initServiceWorker() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.register('./sw.js').then((registration) => {
            if (registration.waiting && navigator.serviceWorker.controller) {
                showUpdateBar(registration.waiting);
            }

            registration.addEventListener('updatefound', () => {
                const worker = registration.installing;
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBar(registration.waiting || worker);
                    }
                });
            });
        }).catch(() => { /* unsupported or blocked */ });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    function boot() {
        initVariantPersistence();
        initOfflineBadge();
        initInstallPrompt();
        window.addEventListener('load', initServiceWorker);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    window.PWA = { loadVariantPreference, saveVariantPreference, initVariantPersistence };
})();
