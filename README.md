# Patent na Podróż - Website

Professional travel agency website for Patent na Podróż / Clever Training Sp. z o.o.

## Features

- **Bilingual** (Polish + English)
- **Static site** (fast, free hosting)
- **SEO-optimized** (semantic HTML, sitemaps, meta tags)
- **Mobile-responsive** design
- **Contact form** (Web3Forms integration)
- **Current offers** + past trips showcase
- **Google Reviews** integration ready
- **Legal compliance** (CEOTiPO, GDPR, OWU)

## Structure

```
├── locales/
│   ├── pl.json          # Polish content (master)
│   └── en.json          # English content
├── src/
│   └── template.html    # Page template
├── assets/
│   ├── css/styles.css   # Styles
│   ├── js/main.js       # JavaScript
│   └── img/             # Images
├── build.js             # Static site generator
├── package.json         # Dependencies
└── vercel.json          # Vercel config
```

## Development

```bash
# Install dependencies
npm install

# Build site
npm run build

# Preview locally
npm run dev
# → http://localhost:3000
```

Output goes to `dist/` directory.

## Deployment

### One-time setup

1. **Get Web3Forms API key:**
   - Go to https://web3forms.com
   - Enter email: patentnapodroz@gmail.com
   - Copy the access key

2. **Update access key:**
   Edit `src/template.html`, line ~450:
   ```html
   <input type="hidden" name="access_key" value="YOUR_WEB3FORMS_KEY_HERE">
   ```
   Replace with your actual key.

3. **Connect GitHub to Vercel:**
   - Push this repo to GitHub
   - Log in to Vercel
   - Import the GitHub repo
   - Vercel auto-detects settings from `vercel.json`

### Updating content

1. **Edit content:**
   - Polish: `locales/pl.json`
   - English: `locales/en.json`

2. **Add/edit trips:**
   Edit the `current_offers.trips` array in both locale files.

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Update content"
   git push
   ```
   Vercel auto-deploys in ~60 seconds.

## Adding Real Photos

Replace placeholder images in `assets/img/`:
- `hero-bg.jpg` (1920×1080) - Hero background
- `podlasie.jpg` (800×600) - Podlasie trip
- `austria-past.jpg` (800×600) - Austria trip
- `gdynia-past.jpg` (800×600) - Gdynia trip
- `brda-past.jpg` (800×600) - Brda kayaking
- `about-photo.jpg` (800×800) - About section
- `logo.svg` - Company logo
- `og-card.jpg` (1200×630) - Social sharing image

## Google Reviews

To add real Google Reviews:

1. Verify business on Google My Business
2. Get review link: https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
3. Update `src/template.html` line ~395 with your actual link
4. Optionally embed Google Reviews widget

## DNS Setup (after Vercel deployment)

At your domain registrar (where you bought patentnapodroz.pl):

1. **A record:**
   - Host: `@`
   - Value: `76.76.21.21` (Vercel IP)

2. **CNAME record:**
   - Host: `www`
   - Value: `cname.vercel-dns.com`

Wait 10-60 minutes for DNS propagation.

## Tech Stack

- **No framework** - Pure HTML/CSS/JS
- **Build:** Node.js static site generator
- **Hosting:** Vercel (free tier)
- **Forms:** Web3Forms API (free)
- **Cost:** $0/month

## Support

- CEOTiPO: 42246
- Phone: 501 034 351
- Email: patentnapodroz@gmail.com

---

Built: July 2026
