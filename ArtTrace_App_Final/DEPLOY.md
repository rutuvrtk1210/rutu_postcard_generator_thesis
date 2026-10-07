# Deploying ArtTrace to Vercel

ArtTrace is a static front-end (React + Vite + Tailwind, no backend). `pnpm build`
produces a `dist/` folder that Vercel serves directly. A free Vercel "Hobby" account
gives you a public `*.vercel.app` URL, and every push to your Git repo redeploys
automatically.

> **Run these on a machine with normal internet access** (a personal dev machine),
> not the restricted Brazil workspace — Vercel and the public npm registry are not
> reachable from there.

---

## One-time local check (recommended before first deploy)

From the `ArtTrace_App` folder:

```bash
pnpm install
pnpm build        # should finish with a dist/ folder and no errors
pnpm preview      # serves the production build locally to spot-check
```

Open the URL `pnpm preview` prints and confirm the app loads, images appear, and
day/night works. If this looks right, Vercel will serve the same output.

---

## Option A — Git-connected deploy (recommended, auto-redeploys)

1. **Put the project in a Git repo** (GitHub, GitLab, or Bitbucket). Push the
   `ArtTrace_App` folder as the repo root.
2. Go to **https://vercel.com** and sign in with your Git provider.
3. Click **Add New → Project**, then **Import** the repo.
4. Vercel auto-detects Vite. The included `vercel.json` already pins the settings,
   but confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
   - **Install Command:** `pnpm install`
5. Click **Deploy**. In ~1 minute you get a live URL like
   `https://art-trace.vercel.app`.
6. Every future `git push` to the connected branch redeploys automatically.

To change the subdomain: **Project → Settings → Domains**.

---

## Option B — Vercel CLI (no Git repo needed)

```bash
pnpm add -g vercel        # or: npm i -g vercel
cd ArtTrace_App
vercel                    # first run: logs in, links the project, deploys a preview
vercel --prod             # promotes to the production *.vercel.app URL
```

The CLI reads `vercel.json` for build settings, so no extra prompts to worry about.

---

## About `vercel.json`

The committed `vercel.json` sets:

- `buildCommand` / `outputDirectory` / `installCommand` — the Vite build.
- `framework: vite` — enables Vercel's Vite defaults.
- a catch-all `rewrite` to `/index.html` — harmless for this single-page app and
  future-proofs it if client-side routing is ever added (so deep links don't 404).

`vite.config.ts` already uses `base: "/"` by default (it only changes when a
`FIGMA_PUBLIC_URL` env var is set, which Vercel does not set), so the app serves
correctly from the domain root. No config change is needed for Vercel.

---

## If the build fails on Vercel because of Figma Make plugins

`vite.config.ts` loads Figma Make-specific plugins and imports `./.figma/make/site.json`.
These build fine locally. If Vercel's build errors on anything Figma-related, use a
minimal Vite config instead — create `vite.config.ts` with only what the app needs:

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { outDir: "dist" },
})
```

Keep a backup of the original first. The app source does not depend on the Figma
plugins at runtime, so this swap is safe for a public deploy.

---

## Before going public (external project)

- **Image rights:** the nine campus-artwork PNGs and SVGs came from a Figma export.
  Confirm you are licensed to publish them externally, or replace them with art you own.
- **Image weight:** those PNGs are ~2–3 MB each (~25 MB total) and will slow the first
  load on a public URL. Consider compressing them (https://squoosh.app) or converting
  to WebP before deploying. Not required to go live, but strongly recommended.

---

## Image optimization (already prepared)

Optimized WebP copies of the nine campus-artwork images have been generated in
`public/assets/` alongside the originals — same base names, `.webp` extension
(e.g. `14587.png` → `14587.webp`). They were produced with `cwebp -q 80 -resize 1600 0`,
taking the artwork from ~22 MB of PNG down to ~2.2 MB of WebP (about a 90% reduction),
which dramatically speeds up the first public load. WebP is supported by all current
browsers.

**These are not wired in yet** (to avoid colliding with the in-progress app build).
To adopt them, do ONE of the following once the build is complete:

1. **Swap the references (simplest, recommended).** In `src/App.tsx`, change the nine
   `campusArt` entries from `/assets/<id>.png` to `/assets/<id>.webp`. Nothing else
   references these PNGs. Rebuild and verify the gallery still loads.

2. **Keep the originals too** if you want a PNG fallback — serve WebP via a `<picture>`
   element or a build-time URL rewrite. Overkill for current browser support, but
   available.

If you adopt WebP, you can delete the nine large `*.png` artwork files from
`public/assets/` afterward to shrink the deployed bundle (keep them only if you want
the fallback).

---

## Status: WebP optimization applied (done)

The nine `campusArt` references in `src/App.tsx` now point at the `.webp` files
(verified: `tsc --noEmit` clean, `pnpm build` clean, dev server serves
`/assets/14587.webp` as `image/webp` at ~268 KB vs ~2.9 MB for the PNG). Color-blob
eyedropper sampling is unaffected (WebP decodes to canvas like any image).

The original `*.png` artwork files are still in `public/assets/` as a safety fallback.
Once you have confirmed the deployed site looks right, you can delete them to drop
~22 MB from the bundle:

```bash
cd public/assets && rm 14587.png 5f166.png bdd23.png db196.png db713.png 4bdf5.png 266a7.png 52c4d.png 429c0.png
```

## Go-live checklist (Vercel)

1. On a normal-internet machine, copy/clone `ArtTrace_App`.
2. `pnpm install && pnpm build && pnpm preview` — confirm the app loads, artwork
   appears, day/night persists across reload.
3. Push to a GitHub repo (the `.gitignore` already excludes `dist/` and `node_modules/`).
4. vercel.com → Add New → Project → import repo → Deploy (Vite auto-detected; `vercel.json`
   pins the settings).
5. Share the `*.vercel.app` URL. Every push redeploys.
6. (Optional) delete the fallback PNGs per above and redeploy to shrink the bundle.
