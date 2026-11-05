# FarmVille research and fidelity

Research target: the original Facebook/Flash **FarmVille (2009)**, not FarmVille 2 or FarmVille 3. Retrieved November 5, 2026. FarmVille evolved throughout its life; there is no single unchanging ruleset. This reconstruction chooses a small early-game slice rather than claiming full historical parity.

## Gameplay summary

The original is a social, asynchronous farming simulation. Players pay to plow individual plots, pay again to plant seeds, return after a crop-specific real-time interval, and harvest for coins. Harvesting leaves fallow ground. Planting and plowing give experience; higher levels unlock additional crops and purchases. A neglected crop withers, losing its sale value. Trees and animals provide repeatable goods without withering. Buying decorations and buildings, expanding land, visiting neighbors, sending gifts, ribbons, and later mastery/events extended the core loop. The main strategy is choosing a crop that fits both profitability and the next time the player can return.

There is no core watering, animal-feeding, or energy requirement in this original-style loop. Those should not be imported from later FarmVille games.

## Sources

1. [Gamezebo, FarmVille walkthrough](https://www.gamezebo.com/walkthroughs/farmville-walkthrough/): starter farm, levels, currencies, timing, objects, neighbors, expansions, and crop lifecycle.
2. [Steelowl, FarmVille harvest profit margins (July 2, 2009)](https://steelowl.wordpress.com/2009/07/02/farmville-harvest-profit-margins/): early crop prices, yields, times, and economics.
3. [Adam Nash, The Personal Economics of FarmVille, Part 2 (August 23, 2009)](https://adamnash.blog/2009/08/23/the-personal-economics-of-farmville-part-2/): original crop economy, crop timings, and 23-hour days.
4. [SuperCheats, Advanced Farming](https://www.supercheats.com/guides/farmville/advanced-aarming): planting XP, plowing, and the fertilization exception to harvest XP.
5. [Gamepressure, Crops](https://www.gamepressure.com/farmville/crops/z128dc): costs, plowing, experience, growth, and withering. Historical wither descriptions differ from other sources.
6. [FarmVille Wiki, Strawberry](https://farmville.fandom.com/wiki/Strawberry): four-hour crop and price/yield reference. Community wiki values may describe later revisions.

## Implemented crop table

The plow cost (15 coins) and plow XP (1) are separate from every row. One farm day is treated as 23 real hours. Sale is gross revenue, not profit. Ordinary harvest XP is zero.

| Crop | Seed coins | Harvest coins | Grow time | Plant XP | Unlock level |
|---|---:|---:|---|---:|---:|
| Strawberries | 10 | 35 | 4 hours | 1 | 1 |
| Eggplant | 25 | 88 | 2 days / 46 hours | 2 | 1 |
| Wheat | 35 | 115 | 3 days / 69 hours | 2 | 1 |
| Soybeans | 15 | 63 | 1 day / 23 hours | 2 | 1 |
| Pumpkins | 30 | 68 | 8 hours | 1 | 5 |
| Rice | 45 | 96 | 12 hours | 1 | 7 |
| Raspberries | 20 | 46 | 2 hours | 0 | 8 |

**Version choice matters:** wheat changed in June 2010 to 13 seed coins / 61 harvest coins / 12 hours. This project deliberately uses the earlier 35 / 115 / 3-day version. Mixing the two would distort the economy.

Early level thresholds implemented for levels 1–10: 0, 20, 40, 90, 200, 350, 550, 800, 1300, 1800 total XP. Level 10 is an implementation cap, not the historical game’s maximum. Initial plot locations are original, while the six-plot mix and 200 coins / 5 Farm Cash are based on the walkthrough.

## Fidelity matrix

| System | Implementation | Caveat |
|---|---|---|
| Plow / seed / harvest / fallow cycle | Implemented, separate costs and rewards | Synchronous click action; no walking-avatar animation |
| XP and crop unlocks | Early researched values | Ten levels and seven crops only |
| Growth | Saved wall-clock timestamps | Device clock; no authoritative server or anti-cheat |
| Withering | Ready at 1×, dead at 2× growth duration | Deterministic approximation; accounts differ on start/stagger timing |
| Trees and animals | Repeating production, never wither | Tiny subset; no care/feeding gate |
| Layout and decorations | Original 3D models; movable objects | Original decoration prices; no resale/building system |
| Farm Cash | Displayed initial historical balance | No spending, payments, or earning system |
| Social and expansions | Omitted, not simulated as real people | Original expansions also required neighbors |
| Sandbox | Separate 600× clock and save | Explicitly nonhistorical convenience mode |
| Camera, accessibility, audio | Original responsive UI, plot list, optional synthesized cues | Not original FarmVille presentation |

Withering choice: the Gamezebo walkthrough says a ripe crop remains harvestable for another growth duration, matching a 2× deadline from planting. Other guides describe earlier onset, and community accounts describe staggered withering until about 2.5×. This implementation chooses a documented, understandable deterministic rule and does not claim to reproduce those server details.

## Strategy example

A strawberry cycle costs 15 coins to plow plus 10 to seed, pays 35 on harvest, and earns 2 total XP. Net profit is 10 coins, provided the crop is harvested in its ready window. Planting a quick crop before a long absence risks losing the entire harvest. Trees and animals trade slower returns for no withering risk.
