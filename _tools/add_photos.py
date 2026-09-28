"""
Add new gallery photos from the originals folder to the site.

    python _tools/add_photos.py            # process new photos
    python _tools/add_photos.py --dry-run  # show what would happen, write nothing

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

FULL_EDGE = 1600   # px, longest edge of the lightbox copy
THUMB_EDGE = 600   # px, shortest edge of the thumbnail (grid cells are cropped by CSS)
JPEG_QUALITY = 82

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


def main():
    parser = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE,
                        help=f"originals folder (default: {DEFAULT_SOURCE})")
    parser.add_argument("--dry-run", action="store_true", help="report only, write nothing")
    args = parser.parse_args()

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

    if not new:
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

    if args.dry_run:
        print(f"Dry run: would add {len(added)} photo(s). Nothing written.")
        return

    GALLERY_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added {len(added)} photo(s). Fill in captions/alt in data/gallery.json if wanted, then commit + push.")


if __name__ == "__main__":
    main()
