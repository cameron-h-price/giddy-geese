/*
 * Supported social platforms and their Font Awesome icon classes.
 * Add new entries here to support additional platforms — no other file changes needed.
 */
const PLATFORMS = {
  soundcloud:      { label: 'SoundCloud',   icon: 'fa-brands fa-soundcloud' },
  instagram:       { label: 'Instagram',    icon: 'fa-brands fa-instagram' },
  mixcloud:        { label: 'Mixcloud',     icon: 'fa-brands fa-mixcloud' },
  spotify:         { label: 'Spotify',      icon: 'fa-brands fa-spotify' },
  youtube:         { label: 'YouTube',      icon: 'fa-brands fa-youtube' },
  bandcamp:        { label: 'Bandcamp',     icon: 'fa-brands fa-bandcamp' },
  facebook:        { label: 'Facebook',     icon: 'fa-brands fa-facebook' },
  twitter:         { label: 'Twitter / X',  icon: 'fa-brands fa-x-twitter' },
  tiktok:          { label: 'TikTok',       icon: 'fa-brands fa-tiktok' },
  twitch:          { label: 'Twitch',       icon: 'fa-brands fa-twitch' },
  kick:            { label: 'Kick',         icon: 'fa-solid fa-tower-broadcast' },
  website:         { label: 'Website',      icon: 'fa-solid fa-link' },
};

/*
 * Placeholder avatar — a generic silhouette, shown when no image is available.
 * Defined as a data URI so no extra file is needed.
 */
const PLACEHOLDER_AVATAR = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#2c2c2c"/>
    <circle cx="100" cy="80" r="36" fill="#444"/>
    <ellipse cx="100" cy="168" rx="52" ry="44" fill="#444"/>
  </svg>`
)}`;

function resolveImage(member) {
  return member.image?.trim() || PLACEHOLDER_AVATAR;
}

function buildCard(member) {
  const card = document.createElement('article');
  card.className = 'dj-card';

  // Avatar
  const img = document.createElement('img');
  img.className = 'dj-avatar';
  img.alt       = member.name;
  img.src       = resolveImage(member);
  img.onerror   = () => { img.src = PLACEHOLDER_AVATAR; };
  card.appendChild(img);

  // Name
  const nameEl = document.createElement('h2');
  nameEl.className   = 'dj-name';
  nameEl.textContent = member.name;
  card.appendChild(nameEl);

  // Social links
  const activeSocials = Object.entries(member.socials ?? {})
    .filter(([platform, url]) => url?.trim() && PLATFORMS[platform]);

  if (activeSocials.length > 0) {
    const linksEl = document.createElement('div');
    linksEl.className = 'dj-socials';

    const n = activeSocials.length;
    const cols = n <= 3 ? n : Math.ceil(n / 2);
    linksEl.style.maxWidth = `calc(${cols} * var(--icon-size) + ${cols - 1} * var(--icon-gap))`;

    for (const [platform, url] of activeSocials) {
      const { label, icon } = PLATFORMS[platform];

      const link = document.createElement('a');
      link.className = 'social-link';
      link.href      = url;
      link.target    = '_blank';
      link.rel       = 'noopener noreferrer';
      link.setAttribute('aria-label', label);
      link.title = label;

      const i = document.createElement('i');
      i.className = icon;
      link.appendChild(i);
      linksEl.appendChild(link);
    }

    card.appendChild(linksEl);
  }

  return card;
}

function showMessage(grid, text, isError = false) {
  const p = document.createElement('p');
  p.className   = isError ? 'grid-message error' : 'grid-message';
  p.textContent = text;
  grid.appendChild(p);
}

async function init() {
  const grid = document.getElementById('dj-grid');

  let data;
  try {
    const res = await fetch('data/djs.json');
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch {
    /*
     * fetch() is blocked when opening index.html directly as a file:// URL.
     * Run a local server instead: VS Code Live Server, `npx serve .`, or
     * `python -m http.server`. The deployed GitHub Pages version works fine.
     */
    showMessage(
      grid,
      'Could not load member data. Open this page via a local server (e.g. VS Code Live Server) rather than directly as a file.',
      true,
    );
    return;
  }

  // Populate header from collective config
  const nameEl    = document.querySelector('.collective-name');
  const taglineEl = document.querySelector('.collective-tagline');
  if (nameEl)    nameEl.textContent    = data.collective.name;
  if (taglineEl) taglineEl.textContent = data.collective.tagline ?? '';

  // Filter out members with no name (incomplete placeholder entries)
  // Silly Goose is pinned first; remaining members sorted alphabetically
  const members = (data.members ?? [])
    .filter(m => m.name?.trim())
    .sort((a, b) => {
      if (a.id === 'SillyGoose') return -1;
      if (b.id === 'SillyGoose') return  1;
      return a.name.localeCompare(b.name);
    });

  if (members.length === 0) {
    showMessage(grid, 'No members found. Add entries to data/djs.json.');
    return;
  }

  for (const member of members) {
    grid.appendChild(buildCard(member));
  }
}

init();