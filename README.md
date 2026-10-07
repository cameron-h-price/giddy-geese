# GiddyGeese

Site for the GiddyGeese DJ collective — built with Jekyll. Pages: Home, Upcoming Events, Upcoming Streams, Our DJs & Volunteers (one card per member), Gallery, Code of Conduct & Support, Contact Us.

The **Our Mission** page (`mission.html`) is currently hidden: it has `published: false` in its front matter, so Jekyll doesn't build it, and its nav link is wrapped in `{% comment %}` in `_includes/nav.html`. To bring it back, remove `published: false` and uncomment the nav link.

Live at **https://giddygeese.nl** (the old `cameron-h-price.github.io/giddy-geese/` address redirects there)

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

### Order

Silly Goose is always shown first and Cmun Selecta second. Everyone else is sorted alphabetically. To change who is pinned, edit the `PINNED` list of member `id`s at the top of `js/main.js`.

---

## Adding a volunteer

Volunteers and community supporters are shown in their own section at the bottom of the **Our DJs & Volunteers** page. Add an entry to the `volunteers` array in `data/djs.json`. It uses the same fields as a DJ, plus an optional `role` shown under the name:

```json
{
  "id": "their-name",
  "name": "Their Name",
  "role": "Door & welcome",
  "image": "assets/images/their-name.jpg",
  "socials": {}
}
```

Volunteers are shown in file order, not sorted. While the list is empty, the section only shows its "Want to get involved?" call-out.

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

`duration` (hours, optional) sets when the event ends — used for the "Add to Calendar" block and for when it moves to Past Events. Defaults to `6` if omitted. Decimals are fine (e.g. `2.5`).

`time` can also be a range, e.g. `"18:00-23:00"` (overnight ranges like `"22:00-04:00"` work too). The full range is shown on the card and sets the calendar block's end time, so `duration` isn't needed. Set `"hidden": true` to keep an event off the site.

The **Upcoming Events** page (`events.html`) sorts these automatically — no manual ordering needed:

- The soonest event that hasn't finished yet is shown as the large hero card (so an event stays up while it's running).
- Any other upcoming events appear below it as smaller cards, in date order.
- Once an event's end time passes (end of the `time` range, or start + `duration`), it drops into the "Past Events" section — faded, newest first, no "Add to Calendar" button.
- The home page's "Next Event" card uses the same rules (shared `js/event-times.js`).

### Poster

Drop the image in `assets/images/events/` and set `poster` to `"assets/images/events/filename.jpg"`. If omitted or missing, a placeholder is shown.

### Lineup

Each name in `lineup` is checked (case-insensitively) against the `name` field in `data/djs.json`. A match becomes a link to that member's card on the Our DJs page; anything that doesn't match (e.g. a guest not in the collective) is shown as plain text. So a collective member's name should be spelled exactly as it appears in `djs.json` to get the link.

---

## Adding gallery photos

Use the helper script. Don't commit full-size photos by hand: phone photos are several MB each, and git keeps them in history even after you delete them.

1. Put the originals in `../GalleryOriginals/`. That folder sits next to this repo, outside git, like `DJImagesOriginals/`.
2. Run:

   ```
   python _tools/add_photos.py            # add --dry-run to preview
   ```

   For each photo that isn't in the gallery yet, the script:
   - rotates phone photos the right way up
   - strips all metadata, including GPS location
   - writes a lightbox copy to `assets/gallery/full/` (1600px long edge) and a grid thumbnail to `assets/gallery/thumbs/` (600px short edge)
   - adds an entry to the top of `data/gallery.json`, with the newest photos first

   The script needs Pillow. For iPhone `.heic` photos, also run `pip install pillow-heif`.
3. If you want, fill in `caption` and `alt` in `data/gallery.json`. Then commit and push.

Each entry looks like this:

```json
{
  "id": "summer-party-01",
  "src": "assets/gallery/full/summer-party-01.jpg",
  "thumb": "assets/gallery/thumbs/summer-party-01.jpg",
  "width": 1600,
  "height": 1067,
  "date": "2026-09-19",
  "album": null,
  "caption": "Optional one-line caption.",
  "alt": "Optional alt text. Falls back to the caption, then a generic description.",
  "source": "summer-party-01.jpg"
}
```

- `source` is the original's path inside `GalleryOriginals/`. The script uses it to recognise photos it has already added, so it's safe to re-run. It never changes existing entries, so your captions and any reordering you do by hand are kept.
- `thumb` is optional. Without it, the grid uses `src`. If `src` is missing or fails to load, a placeholder is shown.
- **Removing a photo:** delete its entry from `gallery.json` and its two files from `assets/gallery/`. Also move the original out of `GalleryOriginals/`, or the next run will add it again.

Photos show on the **Gallery** page (`gallery.html`) in file order. Clicking a thumbnail opens it in a lightbox. You can move between photos by clicking, with the arrow keys, or close it with Escape.

### Hero shot

One photo is the collective's hero shot. It shows up in two places: as the wide banner behind the title on the home page, and as a large featured photo above the grid on the Gallery page. To set or swap it:

```
python _tools/add_photos.py --hero DSC05705-1.jpg --hero-focus 0.55
```

- `--hero` is the original's path inside `GalleryOriginals/`. The photo is added to the gallery first if it isn't there yet.
- The home banner is a wide 3:1 strip cut across the full width of the photo. `--hero-focus` picks which strip: 0 is the top of the photo, 1 the bottom, and the default is 0.5. Add `--dry-run` to see which rows it would keep.
- The script writes `assets/images/hero/hero-2400.jpg` (desktop) and `hero-1200.jpg` (phones, under 800px wide). The filenames never change, so no HTML or CSS edits are needed.
- It sets `"featured": "<photo id>"` at the top of `data/gallery.json`. Remove that key to drop the big photo from the Gallery page.

Tokens in `config/theme.css`:
- `--hero-height`: banner height
- `--hero-overlay`: the darkening gradient that keeps the title readable
- `--hero-focus`: crop position of the Gallery featured photo
- `--gallery-featured-aspect`: shape of the Gallery featured photo

### Switching to albums

Right now the gallery is one flat stream, but album information is already recorded:

- Originals at the top level of `GalleryOriginals/` get `"album": null`.
- Originals in a subfolder (for example `GalleryOriginals/2026-09-19 HetGoed/`) get `"album": "2026-09-19 HetGoed"`. The site currently ignores this.

To switch to albums:
1. Move the originals into one subfolder per event.
2. Set `album` on the entries that already exist. This can be done by hand, or by clearing `gallery.json` and `assets/gallery/` and re-running the script.
3. In `js/gallery.js` `init()`, group `photos` by `album` and render one section or album card per group. The lightbox already accepts any array of photos, so each album can get its own lightbox.
4. Optionally, add a top-level `"albums"` list to `gallery.json` with a title, date or cover image per album.

---

## Editing the stream schedule

Edit `data/streams.json`. It has two lists:

`platforms` — the "Watch & Listen" links shown at the top of the page, separate from the schedule cards:

```json
{ "label": "Twitch", "url": "https://www.twitch.tv/giddygeese", "icon": "fa-brands fa-twitch" }
```

`icon` is any Font Awesome class (the same set used for DJ social icons in `js/main.js`'s `PLATFORMS` map).

`streams` — the recurring weekly schedule, no dates since these repeat rather than happening once:

```json
{
  "title": "House Music Host Train",
  "day": "Monday",
  "time": "20:00",
  "platform": "Kick",
  "poster": "assets/images/filename.jpg"
}
```

`platform` (optional) must exactly match a `label` in the `platforms` list above — the matching link/icon is shown on the card. Omit it if the stream doesn't need its own link (the general `platforms` section at the top already covers "where to watch" by default).

`poster` (optional) is a poster image for the card, same convention as event posters. If omitted or the file fails to load, a placeholder is shown instead.

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

## Collective socials & contact

The collective's own links live in `_data/socials.json`. They're rendered at build time into the **Contact / Socials** page (`contact.html`) and the social icons in the footer on every page.

- `socials`: one entry per platform (`label`, `handle`, Font Awesome `icon`, `url`). Leave `url` as `""` to hide an entry.
- `contact`: the "Get in touch" rows (`label`, `text`, optional `url`, e.g. a `mailto:` link).

---

## Donations

The **Donate** page (`donate.html`) reads its link from `_data/donate.json`:

- `kofi_url`: the Ko-fi page link, e.g. `https://ko-fi.com/giddygeese`. While it's `""` the page says "Donations open soon" and the **Donate** nav link and footer link stay hidden.
- `button_text`: the label on the donate button.

The page text (where the money goes, the small print) is edited directly in `donate.html`.

---

## Highlighted content (home page)

The third card on the home page embeds an Instagram Reel set in `_data/highlight.json`:

- `instagram_url`: the reel or post link. You can strip anything after the `?`, e.g. `https://www.instagram.com/reel/XXXX/`. Leave it as `""` to show a "Coming soon" card instead.
- `title` / `text`: an optional headline and line of text above the reel. Leave them as `""` to hide them.
- `label`: the small accent label at the top of the card.

---

## Collective config

The `collective` block at the top of `djs.json` controls the header on the **Our DJs** page (`djs.html`) — it's populated at runtime by `js/main.js`. The landing page's hero text is static and edited directly in `index.html`.

```json
"collective": {
  "name": "GiddyGeese",
  "tagline": "optional tagline shown under the title"
}
```

