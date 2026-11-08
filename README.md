# frtymn.github.io

Personal website and portfolio of **Fırat Yaman** — web development, Android
applications, and experiments with different technologies.

Live: <https://frtymn.github.io/>

## Features

- Single-page portfolio: hero, about, projects, technologies, contact, footer.
- Light and dark themes (follows the system setting; the toggle remembers your choice).
- Responsive layout with a compact mobile menu.
- Project list with hand-curated cards plus any other public, non-fork
  repositories loaded from the GitHub REST API (no token, cached for 6 hours,
  silently falls back to the curated cards if the API is unavailable).
- Accessible: semantic landmarks, skip link, keyboard-operable controls, visible
  focus rings, reduced-motion support.
- No build step, no dependencies, no third-party requests except the optional
  GitHub API call. Fonts are self-hosted.

## Technologies

HTML, CSS and vanilla JavaScript. Fonts: [Geist and Geist Mono](https://github.com/vercel/geist-font)
(SIL Open Font License 1.1, see `assets/fonts/OFL.txt`).

## Structure

```
index.html            Page content (projects are plain HTML <article> blocks)
404.html              Not-found page served by GitHub Pages
favicon.ico           Legacy favicon (16/32px)
assets/css/main.css   All styles; tokens at the top
assets/js/main.js     Theme toggle, mobile menu, nav state, GitHub repo list
assets/fonts/         Geist WOFF2 subsets (latin, latin-ext) + licence
assets/img/           SVG favicon, Apple touch icon, Open Graph image
DESIGN.md             Design specification
.nojekyll             Serve files as-is (skip Jekyll processing)
```

## Run locally

No build is needed. Serve the folder with any static server so the
root-relative paths in `404.html` resolve:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Editing projects

Copy an `<article class="card project">` block in the Projects section of
`index.html` and set `data-repo` to the repository name. Curated repositories
are skipped by the automatic GitHub list, so they won't appear twice. The
GitHub username is set in `assets/js/main.js` (`GH_USER`).

## Deployment

GitHub Pages serves the `master` branch from the repository root
(Settings → Pages → "Deploy from a branch"). Pushing to `master` publishes the
site at `https://frtymn.github.io/`. There is no build step or workflow file.

## Design

The visual system is documented in [`DESIGN.md`](DESIGN.md). Part 1 is the
Refero Styles "Vercel" DESIGN.md
(<https://styles.refero.design/style/f24daf3a-d43f-4dec-85a9-8ac1d5148a03>),
used as a visual reference only — no Vercel branding is used. Part 2 documents
this site's adaptations and extensions (dark theme, responsive scaling,
contrast fixes, portfolio components).
