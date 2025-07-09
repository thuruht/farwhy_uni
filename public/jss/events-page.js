/**
 * events-page.js - Dedicated JavaScript for the full events page
 * Created as part of Changelog v2.1.1 - July 7, 2025
 * Implements a modern, simplified event list and filtering interface
 */

// SAFE DATE PARSING (handles both ISO strings and local dates)
function parseEventDate(dateString) {
  // If date is in format "YYYY-MM-DD"
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateString.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  // For full ISO strings or other formats
  const d = new Date(dateString);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// UNIVERSAL COMPARISON LOGIC
function isPastEvent(eventDate, referenceDate = new Date()) {
  const eventDay = parseEventDate(eventDate);
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  
  return eventDay < referenceDay;
}

function isTodayEvent(eventDate, referenceDate = new Date()) {
  const eventDay = parseEventDate(eventDate);
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  
  return eventDay.getTime() === referenceDay.getTime();
}

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const eventsGrid = document.getElementById('events-grid');
    const venueButtons = document.querySelectorAll('.btn-venue');
    const showButtons = document.querySelectorAll('.btn-show');
    
    // State
    let events = [];
    let currentVenue = 'farewell'; // Default to farewell
    let currentShowType = 'upcoming'; // Default to upcoming
    
    // Initialize
    init();
    
    async function init() {
        // Show loading state
        showLoading();
        
        // Set up event listeners
        setupEventListeners();
        
        // Fetch events
        await fetchEvents();
        
        // Render events with initial filters
        filterAndRenderEvents();
    }
    
    function setupEventListeners() {
        // Venue filter buttons
        venueButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Only proceed if this isn't already the active button
                if (!this.classList.contains('active')) {
                    // Update UI
                    venueButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update state
                    currentVenue = this.dataset.venue;
                    
                    // Re-render with new filter
                    filterAndRenderEvents();
                }
            });
        });
        
        // Show type filter buttons (upcoming/archived)
        showButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Only proceed if this isn't already the active button
                if (!this.classList.contains('active')) {
                    // Update UI
                    showButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update state
                    currentShowType = this.dataset.show;
                    
                    // Re-render with new filter
                    filterAndRenderEvents();
                }
            });
        });
        
        // Event delegation for modal opening/closing
        document.addEventListener('click', function(e) {
            // Close modal when clicking outside content or on close button
            if (e.target.classList.contains('event-modal') || 
                e.target.classList.contains('close-modal')) {
                closeEventModal();
            }
            
            // Open modal when clicking on details button
            const detailsButton = e.target.closest('.btn-details');
            if (detailsButton) {
                const eventId = detailsButton.dataset.id;
                if (eventId) {
                    openEventModal(eventId);
                }
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeEventModal();
            }
        });
    }
    
    async function fetchEvents() {
        try {
            // Add cache-busting parameter
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/events/all?t=${timestamp}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            
            events = await response.json();
            console.log(`Loaded ${events.length} events`);
            
        } catch (error) {
            console.error('Error fetching events:', error);
            events = [];
            showError('Failed to load events. Please try again later.');
        }
    }
    
    function filterAndRenderEvents() {
        // Filter events based on current settings
        const filteredEvents = events.filter(event => {
            // Filter by venue
            const matchesVenue = event.venue === currentVenue;
            
            // DEBUG: Log the raw event date for inspection
            console.log('Filtering - RAW EVENT DATE:', event.date, 'TYPE:', typeof event.date);
            
            // Use the utility functions for consistent date handling
            const isPast = isPastEvent(event.date);
            const isToday = isTodayEvent(event.date);
            
            // Event is upcoming if it's NOT past OR it's today
            const isUpcoming = !isPast || isToday;
            
            const matchesShowType = (currentShowType === 'upcoming' && isUpcoming) || 
                                  (currentShowType === 'archived' && !isUpcoming);
            
            // Debug output
            console.log(`Filtering ${event.title}: venue=${matchesVenue}, isPast=${isPast}, isToday=${isToday}, isUpcoming=${isUpcoming}, matchesShowType=${matchesShowType}`);
            
            return matchesVenue && matchesShowType;
        });
        
        // Sort events - upcoming events by date ascending, archived by date descending
        filteredEvents.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (currentShowType === 'upcoming') {
                // For upcoming, show closest events first
                return dateA - dateB;
            } else {
                // For archived, show most recent events first
                return dateB - dateA;
            }
        });
        
        // Render the filtered events
        renderEvents(filteredEvents);
    }
    
    function renderEvents(filteredEvents) {
        // Clear the events grid
        eventsGrid.innerHTML = '';
        
        // If no events match the filters
        if (filteredEvents.length === 0) {
            const noEvents = document.createElement('div');
            noEvents.className = 'no-events';
            
            const message = currentShowType === 'upcoming' 
                ? `No upcoming events at ${currentVenue.toUpperCase()}` 
                : `No past events at ${currentVenue.toUpperCase()}`;
            
            noEvents.textContent = message;
            eventsGrid.appendChild(noEvents);
            return;
        }
        
        // Create a card for each event
        filteredEvents.forEach(event => {
            const eventCard = createEventCard(event);
            eventsGrid.appendChild(eventCard);
        });
    }
    
    function createEventCard(event) {
        // DEBUG: Log the raw event date for inspection
        console.log('RAW EVENT DATE:', event.date, 'TYPE:', typeof event.date);
        
        // Use the utility functions for consistent date handling
        const isPast = isPastEvent(event.date);
        const isToday = isTodayEvent(event.date);
        
        // Debug output for thorough diagnosis
        console.log(`Event: ${event.title}`);
        console.log('Parsed event date:', parseEventDate(event.date));
        console.log('Today at midnight:', new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
        console.log('isPast:', isPast, 'isToday:', isToday);
        
        // Only mark as past if it's truly past (not today)
        const isTrulyPast = isPast && !isToday;
        
        // Create card container
        const card = document.createElement('div');
        card.className = `event-card venue-${event.venue}`;
        if (isTrulyPast) {
            card.classList.add('past-event');
        }
        
        // Add venue tag
        const venueTag = document.createElement('div');
        venueTag.className = 'event-venue-tag';
        venueTag.textContent = event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY';
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'event-image';
        
        const image = document.createElement('img');
        image.src = event.imageUrl || event.flyer_image_url || './img/placeholder-event.jpg';
        image.alt = `Flyer for ${event.title}`;
        image.onerror = function() {
            this.src = './img/placeholder-event.jpg';
        };
        
        imageContainer.appendChild(image);
        imageContainer.appendChild(venueTag);
        
        // Create event details
        const details = document.createElement('div');
        details.className = 'event-details';
        
        const date = document.createElement('div');
        date.className = 'event-date';
        date.textContent = formatDate(event.date) + (event.time ? ` | ${event.time}` : '');
        
        const title = document.createElement('h3');
        title.className = 'event-title';
        title.textContent = event.title;
        
        const description = document.createElement('div');
        description.className = 'event-description';
        description.textContent = event.description || 'No description available.';
        
        // Create action buttons
        const actions = document.createElement('div');
        actions.className = 'event-actions';
        
        const detailsButton = document.createElement('button');
        detailsButton.className = 'btn-details';
        detailsButton.textContent = 'Details';
        detailsButton.dataset.id = event.id;
        
        actions.appendChild(detailsButton);
        
        // Add ticket button if available
        if (event.ticketLink || event.url) {
            const ticketButton = document.createElement('a');
            ticketButton.className = 'btn-tickets';
            ticketButton.textContent = event.ticketLink ? 'Tickets' : 'Event Link';
            ticketButton.href = event.ticketLink || event.url;
            ticketButton.target = '_blank';
            ticketButton.rel = 'noopener noreferrer';
            
            actions.appendChild(ticketButton);
        }
        
        // Assemble the card
        details.append(date, title, description, actions);
        card.append(imageContainer, details);
        
        return card;
    }
    
    function openEventModal(eventId) {
        // Find the event
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        // Create the modal if it doesn't exist
        let modal = document.querySelector('.event-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'event-modal';
            
            const content = document.createElement('div');
            content.className = 'event-modal-content';
            
            const closeButton = document.createElement('span');
            closeButton.className = 'close-modal';
            closeButton.innerHTML = '&times;';
            
            content.appendChild(closeButton);
            modal.appendChild(content);
            document.body.appendChild(modal);
        }
        
        // Get the content container
        const content = modal.querySelector('.event-modal-content');
        content.innerHTML = '';
        
        // Add close button
        const closeButton = document.createElement('span');
        closeButton.className = 'close-modal';
        closeButton.innerHTML = '&times;';
        content.appendChild(closeButton);
        
        // Add event image
        const image = document.createElement('img');
        image.className = 'modal-image';
        image.src = event.imageUrl || event.flyer_image_url || './img/placeholder-event.jpg';
        image.alt = `Flyer for ${event.title}`;
        image.onerror = function() {
            this.src = './img/placeholder-event.jpg';
        };
        
        // Add event title
        const title = document.createElement('h2');
        title.className = 'modal-title';
        title.textContent = event.title;
        
        // Add date and venue
        const dateVenue = document.createElement('div');
        dateVenue.className = 'modal-date-venue';
        
        const dateSpan = document.createElement('span');
        dateSpan.innerHTML = `<i class="icon-calendar"></i> ${formatDate(event.date)}`;
        
        const timeSpan = document.createElement('span');
        timeSpan.innerHTML = `<i class="icon-clock"></i> ${event.time || 'TBA'}`;
        
        const venueSpan = document.createElement('span');
        venueSpan.innerHTML = `<i class="icon-location"></i> ${event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY'}`;
        
        dateVenue.append(dateSpan, timeSpan, venueSpan);
        
        // Add description
        const description = document.createElement('div');
        description.className = 'modal-description';
        description.textContent = event.description || 'No description available.';
        
        // Add details section
        const details = document.createElement('div');
        details.className = 'modal-details';
        
        // Add age restriction if available
        if (event.ageRestriction) {
            const ageItem = document.createElement('div');
            ageItem.className = 'modal-details-item';
            
            const ageLabel = document.createElement('div');
            ageLabel.className = 'modal-details-label';
            ageLabel.textContent = 'Age:';
            
            const ageValue = document.createElement('div');
            ageValue.textContent = event.ageRestriction;
            
            ageItem.append(ageLabel, ageValue);
            details.appendChild(ageItem);
        }
        
        // Add price if available
        if (event.price) {
            const priceItem = document.createElement('div');
            priceItem.className = 'modal-details-item';
            
            const priceLabel = document.createElement('div');
            priceLabel.className = 'modal-details-label';
            priceLabel.textContent = 'Price:';
            
            const priceValue = document.createElement('div');
            priceValue.textContent = event.price;
            
            priceItem.append(priceLabel, priceValue);
            details.appendChild(priceItem);
        }
        
        // Add actions
        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        
        // Add ticket button if available
        if (event.ticketLink || event.url) {
            const actionButton = document.createElement('a');
            actionButton.className = 'btn-tickets';
            actionButton.textContent = event.ticketLink ? 'Buy Tickets' : 'Event Website';
            actionButton.href = event.ticketLink || event.url;
            actionButton.target = '_blank';
            actionButton.rel = 'noopener noreferrer';
            
            actions.appendChild(actionButton);
        }
        
        // Assemble the modal
        content.append(closeButton, image, title, dateVenue, description);
        
        // Only add details section if it has content
        if (details.children.length > 0) {
            content.appendChild(details);
        }
        
        // Only add actions if there are actions
        if (actions.children.length > 0) {
            content.appendChild(actions);
        }
        
        // Show the modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    function closeEventModal() {
        const modal = document.querySelector('.event-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    function showLoading() {
        eventsGrid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">Loading events...</div>
            </div>
        `;
    }
    
    function showError(message) {
        eventsGrid.innerHTML = `
            <div class="no-events">
                <div>⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'TBD';
        
        try {
            // Create a Date object from the date string
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) return dateString;
            
            // Format options
            const options = { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric'
            };
            
            // Format the date
            return date.toLocaleDateString('en-US', options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }
});
