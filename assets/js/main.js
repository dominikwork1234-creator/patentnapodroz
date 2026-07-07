// Patent na Podróż v3
const burger = document.getElementById('burger');
const nav = document.getElementById('mainNav');
if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    burger.classList.remove('open');
  }));
}

const form = document.getElementById('contact-form');
const msg = document.getElementById('form-message');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.access_key || data.access_key === 'YOUR_WEB3FORMS_KEY_HERE') {
      msg.textContent = form.dataset.errorMessage;
      msg.className = 'form-message error';
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const j = await r.json();
      msg.textContent = j.success ? form.dataset.successMessage : form.dataset.errorMessage;
      msg.className = 'form-message ' + (j.success ? 'success' : 'error');
      if (j.success) form.reset();
    } catch {
      msg.textContent = form.dataset.errorMessage;
      msg.className = 'form-message error';
    }
    btn.disabled = false;
  });
}
