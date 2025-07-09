document.addEventListener('DOMContentLoaded', () => {
  // --------------------------
  // DOM Elements
  // --------------------------
  const howdySpan = document.querySelector('.header-title .sulk'); 
  const farewellSpan = document.querySelector('.header-title .span2'); 
  const body = document.querySelector('body');
  const title = document.querySelector('title');
  const address = document.getElementById('address');

  const mailingListForm = document.getElementById('mailing-list-form');
  const nameField = mailingListForm?.querySelector('[name="name"]');
  const messageField = mailingListForm?.querySelector('[name="message"]');

  const uploadButton = document.querySelector('.admin-upload-link button');
  const archiveButton = document.querySelector('.view-archives-button'); // If i add back the "View Archives" button

  // It's a single slideshow container:
  const slideImage   = document.getElementById('slide-image');
  const slideCaption = document.getElementById('slide-caption');
  const prevButton   = document.getElementById('prev-button');
  const nextButton   = document.getElementById('next-button');

  // Sorting UI (drop-down)
  const sortSelect = document.getElementById('sort-select');

  // Constants / Config
  const BASE_URL = window.location.origin; // Use current domain
  const CACHE_EXPIRY_MS = 15 * 60 * 1000;    // 15 minutes
  const cache = new Map(); // Simple in-memory cache

  // --------------------------
  // Slideshow-Related Variables
  // --------------------------
  let allFlyers = [];         // Full dataset (either upcoming or past) from the Worker
  let displayedFlyers = [];    // Currently displayed flyers (post-sort/filter)
  let currentSlideIndex = 0;
  let autoplayInterval;
  const SLIDE_INTERVAL = 5000; // Interval for autoplay (5 seconds)

  // --------------------------
  // Helper Functions
  // --------------------------

  /**
   * Toggles images based on the current state.
   * e.g., sets "farewell" images vs. "howdy" images
   */
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

    // Replace images
    document.querySelectorAll('.conic').forEach(img => img.src = target.conic);
    document.querySelectorAll('.conica').forEach(img => img.src = target.conica);
    document.querySelectorAll('.nicic').forEach(img => img.src = target.nicic);
    document.querySelectorAll('.nicica').forEach(img => img.src = target.nicica);

    const calendarContainer = document.getElementById('calendar');
    if (calendarContainer) {
      calendarContainer.querySelectorAll('img').forEach(img => {
        img.src = target.calendar;
      });
    }
  }

  /**
   * Updates social media links based on the current state.
   */
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

    // Update each social link
    const socialAnchors = document.querySelectorAll('.social-icons a');
    const platforms = ['facebook', 'instagram', 'twitter', 'spotify', 'secret'];

    socialAnchors.forEach((anchor, index) => {
      if (index < platforms.length) {  // Skip any additional anchors like Discord
        const platform = platforms[index];
        if (links[platform]) {
          anchor.href = links[platform];
        }
      }
    });
  }

  /**
   * Fetch upcoming or past flyers from the Worker.
   * @param {string} state - 'howdy' or 'farewell'
   * @param {boolean} showPast - whether to fetch archives or upcoming
   */
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
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Failed to fetch flyers from ${url}. Status: ${response.status}`);
        // Return empty array but don't cache the failure
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

      cache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Error fetching flyers: The request timed out.');
      } else {
        console.error('Error fetching flyers:', error);
      }
      return []; // Return empty array on any error
    }
  }

  /**
   * Displays the current slide (image + caption) based on `currentSlideIndex`.
   */
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

    // Wrap index for a continuous loop, or clamp if you don't want looping.
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

  /**
   * Initializes (or re-initializes) the slideshow for the current state & sort selection.
   */
  async function initSlideshow() {
    const currentState = body?.dataset.state; // 'farewell' or 'howdy'
    
    // Use the sortSelect value to determine if we should show past events
    // and update the dropdown selection
    if (sortSelect) {
      if (window.showPastEvents) {
        sortSelect.value = 'past';
      } else {
        sortSelect.value = 'soonest';
      }
    }

    // Get show past events toggle status
    const showPast = window.showPastEvents || false;
    
    // Update the toggle button text based on current state
    const togglePastBtn = document.getElementById('toggle-past-events');
    if (togglePastBtn) {
      togglePastBtn.textContent = showPast ? 'hide past events' : 'show past events';
    }

    allFlyers = await fetchFlyers(currentState, showPast);

    // You could do further sorting here if needed.
    displayedFlyers = allFlyers;
    currentSlideIndex = 0;
    displaySlide(currentSlideIndex);

    // Start autoplay
    startAutoplay();
  }

  /**
   * Toggles the body state between 'howdy' and 'farewell', then re-fetches slideshow data.
   */
  function toggleState() {
    if (!body) return;
    const currentState = body.dataset.state;
    const newState = currentState === 'farewell' ? 'howdy' : 'farewell';
    body.dataset.state = newState;
    body.classList.toggle('howdy-active'); // for theming

    // Update dynamic text
    if (farewellSpan) {
      farewellSpan.textContent = (newState === 'howdy') ? 'HOWDY' : 'FAREWELL';
    }
    if (howdySpan) {
      howdySpan.textContent = (newState === 'howdy') ? '& FAREWELL' : '& HOWDY';
    }
    if (address) {
      address.textContent = (newState === 'howdy')
        ? '6523 STADIUM DRIVE, KANSAS CITY, MISSOURI'
        : '6515 STADIUM DRIVE, KANSAS CITY, MISSOURI';
    }

    if (title) {
      title.textContent = (newState === 'farewell')
        ? 'FAREWELL | HOWDY | KCMO - Howdy and Farewell - Kansas City'
        : 'HOWDY | FAREWELL | KCMO - Farewell and Howdy - Kansas City';
    }

    toggleImages(newState);
    updateSocialLinks(newState);

    // Re-init slideshow for the new state
    initSlideshow();
  }

  /**
   * Start autoplay interval.
   */
  function startAutoplay() {
    // Clear existing interval before starting a new one
    stopAutoplay();
    autoplayInterval = setInterval(() => {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
    }, SLIDE_INTERVAL);
  }

  /**
   * Stop any existing autoplay interval.
   */
  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
    }
  }

  // Slideshow Prev/Next + Autoplay Control
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

  // Pause/resume autoplay on hover
  if (slideImage) {
    slideImage.addEventListener('mouseenter', stopAutoplay);
    slideImage.addEventListener('mouseleave', startAutoplay);
  }

  // --------------------------
  // Upload & Archives (Modals)
  // --------------------------

  /**
   * Creates and displays a basic modal.
   */
  function createModal(titleText, contentHTML) {
    const existingModal = document.querySelector('.modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>${titleText}</h2>
        ${contentHTML}
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-button');
    closeBtn?.addEventListener('click', () => modal.remove());

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * If need separate Archives modal, can keep this.
   */
  function openArchiveModal(state) {
    const archiveContentHTML = `<div id="archiveContent">Loading...</div>`;
    createModal('Archived Events', archiveContentHTML);
    fetchAndDisplayArchives(state);
  }

  /**
   * Fetch and display archives in the modal.
   */
  async function fetchAndDisplayArchives(state) {
    const archiveContent = document.getElementById('archiveContent');
    if (!archiveContent) return;

    try {
      const response = await fetch(`${BASE_URL}/archives?type=${state}`);
      if (!response.ok) throw new Error(`Failed to fetch archives: ${response.statusText}`);
      const flyers = await response.json();

      archiveContent.innerHTML = ''; // Clear "Loading..."

      if (!flyers.length) {
        archiveContent.innerHTML = '<p>No past events found.</p>';
        return;
      }

      flyers.forEach((flyer) => {
        const flyerItem = document.createElement('div');
        flyerItem.className = 'flyer-item';
        flyerItem.innerHTML = `
          <h3>${flyer.title}</h3>
          <p>${flyer.description}</p>
          <p><strong>Date:</strong> ${flyer.date}</p>
          <p><strong>Time:</strong> ${flyer.time}</p>
        `;
        archiveContent.appendChild(flyerItem);
      });
    } catch (error) {
      console.error('Error fetching archives:', error);
      archiveContent.innerHTML = `<p>Error fetching archives: ${error.message}</p>`;
    }
  }

  // --------------------------
  // Mailing List + Hidden Fields
  // --------------------------

  /**
   * Updates hidden fields in the mailing list form based on the current state.
   */
  function updateHiddenFields() {
    const newState = document.body?.dataset.state;
    if (nameField) {
      nameField.value = "Add to mailing list"; // Example default
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

  // --------------------------
  // Event Listeners
  // --------------------------

  // Toggle state when user clicks the "sulk" span (HOWDY / FAREWELL)
  if (howdySpan) {
    howdySpan.addEventListener('click', toggleState);
  }

  // Archives button
  if (archiveButton) {
    archiveButton.addEventListener('click', () => {
      if (!body) return;
      openArchiveModal(body.dataset.state);
    });
  }

  // Mailing list form submission
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
        // Send the POST request
        await fetch('https://fwhy.kcmo.xyz/mailing-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        // Open the Mailchimp URL in a new tab or popup
        const email = encodeURIComponent(data.email);
        const mailchimpUrl = `https://mailchi.mp/eae4ec3932c9/farewell-email-signup-page?mc-EMAIL=${email}`;
        window.open(mailchimpUrl, '_blank', 'noopener,noreferrer');

        // Reset the form
        e.target.reset();
        updateHiddenFields();
      } catch (error) {
        console.error('Error:', error);
      }
    });
  }

  // Sorting drop-down: re-init the slideshow with chosen sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      // Check if we should show past events based on dropdown value
      window.showPastEvents = sortSelect.value === 'past';
      
      // Reload the slideshow with the updated setting
      initSlideshow(); 
    });
  }

  // --------------------------
  // Initial Setup
  // --------------------------

  // Set an initial state 
  if (body) {
    body.dataset.state = body.dataset.state || 'farewell'; 
    toggleImages('farewell'); 
    updateSocialLinks('farewell'); 
  }

  // Initialize the slideshow (default to soonest events)
  initSlideshow();

  // Setup past events toggle
  window.showPastEvents = false;
  const togglePastBtn = document.getElementById('toggle-past-events');
  if (togglePastBtn) {
    togglePastBtn.addEventListener('click', () => {
      // Toggle the state
      window.showPastEvents = !window.showPastEvents;
      
      // Update button text
      togglePastBtn.textContent = window.showPastEvents ? 'hide past events' : 'show past events';
      
      // Reload the slideshow
      initSlideshow();
    });
  }
  
  // Setup events page functionality
  setupEventsPage();

  // Initialize hidden fields on page load
  updateHiddenFields();

  // Initialize social media links on first page load
  (function initSocialLinks() {
    const state = body?.dataset.state || 'farewell';
    const socialLinks = document.querySelectorAll('.social-icons a');
    
    // Make sure all social links have target="_blank" and rel="noopener"
    socialLinks.forEach(link => {
      // Ensure target="_blank" and rel="noopener" for all social links
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      
      // Add a class to identify social links for event delegation
      link.classList.add('social-link');
      
      // Add specific click handler for social links
      link.addEventListener('click', function(e) {
        // We don't prevent default here - we want the link to open
        console.log('Social link clicked, opening in new tab:', this.href);
        
        // Ensure it opens in a new tab even if other handlers interfere
        if (!this.target || this.target !== '_blank') {
          this.target = '_blank';
        }
      });
      
      // Remove the open-popup class if it exists to prevent modal handlers from interfering
      if (link.classList.contains('open-popup')) {
        link.classList.remove('open-popup');
        console.log(`Removed open-popup class from social link: ${link.href}`);
      }
      
      // Add a class to explicitly mark these as external links
      link.classList.add('external-link');
    });
    
    // Set initial social media URLs
    updateSocialLinks(state);
    console.log(`[InitSocialLinks] Initialized social media links for state: ${state}`);
  })();

  // Watch for body data-state changes and update hidden fields accordingly
  if (body) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-state") {
          updateHiddenFields();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
  }
});

// Function to handle the events page functionality
function setupEventsPage() {
  const eventsLink = document.getElementById('events-page-link');
  const eventsModal = document.getElementById('events-page-modal');
  const closeButton = document.querySelector('.events-page-close');
  const venueFilter = document.getElementById('events-venue-filter');
  const togglePastButton = document.getElementById('events-toggle-past');
  const eventsList = document.getElementById('events-list');
  
  // State variables
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
  
  // Function to fetch all events for the page
  async function fetchAllEvents() {
    eventsList.innerHTML = '<div class="loading">Loading events...</div>';
    
    try {
      // Fetch events from both venues
      const farewellEvents = await fetchFlyers('farewell', showPastInPage);
      const howdyEvents = await fetchFlyers('howdy', showPastInPage);
      
      // Combine and sort by date
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
  
  // Function to render events based on current filters
  function renderEvents() {
    if (!eventsList) return;
    
    // Apply venue filter
    let filteredEvents = allEvents;
    if (venueFilter && venueFilter.value !== 'all') {
      filteredEvents = allEvents.filter(event => event.venue === venueFilter.value);
    }
    
    if (filteredEvents.length === 0) {
      eventsList.innerHTML = '<div class="empty-state">No events found matching your criteria.</div>';
      return;
    }
    
    // Generate HTML for each event
    eventsList.innerHTML = filteredEvents.map(event => {
      const formattedDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Date TBD';
      
      return `
        <div class="event-item">
          ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title || 'Event Flyer'}">` : '<div class="no-image" style="width: 100px; height: 100px; background: #333; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px;">No Image</div>'}
          <div class="event-details">
            <h3>${event.title}</h3>
            <p>${formattedDate}</p>
            <p><strong>Venue:</strong> <span class="venue-${event.venue}">${event.venue}</span></p>
            <p>${event.description || ''}</p>
            ${event.ticketLink ? `<a href="${event.ticketLink}" target="_blank" rel="noopener noreferrer" class="event-ticket-link">${event.price ? `Tickets ${event.price}` : 'Get Tickets'}</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Event handlers
  if (eventsLink) {
    eventsLink.addEventListener('click', openEventsModal);
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', closeEventsModal);
  }

  if (eventsModal) {
    eventsModal.addEventListener('click', (e) => {
      if (e.target === eventsModal) { // Click on the overlay background
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

// ====================================
// MISSING FUNCTION FIXES
// ====================================

/**
 * Handle iframe load events - called when news iframe finishes loading
 */
function onIframeLoad(iframe) {
  console.log('Iframe loaded:', iframe.src);
  
  // Function to resize iframe based on content
  function resizeIframe() {
    try {
      // Try to access iframe content (may fail due to CORS for external content)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        console.log('Iframe content accessible');
        
        // Get the full content height
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        
        // Calculate the maximum height needed
        const contentHeight = Math.max(
          body ? body.scrollHeight : 0,
          body ? body.offsetHeight : 0,
          html ? html.clientHeight : 0,
          html ? html.scrollHeight : 0,
          html ? html.offsetHeight : 0
        );
        
        console.log('Iframe content height calculated:', contentHeight);
        
        // Set a minimum height and maximum reasonable height
        const minHeight = 300; // 30vh equivalent
        const maxHeight = 1200; // Reasonable max to prevent huge iframes
        const finalHeight = Math.max(minHeight, Math.min(contentHeight + 20, maxHeight)); // Add 20px padding
        
        // Apply the height
        iframe.style.height = finalHeight + 'px';
        console.log('Iframe height set to:', finalHeight + 'px');
        
        // Also try to listen for content changes inside the iframe
        if (iframeDoc.addEventListener) {
          // Listen for DOM changes in the iframe
          const observer = new MutationObserver(function() {
            // Debounce the resize to avoid excessive calls
            clearTimeout(iframe._resizeTimeout);
            iframe._resizeTimeout = setTimeout(resizeIframe, 250);
          });
          
          observer.observe(iframeDoc.body || iframeDoc.documentElement, {
            childList: true,
            subtree: true,
            attributes: true
          });
          
          // Store observer for cleanup
          iframe._mutationObserver = observer;
        }
        
      } else {
        console.log('Iframe content not accessible (CORS) - using fallback resize');
        // Fallback for cross-origin iframes
        fallbackResize();
      }
    } catch (error) {
      console.log('Iframe content not accessible (CORS):', error.message);
      // Fallback for cross-origin iframes
      fallbackResize();
    }
  }
  
  // Fallback resize method for cross-origin content
  function fallbackResize() {
    // Try to use postMessage API for cross-origin communication
    // Send a message to the iframe asking for its height
    try {
      iframe.contentWindow.postMessage({ type: 'getHeight' }, '*');
    } catch (error) {
      console.log('PostMessage failed, using static sizing');
      // Final fallback - set a reasonable static height
      iframe.style.height = '60vh';
    }
  }
  
  // Initial resize
  resizeIframe();
  
  // Retry resize once after a short delay to account for dynamic content loading
  // Reduced number of resize attempts to avoid infinite loop
  setTimeout(resizeIframe, 1000);
}

// Listen for messages from iframes (for cross-origin height communication)
// Add rate limiting to prevent endless resizing loops
let lastResizeTime = 0;
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'setHeight' && typeof event.data.height === 'number') {
    // Rate limit to at most once per second
    const now = Date.now();
    if (now - lastResizeTime < 1000) {
      return; // Ignore rapid successive resize requests
    }
    lastResizeTime = now;
    
    // Find the iframe that sent this message
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

// Make function globally available
window.onIframeLoad = onIframeLoad;

