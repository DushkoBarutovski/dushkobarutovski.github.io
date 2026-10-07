// =====================================================
// Contact form (About page)
// Placeholder only — doesn't send anywhere yet. Swap this for a
// real service (Formspree and EmailJS are both free and
// beginner-friendly) or your own backend when you're ready.
// =====================================================
//const contactForm = document.getElementById('contact-form');
//const formStatus = document.getElementById('form-status');

//const contactForm = document.getElementById('contact-form');

//if (contactForm) {
//  contactForm.addEventListener('submit', (event) => {
//    // Let the form submit normally to Web3Forms.
//  });
//}

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    formStatus.textContent = '';

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: {
          Accept: 'application/json'
        }
      });

      if (response.ok) {
        formStatus.textContent = 'Thanks! Your message has been sent.';
        contactForm.reset();
      } else {
        formStatus.textContent =
          'Sorry, something went wrong. Please try again.';
      }
    } catch (error) {
      formStatus.textContent =
        'Sorry, something went wrong. Please try again.';
    }

    submitButton.disabled = false;
    submitButton.textContent = 'Send message';
  });
}