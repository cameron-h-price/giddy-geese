async function initNextEvent() {
  const card = document.getElementById('next-event-card');
  if (!card) return;
  const titleEl = card.querySelector('h3');
  const descEl = card.querySelector('p');

  let data;
  try {
    const res = await fetch('data/events.json');
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch {
    // fetch() is blocked when opening this page directly as a file:// URL —
    // leave the fallback text in place rather than erroring.
    return;
  }

  const now = new Date();
  const next = (data.events ?? [])
    .map(event => ({ ...event, _when: new Date(`${event.date}T${event.time}`) }))
    .filter(event => event._when >= now)
    .sort((a, b) => a._when - b._when)[0];

  if (!next) return;

  const dateLabel = next._when.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  titleEl.textContent = next.name;
  descEl.textContent = `${dateLabel} · ${next.location}`;
}

initNextEvent();
