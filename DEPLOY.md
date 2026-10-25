# Prevail site: deploy reference

Retired marketing site for Prevail (now Glyph Studio). Since 2026-10-25 every page of https://prevail.sh
301s to https://glyph.fru.dev/studio; only `/install` and `/install-mac` are still served here, and `/download` and `/Prevail-*.dmg` go to the GitHub release. The redirects live in `vercel.json`. Vite + React + Tailwind v4.

## Hosting

Vercel, team `fru-dev3`, project `prevail-site`. Netlify is retired: never deploy there and never
add a `netlify.toml`. Routing and headers (SPA fallback, the `/install` and `/install-mac` shell
scripts, security and cache headers) live in `vercel.json`.

## Deploy

From committed, pushed code:

```bash
./scripts/ship.sh
```

It links the project if needed, runs `vercel build --prod`, runs the fd-libs-sitecheck security
scan, deploys the prebuilt output from a copy outside the repo, and checks the live site.

## Brand assets

The mark is `public/brand/prevail-tile.svg` (office green, from the fru.dev family marks). Every
icon and the 1200x630 share card are generated from it:

```bash
node scripts/build-brand.mjs
```

## Local dev

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
npm run preview    # serve dist/ locally
```
