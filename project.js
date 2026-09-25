// =====================================================
// Project detail page
// Reads ?id=... from the URL to find the right project in
// PROJECTS (data.js), then displays its renders one at a time
// alongside the project's story and a per-render description.
// =====================================================
const params = new URLSearchParams(window.location.search);
const requestedId = params.get('id');
const project = PROJECTS.find((p) => p.id === requestedId) || PROJECTS[0];

let renderIndex = 0;
let currentImage = null; // the <img> currently in the viewer, used by the magnifier below

const titleEl = document.getElementById('project-title');
const storyText = document.getElementById('story-text');
const descriptionText = document.getElementById('render-description');
const viewerEl = document.getElementById('render-viewer');
const progressStart = document.getElementById('render-progress-start');
const progressEnd = document.getElementById('render-progress-end');
const progressFill = document.getElementById('render-progress-fill');
const progressMarker = document.getElementById('render-progress-marker');
const thumbTrack = document.getElementById('render-thumb-track');
const thumbViewport = document.getElementById('render-thumb-viewport');
const prevBtn = document.getElementById('render-prev');
const nextBtn = document.getElementById('render-next');

const mobileQuery = window.matchMedia('(max-width: 700px)');

prevBtn.addEventListener('click', () => {
  showRender(renderIndex - 1);
});

nextBtn.addEventListener('click', () => {
  showRender(renderIndex + 1);
});

function init() {
  document.title = `${project.name} | Dushko Barutovski`;
  titleEl.textContent = project.name;
  storyText.textContent = project.story;
  showRender(0);
}

function showRender(index) {
  const total = project.renders.length;
  renderIndex = ((index % total) + total) % total;
  const render = project.renders[renderIndex];

  viewerEl.classList.remove('img-missing');
  // Only the previous backdrop/image (or missing-render label) are
  // cleared here — #render-progress is a static child of this same
  // element (see project.html) that persists across renders so its
  // marker can transition smoothly instead of popping to a new
  // position every time.
  viewerEl.querySelectorAll('.render-backdrop, .render-main-image, .render-missing-label').forEach((el) => el.remove());

  // A blurred copy of the same image fills the space around a
  // portrait render instead of leaving plain white on the sides —
  // a simple stand-in for "matching colours" that works for any image.
  const renderBackdrop = document.createElement('div');
  renderBackdrop.className = 'render-backdrop';

  const img = document.createElement('img');
  img.className = 'render-main-image';
  img.src = render.image;
  img.alt = `${project.name} — render ${renderIndex + 1}`;
  currentImage = img;

  img.addEventListener('load', () => {
    renderBackdrop.style.backgroundImage = `url(${render.image})`;
    renderBackdrop.classList.add('active');
  });

  img.addEventListener('error', () => {
    viewerEl.classList.add('img-missing');
    renderBackdrop.remove();
    img.remove();
    const missingLabel = document.createElement('span');
    missingLabel.className = 'render-missing-label';
    missingLabel.textContent = `${project.name} — render ${renderIndex + 1}`;
    viewerEl.appendChild(missingLabel);
  });

  viewerEl.appendChild(renderBackdrop);
  viewerEl.appendChild(img);

  descriptionText.textContent = render.description;
  renderThumbnails();
  updateProgressIndicator();
}

// Zero-pads a 1-based render number for the indicator's labels.
function padIndex(n) {
  return String(n).padStart(2, '0');
}

// Purely visual readout of where the current render sits within
// project.renders — reads the same renderIndex/project.renders that
// drive everything else (thumbnails, arrows, keyboard), so it can't
// drift out of sync with them; there's no separate index state here.
function updateProgressIndicator() {
  const total = project.renders.length;
  progressStart.textContent = padIndex(renderIndex + 1);
  progressEnd.textContent = padIndex(total);

  // Guards the total === 1 case (would otherwise divide by zero) by
  // just pinning the marker to the start — there's nowhere else for
  // a single render to sit.
  const fraction = total > 1 ? renderIndex / (total - 1) : 0;
  const percent = `${fraction * 100}%`;
  progressFill.style.width = percent;
  progressMarker.style.left = percent;
}

// How many thumbnail slots the desktop picker shows at once — a
// small, fixed amount, independent of how many renders the project
// actually has.
const VISIBLE_THUMB_COUNT = 7;
const THUMB_WINDOW_HALF = Math.floor(VISIBLE_THUMB_COUNT / 2);

// Renders the picker on the left. On desktop this is a vertical
// coverflow — same idea as the landing page carousel (and reusing
// its circular-distance math, getCircularOffset in site.js), but
// running up and down: the selected render always centers, and
// wraps seamlessly past either end since navigation itself does
// (see showRender). Only renders within THUMB_WINDOW_HALF steps of
// the selected one (at most 5, fewer if the project has fewer
// renders than that) are ever built here, so a project with many
// renders still can't push the stack past its allotted height. That
// windowing doesn't apply on narrow screens: mobile falls back to a
// plain scrollable row of every render, sized evenly.
function renderThumbnails() {
  thumbTrack.innerHTML = '';
  const isMobile = mobileQuery.matches;
  const total = project.renders.length;

  thumbViewport.classList.remove('has-more');

  let visible = project.renders.map((render, index) => ({ render, index }));

  if (!isMobile) {
    visible = visible.filter(
      ({ index }) => Math.abs(getCircularOffset(index, renderIndex, total)) <= THUMB_WINDOW_HALF
    );

    if (visible.length < total) {
      thumbViewport.classList.add('has-more');
    }
  }

  visible.forEach(({ render, index }) => {
    const thumb = document.createElement('div');
    thumb.className = 'render-thumb';
    // A render can optionally set `poster` — a static image shown here
    // instead of `image`. There's no way to tell a GIF's <img> to not
    // animate, so this is how an animated render (see showRender,
    // which always uses the real `image`) gets a still thumbnail
    // instead of every thumbnail in the stack playing at once. Renders
    // without a poster just use their own image, exactly as before.
    thumb.appendChild(createProjectImage(render.poster || render.image, `${project.name} — render ${index + 1}`, 'render-thumb-image'));
    thumb.addEventListener('click', () => showRender(index));

    if (isMobile) {
      thumb.classList.toggle('selected', index === renderIndex);
    } else {
      const offset = getCircularOffset(index, renderIndex, total);
      const isSelected = offset === 0;
      const translateY = offset * 90;
      const scale = isSelected ? 1 : Math.max(0.7, 1 - Math.abs(offset) * 0.15);
      const opacity = isSelected ? 1 : Math.max(0.25, 0.45 - (Math.abs(offset) - 1) * 0.2);

      thumb.classList.toggle('selected', isSelected);
      thumb.style.transform = `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`;
      thumb.style.opacity = String(opacity);
      thumb.style.zIndex = String(100 - Math.abs(offset));
    }

    thumbTrack.appendChild(thumb);
  });
}

// =====================================================
// Keyboard navigation
// Arrow Up / Arrow Down navigate between renders.
// Backspace goes back to the previous browser page.
// =====================================================
document.addEventListener('keydown', (event) => {
  // Arrow Up → previous render
  if (event.key === 'ArrowUp') {
    event.preventDefault(); // stop the page from scrolling too
    showRender(renderIndex - 1);
    return;
  }

  // Arrow Down → next render
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    showRender(renderIndex + 1);
    return;
  }

  // Backspace → previous browser page
  if (event.key === 'Backspace') {
    // Don't interfere with typing in inputs, textareas, selects, etc.
    const tag = document.activeElement?.tagName;
    const isTyping =
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      document.activeElement?.isContentEditable;

    if (isTyping) return;

    event.preventDefault();
    window.history.back();
  }
});


// =====================================================
// Info panel (Story / About this render)
// Hovering the handle previews it (pure CSS, see style.css).
// Clicking the handle "locks" it open so it stays visible without
// needing to keep the mouse there — clicking again unlocks it.
// =====================================================
const infoToggle = document.getElementById('info-toggle');
const infoHandle = document.getElementById('info-handle');

infoHandle.addEventListener('click', () => {
  const isLocked = infoToggle.classList.toggle('locked');
  infoHandle.setAttribute('aria-expanded', String(isLocked));
});

// =====================================================
// Magnifier
// Toggle on: the cursor over the image becomes a floating lens
// showing the render at its native resolution. Magnification isn't
// a fixed number — it's derived per-image from how much bigger the
// source file is than its current displayed size, so a high-res
// render zooms in further than a smaller one, and the lens is never
// upscaling past the image's real pixels.
// =====================================================
const magnifierToggle = document.getElementById('magnifier-toggle');
const magnifierLens = document.getElementById('magnifier-lens');
const LENS_SIZE = 400; // keep this in sync with the size set in style.css

let magnifierOn = false;

function clampRange(value, min, max) {
  if (min > max) return (min + max) / 2; // image smaller than the lens itself
  return Math.min(Math.max(value, min), max);
}

function hideLens() {
  magnifierLens.classList.remove('visible');
}

magnifierToggle.addEventListener('click', () => {
  magnifierOn = !magnifierOn;
  magnifierToggle.classList.toggle('active', magnifierOn);
  magnifierToggle.setAttribute('aria-pressed', String(magnifierOn));
  magnifierToggle.setAttribute(
    'aria-label',
    magnifierOn ? 'Turn off the image magnifier' : 'Turn on the image magnifier'
  );
  viewerEl.classList.toggle('magnifier-active', magnifierOn);

  if (!magnifierOn) {
    hideLens();
    viewerEl.style.cursor = ''; // clear any leftover inline override
  }
});

viewerEl.addEventListener('mousemove', (event) => {
  if (!magnifierOn || !currentImage || !currentImage.naturalWidth) {
    hideLens();
    return;
  }

  // object-fit: contain can letterbox the image inside its own box,
  // so work out where the pixels are actually drawn first.
  const box = currentImage.getBoundingClientRect();
  const imageAspect = currentImage.naturalWidth / currentImage.naturalHeight;
  const boxAspect = box.width / box.height;

  let renderedWidth = box.width;
  let renderedHeight = box.height;
  if (imageAspect > boxAspect) {
    renderedHeight = box.width / imageAspect;
  } else {
    renderedWidth = box.height * imageAspect;
  }
  const offsetX = (box.width - renderedWidth) / 2;
  const offsetY = (box.height - renderedHeight) / 2;

  const relX = event.clientX - box.left - offsetX;
  const relY = event.clientY - box.top - offsetY;

  // Cursor is over the letterboxed area, not the image itself —
  // nothing meaningful to zoom into there, so fall back to a visible
  // cursor instead of leaving nothing showing at all.
  if (relX < 0 || relY < 0 || relX > renderedWidth || relY > renderedHeight) {
    hideLens();
    viewerEl.style.cursor = '';
    return;
  }

  // Map the cursor's position on the DISPLAYED image to a pixel
  // position on the NATIVE image — this ratio is the magnification.
  const fracX = relX / renderedWidth;
  const fracY = relY / renderedHeight;
  const nativeX = fracX * currentImage.naturalWidth;
  const nativeY = fracY * currentImage.naturalHeight;

  // Clamp so the lens always shows a full window of real pixels,
  // even right at the edge or in a corner of the image.
  const windowLeft = clampRange(nativeX - LENS_SIZE / 2, 0, currentImage.naturalWidth - LENS_SIZE);
  const windowTop = clampRange(nativeY - LENS_SIZE / 2, 0, currentImage.naturalHeight - LENS_SIZE);

  magnifierLens.style.backgroundImage = `url(${currentImage.src})`;
  magnifierLens.style.backgroundSize = `${currentImage.naturalWidth}px ${currentImage.naturalHeight}px`;
  magnifierLens.style.backgroundPosition = `${-windowLeft}px ${-windowTop}px`;
  viewerEl.style.cursor = 'none'; // the lens is the pointer here

  // Now that the lens is fixed-positioned, its coordinates are just
  // the raw viewport position — correct in both the normal view and
  // fullscreen, since it no longer depends on where .render-stage
  // happens to be.
  magnifierLens.style.left = `${event.clientX - LENS_SIZE / 2}px`;
  magnifierLens.style.top = `${event.clientY - LENS_SIZE / 2}px`;
  magnifierLens.classList.add('visible');
});

viewerEl.addEventListener('mouseleave', () => {
  hideLens();
  viewerEl.style.cursor = '';
});

// =====================================================
// Fullscreen render view
// Clicking the render (or pressing Enter/Space on it) expands it to
// fill the whole browser window and hides the rest of the page —
// thumbnail stack included, per the brief. Click it again, use the
// close button, or press Escape to go back.
// =====================================================
const viewerCloseBtn = document.getElementById('viewer-close');
const viewerFitToggle = document.getElementById('viewer-fit-toggle');

function updateViewerLabel() {
  const expanded = document.body.classList.contains('image-expanded');
  const fitWidth = document.body.classList.contains('fit-width');

  if (!expanded) {
    viewerEl.setAttribute('aria-label', 'Expand render to fill the screen');
  } else {
    // Matches whatever clicking the image will now do — see
    // handleViewerActivate below.
    viewerEl.setAttribute('aria-label', fitWidth ? 'Show entire render' : 'Fit render to screen width');
  }
}

function setFitWidth(fitWidth) {
  document.body.classList.toggle('fit-width', fitWidth);
  viewerFitToggle.classList.toggle('active', fitWidth);
  viewerFitToggle.setAttribute('aria-pressed', String(fitWidth));
  viewerFitToggle.setAttribute('aria-label', fitWidth ? 'Show entire render' : 'Fit render to screen width');
  viewerEl.scrollTop = 0; // always start at the top of the image when this mode changes
  updateViewerLabel();
}

function setExpanded(expanded) {
  document.body.classList.toggle('image-expanded', expanded);
  viewerEl.setAttribute('aria-pressed', String(expanded));
  updateViewerLabel();

  // Belt-and-suspenders: whatever caused any scroll drift, always land
  // back at the true top of the page — this is what stops the render
  // from ending up positioned under the header on the way out.
  window.scrollTo(0, 0);

  if (!expanded) {
    setFitWidth(false); // start fresh next time fullscreen opens
    if (magnifierOn) {
      magnifierToggle.click(); // resets its state, icon, and aria attributes consistently
    }
  }
}

// Clicking (or pressing Enter/Space on) the render does one of two
// things depending on where you already are: from the normal view it
// opens fullscreen, same as before. Once you're already viewing it
// fullscreen, the same click instead toggles fit-width — the button
// keeps doing the exact same thing, this just gives the image itself
// a second way to trigger it. Closing fullscreen stays on the ×
// button and Escape, so that action isn't lost in the process.
function handleViewerActivate() {  //delete this if touch doesn't work, along with the touch code
  if (suppressNextViewerClick) {
    suppressNextViewerClick = false;
    return;
  }

  if (document.body.classList.contains('image-expanded')) {
    setFitWidth(!document.body.classList.contains('fit-width'));
  } else {
    setExpanded(true);
  }
}

viewerEl.addEventListener('click', handleViewerActivate);

viewerEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault(); // stop space from also scrolling the page
    handleViewerActivate();
  }
});

viewerCloseBtn.addEventListener('click', () => setExpanded(false));

viewerFitToggle.addEventListener('click', () => {
  setFitWidth(!document.body.classList.contains('fit-width'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('image-expanded')) {
    setExpanded(false);
  }
});

init();

// =====================================================
// Touch / Swipe navigation
//
// Quick vertical swipe → change render
// Slow drag / hold     → normal page scrolling
// Pinch                 → ignored
// =====================================================

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchTracking = false;
let suppressNextViewerClick = false;

viewerEl.addEventListener(
  'touchstart',
  (event) => {
    // Ignore multi-touch / pinch.
    if (event.touches.length !== 1) {
      touchTracking = false;
      return;
    }

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();

    touchTracking = true;
    suppressNextViewerClick = false;
  },
  { passive: true }
);

viewerEl.addEventListener(
  'touchend',
  (event) => {
    if (!touchTracking) return;

    // Ignore pinch / multi-touch.
    if (event.touches.length > 0) {
      touchTracking = false;
      return;
    }

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    const elapsed = Date.now() - touchStartTime;

    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    touchTracking = false;

    // Must be a QUICK gesture.
    if (elapsed > 500) return;

    // Must travel far enough.
    if (verticalDistance < 60) return;

    // Must clearly be vertical.
    if (verticalDistance < horizontalDistance * 1.3) return;

    // Don't let the swipe also trigger fullscreen.
    suppressNextViewerClick = true;

    if (deltaY < 0) {
      // Swipe Up → next render
      showRender(renderIndex + 1);
    } else {
      // Swipe Down → previous render
      showRender(renderIndex - 1);
    }
  },
  { passive: true }
);

viewerEl.addEventListener(
  'touchcancel',
  () => {
    touchTracking = false;
  },
  { passive: true }
);