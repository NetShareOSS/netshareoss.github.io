(() => {
    const DATA_URL = 'changelog.md';
    const TYPES = {
        new: 'feature',
        improved: 'improvement',
        fixed: 'fix'
    };
    const LABELS = {
        feature: 'New',
        improvement: 'Improved',
        fix: 'Fixed'
    };

    const parseChange = (line) => {
        const [, label, text] = line.match(/^-\s+(\w+):\s+(.*)$/) || [];
        const type = TYPES[(label || '').toLowerCase()];
        return type ? { type, text } : { type: 'improvement', text: line.replace(/^-\s+/, '') };
    };

    const parseRelease = (block) => {
        const [heading, ...lines] = block.split(/\r?\n/);
        const [, version, date] = heading.match(/^(\S+?)(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/) || [];
        const body = lines.map((line) => line.trim()).filter(Boolean);
        return {
            version,
            date,
            highlights: body.filter((line) => !line.startsWith('- ')).join(' '),
            changes: body.filter((line) => line.startsWith('- ')).map(parseChange)
        };
    };

    const parseChangelog = (markdown) => ({
        releases: markdown
            .split(/^## /m)
            .slice(1)
            .map(parseRelease)
            .filter((release) => release.version)
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('embed') === '1') document.documentElement.classList.add('embed');
    if (params.get('theme') === 'dark') document.documentElement.classList.add('theme-dark');

    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    };

    const formatDate = (iso) => {
        if (!iso) return '';
        return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderChange = ({ type, text }) => {
        const item = el('li', 'changelog-change');
        item.append(el('span', `changelog-tag tag-${type}`, LABELS[type]), el('span', '', text));
        return item;
    };

    const renderRelease = (release, isLatest) => {
        const card = el('article', 'changelog-release');
        card.id = `v${release.version}`;

        const header = el('div', 'changelog-release-header');
        header.append(el('h2', '', `v${release.version}`));
        if (isLatest) header.append(el('span', 'technology-status', 'Latest'));
        if (release.date) header.append(el('time', 'changelog-date', formatDate(release.date)));
        card.append(header);

        if (release.highlights) card.append(el('p', 'changelog-highlights', release.highlights));

        const list = el('ul', 'changelog-changes');
        release.changes.forEach((change) => list.append(renderChange(change)));
        card.append(list);
        return card;
    };

    const render = ({ releases }) => {
        const container = document.getElementById('changelog-list');
        container.replaceChildren(...releases.map((release, index) => renderRelease(release, index === 0)));

        if (window.location.hash) {
            document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
        }
    };

    fetch(DATA_URL)
        .then((response) => (response.ok ? response.text() : Promise.reject(response.status)))
        .then((markdown) => render(parseChangelog(markdown)))
        .catch(() => {
            document.getElementById('changelog-list').replaceChildren(
                el('p', 'changelog-status', 'Could not load the changelog. Please try again later.')
            );
        });
})();
