# Experimental Shows Page — Design

## Context

The site currently has two "show listings" code paths:

- `public/windex.html` opens `#events-page-modal`, an iframe overlay pointing at `public/events.html`. That page's cards are rendered by an **inline `<script>` in `events.html` itself** (not by `public/jss/events-page.js`). Cards currently have no click handler on the flyer image at all — clicking it does nothing. Only a Tickets/Website link appears on cards that have one.
- `public/jss/events-page.js` and `public/css/events-page.css` are **fully orphaned** — no HTML file references either. They contain a more built-out modal (`openEventModal`) with a large image + details layout, but its card markup/data assumptions don't match what `events.html` renders live.
- `public/jss/events-modal.js` builds its own list+details modal (`openModal`), but that function is also **never invoked** — `openEventsPopup()` (defined inline in `windex.html`) always wins and is what actually runs.

None of the existing code is being deleted or rewired as part of this work. This is a new, standalone, experimental page for review — not yet linked from navigation.

## Goal

Build `public/shows.html`: a self-contained page that lists small flyer thumbnails for all shows, supports venue switching, upcoming/archived toggling, and text search, and opens a large flyer + details modal when a flyer is clicked.

## Data

- Fetch `GET /api/events` once on load (returns all venues/dates/statuses except cancelled, already normalized server-side by `normalizeEventForDisplay` in `src/handlers/events.ts`).
- Dedupe by `title+date+venue` key, preferring the entry with an `imageUrl`, same as the existing dedup logic in `events.html`'s inline script.
- All filtering (venue, upcoming vs. archived, search) is done client-side against the single fetched array — no refetching on filter change.
- Search matches (case-insensitive substring) against `title` and `description`.
- Sort: upcoming events ascending by date; archived events descending (most recent first).
- Known field-naming quirk to defend against: the API returns `suggestedPrice`, not `price`, for the price field (`src/handlers/events.ts` `normalizeEventForDisplay`). Read `event.price || event.suggestedPrice` defensively, matching what `events.html`'s inline script already does.

## Layout

1. **Header bar** — page title ("SHOWS") + a "HOME" link back to `windex.html`. Styled with the site's existing font/color variables (`ccssss.css`) for visual consistency, kept minimal.
2. **Controls bar** — one unified segmented-control strip (not separate floating colored buttons like the current `events.html` controls, which read as unintentional):
   - Venue segment: Farewell / Howdy / Both
   - Archive segment: Upcoming / All
   - Search input inline in the same bar
   One shared border/background, internal dividers between segments.
3. **Grid of minimal cards** — one per show: small flyer image (fixed-height container, `object-fit: contain`), title, date, venue badge. No description, price, or ticket button on the card itself. Past events get a dimmed/"past" treatment consistent with existing card styling elsewhere in the codebase.
4. **Flyer modal** (opened by clicking any card) — opaque dark backdrop (not the low-opacity look being replaced), large flyer image on top, details underneath:
   - Title
   - Venue badge
   - Date/time
   - Price (if present)
   - Age restriction (if present)
   - Description (if present)
   - Ticket or website button (ticket link takes priority over generic URL, matching existing logic elsewhere)
   Closes via × button, clicking the backdrop, or Escape. Locks page scroll while open.

## Error handling

- Fetch failure: inline error message in the grid area (mirrors the existing pattern in `events.html`).
- Broken flyer image: falls back to `./img/placeholder-event.jpg` via `onerror`, same as existing cards.
- No results for current filters: an empty-state message in the grid.

## Explicitly out of scope

- Wiring `shows.html` into any navigation, iframe, or `openEventsPopup()` flow.
- Any changes to `events.html`, `windex.html`, or the existing `#events-page-modal` iframe overlay.
- Deleting or modifying the orphaned `events-page.js` / `events-page.css`.
