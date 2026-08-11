# MADE VISIBLE

**Your business. Made visible.**

The official website for Made Visible — a full-service marketing agency helping
businesses become seen, found, recognized, and remembered.

## Pages

| Page | File |
| --- | --- |
| Home | `index.html` |
| What We Make Visible (Services) | `what-we-make-visible.html` |
| Why Choose Us | `why-choose-us.html` |
| Clients Made Visible (Case Studies) | `clients.html` |
| About | `about.html` |
| Make Me Visible (Contact) | `make-me-visible.html` |

## Brand system

- **Obsidian** `#0A0A0A` — main background
- **Ivory** `#F2EFE7` — main text
- **Stone** `#AAA69D` — secondary text
- **Champagne** `#C6AE82` — premium accent (used sparingly, on purpose)
- **Charcoal** `#1B1B1B` — cards and secondary surfaces
- **Manrope** — logo, headlines, UI, body
- **Cormorant Garamond Medium Italic** — editorial accent words only

## Tech

Static site — no build step. Open `index.html` or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Libraries (loaded from CDN):

- **Three.js** — 3D hero: champagne wireframe icosahedron + particle field with mouse parallax
- **GSAP + ScrollTrigger** — scroll reveals, line-mask headlines, parallax, word-by-word statements, animated counters
- **Lenis** — smooth scrolling

All animations respect `prefers-reduced-motion`, and the site degrades gracefully
if any CDN script fails to load.

## Notes

- The inquiry form on `make-me-visible.html` is front-end only — wire the
  `<form>` to your backend, Formspree, Netlify Forms, or similar.
- Portfolio visuals are abstract brand-gradient placeholders; replace the
  `.visual-*` elements with real client photography as case studies are approved.
