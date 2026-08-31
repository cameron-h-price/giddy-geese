# GiddyGeese

Site for the GiddyGeese DJ collective — built with Jekyll. Pages: Home, Upcoming Events, Upcoming Streams, Our DJs (one card per member), Our Mission, Code of Conduct & Support, Contact Us.

Live at **https://cameron-h-price.github.io/giddy-geese/**

## Deploying

```
git push
```

GitHub Pages builds and deploys automatically on every push to master — no CI config needed. It runs Jekyll via the `github-pages` gem, which this repo's `Gemfile` pins exactly, so a local build behaves the same as production.

## Local development

```
bundle install       # one-time, or after Gemfile changes
bundle exec jekyll serve
```

Serves the site at `http://127.0.0.1:4000` with auto-rebuild on file changes.

## Adding a page

Each page is a file at the repo root with YAML front matter:

```
---
layout: default
title: Page Title — GiddyGeese
active: some-id        # matches an entry in _includes/nav.html for the active nav state
font_awesome: true      # optional — include Font Awesome (needed for social icons)
scripts:                # optional — extra <script> tags before </body>
  - /js/some-script.js
---
Page content goes here — this is inserted into {{ content }} in _layouts/default.html.
```

Shared markup lives in `_layouts/default.html` (page shell) and `_includes/nav.html` / `_includes/footer.html` (nav + footer, included on every page).

---

## Adding a DJ

Edit `data/djs.json`. Add an entry to the `members` array:

```json
{
  "id": "their-name",
  "name": "Their Name",
  "image": "assets/images/their-name.jpg",
  "socials": {
    "mixcloud": "https://www.mixcloud.com/theirhandle/",
    "instagram": "https://www.instagram.com/theirhandle/"
  }
}
```

### Image

Drop the photo in `assets/images/` and set `image` to `"assets/images/filename.jpg"`. If `image` is omitted, a placeholder silhouette is shown.

### Supported social platforms

`soundcloud` · `instagram` · `mixcloud` · `spotify` · `youtube` · `bandcamp` · `facebook` · `twitter` · `tiktok` · `twitch` · `kick` · `website`

Leave a platform out of the `socials` object entirely (or set it to `""`) to hide it.

---

## Adding an event

Edit `data/events.json`. Add an entry to the `events` array:

```json
{
  "name": "Event Name",
  "poster": "assets/images/events/filename.jpg",
  "date": "2026-09-19",
  "time": "22:00",
  "duration": 6,
  "location": "Venue, City",
  "description": "One or two sentence description.",
  "lineup": ["CmunSelecta", "Silly Goose", "Guest DJ"]
}
```

`duration` (hours, optional) sets how long the "Add to Calendar" button's event block is — defaults to `6` if omitted. Decimals are fine (e.g. `2.5`).

The **Upcoming Events** page (`events.html`) sorts these automatically — no manual ordering needed:

- The soonest event with a date/time in the future is shown as the large hero card.
- Any other future events appear below it as smaller cards, in date order.
- Anything with a date/time in the past automatically drops into the "Past Events" section instead.

### Poster

Drop the image in `assets/images/events/` and set `poster` to `"assets/images/events/filename.jpg"`. If omitted or missing, a placeholder is shown.

### Lineup

Each name in `lineup` is checked (case-insensitively) against the `name` field in `data/djs.json`. A match becomes a link to that member's card on the Our DJs page; anything that doesn't match (e.g. a guest not in the collective) is shown as plain text. So a collective member's name should be spelled exactly as it appears in `djs.json` to get the link.

---

## Editing the stream schedule

Edit `data/streams.json`. It has two lists:

`platforms` — the "Watch & Listen" links shown at the top of the page, separate from the schedule cards:

```json
{ "label": "Twitch", "url": "https://www.twitch.tv/giddygeese", "icon": "fa-brands fa-twitch" }
```

`icon` is any Font Awesome class (the same set used for DJ social icons in `js/main.js`'s `PLATFORMS` map).

`streams` — the recurring weekly schedule, no dates since these repeat rather than happening once. Just title/day/time — no link, since where to watch is already covered by `platforms` above:

```json
{
  "title": "Monday Stream",
  "day": "Monday",
  "time": "20:00"
}
```

Unlike events, there's no hero/past-event logic here — every entry in `streams` just renders as its own card, in file order.

---

## Visual / style changes

All design tokens live in **`config/theme.css`**. Nothing is hardcoded anywhere else.

The Colour and Typography values specifically are generated from `../brand.json` (one level up, outside this repo) via `../sync_brand.py` — see `../BRANDING.md`. Edit `brand.json`, not `theme.css` directly, for those; a pre-commit hook re-syncs automatically. Everything else in `theme.css` (layout, grid, cards, nav) is edited directly here.

### Colours

```css
--color-bg              /* page background */
--color-surface         /* card background */
--color-surface-hover   /* card background on hover */
--color-border          /* card border */
--color-border-hover    /* card border on hover (also used for accent) */
--color-text-primary    /* names, headings */
--color-text-secondary  /* social icons at rest */
--color-accent          /* social icon hover, interactive elements */
--color-accent-hover    /* accent on hover */
```

### Typography

```css
--font-heading    /* collective name + DJ names */
--font-body       /* everything else */
```

To use a Google Font, uncomment the `@import` line at the top of `theme.css`, paste in the font URL, then update these two variables.

```css
--text-heading-size   /* "GiddyGeese" title */
--text-name-size      /* DJ name on each card */
--text-tagline-size   /* collective tagline under the title */
```

### Layout & cards

```css
--max-width        /* max page width */
--grid-min-col     /* minimum card width — controls how many columns fit */
--grid-gap         /* gap between cards */
--card-padding     /* padding inside each card */
--card-radius      /* card corner radius */
```

### Avatars

```css
--avatar-size      /* diameter of profile photos */
--avatar-radius    /* 50% = circle, 0 = square, anything between = rounded square */
```

### Social icons

```css
--icon-size   /* icon size */
--icon-gap    /* gap between icons */
```

---

## Collective config

The `collective` block at the top of `djs.json` controls the header on the **Our DJs** page (`djs.html`) — it's populated at runtime by `js/main.js`. The landing page's hero text is static and edited directly in `index.html`.

```json
"collective": {
  "name": "GiddyGeese",
  "tagline": "optional tagline shown under the title"
}
```

