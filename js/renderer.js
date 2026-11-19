// TeletextRenderer: draws a Page model (24 rows x 40 cells) into the screen DOM.
// Invariant: exactly 24 rows of exactly 40 cells, whatever the page contains.
import { ROWS, COLS } from './model.js';
import { renderFastextBar } from './fastext.js';

const MOSAIC_BITS = [0, 1, 2, 3, 4, 5]; // TL, TR, ML, MR, BL, BR

export class TeletextRenderer {
  constructor(container) { this.container = container; }
  render(page) {
    const el = this.container;
    el.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'tt-row';
      const row = page.rows[r];
      for (let c = 0; c < COLS; c++) {
        const cell = row.cells[c];
        const span = document.createElement('span');
        span.className = 'tt-cell';
        span.style.setProperty('--fg', `var(--c-${cell.fg})`);
        span.style.setProperty('--bg', `var(--c-${cell.bg})`);
        if (cell.dh) span.classList.add('dh');
        if (cell.flash) span.classList.add('flash');
        if (cell.mosaic !== null && cell.mosaic !== undefined) {
          span.classList.add('mosaic');
          for (const bit of MOSAIC_BITS) {
            const sub = document.createElement('i');
            if ((cell.mosaic >> bit) & 1) sub.classList.add('on');
            span.appendChild(sub);
          }
        } else {
          span.textContent = cell.ch || ' ';
        }
        rowEl.appendChild(span);
      }
      el.appendChild(rowEl);
    }
    // Fastext bar lives in row 23 of the model; also expose it for clicks.
    this.renderFastext(page);
  }
  renderFastext(page) {
    renderFastextBar(document.getElementById('fastext-bar'), page.fastext);
  }
  // How many sub-blocks a mosaic value fills (used by tests).
  static mosaicFilled(value) {
    let n = 0;
    for (let b = 0; b < 6; b++) if ((value >> b) & 1) n++;
    return n;
  }
}
