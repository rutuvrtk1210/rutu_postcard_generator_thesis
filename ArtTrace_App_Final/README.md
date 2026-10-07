# ArtTrace

A creative postcard-maker web app. ArtTrace turns a campus-sculpture photo into a
personalized postcard through four art tools — Color Blob, Photo Cutout, Doodle, and
a Handwritten Note — then composes them into a final, shareable postcard.

Built with **React 19 + Vite + Tailwind CSS v4**. No backend: all state lives in the
browser.

## Flow

```
Starting animation → Image selection → Color Blob → Photo Cutout →
Doodle → Note → Preview → Merge → Sign-off → Final postcard
```

- **Starting screen** — an animated opening (organic form + "arttrace." wordmark +
  the tagline "move through place, connect through art"); click/Enter or wait to enter.
- **Image selection** — upload your own photo or pick from the campus-artwork carousel.
- **Color Blob** — eyedropper-sample exactly four colors from the artwork, watch them
  blend into one radial blob, then paint with it (size / opacity / undo / redo / move).
- **Photo Cutout** — move and resize a scalloped stamp frame, mask the artwork inside
  it, then place / resize / rotate the cutout.
- **Doodle** — guided or freehand drawing with stroke/color controls, undo/redo/clear.
- **Note** — a handwritten-font note with adjustable text/size/color and live preview.
- **Preview / Merge** — review the completed features, then make separate postcards or
  merge everything into one editable composition (drag / resize / rotate / reorder).
- **Sign-off / Final** — add your name, then share, download, or save the postcard.

A **Day / Night** theme toggle lives in the header and persists across reloads.

## Run locally

Requires Node 20+ and pnpm (via corepack).

```bash
corepack enable           # if pnpm isn't already available
pnpm install
pnpm dev                  # starts the Vite dev server; open the printed localhost URL
```

Other scripts:

```bash
pnpm build                # production build into dist/
pnpm preview              # serve the production build locally
```

## Deploying

This is a static site — `pnpm build` emits a `dist/` folder any static host can serve.
See **DEPLOY.md** for step-by-step Vercel instructions (the included `vercel.json`
pins the Vite build: `pnpm build` → `dist`).

## Project structure

```
src/
  App.tsx                     app + all screens/features (single component tree)
  index.css                   Tailwind v4 import + the full design system
  main.tsx                    React entry; mounts App, imports index.css
  generated/
    starting-screen.svg       vector art for the animated opening screen
  imports/                    bundled image imports
public/
  assets/                     artwork (WebP) + tool/icon SVGs
index.html                    Vite HTML shell
vite.config.ts                React + Tailwind v4 + "@" -> src alias
```

## Notes

- Artwork images are served as optimized **WebP** (~2 MB total, down from ~22 MB of PNG).
- "Save to Weekly Artwork Gallery" is a client-side stub (no backend); Share and
  Download work in the browser.
