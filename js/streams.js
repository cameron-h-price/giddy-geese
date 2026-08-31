function buildStreamCard(stream, platformLookup) {
  const card = document.createElement('article');
  card.className = 'feature-card';

  const title = document.createElement('h3');
  title.textContent = stream.title;
  card.appendChild(title);

  const meta = document.createElement('p');
  meta.textContent = `Every ${stream.day} · ${stream.time}`;
  card.appendChild(meta);

  const platform = platformLookup.get(stream.platform);
  if (platform) {
    card.appendChild(buildPlatformLink(platform));
  }

  return card;
}

function buildPlatformLink(platform) {
  const link = document.createElement('a');
  link.className = 'calendar-btn';
  link.href = platform.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const i = document.createElement('i');
  i.className = platform.icon;
  link.appendChild(i);
  link.appendChild(document.createTextNode(` ${platform.label}`));
  return link;
}

function showMessage(container, text, isError = false) {
  const p = document.createElement('p');
  p.className = isError ? 'grid-message error' : 'grid-message';
  p.textContent = text;
  container.appendChild(p);
}

async function init() {
  const grid = document.getElementById('stream-grid');
  const platformsEl = document.getElementById('platform-links');

  let data;
  try {
    const res = await fetch('data/streams.json');
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch {
    // fetch() is blocked when opening this page directly as a file:// URL —
    // see README.md for the local-server workaround.
    showMessage(
      grid,
      'Could not load stream schedule. Open this page via a local server rather than directly as a file.',
      true,
    );
    return;
  }

  const platforms = data.platforms ?? [];
  for (const platform of platforms) {
    platformsEl.appendChild(buildPlatformLink(platform));
  }
  const platformLookup = new Map(platforms.map(p => [p.label, p]));

  const streams = data.streams ?? [];
  if (streams.length === 0) {
    showMessage(grid, 'No streams scheduled right now.');
    return;
  }

  for (const stream of streams) {
    grid.appendChild(buildStreamCard(stream, platformLookup));
  }
}

init();
