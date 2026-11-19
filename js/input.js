// InputController: keyboard + click/touch -> router actions.
// Digits: page-number buffer. R/G/Y/B: Fastext. H: hold. Arrows: sub-pages.
// When a module is in text-entry mode (weather city search) keys go to it.
import { parsePageNumber } from './router.js';

export class InputController {
  constructor(router) { this.router = router; }
  attach() {
    document.addEventListener('keydown', (e) => this.onKey(e));
    document.getElementById('fastext-bar')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-target]');
      if (!b) return;
      const n = parsePageNumber(b.dataset.target);
      if (n !== null) this.router.go(n);
    });
    // Touch city search: the weather module focuses this hidden input to
    // summon the OS keyboard; forward its edits into the search handler.
    const si = document.getElementById('search-input');
    if (si) {
      let prev = '';
      si.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') this.router.searchMode?.handleKey('Enter');
        else if (e.key === 'Escape') this.router.searchMode?.handleKey('Escape');
      });
      si.addEventListener('input', () => {
        const sm = this.router.searchMode;
        if (!sm) { si.value = ''; prev = ''; return; }
        const v = si.value;
        if (v.length > prev.length) { for (const ch of v.slice(prev.length)) sm.handleKey(ch); }
        else if (v.length < prev.length) { for (let i = 0; i < prev.length - v.length; i++) sm.handleKey('Backspace'); }
        prev = si.value;
      });
    }
    document.getElementById('keypad')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-key]');
      if (b) this.onKey({ key: b.dataset.key, preventDefault: () => {} });
    });
  }
  onKey(e) {
    const r = this.router;
    // Text-entry mode belongs to the active module (weather city search).
    if (r.searchMode) {
      r.searchMode.handleKey(e.key);
      if (e.key !== 'F5') e.preventDefault?.();
      return;
    }
    const k = e.key;
    if (/^[0-9]$/.test(k)) { r.typeDigit(k); }
    else if (k === 'r' || k === 'R') r.fastext('red');
    else if (k === 'g' || k === 'G') r.fastext('green');
    else if (k === 'y' || k === 'Y') r.fastext('yellow');
    else if (k === 'b' || k === 'B') r.fastext('blue');
    else if (k === 'h' || k === 'H') r.toggleHold();
    else if (k === 'ArrowRight') r.nextSubPage();
    else if (k === 'ArrowLeft') r.prevSubPage();
    else if (k === 'Enter' && r.pageNo === 200) {
      // Weather module owns Enter on page 200 (city search).
      import('./modules/weather.js').then((m) => m.WeatherModule.enterSearch(r));
    } else return;
    e.preventDefault?.();
  }
}
