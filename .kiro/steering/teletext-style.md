---
inclusion: always
---

# Teletext Style — Page 100

Page 100 revives classic Ceefax teletext. The look is a judging criterion (Design) and the heart of the "Resurrection" story, so these rules keep every contribution consistent with a real teletext display. Follow them for all app code and content: HTML, CSS, JS, and the data the modules lay out.

## Grid discipline (the most important rule)

- The screen is exactly 40 columns × 24 rows. Never more, never fewer.
- Layout: rows 0–1 are the double-height header, rows 2–22 are the body, row 23 is the Fastext bar.
- Every line must fit within 40 columns. Truncate text before it can overflow; never let content spill past column 40.
- Provide exactly 24 rows to the renderer. If a module has fewer rows of content, pad the rest with empty black cells — never with blank modern whitespace.
- Why: real teletext is a fixed bitmap; overflow breaks the illusion and the layout.

## Palette

- Use only the eight teletext colors, defined once and reused everywhere:
  - black `#000000`, red `#ff0000`, green `#00ff00`, yellow `#ffff00`, blue `#0000ff`, magenta `#ff00ff`, cyan `#00ffff`, white `#ffffff`.
- Default background is black; default text is white unless a page sets otherwise.
- No gradients, shadows, rounded corners, or colors outside this set.

## Typography

- Use a monospaced teletext-style font. Character cells are taller than wide (~1:1.2 height:width) to match teletext proportions.
- The page header is double-height (page label on the left, clock on the right, rendered across rows 0–1).
- No proportional fonts and no generic sans-serif fallbacks inside the screen.

## Block mosaics

- Graphics use 2×3 block-mosaic characters — six sub-blocks per cell, filled per the mosaic bit pattern.
- Use mosaics for boxes, dividers, and simple icons, not for body text.
- Never substitute emoji or icon fonts for mosaics.

## No modern UI chrome

- No scrollbars, menus, dropdowns, modals, native buttons, or form inputs inside the screen.
- All interaction is teletext-native: type a page number, press/click a colored Fastext link, hold to pause cycling, type a city on the Weather page.
- On-screen prompts and indicators (page-number entry, sub-page indicator, fallback marker) are drawn as teletext cells, not as DOM controls.

## Content fitting (for module/adapter authors)

- Truncate headlines and data values to fit 40 columns before rendering; reserve columns for any prefix/suffix when laying out a row.
- Lay out tabular content (Sport, Finance, TV Guide) in fixed column stops that sum to ≤ 40; one column must never push another off the grid.
- Every module has a fallback data file so content always exists.

## Before finishing a module, check

- No line exceeds 40 columns.
- No more than 24 rows are produced.
- Only the eight colors are used.
- The header is double-height and row 23 is the Fastext bar.
- No modern chrome was introduced.
