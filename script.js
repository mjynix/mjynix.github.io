// Shelves come from books.json (synced daily from Goodreads by
// .github/workflows/goodreads.yml).
const shelves = document.querySelectorAll("[data-shelf]");
const profileUrl = "https://www.goodreads.com/user/show/152733163-jasmine-ma";

function year(published) {
  const n = parseInt(published, 10);
  if (!n) return "";
  return n < 0 ? `${-n} BCE` : String(n);
}

function bookElement(book) {
  const el = document.createElement("article");
  el.className = "book";

  const link = document.createElement("a");
  link.className = "book-cover-link";
  link.href = book.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `${book.title} on Goodreads`);

  const cover = document.createElement(book.cover ? "img" : "span");
  cover.className = "book-cover";
  if (book.cover) {
    // Book-shaped covers fill the frame; anything else (like a wide picture
    // book) shrinks to fit so it isn't cropped.
    cover.addEventListener("load", () => {
      const ratio = cover.naturalWidth / cover.naturalHeight;
      cover.classList.toggle("odd-shape", ratio > 0.8 || ratio < 0.55);
    });
    cover.src = book.cover;
    cover.alt = "";
    cover.loading = "lazy";
  }
  link.append(cover);

  const title = document.createElement("h3");
  title.className = "book-title";
  title.textContent = book.title;

  const meta = document.createElement("p");
  meta.className = "book-meta";
  meta.textContent = [book.author, year(book.published)].filter(Boolean).join(" · ");

  el.append(link, title, meta);
  return el;
}

if (shelves.length) {
  fetch("books.json", { cache: "no-cache" })
    .then(res => res.json())
    .then(data => {
      shelves.forEach(shelf => {
        const books = data[shelf.dataset.shelf] || [];
        shelf.replaceChildren(...books.map(bookElement));
        if (!books.length) shelf.innerHTML = '<p class="muted">Nothing here right now.</p>';
      });
      const syncNote = document.getElementById("syncNote");
      if (syncNote) syncNote.textContent = `Synced from Goodreads · ${data.updated}`;
    })
    .catch(() => {
      shelves.forEach(shelf => {
        shelf.innerHTML = `<p class="muted">Couldn't load books. See them on <a href="${profileUrl}">Goodreads</a>.</p>`;
      });
    });
}
