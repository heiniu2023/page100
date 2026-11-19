// Property-based tests for Page 100 — see design.md "Correctness Properties".
// Dev-only harness: Node's built-in test runner + a seeded RNG, zero
// dependencies, so the shipped app keeps its no-build-step guarantee.
// Run: node --test tests/properties.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankPage, buildPage, notFoundPage, putText, mosaicCell, ROWS, COLS } from '../js/model.js';
import { TeletextRenderer } from '../js/renderer.js';
import { parsePageNumber, Router } from '../js/router.js';
import { getData } from '../js/adapter.js';
import { REGISTRY } from '../js/registry.js';
import { SportModule } from '../js/modules/sport.js';
import { TVGuideModule } from '../js/modules/tvguide.js';
import { FinanceModule } from '../js/modules/finance.js';
import { WeatherModule } from '../js/modules/weather.js';
import { NewsModule } from '../js/modules/news.js';

// Deterministic RNG (mulberry32) so failures reproduce.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261119);
const CHARS = 'abcXYZ 123!@#░éü—';
function randText(maxLen = 120) {
  const n = Math.floor(rand() * maxLen);
  let s = '';
  for (let i = 0; i < n; i++) s += CHARS[Math.floor(rand() * CHARS.length)];
  return s;
}
function assertGrid(page, label) {
  assert.equal(page.rows.length, ROWS, `${label}: row count`);
  for (const row of page.rows) assert.equal(row.cells.length, COLS, `${label}: col count`);
}
const jsonRes = (obj, ok = true) => ({ ok, json: async () => obj });

test('P1: grid invariant for generated pages', () => {
  for (let i = 0; i < 100; i++) {
    const lines = Array.from({ length: Math.floor(rand() * 30) }, () => randText());
    assertGrid(buildPage({ pageNo: 100, title: randText(30), lines, timeStr: '12:00' }), 'buildPage');
    assertGrid(notFoundPage(100 + Math.floor(rand() * 800), '12:00'), 'notFoundPage');
    assertGrid(blankPage(), 'blankPage');
  }
});

test('P2: putText clips to the 40-column grid', () => {
  for (let i = 0; i < 200; i++) {
    const page = blankPage();
    const text = randText();
    const col = Math.floor(rand() * 90) - 45;
    const row = Math.floor(rand() * ROWS);
    const written = putText(page, row, col, text);
    let expected = 0;
    for (let k = 0; k < text.length; k++) if (col + k >= 0 && col + k < COLS) expected++;
    assert.equal(written, expected, `col=${col} len=${text.length}`);
    assertGrid(page, 'putText page');
  }
});

test('P3: mosaic values are always masked to 0-63', () => {
  for (let i = 0; i < 200; i++) {
    const v = Math.floor(rand() * 4000) - 2000;
    const c = mosaicCell(v);
    assert.equal(c.mosaic, v & 63);
    assert.ok(c.mosaic >= 0 && c.mosaic <= 63);
    const filled = TeletextRenderer.mosaicFilled(c.mosaic);
    assert.ok(filled >= 0 && filled <= 6);
  }
});

test('P4: parsePageNumber accepts exactly 100-899 as 3 digits', () => {
  for (let n = 100; n <= 899; n += 7) assert.equal(parsePageNumber(String(n)), n);
  for (let i = 0; i < 200; i++) {
    const s = randText(8);
    const r = parsePageNumber(s);
    assert.ok(r === null || (Number.isInteger(r) && r >= 100 && r <= 899), `input ${JSON.stringify(s)}`);
    const n = Math.floor(rand() * 1200);
    const r2 = parsePageNumber(String(n).padStart(3, '0'));
    if (n >= 100 && n <= 899 && String(n).length === 3) assert.equal(r2, n);
    else assert.equal(r2, null, `n=${n}`);
  }
});

test('P5: getData always falls back when live fails', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => jsonRes({ stubbed: true });
  try {
    const a = await getData({ liveFn: async () => { throw new Error('boom'); }, fallbackUrl: 'data/x.json' });
    assert.equal(a.live, false); assert.deepEqual(a.data, { stubbed: true });
    const b = await getData({ liveFn: async () => null, fallbackUrl: 'data/x.json' });
    assert.equal(b.live, false);
    const c = await getData({ liveFn: async () => ({ live: 1 }), fallbackUrl: 'data/x.json' });
    assert.equal(c.live, true); assert.deepEqual(c.data, { live: 1 });
  } finally { globalThis.fetch = realFetch; }
});

test('P6: modules survive garbage data; router survives a throwing module', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('sport.json')) return jsonRes({ results: [{ home: 42, score: null, away: {} }, { home: null, score: 7, away: 'X' }, {}] });
    if (u.includes('tvguide.json')) return jsonRes({ channels: [{ name: 7, now: null, next: [] }, {}] });
    if (u.includes('finance.json')) return jsonRes({ rates: [{ pair: 1, value: null }, {}] });
    if (u.includes('news.json')) return jsonRes({ headlines: [42, null, 'Real headline', {}], details: [] });
    if (u.includes('geocoding')) return jsonRes({ results: [{ latitude: 1, longitude: 2, name: 123 }] });
    if (u.includes('forecast')) return jsonRes({ current: { temperature_2m: 'hot', wind_speed_10m: null, weather_code: 'x' }, daily: { time: ['2026-11-20'], temperature_2m_max: [null], temperature_2m_min: [], weather_code: [null] } });
    return jsonRes({}, false); // live price/topstories endpoints: fail -> fallback
  };
  const ctx = { timeStr: '12:00', router: null };
  try {
    assertGrid(await SportModule.getPageModel(300, 1, ctx), 'sport garbage');
    assertGrid(await TVGuideModule.getPageModel(500, 1, ctx), 'tvguide garbage');
    assertGrid(await FinanceModule.getPageModel(400, 1, ctx), 'finance garbage');
    assertGrid(await WeatherModule.getPageModel(200, 1, ctx), 'weather garbage');
    assertGrid(await NewsModule.getPageModel(100, 1, ctx), 'news garbage');
  } finally { globalThis.fetch = realFetch; }

  // Router: a module that throws must land on the DATA UNAVAILABLE page.
  REGISTRY.set(700, { id: 'boom', getPageModel: async () => { throw new Error('bad payload'); } });
  try {
    const router = new Router({ render: () => {} }, null);
    await router.go(700);
    const text = router.currentPage.rows.map((r) => r.cells.map((c) => c.ch || ' ').join('')).join('\n');
    assert.ok(text.includes('DATA UNAVAILABLE'), 'router fallback page shows the note');
    assertGrid(router.currentPage, 'router fallback page');
  } finally { REGISTRY.delete(700); }
});
