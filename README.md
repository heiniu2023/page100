# Page 100 — Teletext, Reborn

A faithful revival of classic Ceefax-style teletext as a static web app,
built with Kiro for the Kiroween 2026 hackathon (Resurrection category).

Numbered pages, mosaic block graphics, Fastext shortcuts — fed by live,
keyless public data with bundled fallbacks so it always works.

- 100 News (Hacker News) · 200 Weather (Open-Meteo, searchable city)
- 300 Sport · 400 Finance (CoinGecko + FX) · 500 TV Guide

Status: **implemented 2026-11-19** (spec + vanilla-JS app, no build step).
Pure-module tests pass under Node; `tests.html` runs the same checks in
the browser. Visual checklist (15.2–15.3 in `.kiro/specs/.../tasks.md`)
still needs a human look before submission.

## Run it

```sh
python3 -m http.server 8000   # from this directory
# open http://localhost:8000/
```

No API keys, no backend, no tracking. Works offline from bundled
`/data` JSON (pages show an `OFFLINE DATA` marker when fallback is used).

## Controls

- Type a 3-digit page number (100–899); unregistered numbers show a
  not-found page with a Fastext link back to 100.
- `R` / `G` / `Y` / `B` follow the Fastext bar; click/tap works too.
- `H` holds sub-page cycling; arrow keys step sub-pages by hand.
- On page 200, `Enter` searches a city (type name, `Enter` to go,
  `Esc` to cancel).

## How Kiro was used

Specs (requirements/design/tasks), steering (`teletext-style.md`) and the
repo scaffold were produced in Kiro sessions; the implementation follows
that spec. Before submission, run at least one Kiro CLI implementation
session (e.g. the page-index hook) so the `.kiro` evidence covers build
as well as spec — see `../PLAN.md`.
