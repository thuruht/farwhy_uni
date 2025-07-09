// ifrevl.js - Using Event Delegation for Popups

// Iframe resizing functions (keep as is)
function resizeIframe(obj) {
  obj.style.height = obj.contentWindow.document.documentElement.scrollHeight + 'px';
}
function setupContentResize(iframe) {
  iframe.contentWindow.addEventListener('resize', () => resizeIframe(iframe));
  const observer = new MutationObserver(() => resizeIframe(iframe));
  observer.observe(iframe.contentWindow.document, { childList: true, subtree: true });
}
function onIframeLoad(iframe) {
  resizeIframe(iframe);
  setupContentResize(iframe);
}

// URL generation for calendar links (keep corrected version)
function generateUrls(state) {
  const baseUrl = window.location.hostname;
  const eventPathBase = state === 'howdy' ? 'hyevent' : 'fwevent'; // Path WITHOUT trailing slash
  return {
    showListings: `https://${baseUrl}/${eventPathBase}/`, // Add slash for listings
    icsFile: `https://${baseUrl}/${eventPathBase}/calendar.ics` // Use base path for file
  };
}

// Update calendar links function (keep combined version)
function updateCalendarLinks() {
  const state = document.body.dataset.state || 'farewell';
  const urls = generateUrls(state);

  // --- Part 1: Update the main #credEt block ---
  const credEtDiv = document.getElementById('credEt');
  if (credEtDiv) {
    // Updated to use events-modal-trigger class instead of open-popup
    const mainBlockHtml = `
<div>
<hr> || <a href="javascript:void(0);" class="events-modal-trigger"><b>VIEW ALL EVENTS</b></a> || <a href="#" class="cal-link-ics tooltip"><b>📅 DOWNLOAD VENUE CALENDAR</b><span class="tooltip-text">Download upcoming events for the current venue as an .ics file that you can import into your calendar app (Google Calendar, Apple Calendar, Outlook, etc.)</span></a> ||<hr>
<p><small>calendar graphic (and the other swell graphics and general layout of this site) designed by the excellent <a href="https://austinchapmandesign.com/" target="_blank" rel="noopener">austin chapman</a> - however, any parts of the site that you dislike, that are animated annoyingly, bitcrushed, badly implemented, or the like, may instead be blamed on me (<a href="https://ntapkc.com" target="_blank" rel="noopener">jojo</a>), with the exception of show/event flyers, which are variously sourced</small></p>
</div>
    `;
    credEtDiv.innerHTML = mainBlockHtml;
    
    // Add event listeners to the newly created events-modal-trigger links
    const newModalTriggers = credEtDiv.querySelectorAll('.events-modal-trigger');
    newModalTriggers.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        // Get the current venue state for the modal
        const currentState = document.body.dataset.state || 'farewell';
        console.log(`[UpdateLinks] Modal trigger clicked with state: ${currentState}`);
        
        // Dispatch a custom event to notify events-modal.js
        const event = new CustomEvent('openEventsModal', { 
          detail: { venue: currentState }
        });
        document.dispatchEvent(event);
      });
    });
    
    console.log('[UpdateLinks] Updated #credEt block and attached event listeners.');
  } else {
    console.warn('[UpdateLinks] Element with id="credEt" not found.');
  }

  // --- Part 2: Update individual links by class ---
  const listingLinks = document.querySelectorAll('.cal-link-listing');
  listingLinks.forEach(link => { 
    if (link instanceof HTMLAnchorElement) {
      // Replace href with javascript:void(0) and update class
      link.href = "javascript:void(0);";
      link.classList.remove('open-popup');
      if (!link.classList.contains('events-modal-trigger')) {
        link.classList.add('events-modal-trigger');
      }
    }
  });
  if (listingLinks.length > 0) console.log(`[UpdateLinks] Updated ${listingLinks.length} '.cal-link-listing'.`);

  const icsLinks = document.querySelectorAll('.cal-link-ics');
  // We no longer set href directly, as ics-generator.js will handle clicks
  if (icsLinks.length > 0) console.log(`[UpdateLinks] Found ${icsLinks.length} '.cal-link-ics' links (handled by ics-generator.js).`);

  console.log(`[UpdateLinks] Link updates complete for state: ${state}`);
}

// --- REMOVED setupPopupLinks function ---

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  // Set up calendar links (runs once initially)
  updateCalendarLinks();

  // Watch for state changes and update links
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'data-state') {
        updateCalendarLinks();
        // NO need to re-run popup setup here anymore
      }
    });
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-state']
  });

  // --- ADDED Event Delegation for Popups ---
  document.body.addEventListener('click', function(event) {
    // First, check if this is a social media link - if so, let it handle naturally
    const socialLink = event.target.closest('.social-icons a, .social-link, a.external-link');
    if (socialLink) {
        // Ensure social links always open in a new tab
        if (!socialLink.getAttribute('target')) {
            socialLink.setAttribute('target', '_blank');
        }
        if (!socialLink.getAttribute('rel') || !socialLink.getAttribute('rel').includes('noopener')) {
            socialLink.setAttribute('rel', 'noopener');
        }
        // Let the default link behavior happen (open in new tab)
        console.log('Social/external link click detected, opening in new tab:', socialLink.href);
        return;
    }

    // Only process .open-popup links that are specifically for events
    const link = event.target.closest('a.open-popup');

    // Skip handling in the following cases:
    // 1. If link has target="_blank" (external links)
    // 2. If link has a specific href that indicates it's not an event link
    if (link && (
        link.getAttribute('target') === '_blank' ||
        link.classList.contains('social-link') ||
        link.classList.contains('external-link') ||
        link.href.includes('facebook.com') ||
        link.href.includes('instagram.com') ||
        link.href.includes('x.com') ||
        link.href.includes('twitter.com') ||
        link.href.includes('spotify.com') ||
        link.href.includes('linktr.ee')
    )) {
        // Let these links behave normally
        console.log('Skipping modal handler for external link:', link.href);
        return;
    }

    // For event-related .open-popup links only (backward compatibility)
    if (link && link instanceof HTMLAnchorElement && 
        link.href.includes('shows') || link.href.includes('events')) {
        event.preventDefault(); // Prevent default link navigation

        // Instead of opening a popup, trigger the events modal
        const eventModalTriggers = document.querySelectorAll('.events-modal-trigger');
        if (eventModalTriggers.length > 0) {
            // Simulate a click on the first events-modal-trigger
            eventModalTriggers[0].click();
        } else {
            console.warn("No events modal trigger found for compatibility redirect");
            
            // Fallback to the old behavior
            const url = link.getAttribute('href');
            if (!url) return; // No URL, do nothing

            const popupWidth = 800; // Adjusted size
            const popupHeight = 600;
            const left = (window.innerWidth - popupWidth) / 2;
            const top = (window.innerHeight - popupHeight) / 2;

            const popup = window.open(
              url,
              '_blank',
              `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );

            // Fallback if popup blocker prevents window.open
            if (!popup) {
               console.warn("Popup blocked? Attempting navigation in new tab.");
               window.open(url, '_blank');
            }
        }
    }
  }); // End event delegation listener

  // Set up iframe auto-resizing (keep as is)
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    iframe.addEventListener('load', function() {
      onIframeLoad(iframe);
    });
    // Also trigger resize if iframe already loaded (e.g., cached)
    if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
        onIframeLoad(iframe);
    }
  });
}); // End DOMContentLoaded

// Window resize handler for iframes (keep as is)
window.addEventListener('resize', function() {
  document.querySelectorAll('iframe').forEach(iframe => {
    if (iframe.contentWindow) {
      resizeIframe(iframe);
    }
  });
});

// --- REMOVED stray setupPopupLinks() call ---

