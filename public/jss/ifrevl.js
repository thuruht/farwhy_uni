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
function generateUrls(state) {
  const baseUrl = window.location.hostname;
  const eventPathBase = state === 'howdy' ? 'hyevent' : 'fwevent';
  return {
    showListings: `https://${baseUrl}/${eventPathBase}/`,
    icsFile: `https://${baseUrl}/${eventPathBase}/calendar.ics`,
  };
}
function updateCalendarLinks() {
  const state = document.body.dataset.state || 'farewell';
  const urls = generateUrls(state);
  const credEtDiv = document.getElementById('credEt');
  if (credEtDiv) {
    const mainBlockHtml = `\n<div>\n<hr> || <a href="javascript:void(0);" class="events-modal-trigger"><b>VIEW ALL EVENTS</b></a> ||\n<p><small>calendar graphic (and the other swell graphics and general layout of this site) designed by the excellent <a href="https://austinchapmandesign.com/" target="_blank" rel="noopener">austin chapman</a> - however, any parts of the site that you dislike, that are animated annoyingly, bitcrushed, badly implemented, or the like, may instead be blamed on me (<a href="https://ntapkc.com" target="_blank" rel="noopener">jojo</a>), with the exception of show/event flyers, which are variously sourced</small></p>\n</div>\n    `;
    credEtDiv.innerHTML = mainBlockHtml;
    const newModalTriggers = credEtDiv.querySelectorAll('.events-modal-trigger');
    newModalTriggers.forEach((link) => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        if (typeof openEventsPopup === 'function') openEventsPopup();
      });
    });
    console.log('[UpdateLinks] Updated #credEt block and attached event listeners.');
  } else {
    console.warn('[UpdateLinks] Element with id="credEt" not found.');
  }
  const listingLinks = document.querySelectorAll('.cal-link-listing');
  listingLinks.forEach((link) => {
    if (link instanceof HTMLAnchorElement) {
      link.href = 'javascript:void(0);';
      link.classList.remove('open-popup');
      if (!link.classList.contains('events-modal-trigger')) {
        link.classList.add('events-modal-trigger');
      }
    }
  });
  if (listingLinks.length > 0)
    console.log(`[UpdateLinks] Updated ${listingLinks.length} '.cal-link-listing'.`);
  const icsLinks = document.querySelectorAll('.cal-link-ics');
  if (icsLinks.length > 0)
    console.log(
      `[UpdateLinks] Found ${icsLinks.length} '.cal-link-ics' links (handled by ics-generator.js).`
    );
  console.log(`[UpdateLinks] Link updates complete for state: ${state}`);
}
document.addEventListener('DOMContentLoaded', function () {
  updateCalendarLinks();
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'data-state') {
        updateCalendarLinks();
      }
    });
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
  document.body.addEventListener('click', function (event) {
    const socialLink = event.target.closest('.social-icons a, .social-link, a.external-link');
    if (socialLink) {
      if (!socialLink.getAttribute('target')) {
        socialLink.setAttribute('target', '_blank');
      }
      if (!socialLink.getAttribute('rel') || !socialLink.getAttribute('rel').includes('noopener')) {
        socialLink.setAttribute('rel', 'noopener');
      }
      console.log('Social/external link click detected, opening in new tab:', socialLink.href);
      return;
    }
    const link = event.target.closest('a.open-popup');
    if (
      link &&
      (link.getAttribute('target') === '_blank' ||
        link.classList.contains('social-link') ||
        link.classList.contains('external-link') ||
        link.href.includes('facebook.com') ||
        link.href.includes('instagram.com') ||
        link.href.includes('x.com') ||
        link.href.includes('twitter.com') ||
        link.href.includes('spotify.com') ||
        link.href.includes('linktr.ee'))
    ) {
      console.log('Skipping modal handler for external link:', link.href);
      return;
    }
    if (
      link &&
      link instanceof HTMLAnchorElement &&
      (link.href.includes('shows') || link.href.includes('events'))
    ) {
      event.preventDefault();
      const eventModalTriggers = document.querySelectorAll('.events-modal-trigger');
      if (eventModalTriggers.length > 0) {
        eventModalTriggers[0].click();
      } else {
        console.warn('No events modal trigger found for compatibility redirect');
        const url = link.getAttribute('href');
        if (!url) return;
        const popupWidth = 800;
        const popupHeight = 600;
        const left = (window.innerWidth - popupWidth) / 2;
        const top = (window.innerHeight - popupHeight) / 2;
        const popup = window.open(
          url,
          '_blank',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );
        if (!popup) {
          console.warn('Popup blocked? Attempting navigation in new tab.');
          window.open(url, '_blank');
        }
      }
    }
  });
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    iframe.addEventListener('load', function () {
      onIframeLoad(iframe);
    });
    if (iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
      onIframeLoad(iframe);
    }
  });
});
window.addEventListener('resize', function () {
  document.querySelectorAll('iframe').forEach((iframe) => {
    if (iframe.contentWindow) {
      resizeIframe(iframe);
    }
  });
});
