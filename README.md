# Plantdex

A small dex of the **LEGO Botanicals planter buddies**, the pot figures with faces that come two to a set.

**Open the app: https://huyla1903.github.io/Plantdex/**

## 💡 Motivation

Since 2025, LEGO Botanicals has a line of small sets with two potted plant figures each, and every pair gets a plant, a pose and a short story in its instruction booklet. That information is split across LEGO.com, the PDF instructions and reviews. Plantdex puts every set and figure on one page, with LEGO's product photos, the story from the booklet, and owned / wishlist marks. It is a sibling of [Scaledex](https://github.com/huyla1903/Scaledex), as a plain web app only.

## 🚀 Quick Start

Use the [hosted app](https://huyla1903.github.io/Plantdex/), or open `index.html` in a browser: no build step and no server needed.

To use it on a phone, open the hosted app and add it to the home screen. It then works offline, except the LEGO images.

## 📖 Usage

### What's in it

| Set | Name | Released | Figures |
|---|---|---|---|
| 10349 | Happy Plants | 1 Jun 2025 | "Yellow" (dracaena), "Blue" (pilea): no official names yet |
| 11506 | Rocking Plants | 1 May 2026 | Ellie (echeveria), Lumi (ice plant) |
| 10371 | Cozy Plants (UK: Cosy Plants) | 1 Nov 2026 | Momi (chamomile), Remi (peppermint) |

- **Home:** collection stats and progress, filter chips (All / Owned / Missing / Wishlist), and every set with its two figures and a progress bar.
- **Set page:** LEGO's tagline and photo gallery (tap a thumbnail to show it, tap the big picture to enlarge, swipe or arrow keys to browse), pieces, price, ages, release, links to LEGO.com, the building instructions and the review.
- **Figure page:** tabs for both figures of the set, the booklet story, plant (common and botanical name), pot colour, size, pose, accessory, a size chart of every figure, and Owned / Wishlist buttons.
- **Settings** (☰): light / dark / auto theme, grey out figures you don't own, export / import / clear your collection.
- Keys: Esc or Backspace goes back, ← → move to the previous / next set or figure, H home, M settings, T theme, 1–4 home filters, O / W owned / wishlist on a figure page. Settings lists them all.
- Links: `#/set/11506`, `#/figure/ellie`, `#/settings`.

Owned and wishlist marks are saved in the browser (localStorage), per device. Use Settings → Export / Import to move them to another device.

### Adding or updating sets

Everything lives in [data.js](data.js); the field list is in its header.

- **New set:** copy a set block, give each figure a new lowercase `id` and add the set at the end of `sets`. Clear or update `comingNote`.
- **Images:** open the LEGO product page, right-click a gallery image → *Copy image address*, and paste the URL (without the `?…` part) into the set's `gallery`. Use `{ src: "...", fig: "ellie" }` when an image shows one figure: that figure's page lists it first. The figure's tile picture is `card`, a zoom into one side of a group photo. Images are loaded from LEGO's site, never downloaded.
- **Stories:** copy the headline ("Hi, my name is …") into `greeting` and the text into `story`. They're on pages 4–5 of the set's first instruction booklet. A blank line starts a new paragraph.
- **Shortcut:** save the product page (Ctrl+S) and the instruction PDFs into `temp/` (not committed) and ask Claude to fill in the set.
- **Happy Plants names:** if LEGO names Yellow and Blue, set `name` and keep the `id`, so links keep working.

### Data sources

- Set facts, prices, taglines, figure sizes, names and plants: LEGO.com product pages (last checked 16 Nov 2026) and [Jay's Brick Blog](https://jaysbrickblog.com/) reviews of [10349](https://jaysbrickblog.com/reviews/review-lego-10349-happy-plants/), [11506](https://jaysbrickblog.com/reviews/review-lego-11506-rocking-plants/) and [10371](https://jaysbrickblog.com/reviews/review-lego-10371-cosy-plants/).
- Stories: the sets' building-instruction booklets.

Unofficial fan index. LEGO, the LEGO logo and set images © The LEGO Group.

## 🤝 Contributing

### Clone the repo

```bash
git clone https://github.com/huyla1903/Plantdex.git
cd Plantdex
```

### Run it locally

Open `index.html` directly. To try the offline mode, serve the folder over https (the service worker only registers on https).

```
index.html             page shell
data.js                all sets and figures (edit this)
app.js, app.css        UI (no framework)
sw.js                  offline cache for the app shell
manifest.webmanifest   home-screen install
icons/                 app icons
donate.jpg             donation QR code (Settings)
tools/check.mjs        pre-deploy check
```

### Test your changes

Run `node tools/check.mjs`. It checks the JS syntax, that `data.js` loads, and that set and figure ids are unique and linked. GitHub runs it before every deploy and won't publish if it fails. There are no other automated tests: open `index.html` and check that the home page, every set page and every figure page render, that the gallery opens and browses, and that Owned / Wishlist survive a reload.

### Submit a pull request

If you'd like to contribute, please fork the repository and open a pull request to the `main` branch.
