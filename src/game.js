/** Pure simulation. All coin transactions and time-dependent rules live here. */
export const HOUR = 3_600_000;
export const DAY = 23 * HOUR;
export const PLOW_COST = 15;
export const CROPS = [
  { id: 'strawberry', name: 'Strawberries', icon: '🍓', cost: 10, sell: 35, hours: 4, xp: 1, level: 1, color: '#ca584e', description: 'A sweet, quick first harvest.' },
  { id: 'eggplant', name: 'Eggplant', icon: '🍆', cost: 25, sell: 88, hours: 46, xp: 2, level: 1, color: '#796090', description: 'A patient farmer’s purple bounty.' },
  { id: 'wheat', name: 'Wheat', icon: '🌾', cost: 35, sell: 115, hours: 69, xp: 2, level: 1, color: '#dfb75d', description: 'Golden fields, a longer wait.' },
  { id: 'soybean', name: 'Soybeans', icon: '🌱', cost: 15, sell: 63, hours: 23, xp: 2, level: 1, color: '#8fa36b', description: 'The dependable daily crop.' },
  { id: 'pumpkin', name: 'Pumpkins', icon: '🎃', cost: 30, sell: 68, hours: 8, xp: 1, level: 5, color: '#d98b42', description: 'A little autumn in every row.' },
  { id: 'rice', name: 'Rice', icon: '🌾', cost: 45, sell: 96, hours: 12, xp: 1, level: 7, color: '#a8bf89', description: 'A half-day rhythm.' },
  { id: 'raspberry', name: 'Raspberries', icon: '🫐', cost: 20, sell: 46, hours: 2, xp: 0, level: 8, color: '#b95c83', description: 'Quick returns, no planting XP.' },
];
export const ITEMS = [
  { id: 'apple', name: 'Apple tree', icon: '🌳', cost: 325, sell: 28, hours: 69, xp: 5, level: 1, kind: 'tree', color: '#7eab65' },
  { id: 'chicken', name: 'Chicken', icon: '🐔', cost: 400, sell: 8, hours: 23, xp: 5, level: 4, kind: 'animal', color: '#f8f3da' },
  { id: 'hay', name: 'Yellow hay bale', icon: '🌾', cost: 100, sell: 0, hours: 0, xp: 5, level: 1, kind: 'decoration', color: '#d6b76d' },
  { id: 'fence', name: 'Whitewash fence', icon: '▥', cost: 300, sell: 0, hours: 0, xp: 5, level: 1, kind: 'decoration', color: '#ece8d9' },
];
export const LEVELS = [0, 20, 40, 90, 200, 350, 550, 800, 1300, 1800];
export const CROP_BY_ID = Object.assign(Object.create(null), Object.fromEntries(CROPS.map(c => [c.id, c])));
export const ITEM_BY_ID = Object.assign(Object.create(null), Object.fromEntries(ITEMS.map(c => [c.id, c])));
export const MODES = Object.assign(Object.create(null), { classic: { rate: 1, name: 'Classic', label: 'Real-time growth' }, sandbox: { rate: 600, name: 'Sandbox', label: '1 farm hour = 6 seconds' } });
export function levelFor(xp) { let i = 0; while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1]) i++; return i + 1; }
export function nextLevel(xp) { const l = levelFor(xp); return LEVELS[l] ?? null; }
export function timeNow(state, realNow = Date.now()) { return state.gameAt + Math.max(0, realNow - state.realAt) * MODES[state.mode].rate; }
export function newFarm(mode = 'classic', realNow = Date.now()) {
  if (!MODES[mode]) throw new Error('Unknown game mode');
  const tiles = Array.from({ length: 144 }, () => ({ kind: 'grass' }));
  // A starter patch: two ripe crops, two halfway grown, and two plowed plots.
  tiles[52] = { kind: 'crop', crop: 'strawberry', planted: realNow - 4.2 * HOUR };
  tiles[53] = { kind: 'crop', crop: 'eggplant', planted: realNow - 48 * HOUR };
  tiles[64] = { kind: 'crop', crop: 'strawberry', planted: realNow - 2 * HOUR };
  tiles[65] = { kind: 'crop', crop: 'eggplant', planted: realNow - 23 * HOUR };
  tiles[76] = { kind: 'plowed' }; tiles[77] = { kind: 'plowed' };
  return { version: 1, mode, coins: 200, cash: 5, xp: 0, size: 12, tiles, gameAt: realNow, realAt: realNow, harvested: 0, planted: 0, plowed: 0, earned: 0, sold: 0, tutorial: 0, createdAt: realNow };
}
export function cropStatus(tile, now) {
  if (tile.kind !== 'crop') return tile.kind;
  const growth = CROP_BY_ID[tile.crop].hours * HOUR;
  const elapsed = Math.max(0, now - tile.planted);
  if (elapsed >= growth * 2) return 'withered';
  return elapsed >= growth ? 'ready' : 'growing';
}
export function itemReady(tile, now) {
  const item = ITEM_BY_ID[tile.item];
  return tile.kind === 'item' && item.hours > 0 && now - tile.collected >= item.hours * HOUR;
}
export function progress(tile, now) {
  if (tile.kind === 'crop') return Math.min(1, Math.max(0, (now - tile.planted) / (CROP_BY_ID[tile.crop].hours * HOUR)));
  if (tile.kind === 'item' && ITEM_BY_ID[tile.item].hours) return Math.min(1, Math.max(0, (now - tile.collected) / (ITEM_BY_ID[tile.item].hours * HOUR)));
  return 0;
}
export function timeRemaining(tile, now) {
  if (tile.kind === 'crop') { const grow = CROP_BY_ID[tile.crop].hours * HOUR; return Math.max(0, tile.planted + grow * (cropStatus(tile, now) === 'ready' ? 2 : 1) - now); }
  if (tile.kind === 'item') return Math.max(0, tile.collected + ITEM_BY_ID[tile.item].hours * HOUR - now);
  return 0;
}
export function farmStats(state, now) {
  const result = { ready: 0, growing: 0, withered: 0, plowed: 0, items: 0 };
  for (const tile of state.tiles) { const s = cropStatus(tile, now); if (s in result) result[s]++; if (tile.kind === 'item') { result.items++; if (itemReady(tile, now)) result.ready++; } }
  return result;
}
function fail(message) { return { ok: false, message }; }
function win(state, before, message, coins = 0, xp = 0) { return { ok: true, message, coins, xp, levelUp: levelFor(state.xp) > before }; }
export function act(state, action, index, selection, now = timeNow(state)) {
  if (!Number.isInteger(index) || index < 0 || index >= state.tiles.length) return fail('Choose a square inside your farm.');
  const tile = state.tiles[index]; const level = levelFor(state.xp);
  if (action === 'plow') {
    if (!['grass', 'fallow', 'crop'].includes(tile.kind) || (tile.kind === 'crop' && cropStatus(tile, now) !== 'withered')) return fail('Choose grass, harvested ground, or a withered crop.');
    if (state.coins < PLOW_COST) return fail('Plowing costs 15 coins. Harvest a ripe crop first.');
    state.coins -= PLOW_COST; state.xp++; state.plowed++; state.tiles[index] = { kind: 'plowed' };
    return win(state, level, 'Fresh earth, ready for seeds.', -PLOW_COST, 1);
  }
  if (action === 'plant') {
    const crop = CROP_BY_ID[selection]; if (!crop) return fail('Choose seeds in the market below.');
    if (level < crop.level) return fail(`${crop.name} unlock at level ${crop.level}.`);
    if (tile.kind !== 'plowed') return fail('Plow this square before planting.');
    if (state.coins < crop.cost) return fail(`You need ${crop.cost} coins for these seeds.`);
    state.coins -= crop.cost; state.xp += crop.xp; state.planted++; state.tiles[index] = { kind: 'crop', crop: crop.id, planted: now };
    return win(state, level, `${crop.name} planted. A little patience now.`, -crop.cost, crop.xp);
  }
  if (action === 'harvest') {
    if (tile.kind === 'item') {
      const item = ITEM_BY_ID[tile.item]; if (!item.hours) return fail('This is a decoration. Use Move to rearrange it.');
      if (!itemReady(tile, now)) return fail('Not quite ready to collect. Trees and animals never wither.');
      state.coins += item.sell; state.earned += item.sell; state.harvested++; tile.collected = now;
      return win(state, level, `${item.name} collected.`, item.sell, 0);
    }
    if (tile.kind !== 'crop') return fail('Choose a ripe crop or a ready tree or animal.');
    const status = cropStatus(tile, now);
    if (status === 'withered') return fail('This crop has withered. Plow it to start again.');
    if (status !== 'ready') return fail('Still growing. Watch the time remaining.');
    const crop = CROP_BY_ID[tile.crop]; state.coins += crop.sell; state.earned += crop.sell; state.harvested++; state.tiles[index] = { kind: 'fallow' };
    return win(state, level, `${crop.name} harvested. Plow again for the next crop.`, crop.sell, 0);
  }
  if (action === 'buy') {
    const item = ITEM_BY_ID[selection]; if (!item) return fail('Choose something from the farm shop.');
    if (level < item.level) return fail(`${item.name} unlocks at level ${item.level}.`);
    if (tile.kind !== 'grass') return fail('Place this on a free grass square.');
    if (state.coins < item.cost) return fail(`Save ${item.cost} coins for ${item.name.toLowerCase()}.`);
    state.coins -= item.cost; state.xp += item.xp; state.tiles[index] = { kind: 'item', item: item.id, collected: now };
    return win(state, level, `${item.name} placed on your farm.`, -item.cost, item.xp);
  }
  if (action === 'move') {
    const from = Number(selection);
    if (!Number.isInteger(from) || !state.tiles[from] || state.tiles[from].kind !== 'item') return fail('Choose a tree, animal, or decoration to move.');
    if (from === index) return fail('Choose an empty grass square.');
    if (tile.kind !== 'grass') return fail('The destination needs to be empty grass.');
    state.tiles[index] = state.tiles[from]; state.tiles[from] = { kind: 'grass' };
    return win(state, level, 'A fresh place, same growing clock.');
  }
  return fail('Choose a tool first.');
}
export function sanitizeSave(raw, mode) {
  if (!raw || raw.version !== 1 || raw.mode !== mode || !MODES[mode] || raw.size !== 12 || !Array.isArray(raw.tiles) || raw.tiles.length !== 144) return null;
  for (const field of ['coins', 'cash', 'xp', 'gameAt', 'realAt', 'harvested', 'planted', 'plowed', 'earned', 'sold', 'tutorial', 'createdAt']) if (!Number.isFinite(raw[field]) || raw[field] < 0) return null;
  for (const t of raw.tiles) {
    if (!t || !['grass','plowed','crop','fallow','item'].includes(t.kind)) return null;
    if (t.kind === 'crop' && (!CROP_BY_ID[t.crop] || !Number.isFinite(t.planted))) return null;
    if (t.kind === 'item' && (!ITEM_BY_ID[t.item] || !Number.isFinite(t.collected))) return null;
  }
  return structuredClone(raw);
}
export function formatDuration(ms, short = false) {
  let seconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
