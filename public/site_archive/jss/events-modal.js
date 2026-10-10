(function () {
  function parseEventDate(dateString) {
    if (!dateString) return new Date(0);
    try {
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parts = dateString.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      const d = new Date(dateString);
      if (isNaN(d.getTime())) {
        console.error('Invalid date format:', dateString);
        return new Date(0);
      }
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(0);
    }
  }
  function isPastEvent(eventDate, referenceDate = new Date()) {
    const eventDay = parseEventDate(eventDate);
    const referenceDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const result = eventDay < referenceDay;
    console.log(
      `isPastEvent comparison: ${eventDate} => ${eventDay.toISOString().slice(0, 10)} < ${referenceDay.toISOString().slice(0, 10)} = ${result}`
    );
    return result;
  }
  function isTodayEvent(eventDate, referenceDate = new Date()) {
    const eventDay = parseEventDate(eventDate);
    const referenceDay = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate()
    );
    const result = eventDay.getTime() === referenceDay.getTime();
    console.log(
      `isTodayEvent comparison: ${eventDate} => ${eventDay.toISOString().slice(0, 10)} === ${referenceDay.toISOString().slice(0, 10)} = ${result}`
    );
    return result;
  }
  let modalOverlay;
  let eventsModal;
  let eventsList;
  let eventDetails;
  let venueFilterTabs;
  let closeButton;
  let allEvents = [];
  let displayedEvents = [];
  let currentVenue = document.body.dataset.state || 'farewell';
  let selectedEventId = null;
  let showArchived = false;
  document.addEventListener('DOMContentLoaded', async () => {
    createModalStructure();
    setupEventListeners();
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'data-state') {
          currentVenue = document.body.dataset.state || 'farewell';
          console.log(
            `[Events Modal] Updated currentVenue to ${currentVenue} from data-state change`
          );
        }
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
    document.addEventListener('openEventsModal', (e) => {
      if (typeof openEventsPopup === 'function') openEventsPopup();
    });
    const listingLinks = document.querySelectorAll('.events-modal-trigger, #calendar img');
    listingLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof openEventsPopup === 'function') openEventsPopup();
      });
    });
  });
  function createModalStructure() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'events-modal-overlay';
    eventsModal = document.createElement('div');
    eventsModal.className = 'events-modal';
    const modalHeader = document.createElement('div');
    modalHeader.className = 'events-modal-header';
    closeButton = document.createElement('button');
    closeButton.className = 'events-modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    const modalTitle = document.createElement('h2');
    modalTitle.className = 'events-modal-title';
    modalTitle.textContent = 'UPCOMING SHOWS';
    modalHeader.appendChild(closeButton);
    modalHeader.appendChild(modalTitle);
    const farewellTab = document.createElement('button');
    farewellTab.className = 'venue-tab' + (currentVenue === 'farewell' ? ' active' : '');
    farewellTab.dataset.venue = 'farewell';
    farewellTab.textContent = currentVenue === 'farewell' ? 'F✓' : 'F';
    farewellTab.setAttribute('data-tooltip', 'Farewell');
    const howdyTab = document.createElement('button');
    howdyTab.className = 'venue-tab' + (currentVenue === 'howdy' ? ' active' : '');
    howdyTab.dataset.venue = 'howdy';
    howdyTab.textContent = currentVenue === 'howdy' ? 'H✓' : 'H';
    howdyTab.setAttribute('data-tooltip', 'Howdy');
    const bothTab = document.createElement('button');
    bothTab.className = 'venue-tab' + (currentVenue === 'both' ? ' active' : '');
    bothTab.dataset.venue = 'both';
    bothTab.textContent = currentVenue === 'both' ? 'A✓' : 'A';
    bothTab.setAttribute('data-tooltip', 'All Venues');
    venueFilterTabs = [farewellTab, howdyTab, bothTab];
    const archiveToggle = document.createElement('button');
    archiveToggle.className = 'archive-toggle';
    archiveToggle.textContent = 'NEW';
    archiveToggle.setAttribute('aria-pressed', 'false');
    archiveToggle.setAttribute('data-tooltip', 'Show All Events');
    archiveToggle.setAttribute('title', 'Toggle between upcoming and all events');
    const calendarLink = document.createElement('a');
    calendarLink.className = 'calendar-download-link';
    calendarLink.href = '#';
    calendarLink.textContent = '📅';
    calendarLink.setAttribute('data-tooltip', 'Download Calendar');
    calendarLink.setAttribute('title', 'Download all events as calendar file');
    calendarLink.addEventListener('click', (e) => {
      e.preventDefault();
      const calendarSelector = document.querySelector('.cal-link-ics');
      if (calendarSelector) {
        calendarSelector.click();
      } else {
        alert('Calendar download not available');
      }
    });
    archiveToggle.addEventListener('click', async () => {
      showArchived = !showArchived;
      archiveToggle.textContent = showArchived ? 'ALL' : 'NEW';
      archiveToggle.setAttribute('aria-pressed', showArchived.toString());
      await fetchEvents();
      filterEvents();
    });
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';
    filterContainer.append(farewellTab, howdyTab, bothTab, archiveToggle, calendarLink);
    modalHeader.appendChild(filterContainer);
    eventsList = document.createElement('div');
    eventsList.className = 'events-list';
    eventDetails = document.createElement('div');
    eventDetails.className = 'event-details';
    eventsModal.append(modalHeader, eventsList, eventDetails);
    modalOverlay.appendChild(eventsModal);
    document.body.appendChild(modalOverlay);
    eventsModal.setAttribute('role', 'dialog');
    eventsModal.setAttribute('aria-modal', 'true');
    eventsModal.setAttribute('aria-labelledby', 'modal-title');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }
  function setupEventListeners() {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
    closeButton.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });
    venueFilterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const venue = tab.dataset.venue;
        if (venue !== currentVenue) {
          currentVenue = venue;
          window.currentVenue = venue;
          venueFilterTabs.forEach((t) => {
            t.classList.remove('active');
            if (t.dataset.venue === 'farewell') {
              t.textContent = 'F';
            } else if (t.dataset.venue === 'howdy') {
              t.textContent = 'H';
            } else if (t.dataset.venue === 'both') {
              t.textContent = 'A';
            }
          });
          tab.classList.add('active');
          if (venue === 'farewell') {
            tab.textContent = 'F✓';
          } else if (venue === 'howdy') {
            tab.textContent = 'H✓';
          } else if (venue === 'both') {
            tab.textContent = 'A✓';
          }
          filterEvents();
        }
      });
    });
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.events-modal-trigger');
      if (link) {
        e.preventDefault();
        if (typeof openEventsPopup === 'function') openEventsPopup();
      }
    });
  }
  async function openModal() {
    console.log(`[Events Modal] Opening modal with venue: ${currentVenue}`);
    await fetchEvents();
    venueFilterTabs.forEach((tab) => {
      const venue = tab.dataset.venue;
      tab.classList.remove('active');
      if (venue === 'farewell') {
        tab.textContent = 'F';
      } else if (venue === 'howdy') {
        tab.textContent = 'H';
      } else if (venue === 'both') {
        tab.textContent = 'A';
      }
      if (venue === currentVenue) {
        tab.classList.add('active');
        if (venue === 'farewell') {
          tab.textContent = 'F✓';
        } else if (venue === 'howdy') {
          tab.textContent = 'H✓';
        } else if (venue === 'both') {
          tab.textContent = 'A✓';
        }
      }
    });
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    filterEvents();
    eventsModal.focus();
  }
  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
  async function fetchEvents() {
    try {
      const timestamp = new Date().getTime();
      const includePastParam = showArchived ? '&includePast=true' : '';
      const response = await fetch(
        `/api/events/slideshow?t=${timestamp}${includePastParam}&limit=100`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      console.log('Events loaded:', data);
      data.forEach((event) => {
        console.log(
          `Event: ${event.title}, Original date: ${event.date}, JS Date object: ${new Date(event.date)}`
        );
      });
      allEvents = data;
    } catch (error) {
      console.error('Error fetching events:', error);
      allEvents = [];
    }
  }
  function filterEvents() {
    console.log(
      `Filtering events for venue: ${currentVenue}, show archived: ${showArchived}, total events: ${allEvents.length}`
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    displayedEvents = allEvents.filter((event) => {
      const matchesVenue = currentVenue === 'both' ? true : event.venue === currentVenue;
      let matchesDate = true;
      if (!showArchived) {
        const isPast = isPastEvent(event.date);
        const isToday = isTodayEvent(event.date);
        matchesDate = !isPast || isToday;
        console.log(
          `Event ${event.title} on ${event.date}: isPast=${isPast}, isToday=${isToday}, matchesDate=${matchesDate}`
        );
      }
      return matchesVenue && matchesDate;
    });
    displayedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(`Found ${displayedEvents.length} events for ${currentVenue}`);
    selectedEventId = null;
    renderEventsList();
    if (displayedEvents.length > 0) {
      selectEvent(displayedEvents[0].id);
    } else {
      renderEmptyState();
    }
  }
  function renderEventsList() {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    displayedEvents.forEach((event) => {
      const eventItem = document.createElement('div');
      eventItem.className = 'event-list-item';
      eventItem.dataset.id = event.id;
      if (event.id === selectedEventId) {
        eventItem.classList.add('active');
      }
      console.log('RAW EVENT DATE:', event.date, 'TYPE:', typeof event.date);
      const isPast = isPastEvent(event.date);
      const isToday = isTodayEvent(event.date);
      console.log(`Event: ${event.title}`);
      console.log('Parsed event date:', parseEventDate(event.date));
      console.log(
        'Today at midnight:',
        new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
      );
      console.log('isPast:', isPast, 'isToday:', isToday);
      if (isPast && !isToday) {
        eventItem.classList.add('past-event');
      }
      const title = document.createElement('div');
      title.className = 'event-list-title';
      title.textContent =
        event.title.length > 40 ? event.title.substring(0, 38) + '...' : event.title;
      const dateContainer = document.createElement('div');
      dateContainer.className = 'event-list-date-container';
      if (currentVenue === 'both') {
        const venueIndicator = document.createElement('span');
        venueIndicator.className = `venue-indicator ${event.venue}`;
        venueIndicator.textContent = event.venue === 'farewell' ? 'FW' : 'HY';
        dateContainer.appendChild(venueIndicator);
      }
      const date = document.createElement('div');
      date.className = 'event-list-date';
      date.textContent = formatDate(event.date);
      dateContainer.appendChild(date);
      if (isPast && !isToday) {
        const pastIndicator = document.createElement('span');
        pastIndicator.className = 'past-indicator';
        pastIndicator.textContent = '(past)';
        dateContainer.appendChild(pastIndicator);
      }
      eventItem.append(title, dateContainer);
      eventItem.addEventListener('click', () => {
        selectEvent(event.id);
      });
      eventsList.appendChild(eventItem);
    });
  }
  function selectEvent(id) {
    selectedEventId = id;
    const eventItems = eventsList.querySelectorAll('.event-list-item');
    eventItems.forEach((item) => {
      if (item.dataset.id === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    const event = displayedEvents.find((e) => e.id === id);
    if (event) {
      renderEventDetails(event);
    }
  }
  function renderEventDetails(event) {
    eventDetails.innerHTML = '';
    const detailsWrapper = document.createElement('div');
    detailsWrapper.className = 'event-details-wrapper';
    const flyerContainer = document.createElement('div');
    flyerContainer.className = 'event-flyer-container';
    const flyer = document.createElement('img');
    flyer.className = 'event-flyer';
    flyer.src = event.imageUrl || './img/fp1.png';
    flyer.alt = `Flyer for ${event.title}`;
    flyer.addEventListener('error', () => {
      flyer.src = './img/fp1.png';
    });
    flyerContainer.appendChild(flyer);
    const infoContainer = document.createElement('div');
    infoContainer.className = 'event-info';
    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;
    const venueBadge = document.createElement('div');
    venueBadge.className = `venue-badge venue-${event.venue}`;
    venueBadge.textContent = event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY';
    const dateTime = document.createElement('div');
    dateTime.className = 'event-date-time';
    dateTime.textContent = `${formatDate(event.date)} | ${event.time}`;
    const eventDetailsInfo = document.createElement('div');
    eventDetailsInfo.className = 'event-details-info';
    const infoItems = [];
    if (event.ageRestriction) {
      const ageItem = document.createElement('div');
      ageItem.className = 'event-info-item';
      ageItem.innerHTML = `<span class="info-label">Age:</span> ${event.ageRestriction}`;
      infoItems.push(ageItem);
    }
    if (event.price) {
      const priceItem = document.createElement('div');
      priceItem.className = 'event-info-item';
      priceItem.innerHTML = `<span class="info-label">Price:</span> ${event.price}`;
      infoItems.push(priceItem);
    }
    if (event.description) {
      const descItem = document.createElement('div');
      descItem.className = 'event-info-item event-description';
      descItem.innerHTML = `<span class="info-label">Info:</span> ${event.description}`;
      infoItems.push(descItem);
    }
    infoItems.forEach((item) => eventDetailsInfo.appendChild(item));
    const ctaButton = document.createElement('a');
    ctaButton.className = 'event-cta glitch-effect';
    if (event.ticketLink) {
      ctaButton.textContent = event.price ? `TICKETS ${event.price}` : 'BUY TICKETS';
      ctaButton.href = event.ticketLink;
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    } else if (event.url) {
      ctaButton.textContent = 'EVENT WEBSITE';
      ctaButton.href = event.url;
      ctaButton.target = '_blank';
      ctaButton.rel = 'noopener noreferrer';
    }
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'event-buttons';
    if (event.ticketLink || event.url) {
      buttonContainer.appendChild(ctaButton);
    }
    infoContainer.append(title, venueBadge, dateTime, eventDetailsInfo, buttonContainer);
    detailsWrapper.append(flyerContainer, infoContainer);
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
  function formatDate(dateString) {
    if (!dateString) return 'TBD';
    try {
      if (dateString.length === 10 && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-').map((num) => parseInt(num, 10));
        const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        console.log(
          `Formatting date: ${dateString} => ${formattedDate} (UTC corrected) [${year}-${month}-${day}]`
        );
        return formattedDate;
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
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
