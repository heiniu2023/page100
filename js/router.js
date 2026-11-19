// Router: owns current page/sub-page state, sub-page cycling, header clock.
// Parses 3-digit entry, validates 100-899, resolves via the registry.
import { lookup } from './registry.js';
import { notFoundPage } from './model.js';
import { nowTimeStr } from './clock.js';

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
  }
  async go(pageNo, subPage = 1) {
    const mod = lookup(pageNo);
    this.pageNo = pageNo; this.subPage = subPage; this.buffer = '';
    this.stopCycle();
    if (!mod) {
      this.subTotal = 1;
      this.currentPage = notFoundPage(pageNo, this.timeStr);
    } else {
      const page = await mod.getPageModel(pageNo, subPage, { timeStr: this.timeStr, router: this });
      this.currentPage = page;
      this.subTotal = page.subTotal || 1;
      this.subPage = page.subPage || 1;
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
    if (!this.currentPage) return;
    // Re-render is cheap (960 spans) and keeps header + clock consistent.
    this.goSilent();
  }
  async goSilent() {
    const mod = lookup(this.pageNo);
    if (!mod) { this.currentPage = notFoundPage(this.pageNo, this.timeStr); }
    else {
      const page = await mod.getPageModel(this.pageNo, this.subPage, { timeStr: this.timeStr, router: this });
      this.currentPage = page;
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
