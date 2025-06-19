// events-modal.js - Unified Events Modal functionality
// Implements the interactive modal that combines event listings and flyers

(function() {
  // DOM references
  let modalOverlay;
  let eventsModal;
  let eventsList;
  let eventDetails;
  let venueFilterTabs;
  let closeButton;
  
  // State management
  let allEvents = [];
  let displayedEvents = [];
  let currentVenue = 'farewell'; // Default venue
  let selectedEventId = null;
  
  // --------------------------
  // Initialization
  // --------------------------
  document.addEventListener('DOMContentLoaded', () => {
    createModalStructure();
    setupEventListeners();
    
    // Trigger modal when clicking show listings or calendar image
    const listingLinks = document.querySelectorAll('.open-popup, #calendar img');
    listingLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });
  });
  
  // --------------------------
  // Modal Structure Creation
  // --------------------------
  function createModalStructure() {
    // Create the modal overlay
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'events-modal-overlay';
    
    // Create the modal container
    eventsModal = document.createElement('div');
    eventsModal.className = 'events-modal';
    
    // Create the modal header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'events-modal-header';
    
    const modalTitle = document.createElement('h2');
    modalTitle.className = 'events-modal-title';
    modalTitle.textContent = 'UPCOMING SHOWS';
    
    closeButton = document.createElement('button');
    closeButton.className = 'events-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    
    modalHeader.appendChild(modalTitle);
    
    // Create venue filter tabs
    const venueFilter = document.createElement('div');
    venueFilter.className = 'venue-filter';
    
    const farewellTab = document.createElement('button');
    farewellTab.className = 'venue-tab active';
    farewellTab.dataset.venue = 'farewell';
    farewellTab.textContent = 'FAREWELL';
    
    const howdyTab = document.createElement('button');
    howdyTab.className = 'venue-tab';
    howdyTab.dataset.venue = 'howdy';
    howdyTab.textContent = 'HOWDY';
    
    venueFilterTabs = [farewellTab, howdyTab];
    venueFilter.append(farewellTab, howdyTab);
    
    modalHeader.appendChild(venueFilter);
    modalHeader.appendChild(closeButton);
    
    // Create events list
    eventsList = document.createElement('div');
    eventsList.className = 'events-list';
    
    // Create event details section
    eventDetails = document.createElement('div');
    eventDetails.className = 'event-details';
    
    // Assemble the modal
    eventsModal.append(modalHeader, eventsList, eventDetails);
    modalOverlay.appendChild(eventsModal);
    
    // Add to the document
    document.body.appendChild(modalOverlay);
    
    // Apply appropriate ARIA attributes for accessibility
    eventsModal.setAttribute('role', 'dialog');
    eventsModal.setAttribute('aria-modal', 'true');
    eventsModal.setAttribute('aria-labelledby', 'modal-title');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }
  
  // --------------------------
  // Event Listeners
  // --------------------------
  function setupEventListeners() {
    // Close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
    
    // Close modal when clicking close button
    closeButton.addEventListener('click', closeModal);
    
    // Close modal when pressing Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });
    
    // Handle venue filter tabs
    venueFilterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const venue = tab.dataset.venue;
        if (venue !== currentVenue) {
          currentVenue = venue;
          
          // Update active tab
          venueFilterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          
          // Update displayed events
          filterEventsByVenue();
        }
      });
    });
  }
  
  // --------------------------
  // Modal Control Functions
  // --------------------------
  async function openModal() {
    // Fetch events if we don't have them yet
    if (allEvents.length === 0) {
      await fetchEvents();
    }
    
    // Show the modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Initialize with the current venue's events
    filterEventsByVenue();
    
    // Set focus on the modal for accessibility
    eventsModal.focus();
  }
  
  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  // --------------------------
  // Data Handling Functions
  // --------------------------
  async function fetchEvents() {
    try {
      // Fetch events data
      const response = await fetch('/api/events/slideshow');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      allEvents = data;
    } catch (error) {
      console.error('Error fetching events:', error);
      allEvents = [];
    }
  }
  
  function filterEventsByVenue() {
    // Filter events by selected venue
    displayedEvents = allEvents.filter(event => event.venue === currentVenue);
    
    // Sort by date (ascending)
    displayedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Reset selection
    selectedEventId = null;
    
    // Render the events list
    renderEventsList();
    
    // Select the first event by default if available
    if (displayedEvents.length > 0) {
      selectEvent(displayedEvents[0].id);
    } else {
      renderEmptyState();
    }
  }
  
  // --------------------------
  // UI Rendering Functions
  // --------------------------
  function renderEventsList() {
    // Clear the current list
    eventsList.innerHTML = '';
    
    if (displayedEvents.length === 0) {
      const noEventsMessage = document.createElement('div');
      noEventsMessage.className = 'no-events';
      noEventsMessage.textContent = 'No upcoming events found';
      eventsList.appendChild(noEventsMessage);
      return;
    }
    
    // Create an element for each event
    displayedEvents.forEach(event => {
      const eventItem = document.createElement('div');
      eventItem.className = 'event-list-item';
      eventItem.dataset.id = event.id;
      
      if (event.id === selectedEventId) {
        eventItem.classList.add('active');
      }
      
      const title = document.createElement('div');
      title.className = 'event-list-title';
      title.textContent = event.title;
      
      const date = document.createElement('div');
      date.className = 'event-list-date';
      date.textContent = formatDate(event.date);
      
      eventItem.append(title, date);
      
      // Add click event to select this event
      eventItem.addEventListener('click', () => {
        selectEvent(event.id);
      });
      
      eventsList.appendChild(eventItem);
    });
  }
  
  function selectEvent(id) {
    selectedEventId = id;
    
    // Update active class in list
    const eventItems = eventsList.querySelectorAll('.event-list-item');
    eventItems.forEach(item => {
      if (item.dataset.id === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Find the selected event
    const event = displayedEvents.find(e => e.id === id);
    
    if (event) {
      renderEventDetails(event);
    }
  }
  
  function renderEventDetails(event) {
    eventDetails.innerHTML = '';
    
    // Create flyer container
    const flyerContainer = document.createElement('div');
    flyerContainer.className = 'event-flyer-container';
    
    const flyer = document.createElement('img');
    flyer.className = 'event-flyer';
    flyer.src = event.imageUrl || './img/fp1.png'; // Fallback image
    flyer.alt = `Flyer for ${event.title}`;
    
    flyerContainer.appendChild(flyer);
    
    // Create event info
    const infoContainer = document.createElement('div');
    infoContainer.className = 'event-info';
    
    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;
    
    const dateTime = document.createElement('div');
    dateTime.className = 'event-date-time';
    dateTime.textContent = `${formatDate(event.date)} | ${event.time}`;
    
    // Add action button (tickets or info)
    const ctaButton = document.createElement('a');
    ctaButton.className = 'event-cta glitch-effect';
    
    // If there's a ticket link, use it, otherwise show more info
    if (event.ticketLink) {
      ctaButton.textContent = event.price ? `TICKETS ${event.price}` : 'TICKETS';
      ctaButton.href = event.ticketLink;
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    } else {
      ctaButton.textContent = 'MORE INFO';
      // If no ticket link, open the slideshow to this event
      ctaButton.href = `#event-${event.id}`;
      ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
        // Show slideshow focused on this event
        const slideshowContainer = document.querySelector('.slideshow-container');
        if (slideshowContainer) {
          slideshowContainer.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
    
    // Additional event info
    const eventExtras = document.createElement('div');
    eventExtras.className = 'event-extras';
    eventExtras.textContent = event.ageRestriction || '';
    
    infoContainer.append(title, dateTime, ctaButton, eventExtras);
    
    // Add everything to the details section
    eventDetails.append(flyerContainer, infoContainer);
  }
  
  function renderEmptyState() {
    eventDetails.innerHTML = '';
    
    const emptyState = document.createElement('div');
    emptyState.className = 'no-events';
    
    const icon = document.createElement('div');
    icon.innerHTML = '🎪';
    icon.style.fontSize = '3rem';
    icon.style.marginBottom = '1rem';
    
    const message = document.createElement('h3');
    message.textContent = 'No upcoming events';
    
    const subMessage = document.createElement('p');
    subMessage.textContent = `Check back soon for upcoming events at ${currentVenue.charAt(0).toUpperCase() + currentVenue.slice(1)}!`;
    
    emptyState.append(icon, message, subMessage);
    eventDetails.appendChild(emptyState);
  }
  
  // --------------------------
  // Helper Functions
  // --------------------------
  function formatDate(dateString) {
    if (!dateString) return 'TBD';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
})();
