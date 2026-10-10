function setupEventFilters() {
  console.log('Setting up event filters');
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
      noResults.className = 'empty-message';
      noResults.innerHTML = 'No events match the current filters';
      document.getElementById('event-list').appendChild(noResults);
    } else if (visibleCount > 0 && emptyMessage) {
      emptyMessage.remove();
    }
  };
  venueFilter.addEventListener('change', filterEvents);
  searchInput.addEventListener('input', filterEvents);
  filterEvents();
}
function setupBlogFilters() {
  console.log('Setting up blog filters');
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
      const isFeatured = row.querySelector('.featured-indicator') !== null;
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
      noResults.className = 'empty-message';
      noResults.innerHTML = 'No blog posts match the current filters';
      document.getElementById('blog-list').appendChild(noResults);
    } else if (visibleCount > 0 && emptyMessage) {
      emptyMessage.remove();
    }
  };
  statusFilter.addEventListener('change', filterBlogPosts);
  searchInput.addEventListener('input', filterBlogPosts);
  filterBlogPosts();
}
function patchApiWhenReady() {
  if (typeof window.api !== 'undefined' && window.api && window.api.post) {
    const originalPost = window.api.post;
    window.api.post = async function (endpoint, data) {
      if (endpoint === '/api/admin/events' && data) {
        console.log('Patching event submission data', data);
        const modifiedData = { ...data };
        if ('event_type' in modifiedData && typeof modifiedData.event_type === 'string') {
          console.log('Removing event_type field to prevent database error');
          delete modifiedData.event_type;
        }
        if ('performers' in modifiedData && typeof modifiedData.performers === 'string') {
          console.log('Removing performers field to prevent database error');
          delete modifiedData.performers;
        }
        if ('tags' in modifiedData && typeof modifiedData.tags === 'string') {
          console.log('Removing tags field to prevent database error');
          delete modifiedData.tags;
        }
        if ('external_links' in modifiedData && typeof modifiedData.external_links === 'string') {
          console.log('Removing external_links field to prevent database error');
          delete modifiedData.external_links;
        }
        console.log('Modified event data:', modifiedData);
        return originalPost.call(this, endpoint, modifiedData);
      }
      return originalPost.call(this, endpoint, data);
    };
  } else {
    setTimeout(patchApiWhenReady, 100);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', patchApiWhenReady);
} else {
  patchApiWhenReady();
}
console.log('Admin dashboard patch script loaded');
