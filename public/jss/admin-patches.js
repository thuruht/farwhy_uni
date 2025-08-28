// admin-patches.js - Safe patches for admin dashboard functionality
// This script adds missing functions and handles database schema compatibility

// Fix for missing setupEventFilters function
if (typeof setupEventFilters !== 'function') {
    console.log('Adding missing setupEventFilters function');
    function setupEventFilters() {
        console.log('Setting up event filters (patched function)');
        
        // Get filter elements
        const venueFilter = document.getElementById('event-venue-filter');
        const searchInput = document.getElementById('event-search');
        
        if (!venueFilter || !searchInput) {
            console.warn('Event filter elements not found');
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
                // Get venue from class or data attribute
                const venue = row.classList.contains('venue-farewell') ? 'farewell' : 
                              row.classList.contains('venue-howdy') ? 'howdy' : '';
                
                // Get searchable content (combine all text content)
                const searchableText = row.textContent.toLowerCase();
                
                // Check if row matches both filters
                const matchesVenue = !venueValue || venueValue === 'all' || venue === venueValue;
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
                const noResults = document.createElement('div');
                noResults.className = 'empty-message status-message status-info';
                noResults.textContent = 'No events match the current filters';
                document.getElementById('event-list').appendChild(noResults);
            } else if (visibleCount > 0 && emptyMessage) {
                // Remove message when events are visible
                emptyMessage.remove();
            }
        };
        
        // Add event listeners
        if (venueFilter) venueFilter.addEventListener('change', filterEvents);
        if (searchInput) searchInput.addEventListener('input', filterEvents);
        
        // Initial filter application
        filterEvents();
    }
    
    // Make it globally available
    window.setupEventFilters = setupEventFilters;
}

// Fix for missing setupBlogFilters function
if (typeof setupBlogFilters !== 'function') {
    console.log('Adding missing setupBlogFilters function');
    function setupBlogFilters() {
        console.log('Setting up blog filters (patched function)');
        
        // Get filter elements
        const statusFilter = document.getElementById('blog-status-filter');
        const searchInput = document.getElementById('blog-search');
        
        if (!statusFilter || !searchInput) {
            console.warn('Blog filter elements not found');
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
                // Get featured status from the row content
                const isFeatured = row.innerHTML.includes('Featured') || row.classList.contains('blog-featured');
                
                // Get searchable content (combine all text content)
                const searchableText = row.textContent.toLowerCase();
                
                // Check if row matches both filters
                const matchesStatus = !statusValue || 
                                    (statusValue === 'all') || 
                                    (statusValue === 'featured' && isFeatured) ||
                                    (statusValue === 'regular' && !isFeatured);
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
                const noResults = document.createElement('div');
                noResults.className = 'empty-message status-message status-info';
                noResults.textContent = 'No blog posts match the current filters';
                document.getElementById('blog-list').appendChild(noResults);
            } else if (visibleCount > 0 && emptyMessage) {
                // Remove message when blog posts are visible
                emptyMessage.remove();
            }
        };
        
        // Add event listeners
        if (statusFilter) statusFilter.addEventListener('change', filterBlogPosts);
        if (searchInput) searchInput.addEventListener('input', filterBlogPosts);
        
        // Initial filter application
        filterBlogPosts();
    }
    
    // Make it globally available
    window.setupBlogFilters = setupBlogFilters;
}

// Patch for the event form submission to handle database schema issues
// NOTE: The legacy onsubmit override that performed a direct POST to
// `/api/admin/events` was removed because it ran in parallel with the
// modern `addEventListener('submit', ...)` handler in `admin-unified.js`.
//
// That duplicate handling caused two POSTs: one before the flyer upload
// completed (resulting in an event without an image) and another after the
// upload. Event creation is now handled centrally by the submit handler
// attached in `admin-unified.js` (which uploads the flyer, updates the
// form data, and then calls the API). Keeping the legacy override here
// risks double-creating events, so it has been intentionally removed.

// If we need to reintroduce a compatibility shim, do so by adding a guarded
// wrapper that detects if the modern handler already processed the submission
// (for example by checking `form.dataset.submitted === '1'`) to avoid duplicate
// requests.

// Patch the event creation function to use our safe submission handler
const originalShowEventForm = window.showEventForm;
if (originalShowEventForm) {
    window.showEventForm = function(eventId) {
        console.log('Using patched showEventForm to handle form submission safely');
        
        // Call the original function to set up the form
        originalShowEventForm(eventId);
        
        // Find the form element
        const eventForm = document.getElementById('event-form');
        if (eventForm) {
            // Remove any existing listeners to avoid duplicates
            const newForm = eventForm.cloneNode(true);
            eventForm.parentNode.replaceChild(newForm, eventForm);
            
            // Add our safe submission handler
            newForm.addEventListener('submit', async function(e) {
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
                    flyer_image_url: formData.get('flyer_image_url')
                };
                
                // Use our patched submission function
                await window.submitEventForm(eventData);
            });
        }
    };
}

// Fix for events table missing event_type column
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    // Only intercept POST requests to the events endpoint
    if (options && options.method === 'POST' && url === '/api/admin/events') {
        try {
            // Parse the request body
            const body = JSON.parse(options.body);
            
            // Create a new body with the event_type field removed to prevent DB errors
            const updatedBody = { ...body };
            delete updatedBody.event_type; // Remove the field causing the error
            
            // Log the changes
            console.log('Event data patched to handle missing columns', { 
                original: body, 
                updated: updatedBody 
            });
            
            // Update the options with the new body
            options.body = JSON.stringify(updatedBody);
        } catch (e) {
            console.error('Error patching event data:', e);
        }
    }
    
    // Call the original fetch with possibly modified options
    return originalFetch.apply(this, arguments);
};

console.log('Admin dashboard patches loaded successfully');
