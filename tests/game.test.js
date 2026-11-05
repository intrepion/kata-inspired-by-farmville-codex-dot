import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUR, DAY, PLOW_COST, CROPS, ITEMS, LEVELS, MODES, newFarm, levelFor, nextLevel, timeNow, cropStatus, itemReady, progress, timeRemaining, farmStats, act, sanitizeSave, formatDuration } from '../src/game.js';

const NOW = 1_800_000_000_000;
const fresh = (mode = 'classic') => newFarm(mode, NOW);
const copy = value => structuredClone(value);
function unchangedFailure(state, ...args) {
  const before = copy(state);
  assert.equal(act(state, ...args).ok, false);
  assert.deepEqual(state, before, 'failed transactions must be atomic');
}
function cropTile(crop = 'strawberry', planted = NOW) { return { kind: 'crop', crop, planted }; }

test('new farm starts with canonical money, dimensions, and six starter plots', () => {
  const state = fresh();
  assert.equal(state.coins, 200); assert.equal(state.cash, 5); assert.equal(state.xp, 0);
  assert.equal(state.size, 12); assert.equal(state.tiles.length, 144);
  assert.equal(state.tiles.filter(t => t.kind !== 'grass').length, 6);
  assert.deepEqual(farmStats(state, NOW), { ready: 2, growing: 2, withered: 0, plowed: 2, items: 0 });
  assert.equal(state.gameAt, NOW); assert.equal(state.realAt, NOW);
});
test('new farm tiles and independent farms do not alias', () => {
  const a = fresh(), b = fresh(); a.tiles[0].kind = 'fallow';
  assert.equal(a.tiles[1].kind, 'grass'); assert.equal(b.tiles[0].kind, 'grass');
});
test('unknown and inherited modes are rejected', () => {
  for (const mode of ['invalid', 'constructor', 'toString', '__proto__']) assert.throws(() => newFarm(mode, NOW));
});
test('one farm day is 23 hours and sandbox runs 600x', () => {
  assert.equal(DAY, 23 * HOUR); assert.equal(MODES.sandbox.rate, 600);
  assert.equal(timeNow(fresh(), NOW + 6000), NOW + 6000);
  assert.equal(timeNow(fresh('sandbox'), NOW + 6000), NOW + HOUR);
});
test('clock rollback never reverses simulation time', () => {
  for (const mode of ['classic', 'sandbox']) assert.equal(timeNow(fresh(mode), NOW - HOUR), NOW);
});
test('save round trip preserves elapsed offline time in both modes', () => {
  for (const mode of ['classic', 'sandbox']) {
    const restored = sanitizeSave(JSON.parse(JSON.stringify(fresh(mode))), mode);
    assert.ok(restored); assert.equal(timeNow(restored, NOW + 1000), NOW + 1000 * MODES[mode].rate);
  }
});
test('plow charges exactly 15 coins and grants exactly 1 XP', () => {
  const state = fresh(); const result = act(state, 'plow', 0, null, NOW);
  assert.equal(PLOW_COST, 15); assert.equal(result.ok, true); assert.equal(result.coins, -15); assert.equal(result.xp, 1);
  assert.equal(state.coins, 185); assert.equal(state.xp, 1); assert.equal(state.plowed, 1); assert.deepEqual(state.tiles[0], { kind: 'plowed' });
});
test('insufficient plow funds do not alter any state', () => { const s = fresh(); s.coins = 14; unchangedFailure(s, 'plow', 0, null, NOW); });
test('exact plow balance is allowed', () => { const s = fresh(); s.coins = 15; assert.equal(act(s, 'plow', 0, null, NOW).ok, true); assert.equal(s.coins, 0); });
test('plow cannot destroy growing, ready, plowed, or item tiles', () => {
  for (const tile of [cropTile(), cropTile('strawberry', NOW - 4 * HOUR), { kind: 'plowed' }, { kind: 'item', item: 'apple', collected: NOW }]) {
    const s = fresh(); s.tiles[0] = tile; unchangedFailure(s, 'plow', 0, null, NOW);
  }
});
test('plow reclaims harvested ground and withered crops for the same fee', () => {
  for (const tile of [{ kind: 'fallow' }, cropTile('strawberry', NOW - 8 * HOUR)]) {
    const s = fresh(); s.tiles[0] = tile; assert.equal(act(s, 'plow', 0, null, NOW).ok, true); assert.equal(s.coins, 185); assert.equal(s.xp, 1);
  }
});
for (const crop of CROPS) {
  test(`${crop.id}: planting charges seed cost separately and grants listed XP`, () => {
    const s = fresh(); s.xp = LEVELS[crop.level - 1]; const oldXp = s.xp;
    const result = act(s, 'plant', 76, crop.id, NOW);
    assert.equal(result.ok, true); assert.equal(s.coins, 200 - crop.cost); assert.equal(s.xp, oldXp + crop.xp);
    assert.equal(s.planted, 1); assert.equal(s.plowed, 0); assert.deepEqual(s.tiles[76], cropTile(crop.id));
  });
  test(`${crop.id}: growth and wither boundaries are exact`, () => {
    const t = cropTile(crop.id); const duration = crop.hours * HOUR;
    assert.equal(cropStatus(t, NOW - 1), 'growing'); assert.equal(cropStatus(t, NOW + duration - 1), 'growing');
    assert.equal(cropStatus(t, NOW + duration), 'ready'); assert.equal(cropStatus(t, NOW + duration * 2 - 1), 'ready');
    assert.equal(cropStatus(t, NOW + duration * 2), 'withered');
    assert.equal(progress(t, NOW - 1), 0); assert.equal(progress(t, NOW + duration / 2), 0.5); assert.equal(progress(t, NOW + duration * 3), 1);
  });
  test(`${crop.id}: harvesting pays once, grants no XP, and returns fallow`, () => {
    const s = fresh(); s.tiles[0] = cropTile(crop.id); const end = NOW + crop.hours * HOUR;
    const result = act(s, 'harvest', 0, null, end);
    assert.equal(result.ok, true); assert.equal(result.coins, crop.sell); assert.equal(result.xp, 0);
    assert.equal(s.coins, 200 + crop.sell); assert.equal(s.earned, crop.sell); assert.equal(s.xp, 0); assert.equal(s.harvested, 1);
    assert.deepEqual(s.tiles[0], { kind: 'fallow' }); unchangedFailure(s, 'harvest', 0, null, end);
  });
}
test('planting requires plowed soil and sufficient funds', () => {
  const s = fresh(); unchangedFailure(s, 'plant', 0, 'strawberry', NOW);
  s.coins = 9; unchangedFailure(s, 'plant', 76, 'strawberry', NOW);
  s.coins = 10; assert.equal(act(s, 'plant', 76, 'strawberry', NOW).ok, true); assert.equal(s.coins, 0);
});
test('unknown or inherited crop IDs fail without corrupting state', () => {
  for (const id of ['missing', 'toString', 'constructor', '__proto__']) unchangedFailure(fresh(), 'plant', 76, id, NOW);
});
test('locked crops fail immediately below their unlock and succeed at unlock', () => {
  for (const c of CROPS.filter(c => c.level > 1)) {
    const s = fresh(); s.xp = LEVELS[c.level - 1] - 1; unchangedFailure(s, 'plant', 76, c.id, NOW);
    s.xp++; assert.equal(act(s, 'plant', 76, c.id, NOW).ok, true);
  }
});
test('growing and withered crops cannot be harvested', () => {
  const s = fresh(); s.tiles[0] = cropTile(); unchangedFailure(s, 'harvest', 0, null, NOW + 4 * HOUR - 1);
  unchangedFailure(s, 'harvest', 0, null, NOW + 8 * HOUR);
});
test('full strawberry cycle accounts for plow plus seeds and does not spend cash', () => {
  const s = fresh(); act(s, 'plow', 0, null, NOW); act(s, 'plant', 0, 'strawberry', NOW); act(s, 'harvest', 0, null, NOW + 4 * HOUR);
  assert.equal(s.coins, 210); assert.equal(s.xp, 2); assert.equal(s.cash, 5);
  unchangedFailure(s, 'plant', 0, 'strawberry', NOW + 4 * HOUR);
});
test('level boundaries and level-up notification are exact', () => {
  for (let i = 1; i < LEVELS.length; i++) { assert.equal(levelFor(LEVELS[i] - 1), i); assert.equal(levelFor(LEVELS[i]), i + 1); }
  assert.equal(nextLevel(0), 20); assert.equal(nextLevel(1800), null);
  const s = fresh(); s.xp = 19; assert.equal(act(s, 'plow', 0, null, NOW).levelUp, true);
  assert.equal(act(s, 'plow', 1, null, NOW).levelUp, false);
});
for (const item of ITEMS) {
  test(`${item.id}: buy charges cost and respects placement and balance`, () => {
    const s = fresh(); s.xp = LEVELS[item.level - 1]; const oldXp = s.xp; s.coins = item.cost; assert.equal(act(s, 'buy', 0, item.id, NOW).ok, true);
    assert.equal(s.coins, 0); assert.equal(s.xp, oldXp + item.xp); assert.deepEqual(s.tiles[0], { kind: 'item', item: item.id, collected: NOW });
    unchangedFailure(s, 'buy', 1, item.id, NOW); s.coins = 1000; unchangedFailure(s, 'buy', 76, item.id, NOW);
  });
}
for (const id of ['apple', 'chicken']) {
  test(`${id}: production repeats, never withers, and cannot double collect`, () => {
    const item = ITEMS.find(i => i.id === id), s = fresh(); s.xp = LEVELS[item.level - 1]; const oldXp = s.xp; s.coins = item.cost; act(s, 'buy', 0, id, NOW);
    const period = item.hours * HOUR, late = NOW + period * 100;
    assert.equal(itemReady(s.tiles[0], NOW + period - 1), false); assert.equal(itemReady(s.tiles[0], NOW + period), true);
    unchangedFailure(s, 'harvest', 0, null, NOW + period - 1);
    assert.equal(itemReady(s.tiles[0], late), true); assert.equal(act(s, 'harvest', 0, null, late).ok, true);
    assert.equal(s.coins, item.sell); assert.equal(s.xp, oldXp + item.xp); assert.equal(s.tiles[0].collected, late);
    unchangedFailure(s, 'harvest', 0, null, late); assert.equal(act(s, 'harvest', 0, null, late + period).ok, true);
    assert.equal(s.coins, 2 * item.sell); assert.equal(s.earned, 2 * item.sell); assert.equal(s.harvested, 2);
  });
}
test('decorations never produce goods', () => {
  for (const id of ['hay', 'fence']) { const s = fresh(); s.coins = 1000; assert.equal(act(s, 'buy', 0, id, NOW).ok, true); assert.equal(itemReady(s.tiles[0], NOW + 1000 * HOUR), false); unchangedFailure(s, 'harvest', 0, null, NOW + 1000 * HOUR); }
});
test('moving preserves item production timer and all balances', () => {
  const s = fresh(); s.coins = 1000; act(s, 'buy', 0, 'apple', NOW); const original = copy(s.tiles[0]); const coins = s.coins;
  assert.equal(act(s, 'move', 1, 0, NOW + HOUR).ok, true); assert.deepEqual(s.tiles[1], original); assert.deepEqual(s.tiles[0], { kind: 'grass' });
  assert.equal(s.coins, coins); assert.equal(s.xp, 5); assert.equal(itemReady(s.tiles[1], NOW + 69 * HOUR), true);
  unchangedFailure(s, 'move', 1, 1, NOW); unchangedFailure(s, 'move', 76, 1, NOW); unchangedFailure(s, 'move', 2, 52, NOW);
});
test('unknown and inherited item IDs fail without mutation', () => {
  for (const id of ['missing', 'toString', 'constructor', '__proto__']) unchangedFailure(fresh(), 'buy', 0, id, NOW);
});
test('invalid actions and indices are safe failures', () => {
  for (const index of [-1, 144, 0.5, NaN, Infinity, '0', null]) unchangedFailure(fresh(), 'plow', index, null, NOW);
  unchangedFailure(fresh(), 'unknown', 0, null, NOW);
});
test('remaining time switches from growth to wither countdown at readiness', () => {
  const tile = cropTile(); assert.equal(timeRemaining(tile, NOW), 4 * HOUR); assert.equal(timeRemaining(tile, NOW + 4 * HOUR), 4 * HOUR);
  assert.equal(timeRemaining(tile, NOW + 8 * HOUR - 1), 1); assert.equal(timeRemaining(tile, NOW + 8 * HOUR), 0);
  assert.equal(timeRemaining({ kind: 'grass' }, NOW), 0);
});
test('item progress and remaining time are bounded', () => {
  const t = { kind: 'item', item: 'chicken', collected: NOW };
  assert.equal(progress(t, NOW - 1), 0); assert.equal(progress(t, NOW + 11.5 * HOUR), 0.5); assert.equal(progress(t, NOW + 100 * HOUR), 1);
  assert.equal(timeRemaining(t, NOW), 23 * HOUR); assert.equal(timeRemaining(t, NOW + 23 * HOUR), 0);
});
test('farm stats count crops and productive items without double-counting items', () => {
  const s = fresh(); s.tiles[0] = { kind: 'item', item: 'apple', collected: NOW - 69 * HOUR }; s.tiles[1] = { kind: 'item', item: 'hay', collected: NOW };
  s.tiles[2] = cropTile('strawberry', NOW - 8 * HOUR);
  assert.deepEqual(farmStats(s, NOW), { ready: 3, growing: 2, withered: 1, plowed: 2, items: 2 });
});
test('save sanitizer returns a deep clone', () => { const s = fresh(), result = sanitizeSave(s, 'classic'); assert.deepEqual(result, s); result.tiles[0].kind = 'fallow'; assert.equal(s.tiles[0].kind, 'grass'); });
test('invalid save shape, version, mode, and dimensions are rejected', () => {
  for (const raw of [null, undefined, {}, { ...fresh(), version: 2 }, { ...fresh(), mode: 'sandbox' }, { ...fresh(), size: 13 }, { ...fresh(), tiles: [] }, { ...fresh(), tiles: null }]) assert.equal(sanitizeSave(raw, 'classic'), null);
});
test('all numeric save fields reject missing, negative, nonnumeric, or nonfinite values', () => {
  for (const field of ['coins','cash','xp','gameAt','realAt','harvested','planted','plowed','earned','sold','tutorial','createdAt']) {
    for (const bad of [undefined, -1, NaN, Infinity, '1', null]) { const s = fresh(); s[field] = bad; assert.equal(sanitizeSave(s, 'classic'), null, `${field}: ${String(bad)}`); }
  }
});
test('invalid tile kinds, crop IDs, item IDs, and timestamps are rejected', () => {
  const badTiles = [null, {}, {kind:'invalid'}, {kind:'crop',crop:'missing',planted:NOW}, {kind:'item',item:'missing',collected:NOW}];
  for (const bad of [undefined, NaN, Infinity, '1', null]) badTiles.push({kind:'crop',crop:'strawberry',planted:bad}, {kind:'item',item:'apple',collected:bad});
  for (const tile of badTiles) { const s = fresh(); s.tiles[0] = tile; assert.equal(sanitizeSave(s, 'classic'), null); }
});
test('inherited catalog entries cannot sneak into saves', () => {
  for (const id of ['toString', 'constructor', '__proto__']) {
    for (const tile of [{kind:'crop',crop:id,planted:NOW}, {kind:'item',item:id,collected:NOW}]) { const s = fresh(); s.tiles[0] = tile; assert.equal(sanitizeSave(s, 'classic'), null); }
    const s = fresh(); s.mode = id; assert.equal(sanitizeSave(s, id), null);
  }
});
test('duration formatting rounds up and clamps elapsed values', () => {
  assert.equal(formatDuration(-1), '0s'); assert.equal(formatDuration(1), '1s'); assert.equal(formatDuration(60_000), '1m 0s'); assert.equal(formatDuration(HOUR + 120_000), '1h 2m');
});

test('researched item prices, purchase XP, durations, and unlocks remain canonical', () => {
  const expected = {apple: [325, 28, 69, 5, 1], chicken: [400, 8, 23, 5, 4], hay: [100, 0, 0, 5, 1], fence: [300, 0, 0, 5, 1]};
  for (const item of ITEMS) assert.deepEqual([item.cost, item.sell, item.hours, item.xp, item.level], expected[item.id]);
});
test('chicken is locked below level four and unlocks exactly at 90 XP', () => {
  const s = fresh(); s.coins = 400; s.xp = 89; unchangedFailure(s, 'buy', 0, 'chicken', NOW);
  s.xp = 90; const result = act(s, 'buy', 0, 'chicken', NOW);
  assert.equal(result.ok, true); assert.equal(result.xp, 5); assert.equal(s.xp, 95); assert.equal(s.coins, 0);
});
