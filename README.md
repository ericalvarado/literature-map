# Literature Infographic

A static, GitHub Pages–ready visual literature map for Eric Alvarado’s research across **Semiotics**, **Narrative Theory**, **Data Visualization**, **Data Comics**, and **Visual Thinking**, plus bridge disciplines (Linguistics, Cognitive Psychology, UI/UX, Graphic Design).

The site mirrors the Cursor Page “Literature Infographic” as a no-build static site: hub-and-spoke field network, area-colored timeline, 12-step reading path, area cards, Data Comics emphasis with “Where your studies fit,” and a filterable catalog of **77 verified** works with links.

## What’s in this folder

| File | Role |
|------|------|
| `index.html` | Semantic page shell (tabs, landmarks, ARIA) |
| `styles.css` | Responsive dark theme, contrast-focused |
| `app.js` | Vanilla JS + D3 v7 (CDN) rendering |
| `data/works.json` | **Single data source** — works + areas, bridges, gaps, reading path, network |
| `.nojekyll` | Tells GitHub Pages not to run Jekyll |
| `README.md` | This file |

## Preview locally

```bash
cd literature-map
python3 -m http.server 8080
```

Open http://localhost:8080/

## Add a paper

1. Verify the work (DOI, Open Library, or publisher page). Do **not** invent citations.
2. Open `data/works.json`.
3. Append an object to the `works` array:

```json
{
  "id": "short_unique_slug",
  "area": "Data Comics",
  "kind": "recent",
  "authors": "First Last; Second Last",
  "year": 2026,
  "title": "Paper title",
  "venue": "CHI / IEEE TVCG / …",
  "link": "https://doi.org/10.…",
  "why": "One sentence on why it belongs on this map.",
  "citation_count": 12,
  "citation_source": "Crossref, Nov 2026"
}
```

4. Use an existing `area` value from `catalogAreas` (or a core/bridge area already in `areaMeta`) so filters and colors work.
5. Optional: add the `id` to `timelineIds` or `readingOrder` if it should appear on those views.
6. Commit and push — the Infographic, timeline, and catalog recompute from `works.json` on load.

`citation_count` / `citation_source` are optional; omit them when you do not have a retrieved count.

## Enable GitHub Pages

1. Push this folder to a GitHub repository (as the repo root, or set Pages to the folder that contains `index.html`).
2. Repo **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Branch: **main** (or `master`), folder: **/ (root)**.
5. Save. The site will be at `https://<user>.github.io/<repo>/` after a minute or two.

No build step is required. `.nojekyll` is included so underscored paths and raw JSON are served as-is.

## Accessibility notes

- Skip link, landmark regions, tablist keyboard support (arrows / Home / End)
- SVG diagrams expose titles/descriptions; nodes have `aria-label`
- Focus rings on interactive controls; sufficient contrast on dark theme
- Works are in native `<details>` / `<summary>` disclosure widgets

## Verification policy

Only verified DOI / Open Library / publisher entries ship. Blind-spot diamonds are research questions, not additional papers. Sources: Crossref, OpenAlex, Open Library, publisher pages (catalog dated Nov 2026).
