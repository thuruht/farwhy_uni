(function () {
  const INDEX = typeof window.SPLASH_INDEX === 'string' ? window.SPLASH_INDEX : 'windex.html';
  window.enterVenue = function enterVenue(venue, ev) {
    if (ev) ev.preventDefault();
    venue = venue === 'howdy' ? 'howdy' : 'farewell';
    try {
      localStorage.setItem('fwhy-venue', venue);
    } catch (e) {}
    const root = document.documentElement;
    root.setAttribute('data-leaving', venue);
    const go = () => {
      window.location.href = `${INDEX}?venue=${venue}`;
    };
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      go();
      return;
    }
    setTimeout(go, 620);
  };
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (window.__gbOpen) return;
    const tag = (document.activeElement || {}).tagName || '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
    const k = e.key.toLowerCase();
    if (k === 'h') window.enterVenue('howdy');
    if (k === 'f') window.enterVenue('farewell');
  });
})();
