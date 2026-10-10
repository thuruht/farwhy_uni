if (typeof setupEventFilters !== 'function') {
  console.log('Adding missing setupEventFilters function');
  function setupEventFilters() {
    console.log('Setting up event filters (patched function)');
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    if (!venueFilter || !searchInput) {
      console.warn('Event filter elements not found');
      return;
    }
    const filterEvents = () => {
      const venueValue = venueFilter.value.toLowerCase();
      const searchValue = searchInput.value.toLowerCase();
      const eventRows = document.querySelectorAll('#event-list tr.event-row');
      let visibleCount = 0;
      eventRows.forEach((row) => {
        const venue = row.classList.contains('venue-farewell')
          ? 'farewell'
          : row.classList.contains('venue-howdy')
            ? 'howdy'
            : '';
        const searchableText = row.textContent.toLowerCase();
        const matchesVenue = !venueValue || venueValue === 'all' || venue === venueValue;
        const matchesSearch = !searchValue || searchableText.includes(searchValue);
        if (matchesVenue && matchesSearch) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });
      const emptyMessage = document.querySelector('#event-list .empty-message');
      if (visibleCount === 0 && !emptyMessage) {
        const noResults = document.createElement('div');
        noResults.className = 'empty-message status-message status-info';
        noResults.textContent = 'No events match the current filters';
        document.getElementById('event-list').appendChild(noResults);
      } else if (visibleCount > 0 && emptyMessage) {
        emptyMessage.remove();
      }
    };
    if (venueFilter) venueFilter.addEventListener('change', filterEvents);
    if (searchInput) searchInput.addEventListener('input', filterEvents);
    filterEvents();
  }
  window.setupEventFilters = setupEventFilters;
}
if (typeof setupBlogFilters !== 'function') {
  console.log('Adding missing setupBlogFilters function');
  function setupBlogFilters() {
    console.log('Setting up blog filters (patched function)');
    const statusFilter = document.getElementById('blog-status-filter');
    const searchInput = document.getElementById('blog-search');
    if (!statusFilter || !searchInput) {
      console.warn('Blog filter elements not found');
      return;
    }
    const filterBlogPosts = () => {
      const statusValue = statusFilter.value.toLowerCase();
      const searchValue = searchInput.value.toLowerCase();
      const blogRows = document.querySelectorAll('#blog-list tr.blog-row');
      let visibleCount = 0;
      blogRows.forEach((row) => {
        const isFeatured =
          row.innerHTML.includes('Featured') || row.classList.contains('blog-featured');
        const searchableText = row.textContent.toLowerCase();
        const matchesStatus =
          !statusValue ||
          statusValue === 'all' ||
          (statusValue === 'featured' && isFeatured) ||
          (statusValue === 'regular' && !isFeatured);
        const matchesSearch = !searchValue || searchableText.includes(searchValue);
        if (matchesStatus && matchesSearch) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });
      const emptyMessage = document.querySelector('#blog-list .empty-message');
      if (visibleCount === 0 && !emptyMessage) {
        const noResults = document.createElement('div');
        noResults.className = 'empty-message status-message status-info';
        noResults.textContent = 'No blog posts match the current filters';
        document.getElementById('blog-list').appendChild(noResults);
      } else if (visibleCount > 0 && emptyMessage) {
        emptyMessage.remove();
      }
    };
    if (statusFilter) statusFilter.addEventListener('change', filterBlogPosts);
    if (searchInput) searchInput.addEventListener('input', filterBlogPosts);
    filterBlogPosts();
  }
  window.setupBlogFilters = setupBlogFilters;
}
const originalShowEventForm = window.showEventForm;
if (originalShowEventForm) {
  window.showEventForm = function (eventId) {
    console.log('Using patched showEventForm to handle form submission safely');
    originalShowEventForm(eventId);
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
      const newForm = eventForm.cloneNode(true);
      eventForm.parentNode.replaceChild(newForm, eventForm);
      newForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('Event form submitted through patched handler');
        const formData = new FormData(newForm);
        const eventData = {
          venue: formData.get('venue'),
          title: formData.get('title'),
          date: formData.get('date'),
          description: formData.get('description'),
          price: formData.get('price'),
          age_restriction: formData.get('age_restriction'),
          ticket_url: formData.get('ticket_url'),
          flyer_image_url: formData.get('flyer_image_url'),
        };
        await window.submitEventForm(eventData);
      });
    }
  };
}
const originalFetch = window.fetch;
window.fetch = function (url, options) {
  if (options && options.method === 'POST' && url === '/api/admin/events') {
    try {
      const body = JSON.parse(options.body);
      const updatedBody = { ...body };
      delete updatedBody.event_type;
      console.log('Event data patched to handle missing columns', {
        original: body,
        updated: updatedBody,
      });
      options.body = JSON.stringify(updatedBody);
    } catch (e) {
      console.error('Error patching event data:', e);
    }
  }
  return originalFetch.apply(this, arguments);
};
console.log('Admin dashboard patches loaded successfully');
