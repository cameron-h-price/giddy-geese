# ANTOINE: website texts to write

From the GG meeting on 22 Nov 2026: **"Update texts on the website for meetups, HMHT and Treasure Thursday" (Antoine, by 1 Dec 2026).**

Search this repo for `ANTOINE` to find every spot. This file isn't published on the site.

## 1. House Music Host Train + Treasure Thursdays (stream concept boxes)

**Where:** `data/streams.json`, the `"description"` field of each stream. Each stream also has an `"_todo_antoine"` note next to it.

- Each card on the Upcoming Streams page shows the text in a box under the day and time.
- It's plain text, 1–3 short sentences. For a second paragraph, put `\n\n` inside the text.
- Keep the double quotes around the text. If your text contains a `"`, write it as `\"`.
- Right now each has a placeholder line Cameron wrote. Replace it with the real concept: what the stream is, who plays, and how people can join in or tune in.
- When you're done, **delete the `"_todo_antoine"` line** (and the comma at the end of the line before it, if it's the last field).

Example:

```json
{
  "title": "House Music Host Train",
  "day": "Monday",
  "time": "20:00",
  "platform": "Kick",
  "description": "First sentence about the concept.\n\nOptional second paragraph.",
  "poster": "assets/images/VertPoster.jpg"
}
```

## 2. Meetups

There's no meetups section on the site yet. Send Cameron the text and say which page it should go on (or whether it needs its own page), and he'll add it.

## Checking your change

- On GitHub you can edit `data/streams.json` in the browser (pencil icon) and commit. The site rebuilds in about a minute.
- If the Upcoming Streams page shows no cards after your change, the JSON is broken (usually a missing comma or quote). Paste the file into https://jsonlint.com to find the error.
