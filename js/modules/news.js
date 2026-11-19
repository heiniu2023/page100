// News module (page 100): Hacker News top stories, bundled fallback.
// Headlines are wrapped to the 40-column grid; 6 stories per sub-page.
import { buildPage, DEFAULT_FASTEXT } from '../model.js';
import { getData, fetchWithTimeout } from '../adapter.js';

let cache = null; // { headlines, live, at }
const CACHE_MS = 120_000;
const PER_PAGE = 6;

function wrap(text, width = 38) {
  const words = String(text).split(/\s+/);
  const lines = []; let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w);
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 2);
}
async function fetchLiveHeadlines() {
  const res = await fetchWithTimeout('https://hacker-news.firebaseio.com/v0/topstories.json', 3000);
  if (!res) return null;
  const ids = (await res.json()).slice(0, 12);
  const stories = [];
  for (const id of ids) {
    const r = await fetchWithTimeout(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, 3000);
    if (!r) continue;
    const item = await r.json();
    if (item?.title) stories.push(item.title);
    if (stories.length >= 12) break;
  }
  return stories.length ? { headlines: stories } : null;
}
async function load() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;
  const { data, live } = await getData({ liveFn: fetchLiveHeadlines, fallbackUrl: 'data/news.json' });
  cache = { headlines: data?.headlines || [], details: data?.details || [], live, at: Date.now() };
  return cache;
}
export const NewsModule = {
  id: 'news',
  async getPageModel(pageNo, subPage, ctx) {
    const { headlines, live } = await load();
    const total = Math.max(1, Math.ceil(headlines.length / PER_PAGE));
    const sp = Math.min(Math.max(1, subPage), total);
    const slice = headlines.slice((sp - 1) * PER_PAGE, sp * PER_PAGE);
    const lines = [{ text: 'TOP STORIES — HACKER NEWS', fg: 'yellow' }, ''];
    slice.forEach((h, i) => {
      const n = (sp - 1) * PER_PAGE + i + 1;
      wrap(h).forEach((ln, j) => lines.push({ text: (j === 0 ? `${String(n).padStart(2, '0')} ${ln}` : `   ${ln}`), fg: j === 0 ? 'white' : 'cyan' }));
      lines.push('');
    });
    lines.push({ text: 'Press R/G/Y/B for other pages', fg: 'green' });
    return buildPage({
      pageNo, title: 'NEWS', lines, subPage: sp, subTotal: total,
      fallback: !live, timeStr: ctx.timeStr,
      fastext: [
        { color: 'red', label: 'News', target: 100 },
        { color: 'green', label: 'Weather', target: 200 },
        { color: 'yellow', label: 'Sport', target: 300 },
        { color: 'blue', label: 'Finance', target: 400 },
      ],
    });
  },
};
export { wrap };
