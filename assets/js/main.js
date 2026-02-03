document.addEventListener('DOMContentLoaded', () => {
    const updateLinks = (platform, url) => {
        const elements = document.querySelectorAll(`.link-${platform}`);
        elements.forEach(el => {
            el.href = url;
        });
    };

    if (typeof DOWNLOAD_URLS !== 'undefined') {
        updateLinks('android', DOWNLOAD_URLS.android);
        updateLinks('ios', DOWNLOAD_URLS.ios);
        updateLinks('macos', DOWNLOAD_URLS.macos);
        // Universal download link
        updateLinks('download', DOWNLOAD_URLS.android);
    }
});
