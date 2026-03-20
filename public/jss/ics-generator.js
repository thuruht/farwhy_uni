/**
 * ics-generator.js - Generates .ics calendar files for Farewell/Howdy events
 * 
 * This module handles:
 * 1. Fetching upcoming events from the API
 * 2. Converting events to iCalendar format
 * 3. Generating a downloadable .ics file
 */

/**
 * Fetches upcoming events for both venues (or specific venue if provided)
 * @param {string} venue - Optional: 'farewell' or 'howdy'
 * @returns {Promise<Array>} - Array of events
 */
async function fetchUpcomingEvents(venue = null) {
  const BASE_URL = window.location.origin;
  try {
    const url = (venue && venue !== 'both')
      ? `${BASE_URL}/list/${venue}`
      : `${BASE_URL}/api/events`;

    console.log(`[ICS] Fetching events from: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    let events = Array.isArray(data) ? data : (data.data || []);

    if (venue && venue !== 'both') {
      events = events.filter(e => e.venue === venue);
    }

    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('[ICS] Error fetching events:', error);
    return [];
  }
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
  // Parse YYYY-MM-DD safely without UTC offset shift
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

  let startHour = 19, startMin = 0; // default 7pm
  let endHour = 23, endMin = 0;

  if (timeStr) {
    // Match patterns like "7pm", "7:30pm", "Doors 7pm", "Music at 8pm", "6pm to 11pm"
    const musicMatch = timeStr.match(/[Mm]usic(?:\s+at)?\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
    const doorsMatch = timeStr.match(/[Dd]oors?(?:\s+at)?\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
    const simpleMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
    const endMatch   = timeStr.match(/to\s+(\d+)(?::(\d+))?\s*(am|pm)/i);

    const startRef = musicMatch || doorsMatch || simpleMatch;
    if (startRef) {
      let h = parseInt(startRef[1], 10);
      const m = parseInt(startRef[2] || '0', 10);
      const p = startRef[3].toLowerCase();
      if (p === 'pm' && h < 12) h += 12;
      if (p === 'am' && h === 12) h = 0;
      startHour = h; startMin = m;
      endHour = Math.min(h + 4, 23); endMin = 0;
    }
    if (endMatch) {
      let h = parseInt(endMatch[1], 10);
      const m = parseInt(endMatch[2] || '0', 10);
      const p = endMatch[3].toLowerCase();
      if (p === 'pm' && h < 12) h += 12;
      if (p === 'am' && h === 12) h = 0;
      endHour = h; endMin = m;
    }
  }

  const startDate = new Date(year, month - 1, day, startHour, startMin, 0);
  const endDate   = new Date(year, month - 1, day, endHour,   endMin,   0);

  return {
    startDate: formatDateForIcs(startDate),
    endDate:   formatDateForIcs(endDate)
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

    // Support both API field names (event_time) and legacy (time)
    const eventTime = event.event_time || event.time || '';
    const ticketUrl = event.ticket_url || event.ticketLink || '';
    const ageRestr  = event.age_restriction || event.ageRestriction || '';
    const price     = event.price || event.suggestedPrice || '';

    const { startDate, endDate } = formatIcsDate(event.date, eventTime);
    
    const description = [
      event.description,
      '',
      eventTime ? `Time: ${eventTime}` : '',
      ageRestr  ? `Age: ${ageRestr}`   : '',
      price     ? `Price: ${price}`    : '',
      ticketUrl ? `Tickets: ${ticketUrl}` : ''
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
      `URL:${ticketUrl || window.location.origin}`,
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

/**
 * Generates and downloads an .ics file with all upcoming events
 * @param {Event} e - The click event
 * @param {string} venue - Optional: 'farewell', 'howdy', or null for both
 * @param {boolean} futureOnly - Optional: whether to include only future events
 */
async function downloadIcsFile(e, venue = null, futureOnly = false) {
  e.preventDefault();
  
  // Show loading indicator
  const originalText = e.target.closest('.cal-link-ics').innerHTML;
  e.target.closest('.cal-link-ics').innerHTML = '<span class="calendar-icon">⏳</span> Generating calendar...';
  
  try {
    // Fetch events
    const events = await fetchUpcomingEvents(venue);
    
    // Filter for future events if requested
    let filteredEvents = events;
    if (futureOnly) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      filteredEvents = events.filter(event => event.date.split('T')[0] >= todayStr);
      console.log(`[ICS] Filtered to ${filteredEvents.length} future events from ${events.length} total events`);
    }
    
    if (filteredEvents.length === 0) {
      console.warn('[ICS] No upcoming events found');
      alert('No upcoming events found');
      e.target.closest('.cal-link-ics').innerHTML = originalText;
      return;
    }
    
    // Generate ICS content
    const icsContent = generateIcsContent(filteredEvents);
    
    // Create a downloadable blob
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create and trigger download
    const downloadLink = document.createElement('a');
    
    // Create a clear filename that indicates what's being downloaded
    let venueName = "All_Venues";
    if (venue === 'farewell') venueName = "Farewell";
    if (venue === 'howdy') venueName = "Howdy";
    
    const today = new Date();
    const dateStamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    downloadLink.href = url;
    downloadLink.download = `${venueName}_Events_${dateStamp}.ics`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
  } catch (error) {
    console.error('[ICS] Error generating ICS file:', error);
    alert('Error generating calendar file. Please try again later.');
  } finally {
    // Restore original button text
    e.target.closest('.cal-link-ics').innerHTML = originalText;
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const icsLinks = document.querySelectorAll('.cal-link-ics');

  // Attach click event to calendar download links
  icsLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const isEventsPage = window.location.pathname.includes('events.html');
      let venue;
      if (isEventsPage) {
        venue = window.currentVenue || 'both';
      } else {
        venue = document.body?.dataset.state || 'farewell';
      }
      // 'both' means all venues — pass null
      const venueParam = (venue === 'both') ? null : venue;
      console.log(`[ICS] Generating calendar for venue: ${venue}`);
      downloadIcsFile(e, venueParam, true);
    });
  });

  console.log(`[ICS] Initialized calendar downloads for ${icsLinks.length} links`);
});
