"""Pull Jasmine's public Goodreads shelves into books.json.

Goodreads has no public API and shut off its RSS feeds in October 2026, so
this reads its embeddable shelf widget instead. The widget is a script
Goodreads serves for dropping a shelf into a web page, so it needs parsing,
and it runs on a schedule in GitHub Actions so the site can read the
generated books.json.

Usage: python3 scripts/sync_goodreads.py
"""

import html
import json
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

USER_ID = "152733163"
WIDGET = (
    "https://www.goodreads.com/review/custom_widget/{user}.Books"
    "?shelf={shelf}&num_books=200&sort=date_added&order=d"
    "&show_cover=1&show_title=1&show_author=1&show_rating=1&widget_id={shelf_id}"
)
OUT = Path(__file__).resolve().parent.parent / "books.json"


def fetch_shelf(shelf):
    req = urllib.request.Request(
        WIDGET.format(user=USER_ID, shelf=shelf, shelf_id=shelf.replace("-", "")),
        headers={"User-Agent": "Mozilla/5.0 (portfolio goodreads sync)"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        script = resp.read().decode("utf-8")
    code = re.search(r"var widget_code = '(.*?)'\s*var widget_div", script, re.S)
    if not code:
        raise SystemExit(f"Goodreads widget format changed: no markup for {shelf}")
    markup = re.sub(r"\\(.)", lambda m: "\n" if m[1] == "n" else m[1], code[1])
    # each book opens with its cover container
    return [to_book(block) for block in re.split(r"gr_custom_book_container", markup)[1:]]


def to_book(block):
    title = re.search(r'<a title="([^"]*)"', block)
    cover = re.search(r'<img[^>]*src="([^"]*)"', block)
    author = re.search(r"by\s*<a[^>]*>([^<]*)</a>", block)
    link = re.search(r'href="([^"?]*)', block)
    if not (title and cover and author and link):
        raise SystemExit("Goodreads widget format changed: could not read a book")

    cover = cover[1]
    # the cover's file name is the book's id: ".../150253._SY75_.jpg"
    book_id = re.search(r"/(\d+)(?:\._S[XY]\d+_)?\.jpg$", cover)
    # Goodreads covers take a size suffix; normalize every cover to 475px tall.
    cover = re.sub(r"(\._S[XY]\d+_)?\.jpg$", "._SY475_.jpg", cover)
    if "nophoto" in cover:
        cover = ""
    return {
        "title": html.unescape(title[1]).strip(),
        "author": re.sub(r"\s+", " ", html.unescape(author[1])).strip(),
        "rating": block.count("_star_active"),
        "cover": cover,
        "url": f"https://www.goodreads.com/book/show/{book_id[1]}" if book_id else link[1],
    }


def main():
    read = fetch_shelf("read")
    if not read:
        raise SystemExit("Goodreads returned an empty read shelf; keeping books.json as is")
    data = {
        "favorites": [b for b in read if b["rating"] == 5],
        "currentlyReading": fetch_shelf("currently-reading"),
    }
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    # The widget doesn't include publication years, so keep the ones we have.
    known = {b["url"]: b.get("published", "") for k in ("favorites", "currentlyReading") for b in old.get(k, [])}
    for book in data["favorites"] + data["currentlyReading"]:
        book["published"] = known.get(book["url"], "")
    # Only bump the date when the shelves actually changed, so the daily
    # Action doesn't commit every day.
    old_date = old.pop("updated", None)
    if old == data and old_date:
        data["updated"] = old_date
    else:
        data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(data['favorites'])} favorites, {len(data['currentlyReading'])} currently reading")


if __name__ == "__main__":
    main()
