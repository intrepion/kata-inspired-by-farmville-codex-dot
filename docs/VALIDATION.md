# Validation

Verified November 5, 2026. Browser tests used the running server at **http://127.0.0.1:5210/**. No file URLs were opened.

## Automated results

- `npm run check`: passed all three source syntax checks.
- `npm test`: **59/59 passed**, covering every crop’s exact price/XP accounting and maturity/wither boundaries; complete crop cycles; repeated clicks; insufficient funds; placement rules; crop and chicken unlock thresholds; both clocks; persistent offline growth; malformed saves including inherited-property attacks; repeated tree/chicken production; and moving without resetting timers.
- `npm run build`: passed. Relative production assets bundle Three.js locally, split into its own chunk.
- `npm audit --omit=dev --audit-level=high`: zero production dependency vulnerabilities at verification.

## Browser gameplay results

- Original Three.js farm renders with its procedural crops, barn, fence, trees, and shadows.
- Classic harvest → plow → strawberry planting: coins **200 → 235 → 220 → 210**, XP **0 → 1 → 2**. Reload preserved 210 coins and 2 XP.
- Switching to Sandbox used an independent save, and switching back restored Classic values.
- Sandbox seed planting displayed 24 seconds to readiness. Observed a naturally matured strawberry, harvested for **+35 coins**, and verified it became fallow ground with no harvest XP.
- Neglected Sandbox crop withered, rejected harvest with no coin change, and could be reclaimed with the normal 15-coin plow.
- Purchased a 100-coin yellow hay bale for 5 XP, moved it to another grass square, and verified source/destination state. Insufficient funds blocked an apple-tree purchase without charging coins.
- Checked help open/close and reset cancellation without data loss.
- Accessible 12×12 plot list performed the same game actions and live status updates.
- Responsive 390×844 viewport: document width stayed inside the viewport, farm tools remained available, and the seed shop scrolled horizontally instead of overflowing the page. Temporary viewport override was cleared afterward.
- Console inspection found no game-origin error. Warnings from an unrelated installed browser extension were excluded.

## Limits

Pure engine tests verify long-duration Classic timing by deterministic timestamps; no test waited 69 real hours. Tree/chicken collection and level boundaries are engine-tested; the UI pass exercised their shop display and purchase gate rather than waiting for every real production interval. Browser tests were manual tool-driven and are documented, not represented as an automated E2E suite. Cross-browser, physical-phone, GPU-less fallback, and long-term multi-tab races were not exhaustively exercised. Deployment verification is reported separately by the successful GitHub Actions run and served manifest.
