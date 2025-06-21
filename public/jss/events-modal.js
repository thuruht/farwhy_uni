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
  let showArchived = false; // Flag to toggle past events (false = upcoming only)
  
  // --------------------------
  // Initialization
  // --------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    createModalStructure();
    setupEventListeners();
    
    // Trigger modal when clicking show listings or calendar image
    const listingLinks = document.querySelectorAll('.events-modal-trigger, #calendar img');
    listingLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        // Always reload data when opening modal
        await fetchEvents();
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
    
    const venueLabel = document.createElement('span');
    venueLabel.className = 'filter-label';
    venueLabel.textContent = 'VENUE:';
    venueFilter.appendChild(venueLabel);
    
    const farewellTab = document.createElement('button');
    farewellTab.className = 'venue-tab active';
    farewellTab.dataset.venue = 'farewell';
    farewellTab.textContent = 'FAREWELL';
    
    const howdyTab = document.createElement('button');
    howdyTab.className = 'venue-tab';
    howdyTab.dataset.venue = 'howdy';
    howdyTab.textContent = 'HOWDY';
    
    const bothTab = document.createElement('button');
    bothTab.className = 'venue-tab';
    bothTab.dataset.venue = 'both';
    bothTab.textContent = 'BOTH VENUES';
    
    venueFilterTabs = [farewellTab, howdyTab, bothTab];
    venueFilter.append(farewellTab, howdyTab, bothTab);
    
    // Create archive filter
    const archiveFilter = document.createElement('div');
    archiveFilter.className = 'archive-filter';
    
    const archiveLabel = document.createElement('span');
    archiveLabel.className = 'filter-label';
    archiveLabel.textContent = 'SHOW:';
    archiveFilter.appendChild(archiveLabel);
    
    const archiveToggle = document.createElement('button');
    archiveToggle.className = 'archive-toggle';
    archiveToggle.textContent = 'UPCOMING ONLY';
    archiveToggle.setAttribute('aria-pressed', 'false');
    
    archiveToggle.addEventListener('click', () => {
      showArchived = !showArchived;
      archiveToggle.textContent = showArchived ? 'ALL EVENTS' : 'UPCOMING ONLY';
      archiveToggle.setAttribute('aria-pressed', showArchived.toString());
      filterEvents();
    });
    
    archiveFilter.appendChild(archiveToggle);
    
    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.append(venueFilter, archiveFilter);
    
    modalHeader.appendChild(filterContainer);
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
          filterEvents();
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
    filterEvents();
    
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
      // Fetch events data with cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/events/slideshow?t=${timestamp}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('Events loaded:', data);
      
      // Add diagnostic logging for each event's date
      data.forEach(event => {
        console.log(`Event: ${event.title}, Original date: ${event.date}, JS Date object: ${new Date(event.date)}`);
      });
      
      allEvents = data;
    } catch (error) {
      console.error('Error fetching events:', error);
      allEvents = [];
    }
  }
  
  function filterEvents() {
    console.log(`Filtering events for venue: ${currentVenue}, show archived: ${showArchived}, total events: ${allEvents.length}`);
    
    // Get current date (set to start of day to avoid time issues)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter events based on the current criteria
    displayedEvents = allEvents.filter(event => {
      // Apply venue filter
      const matchesVenue = currentVenue === 'both' ? true : event.venue === currentVenue;
      
      // Apply date filter (only if not showing archived)
      let matchesDate = true;
      if (!showArchived) {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        matchesDate = eventDate >= today;
      }
      
      return matchesVenue && matchesDate;
    });
    
    // Sort by date (ascending)
    displayedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`Found ${displayedEvents.length} events for ${currentVenue}`);
    
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
      
      if (showArchived) {
        noEventsMessage.textContent = 'No events found';
      } else {
        noEventsMessage.textContent = 'No upcoming events';
      }
      
      eventsList.appendChild(noEventsMessage);
      return;
    }
    
    // Get current date (set to start of day to avoid time issues)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create an element for each event
    displayedEvents.forEach(event => {
      const eventItem = document.createElement('div');
      eventItem.className = 'event-list-item';
      eventItem.dataset.id = event.id;
      
      if (event.id === selectedEventId) {
        eventItem.classList.add('active');
      }
      
      // Check if the event is in the past
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isPastEvent = eventDate < today;
      
      if (isPastEvent) {
        eventItem.classList.add('past-event');
      }
      
      const title = document.createElement('div');
      title.className = 'event-list-title';
      title.textContent = event.title;
      
      const dateContainer = document.createElement('div');
      dateContainer.className = 'event-list-date-container';
      
      // Add venue indicator for "both" filter
      if (currentVenue === 'both') {
        const venueIndicator = document.createElement('span');
        venueIndicator.className = `venue-indicator ${event.venue}`;
        venueIndicator.textContent = event.venue === 'farewell' ? 'FW' : 'HD';
        dateContainer.appendChild(venueIndicator);
      }
      
      const date = document.createElement('div');
      date.className = 'event-list-date';
      date.textContent = formatDate(event.date);
      dateContainer.appendChild(date);
      
      // Add past event indicator if needed
      if (isPastEvent) {
        const pastIndicator = document.createElement('span');
        pastIndicator.className = 'past-indicator';
        pastIndicator.textContent = '(past)';
        dateContainer.appendChild(pastIndicator);
      }
      
      eventItem.append(title, dateContainer);
      
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
    
    // Create outer container for event details
    const detailsWrapper = document.createElement('div');
    detailsWrapper.className = 'event-details-wrapper';
    
    // Create flyer container
    const flyerContainer = document.createElement('div');
    flyerContainer.className = 'event-flyer-container';
    
    const flyer = document.createElement('img');
    flyer.className = 'event-flyer';
    flyer.src = event.imageUrl || './img/fp1.png'; // Fallback image
    flyer.alt = `Flyer for ${event.title}`;
    flyer.addEventListener('error', () => {
      // If image fails to load, set fallback
      flyer.src = './img/fp1.png';
    });
    
    flyerContainer.appendChild(flyer);
    
    // Create event info
    const infoContainer = document.createElement('div');
    infoContainer.className = 'event-info';
    
    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;
    
    // Create venue badge
    const venueBadge = document.createElement('div');
    venueBadge.className = `venue-badge venue-${event.venue}`;
    venueBadge.textContent = event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY';
    
    const dateTime = document.createElement('div');
    dateTime.className = 'event-date-time';
    dateTime.textContent = `${formatDate(event.date)} | ${event.time}`;
    
    // Create detailed event info section
    const eventDetailsInfo = document.createElement('div');
    eventDetailsInfo.className = 'event-details-info';
    
    // Add each piece of info that exists
    const infoItems = [];
    
    // Age restriction
    if (event.ageRestriction) {
      const ageItem = document.createElement('div');
      ageItem.className = 'event-info-item';
      ageItem.innerHTML = `<span class="info-label">Age:</span> ${event.ageRestriction}`;
      infoItems.push(ageItem);
    }
    
    // Price/Suggested donation
    if (event.price) {
      const priceItem = document.createElement('div');
      priceItem.className = 'event-info-item';
      priceItem.innerHTML = `<span class="info-label">Price:</span> ${event.price}`;
      infoItems.push(priceItem);
    }
    
    // Description (if available)
    if (event.description) {
      const descItem = document.createElement('div');
      descItem.className = 'event-info-item event-description';
      descItem.innerHTML = `<span class="info-label">Info:</span> ${event.description}`;
      infoItems.push(descItem);
    }
    
    // Add all info items to the details
    infoItems.forEach(item => eventDetailsInfo.appendChild(item));
    
    // Add action button (tickets or info)
    const ctaButton = document.createElement('a');
    ctaButton.className = 'event-cta glitch-effect';
    
    // If there's a ticket link, use it
    if (event.ticketLink) {
      ctaButton.textContent = event.price ? `TICKETS ${event.price}` : 'BUY TICKETS';
      ctaButton.href = event.ticketLink;
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    } 
    // If there's an event URL, show a website link
    else if (event.url) {
      ctaButton.textContent = 'EVENT WEBSITE';
      ctaButton.href = event.url;
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    }
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'event-buttons';
    
    // Only add the button if we have a link
    if (event.ticketLink || event.url) {
      buttonContainer.appendChild(ctaButton);
    }
    
    infoContainer.append(title, venueBadge, dateTime, eventDetailsInfo, buttonContainer);
    
    // Add everything to the details wrapper
    detailsWrapper.append(flyerContainer, infoContainer);
    
    // Add the wrapper to the details section
    eventDetails.appendChild(detailsWrapper);
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
    
    // Show different messages based on filter settings
    if (showArchived) {
      message.textContent = 'No events found';
    } else {
      message.textContent = 'No upcoming events';
    }
    
    const subMessage = document.createElement('p');
    
    if (currentVenue === 'both') {
      subMessage.textContent = `Check back soon for upcoming events at both venues!`;
    } else {
      const venueName = currentVenue.charAt(0).toUpperCase() + currentVenue.slice(1);
      subMessage.textContent = `Check back soon for upcoming events at ${venueName}!`;
    }
    
    // Add filter hint if not showing archived
    if (!showArchived) {
      const filterHint = document.createElement('p');
      filterHint.className = 'filter-hint';
      filterHint.textContent = 'Try selecting "ALL EVENTS" to see past shows.';
      emptyState.append(icon, message, subMessage, filterHint);
    } else {
      emptyState.append(icon, message, subMessage);
    }
    
    eventDetails.appendChild(emptyState);
  }
  
  // --------------------------
  // Helper Functions
  // --------------------------
  function formatDate(dateString) {
    if (!dateString) return 'TBD';
    
    try {
      // Check for date format like '2025-06-20' (YYYY-MM-DD)
      if (dateString.length === 10 && dateString.includes('-')) {
        // Handle as UTC date to prevent timezone offset issues
        const [year, month, day] = dateString.split('-').map(Number);
        
        // Create a date with time 12:00 noon to avoid any date shifting due to timezone
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        
        // Format: "Fri, Jun 20" format
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        console.log(`Formatting date: ${dateString} => ${formattedDate} (UTC corrected)`);
        return formattedDate;
      }
      
      // For other date formats, use standard date parsing
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format: "Fri, Jun 20" format
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      console.log(`Formatting date: ${dateString} => ${formattedDate}`);
      return formattedDate;
    } catch (error) {
      console.error(`Error formatting date: ${dateString}`, error);
      return dateString;
    }
  }
})();
