# Multiple Flyer Images Per Event — Exploration

## Context

This spans two repos sharing one D1 database (`farewell-db`, id `76dc7b30-005a-4268-afa0-10b2fe242253`):

- **`flyer_eater`** — the Slack ingest bot. Staff post a flyer image (sometimes several in one
  message, sometimes the same show re-posted in a separate message days/weeks later, often
  captioned "update"/"v2"/"repost") and it extracts structured data and writes one row to the
  shared `events` table.
- **`farwhy_uni`** — the public site. Reads the same `events` table through `src/handlers/events.ts`
  (`listEvents`, `getArchives`, `getSlideshow`, `createEvent`, `updateEvent`), normalized by
  `normalizeEventForDisplay`.

Today the data model is **one image per event**, end to end:

- `events.flyer_image_url` is a single column.
- The ingest bot inserts one `events` row per image file it processes, with no matching against
  existing events — this is why the site currently has duplicate rows for the same real-world
  show (e.g. three near-identical rows for one Howdy show on Jul 18, from one Slack message with
  three image attachments).
- `events.html`'s inline script already works around this by deduping client-side on
  `title+date+venue`, preferring whichever duplicate has an `imageUrl` — a band-aid, not a fix.
- The homepage slideshow (`windex.html`'s `#slide-image`, driven by `public/jss/script.js`) builds
  a `displayedFlyers` array with exactly one image per event and cycles through it via prev/next.
- The new `public/shows.html` (see `2026-07-03-shows-experimental-page-design.md`) is also
  spec'd as one flyer image per card.

## Goal

Two related changes, motivated by the same real Slack behavior (multiple images per post, and
the same show re-posted later as an "update"):

1. **Ingest-side dedup**: a real-world show should produce **one** `events` row, not one per
   image/post.
2. **Keep every image instead of picking one canonical one**: since a show is often posted with
   multiple flyer variants (or gets a new flyer for a re-announcement), store all of them against
   the event and let the site **randomly surface one per view** — in the slideshow and in listing
   cards — rather than only ever showing the first/last one uploaded.

These fit together naturally: once dedup means "append this image to the existing event" instead
of "insert a new row" or "overwrite the one image column," multi-image storage falls out for free.

## Data model change

Add a new table (`flyer_eater`'s migrations, since it owns ingestion; both repos read/write the
same D1 instance):

```sql
CREATE TABLE event_images (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  slack_ts TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_event_images_event_id ON event_images(event_id);
```

`events.flyer_image_url` is **kept** (not dropped): it stays as a "first/primary image" fallback
for legacy rows and any code not yet updated to read `event_images`. On insert, the bot writes
both — the column *and* a row in `event_images`.

**Migration for existing data**: a one-time backfill inserts one `event_images` row per existing
event that has a non-null `flyer_image_url`, so every event has at least one row in the new table
immediately, with no dual-code-path branching needed on the read side.

**Cap: 4 images per event.** Whenever a new image would push an event past 4, the oldest
`event_images` row for that event (by `created_at`) is deleted first. This keeps the append logic
simple — no ranking of "which flyer variant is most representative," just a FIFO window over the
most recent 4 uploads.

## Ingest-bot changes (`flyer_eater`)

1. **Matching key: `(venue, date)`.** Add `getEventByVenueAndDate(env, venue, date)` to `db.ts`
   (same shape as the existing `getEventBySlackTs`). This assumes one real show per venue per
   date, which matches every duplicate cluster found in production data; a genuine same-day
   double-booking is a known, accepted limitation (see Risks).

2. **Same Slack message, multiple images** (grouped by shared `slack_ts` in the existing
   `for (const file of imageFiles)` loop): process every image's OCR/VLM extraction as today, but
   instead of one `insertEvent` per file, treat them as one event — first image is the text-data
   base; later images in the same message fill in any field still a placeholder (empty/TBA) using
   the existing `buildEvent` merge precedence. All images become rows in `event_images` under the
   one resulting event.

3. **Separate Slack post matching an existing active event's `(venue, date)`** → **update, not
   insert**: merge newly-extracted fields onto the existing row using the same precedence rules
   already in `buildEvent` (new non-placeholder values win), append the new image to
   `event_images` (evicting the oldest if this pushes the event over the 4-image cap), and update
   `flyer_image_url` to the newest image. Slack reply says "Updated existing listing for *venue*
   on *date* (added image N)" instead of "Added new event." This applies whether or not the
   caption says "update"/"v2" — those words are corroborating evidence for something
   `(venue, date)` matching already caught, not a separate trigger condition.

4. **Existing duplicate rows already in D1** (Jul 18 ×3, Jul 20 ×2, Jul 24 Farewell ×2, Jul 26
   Howdy set) are a one-time manual/script cleanup — merge each cluster's images into the oldest
   row's `event_images`, then delete the redundant rows — done once, separately from this
   forward-looking logic, before or right after this ships.

## API changes (`farwhy_uni`, `src/handlers/events.ts`)

- `normalizeEventForDisplay` gains an `images: string[]` field: the event's `event_images` joined
  and ordered by `created_at`, falling back to `[flyer_image_url]` for any event with no
  `event_images` rows (shouldn't happen post-backfill, but cheap to keep as a safety net).
  `imageUrl` (singular) stays as-is for backward compatibility with any code not yet updated —
  set to `images[0]`.
- `listEvents`, `getArchives`, `getSlideshow` all need their `SELECT` extended with a join (or a
  second query per result set) to populate `images`.
- `createEvent`/`updateEvent` (admin-panel-driven, `admin.html`) are out of scope for this pass —
  they're not the source of the duplicate-row problem. Flagged as a known follow-up if staff want
  to manage multiple images through the admin UI later.

## Frontend changes

- **`public/jss/script.js` (homepage slideshow)**: `displayedFlyers` currently holds one
  `imageUrl` per event. Change to read `event.images` and pick **one random index per event, per
  page load** (not re-randomized on every prev/next click — that would make the same slide flicker
  between images as you navigate back to it). Falls back to `imageUrl` for any event missing
  `images`.
- **`public/events.html` (live "Upcoming Shows" iframe, inline script)**: currently
  client-side-dedupes by `title+date+venue` preferring an entry with `imageUrl` — this dedup step
  becomes unnecessary once ingest-side dedup is in place, but should stay temporarily as
  defense-in-depth while legacy duplicate rows are being cleaned up. Card image picks one random
  entry from `images` the same way.
- **`public/shows.html` (new, WIP)**: same random-pick-from-`images` treatment for its grid cards.
  The flyer modal also shows a single randomly-picked image (independently re-rolled from the
  card's pick when the modal opens) rather than a thumbnail strip of every version — keeps the
  modal simple and consistent with the card/slideshow treatment elsewhere.
- **Randomization mechanics**: pick client-side, once per render/page-load, not server-side and
  not re-picked on every interaction. This is simplest, needs no new caching strategy (these
  endpoints already send `no-cache`), and matches "randomly surfaced" without introducing
  server-side session/rotation state.

## Open questions

Resolved: the modal shows a single random image (not a thumbnail strip), and images per event are
capped at 4 with oldest-first eviction — both folded into the sections above.

Still open:

1. Admin UI (`admin.html`) support for viewing/removing individual images from an event — not
   scoped here.

## Explicitly out of scope (this pass)

- Perceptual/visual image similarity matching — `(venue, date)` is the matching key; no image
  hashing is introduced.
- Any change to `createEvent`/`updateEvent` (admin-panel manual flow).
- Retroactive cleanup script for the currently-known duplicate rows — planned as a separate,
  one-time manual task, not part of this design's automated logic.
- Image moderation, ordering/reordering UI, or captions per image.
