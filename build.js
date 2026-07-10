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

  // FAQ items
  const faqItems = (data.faq_section?.items || []).map((item, i) => `
    <details class="faq-item"${i === 0 ? ' open' : ''}>
      <summary>${item.q}</summary>
      <p>${item.a}</p>
    </details>`).join('\n');
  out = out.replace(/{{FAQ_ITEMS}}/g, faqItems);

  // FAQPage structured data — mirrors the visible FAQ_ITEMS exactly
  const faqEntities = (data.faq_section?.items || []).map(item => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": { "@type": "Answer", "text": item.a },
  }));
  const faqJsonLd = faqEntities.length
    ? `<script type="application/ld+json">\n${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqEntities }, null, 2)}\n</script>`
    : '';
  out = out.replace(/{{FAQ_JSONLD}}/g, faqJsonLd);

  // Google Search Console verification meta tag — only emit if a real value is configured
  const gscValue = data.analytics?.gsc_verification || '';
  const gscTag = (gscValue && gscValue.indexOf('_HERE') === -1)
    ? `<meta name="google-site-verification" content="${gscValue}">`
    : '<!-- Search Console not yet configured: see analytics.gsc_verification in locales/*.json -->';
  out = out.replace(/{{GSC_META_TAG}}/g, gscTag);




  // Hreflang
  let hreflang = LANGUAGES.map(l => {
    const href = l === DEFAULT_LANG ? 'https://patentnapodroz.pl/' : `https://patentnapodroz.pl/${l}/`;
    return `<link rel="alternate" hreflang="${l}" href="${href}">`;
  }).join('\n');
  hreflang += `\n<link rel="alternate" hreflang="x-default" href="https://patentnapodroz.pl/">`;
  hreflang += `\n<link rel="canonical" href="https://patentnapodroz.pl${langPrefix}">`;
  out = out.replace(/{{HREFLANG_TAGS}}/g, hreflang);

  // Flat tokens
  const flat = flatten(data);
  for (const [k, v] of Object.entries(flat)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  out = out.replace(/{{PRIVACY_URL}}/g, privacyUrl);
  out = out.replace(/{{TERMS_URL}}/g, termsUrl);
  // Category page URLs (PL-only pages; EN links point to PL versions)
  out = out.replace(/{{CAT_URL_SENIORS}}/g, '/wycieczki-dla-seniorow/');
  out = out.replace(/{{CAT_URL_YOUTH}}/g, '/obozy-mlodziezowe/');
  out = out.replace(/{{CAT_URL_ONEDAY}}/g, '/wycieczki-jednodniowe/');
  out = out.replace(/{{CAT_URL_MULTIDAY}}/g, '/wyjazdy-kilkudniowe/');
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

fs.copyFileSync('src/404.html', path.join(DIST, '404.html'));
console.log('  ✓ 404.html');

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


// ===================== SUBPAGES (PL-only SEO pages) =====================
const BASE = 'https://patentnapodroz.pl';
const subTemplate = fs.readFileSync('src/subpage.html', 'utf-8');
const plData = JSON.parse(fs.readFileSync('locales/pl.json', 'utf-8'));
const extraSitemapUrls = [];

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function breadcrumbLd(items){
  return { "@context":"https://schema.org", "@type":"BreadcrumbList",
    "itemListElement": items.map((it,i)=>({ "@type":"ListItem", "position":i+1, "name":it.name, "item":it.url })) };
}
function faqLd(items){
  return { "@context":"https://schema.org", "@type":"FAQPage",
    "mainEntity": items.map(it=>({ "@type":"Question","name":it.q,"acceptedAnswer":{"@type":"Answer","text":it.a} })) };
}
function jsonLdScript(objs){
  return objs.map(o=>`<script type="application/ld+json">\n${JSON.stringify(o,null,2)}\n</script>`).join('\n');
}
function writeSubpage(slugPath, title, desc, bodyHtml, jsonLdObjs, priority){
  const url = `${BASE}/${slugPath}/`;
  let html = subTemplate
    .split('{{SUBPAGE_TITLE}}').join(title)
    .split('{{SUBPAGE_DESC}}').join(desc)
    .split('{{SUBPAGE_URL}}').join(url)
    .split('{{SUBPAGE_JSONLD}}').join(jsonLdScript(jsonLdObjs))
    .split('{{SUBPAGE_BODY}}').join(bodyHtml);
  html = render(html, plData, 'pl');
  const dir = path.join(DIST, slugPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  extraSitemapUrls.push(`  <url><loc>${url}</loc><priority>${priority}</priority></url>`);
  console.log(`  ✓ pl: ${dir}/index.html`);
}
function sectionsHtml(sections){
  return (sections||[]).map(s=>`<h2>${s.h2}</h2>\n<p>${s.text}</p>`).join('\n');
}
function faqHtml(items){
  if(!items || !items.length) return '';
  return `<h2>Najczęstsze pytania</h2>\n` + items.map((it,i)=>
    `<details class="faq-item"${i===0?' open':''}><summary>${it.q}</summary><p>${it.a}</p></details>`).join('\n');
}
function ctaHtml(){
  return `<div class="cta-banner" style="border-radius:16px;margin:48px 0;padding:40px 32px;text-align:center">
    <h2 style="color:#fff">Zapytaj o wyjazd dla swojej grupy</h2>
    <p style="color:#d7e2f0;margin:12px 0 24px">Bezpłatna wycena — odpowiadamy zwykle tego samego dnia roboczego.</p>
    <a href="/kontakt/" class="btn btn-accent btn-lg">Wypełnij formularz</a>
    <a href="tel:+48501034351" class="btn btn-outline-white btn-lg" style="margin-left:12px">Zadzwoń: 501 034 351</a>
  </div>`;
}
const catBySlug = {};
(plData.category_pages||[]).forEach(c=>{ catBySlug[c.slug]=c; });
function relatedHtml(slugs){
  const links = (slugs||[]).map(s=>catBySlug[s]).filter(Boolean)
    .map(c=>`<a href="/${c.slug}/" class="btn btn-outline btn-sm" style="margin:4px">${c.h1.split(' – ')[0].split(',')[0]}</a>`).join(' ');
  return links ? `<h2>Zobacz także</h2><p>${links}</p>` : '';
}

// --- Category pages ---
for (const c of (plData.category_pages||[])) {
  const crumbs = [{name:'Strona główna',url:`${BASE}/`},{name:c.h1,url:`${BASE}/${c.slug}/`}];
  const ld = [breadcrumbLd(crumbs)];
  if (c.faq && c.faq.length) ld.push(faqLd(c.faq));
  const points = (c.points||[]).map(p=>`<li>${p}</li>`).join('');
  const body = `
<main class="legal-page">
  <div class="container">
    <nav class="legal-back" aria-label="breadcrumb"><a href="/">Strona główna</a> › ${c.h1}</nav>
    <h1>${c.h1}</h1>
    <div class="legal-content">
      <p><strong>${c.lead}</strong></p>
      <ul>${points}</ul>
      ${sectionsHtml(c.sections)}
      ${faqHtml(c.faq)}
      ${relatedHtml(c.related)}
    </div>
    ${ctaHtml()}
  </div>
</main>`;
  writeSubpage(c.slug, c.meta_title, c.meta_description, body, ld, '0.9');
}

// --- O nas / Kontakt ---
{
  const o = plData.onas_page;
  const body = `
<main class="legal-page"><div class="container">
  <nav class="legal-back"><a href="/">Strona główna</a> › ${o.h1}</nav>
  <h1>${o.h1}</h1>
  <div class="legal-content">
    <p><strong>${o.lead}</strong></p>
    ${sectionsHtml(o.sections)}
    <h2>Nasze wartości</h2>
    <ul>${(plData.about.values||[]).map(v=>`<li>${v}</li>`).join('')}</ul>
  </div>
  ${ctaHtml()}
</div></main>`;
  writeSubpage(o.slug, o.meta_title, o.meta_description, body, [breadcrumbLd([{name:'Strona główna',url:`${BASE}/`},{name:o.h1,url:`${BASE}/o-nas/`}])], '0.5');
}
{
  const k = plData.kontakt_page;
  // Wyciagnij sekcje formularza z template.html (DRY - jeden formularz w repo)
  const homeT = fs.readFileSync('src/template.html','utf-8');
  const m = homeT.match(/<section class="contact" id="kontakt">[\s\S]*?<\/section>/);
  const formSection = m ? m[0] : '';
  const body = `
<main class="legal-page"><div class="container">
  <nav class="legal-back"><a href="/">Strona główna</a> › ${k.h1}</nav>
  <h1>${k.h1}</h1>
  <div class="legal-content"><p><strong>${k.lead}</strong></p></div>
</div></main>
${formSection}`;
  writeSubpage(k.slug, k.meta_title, k.meta_description, body, [breadcrumbLd([{name:'Strona główna',url:`${BASE}/`},{name:k.h1,url:`${BASE}/kontakt/`}])], '0.6');
}

// --- Case studies /zrealizowane/[slug]/ ---
for (const cs of (plData.case_pages||[])) {
  const paras = cs.body.split('\n\n').map(p=>`<p>${p}</p>`).join('\n');
  const body = `
<main class="legal-page"><div class="container">
  <nav class="legal-back"><a href="/">Strona główna</a> › <a href="/#zrealizowane">Zrealizowane</a> › ${cs.h1}</nav>
  <h1>${cs.h1}</h1>
  <div class="legal-content">
    <p><span class="offer-tag" style="position:static;display:inline-block">${cs.target}</span></p>
    <picture><source srcset="${cs.image.replace(/\.jpg$/,'.webp')}" type="image/webp"><img src="${cs.image}" alt="${cs.h1}" loading="lazy" style="width:100%;border-radius:12px"></picture>
    ${paras}
  </div>
  ${ctaHtml()}
</div></main>`;
  writeSubpage(`zrealizowane/${cs.slug}`, cs.meta_title, cs.meta_description, body,
    [breadcrumbLd([{name:'Strona główna',url:`${BASE}/`},{name:'Zrealizowane wyjazdy',url:`${BASE}/#zrealizowane`},{name:cs.h1,url:`${BASE}/zrealizowane/${cs.slug}/`}])], '0.5');
}

// --- Trip pages /wyjazdy/[slug]/ z TouristTrip JSON-LD ---
for (const t of (plData.current_offers?.trips||[])) {
  const url = `${BASE}/wyjazdy/${t.slug}/`;
  const tripLd = {
    "@context":"https://schema.org","@type":"TouristTrip",
    "name": `${t.name} — ${t.subtitle}`,
    "description": t.long_desc || t.short_desc,
    "url": url,
    "image": `${BASE}${t.image}`,
    "touristType": t.target,
    "provider": { "@type":"TravelAgency","name":"Patent na Podróż","url":`${BASE}/` },
    "offers": { "@type":"Offer","price": (t.price.match(/\d+/)||[''])[0], "priceCurrency":"PLN",
      "availability":"https://schema.org/InStock","url": url },
    "startDate": t.start_date, "endDate": t.end_date
  };
  const included = (t.included||[]).map(i=>`<li>${i}</li>`).join('');
  const td = plData.trip_detail;
  const body = `
<main class="legal-page"><div class="container">
  <nav class="legal-back"><a href="/">Strona główna</a> › <a href="/#oferta">Aktualne wyjazdy</a> › ${t.name}</nav>
  <h1>${t.name} — ${t.subtitle}</h1>
  <div class="legal-content">
    <picture><source srcset="${t.image.replace(/\.jpg$/,'.webp')}" type="image/webp"><img src="${t.image}" alt="${t.name}" loading="lazy" style="width:100%;border-radius:12px"></picture>
    <p><strong>${t.long_desc || t.short_desc}</strong></p>
    <h2>${td.quick_facts}</h2>
    <ul>
      <li><strong>${td.date}:</strong> ${t.start_date.split('-').reverse().join('.')} – ${t.end_date.split('-').reverse().join('.')} (${t.duration})</li>
      <li><strong>${td.target}:</strong> ${t.target}</li>
      <li><strong>${td.price}:</strong> ${t.price}</li>
      <li><strong>${td.transport}:</strong> ${t.transport}</li>
      <li><strong>${td.accommodation}:</strong> ${t.accommodation}</li>
      <li><strong>${td.meals}:</strong> ${t.meals}</li>
      <li><strong>${td.guide}:</strong> ${t.guide}</li>
    </ul>
    <h2>${td.included_title}</h2>
    <ul>${included}</ul>
    <h2>${td.program_title}</h2>
    <p>${t.program_note||''}</p>
  </div>
  ${ctaHtml()}
</div></main>`;
  writeSubpage(`wyjazdy/${t.slug}`, `${t.name} — ${t.subtitle} | Patent na Podróż`,
    (t.long_desc||t.short_desc).slice(0,158), body,
    [tripLd, breadcrumbLd([{name:'Strona główna',url:`${BASE}/`},{name:'Aktualne wyjazdy',url:`${BASE}/#oferta`},{name:t.name,url:url}])], '0.8');
}
console.log('  ✓ subpages generated');
// ===================== END SUBPAGES =====================


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
sitemapUrls = sitemapUrls.concat(extraSitemapUrls);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('\n')}
</urlset>`;
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
console.log('  ✓ sitemap.xml + robots.txt');

// Cloudflare: root favicon.ico + _headers + _redirects (vercel.json is ignored by Cloudflare)
fs.copyFileSync('assets/img/favicon.ico', path.join(DIST, 'favicon.ico'));
fs.writeFileSync(path.join(DIST, '_headers'), `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`);
fs.writeFileSync(path.join(DIST, '_redirects'), `https://www.patentnapodroz.pl/* https://patentnapodroz.pl/:splat 301\n/index.html / 301\n`);
console.log('  ✓ favicon.ico + _headers + _redirects (Cloudflare)');
console.log('✅ Build complete');
