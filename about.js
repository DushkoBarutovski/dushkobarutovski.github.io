// =====================================================
// Contact form (About page)
// Placeholder only — doesn't send anywhere yet. Swap this for a
// real service (Formspree and EmailJS are both free and
// beginner-friendly) or your own backend when you're ready.
// =====================================================
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.textContent = "Thanks! This form isn't connected to anything yet — we'll wire it up later.";
  contactForm.reset();
});
