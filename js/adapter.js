// DataAdapter base: try a live keyless fetch with a short timeout, always
// fall back to bundled /data JSON. Renders fallback immediately, enhances later.
export async function fetchWithTimeout(url, ms = 3000, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  } finally { clearTimeout(t); }
}
export async function loadFallback(url) {
  const res = await fetchWithTimeout(url, 3000);
  if (!res) return null;
  try { return await res.json(); } catch { return null; }
}
// Returns { data, live } — live=false means the bundled fallback is in use.
export async function getData({ liveFn, fallbackUrl }) {
  const fallback = await loadFallback(fallbackUrl);
  if (typeof liveFn === 'function') {
    try {
      const live = await liveFn();
      if (live) return { data: live, live: true };
    } catch { /* fall through to fallback */ }
  }
  return { data: fallback, live: false };
}
