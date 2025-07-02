// Admin Dashboard Patch Script
// This script adds missing functions and fixes event submission issues

// Add missing setupEventFilters function
function setupEventFilters() {
    console.log('Setting up event filters');
    
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
            // Get venue from class name
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
            noResults.className = 'empty-message';
            noResults.innerHTML = 'No events match the current filters';
            document.getElementById('event-list').appendChild(noResults);
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

// Add missing setupBlogFilters function
function setupBlogFilters() {
    console.log('Setting up blog filters');
    
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
            // Get featured status
            const isFeatured = row.querySelector('.featured-indicator') !== null;
            
            // Get searchable content (combine all text content)
            const searchableText = row.textContent.toLowerCase();
            
            // Check if row matches both filters
            const matchesStatus = !statusValue || 
                                 statusValue === 'all' || 
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
            noResults.className = 'empty-message';
            noResults.innerHTML = 'No blog posts match the current filters';
            document.getElementById('blog-list').appendChild(noResults);
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

// Fix for event form submission
// Patch the API post method to handle missing database columns
const originalPost = api.post;
api.post = async function(endpoint, data) {
    // Check if this is an event submission
    if (endpoint === '/api/admin/events' && data) {
        console.log('Patching event submission data', data);
        
        // Create a modified data object without potentially problematic fields
        const modifiedData = { ...data };
        
        // Check for database schema incompatibility and fix
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
        
        // Call original post method with modified data
        return originalPost.call(this, endpoint, modifiedData);
    }
    
    // For non-event submissions, call original method
    return originalPost.call(this, endpoint, data);
};

console.log('Admin dashboard patch script loaded');
