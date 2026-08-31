/*
 * Placeholder poster — shown when an event has no poster or it fails to load.
 * Defined as a data URI so no extra file is needed.
 */
const PLACEHOLDER_POSTER = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <rect width="300" height="400" fill="#2c2c2c"/>
    <path d="M100 260 L150 180 L200 260 Z" fill="#444"/>
    <circle cx="210" cy="150" r="22" fill="#444"/>
  </svg>`
)}`;

function resolvePoster(event) {
  return event.poster?.trim() || PLACEHOLDER_POSTER;
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function buildLineup(names, lookup) {
  const wrap = document.createElement('div');
  wrap.className = 'event-lineup';

  for (const name of names ?? []) {
    const id = lookup.get(name.trim().toLowerCase());

    const tag = document.createElement(id ? 'a' : 'span');
    tag.className = 'lineup-tag';
    tag.textContent = name;
    if (id) {
      tag.href = `djs.html#${id}`;
    }
    wrap.appendChild(tag);
  }

  return wrap;
}

function buildMetaItem(icon, text, href) {
  const el = document.createElement(href ? 'a' : 'span');
  if (href) {
    el.href = href;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  }

  const i = document.createElement('i');
  i.className = icon;
  el.appendChild(i);

  el.appendChild(document.createTextNode(` ${text}`));
  return el;
}

function googleMapsUrl(location) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function buildMeta(event) {
  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.appendChild(buildMetaItem('fa-solid fa-calendar', formatDate(event._when)));
  meta.appendChild(buildMetaItem('fa-solid fa-clock', event.time));
  meta.appendChild(buildMetaItem('fa-solid fa-location-dot', event.location, googleMapsUrl(event.location)));
  return meta;
}

function toGCalDateString(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function googleCalendarUrl(event) {
  const start = event._when;
  const durationHours = event.duration ?? 6; // hours — optional per-event override, defaults to 6
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toGCalDateString(start)}/${toGCalDateString(end)}`,
    details: event.description ?? '',
    location: event.location ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildCalendarButton(event) {
  const btn = document.createElement('a');
  btn.className = 'calendar-btn';
  btn.href = googleCalendarUrl(event);
  btn.target = '_blank';
  btn.rel = 'noopener noreferrer';

  const i = document.createElement('i');
  i.className = 'fa-solid fa-calendar-plus';
  btn.appendChild(i);
  btn.appendChild(document.createTextNode(' Add to Calendar'));
  return btn;
}

function buildHero(event, lookup) {
  const hero = document.createElement('article');
  hero.className = 'event-hero';

  const poster = document.createElement('img');
  poster.className = 'event-hero-poster';
  poster.alt = event.name;
  poster.src = resolvePoster(event);
  poster.onerror = () => { poster.src = PLACEHOLDER_POSTER; };
  hero.appendChild(poster);

  const info = document.createElement('div');
  info.className = 'event-hero-info';

  const label = document.createElement('p');
  label.className = 'event-hero-label';
  label.textContent = 'Next Event';
  info.appendChild(label);

  const name = document.createElement('h2');
  name.className = 'event-name';
  name.textContent = event.name;
  info.appendChild(name);

  info.appendChild(buildMeta(event));

  if (event.description?.trim()) {
    const desc = document.createElement('p');
    desc.className = 'event-description';
    desc.textContent = event.description;
    info.appendChild(desc);
  }

  info.appendChild(buildLineup(event.lineup, lookup));
  info.appendChild(buildCalendarButton(event));

  hero.appendChild(info);
  return hero;
}

function buildCard(event, lookup, { past = false } = {}) {
  const card = document.createElement('article');
  card.className = past ? 'event-card past' : 'event-card';

  const poster = document.createElement('img');
  poster.className = 'event-card-poster';
  poster.alt = event.name;
  poster.src = resolvePoster(event);
  poster.onerror = () => { poster.src = PLACEHOLDER_POSTER; };
  card.appendChild(poster);

  const body = document.createElement('div');
  body.className = 'event-card-body';

  const name = document.createElement('h3');
  name.className = 'event-name';
  name.textContent = event.name;
  body.appendChild(name);

  body.appendChild(buildMeta(event));
  body.appendChild(buildLineup(event.lineup, lookup));
  body.appendChild(buildCalendarButton(event));

  card.appendChild(body);
  return card;
}

function showMessage(container, text, isError = false) {
  const p = document.createElement('p');
  p.className = isError ? 'grid-message error' : 'grid-message';
  p.textContent = text;
  container.appendChild(p);
}

async function init() {
  const heroEl        = document.getElementById('event-hero');
  const gridSection    = document.getElementById('upcoming-events-section');
  const gridEl         = document.getElementById('event-grid');
  const pastSection    = document.getElementById('past-events-section');
  const pastGridEl     = document.getElementById('past-event-grid');

  let eventsData, djsData;
  try {
    const [eventsRes, djsRes] = await Promise.all([
      fetch('data/events.json'),
      fetch('data/djs.json'),
    ]);
    if (!eventsRes.ok) throw new Error(eventsRes.statusText);
    eventsData = await eventsRes.json();
    djsData = djsRes.ok ? await djsRes.json() : { members: [] };
  } catch {
    /*
     * fetch() is blocked when opening this page directly as a file:// URL.
     * Run a local server instead — see README.md — or use the deployed
     * GitHub Pages version, which works fine.
     */
    showMessage(
      heroEl,
      'Could not load event data. Open this page via a local server rather than directly as a file.',
      true,
    );
    return;
  }

  // Name -> id lookup for linking lineup entries to their DJ card, where possible
  const lookup = new Map(
    (djsData.members ?? [])
      .filter(m => m.name?.trim())
      .map(m => [m.name.trim().toLowerCase(), m.id]),
  );

  const now = new Date();
  const events = (eventsData.events ?? []).map(event => ({
    ...event,
    _when: new Date(`${event.date}T${event.time}`),
  }));

  const upcoming = events
    .filter(e => e._when >= now)
    .sort((a, b) => a._when - b._when);
  const past = events
    .filter(e => e._when < now)
    .sort((a, b) => b._when - a._when);

  // Hero: soonest upcoming event
  if (upcoming.length === 0) {
    showMessage(heroEl, 'No upcoming events — check back soon.');
  } else {
    heroEl.appendChild(buildHero(upcoming[0], lookup));
  }

  // Grid: remaining upcoming events
  const rest = upcoming.slice(1);
  if (rest.length === 0) {
    gridSection.hidden = true;
  } else {
    for (const event of rest) {
      gridEl.appendChild(buildCard(event, lookup));
    }
  }

  // Past events
  if (past.length === 0) {
    pastSection.hidden = true;
  } else {
    for (const event of past) {
      pastGridEl.appendChild(buildCard(event, lookup, { past: true }));
    }
  }
}

init();