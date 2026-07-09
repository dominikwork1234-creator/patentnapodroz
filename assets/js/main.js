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

// ---- Cookie consent + GA4 (only loads analytics after explicit consent) ----
(function () {
  var CONSENT_KEY = 'cookie_consent';
  var cfg = window.__SITE_CONFIG__ || {};
  var gaId = cfg.gaId || '';
  var hasRealGaId = gaId && gaId.indexOf('_HERE') === -1;

  function loadGA() {
    if (!hasRealGaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', gaId, { anonymize_ip: true });
  }

  var banner = document.getElementById('cookieBanner');
  var consent = null;
  try { consent = localStorage.getItem(CONSENT_KEY); } catch (e) {}

  if (consent === 'granted') {
    loadGA();
  } else if (consent !== 'denied' && banner && hasRealGaId) {
    // Only bother showing the banner once there's actually something to consent to.
    banner.hidden = false;
  }

  var acceptBtn = document.getElementById('cookieAccept');
  var rejectBtn = document.getElementById('cookieReject');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'granted'); } catch (e) {}
      if (banner) banner.hidden = true;
      loadGA();
    });
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function () {
      try { localStorage.setItem(CONSENT_KEY, 'denied'); } catch (e) {}
      if (banner) banner.hidden = true;
    });
  }
})();
