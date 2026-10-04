// Build-time fallback for the hero download counter and the Star count. Sums installer downloads
// from GitHub Releases the same way the page does (src/App.tsx DOWNLOAD_SOURCES)
// and writes src/download-total.json. On any failure, or a 0/limited answer,
// the previous committed value is kept so the page never shows "0 downloads".
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const OUT = new URL("../src/download-total.json", import.meta.url);
const SOURCES = [
  { repo: "fru-dev3/prevail-desktop", asset: /\.(dmg|exe)$/ },
  { repo: "fru-dev3/prevail-cli", asset: /\.tar\.gz$/ },
];
const headers = { Accept: "application/vnd.github+json" };
// A token lifts the 60/hour unauthenticated limit; use the gh CLI's if present.
let token = process.env.GITHUB_TOKEN;
if (!token) try { token = execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
if (token) headers.Authorization = `Bearer ${token}`;

let snap = {};
try { snap = JSON.parse(readFileSync(OUT, "utf8")); } catch {}
const before = JSON.stringify(snap);
const prev = snap.total || 0;

try {
  let total = 0;
  for (const src of SOURCES) {
    for (let page = 1; page <= 3; page++) {
      const r = await fetch(`https://api.github.com/repos/${src.repo}/releases?per_page=100&page=${page}`, { headers });
      if (!r.ok) throw new Error(`${src.repo}: HTTP ${r.status}`);
      const rels = await r.json();
      if (!Array.isArray(rels) || rels.length === 0) break;
      for (const rel of rels)
        for (const a of rel.assets ?? [])
          if (typeof a.name === "string" && src.asset.test(a.name) && typeof a.download_count === "number")
            total += a.download_count;
      if (rels.length < 100) break;
    }
  }
  if (total < prev || total === 0) throw new Error(`got ${total}, keeping ${prev}`);
  snap.total = total;
  console.log(`download total: ${total}`);
} catch (e) {
  console.warn(`download total: fetch failed (${e.message}); keeping ${prev}`);
}

// Star count fallback for the Star button, kept the same way.
try {
  const r = await fetch("https://api.github.com/repos/fru-dev3/prevail-desktop", { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const n = (await r.json()).stargazers_count;
  if (typeof n !== "number" || n < (snap.stars || 0)) throw new Error(`got ${n}`);
  snap.stars = n;
  console.log(`stars: ${n}`);
} catch (e) {
  console.warn(`stars: fetch failed (${e.message}); keeping ${snap.stars ?? "none"}`);
}

// Rewrite only when a number moved, so a build leaves the tree clean otherwise.
if (JSON.stringify(snap) !== before) writeFileSync(OUT, JSON.stringify(snap, null, 2) + "\n");
