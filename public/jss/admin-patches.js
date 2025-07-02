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
const originalEventFormSubmit = window.submitEventForm || null;
window.submitEventForm = async function(formData) {
    console.log('Using patched event form submission to handle schema compatibility');
    
    try {
        // Create a safe copy of form data that won't break if schema fields are missing
        const safeFormData = { ...formData };
        
        // If we're getting database errors about missing columns, 
        // modify the request to exclude problematic fields
        // The migration script will add these columns, but until then,
        // we need to avoid sending fields that might cause errors
        
        // Check if we've successfully run the migration by setting a flag in localStorage
        const migrationRun = localStorage.getItem('event_schema_migrated') === 'true';
        
        if (!migrationRun) {
            // Remove fields that might not exist in the database yet
            // These will be properly handled once the migration runs
            console.log('Temporarily removing potentially problematic fields until migration completes');
            
            // Don't delete the data completely, just make a safe version for the API
            // Original data in the form will be preserved
            const apiSafeData = { ...safeFormData };
            delete apiSafeData.event_type;
            delete apiSafeData.performers;
            delete apiSafeData.tags;
            delete apiSafeData.external_links;
            
            console.log('Original form data:', safeFormData);
            console.log('API-safe form data:', apiSafeData);
            
            try {
                // Try to run migration automatically
                const migrationResponse = await fetch('/api/admin/migrate/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });
                
                if (migrationResponse.ok) {
                    console.log('Event schema migration successful!');
                    localStorage.setItem('event_schema_migrated', 'true');
                    // Now we can use the full data as the database is updated
                    return originalEventFormSubmit ? originalEventFormSubmit(safeFormData) : null;
                } else {
                    console.warn('Event schema migration failed or not available, using compatible form data');
                    // Use the reduced data set
                    return originalEventFormSubmit ? originalEventFormSubmit(apiSafeData) : null;
                }
            } catch (migrationError) {
                console.error('Error running migration:', migrationError);
                // Use the reduced data set
                return originalEventFormSubmit ? originalEventFormSubmit(apiSafeData) : null;
            }
        } else {
            // Migration already run successfully, use full data
            return originalEventFormSubmit ? originalEventFormSubmit(safeFormData) : null;
        }
    } catch (error) {
        console.error('Error in patched event form submission:', error);
        throw error;
    }
};

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
