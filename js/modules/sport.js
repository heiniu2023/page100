// Sport module (page 300): results table from bundled fallback data.
// Live source is best-effort only; the page always renders from fallback.
import { buildPage } from '../model.js';
import { loadFallback } from '../adapter.js';

let cache = null;
export const SportModule = {
  id: 'sport',
  async getPageModel(pageNo, subPage, ctx) {
    if (!cache) cache = (await loadFallback('data/sport.json')) || { results: [] };
    const lines = [{ text: 'FOOTBALL RESULTS', fg: 'yellow' }, ''];
    (cache.results || []).forEach((r) => {
      const row = `${String(r.home ?? '').padEnd(13)} ${String(r.score ?? '').padStart(5)} ${String(r.away ?? '')}`;
      lines.push({ text: row.slice(0, 40), fg: 'white' });
    });
    lines.push('', { text: 'Full time scores, updated daily', fg: 'cyan' });
    return buildPage({
      pageNo, title: 'SPORT', lines, subPage: 1, subTotal: 1,
      fallback: true, timeStr: ctx.timeStr,
      fastext: [
        { color: 'red', label: 'News', target: 100 },
        { color: 'green', label: 'Weather', target: 200 },
        { color: 'yellow', label: 'Sport', target: 300 },
        { color: 'blue', label: 'Finance', target: 400 },
      ],
    });
  },
};
