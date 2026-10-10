document.addEventListener('DOMContentLoaded', () => {
  const howdySpan = document.querySelector('.header-title .sulk');
  const farewellSpan = document.querySelector('.header-title .span2');
  const body = document.querySelector('body');
  const title = document.querySelector('title');
  const address = document.getElementById('address');
  const mailingListForm = document.getElementById('mailing-list-form');
  const nameField = mailingListForm?.querySelector('[name="name"]');
  const messageField = mailingListForm?.querySelector('[name="message"]');
  const uploadButton = document.querySelector('.admin-upload-link button');
  const archiveButton = document.querySelector('.view-archives-button');
  const slideImage = document.getElementById('slide-image');
  const slideCaption = document.getElementById('slide-caption');
  const prevButton = document.getElementById('prev-button');
  const nextButton = document.getElementById('next-button');
  const sortSelect = document.getElementById('sort-select');
  const BASE_URL = window.location.origin;
  const CACHE_EXPIRY_MS = 15 * 60 * 1e3;
  const cache = new Map();
  let allFlyers = [];
  let displayedFlyers = [];
  let currentSlideIndex = 0;
  let autoplayInterval;
  const SLIDE_INTERVAL = 5e3;
  function toggleImages(state) {
    const imageMappings = {
      farewell: {
        conic: './img/fm.png',
        conica: './img/fm2.png',
        nicic: './img/fwm.png',
        nicica: './img/fm2.png',
        calendar: './img/fwcal.png',
      },
      howdy: {
        conic: './img/hym.png',
        conica: './img/hm.png',
        nicic: './img/hm2.png',
        nicica: './img/hm.png',
        calendar: './img/hycal.png',
      },
    };
    const target = imageMappings[state];
    if (!target) {
      console.error(`No image mappings for state: ${state}`);
      return;
    }
    document.querySelectorAll('.conic').forEach((img) => (img.src = target.conic));
    document.querySelectorAll('.conica').forEach((img) => (img.src = target.conica));
    document.querySelectorAll('.nicic').forEach((img) => (img.src = target.nicic));
    document.querySelectorAll('.nicica').forEach((img) => (img.src = target.nicica));
    const calendarContainer = document.getElementById('calendar');
    if (calendarContainer) {
      calendarContainer.querySelectorAll('img').forEach((img) => {
        img.src = target.calendar;
      });
    }
  }
  function updateSocialLinks(state) {
    const socialLinks = {
      howdy: {
        facebook: 'https://www.facebook.com/howdykcmo',
        instagram: 'https://instagram.com/howdykcmo',
        twitter: 'https://x.com/HowdyKCMO',
        spotify: 'https://open.spotify.com/playlist/44StXfAJQiPoDQYegr4kec?si=8f07faf57647401f',
        secret: 'https://linktr.ee/farewellhowdy',
      },
      farewell: {
        facebook: 'https://www.facebook.com/farewelltransmission',
        instagram: 'https://instagram.com/farewellkcmo',
        twitter: 'https://x.com/farewellcafe',
        spotify: 'https://open.spotify.com/playlist/1eXsLdNQe319cAbnsmpi06?si=333d96c262f5424d',
        secret: 'https://linktr.ee/farewellhowdy',
      },
    };
    const links = socialLinks[state];
    if (!links) {
      console.error(`No social links for state: ${state}`);
      return;
    }
    const socialAnchors = Array.from(document.querySelectorAll('.social-icons a')).filter(
      (a) => a.closest('li').style.display !== 'none'
    );
    const platforms = ['facebook', 'instagram', 'twitter', 'secret'];
    socialAnchors.forEach((anchor, index) => {
      if (index < platforms.length) {
        const platform = platforms[index];
        if (links[platform]) {
          anchor.href = links[platform];
        }
      }
    });
  }
  window.fetchFlyers = async function fetchFlyers(state, showPast = false) {
    try {
      const cacheKey = `${state}-${showPast ? 'past' : 'upcoming'}`;
      const now = Date.now();
      if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (now - cached.timestamp < CACHE_EXPIRY_MS) {
          console.log(`Using cached flyer data for ${cacheKey}`);
          return cached.data;
        }
        cache.delete(cacheKey);
      }
      const url = `${BASE_URL}/api/slideshow?venue=${state}&includePast=${showPast}`;
      console.log(`Trying to fetch flyers from: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8e3);
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.error(`Failed to fetch flyers from ${url}. Status: ${response.status}`);
        return [];
      }
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} flyers from ${url}`);
      if (data.length > 0) {
        console.log('First flyer object received:', JSON.stringify(data[0], null, 2));
      }
      if (data.length === 0) {
        console.warn('No flyers were returned from the API.');
      }
      cache.set(cacheKey, { data: data, timestamp: now });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Error fetching flyers: The request timed out.');
      } else {
        console.error('Error fetching flyers:', error);
      }
      return [];
    }
  };
  function displaySlide(index) {
    if (!displayedFlyers.length) {
      if (slideImage) {
        slideImage.src = '';
      }
      if (slideCaption) {
        slideCaption.textContent = 'No events found.';
      }
      return;
    }
    if (index < 0) {
      currentSlideIndex = displayedFlyers.length - 1;
    } else if (index >= displayedFlyers.length) {
      currentSlideIndex = 0;
    }
    const flyer = displayedFlyers[currentSlideIndex];
    if (!flyer) return;
    if (slideImage) {
      slideImage.src = flyer.imageUrl || '';
      slideImage.alt = flyer.title || 'Flyer';
    }
  }
  async function initSlideshow() {
    const currentState = body?.dataset.state;
    if (sortSelect) {
      if (window.showPastEvents) {
        sortSelect.value = 'past';
      } else {
        sortSelect.value = 'soonest';
      }
    }
    const showPast = window.showPastEvents || false;
    const togglePastBtn = document.getElementById('toggle-past-events');
    if (togglePastBtn) {
      togglePastBtn.textContent = showPast ? 'hide past events' : 'show past events';
    }
    allFlyers = await fetchFlyers(currentState, showPast);
    displayedFlyers = allFlyers;
    currentSlideIndex = 0;
    displaySlide(currentSlideIndex);
    startAutoplay();
  }
  function toggleState() {
    if (!body) return;
    const currentState = body.dataset.state;
    const newState = currentState === 'farewell' ? 'howdy' : 'farewell';
    body.dataset.state = newState;
    localStorage.setItem('fwhy-venue', newState);
    body.classList.toggle('howdy-active');
    if (farewellSpan) {
      farewellSpan.textContent = newState === 'howdy' ? 'HOWDY' : 'FAREWELL';
    }
    if (howdySpan) {
      howdySpan.textContent = newState === 'howdy' ? '& FAREWELL' : '& HOWDY';
    }
    if (address) {
      address.textContent =
        newState === 'howdy'
          ? '6523 STADIUM DRIVE, KANSAS CITY, MISSOURI'
          : '6515 STADIUM DRIVE, KANSAS CITY, MISSOURI';
    }
    if (title) {
      title.textContent =
        newState === 'farewell'
          ? 'FAREWELL | HOWDY | KCMO - Howdy and Farewell - Kansas City'
          : 'HOWDY | FAREWELL | KCMO - Farewell and Howdy - Kansas City';
    }
    toggleImages(newState);
    updateSocialLinks(newState);
    initSlideshow();
  }
  function startAutoplay() {
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
    }, SLIDE_INTERVAL);
  }
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      currentSlideIndex--;
      displaySlide(currentSlideIndex);
      stopAutoplay();
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
      stopAutoplay();
    });
  }
  if (slideImage) {
    slideImage.addEventListener('mouseenter', stopAutoplay);
    slideImage.addEventListener('mouseleave', startAutoplay);
  }
  function createModal(titleText, contentHTML) {
    const existingModal = document.querySelector('.modal');
    if (existingModal) existingModal.remove();
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `\n      <div class="modal-content">\n        <span class="close-button">&times;</span>\n        <h2>${titleText}</h2>\n        ${contentHTML}\n      </div>\n    `;
    document.body.appendChild(modal);
    const closeBtn = modal.querySelector('.close-button');
    closeBtn?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }
  function openArchiveModal(state) {
    const archiveContentHTML = `<div id="archiveContent">Loading...</div>`;
    createModal('Archived Events', archiveContentHTML);
    fetchAndDisplayArchives(state);
  }
  async function fetchAndDisplayArchives(state) {
    const archiveContent = document.getElementById('archiveContent');
    if (!archiveContent) return;
    try {
      const response = await fetch(`${BASE_URL}/archives?type=${state}`);
      if (!response.ok) throw new Error(`Failed to fetch archives: ${response.statusText}`);
      const flyers = await response.json();
      archiveContent.innerHTML = '';
      if (!flyers.length) {
        archiveContent.innerHTML = '<p>No past events found.</p>';
        return;
      }
      flyers.forEach((flyer) => {
        const flyerItem = document.createElement('div');
        flyerItem.className = 'flyer-item';
        const h3 = document.createElement('h3');
        h3.textContent = flyer.title;
        flyerItem.appendChild(h3);
        const descP = document.createElement('p');
        descP.textContent = flyer.description;
        flyerItem.appendChild(descP);
        const dateP = document.createElement('p');
        const dateStrong = document.createElement('strong');
        dateStrong.textContent = 'Date: ';
        dateP.appendChild(dateStrong);
        dateP.appendChild(document.createTextNode(flyer.date));
        flyerItem.appendChild(dateP);
        const timeP = document.createElement('p');
        const timeStrong = document.createElement('strong');
        timeStrong.textContent = 'Time: ';
        timeP.appendChild(timeStrong);
        timeP.appendChild(document.createTextNode(flyer.time));
        flyerItem.appendChild(timeP);
        archiveContent.appendChild(flyerItem);
      });
    } catch (error) {
      console.error('Error fetching archives:', error);
      archiveContent.innerHTML = `<p>Error fetching archives: ${error.message}</p>`;
    }
  }
  function updateHiddenFields() {
    const newState = document.body?.dataset.state;
    if (nameField) {
      nameField.value = 'Add to mailing list';
    }
    if (messageField) {
      if (newState === 'howdy') {
        messageField.value = 'HOWDY';
      } else if (newState === 'farewell') {
        messageField.value = 'FAREWELL';
      } else {
        messageField.value = 'UNKNOWN';
      }
    }
  }
  if (howdySpan) {
    howdySpan.addEventListener('click', toggleState);
  }
  if (archiveButton) {
    archiveButton.addEventListener('click', () => {
      if (!body) return;
      openArchiveModal(body.dataset.state);
    });
  }
  if (mailingListForm) {
    mailingListForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());
      if (!data.name || !data.message) {
        console.error('Hidden field(s) missing or empty.');
        return;
      }
      try {
        await fetch('https://fwhy.kcmo.xyz/mailing-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const email = encodeURIComponent(data.email);
        const mailchimpUrl = `https://mailchi.mp/eae4ec3932c9/farewell-email-signup-page?mc-EMAIL=${email}`;
        window.open(mailchimpUrl, '_blank', 'noopener,noreferrer');
        e.target.reset();
        updateHiddenFields();
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      window.showPastEvents = sortSelect.value === 'past';
      initSlideshow();
    });
  }
  if (body) {
    const venueParam = new URLSearchParams(location.search).get('venue');
    const s = venueParam || localStorage.getItem('fwhy-venue') || 'farewell';
    body.dataset.state = s === 'howdy' ? 'howdy' : 'farewell';
    body.classList.toggle('howdy-active', body.dataset.state === 'howdy');
    if (farewellSpan)
      farewellSpan.textContent = body.dataset.state === 'howdy' ? 'HOWDY' : 'FAREWELL';
    if (howdySpan)
      howdySpan.textContent = body.dataset.state === 'howdy' ? '& FAREWELL' : '& HOWDY';
    if (address)
      address.textContent =
        body.dataset.state === 'howdy'
          ? '6523 STADIUM DRIVE, KANSAS CITY, MISSOURI'
          : '6515 STADIUM DRIVE, KANSAS CITY, MISSOURI';
    if (title)
      title.textContent =
        body.dataset.state === 'farewell'
          ? 'FAREWELL | HOWDY | KCMO - Howdy and Farewell - Kansas City'
          : 'HOWDY | FAREWELL | KCMO - Farewell and Howdy - Kansas City';
    toggleImages(body.dataset.state);
    updateSocialLinks(body.dataset.state);
  }
  initSlideshow();
  window.showPastEvents = false;
  const togglePastBtn = document.getElementById('toggle-past-events');
  if (togglePastBtn) {
    togglePastBtn.addEventListener('click', () => {
      window.showPastEvents = !window.showPastEvents;
      togglePastBtn.textContent = window.showPastEvents ? 'hide past events' : 'show past events';
      initSlideshow();
    });
  }
  setupEventsPage();
  updateHiddenFields();
  (function initSocialLinks() {
    const state = body?.dataset.state || 'farewell';
    const socialLinks = document.querySelectorAll('.social-icons a');
    socialLinks.forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      link.classList.add('social-link');
      link.addEventListener('click', function (e) {
        console.log('Social link clicked, opening in new tab:', this.href);
        if (!this.target || this.target !== '_blank') {
          this.target = '_blank';
        }
      });
      if (link.classList.contains('open-popup')) {
        link.classList.remove('open-popup');
        console.log(`Removed open-popup class from social link: ${link.href}`);
      }
      link.classList.add('external-link');
    });
    updateSocialLinks(state);
    console.log(`[InitSocialLinks] Initialized social media links for state: ${state}`);
  })();
  if (body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-state') {
          updateHiddenFields();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
  }
});
function setupEventsPage() {
  const eventsLink = document.getElementById('events-page-link');
  const eventsModal = document.getElementById('events-page-modal');
  const closeButton = document.querySelector('.events-page-close');
  const venueFilter = document.getElementById('events-venue-filter');
  const togglePastButton = document.getElementById('events-toggle-past');
  const eventsList = document.getElementById('events-list');
  let allEvents = [];
  let showPastInPage = false;
  function openEventsModal() {
    if (eventsModal) {
      eventsModal.style.display = 'block';
      fetchAllEvents();
    }
  }
  function closeEventsModal() {
    if (eventsModal) {
      eventsModal.style.display = 'none';
    }
  }
  async function fetchAllEvents() {
    eventsList.innerHTML = '<div class="loading">Loading events...</div>';
    try {
      const farewellEvents = await fetchFlyers('farewell', showPastInPage);
      const howdyEvents = await fetchFlyers('howdy', showPastInPage);
      allEvents = [...farewellEvents, ...howdyEvents].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });
      renderEvents();
    } catch (error) {
      console.error('Error fetching events:', error);
      eventsList.innerHTML = '<div class="error">Failed to load events. Please try again.</div>';
    }
  }
  function renderEvents() {
    if (!eventsList) return;
    eventsList.innerHTML = '';
    let filteredEvents = allEvents;
    if (venueFilter && venueFilter.value !== 'all') {
      filteredEvents = allEvents.filter((event) => event.venue === venueFilter.value);
    }
    if (filteredEvents.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = 'No events found matching your criteria.';
      eventsList.appendChild(emptyState);
      return;
    }
    filteredEvents.forEach((event) => {
      const eventItem = document.createElement('div');
      eventItem.className = 'event-item';
      if (event.imageUrl) {
        const img = document.createElement('img');
        img.src = event.imageUrl;
        img.alt = event.title || 'Event Flyer';
        eventItem.appendChild(img);
      } else {
        const noImage = document.createElement('div');
        noImage.className = 'no-image';
        noImage.style.cssText =
          'width: 100px; height: 100px; background: #333; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px;';
        noImage.textContent = 'No Image';
        eventItem.appendChild(noImage);
      }
      const details = document.createElement('div');
      details.className = 'event-details';
      const h3 = document.createElement('h3');
      h3.textContent = event.title;
      details.appendChild(h3);
      const dateP = document.createElement('p');
      dateP.textContent = event.date
        ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Date TBD';
      details.appendChild(dateP);
      const venueP = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Venue: ';
      const venueSpan = document.createElement('span');
      venueSpan.className = `venue-${event.venue}`;
      venueSpan.textContent = event.venue;
      venueP.appendChild(strong);
      venueP.appendChild(venueSpan);
      details.appendChild(venueP);
      const descP = document.createElement('p');
      descP.textContent = event.description || '';
      details.appendChild(descP);
      if (event.ticketLink) {
        const ticketLink = document.createElement('a');
        ticketLink.href = event.ticketLink;
        ticketLink.target = '_blank';
        ticketLink.rel = 'noopener noreferrer';
        ticketLink.className = 'event-ticket-link';
        ticketLink.textContent = event.price ? `Tickets ${event.price}` : 'Get Tickets';
        details.appendChild(ticketLink);
      }
      eventItem.appendChild(details);
      eventsList.appendChild(eventItem);
    });
  }
  if (eventsLink) {
    eventsLink.addEventListener('click', openEventsModal);
  }
  if (closeButton) {
    closeButton.addEventListener('click', closeEventsModal);
  }
  if (eventsModal) {
    eventsModal.addEventListener('click', (e) => {
      if (e.target === eventsModal) {
        closeEventsModal();
      }
    });
  }
  if (venueFilter) {
    venueFilter.addEventListener('change', renderEvents);
  }
  if (togglePastButton) {
    togglePastButton.addEventListener('click', () => {
      showPastInPage = !showPastInPage;
      togglePastButton.textContent = showPastInPage ? 'Hide Past Events' : 'Show Past Events';
      togglePastButton.classList.toggle('active', showPastInPage);
      fetchAllEvents();
    });
  }
}
function onIframeLoad(iframe) {
  console.log('Iframe loaded:', iframe.src);
  function resizeIframe() {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        console.log('Iframe content accessible');
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const contentHeight = Math.max(
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0,
          html ? html.clientHeight : 0,
          html ? html.scrollHeight : 0,
          html ? html.offsetHeight : 0
        );
        console.log('Iframe content height calculated:', contentHeight);
        const minHeight = 300;
        const maxHeight = 1200;
        const finalHeight = Math.max(minHeight, Math.min(contentHeight + 20, maxHeight));
        iframe.style.height = finalHeight + 'px';
        console.log('Iframe height set to:', finalHeight + 'px');
        if (iframeDoc.addEventListener) {
          const observer = new MutationObserver(function () {
            clearTimeout(iframe._resizeTimeout);
            iframe._resizeTimeout = setTimeout(resizeIframe, 250);
          });
          observer.observe(iframeDoc.body || iframeDoc.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
          });
          iframe._mutationObserver = observer;
        }
      } else {
        console.log('Iframe content not accessible (CORS) - using fallback resize');
        fallbackResize();
      }
    } catch (error) {
      console.log('Iframe content not accessible (CORS):', error.message);
      fallbackResize();
    }
  }
  function fallbackResize() {
    try {
      iframe.contentWindow.postMessage({ type: 'getHeight' }, '*');
    } catch (error) {
      console.log('PostMessage failed, using static sizing');
      iframe.style.height = '60vh';
    }
  }
  resizeIframe();
  setTimeout(resizeIframe, 1e3);
}
let lastResizeTime = 0;
window.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'setHeight' && typeof event.data.height === 'number') {
    const now = Date.now();
    if (now - lastResizeTime < 1e3) {
      return;
    }
    lastResizeTime = now;
    const iframes = document.querySelectorAll('iframe');
    for (let iframe of iframes) {
      if (iframe.contentWindow === event.source) {
        const finalHeight = Math.max(300, Math.min(event.data.height + 20, 1200));
        iframe.style.height = finalHeight + 'px';
        console.log('Iframe height set via postMessage:', finalHeight + 'px');
        break;
      }
    }
  }
});
window.onIframeLoad = onIframeLoad;
