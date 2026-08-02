(function () {
  'use strict';
  const API = '/api/comments';
  const MAX = 200;
  const COLORS = {
    lima: '#b0ee00',
    pupil: '#d990ff',
    blew: '#00e2ff',
    redd: '#ff2b13',
    white: '#ffffff',
  };
  const C_KEYS = Object.keys(COLORS);
  const EMOJIS = [
    '🍺',
    '🍻',
    '🥃',
    '🍹',
    '🍸',
    '🌮',
    '🍕',
    '🎸',
    '🎵',
    '🎶',
    '🎉',
    '🥳',
    '🤘',
    '🙌',
    '👏',
    '❤️',
    '🔥',
    '💀',
    '⚡',
    '🌙',
    '✨',
    '🌟',
    '💫',
    '🎱',
    '🎯',
    '🎲',
    '🃏',
    '♠️',
    '♥️',
    '🐍',
    '🦇',
    '🌵',
    '🌴',
    '🤠',
    '😎',
    '🤩',
    '😈',
    '👾',
    '🫡',
    '🫶',
    '🌈',
    '🔮',
    '🎭',
    '🎪',
    '🎰',
    '🌚',
    '🌝',
    '💯',
    '🫠',
    '🥹',
    '🐊',
    '🐺',
    '🐸',
    '🌊',
    '🪄',
    '🌀',
    '🫧',
    '🎡',
    '🎠',
    '🧿',
  ];
  const COUNTRIES = [
    ['🇺🇸', 'United States'],
    ['🇨🇦', 'Canada'],
    ['🇲🇽', 'Mexico'],
    ['🇬🇹', 'Guatemala'],
    ['🇧🇿', 'Belize'],
    ['🇭🇳', 'Honduras'],
    ['🇸🇻', 'El Salvador'],
    ['🇳🇮', 'Nicaragua'],
    ['🇨🇷', 'Costa Rica'],
    ['🇵🇦', 'Panama'],
    ['🇨🇺', 'Cuba'],
    ['🇯🇲', 'Jamaica'],
    ['🇭🇹', 'Haiti'],
    ['🇩🇴', 'Dominican Republic'],
    ['🇵🇷', 'Puerto Rico'],
    ['🇹🇹', 'Trinidad & Tobago'],
    ['🇧🇧', 'Barbados'],
    ['🇧🇸', 'Bahamas'],
    ['🇬🇾', 'Guyana'],
    ['🇸🇷', 'Suriname'],
    ['🇱🇨', 'St. Lucia'],
    ['🇻🇨', 'St. Vincent'],
    ['🇬🇩', 'Grenada'],
    ['🇦🇬', 'Antigua & Barbuda'],
    ['🇩🇲', 'Dominica'],
    ['🇰🇳', 'St. Kitts & Nevis'],
    ['🇧🇷', 'Brazil'],
    ['🇦🇷', 'Argentina'],
    ['🇨🇴', 'Colombia'],
    ['🇨🇱', 'Chile'],
    ['🇵🇪', 'Peru'],
    ['🇻🇪', 'Venezuela'],
    ['🇪🇨', 'Ecuador'],
    ['🇧🇴', 'Bolivia'],
    ['🇵🇾', 'Paraguay'],
    ['🇺🇾', 'Uruguay'],
    ['🇬🇧', 'United Kingdom'],
    ['🇫🇷', 'France'],
    ['🇩🇪', 'Germany'],
    ['🇪🇸', 'Spain'],
    ['🇮🇹', 'Italy'],
    ['🇳🇱', 'Netherlands'],
    ['🇧🇪', 'Belgium'],
    ['🇨🇭', 'Switzerland'],
    ['🇦🇹', 'Austria'],
    ['🇵🇹', 'Portugal'],
    ['🇮🇪', 'Ireland'],
    ['🇱🇺', 'Luxembourg'],
    ['🇲🇨', 'Monaco'],
    ['🇦🇩', 'Andorra'],
    ['🇱🇮', 'Liechtenstein'],
    ['🇸🇲', 'San Marino'],
    ['🇻🇦', 'Vatican City'],
    ['🇸🇪', 'Sweden'],
    ['🇳🇴', 'Norway'],
    ['🇩🇰', 'Denmark'],
    ['🇫🇮', 'Finland'],
    ['🇮🇸', 'Iceland'],
    ['🇪🇪', 'Estonia'],
    ['🇱🇻', 'Latvia'],
    ['🇱🇹', 'Lithuania'],
    ['🇵🇱', 'Poland'],
    ['🇨🇿', 'Czechia'],
    ['🇸🇰', 'Slovakia'],
    ['🇭🇺', 'Hungary'],
    ['🇷🇴', 'Romania'],
    ['🇧🇬', 'Bulgaria'],
    ['🇺🇦', 'Ukraine'],
    ['🇷🇺', 'Russia'],
    ['🇧🇾', 'Belarus'],
    ['🇲🇩', 'Moldova'],
    ['🇬🇷', 'Greece'],
    ['🇭🇷', 'Croatia'],
    ['🇸🇮', 'Slovenia'],
    ['🇷🇸', 'Serbia'],
    ['🇧🇦', 'Bosnia & Herzegovina'],
    ['🇲🇪', 'Montenegro'],
    ['🇲🇰', 'North Macedonia'],
    ['🇦🇱', 'Albania'],
    ['🇽🇰', 'Kosovo'],
    ['🇨🇾', 'Cyprus'],
    ['🇲🇹', 'Malta'],
    ['🇹🇷', 'Turkey'],
    ['🇬🇪', 'Georgia'],
    ['🇦🇲', 'Armenia'],
    ['🇦🇿', 'Azerbaijan'],
    ['🇲🇦', 'Morocco'],
    ['🇩🇿', 'Algeria'],
    ['🇹🇳', 'Tunisia'],
    ['🇱🇾', 'Libya'],
    ['🇪🇬', 'Egypt'],
    ['🇸🇩', 'Sudan'],
    ['🇸🇸', 'South Sudan'],
    ['🇳🇬', 'Nigeria'],
    ['🇬🇭', 'Ghana'],
    ['🇸🇳', 'Senegal'],
    ['🇨🇮', "Côte d'Ivoire"],
    ['🇲🇱', 'Mali'],
    ['🇧🇫', 'Burkina Faso'],
    ['🇬🇳', 'Guinea'],
    ['🇸🇱', 'Sierra Leone'],
    ['🇱🇷', 'Liberia'],
    ['🇹🇬', 'Togo'],
    ['🇧🇯', 'Benin'],
    ['🇳🇪', 'Niger'],
    ['🇲🇷', 'Mauritania'],
    ['🇨🇻', 'Cape Verde'],
    ['🇬🇲', 'Gambia'],
    ['🇬🇼', 'Guinea-Bissau'],
    ['🇨🇲', 'Cameroon'],
    ['🇨🇩', 'DR Congo'],
    ['🇨🇬', 'Congo'],
    ['🇨🇫', 'Central African Republic'],
    ['🇬🇦', 'Gabon'],
    ['🇹🇩', 'Chad'],
    ['🇬🇶', 'Equatorial Guinea'],
    ['🇸🇹', 'São Tomé & Príncipe'],
    ['🇪🇹', 'Ethiopia'],
    ['🇰🇪', 'Kenya'],
    ['🇹🇿', 'Tanzania'],
    ['🇺🇬', 'Uganda'],
    ['🇷🇼', 'Rwanda'],
    ['🇧🇮', 'Burundi'],
    ['🇸🇴', 'Somalia'],
    ['🇩🇯', 'Djibouti'],
    ['🇪🇷', 'Eritrea'],
    ['🇲🇿', 'Mozambique'],
    ['🇲🇬', 'Madagascar'],
    ['🇲🇺', 'Mauritius'],
    ['🇸🇨', 'Seychelles'],
    ['🇰🇲', 'Comoros'],
    ['🇿🇦', 'South Africa'],
    ['🇿🇲', 'Zambia'],
    ['🇿🇼', 'Zimbabwe'],
    ['🇧🇼', 'Botswana'],
    ['🇳🇦', 'Namibia'],
    ['🇦🇴', 'Angola'],
    ['🇲🇼', 'Malawi'],
    ['🇱🇸', 'Lesotho'],
    ['🇸🇿', 'Eswatini'],
    ['🇸🇾', 'Syria'],
    ['🇱🇧', 'Lebanon'],
    ['🇯🇴', 'Jordan'],
    ['🇮🇶', 'Iraq'],
    ['🇮🇷', 'Iran'],
    ['🇰🇼', 'Kuwait'],
    ['🇸🇦', 'Saudi Arabia'],
    ['🇦🇪', 'United Arab Emirates'],
    ['🇶🇦', 'Qatar'],
    ['🇧🇭', 'Bahrain'],
    ['🇴🇲', 'Oman'],
    ['🇾🇪', 'Yemen'],
    ['🇵🇸', 'Palestine'],
    ['🇮🇳', 'India'],
    ['🇵🇰', 'Pakistan'],
    ['🇧🇩', 'Bangladesh'],
    ['🇱🇰', 'Sri Lanka'],
    ['🇳🇵', 'Nepal'],
    ['🇧🇹', 'Bhutan'],
    ['🇲🇻', 'Maldives'],
    ['🇦🇫', 'Afghanistan'],
    ['🇰🇿', 'Kazakhstan'],
    ['🇺🇿', 'Uzbekistan'],
    ['🇹🇲', 'Turkmenistan'],
    ['🇰🇬', 'Kyrgyzstan'],
    ['🇹🇯', 'Tajikistan'],
    ['🇨🇳', 'China'],
    ['🇯🇵', 'Japan'],
    ['🇰🇷', 'South Korea'],
    ['🇰🇵', 'North Korea'],
    ['🇹🇼', 'Taiwan'],
    ['🇲🇳', 'Mongolia'],
    ['🇭🇰', 'Hong Kong'],
    ['🇻🇳', 'Vietnam'],
    ['🇹🇭', 'Thailand'],
    ['🇲🇾', 'Malaysia'],
    ['🇸🇬', 'Singapore'],
    ['🇮🇩', 'Indonesia'],
    ['🇵🇭', 'Philippines'],
    ['🇲🇲', 'Myanmar'],
    ['🇰🇭', 'Cambodia'],
    ['🇱🇦', 'Laos'],
    ['🇧🇳', 'Brunei'],
    ['🇹🇱', 'Timor-Leste'],
    ['🇦🇺', 'Australia'],
    ['🇳🇿', 'New Zealand'],
    ['🇵🇬', 'Papua New Guinea'],
    ['🇫🇯', 'Fiji'],
    ['🇸🇧', 'Solomon Islands'],
    ['🇻🇺', 'Vanuatu'],
    ['🇼🇸', 'Samoa'],
    ['🇹🇴', 'Tonga'],
    ['🇰🇮', 'Kiribati'],
    ['🇫🇲', 'Micronesia'],
    ['🇲🇭', 'Marshall Islands'],
    ['🇵🇼', 'Palau'],
    ['🇹🇻', 'Tuvalu'],
    ['🇳🇷', 'Nauru'],
    ['🇨🇰', 'Cook Islands'],
    ['👽', 'Outer Space'],
    ['🏴', 'Anarchist'],
  ];
  const SEED = [{ text: 'leave a note', color: 'lima', name: 'fw/hy', country: ' ' }];
  let selectedColor = 'lima';
  let panelOpen = false;
  let $panel, $overlay, $inner;
  function makeItem(c) {
    const wrap = document.createElement('span');
    wrap.className = 'tk-item';
    if (c.country) {
      const f = document.createElement('span');
      f.className = 'tk-flag';
      f.textContent = c.country;
      wrap.appendChild(f);
    }
    if (c.name) {
      const n = document.createElement('span');
      n.className = 'tk-name';
      n.textContent = c.name + ' ·';
      wrap.appendChild(n);
    }
    const t = document.createElement('span');
    t.className = 'tk-text';
    t.style.color = COLORS[c.color] || '#fff';
    t.textContent = c.text;
    wrap.appendChild(t);
    const s = document.createElement('span');
    s.className = 'tk-sep';
    s.textContent = '★';
    wrap.appendChild(s);
    return wrap;
  }
  function populateTicker(comments) {
    if (!$inner) return;
    const list = comments && comments.length ? comments : SEED;
    $inner.innerHTML = '';
    [0, 1].forEach(() => {
      const frag = document.createDocumentFragment();
      list.forEach((c) => frag.appendChild(makeItem(c)));
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
    wrap.addEventListener('mouseenter', () => ($inner.style.animationPlayState = 'paused'));
    wrap.addEventListener('mouseleave', () => ($inner.style.animationPlayState = 'running'));
  }
  function buildPanel() {
    $overlay = document.createElement('div');
    $overlay.className = 'gb-overlay';
    $overlay.addEventListener('click', closePanel);
    document.body.appendChild($overlay);
    $panel = document.createElement('div');
    $panel.className = 'gb-panel';
    $panel.setAttribute('role', 'dialog');
    $panel.setAttribute('aria-modal', 'true');
    $panel.setAttribute('aria-label', 'Guestbook');
    const swatches = C_KEYS.map(
      (k) =>
        `<button class="gb-swatch${k === 'lima' ? ' active' : ''}" data-color="${k}" style="--c:${COLORS[k]}" title="${k}" type="button"></button>`
    ).join('');
    const countryOpts = COUNTRIES.map(([f, n]) => {
      const safe = n.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      const safeF = f.replace(/&/g, '&amp;');
      return `<option value="${safeF}">${safeF} ${safe}</option>`;
    }).join('');
    const emojiBtns = EMOJIS.map(
      (e) => `<button class="gb-emoji" type="button" aria-label="${e}">${e}</button>`
    ).join('');
    $panel.innerHTML = `\n      <div class="gb-handle"></div>\n      <div class="gb-header">\n        <span class="gb-title">what do you think about the marquee?</span>\n        <button class="gb-close" id="gb-close" type="button" aria-label="Close">×</button>\n      </div>\n      <div class="gb-ta-wrap">\n        <textarea class="gb-ta" id="gb-ta" maxlength="${MAX}" placeholder="say your thing…" rows="3" spellcheck="true"></textarea>\n        <span class="gb-count" id="gb-count">0 / ${MAX}</span>\n      </div>\n      <div class="gb-row">\n        <div class="gb-swatches" id="gb-swatches">${swatches}</div>\n        <button class="gb-emoji-btn" id="gb-emoji-btn" type="button">😀 emoji</button>\n      </div>\n      <div class="gb-emoji-grid" id="gb-emoji-grid" hidden>${emojiBtns}</div>\n      <details class="gb-optional">\n        <summary>+ leave your name &amp; whereabouts (optional)</summary>\n        <div class="gb-opts">\n          <label class="gb-label">name\n            <input class="gb-input" id="gb-name" type="text" maxlength="48" autocomplete="nickname" placeholder="anonymous">\n          </label>\n          <label class="gb-label">email <span class="gb-hint">(kept private, never shown)</span>\n            <input class="gb-input" id="gb-email" type="email" maxlength="120" autocomplete="email" placeholder="optional">\n          </label>\n          <label class="gb-label">country\n            <select class="gb-input gb-select" id="gb-country">\n              <option value="">🌍 somewhere on earth</option>\n              ${countryOpts}\n            </select>\n          </label>\n        </div>\n      </details>\n      <button class="gb-submit" id="gb-submit" type="button">post it</button>\n      <div class="gb-status" id="gb-status" aria-live="polite"></div>\n    `;
    document.body.appendChild($panel);
    document.getElementById('gb-close').addEventListener('click', closePanel);
    document.getElementById('gb-open').addEventListener('click', openPanel);
    const ta = document.getElementById('gb-ta');
    const ct = document.getElementById('gb-count');
    ta.addEventListener('input', () => {
      const n = ta.value.length;
      ct.textContent = `${n} / ${MAX}`;
      ct.style.color = n > MAX * 0.85 ? COLORS.redd : '';
    });
    document.getElementById('gb-swatches').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-color]');
      if (!btn) return;
      selectedColor = btn.dataset.color;
      document.querySelectorAll('.gb-swatch').forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
    });
    document.getElementById('gb-emoji-btn').addEventListener('click', () => {
      const g = document.getElementById('gb-emoji-grid');
      g.hidden = !g.hidden;
    });
    document.getElementById('gb-emoji-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('.gb-emoji');
      if (!btn) return;
      const emoji = btn.textContent;
      const ta = document.getElementById('gb-ta');
      if (ta.value.length + emoji.length > MAX) return;
      const s = ta.selectionStart,
        end = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + emoji + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = s + emoji.length;
      ta.focus();
      document.getElementById('gb-count').textContent = `${ta.value.length} / ${MAX}`;
    });
    document.getElementById('gb-submit').addEventListener('click', handleSubmit);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelOpen) {
        closePanel();
        e.stopPropagation();
      }
    });
  }
  function openPanel() {
    if (!$panel) return;
    $panel.classList.add('open');
    $overlay.classList.add('open');
    panelOpen = true;
    window.__gbOpen = true;
    requestAnimationFrame(() => document.getElementById('gb-ta').focus());
  }
  function closePanel() {
    if (!$panel) return;
    $panel.classList.remove('open');
    $overlay.classList.remove('open');
    panelOpen = false;
    window.__gbOpen = false;
    const g = document.getElementById('gb-emoji-grid');
    if (g) g.hidden = true;
  }
  async function handleSubmit() {
    const ta = document.getElementById('gb-ta');
    const submit = document.getElementById('gb-submit');
    const text = ta.value.trim();
    if (!text) {
      setStatus('type something first', 'err');
      return;
    }
    const name = document.getElementById('gb-name').value.trim().slice(0, 48);
    const email = document.getElementById('gb-email').value.trim().slice(0, 120);
    const country = document.getElementById('gb-country').value;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('double-check that email', 'err');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'posting…';
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          color: selectedColor,
          name: name,
          email: email,
          country: country,
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.status));
      const data = await res.json();
      setStatus('✓ posted — thanks!', 'ok');
      ta.value = '';
      document.getElementById('gb-count').textContent = `0 / ${MAX}`;
      if (data.comments) populateTicker(data.comments);
      setTimeout(closePanel, 1700);
    } catch {
      setStatus("couldn't post — try again", 'err');
      submit.disabled = false;
      submit.textContent = 'post it';
    }
  }
  function setStatus(msg, type) {
    const el = document.getElementById('gb-status');
    el.textContent = msg;
    el.className = 'gb-status ' + (type || '');
    if (type === 'ok')
      setTimeout(() => {
        el.textContent = '';
      }, 2400);
    if (type !== 'err') {
      const s = document.getElementById('gb-submit');
      s.disabled = false;
      s.textContent = 'post it';
    }
  }
  async function fetchComments() {
    try {
      const res = await fetch(API);
      if (!res.ok) return;
      const { comments: comments } = await res.json();
      if (Array.isArray(comments) && comments.length) populateTicker(comments);
    } catch {}
  }
  document.addEventListener('DOMContentLoaded', () => {
    initTicker();
    buildPanel();
    fetchComments();
  });
})();
