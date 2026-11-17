/*
@title        Plantdex - app
@version      0.3.1
@author       La Gia Huy
@since        2026-11-16
@updated      2026-11-17
@engine       JavaScript (ES5, browser), no framework
@target       Modern browsers incl. iOS Safari; data from data.js (window.PLANTDEX)
@about        Dex of the LEGO Botanicals planter buddies. Hash routes:
                #/                 home: collection stats, filter chips, every set + figures
                #/set/<sku>        set page: gallery, big facts, figures, links
                #/figure/<id>      figure page: gallery, set-mate tabs, story, sizes, owned/wishlist
                #/settings         theme, dim unowned, export/import/clear, about the data
              State is kept in localStorage ("plantdex:v1"):
                { owned: { id: "YYYY-MM-DD" }, wish: { id: "YYYY-MM-DD" },
                  prefs: { theme: "auto"|"light"|"dark", dim: bool, filter: "all"|"owned"|"missing"|"wish" } }
              Older files with owned[id] = true still load.
              Images are hotlinked from LEGO's CDN; a figure without an image, or whose
              image fails to load, gets a drawn pot in its pot colour.
              Keys: Esc / Backspace = back, arrow keys = previous / next page or image.
@changelog    0.3.1  Sets announced without figures (figures: []) show "not revealed yet";
                     LEGO.com and instructions links are optional.
              0.3.0  Scaledex-style UI: theme switch, stats card, progress bars, filter chips,
                     figure tabs, big facts, size chart, settings page, export/import,
                     scroll kept on back, keyboard navigation, image fallback. Set tagline,
                     ages and figure sizes from LEGO.com.
              0.2.0  First published version.
*/
(function () {
  "use strict";

  var D = window.PLANTDEX;
  var KEY = "plantdex:v1";
  var app = document.getElementById("app");
  var root = document.documentElement;
  var FIGS = [], BY_ID = {}, BY_SKU = {};
  var st = loadState();
  var prefs = st.prefs;
  var lightbox = null; // { items, i }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  D.sets.forEach(function (s) {
    BY_SKU[s.sku] = s;
    s.figures.forEach(function (f) { f.sku = s.sku; FIGS.push(f); BY_ID[f.id] = f; });
  });

  // ---------- icons (stroke = currentColor) ----------
  function ico(body, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2.4) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }
  var ICON = {
    back: ico('<path d="M15 5l-7 7 7 7"/>', 2.8),
    menu: ico('<path d="M4 7h16M4 12h16M4 17h16"/>', 2.6),
    sun: ico('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>'),
    moon: ico('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
    all: ico('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
    owned: ico('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 2.8),
    missing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3.2 3.2" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>',
    wish: ico('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>')
  };
  var FILTERS = [["all", "All"], ["owned", "Owned"], ["missing", "Missing"], ["wish", "Wishlist"]];

  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    var p = String(iso || "").split("-");
    if (p.length < 3) return esc(iso || "TBA");
    return (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0];
  }
  function monthYear(iso) {
    var p = String(iso || "").split("-");
    return p.length < 2 ? esc(iso || "TBA") : MONTHS[+p[1] - 1] + " " + p[0];
  }
  function today() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function upcoming(s) { return !s.released || s.released > today(); }
  function figName(f) { return f.name || f.nickname || "Unnamed"; }
  function items(list) {
    return (list || []).map(function (g) { return typeof g === "string" ? { src: g } : g; })
      .filter(function (g) { return g && g.src; });
  }
  function figImages(f) {
    return items(BY_SKU[f.sku].gallery).filter(function (g) { return g.fig === f.id; });
  }
  // LEGO's CDN resizes on request; other URLs are used as they are.
  function sized(src, w) {
    if (!/lego\.com\/cdn\//.test(src) || src.indexOf("?") >= 0) return src;
    return src + "?format=webply&fit=bounds&quality=75&width=" + w + "&height=" + w;
  }
  function lum(hex) {
    var n = parseInt(String(hex).replace("#", ""), 16);
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255;
  }
  function cmIn(cm) { return cm + " cm (" + (Math.round(cm / 2.54 * 2) / 2) + " in.)"; }
  function isOwned(f) { return !!st.owned[f.id]; }
  function isWish(f) { return !!st.wish[f.id]; }
  function ownedIn(list) { return list.filter(isOwned).length; }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }

  // ---------- state ----------
  function loadState() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return normState(s);
  }
  function normState(s) {
    s = s && typeof s === "object" ? s : {};
    s.owned = s.owned && typeof s.owned === "object" ? s.owned : {};
    s.wish = s.wish && typeof s.wish === "object" ? s.wish : {};
    s.prefs = s.prefs && typeof s.prefs === "object" ? s.prefs : {};
    if (!/^(auto|light|dark)$/.test(s.prefs.theme)) s.prefs.theme = "auto";
    if (!/^(all|owned|missing|wish)$/.test(s.prefs.filter)) s.prefs.filter = "all";
    s.prefs.dim = !!s.prefs.dim;
    return s;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { alert("Could not save: " + e.message); }
  }

  // ---------- theme ----------
  function isDark() { return prefs.theme === "dark" || (prefs.theme === "auto" && !!(mq && mq.matches)); }
  function applyTheme() {
    if (prefs.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", prefs.theme);
    root.classList.toggle("dim", prefs.dim);
    var bg = isDark() ? "#161b15" : "#f4f1e8";
    Array.prototype.forEach.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) { m.setAttribute("content", bg); });
  }

  // ---------- pictures ----------
  // Drawn stand-in: a smiling pot in the figure's colour with a sprig on top.
  function potSvg(f) {
    var c = f.color || "#cccccc", ink = lum(c) > 0.55 ? "#2a2a2a" : "#1b1b1b";
    return '<svg class="pot" viewBox="0 0 120 120" role="img" aria-label="' + esc(figName(f)) + ' (drawing)">' +
      '<path d="M60 44 C52 26 38 20 30 22 C34 34 44 42 60 44Z" fill="#4f8a3c"/>' +
      '<path d="M60 44 C68 24 84 18 92 21 C88 34 76 42 60 44Z" fill="#62a24a"/>' +
      '<path d="M60 46 C58 30 60 16 64 10 C68 20 66 34 60 46Z" fill="#3d7330"/>' +
      '<rect x="18" y="62" width="10" height="20" rx="5" fill="' + c + '" transform="rotate(20 23 72)"/>' +
      '<rect x="92" y="62" width="10" height="20" rx="5" fill="' + c + '" transform="rotate(-20 97 72)"/>' +
      '<rect x="40" y="96" width="14" height="14" rx="5" fill="' + c + '"/>' +
      '<rect x="66" y="96" width="14" height="14" rx="5" fill="' + c + '"/>' +
      '<rect x="26" y="44" width="68" height="58" rx="14" fill="' + c + '"/>' +
      '<rect x="26" y="44" width="68" height="10" rx="5" fill="#000" opacity=".12"/>' +
      '<circle cx="47" cy="72" r="4" fill="' + ink + '"/><circle cx="73" cy="72" r="4" fill="' + ink + '"/>' +
      '<path d="M52 82 Q60 90 68 82" stroke="' + ink + '" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="40" cy="81" r="4" fill="#ff7a8a" opacity=".45"/><circle cx="80" cy="81" r="4" fill="#ff7a8a" opacity=".45"/>' +
      "</svg>";
  }

  // Tile picture. The crop is an <img> scaled and shifted inside its box (not a CSS background),
  // so a failed load fires "error" and falls back to the drawn pot (see onImgError).
  function figArt(f, w) {
    var c = f.card;
    if (c && c.src) {
      var z = c.zoom || 1, x = c.x == null ? 50 : c.x, y = c.y == null ? 50 : c.y;
      return '<span class="crop"><img src="' + esc(sized(c.src, w || 800)) + '" alt="' + esc(figName(f)) + '" data-fig="' + f.id +
        '" decoding="async" style="width:' + (z * 100) + "%;left:" + (x * (1 - z)) + "%;top:" + y + "%;transform:translateY(-" + y + '%)"></span>';
    }
    var imgs = figImages(f);
    if (imgs.length) {
      return '<img src="' + esc(sized(imgs[0].src, w ? Math.round(w * 0.6) : 480)) + '" alt="' + esc(figName(f)) + '" data-fig="' + f.id +
        '" loading="lazy" decoding="async">';
    }
    return potSvg(f);
  }

  // ---------- shared pieces ----------
  function header(back) {
    var dk = isDark();
    return '<header class="bar">' +
      (back ? '<button class="icon-btn back" data-act="back" data-to="' + esc(back) + '" aria-label="Back" title="Back (Esc)">' + ICON.back + "</button>" : "") +
      '<a class="brand" href="#/"><span class="logo">' + leafLogo() + "</span><span>" + esc(D.title) + "</span></a>" +
      '<span class="bar-end"><a class="count" href="#/" title="Figures owned">' + ownedIn(FIGS) + " / " + FIGS.length + "</a>" +
      '<button class="icon-btn" data-act="theme" role="switch" aria-checked="' + dk + '" aria-label="Dark theme" title="' +
      (dk ? "Switch to light theme" : "Switch to dark theme") + '">' + (dk ? ICON.moon : ICON.sun) + "</button>" +
      '<a class="icon-btn" href="#/settings" aria-label="Settings" title="Settings">' + ICON.menu + "</a></span></header>";
  }
  function leafLogo() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="15" rx="4" fill="currentColor" opacity=".9"/>' +
      '<path d="M16 15 C11 9 7 8 4 9 C6 13 10 15 16 15Z M16 15 C21 8 25 7 28 8 C26 12 22 15 16 15Z" fill="#62a24a"/></svg>';
  }
  function bar(owned, total) {
    return owned >= total && total ? '<span class="done">✓ Complete</span>' :
      '<span class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + owned + '" aria-label="' +
      owned + " of " + total + ' owned"><i style="width:' + pct(owned, total) + '%"></i></span>';
  }
  function setBadge(s) { return upcoming(s) ? '<span class="badge soon">Upcoming</span>' : ""; }
  function unofficial(f) { return f.name ? "" : ' <span class="unofficial" title="LEGO hasn\'t named this figure">unofficial name</span>'; }

  function figCard(f) {
    var own = isOwned(f), wish = isWish(f);
    return '<a class="fig-card' + (own ? " owned" : "") + '" href="#/figure/' + f.id + '" style="--c:' + f.color + '">' +
      '<div class="fig-art">' + figArt(f) +
      (own ? '<span class="dot own" title="Owned">✓</span>' : wish ? '<span class="dot wish" title="Wishlist">♥</span>' : "") + "</div>" +
      '<div class="fig-meta"><b>' + esc(figName(f)) + "</b>" + unofficial(f) +
      "<span>" + esc(f.plant) + "</span></div></a>";
  }

  // Three or four big numbers in a row, like Scaledex's figure card.
  function bigFacts(list) {
    return '<div class="big-facts">' + list.filter(function (x) { return x; }).map(function (x) {
      return "<div><b>" + x[0] + "</b><span>" + esc(x[1]) + "</span></div>";
    }).join("") + "</div>";
  }
  function facts(rows) {
    return '<dl class="facts">' + rows.filter(function (r) { return r[1] !== "" && r[1] != null; }).map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
    }).join("") + "</dl>";
  }
  function links(s) {
    return '<div class="links">' +
      (s.lego ? '<a href="' + esc(s.lego) + '" target="_blank" rel="noopener">LEGO.com ↗</a>' : "") +
      (s.instructions ? '<a href="' + esc(s.instructions) + '" target="_blank" rel="noopener">Building instructions ↗</a>' : "") +
      (s.review ? '<a href="' + esc(s.review) + '" target="_blank" rel="noopener">Review ↗</a>' : "") + "</div>";
  }
  function neighbours(list, x, href, label) {
    var i = list.indexOf(x), p = list[i - 1], n = list[i + 1];
    return '<nav class="pager">' +
      (p ? '<a href="' + href(p) + '" data-pager="prev"><small>Previous</small>‹ ' + esc(label(p)) + "</a>" : "<span></span>") +
      (n ? '<a href="' + href(n) + '" data-pager="next"><small>Next</small>' + esc(label(n)) + " ›</a>" : "<span></span>") + "</nav>";
  }
  function footer() {
    return '<footer class="foot">Unofficial fan index. LEGO, the LEGO logo and set images © The LEGO Group. ' +
      "Set facts from LEGO.com and Jay's Brick Blog.</footer>";
  }

  // ---------- gallery + lightbox ----------
  function gallery(list, fallbackFig) {
    if (!list.length) {
      return '<div class="gallery empty"><div class="hero-art">' + (fallbackFig ? potSvg(fallbackFig) : "") + "</div>" +
        '<p class="hint">No LEGO images added yet. Add image URLs to <code>gallery</code> in <code>data.js</code>.</p></div>';
    }
    var h = '<div class="gallery"><button class="hero" data-act="zoom" data-i="0" aria-label="Enlarge picture">' +
      '<img src="' + esc(sized(list[0].src, 1000)) + '" alt="' + esc(list[0].caption || "") + '">' +
      (list.length > 1 ? '<span class="hero-count">1 / ' + list.length + "</span>" : "") + "</button>";
    if (list.length > 1) {
      h += '<div class="thumbs">';
      list.forEach(function (g, i) {
        h += '<button class="thumb' + (i ? "" : " on") + '" data-act="pick" data-i="' + i + '" title="' + esc(g.caption || "Picture " + (i + 1)) +
          '" aria-label="' + esc(g.caption || "Picture " + (i + 1)) + '"><img src="' + esc(sized(g.src, 160)) + '" alt="" loading="lazy" decoding="async"></button>';
      });
      h += "</div>";
    }
    return h + "</div>";
  }
  // thumbnail tap: show it in the hero (tap the hero to enlarge)
  function pickImage(i) {
    var g = current.list[i], hero = app.querySelector(".hero");
    if (!g || !hero) return;
    hero.setAttribute("data-i", i);
    var img = hero.querySelector("img");
    img.src = sized(g.src, 1000); img.alt = g.caption || "";
    var c = hero.querySelector(".hero-count");
    if (c) c.textContent = (i + 1) + " / " + current.list.length;
    Array.prototype.forEach.call(app.querySelectorAll(".thumb"), function (t, k) { t.classList.toggle("on", k === i); });
  }

  function openLightbox(list, i) {
    lightbox = { items: list, i: i };
    var el = document.createElement("div");
    el.className = "lightbox";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "Image viewer");
    document.body.appendChild(el);
    document.body.classList.add("locked");
    drawLightbox();
  }
  function drawLightbox() {
    var el = document.querySelector(".lightbox");
    if (!el || !lightbox) return;
    var g = lightbox.items[lightbox.i], n = lightbox.items.length;
    el.innerHTML = '<button class="lb-close" data-lb="close" aria-label="Close">×</button>' +
      (n > 1 ? '<button class="lb-nav prev" data-lb="prev" aria-label="Previous">‹</button><button class="lb-nav next" data-lb="next" aria-label="Next">›</button>' : "") +
      '<figure><img src="' + esc(sized(g.src, 1600)) + '" alt="' + esc(g.caption || "") + '">' +
      "<figcaption>" + (g.caption ? esc(g.caption) + " · " : "") + (lightbox.i + 1) + " / " + n + "</figcaption></figure>";
    var close = el.querySelector(".lb-close");
    if (close) close.focus();
  }
  function closeLightbox() {
    var el = document.querySelector(".lightbox");
    if (el) el.parentNode.removeChild(el);
    document.body.classList.remove("locked");
    if (lightbox) pickImage(lightbox.i);
    lightbox = null;
  }
  function stepLightbox(d) {
    if (!lightbox) return;
    var n = lightbox.items.length;
    lightbox.i = (lightbox.i + d + n) % n;
    drawLightbox();
  }

  // ---------- views ----------
  var current = { list: [] }; // images of the page on screen, for the lightbox
  // shown instead of the figure grid for an announced set whose figures aren't known yet
  var NO_FIGS = '<p class="no-figs">The two figures haven’t been revealed yet.</p>';

  function matches(f) {
    var k = prefs.filter;
    return k === "owned" ? isOwned(f) : k === "missing" ? !isOwned(f) : k === "wish" ? isWish(f) : true;
  }

  function viewHome() {
    var own = ownedIn(FIGS), wish = FIGS.filter(isWish).length;
    var done = D.sets.filter(function (s) { return s.figures.length && ownedIn(s.figures) === s.figures.length; }).length;
    var h = header() + '<main class="wrap">' +
      '<section class="statcard"><div class="stat-head"><h1>LEGO Botanicals planter buddies</h1>' +
      '<span class="pill">' + own + " / " + FIGS.length + "</span></div>" + bar(own, FIGS.length) +
      '<div class="stats">' +
      "<div><b>" + D.sets.length + "</b><span>Sets</span></div>" +
      "<div><b>" + FIGS.length + "</b><span>Figures</span></div>" +
      "<div><b>" + done + "</b><span>Sets complete</span></div>" +
      "<div><b>" + wish + "</b><span>Wishlist</span></div>" +
      "<div><b>" + pct(own, FIGS.length) + "%</b><span>Owned</span></div></div></section>";

    h += '<div class="chips" role="toolbar" aria-label="Show">' + FILTERS.map(function (x) {
      var n = x[0] === "all" ? FIGS.length : FIGS.filter(function (f) {
        return x[0] === "owned" ? isOwned(f) : x[0] === "missing" ? !isOwned(f) : isWish(f);
      }).length;
      return '<button class="chip' + (prefs.filter === x[0] ? " on" : "") + '" data-act="filter" data-id="' + x[0] + '" aria-pressed="' +
        (prefs.filter === x[0]) + '">' + ICON[x[0]] + "<span>" + x[1] + "</span><em>" + n + "</em></button>";
    }).join("") + "</div>";

    var shown = 0;
    D.sets.forEach(function (s) {
      var figs = s.figures.filter(matches), unrevealed = !s.figures.length;
      if (!figs.length && !(unrevealed && prefs.filter === "all")) return;
      shown++;
      var o = ownedIn(s.figures), complete = !unrevealed && o === s.figures.length;
      h += '<section class="set-row' + (complete ? " complete" : "") + '" style="--c:' + s.color + '">' +
        '<a class="set-head" href="#/set/' + s.sku + '"><span class="sku">' + s.sku + "</span>" +
        "<h2>" + esc(s.name) + "</h2>" + setBadge(s) +
        '<span class="sub">' + monthYear(s.released) + " · " + s.pieces + " pieces · " + esc(s.prices[0]) + "</span>" +
        (s.tagline ? '<span class="tag">' + esc(s.tagline) + "</span>" : "") +
        (unrevealed ? "" : '<span class="set-prog">' + bar(o, s.figures.length) + "<b>" + o + " / " + s.figures.length + "</b></span>") +
        '<span class="go" aria-hidden="true">›</span></a>' +
        (unrevealed ? NO_FIGS : '<div class="fig-grid">' + figs.map(figCard).join("") + "</div>") + "</section>";
    });
    if (!shown) {
      h += '<div class="empty-state">' + (prefs.filter === "wish" ? "Nothing on your wishlist yet. Tap ♡ Wishlist on a figure page." :
        prefs.filter === "owned" ? "No figures marked as owned yet. Tap + Owned on a figure page." : "You own every figure. 🎉") + "</div>";
    }
    if (D.comingNote && prefs.filter === "all") h += '<section class="coming">🌱 ' + esc(D.comingNote) + "</section>";
    h += footer() + "</main>";
    current.list = [];
    return h;
  }

  function viewSet(sku) {
    var s = BY_SKU[sku];
    if (!s) return notFound();
    var list = items(s.gallery);
    current.list = list;
    var o = ownedIn(s.figures);
    var rows = [
      ["Set number", s.sku],
      ["Name", esc(s.name) + (s.altName ? ' <span class="muted">(UK: ' + esc(s.altName) + ")</span>" : "")],
      ["Released", fmtDate(s.released) + " " + setBadge(s)],
      ["Price at launch", s.prices.map(esc).join(" · ")],
      ["Figures", s.figures.length ? s.figures.map(function (f) { return '<a href="#/figure/' + f.id + '">' + esc(figName(f)) + "</a>"; }).join(" & ") : "Not revealed yet"]
    ];
    return header("#/") + '<main class="wrap" style="--c:' + s.color + '">' +
      '<div class="title"><span class="sku">LEGO Botanicals ' + s.sku + "</span><h1>" + esc(s.name) + "</h1>" +
      (s.tagline ? '<p class="tagline">' + esc(s.tagline) + "</p>" : "") + "</div>" +
      gallery(list, s.figures[0]) +
      '<section class="card">' + bigFacts([
        [s.pieces, "Pieces"], [esc(s.prices[0]), "Price"], s.ages ? [esc(s.ages), "Ages"] : null, [monthYear(s.released), "Released"]
      ]) + "</section>" +
      (s.about ? '<p class="about">' + esc(s.about) + "</p>" : "") +
      (s.figures.length ?
        '<h2 class="h">Figures <span class="h-end">' + o + " / " + s.figures.length + " owned</span></h2>" +
        '<div class="fig-grid">' + s.figures.map(figCard).join("") + "</div>" :
        '<h2 class="h">Figures</h2>' + NO_FIGS) +
      facts(rows) + links(s) +
      neighbours(D.sets, s, function (x) { return "#/set/" + x.sku; }, function (x) { return x.name; }) +
      footer() + "</main>";
  }

  function figTabs(f, s) {
    return '<nav class="fig-tabs" aria-label="Figures in this set">' + s.figures.map(function (x) {
      var on = x === f;
      return '<a class="fig-tab' + (on ? " on" : "") + (isOwned(x) ? " owned" : "") + '" href="#/figure/' + x.id + '" style="--c:' + x.color + '"' + (on ? ' aria-current="page"' : "") + ">" +
        '<span class="tab-art">' + figArt(x, 300) + "</span><span>" + esc(figName(x)) + "</span>" +
        (isOwned(x) ? '<span class="dot own small">✓</span>' : isWish(x) ? '<span class="dot wish small">♥</span>' : "") + "</a>";
    }).join("") + "</nav>";
  }

  // every figure LEGO gives a size for, tallest first; the current one highlighted
  function sizeChart(f) {
    var list = FIGS.filter(function (x) { return x.size && x.size.h; }).sort(function (a, b) { return b.size.h - a.size.h; });
    if (list.length < 2) return "";
    var max = list[0].size.h;
    var missing = FIGS.filter(function (x) { return !(x.size && x.size.h); });
    return '<h2 class="h">Sizes</h2><section class="card sizes">' + list.map(function (x) {
      return '<a class="size-row' + (x === f ? " on" : "") + '" href="#/figure/' + x.id + '" style="--c:' + x.color + '">' +
        "<span>" + esc(figName(x)) + '</span><span class="size-bar"><i style="width:' + pct(x.size.h, max) + '%"></i></span>' +
        "<b>" + x.size.h + " cm</b></a>";
    }).join("") +
      '<p class="note">Height from LEGO.com.' + (missing.length ? " LEGO doesn’t give " + missing.map(figName).join(", ") + "’s size." : "") + "</p></section>";
  }

  function viewFigure(id) {
    var f = BY_ID[id];
    if (!f) return notFound();
    var s = BY_SKU[f.sku];
    // this figure's own pictures first, then the rest of the set's gallery
    var list = figImages(f).concat(items(s.gallery).filter(function (g) { return g.fig !== f.id; }));
    current.list = list;
    var own = isOwned(f), wish = isWish(f);
    var rows = [
      ["Name", f.name ? esc(f.name) : '<span class="muted">No official name yet. Fans call it ' + esc(f.nickname) + ".</span>"],
      ["Set", '<a href="#/set/' + s.sku + '">' + s.sku + " " + esc(s.name) + "</a>"],
      ["Plant", esc(f.plant) + (f.latin ? ' <i class="muted">' + esc(f.latin) + "</i>" : "")],
      ["Pot", '<span class="swatch" style="background:' + f.color + '"></span>' + esc(f.pot)],
      ["Size", f.size ? cmIn(f.size.h) + " tall, " + f.size.w + " cm wide" : ""],
      ["Pose", esc(f.pose)],
      ["Special", esc(f.feature)],
      ["Accessory", esc(f.extras)]
    ];
    var story = f.story ? (f.greeting ? '<p class="greeting">' + esc(f.greeting) + "</p>" : "") +
      f.story.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<p class="src">From ' + esc(figName(f)) + "'s instruction booklet</p>" :
      '<p class="muted">Not added yet. The story is printed in ' + esc(figName(f)) + '\'s booklet in the <a href="' + esc(s.instructions) + '" target="_blank" rel="noopener">building instructions</a>.</p>';
    var since = own && typeof st.owned[f.id] === "string" ? '<p class="since">Owned since ' + fmtDate(st.owned[f.id]) + "</p>" : "";
    return header("#/set/" + s.sku) + '<main class="wrap" style="--c:' + f.color + '">' +
      '<div class="title"><a class="sku" href="#/set/' + s.sku + '">' + s.sku + " · " + esc(s.name) + "</a><h1>" + esc(figName(f)) + unofficial(f) + "</h1>" +
      '<p class="tagline">' + esc(f.plant) + (f.latin ? ' · <i>' + esc(f.latin) + "</i>" : "") + "</p></div>" +
      figTabs(f, s) +
      gallery(list, f) +
      '<section class="card">' + bigFacts([
        [f.size ? f.size.h + " cm" : "—", "Height"], [esc(f.pot), "Pot"], [monthYear(s.released), "Released"]
      ]) +
      '<div class="toggles">' +
      '<button class="toggle own' + (own ? " on" : "") + '" data-act="own" data-id="' + f.id + '" aria-pressed="' + own + '">' + (own ? "✓ Owned" : "+ Owned") + "</button>" +
      '<button class="toggle wish' + (wish ? " on" : "") + '" data-act="wish" data-id="' + f.id + '" aria-pressed="' + wish + '">' + (wish ? "♥ Wishlist" : "♡ Wishlist") + "</button>" +
      "</div>" + since + "</section>" +
      '<section class="story"><h2>Story</h2>' + story + "</section>" +
      facts(rows) +
      sizeChart(f) +
      neighbours(FIGS, f, function (x) { return "#/figure/" + x.id; }, figName) +
      footer() + "</main>";
  }

  function viewSettings() {
    current.list = [];
    var nOwn = Object.keys(st.owned).length, nWish = Object.keys(st.wish).length;
    var themes = [["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]];
    return header("#/") + '<main class="wrap">' +
      '<div class="title"><h1>Settings</h1></div>' +
      '<h2 class="h">Theme</h2><div class="seg" role="radiogroup" aria-label="Theme">' + themes.map(function (t) {
        var on = prefs.theme === t[0];
        return '<button role="radio" aria-checked="' + on + '" class="' + (on ? "on" : "") + '" data-act="set-theme" data-id="' + t[0] + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<p class="note">Auto follows your device.</p>' +
      '<h2 class="h">Display</h2><div class="menu">' +
      '<label>Grey out figures I don’t own <input type="checkbox" data-act="dim"' + (prefs.dim ? " checked" : "") + "></label></div>" +
      '<h2 class="h">Collection</h2><div class="menu">' +
      '<p class="note">' + nOwn + " owned · " + nWish + " on wishlist. Saved in this browser only; export to move it to another device.</p>" +
      '<button data-act="export">Export collection <span>›</span></button>' +
      '<button data-act="import">Import collection <span>›</span></button>' +
      '<button data-act="reset" class="danger">Clear owned &amp; wishlist <span>›</span></button></div>' +
      '<h2 class="h">About the data</h2><section class="card note">' +
      D.sets.length + " sets, " + FIGS.length + " figures" + (D.checked ? ", checked against LEGO.com on " + fmtDate(D.checked) : "") + ".<br>" +
      "Sources: LEGO.com product pages (names, pieces, prices, sizes, photos), the sets’ instruction booklets (stories) and " +
      '<a href="https://jaysbrickblog.com/" target="_blank" rel="noopener">Jay’s Brick Blog</a> reviews. ' +
      "Images load from LEGO’s site and are © The LEGO Group.<br>" +
      "Keys: Esc or Backspace goes back, ← → move between pages and pictures.</section>" +
      footer() + "</main>";
  }

  function notFound() {
    current.list = [];
    return header("#/") + '<main class="wrap"><div class="empty-state">Nothing here. <a href="#/">Back to all sets</a></div></main>';
  }

  // ---------- export / import ----------
  function exportState() {
    var data = { owned: st.owned, wish: st.wish, prefs: st.prefs, exported: today() };
    var blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    var name = "plantdex-collection.json";
    try {
      var file = new File([blob], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: "Plantdex collection" }).catch(function () {});
        return;
      }
    } catch (e) { /* no File constructor: download instead */ }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function importState() {
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "application/json,.json";
    inp.onchange = function () {
      var file = inp.files[0];
      if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var s = JSON.parse(r.result);
          if (!s || typeof s.owned !== "object") throw new Error("not a Plantdex collection file");
          var known = Object.keys(s.owned).filter(function (id) { return BY_ID[id]; }).length;
          if (!confirm("Replace your collection with " + known + " owned figure" + (known === 1 ? "" : "s") + " from this file?")) return;
          s.prefs = s.prefs || prefs;
          st = normState(s); prefs = st.prefs;
          save(); applyTheme(); rerenderKeepScroll();
        } catch (e) { alert("Import failed: " + e.message); }
      };
      r.readAsText(file);
    };
    inp.click();
  }

  // ---------- router ----------
  // History of routes seen this session: going to the route before the current one counts as
  // "back" and restores its scroll position (home keeps your place in the list).
  var trail = [], scrollAt = {};
  function route() { return location.hash.replace(/^#\/?/, "") || ""; }
  function view(r) {
    var parts = r.split("/");
    return parts[0] === "set" ? viewSet(parts[1]) : parts[0] === "figure" ? viewFigure(parts[1]) :
      parts[0] === "settings" ? viewSettings() : viewHome();
  }
  function render() {
    if (lightbox) { var lb = document.querySelector(".lightbox"); if (lb) lb.parentNode.removeChild(lb); lightbox = null; document.body.classList.remove("locked"); }
    var r = route(), prev = trail[trail.length - 1];
    if (prev != null) scrollAt[prev] = window.pageYOffset;
    var isBack = trail.length > 1 && trail[trail.length - 2] === r;
    if (isBack) trail.pop(); else if (prev !== r) trail.push(r);
    applyTheme();
    app.innerHTML = view(r);
    var t = app.querySelector("h1");
    document.title = r && t ? t.firstChild.textContent.trim() + " · " + D.title : D.title; // first text node: no "unofficial name" tag
    window.scrollTo(0, isBack ? scrollAt[r] || 0 : 0);
  }
  function rerenderKeepScroll() {
    var y = window.pageYOffset;
    applyTheme();
    app.innerHTML = view(route());
    window.scrollTo(0, y);
  }
  function goBack(fallback) {
    if (trail.length > 1) history.back();
    else location.hash = fallback || "#/";
  }
  function parentOf(r) {
    var p = r.split("/");
    return p[0] === "figure" && BY_ID[p[1]] ? "#/set/" + BY_ID[p[1]].sku : "#/";
  }

  // ---------- events ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-act],[data-lb]") : null;
    if (!t) {
      if (lightbox && e.target.classList && (e.target.classList.contains("lightbox") || e.target.tagName === "FIGURE")) closeLightbox();
      return;
    }
    var act = t.getAttribute("data-act"), lb = t.getAttribute("data-lb"), id = t.getAttribute("data-id");
    if (lb === "close") return closeLightbox();
    if (lb === "prev") return stepLightbox(-1);
    if (lb === "next") return stepLightbox(1);
    switch (act) {
      case "zoom": openLightbox(current.list, +t.getAttribute("data-i")); break;
      case "pick": pickImage(+t.getAttribute("data-i")); break;
      case "back": goBack(t.getAttribute("data-to")); break;
      case "own": case "wish":
        var bag = act === "own" ? st.owned : st.wish;
        if (bag[id]) delete bag[id]; else bag[id] = today();
        if (act === "own" && st.owned[id]) delete st.wish[id]; // owned replaces wishlist
        save(); rerenderKeepScroll(); break;
      case "filter": prefs.filter = id; save(); rerenderKeepScroll(); break;
      case "theme": prefs.theme = isDark() ? "light" : "dark"; save(); rerenderKeepScroll(); break;
      case "set-theme": prefs.theme = id; save(); rerenderKeepScroll(); break;
      case "export": exportState(); break;
      case "import": importState(); break;
      case "reset":
        if (!confirm("Clear all owned and wishlist marks?")) break;
        st.owned = {}; st.wish = {}; save(); rerenderKeepScroll(); break;
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.getAttribute && e.target.getAttribute("data-act") === "dim") {
      prefs.dim = e.target.checked; save(); applyTheme();
    }
  });
  // a LEGO image that fails to load: tiles fall back to the drawn pot, others hide
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (!img || img.tagName !== "IMG") return;
    var f = BY_ID[img.getAttribute("data-fig")];
    var box = img.closest(".crop") || img;
    if (f) {
      var span = document.createElement("span");
      span.className = "fallback";
      span.innerHTML = potSvg(f);
      box.parentNode.replaceChild(span, box);
    } else if (img.closest(".thumb")) {
      img.closest(".thumb").style.display = "none";
    } else {
      img.style.visibility = "hidden";
    }
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = e.target && e.target.tagName, typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable);
    if (lightbox) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") stepLightbox(-1);
      else if (e.key === "ArrowRight") stepLightbox(1);
      else return;
      e.preventDefault();
      return;
    }
    if (typing) return;
    var r = route();
    if ((e.key === "Escape" || e.key === "Backspace") && r) { e.preventDefault(); goBack(parentOf(r)); return; }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      var a = app.querySelector('[data-pager="' + (e.key === "ArrowLeft" ? "prev" : "next") + '"]');
      if (a) { e.preventDefault(); location.hash = a.getAttribute("href"); }
    }
  });

  var touchX = null;
  document.addEventListener("touchstart", function (e) {
    touchX = lightbox && e.touches.length === 1 ? e.touches[0].clientX : null;
  }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (touchX == null || !lightbox) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) stepLightbox(dx < 0 ? 1 : -1);
    touchX = null;
  });

  if (mq) {
    var onScheme = function () { if (prefs.theme === "auto") rerenderKeepScroll(); };
    if (mq.addEventListener) mq.addEventListener("change", onScheme); else if (mq.addListener) mq.addListener(onScheme);
  }
  window.addEventListener("hashchange", render);
  render();
})();
