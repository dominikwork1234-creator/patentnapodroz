const fs = require('fs');
const path = require('path');

// Configuration
const LANGUAGES = ['pl', 'en'];
const DEFAULT_LANG = 'pl';
const SRC_DIR = 'src';
const LOCALES_DIR = 'locales';
const ASSETS_DIR = 'assets';
const DIST_DIR = 'dist';

// Helper: Flatten nested JSON
function flattenObj(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, key) => {
        const prefixedKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(acc, flattenObj(obj[key], prefixedKey));
        } else {
            acc[prefixedKey] = obj[key];
        }
        return acc;
    }, {});
}

// Helper: Access nested property
function getNestedProp(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Helper: Render template
function renderTemplate(template, data, lang, langPrefix) {
    let output = template;
    
    // Replace {{KEY}} tokens
    const flat = flattenObj(data);
    for (const [key, value] of Object.entries(flat)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        output = output.replace(regex, value);
    }
    
    // Replace {{LANG}} and {{LANG_PREFIX}}
    output = output.replace(/{{LANG}}/g, lang);
    output = output.replace(/{{LANG_PREFIX}}/g, langPrefix);
    
    // Generate hreflang tags
    let hreflangTags = LANGUAGES.map(l => {
        const href = l === DEFAULT_LANG ? '/' : `/${l}/`;
        return `<link rel="alternate" hreflang="${l}" href="${href}">`;
    }).join('\n    ');
    hreflangTags += `\n    <link rel="canonical" href="${langPrefix}">`;
    output = output.replace(/{{HREFLANG_TAGS}}/g, hreflangTags);
    
    // Generate current offers cards
    const offers = data.current_offers?.trips || [];
    const offersHtml = offers.map(trip => `
        <div class="offer-card">
            <div class="offer-image">
                <img src="${trip.image}" alt="${trip.name}" loading="lazy">
            </div>
            <div class="offer-content">
                <div class="offer-meta">
                    <span>📅 ${trip.start_date}</span>
                    <span>⏱️ ${trip.duration}</span>
                    <span>👥 ${trip.target}</span>
                </div>
                <h3 class="offer-title">${trip.name}</h3>
                <p class="offer-subtitle">${trip.subtitle}</p>
                <p class="offer-desc">${trip.short_desc}</p>
                <div class="offer-footer">
                    <div class="offer-price">${trip.price}</div>
                    <a href="#contact" class="btn btn-primary">${data.hero?.cta_secondary || 'Contact'}</a>
                </div>
            </div>
        </div>
    `).join('');
    output = output.replace(/{{CURRENT_OFFERS_CARDS}}/g, offersHtml);
    
    // Generate past trips cards
    const pastTrips = data.past_trips_section?.trips || [];
    const pastTripsHtml = pastTrips.map(trip => `
        <div class="past-trip-card">
            <div class="past-trip-image">
                <img src="${trip.image}" alt="${trip.name}" loading="lazy">
            </div>
            <div class="past-trip-content">
                <div class="offer-meta">
                    <span>👥 ${trip.target}</span>
                </div>
                <h3 class="offer-title">${trip.name}</h3>
                <p class="offer-desc">${trip.description}</p>
            </div>
        </div>
    `).join('');
    output = output.replace(/{{PAST_TRIPS_CARDS}}/g, pastTripsHtml);
    
    return output;
}

// Main build function
function build() {
    console.log('🔨 Building Patent na Podróż website...\n');
    
    // Clean dist
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true });
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });
    
    // Read template
    const template = fs.readFileSync(path.join(SRC_DIR, 'template.html'), 'utf-8');
    
    // Build for each language
    LANGUAGES.forEach(lang => {
        console.log(`📝 Building ${lang.toUpperCase()} version...`);
        
        // Load locale data
        const localeFile = path.join(LOCALES_DIR, `${lang}.json`);
        if (!fs.existsSync(localeFile)) {
            console.error(`❌ Missing locale file: ${localeFile}`);
            process.exit(1);
        }
        
        const data = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
        
        // Determine output path
        const isDefault = lang === DEFAULT_LANG;
        const langPrefix = isDefault ? '' : `${lang}/`;
        const outputDir = path.join(DIST_DIR, langPrefix);
        
        // Create output directory
        fs.mkdirSync(outputDir, { recursive: true });
        
        // Render and write index.html
        const rendered = renderTemplate(template, data, lang, `/${langPrefix}`);
        fs.writeFileSync(path.join(outputDir, 'index.html'), rendered);
        
        console.log(`  ✓ ${outputDir}index.html`);
    });
    
    // Copy assets
    console.log('\n📦 Copying assets...');
    function copyRecursive(src, dest) {
        if (!fs.existsSync(src)) {
            console.warn(`⚠️  ${src} does not exist, skipping`);
            return;
        }
        
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(file => {
                copyRecursive(path.join(src, file), path.join(dest, file));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
    
    copyRecursive(ASSETS_DIR, path.join(DIST_DIR, ASSETS_DIR));
    console.log(`  ✓ ${ASSETS_DIR}/`);
    
    // Generate sitemap.xml
    console.log('\n🗺️  Generating sitemap...');
    const baseUrl = 'https://patentnapodroz.pl';
    const pages = ['', ...LANGUAGES.filter(l => l !== DEFAULT_LANG).map(l => `${l}/`)];
    
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(page => `  <url>
    <loc>${baseUrl}/${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
${LANGUAGES.map(lang => {
    const alternate = lang === DEFAULT_LANG ? '' : `${lang}/`;
    return `    <xhtml:link rel="alternate" hreflang="${lang}" href="${baseUrl}/${alternate}"/>`;
}).join('\n')}
  </url>`).join('\n')}
</urlset>`;
    
    fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);
    console.log('  ✓ sitemap.xml');
    
    // Generate robots.txt
    const robotsTxt = `# Patent na Podróż
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
    fs.writeFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);
    console.log('  ✓ robots.txt');
    
    // Generate favicon placeholder if needed
    const faviconPath = path.join(DIST_DIR, ASSETS_DIR, 'img', 'favicon.svg');
    if (!fs.existsSync(faviconPath)) {
        const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect fill="#2d5f3f" width="100" height="100"/>
  <text x="50" y="70" font-family="Arial" font-size="60" fill="white" text-anchor="middle" font-weight="bold">P</text>
</svg>`;
        fs.mkdirSync(path.dirname(faviconPath), { recursive: true });
        fs.writeFileSync(faviconPath, faviconSvg);
        console.log('  ✓ favicon.svg (placeholder)');
    }
    
    console.log('\n✅ Build complete!');
    console.log(`📁 Output: ${path.resolve(DIST_DIR)}/`);
}

// Run build
try {
    build();
} catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
}
