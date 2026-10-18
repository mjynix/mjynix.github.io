"""Pull Jasmine's public Goodreads shelves into books.json.

Goodreads has no public API and its RSS feeds can't be fetched from the
browser (no CORS headers), so this runs on a schedule in GitHub Actions
and the site reads the generated books.json.

Usage: python3 scripts/sync_goodreads.py
"""

import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

USER_ID = "152733163"
PROFILE_URL = f"https://www.goodreads.com/user/show/{USER_ID}-jasmine-ma"
FEED = "https://www.goodreads.com/review/list_rss/{user}?shelf={shelf}&per_page=200"
OUT = Path(__file__).resolve().parent.parent / "books.json"


def fetch_shelf(shelf):
    req = urllib.request.Request(
        FEED.format(user=USER_ID, shelf=shelf),
        headers={"User-Agent": "Mozilla/5.0 (portfolio goodreads sync)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        root = ET.fromstring(resp.read())
    return [to_book(item) for item in root.iter("item")]


def to_book(item):
    text = lambda tag: (item.findtext(tag) or "").strip()
    # Goodreads covers take a size suffix like "123._SY475_.jpg"; normalize
    # every cover to 475px tall (the unsized originals can be ~2000px).
    cover = re.sub(r"(\._S[XY]\d+_)?\.jpg$", "._SY475_.jpg", text("book_large_image_url"))
    if "nophoto" in cover:
        cover = ""
    return {
        "title": text("title"),
        "author": re.sub(r"\s+", " ", text("author_name")),
        "rating": int(text("user_rating") or 0),
        "published": text("book_published"),
        "cover": cover,
        "url": f"https://www.goodreads.com/book/show/{text('book_id')}",
    }


def main():
    read = fetch_shelf("read")
    data = {
        "profile": PROFILE_URL,
        "favorites": [b for b in read if b["rating"] == 5],
        "currentlyReading": fetch_shelf("currently-reading"),
    }
    # Only bump the date when the shelves actually changed, so the daily
    # Action doesn't commit every day.
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    old_date = old.pop("updated", None)
    if old == data and old_date:
        data["updated"] = old_date
    else:
        data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(data['favorites'])} favorites, {len(data['currentlyReading'])} currently reading")


if __name__ == "__main__":
    main()
