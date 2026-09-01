async function initNextEvent() {
  const card = document.getElementById('next-event-card');
  if (!card) return;
  const posterEl = document.getElementById('next-event-poster');
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

  if (next.poster?.trim()) {
    posterEl.src = next.poster;
    posterEl.alt = next.name;
    posterEl.hidden = false;
    posterEl.onerror = () => { posterEl.hidden = true; };
  }
}

const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function nextOccurrence(dayName, timeStr, now) {
  const targetDay = DAY_INDEX[dayName];
  if (targetDay === undefined) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  let daysUntil = (targetDay - now.getDay() + 7) % 7;
  if (daysUntil === 0 && candidate <= now) daysUntil = 7; // today's slot already passed — roll to next week
  candidate.setDate(candidate.getDate() + daysUntil);
  return candidate;
}

async function initNextStream() {
  const card = document.getElementById('next-stream-card');
  if (!card) return;
  const posterEl = document.getElementById('next-stream-poster');
  const titleEl = card.querySelector('h3');
  const descEl = card.querySelector('p');

  let data;
  try {
    const res = await fetch('data/streams.json');
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch {
    return;
  }

  const now = new Date();
  const next = (data.streams ?? [])
    .map(stream => ({ ...stream, _when: nextOccurrence(stream.day, stream.time, now) }))
    .filter(stream => stream._when)
    .sort((a, b) => a._when - b._when)[0];

  if (!next) return;

  const dateLabel = next._when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  titleEl.textContent = next.title;
  descEl.textContent = `${dateLabel} · ${next.time}`;

  if (next.poster?.trim()) {
    posterEl.src = next.poster;
    posterEl.alt = next.title;
    posterEl.hidden = false;
    posterEl.onerror = () => { posterEl.hidden = true; };
  }
}

initNextEvent();
initNextStream();
