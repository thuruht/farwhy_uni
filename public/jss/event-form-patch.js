/**
 * setupEventFilters - Implements event filtering functionality for the event list
 * Adds event listeners to filter elements and handles filtering of events
 */
function setupEventFilters() {
    console.log('Setting up event filters');
    
    // Get filter elements
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    
    if (!venueFilter || !searchInput) {
        console.error('Event filter elements not found');
        return;
    }
    
    // Filter function to apply both venue and search filters
    const filterEvents = () => {
        const venueValue = venueFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
        
        // Get all event rows
        const eventRows = document.querySelectorAll('#event-list tr.event-row');
        let visibleCount = 0;
        
        eventRows.forEach(row => {
            // Get venue from row class
            const rowClasses = row.className;
            const venue = rowClasses.includes('venue-farewell') ? 'farewell' : 
                         rowClasses.includes('venue-howdy') ? 'howdy' : '';
            
            // Get searchable content (combine all text content)
            const searchableText = row.textContent.toLowerCase();
            
            // Check if row matches both filters
            const matchesVenue = !venueValue || venue === venueValue || venueValue === 'all';
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            
            // Show/hide based on filter match
            if (matchesVenue && matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update UI to show filter results
        const emptyMessage = document.querySelector('#event-list .empty-message');
        if (visibleCount === 0 && !emptyMessage) {
            // Add message when no events match filters
            const noResults = document.createElement('tr');
            noResults.className = 'empty-message';
            noResults.innerHTML = `<td colspan="6" class="text-center">No events match the current filters</td>`;
            const tbody = document.querySelector('#event-list tbody');
            if (tbody) tbody.appendChild(noResults);
        } else if (visibleCount > 0 && emptyMessage) {
            // Remove message when events are visible
            emptyMessage.remove();
        }
    };
    
    // Add event listeners
    venueFilter.addEventListener('change', filterEvents);
    searchInput.addEventListener('input', filterEvents);
    
    // Initial filter application
    filterEvents();
}

/**
 * setupBlogFilters - Implements blog post filtering functionality
 * Adds event listeners to filter elements and handles filtering of blog posts
 */
function setupBlogFilters() {
    console.log('Setting up blog filters');
    
    // Get filter elements
    const statusFilter = document.getElementById('blog-status-filter');
    const searchInput = document.getElementById('blog-search');
    
    if (!statusFilter || !searchInput) {
        console.error('Blog filter elements not found');
        return;
    }
    
    // Filter function to apply both status and search filters
    const filterBlogPosts = () => {
        const statusValue = statusFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
        
        // Get all blog rows
        const blogRows = document.querySelectorAll('#blog-list tr.blog-row');
        let visibleCount = 0;
        
        blogRows.forEach(row => {
            // Get featured status
            const hasFeatured = row.querySelector('.featured-indicator') !== null;
            
            // Get searchable content (combine all text content)
            const searchableText = row.textContent.toLowerCase();
            
            // Check if row matches both filters
            const matchesStatus = !statusValue || 
                                 (statusValue === 'all') || 
                                 (statusValue === 'featured' && hasFeatured) ||
                                 (statusValue === 'regular' && !hasFeatured);
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            
            // Show/hide based on filter match
            if (matchesStatus && matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update UI to show filter results
        const emptyMessage = document.querySelector('#blog-list .empty-message');
        if (visibleCount === 0 && !emptyMessage) {
            // Add message when no blog posts match filters
            const noResults = document.createElement('tr');
            noResults.className = 'empty-message';
            noResults.innerHTML = `<td colspan="5" class="text-center">No blog posts match the current filters</td>`;
            const tbody = document.querySelector('#blog-list tbody');
            if (tbody) tbody.appendChild(noResults);
        } else if (visibleCount > 0 && emptyMessage) {
            // Remove message when blog posts are visible
            emptyMessage.remove();
        }
    };
    
    // Add event listeners
    statusFilter.addEventListener('change', filterBlogPosts);
    searchInput.addEventListener('input', filterBlogPosts);
    
    // Initial filter application
    filterBlogPosts();
}

/**
 * Temporary event form patch for database compatibility
 * This code should be injected into the admin-unified.js file to handle the
 * missing database columns without causing errors
 */
// Legacy onsubmit override removed.
//
// Previously this file overwrote the form's `onsubmit` handler and performed a
// direct fetch to `/api/admin/events`. That caused duplicate POSTs when the
// modern `addEventListener('submit', ...)` handler in `admin-unified.js` also
// ran (one before flyer upload, producing an event without the image, and one
// after). To prevent double-creation of events we intentionally leave this
// file present as a compatibility stub but DO NOT attach a legacy onsubmit
// handler. If a compatibility shim is required in the future, implement a
// guarded wrapper that checks `form.dataset.processing === '1'` or similar so
// it never triggers when the modern handler is active.

console.log('event-form-patch: legacy onsubmit override has been disabled to avoid duplicate submissions');

// Example guarded shim (commented out) for future reference:
/*
const form = document.querySelector('#event-form');
if (form && !form.dataset.legacyPatched) {
  form.dataset.legacyPatched = '1';
  form.onsubmit = function(e) {
    // If the modern handler is processing, skip legacy submission
    if (form.dataset.processing === '1') return;
    // Otherwise, you could implement a safe, synchronous shim here.
  };
}
*/

// End of compatibility patch (no legacy onsubmit handler attached)
