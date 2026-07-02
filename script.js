// ===== Intro / Typewriter =====
const splash = document.getElementById("splash");
const site = document.getElementById("site");
const typeTextEl = document.getElementById("typeText");
const skipBtn = document.getElementById("skipIntro");

const fullText = "jasmine ma";
const typeSpeed = 110;     // ms per character
const holdAfterTyping = 450; // pause after finished typing

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeWriter(text) {
  typeTextEl.textContent = "";
  for (let i = 0; i < text.length; i++) {
    typeTextEl.textContent += text[i];
    await sleep(typeSpeed);
  }
}

async function endIntro() {
  // Reveal site
  site.classList.remove("hidden");
  site.classList.add("reveal");

  // Fade splash out
  splash.classList.add("fade-out");

  // Remove splash from screen readers after animation
  await sleep(750);
  splash.style.display = "none";
}

async function runIntro() {
  // If user prefers reduced motion, skip animations
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    typeTextEl.textContent = fullText;
    await sleep(150);
    endIntro();
    return;
  }

  await typeWriter(fullText);
  await sleep(holdAfterTyping);
  endIntro();
}

skipBtn?.addEventListener("click", endIntro);
splash?.addEventListener("click", (e) => {
  // Clicking anywhere on splash skips (except the inner text selection)
  if (e.target?.id !== "typeText") endIntro();
});

runIntro();


// ===== Tabs (your existing functionality) =====
const buttons = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab");
const tabJumps = document.querySelectorAll(".tab-jump");

function activateTab(id) {
  if (!id) return;

  buttons.forEach(b => b.classList.remove("active"));
  document.querySelector(`.tab-btn[data-tab="${id}"]`)?.classList.add("active");

  tabs.forEach(t => t.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
  });
});

tabJumps.forEach(btn => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
  });
});


// ===== Scroll reveal / motion polish =====
const revealItems = document.querySelectorAll(
  ".hero-copy, .portrait-card, .panel, .experience-card, .proj-card, .gallery-card, .contact-card"
);

revealItems.forEach((item, index) => {
  item.classList.add("revealable");
  item.style.setProperty("--reveal-delay", `${Math.min(index * 35, 220)}ms`);
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach(item => item.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach(item => revealObserver.observe(item));
}
