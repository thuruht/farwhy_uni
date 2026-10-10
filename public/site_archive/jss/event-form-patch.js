function setupEventFilters() {
  console.log('Setting up event filters');
  const venueFilter = document.getElementById('event-venue-filter');
  const searchInput = document.getElementById('event-search');
  if (!venueFilter || !searchInput) {
    console.error('Event filter elements not found');
    return;
  }
  const filterEvents = () => {
    const venueValue = venueFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();
    const eventRows = document.querySelectorAll('#event-list tr.event-row');
    let visibleCount = 0;
    eventRows.forEach((row) => {
      const rowClasses = row.className;
      const venue = rowClasses.includes('venue-farewell')
        ? 'farewell'
        : rowClasses.includes('venue-howdy')
          ? 'howdy'
          : '';
      const searchableText = row.textContent.toLowerCase();
      const matchesVenue = !venueValue || venue === venueValue || venueValue === 'all';
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
      const noResults = document.createElement('tr');
      noResults.className = 'empty-message';
      noResults.innerHTML = `<td colspan="6" class="text-center">No events match the current filters</td>`;
      const tbody = document.querySelector('#event-list tbody');
      if (tbody) tbody.appendChild(noResults);
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
    console.error('Blog filter elements not found');
    return;
  }
  const filterBlogPosts = () => {
    const statusValue = statusFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();
    const blogRows = document.querySelectorAll('#blog-list tr.blog-row');
    let visibleCount = 0;
    blogRows.forEach((row) => {
      const hasFeatured = row.querySelector('.featured-indicator') !== null;
      const searchableText = row.textContent.toLowerCase();
      const matchesStatus =
        !statusValue ||
        statusValue === 'all' ||
        (statusValue === 'featured' && hasFeatured) ||
        (statusValue === 'regular' && !hasFeatured);
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
      const noResults = document.createElement('tr');
      noResults.className = 'empty-message';
      noResults.innerHTML = `<td colspan="5" class="text-center">No blog posts match the current filters</td>`;
      const tbody = document.querySelector('#blog-list tbody');
      if (tbody) tbody.appendChild(noResults);
    } else if (visibleCount > 0 && emptyMessage) {
      emptyMessage.remove();
    }
  };
  statusFilter.addEventListener('change', filterBlogPosts);
  searchInput.addEventListener('input', filterBlogPosts);
  filterBlogPosts();
}
console.log(
  'event-form-patch: legacy onsubmit override has been disabled to avoid duplicate submissions'
);
