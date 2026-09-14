// =====================================================
// Shared site behavior — loaded on every page.
// =====================================================

// ---------- Dark mode ----------
// Order of preference: what the visitor chose last time (saved in
// localStorage) -> their OS-level light/dark setting -> light.
const themeToggle = document.getElementById('theme-toggle');
const root = document.documentElement;

function getStoredTheme() {
  try {
    return localStorage.getItem('theme');
  } catch (e) {
    return null; // e.g. private browsing — just skip persistence
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Nothing we can do — the toggle still works for this visit,
    // it just won't be remembered on the next one.
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    themeToggle.setAttribute('aria-pressed', 'true');
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    root.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-pressed', 'false');
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }
}

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(getStoredTheme() || (systemPrefersDark ? 'dark' : 'light'));

themeToggle.addEventListener('click', () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  applyTheme(newTheme);
  storeTheme(newTheme);
});

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ---------- Circular offset ----------
// Distance from a "selected" index, measured around a circle instead
// of straight down an array. Used by both the landing page carousel
// (horizontal) and the project page render picker (vertical) so that
// the last item sits immediately next to the first one, like spokes
// on a wheel, instead of only wrapping after clicking all the way around.
function getCircularOffset(index, selectedIndex, total) {
  const raw = index - selectedIndex;
  const halfTotal = Math.floor(total / 2);
  let offset = ((raw % total) + total) % total; // normalize to [0, total - 1]
  if (offset > halfTotal) {
    offset -= total; // shorter path goes the other way around
  }
  return offset;
}

// ---------- Footer social icons ----------
// Renders one icon link per entry in SOCIAL_LINKS (data.js) into
// #footer-social, wherever it exists on the current page. To add,
// remove, or edit a link, edit that array — nothing here needs to
// change. Guarded so pages that don't load data.js (there aren't
// any right now, but just in case) don't error out.
const footerSocialEl = document.getElementById('footer-social');
if (footerSocialEl && typeof SOCIAL_LINKS !== 'undefined') {
  SOCIAL_LINKS.forEach((social) => {
    const link = document.createElement('a');
    link.href = social.url;
    link.setAttribute('aria-label', social.label);
    link.title = social.label;

    // Real external links open in a new tab; mailto: links and
    // placeholder "#" hrefs don't need that.
    if (/^https?:\/\//.test(social.url)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    link.innerHTML = social.icon;
    footerSocialEl.appendChild(link);
  });
}

// ---------- Image with a graceful fallback ----------
// If an image file doesn't exist yet, this shows a plain labeled
// placeholder instead of a broken image icon. Once a real file
// exists at the given path, it just appears automatically — no
// code changes needed.
function createProjectImage(src, altText, extraClass) {
  const wrapper = document.createElement('div');
  wrapper.className = 'img-wrapper' + (extraClass ? ' ' + extraClass : '');

  const img = document.createElement('img');
  img.src = src;
  img.alt = altText;

  img.addEventListener('error', () => {
    wrapper.classList.add('img-missing');
    wrapper.textContent = altText;
    img.remove();
  });

  wrapper.appendChild(img);
  return wrapper;
}
