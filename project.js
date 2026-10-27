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
let currentVideo = null; // the <video> currently in the viewer, if this render is a video
let videoMuted = true;   // remembered between videos for this visit (starts muted so autoplay is allowed)

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

// Keep in sync with the phone-layout media query in style.css
// (narrow screens, plus phones held sideways).
const mobileQuery = window.matchMedia('(max-width: 700px), (max-height: 500px) and (orientation: landscape)');
// Rotating a phone/tablet can switch layouts — rebuild the thumbnails
// for the new one straight away.
mobileQuery.addEventListener('change', () => renderThumbnails());

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
  stopCurrentVideo();
  const isVideo = Boolean(render.video);
  document.body.classList.toggle('viewing-video', isVideo);
  if (isVideo && document.body.classList.contains('fit-width')) {
    setFitWidth(false); // fit-width is image-only; its button hides for videos
  }
  // Only the previous backdrop/image (or missing-render label) are
  // cleared here — #render-progress is a static child of this same
  // element (see project.html) that persists across renders so its
  // marker can transition smoothly instead of popping to a new
  // position every time.
  viewerEl.querySelectorAll('.render-backdrop, .render-main-image, .render-missing-label, .video-controls').forEach((el) => el.remove());

  // A blurred copy of the same image fills the space around a
  // portrait render instead of leaving plain white on the sides —
  // a simple stand-in for "matching colours" that works for any image.
  const renderBackdrop = document.createElement('div');
  renderBackdrop.className = 'render-backdrop';

  if (isVideo) {
    showVideo(render, renderBackdrop);
    descriptionText.textContent = render.description;
    renderThumbnails();
    updateProgressIndicator();
    return;
  }

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

// =====================================================
// Video renders
// A render with `video` (instead of `image`) plays here: autoplays
// muted and looping, like the GIFs, with a small control bar for
// play/pause, scrubbing, time, and sound. Its `poster` is used for
// the thumbnail, the blurred backdrop, and the frame shown while the
// video loads. Magnifier and fit-width don't apply to video, so
// their buttons hide while one is selected (see style.css).
// =====================================================
const ICON_PLAY = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>';
const ICON_PAUSE = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="3.5" height="14" rx="1"></rect><rect x="14" y="5" width="3.5" height="14" rx="1"></rect></svg>';
const ICON_SOUND_ON = '<svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"></path><path d="M15.5 9a4 4 0 0 1 0 6"></path><path d="M18 6.5a7.5 7.5 0 0 1 0 11"></path></svg>';
const ICON_SOUND_OFF = '<svg class="icon icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"></path><line x1="16" y1="9.5" x2="21" y2="14.5"></line><line x1="21" y1="9.5" x2="16" y2="14.5"></line></svg>';

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Fully stops the outgoing video — a removed <video> can otherwise
// keep downloading (or even keep playing its sound) in some browsers.
function stopCurrentVideo() {
  if (!currentVideo) return;
  currentVideo.pause();
  currentVideo.removeAttribute('src');
  currentVideo.load();
  currentVideo = null;
  viewerEl.classList.remove('video-paused');
}

function toggleVideoPlay() {
  if (!currentVideo) return;
  if (currentVideo.paused) {
    currentVideo.play().catch(() => {});
  } else {
    currentVideo.pause();
  }
}

function showVideo(render, renderBackdrop) {
  currentImage = null; // nothing for the magnifier to zoom into

  const video = document.createElement('video');
  video.className = 'render-main-image render-main-video';
  video.muted = videoMuted;
  video.defaultMuted = videoMuted;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  if (render.poster) video.poster = render.poster;
  video.src = render.video;
  video.setAttribute('aria-label', `${project.name} — render ${renderIndex + 1} (video)`);
  currentVideo = video;

  if (render.poster) {
    renderBackdrop.style.backgroundImage = `url(${render.poster})`;
    renderBackdrop.classList.add('active');
  }

  video.addEventListener('error', () => {
    if (currentVideo !== video) return;
    stopCurrentVideo();
    viewerEl.classList.add('img-missing');
    viewerEl.querySelectorAll('.render-backdrop, .render-main-image, .video-controls').forEach((el) => el.remove());
    const missingLabel = document.createElement('span');
    missingLabel.className = 'render-missing-label';
    missingLabel.textContent = `${project.name} — render ${renderIndex + 1}`;
    viewerEl.appendChild(missingLabel);
  });

  // ----- Control bar -----
  const controls = document.createElement('div');
  controls.className = 'video-controls';

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'video-btn video-play';

  const seek = document.createElement('input');
  seek.type = 'range';
  seek.className = 'video-seek';
  seek.min = '0';
  seek.max = '1000';
  seek.step = '1';
  seek.value = '0';
  seek.setAttribute('aria-label', 'Seek');

  const time = document.createElement('span');
  time.className = 'video-time';
  time.textContent = '0:00 / 0:00';

  const muteBtn = document.createElement('button');
  muteBtn.type = 'button';
  muteBtn.className = 'video-btn video-mute';

  controls.append(playBtn, seek, time, muteBtn);

  // Clicks, keys, and touches on the bar belong to the bar only — they
  // must not also reach the viewer (fullscreen / swipe) or the page's
  // arrow-key render navigation.
  ['click', 'keydown', 'touchstart', 'touchmove', 'touchend'].forEach((type) => {
    controls.addEventListener(type, (event) => event.stopPropagation(), { passive: type.startsWith('touch') });
  });

  function updatePlayButton() {
    const paused = video.paused;
    playBtn.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
    playBtn.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
    viewerEl.classList.toggle('video-paused', paused);
  }

  function updateMuteButton() {
    muteBtn.innerHTML = video.muted ? ICON_SOUND_OFF : ICON_SOUND_ON;
    muteBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
  }

  let seeking = false;
  function updateTime() {
    const duration = video.duration;
    time.textContent = `${formatTime(video.currentTime)} / ${formatTime(duration)}`;
    if (!seeking && isFinite(duration) && duration > 0) {
      seek.value = String(Math.round((video.currentTime / duration) * 1000));
    }
    seek.style.setProperty('--seek-fill', `${(Number(seek.value) / 10).toFixed(1)}%`);
  }

  playBtn.addEventListener('click', toggleVideoPlay);

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    videoMuted = video.muted;
    updateMuteButton();
  });

  seek.addEventListener('input', () => {
    seeking = true;
    if (isFinite(video.duration)) {
      video.currentTime = (Number(seek.value) / 1000) * video.duration;
    }
    updateTime();
  });
  seek.addEventListener('change', () => { seeking = false; });

  video.addEventListener('play', updatePlayButton);
  video.addEventListener('pause', updatePlayButton);
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('loadedmetadata', updateTime);
  video.addEventListener('volumechange', updateMuteButton);

  updatePlayButton();
  updateMuteButton();

  viewerEl.appendChild(renderBackdrop);
  viewerEl.appendChild(video);
  viewerEl.appendChild(controls);

  // If the browser refuses to autoplay with sound (most do until the
  // visitor has interacted), fall back to muted rather than not playing.
  const attempt = video.play();
  if (attempt && attempt.catch) {
    attempt.catch(() => {
      if (currentVideo !== video) return;
      video.muted = true;
      videoMuted = true;
      video.play().catch(() => updatePlayButton());
    });
  }
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
    if (render.video) {
      thumb.classList.add('is-video');
      const badge = document.createElement('span');
      badge.className = 'render-thumb-play';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = ICON_PLAY;
      thumb.appendChild(badge);
    }
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
// True when a pointer position lands on the render's actual pixels,
// not the blurred letterbox around it (object-fit: contain makes the
// <img> box bigger than the picture — same math as the magnifier).
// With no loaded image (e.g. the "missing" placeholder) the whole
// viewer counts, as before.
function isPointOverImage(clientX, clientY) {
  const media = currentImage || currentVideo;
  const mediaWidth = media && (media.naturalWidth || media.videoWidth);
  const mediaHeight = media && (media.naturalHeight || media.videoHeight);
  if (!mediaWidth || !mediaHeight) return true;

  const box = media.getBoundingClientRect();
  const imageAspect = mediaWidth / mediaHeight;
  let renderedWidth = box.width;
  let renderedHeight = box.height;
  if (imageAspect > box.width / box.height) {
    renderedHeight = box.width / imageAspect;
  } else {
    renderedWidth = box.height * imageAspect;
  }
  const left = box.left + (box.width - renderedWidth) / 2;
  const top = box.top + (box.height - renderedHeight) / 2;

  return clientX >= left && clientX <= left + renderedWidth &&
         clientY >= top && clientY <= top + renderedHeight;
}

function handleViewerActivate(event) {  //delete this if touch doesn't work, along with the touch code
  if (suppressNextViewerClick) {
    suppressNextViewerClick = false;
    return;
  }

  // Only a click on the picture itself acts on it. A click on the
  // area around it does nothing in the normal page view, and closes
  // the fullscreen preview (same as the × button). Keyboard
  // (Enter/Space) has no pointer position, so it still always works.
  if (
    event && event.type === 'click' &&
    !isPointOverImage(event.clientX, event.clientY)
  ) {
    if (document.body.classList.contains('image-expanded')) {
      setExpanded(false);
    }
    return;
  }

  if (document.body.classList.contains('image-expanded')) {
    if (currentVideo) {
      toggleVideoPlay(); // no fit-width for video — the click plays/pauses instead
    } else {
      setFitWidth(!document.body.classList.contains('fit-width'));
    }
  } else {
    setExpanded(true);
  }
}

viewerEl.addEventListener('click', handleViewerActivate);

// Pointer cursor only over the picture in the normal view, so the
// hint matches what a click will actually do.
viewerEl.addEventListener('mousemove', (event) => {
  viewerEl.classList.toggle('off-image', !isPointOverImage(event.clientX, event.clientY));
});

viewerEl.addEventListener('mouseleave', () => viewerEl.classList.remove('off-image'));

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
// Swipe Up   → next render
// Swipe Down → previous render
//
// Single-finger vertical swipes are handled.
// Multi-touch gestures (pinch/zoom) are ignored.
// =====================================================

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchTracking = false;
let swipeLocked = false;
let suppressNextViewerClick = false;

viewerEl.addEventListener(
  'touchstart',
  (event) => {
    // Ignore multi-touch immediately.
    if (event.touches.length !== 1) {
      touchTracking = false;
      swipeLocked = false;
      return;
    }

    const touch = event.touches[0];

    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();

    touchTracking = true;
    swipeLocked = false;
    suppressNextViewerClick = false;
  },
  { passive: true }
);

viewerEl.addEventListener(
  'touchmove',
  (event) => {
    // Second finger = pinch/zoom.
    // Completely abandon swipe handling.
    if (event.touches.length !== 1) {
      touchTracking = false;
      swipeLocked = false;
      return;
    }

    if (!touchTracking) return;

    const touch = event.touches[0];

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    // Once the movement is clearly vertical,
    // take control away from normal page scrolling.
    if (
      !swipeLocked &&
      verticalDistance >= 10 &&
      verticalDistance >= horizontalDistance * 1.2
    ) {
      swipeLocked = true;
    }

    if (swipeLocked) {
      event.preventDefault();
    }
  },
  { passive: false }
);

viewerEl.addEventListener(
  'touchend',
  (event) => {
    if (!touchTracking) {
      swipeLocked = false;
      return;
    }

    // If another finger is still involved, this was
    // a multi-touch gesture, not a swipe.
    if (event.touches.length > 0) {
      touchTracking = false;
      swipeLocked = false;
      return;
    }

    const touch = event.changedTouches[0];

    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    const elapsed = Date.now() - touchStartTime;

    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    touchTracking = false;
    swipeLocked = false;

    // Must be reasonably quick.
    if (elapsed > 600) return;

    // Must move far enough to be intentional.
    if (verticalDistance < 50) return;

    // Vertical movement must clearly dominate.
    if (verticalDistance < horizontalDistance * 1.2) return;

    // Prevent the swipe from also triggering fullscreen.
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
    swipeLocked = false;
  },
  { passive: true }
);