// =====================================================
// Landing page carousel
// Renders project cards from PROJECTS (data.js) in a "coverflow"
// layout: the selected project sits centered and full-size, the
// rest shrink and fade based on their distance from the middle.
// =====================================================
const track = document.getElementById('carousel-track');
const titleEl = document.getElementById('landing-title');
const backdrop = document.getElementById('hero-backdrop');
const viewLink = document.getElementById('view-project-link');
const prevBtn = document.getElementById('carousel-prev');
const nextBtn = document.getElementById('carousel-next');

let selectedIndex = 0;

function renderCarousel() {
  track.innerHTML = '';

  PROJECTS.forEach((project, index) => {
    const offset = getCircularOffset(index, selectedIndex, PROJECTS.length);
    const isSelected = offset === 0;

    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.appendChild(createProjectImage(project.heroImage, project.name, 'carousel-card-image'));

    const translateX = offset * 255;
    const scale = isSelected ? 1.3 : Math.max(0.6, 1 - Math.abs(offset) * 0.15);
    const opacity = isSelected ? 1 : Math.max(0.25, 0.45 - (Math.abs(offset) - 1) * 0.2);

    card.style.transform = `translate(-50%, -50%) translateX(${translateX}px) scale(${scale})`;
    card.style.opacity = String(opacity);
    card.style.zIndex = String(100 - Math.abs(offset));

    // Clicking the centered card goes to its project page.
    // Clicking a side card brings that project to the center instead.
    card.addEventListener('click', () => {
      if (isSelected) {
        goToProject(project.id);
      } else {
        selectedIndex = index;
        renderCarousel();
      }
    });

    track.appendChild(card);
  });

  const current = PROJECTS[selectedIndex];
  updateTitle(current.name);
  viewLink.href = `project.html?id=${current.id}`;
  updateBackdrop(current);
}

// Fades the title out, swaps the text once it's invisible, then fades
// it back in — skipped entirely for reduced-motion, where it's just
// an instant swap instead of a fade-then-flicker.
function updateTitle(name) {
  if (titleEl.textContent === name) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    titleEl.textContent = name;
    return;
  }

  titleEl.style.opacity = '0';
  setTimeout(() => {
    titleEl.textContent = name;
    titleEl.style.opacity = '1';
  }, 250);
}

// =====================================================
// Background slideshow
// The faded backdrop cycles through the selected project's hero
// render plus its 2nd and 3rd renders — panning each one exactly
// like before, holding briefly once the pan finishes, then
// crossfading to the next. Resets cleanly whenever a different
// project is selected; the carousel itself is untouched by any of
// this.
// =====================================================
let backdropImages = [];
let backdropIndex = 0;
let backdropTimer = null;
let backdropToken = 0; // lets a newly selected project cancel a stale, already-scheduled transition

const PAN_DURATION_MS = 24000; // must match the 24s set on .pan-horizontal/.pan-vertical below
const HOLD_AFTER_PAN_MS = 2000;
const HOLD_STATIONARY_MS = 4000;
const CROSSFADE_MS = 1200;
const BACKDROP_OPACITY = 0.15;
const ASPECT_MATCH_TOLERANCE = 0.08; // how close counts as "matches the viewport" (no need to pan)

function updateBackdrop(project) {
  backdropToken += 1;
  if (backdropTimer) clearTimeout(backdropTimer);

  // Hard reset: unmount whatever the previous project left behind
  // immediately, synchronously — not via a fade-out timer, which a
  // fast enough switch could outrun and leave stranded mid-fade.
  // This is what stops the old project's image from ghosting behind
  // the new one when you switch quickly.
  backdrop.querySelectorAll('img').forEach((img) => img.remove());

  backdropImages = [project.heroImage, project.renders[1]?.image, project.renders[2]?.image].filter(Boolean);

  backdropIndex = 0;
  showBackdropImage(backdropToken);
}

function showBackdropImage(token) {
  if (token !== backdropToken || !backdropImages.length) return;

  const img = document.createElement('img');
  img.alt = '';
  img.style.opacity = '0';

  img.addEventListener('error', () => {
    img.remove();
    if (token === backdropToken) advanceBackdrop(token, HOLD_AFTER_PAN_MS);
  });

  img.addEventListener('load', () => {
    if (token !== backdropToken) {
      img.remove(); // a newer project was selected while this was loading
      return;
    }

    const containerRect = backdrop.getBoundingClientRect();
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerRect.width / containerRect.height;
    const matchesViewport = Math.abs(imageAspect - containerAspect) / containerAspect < ASPECT_MATCH_TOLERANCE;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (matchesViewport || reducedMotion) {
      img.classList.remove('pan-horizontal', 'pan-vertical');
    } else {
      const isPortrait = img.naturalHeight > img.naturalWidth;
      img.classList.toggle('pan-vertical', isPortrait);
      img.classList.toggle('pan-horizontal', !isPortrait);
    }

    // Crossfade in over whatever was showing before, then discard it.
    // Grabs every leftover image, not just one — if switches ever
    // outpace the fade timing, this is what stops any of them from
    // being stranded at full opacity instead of fading out.
    const previousImages = backdrop.querySelectorAll('img');
    backdrop.appendChild(img);
    requestAnimationFrame(() => {
      img.style.opacity = String(BACKDROP_OPACITY);
    });

    previousImages.forEach((previous) => {
      previous.style.opacity = '0';
      setTimeout(() => previous.remove(), CROSSFADE_MS);
    });

    const holdTime = matchesViewport || reducedMotion ? HOLD_STATIONARY_MS : PAN_DURATION_MS + HOLD_AFTER_PAN_MS;
    advanceBackdrop(token, holdTime);
  });

  img.src = backdropImages[backdropIndex];
}

function advanceBackdrop(token, delay) {
  backdropTimer = setTimeout(() => {
    if (token !== backdropToken) return;
    backdropIndex = (backdropIndex + 1) % backdropImages.length;
    showBackdropImage(token);
  }, delay);
}

function goToProject(id) {
  window.location.href = `project.html?id=${id}`;
}

function showPrev() {
  selectedIndex = (selectedIndex - 1 + PROJECTS.length) % PROJECTS.length;
  renderCarousel();
}

function showNext() {
  selectedIndex = (selectedIndex + 1) % PROJECTS.length;
  renderCarousel();
}

prevBtn.addEventListener('click', showPrev);
nextBtn.addEventListener('click', showNext);

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showPrev();
  if (event.key === 'ArrowRight') showNext();
});

renderCarousel();
