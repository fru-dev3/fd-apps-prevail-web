// Regenerates every icon and the share card from one source, public/brand/prevail-tile.svg
// (the Prevail mark from the fru.dev family marks, office green on #0B1210).
//
// Writes to public/: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180),
// icon-192.png, icon-512.png, logo.svg, logo.png (1024), logo-512.png and og-image.png (1200x630).
//
// Renders with Playwright and system Chrome. Set PLAYWRIGHT_CORE to a playwright-core folder,
// otherwise it uses the copy in fd-libs/fd-libs-sitecheck next to this repo.
//
//   node scripts/build-brand.mjs
import { copyFileSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => join(root, "public", f);
const SRC = pub("brand/prevail-tile.svg");

const pw = [
  process.env.PLAYWRIGHT_CORE,
  join(root, "../../fd-libs/fd-libs-sitecheck/node_modules/playwright-core"),
  join(homedir(), "Documents/fru/fd-libs/fd-libs-sitecheck/node_modules/playwright-core"),
].find((p) => p && existsSync(join(p, "index.mjs")));
if (!pw) throw new Error("playwright-core not found; set PLAYWRIGHT_CORE");
const { chromium } = await import(pathToFileURL(join(pw, "index.mjs")).href);

const mark = "data:image/svg+xml;base64," + readFileSync(SRC).toString("base64");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();

async function png(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0"><img src="${mark}" width="${size}" height="${size}" style="display:block">`);
  return page.screenshot({ omitBackground: true });
}

for (const [name, size] of [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["logo-512.png", 512],
  ["logo.png", 1024],
]) writeFileSync(pub(name), await png(size));

// favicon.ico: an ICO directory holding PNG images, which every current browser reads.
const frames = [];
for (const s of [16, 32, 48]) frames.push([s, await png(s)]);
const head = Buffer.alloc(6 + 16 * frames.length);
head.writeUInt16LE(1, 2);
head.writeUInt16LE(frames.length, 4);
let offset = head.length;
frames.forEach(([s, buf], i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e);
  head.writeUInt8(s, e + 1);
  head.writeUInt16LE(1, e + 4);
  head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(buf.length, e + 8);
  head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
writeFileSync(pub("favicon.ico"), Buffer.concat([head, ...frames.map(([, b]) => b)]));
copyFileSync(SRC, pub("favicon.svg"));
copyFileSync(SRC, pub("logo.svg"));

// Share card: the mark, the display name and the one line, office green on the dark canvas.
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=block" rel="stylesheet">
<style>
  body { margin: 0; width: 1200px; height: 630px; background: #0b1210; color: #e8ede9;
    font-family: Inter, -apple-system, "Helvetica Neue", sans-serif; position: relative; overflow: hidden; }
  .glow { position: absolute; inset: 0; background: radial-gradient(ellipse 60% 70% at 85% 10%, rgba(63,163,77,.22), transparent 70%); }
  .wrap { position: absolute; left: 88px; right: 88px; top: 84px; bottom: 72px; display: flex; flex-direction: column; }
  img { width: 128px; height: 128px; }
  h1 { margin: 48px 0 0; font-size: 92px; line-height: 1; font-weight: 700; letter-spacing: -.02em; }
  h1 span { color: #3fa34d; font-weight: 500; }
  p { margin: 28px 0 0; font-size: 36px; line-height: 1.3; color: #b4beb8; max-width: 980px; }
  footer { margin-top: auto; font-size: 28px; color: #8a968f; }
  footer b { color: #3fa34d; font-weight: 500; }
</style></head><body><div class="glow"></div><div class="wrap">
  <img src="${mark}" alt="">
  <h1>Prevail <span>| Agent Harness</span></h1>
  <p>A private AI harness for your life, not your job. Any model, Mac and Windows.</p>
  <footer><b>prevail.sh</b> &middot; a fru.dev project</footer>
</div></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: pub("og-image.png") });

await browser.close();
console.log("wrote favicon.svg, favicon.ico, apple-touch-icon.png, icon-192/512.png, logo.svg/png, logo-512.png, og-image.png");
