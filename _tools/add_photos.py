"""
Add new gallery photos from the originals folder to the site.

    python _tools/add_photos.py            # process new photos
    python _tools/add_photos.py --dry-run  # show what would happen, write nothing
    python _tools/add_photos.py --hero DSC05705-1.jpg [--hero-focus 0.55]
                                           # make that photo the hero shot

Originals live OUTSIDE the repo (default: ../GalleryOriginals, next to
DJImagesOriginals) so multi-MB phone photos never enter git history. For each
original not yet in data/gallery.json this script:

  - fixes phone rotation (EXIF orientation) and strips all metadata (GPS etc.)
  - writes a lightbox copy  -> assets/gallery/full/<id>.jpg   (long edge FULL_EDGE)
  - writes a grid thumbnail -> assets/gallery/thumbs/<id>.jpg (short edge THUMB_EDGE)
  - adds an entry to data/gallery.json (new photos go on top, newest first)

Existing entries are never touched, so hand-edited captions and ordering survive
re-runs. A photo counts as "already added" when its `source` (path relative to
the originals folder) is present in gallery.json.

Hero shot: --hero <original> (path inside the originals folder) adds the photo
if needed, sets `featured` in gallery.json (big photo above the Gallery grid)
and writes the home page banner: a wide HERO_ASPECT crop to
assets/images/hero/hero-{2400,1200}.jpg. The filenames are fixed, so swapping the
hero needs no HTML/CSS change. --hero-focus picks which horizontal band is
kept: 0 = top of the photo, 1 = bottom, default 0.5.

Albums: a photo inside a subfolder of the originals folder gets that folder's
name as its `album`; photos at the top level get `album: null`. The site ignores
`album` for now (one flat gallery). See README "Switching to albums".
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener  # iPhone .heic support

    register_heif_opener()
    HEIC_OK = True
except ImportError:
    HEIC_OK = False

REPO = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = REPO.parent / "GalleryOriginals"
GALLERY_JSON = REPO / "data" / "gallery.json"
FULL_DIR = REPO / "assets" / "gallery" / "full"
THUMB_DIR = REPO / "assets" / "gallery" / "thumbs"
HERO_DIR = REPO / "assets" / "images" / "hero"

FULL_EDGE = 1600   # px, longest edge of the lightbox copy
THUMB_EDGE = 600   # px, shortest edge of the thumbnail (grid cells are cropped by CSS)
JPEG_QUALITY = 82
HERO_ASPECT = 3.0          # banner width / height
HERO_WIDTHS = (2400, 1200)  # desktop, phone

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
EXIF_IFD = 0x8769
DATE_TAKEN = 0x9003  # DateTimeOriginal


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "photo"


def date_taken(img, path):
    """EXIF capture date if present, else the file's modified date."""
    raw = img.getexif().get_ifd(EXIF_IFD).get(DATE_TAKEN)
    if raw:
        try:
            return datetime.strptime(raw.strip(), "%Y:%m:%d %H:%M:%S").date().isoformat()
        except ValueError:
            pass
    return datetime.fromtimestamp(path.stat().st_mtime).date().isoformat()


def unique_id(base, taken):
    candidate, n = base, 2
    while candidate in taken:
        candidate, n = f"{base}-{n}", n + 1
    taken.add(candidate)
    return candidate


def save_jpeg(img, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    # No exif= argument, so Pillow writes no metadata; keep the colour profile.
    img.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True,
             icc_profile=img.info.get("icc_profile"))


def process(path, source_root, photo_id, dry_run):
    rel = path.relative_to(source_root)
    album = rel.parts[0] if len(rel.parts) > 1 else None

    with Image.open(path) as img:
        taken = date_taken(img, path)
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")

        full = img.copy()
        full.thumbnail((FULL_EDGE, FULL_EDGE), Image.LANCZOS)

        scale = THUMB_EDGE / min(img.size)
        thumb = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS) \
            if scale < 1 else img.copy()

    full_path = FULL_DIR / f"{photo_id}.jpg"
    thumb_path = THUMB_DIR / f"{photo_id}.jpg"
    if not dry_run:
        save_jpeg(full, full_path)
        save_jpeg(thumb, thumb_path)

    return {
        "id": photo_id,
        "src": full_path.relative_to(REPO).as_posix(),
        "thumb": thumb_path.relative_to(REPO).as_posix(),
        "width": full.width,
        "height": full.height,
        "date": taken,
        "album": album,
        "caption": "",
        "alt": "",
        "source": rel.as_posix(),
    }


def write_hero(path, focus, dry_run):
    """Crop a full-width HERO_ASPECT band centred at `focus` and save each HERO_WIDTHS size."""
    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode != "RGB":
            img = img.convert("RGB")
        band_h = min(img.height, round(img.width / HERO_ASPECT))
        top = round(focus * img.height - band_h / 2)
        top = max(0, min(top, img.height - band_h))
        band = img.crop((0, top, img.width, top + band_h))

    for width in HERO_WIDTHS:
        out = band.resize((width, round(width / band.width * band.height)), Image.LANCZOS) \
            if width < band.width else band
        dest = HERO_DIR / f"hero-{width}.jpg"
        print(f"  * hero {dest.relative_to(REPO).as_posix()} ({out.width}x{out.height}, rows {top}-{top + band_h})")
        if not dry_run:
            save_jpeg(out, dest)


def main():
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE,
                        help=f"originals folder (default: {DEFAULT_SOURCE})")
    parser.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    parser.add_argument("--hero", metavar="ORIGINAL",
                        help="original (path inside the originals folder) to use as the hero shot")
    parser.add_argument("--hero-focus", type=float, default=0.5,
                        help="vertical centre of the banner crop, 0 = top, 1 = bottom (default 0.5)")
    args = parser.parse_args()
    if not 0 <= args.hero_focus <= 1:
        sys.exit("--hero-focus must be between 0 and 1")

    source_root = args.source.resolve()
    if not source_root.is_dir():
        sys.exit(f"Originals folder not found: {source_root}")

    try:
        data = json.loads(GALLERY_JSON.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"{GALLERY_JSON} is not valid JSON ({e}) - fix it before adding photos.")
    photos = data.setdefault("photos", [])

    known_sources = {p.get("source") for p in photos}
    taken_ids = {p.get("id") for p in photos}

    originals = sorted(p for p in source_root.rglob("*")
                       if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    new = [p for p in originals if p.relative_to(source_root).as_posix() not in known_sources]

    hero_path = None
    if args.hero:
        hero_path = (source_root / args.hero).resolve()
        if not hero_path.is_file():
            sys.exit(f"Hero photo not found: {hero_path}")

    if not new and not hero_path:
        print(f"No new photos in {source_root} ({len(photos)} already in the gallery).")
        return

    added, skipped = [], []
    for path in new:
        if path.suffix.lower() in {".heic", ".heif"} and not HEIC_OK:
            skipped.append((path, "HEIC needs: pip install pillow-heif"))
            continue
        rel = path.relative_to(source_root)
        photo_id = unique_id(slugify("-".join(rel.with_suffix("").parts)), taken_ids)
        try:
            entry = process(path, source_root, photo_id, args.dry_run)
        except OSError as e:
            skipped.append((path, str(e)))
            continue
        added.append(entry)
        print(f"  + {entry['source']} -> {entry['id']}.jpg ({entry['width']}x{entry['height']}, {entry['date']})")

    # New photos go on top, newest first; existing order is left alone.
    added.sort(key=lambda e: e["date"], reverse=True)
    data["photos"] = added + photos

    for path, reason in skipped:
        print(f"  ! skipped {path.relative_to(source_root)}: {reason}")

    if hero_path:
        hero_source = hero_path.relative_to(source_root).as_posix()
        entry = next((p for p in data["photos"] if p.get("source") == hero_source), None)
        if entry is None:
            sys.exit(f"Hero photo {hero_source} could not be added to the gallery (see skipped above).")
        write_hero(hero_path, args.hero_focus, args.dry_run)
        data["featured"] = entry["id"]
        print(f"  * featured = {entry['id']}")

    if args.dry_run:
        print(f"Dry run: would add {len(added)} photo(s). Nothing written.")
        return

    GALLERY_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added {len(added)} photo(s). Fill in captions/alt in data/gallery.json if wanted, then commit + push.")


if __name__ == "__main__":
    main()
