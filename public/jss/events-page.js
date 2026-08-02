function parseEventDate(dateString) {
  if (!dateString) return new Date(0);
  try {
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
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
document.addEventListener('DOMContentLoaded', function () {
  const eventsGrid = document.getElementById('events-grid');
  const venueButtons = document.querySelectorAll('.btn-venue');
  const showButtons = document.querySelectorAll('.btn-show');
  let events = [];
  let currentVenue = 'farewell';
  let currentShowType = 'upcoming';
  init();
  async function init() {
    showLoading();
    setupEventListeners();
    await fetchEvents();
    filterAndRenderEvents();
  }
  function setupEventListeners() {
    venueButtons.forEach((button) => {
      button.addEventListener('click', function () {
        if (!this.classList.contains('active')) {
          venueButtons.forEach((btn) => btn.classList.remove('active'));
          this.classList.add('active');
          currentVenue = this.dataset.venue;
          filterAndRenderEvents();
        }
      });
    });
    showButtons.forEach((button) => {
      button.addEventListener('click', function () {
        if (!this.classList.contains('active')) {
          showButtons.forEach((btn) => btn.classList.remove('active'));
          this.classList.add('active');
          currentShowType = this.dataset.show;
          filterAndRenderEvents();
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (
        e.target.classList.contains('event-modal') ||
        e.target.classList.contains('close-modal')
      ) {
        closeEventModal();
      }
      const detailsButton = e.target.closest('.btn-details');
      if (detailsButton) {
        const eventId = detailsButton.dataset.id;
        if (eventId) {
          openEventModal(eventId);
        }
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeEventModal();
      }
    });
  }
  async function fetchEvents() {
    try {
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
    const filteredEvents = events.filter((event) => {
      const matchesVenue = event.venue === currentVenue;
      console.log('Filtering - RAW EVENT DATE:', event.date, 'TYPE:', typeof event.date);
      const isPast = isPastEvent(event.date);
      const isToday = isTodayEvent(event.date);
      const isUpcoming = !isPast || isToday;
      const matchesShowType =
        (currentShowType === 'upcoming' && isUpcoming) ||
        (currentShowType === 'archived' && !isUpcoming);
      console.log(
        `Filtering ${event.title}: venue=${matchesVenue}, isPast=${isPast}, isToday=${isToday}, isUpcoming=${isUpcoming}, matchesShowType=${matchesShowType}`
      );
      return matchesVenue && matchesShowType;
    });
    filteredEvents.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (currentShowType === 'upcoming') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
    renderEvents(filteredEvents);
  }
  function renderEvents(filteredEvents) {
    eventsGrid.innerHTML = '';
    if (filteredEvents.length === 0) {
      const noEvents = document.createElement('div');
      noEvents.className = 'no-events';
      const message =
        currentShowType === 'upcoming'
          ? `No upcoming events at ${currentVenue.toUpperCase()}`
          : `No past events at ${currentVenue.toUpperCase()}`;
      noEvents.textContent = message;
      eventsGrid.appendChild(noEvents);
      return;
    }
    filteredEvents.forEach((event) => {
      const eventCard = createEventCard(event);
      eventsGrid.appendChild(eventCard);
    });
  }
  function createEventCard(event) {
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
    const isTrulyPast = isPast && !isToday;
    const card = document.createElement('div');
    card.className = `event-card venue-${event.venue}`;
    if (isTrulyPast) {
      card.classList.add('past-event');
    }
    const venueTag = document.createElement('div');
    venueTag.className = 'event-venue-tag';
    venueTag.textContent = event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY';
    const imageContainer = document.createElement('div');
    imageContainer.className = 'event-image';
    const image = document.createElement('img');
    image.src = event.imageUrl || event.flyer_image_url || './img/placeholder-event.jpg';
    image.alt = `Flyer for ${event.title}`;
    image.onerror = function () {
      this.src = './img/placeholder-event.jpg';
    };
    imageContainer.appendChild(image);
    imageContainer.appendChild(venueTag);
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
    const actions = document.createElement('div');
    actions.className = 'event-actions';
    const detailsButton = document.createElement('button');
    detailsButton.className = 'btn-details';
    detailsButton.textContent = 'Details';
    detailsButton.dataset.id = event.id;
    actions.appendChild(detailsButton);
    if (event.ticketLink || event.url) {
      const ticketButton = document.createElement('a');
      ticketButton.className = 'btn-tickets';
      ticketButton.textContent = event.ticketLink ? 'Tickets' : 'Event Link';
      ticketButton.href = event.ticketLink || event.url;
      ticketButton.target = '_blank';
      ticketButton.rel = 'noopener noreferrer';
      actions.appendChild(ticketButton);
    }
    details.append(date, title, description, actions);
    card.append(imageContainer, details);
    return card;
  }
  function openEventModal(eventId) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
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
    const content = modal.querySelector('.event-modal-content');
    content.innerHTML = '';
    const closeButton = document.createElement('span');
    closeButton.className = 'close-modal';
    closeButton.innerHTML = '&times;';
    content.appendChild(closeButton);
    const image = document.createElement('img');
    image.className = 'modal-image';
    image.src = event.imageUrl || event.flyer_image_url || './img/placeholder-event.jpg';
    image.alt = `Flyer for ${event.title}`;
    image.onerror = function () {
      this.src = './img/placeholder-event.jpg';
    };
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = event.title;
    const dateVenue = document.createElement('div');
    dateVenue.className = 'modal-date-venue';
    const dateSpan = document.createElement('span');
    dateSpan.innerHTML = `<i class="icon-calendar"></i> ${formatDate(event.date)}`;
    const timeSpan = document.createElement('span');
    timeSpan.innerHTML = `<i class="icon-clock"></i> ${event.time || 'TBA'}`;
    const venueSpan = document.createElement('span');
    venueSpan.innerHTML = `<i class="icon-location"></i> ${event.venue === 'farewell' ? 'FAREWELL' : 'HOWDY'}`;
    dateVenue.append(dateSpan, timeSpan, venueSpan);
    const description = document.createElement('div');
    description.className = 'modal-description';
    description.textContent = event.description || 'No description available.';
    const details = document.createElement('div');
    details.className = 'modal-details';
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
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    if (event.ticketLink || event.url) {
      const actionButton = document.createElement('a');
      actionButton.className = 'btn-tickets';
      actionButton.textContent = event.ticketLink ? 'Buy Tickets' : 'Event Website';
      actionButton.href = event.ticketLink || event.url;
      actionButton.target = '_blank';
      actionButton.rel = 'noopener noreferrer';
      actions.appendChild(actionButton);
    }
    content.append(closeButton, image, title, dateVenue, description);
    if (details.children.length > 0) {
      content.appendChild(details);
    }
    if (actions.children.length > 0) {
      content.appendChild(actions);
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeEventModal() {
    const modal = document.querySelector('.event-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  function showLoading() {
    eventsGrid.innerHTML = `\n            <div class="loading-spinner">\n                <div class="spinner"></div>\n                <div class="loading-text">Loading events...</div>\n            </div>\n        `;
  }
  function showError(message) {
    eventsGrid.innerHTML = `\n            <div class="no-events">\n                <div>⚠️</div>\n                <h3>Error</h3>\n                <p>${message}</p>\n            </div>\n        `;
  }
  function formatDate(dateString) {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
});
