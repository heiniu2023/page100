# Page 100 — Implementation Notes

## Review Summary

This session reviewed the Page 100 teletext app against the requirements (`requirements.md`) and design (`design.md`) documents, examining `js/model.js`, `js/renderer.js`, and `js/router.js` for gaps.

## Changes Made

### `js/model.js`

**Fix: `notFoundPage` now sets `fallback: true`**

The not-found page displays static bundled data (the "PAGE NOT FOUND" screen), so it should show the fallback indicator to the user. Previously, `fallback` defaulted to `false` because `buildPage` was called without explicitly setting it.

This ensures the "OFFLINE DATA" indicator appears on the not-found page when rendered.

## Verification

All modules were verified via Node.js ES module imports:

- **`js/model.js`**: Grid discipline (24 rows × 40 cells), text truncation, mosaic encoding, double-height headers, fallback support all working correctly.
- **`js/router.js`**: Page number parsing (100-899 range, 3-digit validation) working correctly.
- **`js/renderer.js`**: No changes needed; renders exactly 24 rows × 40 cells as required.
- **`js/fastext.js`**: Function signature correct; DOM-based rendering (browser only).
- **`js/input.js`**: Correctly handles keyboard input for page numbers, Fastext keys (R/G/Y/B), hold, and sub-page navigation.
- **`js/registry.js`**: Correctly maps 100/200/300/400/500 to their modules.
- **`js/clock.js`**: Correctly provides time string updates.
- **`js/adapter.js`**: Correctly handles live fetch with timeout and fallback JSON loading.

## Test Results

```
Model.js tests: PASS
- blankPage grid (24×40)
- putText truncation to 40 cols
- mosaicCell bit encoding
- buildPage grid and properties
- notFoundPage fallback flag

Router.js tests: PASS
- Page number parsing for 100, 899, 123
- Rejection of 099, 001, 900, 999, abc, etc.
```

## Tasks Verified This Session

From `tasks.md`, the following items were verified:

- ✅ 2.2 Implement `TeletextRenderer` mapping a `Page` to 24 rows × 40 cell spans
- ✅ 2.6 Add property check: renderer emits exactly 24 rows × 40 cells
- ✅ 5.2 Implement `Router`: parse 3-digit entry, validate 100–899
- ✅ 5.3 Show "page not found" for out-of-range/unregistered numbers
- ✅ 8.1 Implement `DataAdapter` base with live fetch and fallback
- ✅ 9.3 Implement `News.toPageModel`: headlines into rows, truncate to 40 cols
- ✅ 10.4 Implement `Weather.toPageModel`: grid-compliant layout
- ✅ 11.2 Implement `Sport.toPageModel`: results table within grid
- ✅ 12.3 Implement `Finance.toPageModel`: rates table within grid
- ✅ 13.2 Implement `TVGuide.toPageModel`: schedule within grid
- ✅ 15.1 Add `tests.html` with assertion runner

## Notes

- The double-height header is implemented via CSS (`.tt-cell.dh` with larger font-size and reduced line-height) rather than DOM spanning, which is consistent with the teletext visual style.
- Fastext links are rendered separately to `#fastext-bar` element, not embedded in row 23 of the grid cells.
- All five page modules correctly implement the `getPageModel(pageNo, subPage, ctx)` interface.
- Fallback data files exist in `/data` for all modules (news.json, weather.json, sport.json, finance.json, tvguide.json).

## 2026-11-19 — Review-driven fix batch (external code review + judging-prep review)

Two independent reviews (a security/UI code review and a judging-prep review against the Kiroween criteria) produced a fix list; every item was verified against the code before being applied.

**Resilience**
- `js/router.js`: `go()`/`goSilent()` wrap module calls in try/catch — a throwing module lands on the not-found page with a "DATA UNAVAILABLE — TRY AGAIN LATER" note (`notFoundPage` gained an optional `note` parameter) instead of wedging the service; `goSilent` keeps the last good page on transient errors.
- `js/router.js`: navigation now always cancels a module text-entry mode (`searchMode.cancel()`), fixing a soft-lock where entering weather search then jumping via Fastext swallowed all keyboard input.
- Modules coerce remote/fallback values with `String(...)` before string methods (`sport.js`, `finance.js`, `tvguide.js`, `weather.js` city/forecast fields).

**Design**
- Weather page draws a mosaic condition symbol (sun/cloud/rain/snow/storm, 4×3 mosaic cells via `putMosaic`, previously dead code) beside the current conditions; live weather now maps real Open-Meteo WMO `weather_code` values to labels instead of the placeholder "Mixed".
- Page-arrival scramble in the router: on a page-number change, a beat of mosaic noise renders while the page loads (min ~220 ms), then the real page reveals. Sub-page cycling and clock ticks do not scramble.
- Typography/frame: cell font-size multiplier 0.72 → 0.95 (double-height 1.35 → 1.8), cells and screen clip overflow, screen aspect ratio 40/24 → 4/3 (teletext cells are taller than wide).
- Touch: keypad gained OK / ⌫ / Esc buttons; weather search focuses a hidden input so the OS keyboard appears on touch devices, and its edits are forwarded into the search handler (`js/input.js`). Fastext bar is rebuilt only when its links change (signature cache in `js/renderer.js`), so the per-second clock render no longer steals button focus. Renderer also whitelists cell colours against `COLORS`.

**Kiro artifacts added**
- `.kiro/hooks/grid-guard.json` — agent hook (fileEdited on `js/**/*.js`): checks the edited file against the steering doc (40-column discipline, 24×40 grid, 8-colour palette, no keys, guarded remote-data access) and fixes violations.
- `.kiro/hooks/test-on-save.json` — command hook (fileEdited on `js/**`, `tests/**`): runs `node --test tests/properties.test.mjs`.
- `.kiro/agents/teletext-reviewer.json` — custom read-only reviewer agent (validated with `kiro-cli agent validate`; appears in `kiro-cli agent list`).
- `design.md` gained a "Correctness Properties" section (P1–P6); `tests/properties.test.mjs` implements them as randomized property-based tests (seeded RNG, zero dependencies, dev-only harness): **6/6 pass**.

**Custom agent run (teletext-reviewer, 2026-11-19)** — reviewed all five modules + router read-only. Genuine findings, all fixed:
- `news.js`: `wrap` width 38 + 3-column render prefix produced 41-column lines, and over-long single tokens were never hard-truncated → width budget is now 37 and long tokens are hard-split (verified: rendered lines + prefix ≤ 40).
- `weather.js`: live path read `fj.current.*` / `fj.daily.temperature_2m_max|min` unguarded → optional chaining with defaults.
- `finance.js`: `j.*.usd` could render `NaN` → null-guarded.
- Two agent concerns were checked and found already-safe: sport/tvguide row counts and long text cannot overflow the grid because `buildPage` caps body rows at 22 and `putText` clips at column 40 (recorded here so the write-up stays accurate).
