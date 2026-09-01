/*
 * Placeholder photo — shown when a gallery entry has no image or it fails to load.
 * Defined as a data URI so no extra file is needed.
 */
const PLACEHOLDER_PHOTO = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="#2c2c2c"/>
    <circle cx="100" cy="110" r="28" fill="#444"/>
    <path d="M40 240 L120 150 L170 200 L210 165 L260 240 Z" fill="#444"/>
  </svg>`
)}`;

function resolveSrc(photo) {
  return photo.src?.trim() || PLACEHOLDER_PHOTO;
}

function resolveAlt(photo) {
  return photo.alt?.trim() || photo.caption?.trim() || 'Gallery photo';
}

function buildThumb(photo, index) {
  const btn = document.createElement('button');
  btn.className = 'gallery-thumb';
  btn.type = 'button';
  btn.dataset.index = index;
  btn.setAttribute('aria-label', photo.caption?.trim() || 'View photo');

  const img = document.createElement('img');
  img.src = resolveSrc(photo);
  img.alt = resolveAlt(photo);
  img.loading = 'lazy';
  img.onerror = () => { img.src = PLACEHOLDER_PHOTO; };
  btn.appendChild(img);

  return btn;
}

function showMessage(container, text, isError = false) {
  const p = document.createElement('p');
  p.className = isError ? 'grid-message error' : 'grid-message';
  p.textContent = text;
  container.appendChild(p);
}

/*
 * Lightbox — one overlay shared by every thumbnail, built once and reused.
 * open(index) swaps the image/caption and shows it; prev/next wrap around.
 */
function buildLightbox(photos) {
  const el = document.createElement('div');
  el.className = 'gallery-lightbox';
  el.hidden = true;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lightbox-nav lightbox-prev';
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous photo');
  prevBtn.innerHTML = '&lsaquo;';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lightbox-nav lightbox-next';
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next photo');
  nextBtn.innerHTML = '&rsaquo;';

  const content = document.createElement('div');
  content.className = 'lightbox-content';

  const img = document.createElement('img');
  img.className = 'lightbox-img';
  img.onerror = () => { img.src = PLACEHOLDER_PHOTO; };

  const caption = document.createElement('p');
  caption.className = 'lightbox-caption';

  content.appendChild(img);
  content.appendChild(caption);
  el.appendChild(closeBtn);
  el.appendChild(prevBtn);
  el.appendChild(content);
  el.appendChild(nextBtn);
  document.body.appendChild(el);

  let current = 0;
  const hasMultiple = photos.length > 1;
  prevBtn.hidden = !hasMultiple;
  nextBtn.hidden = !hasMultiple;

  function show(index) {
    current = (index + photos.length) % photos.length;
    const photo = photos[current];
    img.src = resolveSrc(photo);
    img.alt = resolveAlt(photo);
    caption.textContent = photo.caption?.trim() || '';
    caption.hidden = !photo.caption?.trim();
  }

  function open(index) {
    show(index);
    el.hidden = false;
    closeBtn.focus();
  }

  function close() {
    el.hidden = true;
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));

  // Click on the dark backdrop (not the image/caption/buttons) closes it.
  el.addEventListener('click', (e) => {
    if (e.target === el) close();
  });

  document.addEventListener('keydown', (e) => {
    if (el.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  return { open };
}

async function init() {
  const grid = document.getElementById('gallery-grid');

  let data;
  try {
    const res = await fetch('data/gallery.json');
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch {
    /*
     * fetch() is blocked when opening this page directly as a file:// URL.
     * Run a local server instead — see README.md — or use the deployed
     * GitHub Pages version, which works fine.
     */
    showMessage(
      grid,
      'Could not load gallery data. Open this page via a local server rather than directly as a file.',
      true,
    );
    return;
  }

  const photos = data.photos ?? [];

  if (photos.length === 0) {
    showMessage(grid, 'No photos yet — check back soon.');
    return;
  }

  const lightbox = buildLightbox(photos);

  photos.forEach((photo, index) => {
    const thumb = buildThumb(photo, index);
    thumb.addEventListener('click', () => lightbox.open(index));
    grid.appendChild(thumb);
  });
}

init();