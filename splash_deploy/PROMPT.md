# Splash Page — Implementation Instructions

This package is a ready-to-drop splash page for **farewellcafe.com**.  
Execute the steps below **in order** before touching any other files.

---

## 1 · Rename the existing index

```
index.html  →  windex.html
```

Do this first so the splash can safely land at the root as the new `index.html`.

---

## 2 · Rewire all internal references to the old index

Search the entire codebase for every reference to `index.html` and update it to `windex.html`. Locations to check:

- `<a href="...">` links in HTML templates / partials
- `window.location` / `location.href` / `location.replace` in JS
- `fetch()` / `import()` calls
- Framework router config (e.g. `routes.js`, `next.config.js`, `vite.config.js`)
- Server redirect rules (`.htaccess`, `_redirects`, `vercel.json`, `netlify.toml`)
- Any CI / deploy scripts that reference the filename directly

Do **not** rename `windex.html` references introduced by this step — only rename pre-existing `index.html` ones.

---

## 3 · Copy this package into the site root

The package ships flat — drop everything beside `windex.html`:

```
/                        ← site root
├── index.html           ← splash (this file)
├── splash.css
├── enter.js
├── windex.html          ← old index, renamed above
├── img/
│   └── wc_classy.png
└── fnt/
    ├── db.woff2
    ├── ds.woff2
    ├── hnb2.woff2
    ├── kb.woff2
    └── mrt.woff2
```

If the site already has an `img/` or `fnt/` folder, merge — do not overwrite unrelated files.

---

## 4 · Verify the venue handoff

`enter.js` stores the user's venue choice two ways and then navigates:

```js
localStorage.setItem('fwhy-venue', venue);   // persists across sessions
location.href = `windex.html?venue=${venue}`; // query param for same-session read
```

In `windex.html`, read it at boot with:

```js
const v = new URLSearchParams(location.search).get('venue')
          || localStorage.getItem('fwhy-venue');
document.body.dataset.state = (v === 'howdy') ? 'howdy' : 'farewell';
```

The `INDEX` constant in `enter.js` is pre-set to `'windex.html'`.  
If your actual destination differs (e.g. `app/index.html`), update that constant before deploying.

---

## 5 · Smoke-test

1. Open `/index.html` in a browser — the splash should appear with the glowing marquee backdrop, floating orbs, and two glass doors (HOWDY / FAREWELL).
2. Click **FAREWELL** (or press **F**) — page should glitch out and land on `windex.html?venue=farewell`.
3. Click **HOWDY** (or press **H**) — same, with `venue=howdy`.
4. Confirm `localStorage.getItem('fwhy-venue')` returns the last-chosen venue.
