// =====================================================
// Temporary password gate
// A soft, client-side "keep casual visitors out while I'm still
// working on this" gate — NOT real security. This is a static site,
// so the real page ships to every visitor's browser regardless of
// this script; it only hides it visually until the right password
// is entered. Anyone who opens dev tools, disables JavaScript, or
// views the page source can see past it. That's fine for keeping an
// unfinished site from being stumbled on or shared before you're
// ready — it's not for anything that actually needs to stay private.
//
// TO CHANGE THE PASSWORD: edit SITE_PASSWORD below.
//
// TO REMOVE THE GATE: set GATE_ENABLED to false below. That's the
// only change needed anywhere — every page reveals itself normally
// and the gate never shows again. (You can also delete this file's
// <script> tag and the #password-gate markup from each HTML page
// and remove `gate-locked` from <body>, but the flag is quicker and
// easy to reverse if you change your mind.) Also remove the
// <meta name="robots" content="noindex, nofollow"> line from each
// page's <head> at the same time — that one's what's telling search
// engines not to index the site while it's gated.
// =====================================================
const GATE_ENABLED = true;
const SITE_PASSWORD = '1n33daw3bs1te';
const STORAGE_KEY = 'site-password-ok';

function unlockGate() {
  document.body.classList.remove('gate-locked');
}

if (!GATE_ENABLED || localStorage.getItem(STORAGE_KEY) === 'yes') {
  unlockGate();
} else {
  const form = document.getElementById('password-gate-form');
  const input = document.getElementById('password-gate-input');
  const errorText = document.getElementById('password-gate-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (input.value === SITE_PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, 'yes');
      } catch (e) {
        // Private browsing or similar — the gate still opens for
        // this visit, it just won't be remembered next time.
      }
      unlockGate();
    } else {
      errorText.textContent = "That's not it — try again.";
      input.value = '';
      input.focus();
    }
  });
}
