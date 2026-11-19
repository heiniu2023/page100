// TV Guide module (page 500): now/next schedule from bundled fallback data.
import { buildPage } from '../model.js';
import { loadFallback } from '../adapter.js';

let cache = null;
export const TVGuideModule = {
  id: 'tvguide',
  async getPageModel(pageNo, subPage, ctx) {
    if (!cache) cache = (await loadFallback('data/tvguide.json')) || { channels: [] };
    const lines = [{ text: 'TV GUIDE — NOW / NEXT', fg: 'yellow' }, ''];
    (cache.channels || []).forEach((ch) => {
      lines.push({ text: String(ch.name ?? '').toUpperCase(), fg: 'green' });
      lines.push({ text: `  Now:  ${String(ch.now ?? '')}`, fg: 'white' });
      lines.push({ text: `  Next: ${String(ch.next ?? '')}`, fg: 'cyan' });
    });
    return buildPage({
      pageNo, title: 'TV GUIDE', lines, subPage: 1, subTotal: 1,
      fallback: true, timeStr: ctx.timeStr,
      fastext: [
        { color: 'red', label: 'News', target: 100 },
        { color: 'green', label: 'Weather', target: 200 },
        { color: 'yellow', label: 'Sport', target: 300 },
        { color: 'blue', label: 'TV Guide', target: 500 },
      ],
    });
  },
};
