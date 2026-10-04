// Build-time fallback for the hero download counter. Sums installer downloads
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

let prev = 0;
try { prev = JSON.parse(readFileSync(OUT, "utf8")).total || 0; } catch {}

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
  writeFileSync(OUT, JSON.stringify({ total }, null, 2) + "\n");
  console.log(`download total: ${total}`);
} catch (e) {
  console.warn(`download total: fetch failed (${e.message}); keeping ${prev}`);
}
