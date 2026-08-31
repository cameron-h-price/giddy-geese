# GiddyGeese

A static directory site for the GiddyGeese DJ collective. One card per member, displayed alphabetically.

Live at **https://cameron-h-price.github.io/giddy-geese/**

## Deploying

```
git push
```

GitHub Pages auto-deploys on every push to master. No build step.

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

## Visual / style changes

All design tokens live in **`config/theme.css`** — it's the only file that needs changing for a full rebrand. Nothing is hardcoded anywhere else.

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

The `collective` block at the top of `djs.json` controls the page header:

```json
"collective": {
  "name": "GiddyGeese",
  "tagline": "optional tagline shown under the title"
}
```

