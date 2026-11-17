/*
@title        Plantdex - pre-deploy check
@version      0.1.0
@author       La Gia Huy
@since        2026-11-17
@updated      2026-11-17
@engine       Node.js 18+ (no npm packages)
@target       Windows / any OS; GitHub Actions (runs before the Pages deploy)
@about        Fails (exit 1) when something would break the live site:
                - app.js, data.js or sw.js has a syntax error
                - data.js doesn't set window.PLANTDEX or has no sets
                - a set misses sku / name / released / pieces / prices / color,
                  or its date isn't YYYY-MM-DD
                - duplicate set skus or figure ids, a set with other than 0 or 2 figures
                - a gallery image tagged with a figure (fig) that isn't in that set
                - a file in sw.js's shell list doesn't exist
              Usage: node tools/check.mjs
*/
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (msg) => errors.push(msg);
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

// 1. Syntax of every JS file the site loads
for (const f of ["app.js", "data.js", "sw.js", "tools/check.mjs"]) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" });
  } catch (e) {
    fail(f + ": syntax error\n" + String(e.stderr || e.message).trim());
  }
}

// 2. Data: run data.js the way the browser does and inspect window.PLANTDEX
let d = null;
try {
  const sandbox = { window: {} };
  vm.runInNewContext(read("data.js"), sandbox, { filename: "data.js" });
  d = sandbox.window.PLANTDEX;
  if (!d || !Array.isArray(d.sets) || !d.sets.length) { fail("data.js: window.PLANTDEX.sets missing or empty"); d = null; }
} catch (e) {
  fail("data.js: " + e.message);
}

let nFigs = 0;
if (d) {
  const skus = new Set(), figIds = new Set();
  for (const s of d.sets) {
    const where = "set " + (s.sku || "?");
    for (const k of ["sku", "name", "released", "pieces", "prices", "color"]) if (s[k] == null || s[k] === "") fail(where + ": missing " + k);
    if (s.released && !/^\d{4}-\d{2}-\d{2}$/.test(s.released)) fail(where + ": released is not YYYY-MM-DD");
    if (s.prices && (!Array.isArray(s.prices) || !s.prices.length)) fail(where + ": prices must be a non-empty list");
    if (skus.has(s.sku)) fail(where + ": duplicate sku"); else skus.add(s.sku);
    if (!Array.isArray(s.figures)) { fail(where + ": figures is not a list"); continue; }
    if (s.figures.length !== 0 && s.figures.length !== 2) fail(where + ": " + s.figures.length + " figures (expected 2, or [] while unrevealed)");
    const own = new Set();
    for (const f of s.figures) {
      nFigs++;
      if (!f || !f.id) { fail(where + ": figure without id"); continue; }
      if (figIds.has(f.id)) fail(where + ": duplicate figure id " + f.id); else figIds.add(f.id);
      own.add(f.id);
      if (!f.name && !f.nickname) fail("figure " + f.id + ": needs a name or a nickname");
      if (!f.color) fail("figure " + f.id + ": missing color");
    }
    for (const g of s.gallery || []) {
      if (g && typeof g === "object" && g.fig && !own.has(g.fig)) fail(where + ": gallery image tagged with unknown figure " + g.fig);
    }
  }
}

// 3. Every file the service worker pre-caches must exist (a missing one makes its install fail)
const shell = read("sw.js").match(/var FILES = \[([\s\S]*?)\]/);
if (!shell) fail("sw.js: FILES list not found");
else {
  for (const m of shell[1].matchAll(/"([^"]+)"/g)) {
    if (m[1] !== "./" && !fs.existsSync(path.join(root, m[1]))) fail("sw.js: cached file " + m[1] + " doesn't exist");
  }
}

if (errors.length) {
  console.error(errors.length + " problem(s):\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log("OK: " + d.sets.length + " sets, " + nFigs + " figures");
