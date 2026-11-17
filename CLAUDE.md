# Plantdex

Dex of the LEGO Botanicals planter-buddy sets (two figures per set). Web app only, no build step; sibling of `../Scaledex` (no Obsidian plugin here).

## Layout

- `data.js` is the only data file (`window.PLANTDEX`), edited by hand. Its header documents every field. A `<script>` file instead of JSON so `index.html` works from `file://`.
- `app.js` + `app.css`: the whole UI, ES5-style, no framework. Hash routes `#/`, `#/set/<sku>`, `#/figure/<id>`.
- `sw.js`: network-first shell cache, registered only on https. Bump `SHELL` when the file list changes.
- Deploy: `.github/workflows/pages.yml` runs `node tools/check.mjs`, then publishes the repo root to GitHub Pages on every push to `main` (Pages source = GitHub Actions). A new top-level file the site needs must be added to the workflow's `cp` line too. Run the check before pushing; do features on a branch and merge after checking in a browser.
- Shared ideas with `../Scaledex` (keyboard shortcuts, the donation QR `donate.jpg` + Ko-fi link in Settings) are ported by hand; there's no shared code.

## Data notes

- Images are hotlinked from LEGO's CDN (user's choice): never download or commit them. Figures without a tagged image (`gallery[].fig`) show a drawn pot (`potSvg`) in the figure's `color`.
- lego.com product pages load again (2026-11-16): `curl` with a browser User-Agent works; the first request can return 403, so retry once. If it's blocked again (work network), the user saves product pages + instruction PDFs into `temp/` (gitignored). The page's JSON-LD has pieces/price/age, `"description"` is the tagline and `featuresText` holds the figure sizes. Take gallery URLs from the HTML (product gallery order: `_Prod`, `boxprod`/`Box1`, `WEB_PRI`, `WEB_SEC0n`, `Lifestyle_*`, `Box5`) and stories from the PDFs. Don't fetch lego.com through archive/proxy sites.
- Stories: 10349 has a separate text "Info Booklet"; 11506/10371 print them as artwork, not text: booklet 1, pages 4-5 hold both figures' stories (render the page with PyMuPDF to read it). Keep LEGO's wording (incl. ®, curly quotes).
- `sized()` in app.js appends LEGO CDN resize params (`format=webply&fit=bounds&width=`), so store URLs without a query.
- Figure tiles zoom into a group shot via `card: { src, zoom, x, y }`; check them in a browser after changing an image.
- 10349 figures have no official names (their booklets title them only "Dracaena"/"Pilea"): `name: null`, `nickname` "Yellow"/"Blue" (from the review). Keep `id`s stable when names change.
- Jay's Brick Blog typos: 10349 launched 1 Jun 2025 (its table says 2026); 11506 launched 1 May 2026 (its intro says 2025).
- 11518 (Jan 2027) is in `data.js` as a pre-release entry from retailer leaks: `figures: []`, no `lego`/`instructions` links, no gallery. Replace it with LEGO.com data once the product page is live (the name may become "Plants in Love"). One more 2027 set is still unannounced (`comingNote`).
