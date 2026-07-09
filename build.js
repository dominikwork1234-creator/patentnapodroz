const fs = require('fs');
const path = require('path');

const LANGUAGES = ['pl', 'en'];
const DEFAULT_LANG = 'pl';
const DIST = 'dist';

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flatten(obj[k], key));
    } else if (!Array.isArray(obj[k])) {
      acc[key] = obj[k];
    }
    return acc;
  }, {});
}

function render(template, data, lang) {
  let out = template;
  const isDefault = lang === DEFAULT_LANG;
  const langPrefix = isDefault ? '/' : `/${lang}/`;

  // Legal page URLs (per-language slugs)
  const legalSlug = {
    privacy: { pl: 'polityka-prywatnosci', en: 'privacy-policy' },
    terms:   { pl: 'regulamin',            en: 'terms' },
  };
  const privacyUrl = `${langPrefix}${legalSlug.privacy[lang]}/`;
  const termsUrl = `${langPrefix}${legalSlug.terms[lang]}/`;

  // Language switcher pills
  const langSwitch = LANGUAGES.map(l => {
    const href = l === DEFAULT_LANG ? '/' : `/${l}/`;
    const cls = l === lang ? ' class="active"' : '';
    return `<a href="${href}"${cls}>${l.toUpperCase()}</a>`;
  }).join('');
  out = out.replace(/{{LANG_SWITCH}}/g, langSwitch);


  // Offers cards
  const offers = (data.current_offers?.trips || []).map(t => `
    <article class="offer-card">
      <div class="offer-media">
        <picture>
          <source srcset="${t.image.replace(/\.jpg$/i, '.webp')}" type="image/webp">
          <img src="${t.image}" alt="${t.name}" loading="lazy">
        </picture>
        <span class="offer-tag">${t.target}</span>
        <span class="offer-date-chip">📅 ${t.start_date.split('-').reverse().join('.')} · ${t.duration}</span>
      </div>
      <div class="offer-body">
        <h3>${t.name}</h3>
        <p class="offer-sub">${t.subtitle}</p>
        <p class="offer-desc">${t.short_desc}</p>
        <div class="offer-foot">
          <div class="offer-price"><small>${lang === 'pl' ? 'cena od' : 'from'}</small><strong>${t.price}</strong></div>
          <a href="${langPrefix}#kontakt" class="btn btn-accent">${data.hero.cta_secondary}</a>
        </div>
      </div>
    </article>`).join('\n');
  out = out.replace(/{{CURRENT_OFFERS_CARDS}}/g, offers);

  // Past trips
  const past = (data.past_trips_section?.trips || []).map(t => `
    <article class="past-card">
      <div class="past-media">
        <picture>
          <source srcset="${t.image.replace(/\.jpg$/i, '.webp')}" type="image/webp">
          <img src="${t.image}" alt="${t.name}" loading="lazy">
        </picture>
        <span class="past-tag">${t.target}</span>
      </div>
      <div class="past-body">
        <h3>${t.name}</h3>
        <p>${t.description}</p>
      </div>
    </article>`).join('\n');
  out = out.replace(/{{PAST_TRIPS_CARDS}}/g, past);

  // Why us cards
  const icons = { shield: '🛡️', bus: '🚌', guide: '🧭', route: '🗺️', heart: '💚', star: '⭐' };
  const why = (data.why_us?.items || []).map(i => `
    <div class="why-card">
      <div class="why-icon">${icons[i.icon] || '✨'}</div>
      <h3>${i.title}</h3>
      <p>${i.text}</p>
    </div>`).join('\n');
  out = out.replace(/{{WHY_US_CARDS}}/g, why);

  // About values
  const values = (data.about?.values || []).map(v => `<li>${v}</li>`).join('\n');
  out = out.replace(/{{ABOUT_VALUES}}/g, values);

  // Hreflang
  let hreflang = LANGUAGES.map(l => {
    const href = l === DEFAULT_LANG ? 'https://patentnapodroz.pl/' : `https://patentnapodroz.pl/${l}/`;
    return `<link rel="alternate" hreflang="${l}" href="${href}">`;
  }).join('\n');
  hreflang += `\n<link rel="canonical" href="https://patentnapodroz.pl${langPrefix}">`;
  out = out.replace(/{{HREFLANG_TAGS}}/g, hreflang);

  // Flat tokens
  const flat = flatten(data);
  for (const [k, v] of Object.entries(flat)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  out = out.replace(/{{PRIVACY_URL}}/g, privacyUrl);
  out = out.replace(/{{TERMS_URL}}/g, termsUrl);
  out = out.replace(/{{LANG_PREFIX}}/g, langPrefix);
  out = out.replace(/{{LANG}}/g, lang);
  return out;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dest, f);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

console.log('🔨 Building Patent na Podróż v3...');
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
fs.mkdirSync(DIST, { recursive: true });

const template = fs.readFileSync('src/template.html', 'utf-8');
const legalTemplate = fs.readFileSync('src/legal-page.html', 'utf-8');
const LEGAL_PAGES = [
  { key: 'privacy_page', slug: { pl: 'polityka-prywatnosci', en: 'privacy-policy' } },
  { key: 'terms_page',   slug: { pl: 'regulamin',            en: 'terms' } },
];

for (const lang of LANGUAGES) {
  const data = JSON.parse(fs.readFileSync(`locales/${lang}.json`, 'utf-8'));
  const outDir = lang === DEFAULT_LANG ? DIST : path.join(DIST, lang);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), render(template, data, lang));
  console.log(`  ✓ ${lang}: ${outDir}/index.html`);

  for (const page of LEGAL_PAGES) {
    const pageData = Object.assign({}, data, { LEGAL_PAGE: data[page.key] });
    const slug = page.slug[lang];
    const legalOutDir = path.join(outDir, slug);
    fs.mkdirSync(legalOutDir, { recursive: true });
    fs.writeFileSync(path.join(legalOutDir, 'index.html'), render(legalTemplate, pageData, lang));
    console.log(`  ✓ ${lang}: ${legalOutDir}/index.html`);
  }
}

copyDir('assets', path.join(DIST, 'assets'));
console.log('  ✓ assets/');

// Verify no unreplaced tokens
const filesToCheck = ['dist/index.html', 'dist/en/index.html'];
for (const lang of LANGUAGES) {
  const outDir = lang === DEFAULT_LANG ? DIST : path.join(DIST, lang);
  for (const page of LEGAL_PAGES) {
    filesToCheck.push(path.join(outDir, page.slug[lang], 'index.html'));
  }
}
for (const f of filesToCheck) {
  const html = fs.readFileSync(f, 'utf-8');
  const leftover = html.match(/{{[^}]+}}/g);
  if (leftover) {
    console.error(`  ✗ UNREPLACED TOKENS in ${f}:`, [...new Set(leftover)].join(', '));
    process.exit(1);
  }
}
console.log('  ✓ token check passed (' + filesToCheck.length + ' files)');

const base = 'https://patentnapodroz.pl';
let sitemapUrls = [
  `  <url><loc>${base}/</loc><priority>1.0</priority></url>`,
  `  <url><loc>${base}/en/</loc><priority>0.8</priority></url>`,
];
for (const lang of LANGUAGES) {
  const prefix = lang === DEFAULT_LANG ? '' : `${lang}/`;
  for (const page of LEGAL_PAGES) {
    sitemapUrls.push(`  <url><loc>${base}/${prefix}${page.slug[lang]}/</loc><priority>0.3</priority></url>`);
  }
}
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
console.log('  ✓ sitemap.xml + robots.txt');
console.log('✅ Build complete');
