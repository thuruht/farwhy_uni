/* guestbook.js — marquee ticker + comment panel
   Cloudflare KV backend at /api/comments (GET / POST)
   XSS-safe: all user text written via textContent, never innerHTML */
(function () {
  'use strict';

  const API      = '/api/comments';
  const MAX      = 200;
  const COLORS   = { lima:'#b0ee00', pupil:'#d990ff', blew:'#00e2ff', redd:'#ff2b13', white:'#ffffff' };
  const C_KEYS   = Object.keys(COLORS);

  const EMOJIS = [
    '🍺','🍻','🥃','🍹','🍸','🌮','🍕','🎸','🎵','🎶',
    '🎉','🥳','🤘','🙌','👏','❤️','🔥','💀','⚡','🌙',
    '✨','🌟','💫','🎱','🎯','🎲','🃏','♠️','♥️','🐍',
    '🦇','🌵','🌴','🤠','😎','🤩','😈','👾','🫡','🫶',
    '🌈','🔮','🎭','🎪','🎰','🌚','🌝','💯','🫠','🥹',
    '🐊','🐺','🐸','🌊','🪄','🌀','🫧','🎡','🎠','🧿',
  ];

  const COUNTRIES = [
    ['🇺🇸','United States'],['🇨🇦','Canada'],['🇲🇽','Mexico'],
    ['🇬🇧','United Kingdom'],['🇫🇷','France'],['🇩🇪','Germany'],
    ['🇪🇸','Spain'],['🇮🇹','Italy'],['🇯🇵','Japan'],['🇰🇷','South Korea'],
    ['🇨🇳','China'],['🇦🇺','Australia'],['🇳🇿','New Zealand'],
    ['🇧🇷','Brazil'],['🇦🇷','Argentina'],['🇨🇴','Colombia'],
    ['🇨🇱','Chile'],['🇯🇲','Jamaica'],['🇳🇱','Netherlands'],
    ['🇧🇪','Belgium'],['🇸🇪','Sweden'],['🇳🇴','Norway'],
    ['🇩🇰','Denmark'],['🇫🇮','Finland'],['🇵🇱','Poland'],
    ['🇨🇿','Czechia'],['🇬🇷','Greece'],['🇵🇹','Portugal'],
    ['🇮🇪','Ireland'],['🇨🇭','Switzerland'],['🇦🇹','Austria'],
    ['🇺🇦','Ukraine'],['🇷🇺','Russia'],['🇮🇳','India'],
    ['🇳🇬','Nigeria'],['🇬🇭','Ghana'],['🇿🇦','South Africa'],
    ['🇰🇪','Kenya'],['🇪🇬','Egypt'],['🇹🇷','Turkey'],
    ['🇮🇩','Indonesia'],['🇵🇭','Philippines'],['🇹🇭','Thailand'],
    ['🇻🇳','Vietnam'],['🇸🇬','Singapore'],['🇲🇾','Malaysia'],
    ['🇸🇦','Saudi Arabia'],['🇮🇱','Israel'],
  ];

  const SEED = [
    { text:"it's definitely about soccer",   color:'lima',  name:'Deb',      country:'🇺🇸' },
    { text:"i'm telling my mom about this",  color:'pupil', name:'Ray',      country:'🇨🇦' },
    { text:"been coming here since it was the other thing", color:'white', name:'', country:'' },
    { text:"world cup our souls 🙏",         color:'blew',  name:'Tomás',    country:'🇲🇽' },
    { text:"first time in KC. found this by accident. will return.", color:'lima', name:'', country:'🇬🇧' },
    { text:"the marquee is never wrong",      color:'redd',  name:'',         country:'' },
    { text:"what balls?? 🏈 🎱 ⚽",          color:'pupil', name:'confused', country:'🇺🇸' },
    { text:"came for the beer. stayed for the sign.", color:'white', name:'DJ Smalls', country:'🇺🇸' },
    { text:"marquee changed my life and i'm not being dramatic", color:'blew', name:'Xochi', country:'🇲🇽' },
    { text:"WORLD CUP. OUR. BALLS.",          color:'lima',  name:'',         country:'🇦🇺' },
  ];

  // ── state ─────────────────────────────────────────────────────────────────
  let selectedColor = 'lima';
  let panelOpen     = false;
  let $panel, $overlay, $inner;

  // ── ticker ─────────────────────────────────────────────────────────────────
  function makeItem(c) {
    const wrap = document.createElement('span');
    wrap.className = 'tk-item';
    if (c.country) {
      const f = document.createElement('span'); f.className = 'tk-flag';
      f.textContent = c.country; wrap.appendChild(f);
    }
    if (c.name) {
      const n = document.createElement('span'); n.className = 'tk-name';
      n.textContent = c.name + ' ·'; wrap.appendChild(n);
    }
    const t = document.createElement('span'); t.className = 'tk-text';
    t.style.color = COLORS[c.color] || '#fff';
    t.textContent = c.text; wrap.appendChild(t);
    const s = document.createElement('span'); s.className = 'tk-sep';
    s.textContent = '★'; wrap.appendChild(s);
    return wrap;
  }

  function populateTicker(comments) {
    if (!$inner) return;
    const list = (comments && comments.length) ? comments : SEED;
    $inner.innerHTML = '';
    // two identical halves for seamless CSS loop
    [0,1].forEach(() => {
      const frag = document.createDocumentFragment();
      list.forEach(c => frag.appendChild(makeItem(c)));
      $inner.appendChild(frag);
    });
    requestAnimationFrame(() => {
      const w = $inner.scrollWidth / 2;
      $inner.style.animationDuration = Math.max(22, w / 55) + 's';
    });
  }

  function initTicker() {
    $inner = document.getElementById('ticker-inner');
    const wrap = document.getElementById('ticker-wrap');
    if (!$inner || !wrap) return;
    populateTicker(SEED);
    wrap.addEventListener('mouseenter', () => $inner.style.animationPlayState = 'paused');
    wrap.addEventListener('mouseleave', () => $inner.style.animationPlayState = 'running');
  }

  // ── panel DOM ─────────────────────────────────────────────────────────────
  function buildPanel() {
    // overlay
    $overlay = document.createElement('div');
    $overlay.className = 'gb-overlay';
    $overlay.addEventListener('click', closePanel);
    document.body.appendChild($overlay);

    // panel shell (static structure, no user data)
    $panel = document.createElement('div');
    $panel.className = 'gb-panel';
    $panel.setAttribute('role', 'dialog');
    $panel.setAttribute('aria-modal', 'true');
    $panel.setAttribute('aria-label', 'Guestbook');

    const swatches = C_KEYS.map(k =>
      `<button class="gb-swatch${k==='lima'?' active':''}" data-color="${k}" style="--c:${COLORS[k]}" title="${k}" type="button"></button>`
    ).join('');

    const countryOpts = COUNTRIES.map(([f, n]) => {
      const safe = n.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      const safeF = f.replace(/&/g,'&amp;');
      return `<option value="${safeF}">${safeF} ${safe}</option>`;
    }).join('');

    const emojiBtns = EMOJIS.map(e =>
      `<button class="gb-emoji" type="button" aria-label="${e}">${e}</button>`
    ).join('');

    $panel.innerHTML = `
      <div class="gb-handle"></div>
      <div class="gb-header">
        <span class="gb-title">what do you think about the marquee?</span>
        <button class="gb-close" id="gb-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="gb-ta-wrap">
        <textarea class="gb-ta" id="gb-ta" maxlength="${MAX}" placeholder="say your thing…" rows="3" spellcheck="true"></textarea>
        <span class="gb-count" id="gb-count">0 / ${MAX}</span>
      </div>
      <div class="gb-row">
        <div class="gb-swatches" id="gb-swatches">${swatches}</div>
        <button class="gb-emoji-btn" id="gb-emoji-btn" type="button">😀 emoji</button>
      </div>
      <div class="gb-emoji-grid" id="gb-emoji-grid" hidden>${emojiBtns}</div>
      <details class="gb-optional">
        <summary>+ leave your name &amp; whereabouts (optional)</summary>
        <div class="gb-opts">
          <label class="gb-label">name
            <input class="gb-input" id="gb-name" type="text" maxlength="48" autocomplete="nickname" placeholder="anonymous">
          </label>
          <label class="gb-label">email <span class="gb-hint">(kept private, never shown)</span>
            <input class="gb-input" id="gb-email" type="email" maxlength="120" autocomplete="email" placeholder="optional">
          </label>
          <label class="gb-label">country
            <select class="gb-input gb-select" id="gb-country">
              <option value="">🌍 somewhere on earth</option>
              ${countryOpts}
            </select>
          </label>
        </div>
      </details>
      <button class="gb-submit" id="gb-submit" type="button">post it</button>
      <div class="gb-status" id="gb-status" aria-live="polite"></div>
    `;
    document.body.appendChild($panel);

    // events
    document.getElementById('gb-close').addEventListener('click', closePanel);
    document.getElementById('gb-open').addEventListener('click', openPanel);

    const ta = document.getElementById('gb-ta');
    const ct = document.getElementById('gb-count');
    ta.addEventListener('input', () => {
      const n = ta.value.length;
      ct.textContent = `${n} / ${MAX}`;
      ct.style.color = n > MAX * .85 ? COLORS.redd : '';
    });

    document.getElementById('gb-swatches').addEventListener('click', e => {
      const btn = e.target.closest('[data-color]');
      if (!btn) return;
      selectedColor = btn.dataset.color;
      document.querySelectorAll('.gb-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    });

    document.getElementById('gb-emoji-btn').addEventListener('click', () => {
      const g = document.getElementById('gb-emoji-grid');
      g.hidden = !g.hidden;
    });

    document.getElementById('gb-emoji-grid').addEventListener('click', e => {
      const btn = e.target.closest('.gb-emoji');
      if (!btn) return;
      const emoji = btn.textContent;
      const ta = document.getElementById('gb-ta');
      if (ta.value.length + emoji.length > MAX) return;
      const s = ta.selectionStart, end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + emoji + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + emoji.length;
      ta.focus();
      document.getElementById('gb-count').textContent = `${ta.value.length} / ${MAX}`;
    });

    document.getElementById('gb-submit').addEventListener('click', handleSubmit);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panelOpen) { closePanel(); e.stopPropagation(); }
    });
  }

  function openPanel() {
    if (!$panel) return;
    $panel.classList.add('open'); $overlay.classList.add('open');
    panelOpen = true;
    window.__gbOpen = true;
    requestAnimationFrame(() => document.getElementById('gb-ta').focus());
  }

  function closePanel() {
    if (!$panel) return;
    $panel.classList.remove('open'); $overlay.classList.remove('open');
    panelOpen = false;
    window.__gbOpen = false;
    const g = document.getElementById('gb-emoji-grid');
    if (g) g.hidden = true;
  }

  // ── submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const ta     = document.getElementById('gb-ta');
    const submit = document.getElementById('gb-submit');
    const text   = ta.value.trim();
    if (!text) { setStatus('type something first', 'err'); return; }

    const name    = document.getElementById('gb-name').value.trim().slice(0, 48);
    const email   = document.getElementById('gb-email').value.trim().slice(0, 120);
    const country = document.getElementById('gb-country').value;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('double-check that email', 'err'); return;
    }

    submit.disabled = true; submit.textContent = 'posting…';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, color: selectedColor, name, email, country }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.status));
      const data = await res.json();
      setStatus('✓ posted — thanks!', 'ok');
      ta.value = ''; document.getElementById('gb-count').textContent = `0 / ${MAX}`;
      if (data.comments) populateTicker(data.comments);
      setTimeout(closePanel, 1700);
    } catch {
      setStatus("couldn't post — try again", 'err');
      submit.disabled = false; submit.textContent = 'post it';
    }
  }

  function setStatus(msg, type) {
    const el = document.getElementById('gb-status');
    el.textContent = msg; el.className = 'gb-status ' + (type || '');
    if (type === 'ok') setTimeout(() => { el.textContent = ''; }, 2400);
    if (type !== 'err') {
      const s = document.getElementById('gb-submit');
      s.disabled = false; s.textContent = 'post it';
    }
  }

  // ── API fetch ─────────────────────────────────────────────────────────────
  async function fetchComments() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const { comments } = await res.json();
      if (Array.isArray(comments) && comments.length) populateTicker(comments);
    } catch { /* keep seeds */ }
  }

  // ── init ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initTicker();
    buildPanel();
    fetchComments();
  });
})();
