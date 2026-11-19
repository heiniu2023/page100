// Router: owns current page/sub-page state, sub-page cycling, header clock.
// Parses 3-digit entry, validates 100-899, resolves via the registry.
import { lookup } from './registry.js';
import { notFoundPage, blankPage, cell, mosaicCell, putHeader, COLS } from './model.js';
import { nowTimeStr } from './clock.js';

// The teletext "page arrival": a beat of mosaic noise while the new page
// loads, then the real page reveals. Shown only on page-number changes.
function scramblePage(pageNo, timeStr) {
  const page = blankPage();
  page.pageNo = pageNo; page.title = '';
  putHeader(page, pageNo, '', timeStr);
  const palette = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  for (let r = 2; r <= 22; r++) {
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < 0.4) {
        const fg = palette[(Math.random() * palette.length) | 0];
        page.rows[r].cells[c] = Math.random() < 0.5
          ? mosaicCell(1 + ((Math.random() * 63) | 0), fg)
          : cell('░', fg);
      }
    }
  }
  return page;
}

export function parsePageNumber(input) {
  const n = Number(String(input).trim());
  if (!/^\d{3}$/.test(String(input).trim())) return null;
  if (n < 100 || n > 899) return null;
  return n;
}
const CYCLE_MS = 5000;

export class Router {
  constructor(renderer, statusEl) {
    this.renderer = renderer; this.statusEl = statusEl;
    this.pageNo = 100; this.subPage = 1; this.subTotal = 1;
    this.hold = false; this.buffer = '';
    this.currentPage = null; this.cycleTimer = null;
    this.timeStr = nowTimeStr();
    this.searchMode = null; // set by a module (weather) while text entry is active
    this.navSeq = 0; this.navPending = false;
  }
  async go(pageNo, subPage = 1) {
    const mod = lookup(pageNo);
    const pageChanged = pageNo !== this.pageNo;
    // Leaving a module text-entry mode (weather city search) always cancels
    // it, so a Fastext jump cannot strand the keyboard inside search mode.
    if (this.searchMode) { this.searchMode.cancel?.(); this.searchMode = null; }
    this.pageNo = pageNo; this.subPage = subPage; this.buffer = '';
    this.stopCycle();
    this.navPending = false;
    const seq = ++this.navSeq;
    let scrambleAt = 0;
    if (pageChanged) {
      this.currentPage = scramblePage(pageNo, this.timeStr);
      this.render();
      scrambleAt = Date.now();
    }
    if (!mod) {
      this.subTotal = 1;
      this.currentPage = notFoundPage(pageNo, this.timeStr);
    } else {
      try {
        const page = await mod.getPageModel(pageNo, subPage, { timeStr: this.timeStr, router: this });
        this.currentPage = page;
        this.subTotal = page.subTotal || 1;
        this.subPage = page.subPage || 1;
      } catch {
        // A malformed live/fallback payload must never wedge the service.
        this.subTotal = 1;
        this.currentPage = notFoundPage(pageNo, this.timeStr, 'DATA UNAVAILABLE — TRY AGAIN LATER');
      }
    }
    if (scrambleAt) {
      const wait = 220 - (Date.now() - scrambleAt);
      if (wait > 0) {
        this.navPending = true;
        await new Promise((r) => setTimeout(r, wait));
        if (seq !== this.navSeq) return; // superseded by a newer navigation
        this.navPending = false;
      }
    }
    this.render();
    this.startCycle();
  }
  render() {
    if (!this.currentPage) return;
    this.renderer.render(this.currentPage);
    this.updateStatus();
  }
  // Clock tick: refresh the header time without resetting sub-page state.
  tick(timeStr) {
    this.timeStr = timeStr;
    if (!this.currentPage || this.navPending) return;
    // Re-render is cheap (960 spans) and keeps header + clock consistent.
    this.goSilent();
  }
  async goSilent() {
    const mod = lookup(this.pageNo);
    if (!mod) { this.currentPage = notFoundPage(this.pageNo, this.timeStr); }
    else {
      try {
        const page = await mod.getPageModel(this.pageNo, this.subPage, { timeStr: this.timeStr, router: this });
        this.currentPage = page;
      } catch { /* keep the last good page on transient data errors */ }
    }
    this.renderer.render(this.currentPage);
  }
  startCycle() {
    this.stopCycle();
    if (this.subTotal <= 1) return;
    this.cycleTimer = setInterval(() => {
      if (this.hold) return;
      this.nextSubPage();
    }, CYCLE_MS);
  }
  stopCycle() { if (this.cycleTimer) clearInterval(this.cycleTimer); this.cycleTimer = null; }
  nextSubPage() { this.go(this.pageNo, (this.subPage % this.subTotal) + 1); }
  prevSubPage() { this.go(this.pageNo, ((this.subPage + this.subTotal - 2) % this.subTotal) + 1); }
  toggleHold() { this.hold = !this.hold; this.updateStatus(); }
  typeDigit(d) {
    this.buffer += d;
    this.updateStatus();
    if (this.buffer.length === 3) {
      const n = parsePageNumber(this.buffer);
      this.buffer = '';
      if (n !== null) this.go(n);
      else this.updateStatus('Invalid page — try 100-899');
    }
  }
  fastext(color) {
    const link = (this.currentPage?.fastext || []).find((l) => l.color === color);
    if (link && link.target != null) this.go(link.target);
  }
  updateStatus(msg) {
    if (!this.statusEl) return;
    const hold = this.hold ? '<span class="hold-on">HOLD</span>' : 'HOLD off';
    const buf = this.buffer ? `Entering: ${this.buffer}` : '';
    const src = this.currentPage?.fallback ? 'Fallback data' : 'Live data';
    this.statusEl.innerHTML = `<span>${msg || buf || `Page ${this.pageNo} · ${src}`}</span><span>${hold}</span>`;
  }
}
