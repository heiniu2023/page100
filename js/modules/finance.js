// Finance module (page 400): keyless live rates (CoinGecko crypto + ER-API FX),
// bundled fallback when offline.
import { buildPage } from '../model.js';
import { getData, fetchWithTimeout } from '../adapter.js';

let cache = null;
const CACHE_MS = 120_000;
async function fetchLiveRates() {
  const cg = await fetchWithTimeout('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd', 3000);
  const fx = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 3000);
  if (!cg && !fx) return null;
  const rates = [];
  if (cg) {
    const j = await cg.json();
    if (j.bitcoin?.usd != null) rates.push({ pair: 'BTC/USD', value: String(Math.round(j.bitcoin.usd)) });
    if (j.ethereum?.usd != null) rates.push({ pair: 'ETH/USD', value: String(Math.round(j.ethereum.usd)) });
    if (j.solana?.usd != null) rates.push({ pair: 'SOL/USD', value: String(j.solana.usd) });
  }
  if (fx) {
    const j = await fx.json();
    const r = j.rates || {};
    for (const [cur, val] of [['EUR', r.EUR], ['GBP', r.GBP], ['JPY', r.JPY], ['CNY', r.CNY]]) {
      if (val) rates.push({ pair: `USD/${cur}`, value: String(val) });
    }
  }
  return rates.length ? { rates } : null;
}
export const FinanceModule = {
  id: 'finance',
  async getPageModel(pageNo, subPage, ctx) {
    if (!cache || Date.now() - cache.at > CACHE_MS) {
      const { data, live } = await getData({ liveFn: fetchLiveRates, fallbackUrl: 'data/finance.json' });
      cache = { data, live, at: Date.now() };
    }
    const { data, live } = cache;
    const lines = [{ text: 'MARKETS', fg: 'yellow' }, ''];
    (data?.rates || []).forEach((r) => {
      lines.push({ text: `${String(r.pair ?? '').padEnd(12)} ${String(r.value ?? '')}`, fg: 'white' });
    });
    lines.push('', { text: live ? 'Live rates' : 'Fallback rates', fg: 'cyan' });
    return buildPage({
      pageNo, title: 'FINANCE', lines, subPage: 1, subTotal: 1,
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
