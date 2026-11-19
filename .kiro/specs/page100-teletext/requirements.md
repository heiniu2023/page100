# Page 100 — Requirements

Page 100 is a static web app that revives classic Ceefax-style teletext in the browser, built for the Kiroween 2026 hackathon (Resurrection category). It renders a fixed 40×24 teletext screen, lets the user navigate numbered pages (100–899) with Fastext colored shortcuts, and feeds five content modules from live, keyless, CORS-friendly public APIs — with bundled fallback data so every page always renders, even with no network.

## Scope

In scope: the teletext renderer, page navigation, Fastext, sub-page cycling, the running clock, and the five modules (100 News, 200 Weather, 300 Sport, 400 Finance, 500 TV Guide) with bundled fallback data.

Out of scope: a backend server, API keys/secrets, a build step, and any runtime LLM call.

## Teletext screen and rendering

- The system shall render the teletext screen as a fixed grid of exactly 40 columns by 24 rows.
- The system shall lay out the grid as a double-height header on rows 0–1, a body on rows 2–22, and a Fastext bar on row 23.
- When a page is loaded, the system shall draw the page model onto the DOM as styled text cells and 2×3 block-mosaic graphics, one cell per grid position.
- The system shall render the default background as black.
- The system shall render text and mosaics in only the eight teletext colors: black, red, green, yellow, blue, magenta, cyan, and white.
- When a cell is marked double-height, the system shall render its character across two grid rows.
- When a cell contains a block-mosaic character, the system shall render it as a 2-by-3 grid of filled sub-blocks matching the mosaic's bit pattern.
- While the browser window is resized, the system shall keep the grid at 40 columns by 24 rows and scale only the cell size.
- The system shall not display modern UI chrome — scrollbars, menus, dropdowns, modals, or native buttons — within the teletext screen.

## Page navigation

- When the app starts with no page selected, the system shall load page 100.
- When the user presses numeric keys, the system shall accumulate the digits as the target page number and display the entry in the header.
- When the user has entered three digits, the system shall navigate to the page with that number.
- When the user enters a number outside the range 100–899, the system shall display a teletext-style "page not found" screen and not navigate.
- When the user enters an in-range number that has no registered page, the system shall display a teletext-style "page not found" screen.
- When a page is requested, the system shall resolve the page number through the page registry to find its page generator.

## Fastext shortcuts

- When a page defines Fastext links, the system shall render four colored link labels (red, green, yellow, blue) in the Fastext bar on row 23.
- When the user activates a colored link by keyboard or by clicking its on-screen label, the system shall navigate to that link's target page number.
- When a colored link has no target page, the system shall render that label inactive and not navigate when it is activated.
- The system shall map the keyboard keys R, G, Y, and B to the red, green, yellow, and blue links respectively.
- Where page 100 is displayed, the system shall provide Fastext links to the Weather, Sport, Finance, and TV Guide modules so that page 100 doubles as the service index.

## Content modules

- The system shall provide a News module on page 100 that displays headlines sourced from the Hacker News API.
- The system shall provide a Weather module on page 200 that displays a forecast sourced from the Open-Meteo API for a searchable city.
- When the user is on the Weather page and enters search mode, the system shall display an on-screen prompt and accept alphanumeric input for a city name.
- When the user submits a city name, the system shall resolve it to coordinates using the Open-Meteo geocoding API and display the weather for the first matching location.
- If the geocoding API returns no match, the system shall display a teletext-style "city not found" message and keep the last displayed weather.
- The system shall provide a Sport module on page 300.
- The system shall provide a Finance module on page 400.
- The system shall provide a TV Guide module on page 500.
- While any module is rendering, the system shall fit every line within the 40-column width, truncating content that would overflow the grid.

## Fallback data

- The system shall bundle fallback JSON data for every module so that each page can render with no network access.
- When a live data fetch fails, returns an error, or is blocked by CORS, the system shall render the page from bundled fallback data.
- When a live data fetch succeeds, the system shall render the page from the live data.
- The system shall attempt a live data fetch for the News and Weather modules before falling back.
- For the Sport, Finance, and TV Guide modules, the system shall render from bundled fallback data and may attempt a live source on a best-effort basis.
- Where fallback data is in use, the system shall show a subtle on-screen indicator so the source is not mistaken for live data.

## Sub-page cycling

- When a page contains multiple sub-pages, the system shall display the current sub-page indicator (for example, 100/2) in the header.
- While a multi-sub-page page is displayed and hold is not active, the system shall advance to the next sub-page automatically at a fixed interval.
- When the user activates hold, the system shall pause automatic sub-page cycling until hold is deactivated.
- When the user requests the next or previous sub-page manually, the system shall change the displayed sub-page accordingly.

## Running clock

- While the app is running, the system shall display a running clock in the header.
- The system shall update the clock at least once per second.

## Static hosting and technology

- The system shall be deployable as static files served by any static host, with no server-side code.
- The system shall require no API keys or secrets at runtime.
- The system shall require no build step; the source files shall run directly in the browser.
- The system shall be implemented in vanilla JavaScript with no frameworks and no bundler.
- The system shall fetch all live data client-side from public, keyless, CORS-permitting endpoints.
- The system shall load bundled fallback data from local JSON files in a `/data` directory.

## Interaction methods

- The system shall support keyboard as the primary input method for page numbers, Fastext, hold, and text entry.
- The system shall also allow Fastext links to be activated by mouse click and touch for devices without a suitable keyboard.
- The system shall keep all interaction inside the teletext screen using on-screen prompts and indicators rather than native form controls.

## Resilience

- When a live fetch is slow, the system shall render the page from fallback data promptly and replace it with live data when the fetch completes, so the screen is never blank.
- When the browser is offline, the system shall render every page from bundled fallback data.
