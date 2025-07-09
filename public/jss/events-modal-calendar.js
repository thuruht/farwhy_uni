/**
 * events-modal-calendar.js - Adds calendar download functionality to the events modal
 * 
 * This module extends the events modal to add a calendar download button
 * that allows users to download an .ics file for a specific event.
 */

(function() {
  // Wait for DOM to load and event modal to be initialized
  document.addEventListener('DOMContentLoaded', () => {
    // Watch for when the events modal becomes active
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const overlay = document.querySelector('.events-modal-overlay');
          if (overlay && overlay.classList.contains('active')) {
            // Modal is open, add calendar download button if not already present
            addCalendarButton();
          }
        }
      });
    });

    // Start observing the overlay for class changes
    const overlay = document.querySelector('.events-modal-overlay');
    if (overlay) {
      observer.observe(overlay, { attributes: true });
      console.log('[Calendar] Initialized event modal calendar extension');
    }
  });

  /**
   * Adds a calendar download button to the event details section
   */
  function addCalendarButton() {
    // Check if event details exists and button doesn't already exist
    const eventDetails = document.querySelector('.event-details');
    if (!eventDetails || document.querySelector('.event-calendar-download')) {
      return;
    }

    // Find the buttons container
    const buttonsContainer = eventDetails.querySelector('.event-buttons');
    if (!buttonsContainer) {
      console.warn('[Calendar] Could not find buttons container');
      return;
    }

    // Create the calendar download button
    const calendarButton = document.createElement('a');
    calendarButton.className = 'event-calendar-download glitch-effect tooltip';
    calendarButton.innerHTML = '<span class="calendar-icon">📅</span> ADD TO CALENDAR<span class="tooltip-text">Download this event as an .ics file to add it to your calendar app (Google Calendar, Apple Calendar, Outlook, etc.)</span>';
    calendarButton.href = '#';
    calendarButton.addEventListener('click', generateSingleEventCalendar);

    // Add the button to the container
    buttonsContainer.appendChild(calendarButton);
    console.log('[Calendar] Added calendar download button to event modal');
  }

  /**
   * Generates and downloads an .ics file for the currently selected event
   * @param {Event} e - The click event
   */
  async function generateSingleEventCalendar(e) {
    e.preventDefault();

    // Get the currently selected event
    const eventId = document.querySelector('.event-list-item.active')?.dataset.id;
    if (!eventId) {
      console.warn('[Calendar] No event selected');
      return;
    }

    // Show loading state
    const button = e.target.closest('.event-calendar-download');
    const originalText = button.innerHTML;
    button.innerHTML = 'GENERATING...';
    button.style.pointerEvents = 'none';

    try {
      // Get event details from the UI
      const event = extractEventDetails();
      
      if (!event) {
        throw new Error('Could not extract event details');
      }

      // Generate ICS content
      const icsContent = generateIcsContent([event]);
      
      // Create a downloadable blob
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const venue = event.venue.charAt(0).toUpperCase() + event.venue.slice(1);
      const formattedDate = event.date.replace(/-/g, '');
      downloadLink.download = `${venue}_Event_${formattedDate}.ics`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('[Calendar] Error generating ICS file:', error);
      alert('Error generating calendar file. Please try again later.');
    } finally {
      // Restore original button text
      button.innerHTML = originalText;
      button.style.pointerEvents = '';
    }
  }

  /**
   * Extracts event details from the currently displayed event in the modal
   * @returns {Object} - The event object
   */
  function extractEventDetails() {
    try {
      const eventDetailsEl = document.querySelector('.event-details');
      if (!eventDetailsEl) return null;

      // Get the event ID
      const eventId = document.querySelector('.event-list-item.active')?.dataset.id;
      
      // Get event title
      const title = eventDetailsEl.querySelector('.event-title')?.textContent;
      
      // Get venue
      const venueBadge = eventDetailsEl.querySelector('.venue-badge');
      const venue = venueBadge?.classList.contains('venue-farewell') ? 'farewell' : 'howdy';
      
      // Get date and time
      const dateTimeText = eventDetailsEl.querySelector('.event-date-time')?.textContent || '';
      const [dateText, timeText] = dateTimeText.split('|').map(str => str.trim());
      
      // Parse date from the displayed format (e.g., "Fri, Jun 20")
      const dateObj = parseDisplayDate(dateText);
      const dateStr = dateObj ? formatDateISO(dateObj) : '';
      
      // Get price, age restriction, description from info items
      const infoItems = eventDetailsEl.querySelectorAll('.event-info-item');
      let price = '';
      let ageRestriction = '';
      let description = '';
      
      infoItems.forEach(item => {
        const text = item.textContent;
        if (text.includes('Price:')) {
          price = text.split('Price:')[1].trim();
        } else if (text.includes('Age:')) {
          ageRestriction = text.split('Age:')[1].trim();
        } else if (text.includes('Info:')) {
          description = text.split('Info:')[1].trim();
        }
      });
      
      // Get ticket link
      const ticketLink = eventDetailsEl.querySelector('.event-cta')?.href;
      
      return {
        id: eventId,
        title,
        venue,
        date: dateStr,
        time: timeText,
        price,
        ageRestriction,
        description,
        ticketLink
      };
    } catch (error) {
      console.error('[Calendar] Error extracting event details:', error);
      return null;
    }
  }

  /**
   * Parses a display date like "Fri, Jun 20" into a Date object
   * @param {string} displayDate - The formatted date string
   * @returns {Date|null} - A Date object or null if parsing fails
   */
  function parseDisplayDate(displayDate) {
    try {
      // Handle the "Fri, Jun 20" format
      const parts = displayDate.split(', ');
      if (parts.length !== 2) return null;
      
      const [dayOfWeek, monthDay] = parts;
      const [month, day] = monthDay.split(' ');
      
      // Convert month name to number
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const monthNum = months[month];
      if (monthNum === undefined) return null;
      
      // Determine year (use current year or next year if the date has already passed)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // If the month is before the current month, it's likely next year
      let year = currentYear;
      if (monthNum < currentMonth) {
        year = currentYear + 1;
      }
      
      // Create date object (day is parsed as integer)
      return new Date(year, monthNum, parseInt(day, 10));
    } catch (error) {
      console.error('[Calendar] Error parsing display date:', error, displayDate);
      return null;
    }
  }

  /**
   * Formats a Date object as ISO string (YYYY-MM-DD)
   * @param {Date} date - The date to format
   * @returns {string} - The formatted date
   */
  function formatDateISO(date) {
    if (!date || isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Escapes special characters in iCalendar strings
   * @param {string} text - The text to escape
   * @returns {string} - The escaped text
   */
  function escapeIcsText(text) {
    if (!text) return '';
    return text
      .replace(/[\\;,]/g, '\\$&')
      .replace(/\n/g, '\\n');
  }

  /**
   * Converts a date string to iCalendar date format
   * @param {string} dateStr - The date string (YYYY-MM-DD)
   * @param {string} timeStr - The time string (e.g. "Doors at 7pm / Music at 8pm")
   * @returns {Object} - { startDate, endDate } in iCalendar format
   */
  function formatIcsDate(dateStr, timeStr) {
    // Parse the date
    const date = new Date(dateStr);
    
    // Default time to 7pm for doors if nothing else can be determined
    let startHour = 19; // 7pm
    let endHour = 23;   // 11pm by default (4 hour event)
    
    // Try to extract time from the time string
    if (timeStr) {
      // Look for common patterns like "8pm", "7:30pm", etc.
      const doorTimeMatch = timeStr.match(/Doors at (\d+)(?::(\d+))?\s*(am|pm)/i);
      const musicTimeMatch = timeStr.match(/Music at (\d+)(?::(\d+))?\s*(am|pm)/i);
      const showTimeMatch = timeStr.match(/Show at (\d+)(?::(\d+))?\s*(am|pm)/i);
      
      // Prefer music/show time if available, otherwise use door time
      const timeMatch = musicTimeMatch || showTimeMatch || doorTimeMatch;
      
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2] || '0', 10);
        const period = timeMatch[3].toLowerCase();
        
        // Convert to 24-hour format
        if (period === 'pm' && hour < 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        
        startHour = hour;
        endHour = Math.min(hour + 4, 23); // End 4 hours later or at 11pm, whichever is earlier
      }
    }
    
    // Create the start date/time
    const startDate = new Date(date);
    startDate.setHours(startHour, 0, 0, 0);
    
    // Create the end date/time (4 hours later)
    const endDate = new Date(date);
    endDate.setHours(endHour, 0, 0, 0);
    
    // Format dates for iCalendar
    return {
      startDate: formatDateForIcs(startDate),
      endDate: formatDateForIcs(endDate)
    };
  }

  /**
   * Formats a Date object for iCalendar
   * @param {Date} date - The date to format
   * @returns {string} - The formatted date (yyyyMMddTHHmmssZ)
   */
  function formatDateForIcs(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Generates a unique identifier for an event
   * @param {Object} event - The event object
   * @returns {string} - A unique ID for the event
   */
  function generateUid(event) {
    return `${event.id || event.title.replace(/\s+/g, '-')}-${event.date.replace(/\D/g, '')}-${event.venue}@farewell-howdy.com`;
  }

  /**
   * Converts events to iCalendar format
   * @param {Array} events - Array of event objects
   * @returns {string} - iCalendar formatted string
   */
  function generateIcsContent(events) {
    // iCalendar header
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Farewell & Howdy//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Farewell & Howdy Events',
      'X-WR-TIMEZONE:America/Chicago',
      'X-WR-CALDESC:Upcoming events at Farewell & Howdy in Kansas City, MO'
    ];
    
    // Add each event
    events.forEach(event => {
      const location = event.venue === 'farewell' 
        ? 'Farewell, 6515 Stadium Drive, Kansas City, MO'
        : 'Howdy, 6523 Stadium Drive, Kansas City, MO';
      
      const { startDate, endDate } = formatIcsDate(event.date, event.time);
      
      const description = [
        event.description,
        '',
        `Time: ${event.time || 'TBD'}`,
        `Age: ${event.ageRestriction || 'See venue'}`,
        event.price ? `Price: ${event.price}` : '',
        event.ticketLink ? `Tickets: ${event.ticketLink}` : ''
      ].filter(Boolean).join('\\n');
      
      icsContent = icsContent.concat([
        'BEGIN:VEVENT',
        `UID:${generateUid(event)}`,
        `DTSTAMP:${formatDateForIcs(new Date())}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeIcsText(event.title)} @ ${event.venue.charAt(0).toUpperCase() + event.venue.slice(1)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        `LOCATION:${escapeIcsText(location)}`,
        `URL:${event.ticketLink || window.location.origin}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'TRIGGER:-PT24H',  // Reminder 24 hours before
        'END:VALARM',
        'END:VEVENT'
      ]);
    });
    
    // iCalendar footer
    icsContent.push('END:VCALENDAR');
    
    return icsContent.join('\r\n');
  }
})();
