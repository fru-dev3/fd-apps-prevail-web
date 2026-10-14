// After vite build: give each route its own HTML file with its own title,
// description and canonical, so /faq is not read as a copy of the home page.
// Vercel serves dist/faq.html at /faq (cleanUrls in vercel.json); the SPA
// still renders the page from the same bundle.
import { readFileSync, writeFileSync } from "node:fs";

const SITE = "https://prevail.sh";
const ROUTES = {
  "/download": ["Download Prevail for Mac and Windows | Free AI Harness", "Download Prevail free for macOS and Windows, or install the CLI with one command. An open-source AI agent harness that runs on your own machine."],
  "/how-it-works": ["How Prevail Works | A Council of AI Models for Your Life", "How Prevail works: one question goes to every AI you use, a chair model writes one verdict, and your memory stays in plain files on your Mac."],
  "/faq": ["Prevail FAQ | Private AI Agent Harness", "Answers about Prevail: which AI models it works with, what stays on your machine, what it costs, and how to install it on Mac, Windows or Linux."],
  "/changelog": ["Prevail Changelog | Releases and Roadmap", "Every Prevail release so far and what is coming next for the open-source AI agent harness for your life."],
  "/roadmap": ["Prevail Changelog | Releases and Roadmap", "Every Prevail release so far and what is coming next for the open-source AI agent harness for your life.", "/changelog"],
  "/thesis": ["The Prevail Thesis | AI for Your Life, Not Your Job", "Why Prevail exists: the most important AI you use will be the one that knows your life, runs on your machine and compounds for a lifetime."],
  "/terms": ["Prevail Terms of Service", "Terms of service for Prevail, the free and open-source AI agent harness (GPL-3.0) made by fru.dev."],
  "/tos": ["Prevail Terms of Service", "Terms of service for Prevail, the free and open-source AI agent harness (GPL-3.0) made by fru.dev.", "/terms"],
  "/legal": ["Prevail Terms of Service", "Terms of service for Prevail, the free and open-source AI agent harness (GPL-3.0) made by fru.dev.", "/terms"],
  "/privacy": ["Prevail Privacy Policy", "How Prevail handles your data: your vault stays on your machine, app telemetry is off unless you opt in, and the site uses Google Analytics."],
};

const html = readFileSync("dist/index.html", "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const swap = (src, re, value) => {
  if (!re.test(src)) throw new Error(`route-heads: ${re} not found in dist/index.html`);
  return src.replace(re, value);
};

for (const [route, [title, desc, canon = route]] of Object.entries(ROUTES)) {
  if (title.length > 60 || desc.length > 155) throw new Error(`route-heads: ${route} title or description too long`);
  const url = SITE + canon;
  let out = html;
  out = swap(out, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
  out = swap(out, /(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`);
  out = swap(out, /(<link rel="canonical" href=")[^"]*/, `$1${url}`);
  out = swap(out, /(<meta property="og:url" content=")[^"]*/, `$1${url}`);
  out = swap(out, /(<meta property="og:title" content=")[^"]*/, `$1${esc(title)}`);
  out = swap(out, /(<meta property="og:description" content=")[^"]*/, `$1${esc(desc)}`);
  out = swap(out, /(<meta name="twitter:title" content=")[^"]*/, `$1${esc(title)}`);
  out = swap(out, /(<meta name="twitter:description" content=")[^"]*/, `$1${esc(desc)}`);
  writeFileSync(`dist${route}.html`, out);
}
console.log(`route-heads: wrote ${Object.keys(ROUTES).length} route pages`);
