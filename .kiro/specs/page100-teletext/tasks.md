# Page 100 — Tasks

Implementation plan derived from the design. Tasks are grouped; each is small and verifiable. `[required]` tasks must be done; `[optional]` tasks are stretch goals. Dependencies are noted where they matter.

## 1. Project scaffold
- [x] 1.1 Create `index.html` with a 40×24 screen container, link `styles.css`, and load the entry module. [required]
- [x] 1.2 Create `styles.css`: black background, monospace teletext font, the 8-color palette as CSS variables, cell aspect ratio (~1:1.2), grid layout, flashing animation. [required]
- [x] 1.3 Create `/data` with `news.json`, `weather.json`, `sport.json`, `finance.json`, `tvguide.json` containing sample fallback content. [required]
- Verification: open `index.html` over http(s); an empty black 40×24 grid appears with no chrome.

## 2. Page model and renderer
- [x] 2.1 Define `Page`/`Row`/`Cell` types and the `Color` set in `js/model.js`. [required]
- [x] 2.2 Implement `TeletextRenderer` mapping a `Page` to 24 rows × 40 cell spans with foreground/background colors. [required] (depends 2.1)
- [x] 2.3 Implement double-height rendering (a `dh` cell spans two rows). [required] (depends 2.2)
- [x] 2.4 Implement 2×3 block-mosaic rendering from the 6-bit mosaic value. [required] (depends 2.2)
- [x] 2.5 Implement the flashing attribute via CSS animation. [optional] (depends 2.2)
- [x] 2.6 Add property-based tests P1–P6 (see design.md "Correctness Properties"; implemented in `tests/properties.test.mjs`, incl. the renderer 24×40 invariant). [required] (depends 2.2)
- Verification: a hand-built `Page` renders 24×40 cells, correct colors, a double-height header, and a mosaic box.

## 3. Clock
- [x] 3.1 Implement `Clock` writing the current time into the header right side once per second. [required] (depends 2.2)
- Verification: header shows a time that advances each second.

## 4. Fastext bar
- [x] 4.1 Implement `FastextBar` rendering four colored labels from a page's `fastext` array into row 23. [required] (depends 2.2)
- [x] 4.2 Dim links whose `target` is null. [required] (depends 4.1)
- Verification: bar shows red/green/yellow/blue labels; null-target labels are dimmed.

## 5. Registry and router
- [x] 5.1 Implement `PageRegistry` mapping 100/200/300/400/500 to module page definitions with Fastext sets. [required] (depends 2.1)
- [x] 5.2 Implement `Router`: parse 3-digit entry, validate 100–899, resolve via registry, load the page, render, update header + Fastext. [required] (depends 5.1, 2.2, 4.1)
- [x] 5.3 Show a "page not found" screen for out-of-range and unregistered numbers, with Fastext back to 100. [required] (depends 5.2)
- [x] 5.4 Default to page 100 on load. [required] (depends 5.2)
- Verification: typing 100/200/300/400/500 loads the right page; 999 shows not-found; startup lands on 100.

## 6. Input controller
- [x] 6.1 Handle numeric key entry into a page-number buffer shown in the header; navigate on the third digit. [required] (depends 5.2)
- [x] 6.2 Map R/G/Y/B keys to the red/green/yellow/blue Fastext links. [required] (depends 5.2, 4.1)
- [x] 6.3 Make Fastext labels clickable/tappable to navigate. [required] (depends 4.1)
- [x] 6.4 Implement hold to pause sub-page cycling. [required] (depends 7.2)
- Verification: keyboard and click both navigate; hold pauses cycling.

## 7. Sub-page cycling
- [x] 7.1 Support multi-sub-page pages and show the `Pnnn/i` indicator in the header. [required] (depends 5.2)
- [x] 7.2 Auto-advance sub-pages on a timer; pause on hold; allow manual next/prev. [required] (depends 7.1, 6.4)
- Verification: a multi-sub-page page cycles every few seconds; hold stops it; manual keys move sub-pages.

## 8. Data adapter framework
- [x] 8.1 Implement `DataAdapter` base: try `fetchLive` with a short timeout, fall back to bundled `/data` JSON. [required] (depends 2.1)
- [x] 8.2 Render fallback immediately, then enhance with live data when it resolves (no blank screen). [required] (depends 8.1)
- [x] 8.3 Show a subtle on-screen indicator when fallback is in use. [required] (depends 8.1)
- Verification: with the network off, every page renders from `/data` and shows the fallback indicator.

## 9. News module (page 100)
- [x] 9.1 Populate `/data/news.json` with fallback headlines (and per-story detail for sub-pages). [required]
- [x] 9.2 Implement the Hacker News adapter: fetch top stories + items, normalize to headlines. [required] (depends 8.1)
- [x] 9.3 Implement `News.toPageModel`: headlines into rows, truncate to 40 cols, double-height title, Fastext index to 200/300/400/500. [required] (depends 9.2, 2.2)
- Verification: page 100 shows live HN headlines; network off → fallback headlines; Fastext jumps to the other modules.

## 10. Weather module (page 200)
- [x] 10.1 Populate `/data/weather.json` with a default-city forecast. [required]
- [x] 10.2 Implement weather text-entry mode: on-screen prompt, accept city name, submit on Enter. [required] (depends 6.1)
- [x] 10.3 Implement the Open-Meteo geocoding + forecast adapter; on no match show "city not found" and keep last weather. [required] (depends 8.1)
- [x] 10.4 Implement `Weather.toPageModel`: city, current conditions, forecast rows within the grid (sub-pages for forecast days). [required] (depends 10.3, 2.2)
- Verification: searching a real city renders live weather; a bogus city shows "city not found"; network off shows the fallback forecast.

## 11. Sport module (page 300)
- [x] 11.1 Populate `/data/sport.json` with fallback scores. [required]
- [x] 11.2 Implement `Sport.toPageModel`: results table laid out in fixed column stops summing to ≤ 40. [required] (depends 2.2)
- [x] 11.3 Optionally attempt a live keyless source best-effort; always fall back. [optional] (depends 11.1)
- Verification: page 300 shows a scores table from fallback (and live if available).

## 12. Finance module (page 400)
- [x] 12.1 Populate `/data/finance.json` with fallback rates. [required]
- [x] 12.2 Implement the Finance adapter: attempt a keyless live source (e.g. FX/crypto) with fallback. [required] (depends 8.1)
- [x] 12.3 Implement `Finance.toPageModel`: rates table within the grid. [required] (depends 12.2, 2.2)
- Verification: page 400 shows rates; network off shows fallback rates.

## 13. TV Guide module (page 500)
- [x] 13.1 Populate `/data/tvguide.json` with a fallback schedule. [required]
- [x] 13.2 Implement `TVGuide.toPageModel`: now/next schedule within the grid. [required] (depends 2.2)
- [x] 13.3 Optionally attempt a live keyless EPG best-effort; always fall back. [optional] (depends 13.1)
- Verification: page 500 shows a schedule from fallback (and live if available).

## 14. Static hosting and packaging
- [x] 14.1 Confirm the app runs with no build step by opening `index.html` over http(s) (local static server and GitHub Pages). [required] (depends all)
- [x] 14.2 Confirm no API keys/secrets anywhere and only public keyless endpoints are used. [required]
- [x] 14.3 Ensure `.kiro` (specs + steering) is committed and not gitignored. [required]
- Verification: deployed static URL loads and all five pages work with and without network.

## 15. Testing and polish
- [x] 15.1 Add `tests.html` with a tiny assertion runner covering text truncation, the 24×40 render invariant, page-number parsing, fallback selection, and mosaic decoding. [required] (depends 2.2)
- [ ] 15.2 Run the visual checklist: palette, grid, double-height header, mosaics, Fastext colors, clock, cycling. [required] (depends all)
- [ ] 15.3 Verify keyboard and touch navigation both work across devices. [required]
- Verification: `tests.html` reports all green; the visual checklist is signed off.

## Session Summary

**This session**: Reviewed `model.js`, `renderer.js`, `router.js` against requirements; fixed `notFoundPage` fallback flag; verified grid discipline, text truncation, mosaic encoding, page number parsing via Node.js imports. Implementation notes in `IMPLEMENTATION-NOTES.md`.

## 16. Review-driven improvements (2026-11-19)

- [x] 16.1 Router resilience: try/catch around module calls with DATA UNAVAILABLE fallback; search-mode cancel on navigation (fixes keyboard soft-lock).
- [x] 16.2 Guarded remote-data access: `String(...)` coercions in sport/finance/tvguide/weather modules.
- [x] 16.3 Weather mosaic condition symbol via `putMosaic`; live WMO weather-code mapping.
- [x] 16.4 Page-arrival scramble on page-number changes.
- [x] 16.5 Typography/frame pass: larger cell glyphs, 4:3 screen, overflow clipping; Fastext render caching.
- [x] 16.6 Touch search: keypad OK/⌫/Esc buttons + hidden input summons the OS keyboard.
- [x] 16.7 Kiro hooks: `.kiro/hooks/grid-guard.json` (agent hook) + `.kiro/hooks/test-on-save.json` (command hook).
- [x] 16.8 Custom agent `.kiro/agents/teletext-reviewer.json` created, validated, and run over all modules; its genuine findings fixed (news wrap width, weather/finance guards).
