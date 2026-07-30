const DOWNLOAD_URLS = {
    android: "https://play.google.com/store/apps/details?id=com.app.netshare",
    ios: "https://apps.apple.com/vn/app/id6758239332",
    macos: "https://apps.apple.com/vn/app/id6758239332"
};

document.addEventListener('DOMContentLoaded', () => {
    const updateLinks = (platform, url) => {
        document.querySelectorAll(`.link-${platform}`).forEach((el) => {
            el.href = url;
        });
    };

    updateLinks('android', DOWNLOAD_URLS.android);
    updateLinks('ios', DOWNLOAD_URLS.ios);
    updateLinks('macos', DOWNLOAD_URLS.macos);
    updateLinks('download', DOWNLOAD_URLS.android);

    document.querySelectorAll('[data-youtube-id]').forEach((el) => {
        const loadPlayer = () => {
            const id = el.getAttribute('data-youtube-id');
            const title = el.getAttribute('data-youtube-title') || 'YouTube video';
            el.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1"
                title="${title}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        };

        el.addEventListener('click', loadPlayer, { once: true });
        el.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                loadPlayer();
            }
        });
    });
});

(() => {
    const GTM_ID = 'GTM-KMLT6MF7';
    let loaded = false;

    const loadAnalytics = () => {
        if (loaded) return;
        loaded = true;

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'gtm.start': Date.now(),
            event: 'gtm.js'
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
        document.head.appendChild(script);
    };

    const events = ['scroll', 'click', 'keydown', 'touchstart', 'pointerdown'];
    const onInteract = () => {
        events.forEach((name) => window.removeEventListener(name, onInteract));
        loadAnalytics();
    };

    events.forEach((name) => window.addEventListener(name, onInteract, { once: true, passive: true }));
    window.addEventListener('load', () => {
        setTimeout(loadAnalytics, 3500);
    });
})();
