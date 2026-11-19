// Page model: 24 rows x 40 cells, teletext colors, mosaic + double-height support.
export const COLORS = ['black','red','green','yellow','blue','magenta','cyan','white'];
export const ROWS = 24, COLS = 40;

export function cell(ch = ' ', fg = 'white', bg = 'black', opts = {}) {
  return { ch, fg, bg, mosaic: null, dh: !!opts.dh, flash: !!opts.flash };
}
export function mosaicCell(value, fg = 'white', bg = 'black') {
  return { ch: null, fg, bg, mosaic: value & 63, dh: false, flash: false };
}
export function blankPage() {
  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const cells = [];
    for (let c = 0; c < COLS; c++) cells.push(cell());
    rows.push({ cells });
  }
  return { rows, fastext: [], pageNo: 100, subPage: 1, subTotal: 1, fallback: false, title: '' };
}
// Write text into a row, clipped to the 40-column grid. Returns chars written.
export function putText(page, row, col, text, fg = 'white', bg = 'black', opts = {}) {
  if (row < 0 || row >= ROWS) return 0;
  let n = 0;
  for (let i = 0; i < text.length && col + i < COLS; i++) {
    if (col + i < 0) continue;
    page.rows[row].cells[col + i] = cell(text[i], fg, bg, opts);
    n++;
  }
  return n;
}
export function putMosaic(page, row, col, value, fg = 'white', bg = 'black') {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
  page.rows[row].cells[col] = mosaicCell(value, fg, bg);
}
// Header occupies rows 0-1 (double-height title on row 0, time on the right).
export function putHeader(page, pageNo, title, timeStr, subPage = 1, subTotal = 1) {
  const label = `P${pageNo}${subTotal > 1 ? '/' + subPage : ''}`;
  putText(page, 0, 0, label, 'yellow', 'black', { dh: true });
  putText(page, 0, 8, title.toUpperCase().slice(0, 22), 'cyan', 'black', { dh: true });
  if (timeStr) putText(page, 0, COLS - timeStr.length, timeStr, 'white');
  for (let c = 0; c < COLS; c++) {
    if (!page.rows[1].cells[c].ch || page.rows[1].cells[c].ch === ' ') {
      page.rows[1].cells[c] = cell(' ', 'white', 'black');
    }
  }
}
// Body lines: array of {text, fg, bg, dh} laid into rows 2..22. Returns page.
export function buildPage({ pageNo, title, lines = [], fastext = [], subPage = 1, subTotal = 1, fallback = false, timeStr = '' }) {
  const page = blankPage();
  page.pageNo = pageNo; page.subPage = subPage; page.subTotal = subTotal;
  page.fastext = fastext; page.fallback = fallback; page.title = title;
  putHeader(page, pageNo, title, timeStr, subPage, subTotal);
  lines.forEach((ln, i) => {
    const row = 2 + i;
    if (row > 22) return;
    if (typeof ln === 'string') putText(page, row, 0, ln);
    else putText(page, row, ln.col || 0, ln.text, ln.fg || 'white', ln.bg || 'black', { dh: !!ln.dh });
  });
  if (fallback) putText(page, 22, COLS - 12, 'OFFLINE DATA', 'yellow');
  return page;
}
export const DEFAULT_FASTEXT = [
  { color: 'red', label: 'News', target: 100 },
  { color: 'green', label: 'Weather', target: 200 },
  { color: 'yellow', label: 'Sport', target: 300 },
  { color: 'blue', label: 'Finance', target: 400 },
];
export function notFoundPage(pageNo, timeStr = '') {
  const page = buildPage({
    pageNo, title: 'PAGE 100', timeStr,
    lines: [
      '', '',
      { text: 'PAGE NOT FOUND', fg: 'red', dh: true },
      '',
      { text: `Page ${pageNo} does not exist`, fg: 'white' },
      { text: 'on this service.', fg: 'white' },
      '',
      { text: 'Try 100 News, 200 Weather,', fg: 'cyan' },
      { text: '300 Sport, 400 Finance or', fg: 'cyan' },
      { text: '500 TV Guide.', fg: 'cyan' },
    ],
    fastext: [
      { color: 'red', label: 'Back to 100', target: 100 },
      { color: 'green', label: '', target: null },
      { color: 'yellow', label: '', target: null },
      { color: 'blue', label: '', target: null },
    ],
    fallback: true,
  });
  return page;
}
