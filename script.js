// Masthead date, e.g. "Sunday, October 18, 2026"
const today = document.getElementById("today");
if (today) {
  today.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

// Books page: render shelves from books.json (synced daily from Goodreads
// by .github/workflows/goodreads.yml).
const shelves = document.querySelectorAll("[data-shelf]");
const profileUrl = "https://www.goodreads.com/user/show/152733163-jasmine-ma";

function year(published) {
  const n = parseInt(published, 10);
  if (!n) return "";
  return n < 0 ? `${-n} BCE` : String(n);
}

function bookHTML(book) {
  const el = document.createElement("a");
  el.className = "book";
  el.href = book.url;
  el.target = "_blank";
  el.rel = "noreferrer";

  const cover = document.createElement(book.cover ? "img" : "span");
  cover.className = "book-cover";
  if (book.cover) {
    cover.src = book.cover;
    cover.alt = `Cover of ${book.title}`;
    cover.loading = "lazy";
  }

  const title = document.createElement("span");
  title.className = "book-title";
  title.textContent = book.title;

  const meta = document.createElement("span");
  meta.className = "book-meta";
  meta.textContent = [book.author, year(book.published)].filter(Boolean).join(" · ");

  el.append(cover, title, meta);
  return el;
}

if (shelves.length) {
  fetch("books.json", { cache: "no-cache" })
    .then(res => res.json())
    .then(data => {
      shelves.forEach(shelf => {
        const books = data[shelf.dataset.shelf] || [];
        shelf.replaceChildren(...books.map(bookHTML));
        if (!books.length) shelf.innerHTML = '<p class="muted">Nothing here right now.</p>';
      });
      document.getElementById("syncNote").textContent = `Synced from Goodreads · ${data.updated}`;
    })
    .catch(() => {
      shelves.forEach(shelf => {
        shelf.innerHTML = `<p class="muted">Couldn't load books. See them on <a href="${profileUrl}">Goodreads</a>.</p>`;
      });
    });
}
