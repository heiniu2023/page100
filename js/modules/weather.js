// Weather module (page 200): Open-Meteo geocoding + forecast, bundled fallback.
// Press Enter on page 200 to search a city; type the name, Enter to submit,
// Esc to cancel. Unknown city shows "city not found" and keeps last weather.
import { buildPage } from '../model.js';
import { getData, fetchWithTimeout } from '../adapter.js';

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
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`, 3000);
  if (!fc) return null;
  const fj = await fc.json();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const forecast = (fj.daily?.time || []).map((t, i) => ({
    day: days[new Date(t + 'T12:00:00').getDay()],
    tempHi: Math.round(fj.daily.temperature_2m_max[i]),
    tempLo: Math.round(fj.daily.temperature_2m_min[i]),
    code: 'Mixed',
  }));
  return { city: found, current: { temp: Math.round(fj.current.temperature_2m), code: 'Now', wind: Math.round(fj.current.wind_speed_10m) }, forecast };
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
  const lines = [
    { text: `${d.city.toUpperCase()}`, fg: 'yellow', dh: true }, '',
    { text: `Now: ${d.current.temp} C  ${d.current.code}`, fg: 'white' },
    { text: `Wind: ${d.current.wind} km/h`, fg: 'cyan' }, '',
    { text: 'FORECAST', fg: 'green' },
  ];
  (d.forecast || []).forEach((f) => lines.push({ text: `${f.day}  ${f.code.padEnd(7)} ${f.tempHi}C / ${f.tempLo}C`, fg: 'white' }));
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
    return buildPage({
      pageNo, title: 'WEATHER', lines: weatherLines(data), subPage: 1, subTotal: 1,
      fallback: !live, timeStr: ctx.timeStr,
      fastext: [
        { color: 'red', label: 'News', target: 100 },
        { color: 'green', label: 'Weather', target: 200 },
        { color: 'yellow', label: 'Sport', target: 300 },
        { color: 'blue', label: 'Finance', target: 400 },
      ],
    });
  },
  enterSearch(router) {
    searching = true; searchBuffer = '';
    router.searchMode = {
      handleKey: async (key) => {
        if (key === 'Escape') { searching = false; router.searchMode = null; router.go(200); }
        else if (key === 'Enter') {
          const name = searchBuffer.trim();
          searching = false; router.searchMode = null;
          if (name) { city = name; cache = null; }
          router.go(200);
        } else if (key === 'Backspace') { searchBuffer = searchBuffer.slice(0, -1); router.goSilent(); }
        else if (/^[a-zA-Z \-']$/.test(key) && searchBuffer.length < 30) { searchBuffer += key; router.goSilent(); }
      },
    };
    router.goSilent();
  },
};
