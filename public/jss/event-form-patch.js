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
// Override the existing event form submit handler to strip event_type
const originalEventFormSubmit = document.querySelector('#event-form')?.onsubmit;
if (document.querySelector('#event-form')) {
    document.querySelector('#event-form').onsubmit = function(e) {
        e.preventDefault();
        
        // Log the form submission
        console.log('Event form submission patched to handle missing columns');
        
        // Get form data
        const formData = new FormData(this);
        const eventData = {};
        
        // Process form data
        for (const [key, value] of formData.entries()) {
            eventData[key] = value;
        }
        
        // Remove fields that don't exist in the database schema
        delete eventData.event_type;
        delete eventData.performers;
        delete eventData.tags;
        delete eventData.external_links;
        
        // Handle image URL conversions (preserve this functionality)
        if (eventData.flyer_image_url && eventData.flyer_image_url.startsWith('http')) {
            // Extract relative path from absolute URL
            const url = new URL(eventData.flyer_image_url);
            eventData.flyer_image_url = url.pathname;
        }
        
        // Make API request
        fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Event created successfully:', data);
            
            // Close modal
            document.getElementById('form-modal').classList.remove('active');
            
            // Show success message
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                const toast = document.createElement('div');
                toast.className = 'toast toast-success';
                toast.textContent = 'Event created successfully';
                toastContainer.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toastContainer.removeChild(toast), 300);
                }, 3000);
            }
            
            // Reload events
            if (typeof loadEvents === 'function') {
                loadEvents();
            }
        })
        .catch(error => {
            console.error('Error creating event:', error);
            
            // Show error message
            const toastContainer = document.getElementById('toast-container');
            if (toastContainer) {
                const toast = document.createElement('div');
                toast.className = 'toast toast-error';
                toast.textContent = `Error: ${error.message}`;
                toastContainer.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toastContainer.removeChild(toast), 300);
                }, 3000);
            }
        });
        
        return false; // Prevent default form submission
    };
}
