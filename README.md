# Sprout & Soil

**A little land. A little patience.** An original Three.js farming game inspired by the early, 2009-era **FarmVille** crop economy.

[Play the game](https://intrepion.github.io/kata-inspired-by-farmville-codex-dot/) · [Back to Kata Arcade](https://intrepion.github.io/)

## Gameplay

Start on a 12 × 12 farm with 200 coins, two ripe crops, two growing crops, and two tilled plots. Harvest the ripe plants, plow the empty ground, select seeds from the market, and wait for the next harvest. The default **Classic** clock uses real time and continues while the page is closed. **Sandbox** is a clearly labeled, separate save at 600× speed, where a four-hour strawberry takes 24 seconds.

- **Harvest:** collect a ripe crop for its sale value. The square becomes fallow. Routine harvesting gives no XP.
- **Plow:** pay 15 coins and earn 1 XP. Grass, fallow ground, and withered crops can be plowed.
- **Plant:** pay the seed price separately and earn that crop’s planting XP. Plant only on tilled ground.
- **Withering:** a crop is ready after one growth duration and withers at two growth durations from planting. This deterministic boundary approximates historical staggered behavior.
- **Progress:** planting and plowing unlock crops at the documented early levels. Levels are capped at 10 in this bounded reconstruction.
- **Shop:** buy an apple tree, chicken, or decorations. Trees and animals produce repeatedly and never wither. Move them without resetting their timers.

### Controls

Click or tap a plot to use the active tool. H = harvest, P = plow, S = plant, M = move, I = inspect. Select seeds below the farm. Move takes two clicks: the object, then empty grass. Escape cancels a move or closes a dialog. +/− zoom the 3D camera; the **▦ plot list** provides an equivalent keyboard-accessible grid. Optional sound is synthesized locally and is off by default.

The farm saves automatically in this browser’s local storage. Classic and Sandbox are independent. Clearing browser data removes both saves. No login, network economy, analytics, tracking, water, feed, or energy gate is used. Keep enough coins for the next planting cycle; a mode-specific reset is available if needed.

## Historical fidelity and limits

This is **not an exact copy of every FarmVille feature**. It reconstructs the researched early crop loop with original code, art, camera, and interface. See [research and the fidelity matrix](docs/RESEARCH.md) for source links, numbers, version changes, and deviations.

Not implemented: Facebook neighbors, visits or gifts, expansions, crop mastery, ribbons, tractors, buildings with production systems, premium purchases, seasonal content, the full crop/object catalog, or Zynga’s backend. The Farm Cash counter is historical context only and has no purchasing function. Tree/animal day conversion uses the documented 23-hour convention; historical sources also report other timer revisions. No copied FarmVille art, audio, logos, text, or source code is included.

## Run and test

Requirements: Node.js 22.12+ or 24 LTS and npm.

```sh
npm ci
npm run dev
# Open http://127.0.0.1:5210/
npm run check
npm test
npm run build
npm run preview
# Again open http://127.0.0.1:5210/ (stop the dev server first)
```

**Always serve the game over HTTP. Never test by opening a file directly or with a `file://` URL.** The Vite base is relative, so the production build supports its GitHub Pages project path. Three.js is bundled locally, with no CDN runtime dependency.

See [validation](docs/VALIDATION.md) for the actual test evidence. Pure engine tests exercise transactions, timing, failure paths, saves, and progression. Browser gameplay is exercised using the local server.

## Structure

- `src/game.js`: deterministic farming rules and save validation, independent of rendering.
- `src/scene.js`: original procedural Three.js models, shadows, and raycast controls.
- `src/main.js`: interface, save handling, tutorial, market, sound, and accessibility.
- `src/style.css`: responsive layout and visual design.
- `tests/`: simulation regression suite.
- `.github/workflows/deploy.yml`: test/build/publish to GitHub Pages.

## License and attribution

MIT, copyright 2026 Oliver Forral. Original models are authored geometry; market crop symbols use system emoji. Three.js is MIT-licensed; its full notice ships in [public/licenses/three-LICENSE.txt](public/licenses/three-LICENSE.txt). FarmVille is a trademark of Zynga. This independent educational project is not affiliated with or endorsed by Zynga.

The combined `.gitignore` includes the Linux, Windows, and macOS global templates from [github/gitignore](https://github.com/github/gitignore/tree/main/Global), plus generated Node/Vite artifacts. Dependency locks and source remain tracked.

## Arcade gameplay screenshots

The game owns `public/arcade/manifest.json`, two JPEGs, and their original PNGs and capture records under `public/arcade/`. Vite includes these files in the deployed artifact. These are **local production-build gameplay captures**, not CI captures or a claim about an exact live deployment. Schema version 3 preserves the capture timestamp, source commit, every served game input hash (excluding the gallery itself), tool/browser versions, viewport, and public interaction steps.

To reproduce on a clean checkout:

```sh
npm ci
npx playwright install chromium
npm run capture:arcade
npm test
npm run build
```

The script uses pinned Playwright 1.63.0 and its matching Chromium, starts its own loopback HTTP server for `dist`, uses a fresh browser context and fixed clock, then plays through the public controls. It captures the starting Classic farm and the farm after harvesting, plowing, and planting. It does not inject a save or change the game's DOM, artwork, or screenshot pixels. Original PNG evidence and JPEG screenshots both come directly from Playwright. Rendering and system emoji/fonts may differ across platforms; the workflow is reproducible, not a cross-platform pixel identity guarantee.

Review both images after each refresh. `npm test` refuses empty galleries, invalid image hashes, or mismatched capture records. After publishing, verify the deployed manifest, evidence, and image hashes before updating the separate Kata Arcade snapshot. A capture failure leaves the previous manifest in place; do not publish partial output. Refreshes intentionally reuse the two reviewed filenames, so run in a clean working tree and review the complete diff.
