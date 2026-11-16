/*
@title        Plantdex - app
@version      0.2.0
@author       La Gia Huy
@since        2026-11-16
@updated      2026-11-16
@engine       JavaScript (ES5, browser), no framework
@target       Modern browsers incl. iOS Safari; data from data.js (window.PLANTDEX)
@about        Dex of the LEGO Botanicals planter buddies. Hash routes:
                #/                 home (every set with its two figures)
                #/set/<sku>        set page: gallery, facts, figures, links
                #/figure/<id>      figure page: gallery, plant, story, owned/wishlist
              Owned/wishlist marks are kept in localStorage ("plantdex:v1").
              Images are hotlinked from LEGO's CDN; a figure without any image gets a
              drawn pot placeholder in its pot colour.
*/
(function () {
  "use strict";

  var D = window.PLANTDEX;
  var KEY = "plantdex:v1";
  var app = document.getElementById("app");
  var FIGS = [], BY_ID = {}, BY_SKU = {};
  var marks = loadMarks();
  var lightbox = null; // { items, i }

  D.sets.forEach(function (s) {
    BY_SKU[s.sku] = s;
    s.figures.forEach(function (f) { f.sku = s.sku; FIGS.push(f); BY_ID[f.id] = f; });
  });

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
  function inkOn(hex) { return lum(hex) > 0.55 ? "#24301f" : "#ffffff"; }

  function loadMarks() {
    try { var m = JSON.parse(localStorage.getItem(KEY)); if (m && m.owned) return m; } catch (e) {}
    return { owned: {}, wish: {} };
  }
  function saveMarks() { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (e) {} }

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

  function figArt(f) {
    var c = f.card;
    if (c && c.src) {
      return '<span class="crop" role="img" aria-label="' + esc(figName(f)) + '" style="background-image:url(\'' + esc(sized(c.src, 800)) +
        '\');background-size:' + ((c.zoom || 1) * 100) + '% auto;background-position:' + (c.x == null ? 50 : c.x) + '% ' + (c.y == null ? 50 : c.y) + '%"></span>';
    }
    var imgs = figImages(f);
    if (imgs.length) return '<img src="' + esc(sized(imgs[0].src, 480)) + '" alt="' + esc(figName(f)) + '" loading="lazy">';
    return potSvg(f);
  }

  function markBtns(f) {
    var own = !!marks.owned[f.id], wish = !!marks.wish[f.id];
    return '<div class="marks">' +
      '<button class="mark' + (own ? " on" : "") + '" data-act="own" data-id="' + f.id + '" aria-pressed="' + own + '">' +
      (own ? "✓ Owned" : "+ Owned") + "</button>" +
      '<button class="mark wish' + (wish ? " on" : "") + '" data-act="wish" data-id="' + f.id + '" aria-pressed="' + wish + '">' +
      (wish ? "♥ Wishlist" : "♡ Wishlist") + "</button></div>";
  }

  function figCard(f) {
    var own = !!marks.owned[f.id];
    return '<a class="fig-card' + (own ? " owned" : "") + '" href="#/figure/' + f.id + '" style="--c:' + f.color + '">' +
      '<div class="fig-art">' + figArt(f) + (own ? '<span class="tick" title="Owned">✓</span>' : marks.wish[f.id] ? '<span class="tick heart" title="Wishlist">♥</span>' : "") + "</div>" +
      '<div class="fig-meta"><b>' + esc(figName(f)) + "</b>" + (f.name ? "" : ' <span class="unofficial">unofficial name</span>') +
      "<span>" + esc(f.plant) + "</span></div></a>";
  }

  function setBadge(s) {
    return upcoming(s) ? '<span class="badge soon">Upcoming</span>' : "";
  }

  function header(back) {
    var owned = FIGS.filter(function (f) { return marks.owned[f.id]; }).length;
    return '<header class="bar">' +
      (back ? '<a class="back" href="' + back + '" aria-label="Back">‹</a>' : "") +
      '<a class="brand" href="#/"><span class="logo">' + leafLogo() + "</span>" + esc(D.title) + "</a>" +
      '<span class="count" title="Figures owned">' + owned + " / " + FIGS.length + "</span></header>";
  }
  function leafLogo() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="15" rx="4" fill="currentColor" opacity=".9"/>' +
      '<path d="M16 15 C11 9 7 8 4 9 C6 13 10 15 16 15Z M16 15 C21 8 25 7 28 8 C26 12 22 15 16 15Z" fill="#62a24a"/></svg>';
  }

  // ---------- gallery ----------
  function gallery(list, fallbackFig) {
    if (!list.length) {
      return '<div class="gallery empty"><div class="hero-art">' + (fallbackFig ? potSvg(fallbackFig) : "") + "</div>" +
        '<p class="hint">No LEGO images added yet. Add image URLs to <code>gallery</code> in <code>data.js</code>.</p></div>';
    }
    var h = '<div class="gallery"><button class="hero" data-act="zoom" data-i="0">' +
      '<img src="' + esc(sized(list[0].src, 1000)) + '" alt="' + esc(list[0].caption || "") + '"></button>';
    if (list.length > 1) {
      h += '<div class="thumbs">';
      list.forEach(function (g, i) {
        h += '<button class="thumb" data-act="zoom" data-i="' + i + '" title="' + esc(g.caption || "") + '"><img src="' + esc(sized(g.src, 160)) + '" alt="" loading="lazy"></button>';
      });
      h += "</div>";
    }
    return h + "</div>";
  }

  function openLightbox(list, i) {
    lightbox = { items: list, i: i };
    var el = document.createElement("div");
    el.className = "lightbox";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Image viewer");
    document.body.appendChild(el);
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
  }
  function closeLightbox() {
    var el = document.querySelector(".lightbox");
    if (el) el.parentNode.removeChild(el);
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

  function viewHome() {
    var h = header() + '<main class="wrap">' +
      '<section class="intro"><h1>LEGO Botanicals planter buddies</h1>' +
      "<p>" + D.sets.length + " sets · " + FIGS.length + " figures. Tap a figure for its plant and story.</p></section>";
    D.sets.forEach(function (s) {
      h += '<section class="set-row" style="--c:' + s.color + '">' +
        '<a class="set-head" href="#/set/' + s.sku + '"><span class="sku">' + s.sku + "</span>" +
        "<h2>" + esc(s.name) + "</h2>" + setBadge(s) +
        '<span class="sub">' + fmtDate(s.released) + " · " + s.pieces + " pieces · " + esc(s.prices[0]) + "</span>" +
        '<span class="go">Set page ›</span></a>' +
        '<div class="fig-grid">' + s.figures.map(figCard).join("") + "</div></section>";
    });
    if (D.comingNote) h += '<section class="coming">🌱 ' + esc(D.comingNote) + "</section>";
    h += footer() + "</main>";
    current.list = [];
    return h;
  }

  function viewSet(sku) {
    var s = BY_SKU[sku];
    if (!s) return notFound();
    var list = items(s.gallery);
    current.list = list;
    var rows = [
      ["Set number", s.sku],
      ["Name", esc(s.name) + (s.altName ? ' <span class="muted">(' + esc(s.altName) + ")</span>" : "")],
      ["Released", fmtDate(s.released) + " " + setBadge(s)],
      ["Pieces", s.pieces],
      ["Price at launch", s.prices.map(esc).join(" · ")],
      ["Figures", s.figures.map(function (f) { return '<a href="#/figure/' + f.id + '">' + esc(figName(f)) + "</a>"; }).join(" & ")]
    ];
    return header("#/") + '<main class="wrap" style="--c:' + s.color + '">' +
      '<div class="title"><span class="sku">' + s.sku + "</span><h1>" + esc(s.name) + "</h1></div>" +
      gallery(list, s.figures[0]) +
      (s.about ? '<p class="about">' + esc(s.about) + "</p>" : "") +
      facts(rows) +
      "<h2>Figures</h2><div class=\"fig-grid\">" + s.figures.map(figCard).join("") + "</div>" +
      links(s) + neighbours(D.sets, s, function (x) { return "#/set/" + x.sku; }, function (x) { return x.name; }) +
      footer() + "</main>";
  }

  function viewFigure(id) {
    var f = BY_ID[id];
    if (!f) return notFound();
    var s = BY_SKU[f.sku];
    // this figure's own pictures first, then the rest of the set's gallery
    var list = figImages(f).concat(items(s.gallery).filter(function (g) { return g.fig !== f.id; }));
    current.list = list;
    var partner = s.figures.filter(function (x) { return x !== f; })[0];
    var rows = [
      ["Name", f.name ? esc(f.name) : '<span class="muted">No official name yet. Fans call it ' + esc(f.nickname) + ".</span>"],
      ["Set", '<a href="#/set/' + s.sku + '">' + s.sku + " " + esc(s.name) + "</a>"],
      ["Plant", esc(f.plant) + (f.latin ? ' <i class="muted">' + esc(f.latin) + "</i>" : "")],
      ["Pot", '<span class="swatch" style="background:' + f.color + '"></span>' + esc(f.pot)],
      ["Pose", esc(f.pose)],
      ["Special", esc(f.feature)],
      ["Accessory", esc(f.extras)],
      ["Partner", partner ? '<a href="#/figure/' + partner.id + '">' + esc(figName(partner)) + "</a>" : ""]
    ];
    var story = f.story ? (f.greeting ? '<p class="greeting">' + esc(f.greeting) + "</p>" : "") +
      f.story.split(/\n\s*\n/).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<p class="src">From ' + esc(figName(f)) + "'s instruction booklet</p>" :
      '<p class="muted">Not added yet. The story is printed in ' + esc(figName(f)) + '\'s booklet in the <a href="' + esc(s.instructions) + '" target="_blank" rel="noopener">building instructions</a>.</p>';
    return header("#/set/" + s.sku) + '<main class="wrap" style="--c:' + f.color + '">' +
      '<div class="title"><span class="sku">' + s.sku + " · " + esc(s.name) + "</span><h1>" + esc(figName(f)) +
      (f.name ? "" : ' <span class="unofficial">unofficial name</span>') + "</h1></div>" +
      gallery(list, f) + markBtns(f) +
      '<section class="story"><h2>Story</h2>' + story + "</section>" +
      facts(rows) +
      neighbours(FIGS, f, function (x) { return "#/figure/" + x.id; }, figName) +
      footer() + "</main>";
  }

  function facts(rows) {
    return '<dl class="facts">' + rows.filter(function (r) { return r[1] !== "" && r[1] != null; }).map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>";
    }).join("") + "</dl>";
  }
  function links(s) {
    return '<div class="links">' +
      '<a href="' + esc(s.lego) + '" target="_blank" rel="noopener">LEGO.com ↗</a>' +
      '<a href="' + esc(s.instructions) + '" target="_blank" rel="noopener">Building instructions ↗</a>' +
      (s.review ? '<a href="' + esc(s.review) + '" target="_blank" rel="noopener">Review ↗</a>' : "") + "</div>";
  }
  function neighbours(list, x, href, label) {
    var i = list.indexOf(x), p = list[i - 1], n = list[i + 1];
    return '<nav class="pager">' +
      (p ? '<a href="' + href(p) + '">‹ ' + esc(label(p)) + "</a>" : "<span></span>") +
      (n ? '<a href="' + href(n) + '">' + esc(label(n)) + " ›</a>" : "<span></span>") + "</nav>";
  }
  function footer() {
    return '<footer class="foot">Unofficial fan index. LEGO, the LEGO logo and set images © The LEGO Group. ' +
      "Set facts from LEGO.com and Jay's Brick Blog.</footer>";
  }
  function notFound() {
    current.list = [];
    return header("#/") + '<main class="wrap"><p>Nothing here. <a href="#/">Back to all sets</a></p></main>';
  }

  // ---------- router + events ----------
  function render() {
    closeLightbox();
    var parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
    var html = parts[0] === "set" ? viewSet(parts[1]) : parts[0] === "figure" ? viewFigure(parts[1]) : viewHome();
    app.innerHTML = html;
    var t = app.querySelector("h1");
    document.title = parts[0] && t ? t.textContent + " · " + D.title : D.title;
    window.scrollTo(0, 0);
  }

  function rerenderKeepScroll() {
    var y = window.pageYOffset;
    var parts = (location.hash.replace(/^#\/?/, "") || "").split("/");
    app.innerHTML = parts[0] === "set" ? viewSet(parts[1]) : parts[0] === "figure" ? viewFigure(parts[1]) : viewHome();
    window.scrollTo(0, y);
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-act],[data-lb]") : null;
    if (!t) {
      if (lightbox && e.target.classList && e.target.classList.contains("lightbox")) closeLightbox();
      return;
    }
    var act = t.getAttribute("data-act"), lb = t.getAttribute("data-lb");
    if (lb === "close") return closeLightbox();
    if (lb === "prev") return stepLightbox(-1);
    if (lb === "next") return stepLightbox(1);
    if (act === "zoom") return openLightbox(current.list, +t.getAttribute("data-i"));
    if (act === "own" || act === "wish") {
      var id = t.getAttribute("data-id"), bag = act === "own" ? marks.owned : marks.wish;
      if (bag[id]) delete bag[id]; else bag[id] = true;
      if (act === "own" && bag[id]) delete marks.wish[id]; // owned replaces wishlist
      saveMarks();
      rerenderKeepScroll();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (!lightbox) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") stepLightbox(-1);
    else if (e.key === "ArrowRight") stepLightbox(1);
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

  window.addEventListener("hashchange", render);
  render();
})();
