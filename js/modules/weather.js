// Weather module (page 200): Open-Meteo geocoding + forecast, bundled fallback.
// Press Enter on page 200 to search a city; type the name, Enter to submit,
// Esc to cancel. Unknown city shows "city not found" and keeps last weather.
import { buildPage, putMosaic } from '../model.js';
import { getData, fetchWithTimeout } from '../adapter.js';

// WMO weather codes (Open-Meteo) -> teletext-style condition labels.
function wmoLabel(code) {
  if (code === 0) return 'Sunny';
  if (code === 45 || code === 48) return 'Fog';
  if (code != null && code >= 51 && code <= 57) return 'Drizzle';
  if (code != null && ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))) return 'Rain';
  if (code != null && ((code >= 71 && code <= 77) || code === 85 || code === 86)) return 'Snow';
  if (code != null && code >= 95) return 'Storm';
  if (code != null && code <= 3) return 'Cloudy';
  return 'Mixed';
}
// Mosaic weather symbols: 4x3 mosaic cells (2x3 sub-pixels each), drawn at
// rows 3-5, cols 36-39 beside the current conditions. Bit order per cell:
// TL=1, TR=2, ML=4, MR=8, BL=16, BR=32.
const SYMBOLS = {
  sun:   { color: 'yellow', grid: [[40, 63, 63, 20], [63, 63, 63, 63], [10, 63, 63, 5]] },
  cloud: { color: 'white',  grid: [[32, 62, 61, 16], [15, 15, 15, 15], [0, 0, 0, 0]] },
  rain:  { color: 'cyan',   grid: [[32, 62, 61, 16], [47, 47, 47, 15], [22, 22, 22, 0]] },
  snow:  { color: 'white',  grid: [[32, 62, 61, 16], [15, 15, 15, 15], [1, 16, 4, 32]] },
  storm: { color: 'yellow', grid: [[32, 62, 61, 16], [47, 47, 47, 15], [22, 22, 22, 0]] },
};
function symbolFor(code) {
  const s = String(code ?? '').toLowerCase();
  if (/sun|clear/.test(s)) return SYMBOLS.sun;
  if (/storm|thunder/.test(s)) return SYMBOLS.storm;
  if (/snow/.test(s)) return SYMBOLS.snow;
  if (/rain|drizzle/.test(s)) return SYMBOLS.rain;
  return SYMBOLS.cloud;
}
function drawSymbol(page, code) {
  const { grid, color } = symbolFor(code);
  grid.forEach((rowVals, dy) => rowVals.forEach((v, dx) => {
    if (v) putMosaic(page, 3 + dy, 36 + dx, v, color);
  }));
}

let cache = null; // { data, live, at } for the current city
let city = 'London';
let searching = false;
let searchBuffer = '';
let searchError = '';
const CACHE_MS = 600_000;

async function fetchLiveWeather(name) {
  const geo = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`, 3000);
  if (!geo) return null;
  const gj = await geo.json();
  if (!gj.results?.length) return { notFound: true };
  const { latitude, longitude, name: found } = gj.results[0];
  const fc = await fetchWithTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`, 3000);
  if (!fc) return null;
  const fj = await fc.json();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = (fj.daily?.time || []).map((t, i) => ({
    day: days[new Date(t + 'T12:00:00').getDay()],
    tempHi: Math.round(fj.daily?.temperature_2m_max?.[i] ?? 0),
    tempLo: Math.round(fj.daily?.temperature_2m_min?.[i] ?? 0),
    code: wmoLabel(fj.daily?.weather_code?.[i]),
  }));
  return { city: found, current: { temp: Math.round(fj.current?.temperature_2m ?? 0), code: wmoLabel(fj.current?.weather_code), wind: Math.round(fj.current?.wind_speed_10m ?? 0) }, forecast };
}
async function load() {
  if (cache && Date.now() - cache.at < CACHE_MS && cache.city === city) return cache;
  const { data, live } = await getData({ liveFn: () => fetchLiveWeather(city), fallbackUrl: 'data/weather.json' });
  if (data?.notFound) { searchError = 'CITY NOT FOUND'; return cache || { data: null, live: false, at: 0, city }; }
  searchError = '';
  cache = { data, live, at: Date.now(), city };
  return cache;
}
function weatherLines(d) {
  if (!d) return [{ text: 'Weather unavailable', fg: 'red' }];
  const cur = d.current || {};
  const lines = [
    { text: `${String(d.city ?? '').toUpperCase()}`, fg: 'yellow', dh: true }, '',
    { text: `Now: ${cur.temp} C  ${String(cur.code ?? '')}`, fg: 'white' },
    { text: `Wind: ${cur.wind} km/h`, fg: 'cyan' }, '',
    { text: 'FORECAST', fg: 'green' },
  ];
  (d.forecast || []).forEach((f) => lines.push({ text: `${String(f.day ?? '')}  ${String(f.code ?? '').padEnd(7)} ${f.tempHi}C / ${f.tempLo}C`, fg: 'white' }));
  lines.push('', { text: 'Enter: search city   H: hold', fg: 'green' });
  if (searchError) lines.push({ text: searchError, fg: 'red' });
  return lines;
}
export const WeatherModule = {
  id: 'weather',
  async getPageModel(pageNo, subPage, ctx) {
    if (searching) {
      return buildPage({
        pageNo, title: 'WEATHER', timeStr: ctx.timeStr,
        lines: [
          '', { text: 'SEARCH CITY', fg: 'yellow', dh: true }, '',
          { text: `> ${searchBuffer}_`, fg: 'white' }, '',
          { text: 'Enter: go   Esc: cancel', fg: 'green' },
        ],
        fastext: [{ color: 'red', label: 'Cancel', target: 200 }, { color: 'green', label: '', target: null }, { color: 'yellow', label: '', target: null }, { color: 'blue', label: '', target: null }],
      });
    }
    const { data, live } = await load();
    const page = buildPage({
      pageNo, title: 'WEATHER', lines: weatherLines(data), subPage: 1, subTotal: 1,
      fallback: !live, timeStr: ctx.timeStr,
      fastext: [
        { color: 'red', label: 'News', target: 100 },
        { color: 'green', label: 'Weather', target: 200 },
        { color: 'yellow', label: 'Sport', target: 300 },
        { color: 'blue', label: 'Finance', target: 400 },
      ],
    });
    drawSymbol(page, data?.current?.code);
    return page;
  },
  enterSearch(router) {
    searching = true; searchBuffer = '';
    const blurSearchInput = () => { try { document.getElementById('search-input')?.blur(); } catch { /* not in a browser */ } };
    router.searchMode = {
      // Router calls this whenever navigation leaves search mode (e.g. a
      // Fastext jump), so the module never stays stuck in `searching`.
      cancel: () => { searching = false; blurSearchInput(); },
      handleKey: async (key) => {
        if (key === 'Escape') { searching = false; router.searchMode = null; blurSearchInput(); router.go(200); }
        else if (key === 'Enter') {
          const name = searchBuffer.trim();
          searching = false; router.searchMode = null; blurSearchInput();
          if (name) { city = name; cache = null; }
          router.go(200);
        } else if (key === 'Backspace') { searchBuffer = searchBuffer.slice(0, -1); router.goSilent(); }
        else if (/^[a-zA-Z \-']$/.test(key) && searchBuffer.length < 30) { searchBuffer += key; router.goSilent(); }
      },
    };
    // Summon the on-screen keyboard on touch devices (see input.js).
    try { document.getElementById('search-input')?.focus({ preventScroll: true }); } catch { /* not in a browser */ }
    router.goSilent();
  },
};
