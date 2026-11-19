// InputController: keyboard + click/touch -> router actions.
// Digits: page-number buffer. R/G/Y/B: Fastext. H: hold. Arrows: sub-pages.
// When a module is in text-entry mode (weather city search) keys go to it.
export class InputController {
  constructor(router) { this.router = router; }
  attach() {
    document.addEventListener('keydown', (e) => this.onKey(e));
    document.getElementById('fastext-bar')?.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-target]');
      if (b) this.router.go(Number(b.dataset.target));
    });
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
