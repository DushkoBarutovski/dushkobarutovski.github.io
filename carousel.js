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

// Horizontal distance between neighbouring cards, in px. Also how far
// the mouse has to be dragged to move the carousel by one project.
const CARD_SPACING = 255;

// Where a card sits, how big, and how visible, given how many places
// it is from the centre. `offset` can be fractional while dragging
// (e.g. 0.4 = 40% of the way to the next slot) — at whole numbers it
// gives exactly the same result as before dragging existed.
function getCardLayout(offset) {
  const distance = Math.abs(offset);
  let scale;
  let opacity;
  if (distance < 1) {
    // Blend between the centre card's look and its neighbours'.
    scale = 1.3 + (0.85 - 1.3) * distance;
    opacity = 1 + (0.45 - 1) * distance;
  } else {
    scale = Math.max(0.6, 1 - distance * 0.15);
    opacity = Math.max(0.25, 0.45 - (distance - 1) * 0.2);
  }
  return {
    transform: `translate(-50%, -50%) translateX(${offset * CARD_SPACING}px) scale(${scale})`,
    opacity: String(opacity),
    zIndex: String(Math.round(100 - distance * 10))
  };
}

// Same wrap-around as getCircularOffset (site.js), but allowing a
// fractional position so cards can sit between slots mid-drag.
function getFractionalOffset(index, position, total) {
  let offset = (((index - position) % total) + total) % total;
  if (offset > Math.floor(total / 2) + (total % 2 ? 0.5 : 0)) offset -= total;
  return offset;
}

function applyCardLayout(card, offset) {
  const layout = getCardLayout(offset);
  card.style.transform = layout.transform;
  card.style.opacity = layout.opacity;
  card.style.zIndex = layout.zIndex;
}

function renderCarousel() {
  cancelSettle();
  track.innerHTML = '';

  PROJECTS.forEach((project, index) => {
    const offset = getCircularOffset(index, selectedIndex, PROJECTS.length);
    const isSelected = offset === 0;

    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.appendChild(createProjectImage(project.heroImage, project.name, 'carousel-card-image'));
    const cardImg = card.querySelector('img');
    if (cardImg) cardImg.draggable = false; // no browser "ghost image" when dragging

    applyCardLayout(card, offset);

    // Clicking the centered card goes to its project page.
    // Clicking a side card brings that project to the center instead.
    card.addEventListener('click', () => {
      if (isSelected) {
        if (project.openable === false) return;
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
  }, 400);
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

const PAN_DURATION_MS = 10000; // must match the 24s set on .pan-horizontal/.pan-vertical below
const HOLD_AFTER_PAN_MS = 1000;
const HOLD_STATIONARY_MS = 2000;
const CROSSFADE_MS = 1200;
const BACKDROP_OPACITY = 0.15;
const ASPECT_MATCH_TOLERANCE = 0.08; // how close counts as "matches the viewport" (no need to pan)

// Background slideshow glitch — one unified transition burst that plays
// whenever the backdrop swaps to a new image (switching projects, or the
// slideshow advancing on its own). A single progress value (0 → 1 over
// GLITCH_DURATION_MS), read every animation frame, drives three things
// from that one number: how far the incoming image's pan gets knocked
// sideways, how much extra offset the shared chromatic-aberration filter
// gets, and how fast both decay back to normal — not three independent
// effects that merely happen to start at the same moment. These four
// numbers are the only knobs; nothing else needs to change to adjust
// the feel.
const GLITCH_DURATION_MS = 1000;       // stays within the 200–500ms asked for
const GLITCH_OFFSET_PX = 5;          // peak horizontal displacement of the panning image
const GLITCH_ABERRATION_BOOST_PX = 25; // extra dx the red/blue channels gain at peak, on top of their resting ∓6px
const GLITCH_SAFETY_SCALE = 1.001;     // brief safety zoom so the horizontal displacement never exposes an edge gap

const ABERRATION_REST_DX = 6; // must match the filter's resting dx values in index.html
const redOffsetEl = document.getElementById('chromatic-aberration-red-offset');
const blueOffsetEl = document.getElementById('chromatic-aberration-blue-offset');

let glitchFrame = null; // current requestAnimationFrame id, so a new glitch can cancel a still-running one
let glitchImage = null; // the <img> currently mid-glitch, so an interrupted burst knows what to clean up

function updateBackdrop(project) {
  backdropToken += 1;
  if (backdropTimer) clearTimeout(backdropTimer);

  // Hard reset: unmount whatever the previous project left behind
  // immediately, synchronously — not via a fade-out timer, which a
  // fast enough switch could outrun and leave stranded mid-fade.
  // This is what stops the old project's image from ghosting behind
  // the new one when you switch quickly. Same reasoning for the
  // glitch layer: cut it immediately rather than let a glitch that's
  // mid-animation for the old project finish showing the old image.
  backdrop.querySelectorAll('img').forEach((img) => img.remove());
  resetGlitch();

  // A video render has no `image`, so its `poster` stands in here.
  backdropImages = [
    project.heroImage,
    project.renders[1]?.image || project.renders[1]?.poster,
    project.renders[2]?.image || project.renders[2]?.poster
  ].filter(Boolean);

  backdropIndex = 0;
  showBackdropImage(backdropToken);
}

// Immediately cancels any in-progress glitch and snaps everything back
// to resting state: the mid-glitch image (if any) loses its inline
// transform, and the shared aberration filter returns to its resting
// ∓3px. Called both when a burst finishes naturally and when a new
// transition needs to cut a still-running one short — same reasoning as
// the hard image-removal above: a fast enough switch could otherwise
// leave the previous transition's distortion stranded mid-way through.
function resetGlitch() {
  if (glitchFrame) cancelAnimationFrame(glitchFrame);
  glitchFrame = null;

  if (glitchImage) {
    glitchImage.style.transform = '';
    glitchImage = null;
  }

  if (redOffsetEl && blueOffsetEl) {
    redOffsetEl.setAttribute('dx', String(-ABERRATION_REST_DX));
    blueOffsetEl.setAttribute('dx', String(ABERRATION_REST_DX));
  }
}

// Runs the unified glitch burst on the incoming image: one
// requestAnimationFrame loop computes a single intensity value each
// frame (1 at the moment the image changes, decaying to 0 well before
// GLITCH_DURATION_MS is up) and uses that same value to drive both the
// image's horizontal wobble and the aberration filter's extra offset —
// one shared timeline, not two effects that merely start together.
function triggerBackdropGlitch(img) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!redOffsetEl || !blueOffsetEl) return; // filter markup missing — skip rather than error

  resetGlitch(); // cut anything left over from the previous transition first
  glitchImage = img;

  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / GLITCH_DURATION_MS, 1);

    // Fast decay so the distortion is strongest right at the image
    // change and is essentially gone well before the burst officially
    // ends — this single curve is what both effects below read from.
    const intensity = Math.pow(1 - progress, 2);

    // A couple of quick alternating jumps that shrink as intensity
    // decays, rather than one smooth slide — reads as the pan being
    // interrupted and recovering, not a separate motion layered on it.
    // The brief safety scale keeps the displaced edge from ever
    // exposing a gap; it's only applied during the burst and cleared
    // immediately after, so the resting pan is untouched.
    const wobble = GLITCH_OFFSET_PX * intensity * Math.sin(progress * Math.PI * 3.2);
    img.style.transform = `scale(${GLITCH_SAFETY_SCALE}) translateX(${wobble.toFixed(2)}px)`;

    const aberrationDx = ABERRATION_REST_DX + GLITCH_ABERRATION_BOOST_PX * intensity;
    redOffsetEl.setAttribute('dx', String(-aberrationDx));
    blueOffsetEl.setAttribute('dx', String(aberrationDx));

    if (progress < 1) {
      glitchFrame = requestAnimationFrame(tick);
    } else {
      resetGlitch();
    }
  }

  glitchFrame = requestAnimationFrame(tick);
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
    triggerBackdropGlitch(img); // synced with the crossfade starting below
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

// =====================================================
// Drag (mouse and touch)
// Drag the carousel left/right — with the mouse on the cards, or with
// a finger anywhere on the landing area: the cards follow continuously,
// then glide to the nearest project when released (a quick flick
// carries on to the next one). A plain click/tap still works exactly as
// before, and up/down swipes on touch screens still scroll the page.
// =====================================================
const landingEl = document.querySelector('.landing');
const DRAG_THRESHOLD_PX = 6;   // movement before a press counts as a drag, not a click
const SETTLE_MS = 380;         // glide time after letting go
const FLICK_PROJECTION_MS = 160; // how far a fast flick "throws" the carousel

let dragState = null;
let settleFrame = null;
let suppressNextClick = false;

function cancelSettle() {
  if (settleFrame) cancelAnimationFrame(settleFrame);
  settleFrame = null;
  track.classList.remove('is-dragging');
}

function positionCards(position) {
  [...track.children].forEach((card, index) => {
    applyCardLayout(card, getFractionalOffset(index, position, PROJECTS.length));
  });
}

function wrapIndex(i) {
  const n = PROJECTS.length;
  return ((Math.round(i) % n) + n) % n;
}

// Glides from a fractional position to the whole-number target, then
// hands over to renderCarousel so the title, "More" link, and
// background update exactly as they do for the arrows.
function settleTo(from, target) {
  cancelSettle();
  const start = performance.now();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 0 : SETTLE_MS;

  function tick(now) {
    const t = duration ? Math.min((now - start) / duration, 1) : 1;
    const eased = 1 - Math.pow(1 - t, 3); // ease-out
    positionCards(from + (target - from) * eased);
    if (t < 1) {
      settleFrame = requestAnimationFrame(tick);
    } else {
      settleFrame = null;
      track.classList.remove('is-dragging');
      selectedIndex = wrapIndex(target);
      renderCarousel();
    }
  }
  settleFrame = requestAnimationFrame(tick);
}

landingEl.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  const isMouse = event.pointerType === 'mouse';
  // Mouse: drag starts on the cards. Touch: anywhere on the landing
  // area (as the old swipe did), except on buttons and links, which
  // keep their normal tap.
  if (isMouse && !track.contains(event.target)) return;
  if (!isMouse && event.target.closest('button, a')) return;

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startPosition: selectedIndex,
    position: selectedIndex,
    dragging: false,
    lastX: event.clientX,
    lastTime: performance.now(),
    velocity: 0 // px per ms
  };
});

landingEl.addEventListener('pointermove', (event) => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const dx = event.clientX - dragState.startX;

  if (!dragState.dragging) {
    // A mostly-vertical movement is the page scrolling, not a drag.
    if (Math.abs(event.clientY - dragState.startY) > Math.abs(dx) &&
        Math.abs(event.clientY - dragState.startY) >= DRAG_THRESHOLD_PX) {
      dragState = null;
      return;
    }
    if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    dragState.dragging = true;
    cancelSettle();
    try {
      landingEl.setPointerCapture(event.pointerId); // keep following even if the pointer leaves the carousel
    } catch (e) {
      // capture isn't essential — dragging still works without it
    }
    track.classList.add('is-dragging');
  }

  const now = performance.now();
  const dt = now - dragState.lastTime;
  if (dt > 0) {
    // Smoothed so one jittery frame doesn't decide the flick.
    dragState.velocity = 0.7 * ((event.clientX - dragState.lastX) / dt) + 0.3 * dragState.velocity;
  }
  dragState.lastX = event.clientX;
  dragState.lastTime = now;

  // Dragging left brings the next project in from the right.
  dragState.position = dragState.startPosition - dx / CARD_SPACING;
  positionCards(dragState.position);
});

function endDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const state = dragState;
  dragState = null;
  if (!state.dragging) return; // a plain click — let it through untouched

  suppressNextClick = true; // the release shouldn't also "click" a card
  setTimeout(() => { suppressNextClick = false; }, 0);

  // If the mouse stopped before letting go, there's no flick.
  const idle = performance.now() - state.lastTime > 80;
  const velocity = idle ? 0 : state.velocity;
  const projected = state.position - (velocity * FLICK_PROJECTION_MS) / CARD_SPACING;
  settleTo(state.position, Math.round(projected));
}

landingEl.addEventListener('pointerup', endDrag);
landingEl.addEventListener('pointercancel', endDrag);

// Swallow the click that follows a drag, before it reaches a card.
track.addEventListener('click', (event) => {
  if (suppressNextClick) {
    event.stopPropagation();
    event.preventDefault();
    suppressNextClick = false;
  }
}, true);

track.addEventListener('dragstart', (event) => event.preventDefault());


// (The old touch swipe that lived here is replaced by the drag above,
// which now handles touch too — see "Drag (mouse and touch)".)

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') showPrev();
  if (event.key === 'ArrowRight') showNext();

  if (event.key === 'Enter') {
    const project = PROJECTS[selectedIndex];
  
    if (project.openable === false) return;
  
    goToProject(project.id);
  }
});

renderCarousel();
