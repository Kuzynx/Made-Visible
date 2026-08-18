# MADE VISIBLE

**Your business. Made visible.**

The official website for Made Visible — a full-service marketing agency helping
businesses become seen, found, recognized, and remembered.

**Live:** https://madevisiblemv.com (GitHub Pages + Cloudflare, deployed
automatically from `main` by `.github/workflows/deploy-pages.yml`)

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| What We Make Visible (Services) | `what-we-make-visible.html` |
| Why Choose Us | `why-choose-us.html` |
| Clients Made Visible (Case Studies) | `clients.html` |
| About | `about.html` |
| Make Me Visible (Contact) | `make-me-visible.html` |
| Privacy Policy | `privacy.html` |
| 404 | `404.html` |

## Brand system

- **Obsidian** `#0A0A0A` — main background · **Ivory** `#F2EFE7` — main text
- **Stone** `#AAA69D` — secondary text · **Champagne** `#C6AE82` — premium accent
- **Charcoal** `#1B1B1B` — cards and surfaces
- **Manrope** — logo, headlines, UI, body · **Cormorant Garamond Medium Italic** — editorial accents

## Tech

Static site — no build step. Open `index.html` or serve the folder:

```bash
python3 -m http.server 8000
```

Libraries (vendored in `js/vendor/` — no CDN dependency):

- **Three.js r147 + GLTFLoader** — drag-to-spin 3D camera hero ("Antique Camera"
  by Maximillan Kamps / UX3D, CC0, via the Khronos glTF Sample Assets;
  optimized with glTF-Transform to `assets/camera.glb`)
- **GSAP + ScrollTrigger** — scroll reveals, line-mask headlines, parallax,
  word-by-word statements, animated counters, entry sequence
- **Lenis** — smooth scrolling

All animations respect `prefers-reduced-motion` and degrade gracefully if a
script fails to load.

## Operations

- **Inquiry form** delivers to `madevisiblemv@gmail.com` via FormSubmit
  (activated); client-side validation + honeypot included
- **Link previews**: Open Graph/Twitter tags on every page; share card at
  `assets/og-card.jpg`
- **SEO**: `sitemap.xml`, `robots.txt`, canonical URLs
- Client photography, logos and case-study assets live in `assets/`
