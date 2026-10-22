// Build-time social proof: the real stargazers of fru-dev3/prevail-desktop. Saves up to ten
// avatars into public/stargazers/ (so the page loads nothing from GitHub) and their logins to
// src/stargazers.json. On any failure the committed files stay as they are.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const OUT = new URL("../src/stargazers.json", import.meta.url);
const DIR = new URL("../public/stargazers/", import.meta.url);
const headers = { Accept: "application/vnd.github+json" };
let token = process.env.GITHUB_TOKEN;
if (!token) try { token = execSync("gh auth token", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch {}
if (token) headers.Authorization = `Bearer ${token}`;

try {
  const r = await fetch("https://api.github.com/repos/fru-dev3/prevail-desktop/stargazers?per_page=100", { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const users = (await r.json()).filter((u) => u.type === "User").slice(-10).reverse(); // the newest ten
  if (!users.length) throw new Error("none");
  mkdirSync(DIR, { recursive: true });
  const list = [];
  for (const u of users) {
    const img = await fetch(`${u.avatar_url}${u.avatar_url.includes("?") ? "&" : "?"}s=96`);
    if (!img.ok) continue;
    writeFileSync(new URL(`${u.login}.png`, DIR), Buffer.from(await img.arrayBuffer()));
    list.push(u.login);
  }
  const next = JSON.stringify(list, null, 2) + "\n";
  let prev = "";
  try { prev = readFileSync(OUT, "utf8"); } catch {}
  if (next !== prev) writeFileSync(OUT, next);
  console.log(`stargazers: ${list.length} faces`);
} catch (e) {
  console.warn(`stargazers: fetch failed (${e.message}); keeping the committed list`);
}
