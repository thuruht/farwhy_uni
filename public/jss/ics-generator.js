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
  const now = new Date();
  
  try {
    // Define possible API endpoints to try
    const endpoints = venue 
      ? [`${BASE_URL}/list/${venue}`, `${BASE_URL}/api/list/${venue}`]
      : [`${BASE_URL}/list/all`, `${BASE_URL}/api/list/all`, `${BASE_URL}/api/events`];
    
    console.log(`[ICS] Fetching events for venue: ${venue || 'ALL VENUES'}`);
    
    // Try each endpoint until one works
    let events = [];
    let successUrl = null;
    
    for (const url of endpoints) {
      try {
        console.log(`[ICS] Trying to fetch events from: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          events = Array.isArray(data) ? data : (data.data || []);
          successUrl = url;
          console.log(`[ICS] Successfully fetched ${events.length} events from ${url}`);
          
          // If we need to filter by venue
          if (venue && events.length > 0) {
            const venueSpecificEvents = events.filter(event => event.venue === venue);
            console.log(`[ICS] Filtered to ${venueSpecificEvents.length} events for venue ${venue}`);
            events = venueSpecificEvents;
          }
          
          // Only break if we got events
          if (events.length > 0) {
            break;
          }
        }
      } catch (err) {
        console.warn(`[ICS] Failed to fetch from ${url}:`, err);
        // Continue to the next URL
      }
    }
    
    if (events.length === 0) {
      // If all endpoints failed, try a more aggressive fallback
      try {
        const fallbackUrl = `${BASE_URL}/api/events?includePast=false&limit=100`;
        console.log(`[ICS] Trying emergency fallback endpoint: ${fallbackUrl}`);
        const response = await fetch(fallbackUrl);
        
        if (response.ok) {
          const responseData = await response.json();
          const allEvents = Array.isArray(responseData) ? responseData : (responseData.data || []);
          
          // Filter for upcoming events and specific venue if needed
          events = allEvents.filter(event => {
            const eventDate = new Date(event.date);
            const isUpcoming = eventDate >= now;
            const venueMatches = venue ? event.venue === venue : true;
            return isUpcoming && venueMatches;
          });
          
          console.log(`[ICS] Emergency fallback retrieved ${events.length} upcoming events`);
          
          // Log the venues found to help debug
          if (events.length > 0) {
            const venues = [...new Set(events.map(e => e.venue))];
            console.log(`[ICS] Events found for venues: ${venues.join(', ')}`);
          }
        }
      } catch (fallbackError) {
        console.error('[ICS] Emergency fallback fetch failed:', fallbackError);
      }
    }
    
    // Sort events by date (soonest first)
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
    
    // Prefer music time if available, otherwise use door time
    const timeMatch = musicTimeMatch || doorTimeMatch;
    
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

/**
 * Generates and downloads an .ics file with all upcoming events
 * @param {Event} e - The click event
 * @param {string} venue - Optional: 'farewell', 'howdy', or null for both
 */
async function downloadIcsFile(e, venue = null) {
  e.preventDefault();
  
  // Show loading indicator
  const originalText = e.target.textContent;
  e.target.textContent = 'Generating calendar...';
  
  try {
    // Fetch events
    const events = await fetchUpcomingEvents(venue);
    
    if (events.length === 0) {
      console.warn('[ICS] No upcoming events found');
      alert('No upcoming events found');
      e.target.textContent = originalText;
      return;
    }
    
    // Generate ICS content
    const icsContent = generateIcsContent(events);
    
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
    e.target.textContent = originalText;
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Find all .cal-link-ics elements and attach the event handler
  const icsLinks = document.querySelectorAll('.cal-link-ics');
  
  icsLinks.forEach(link => {
    // Don't force update text - preserve what's in the HTML
    // link.textContent = "Download All Events";  // Removed to respect HTML text
    
    link.addEventListener('click', (e) => {
      // More reliable check for events.html page
      const isEventsPage = window.location.pathname.endsWith('events.html') || 
                          window.location.pathname.includes('/events.html');
      
      if (isEventsPage) {
        // Fix for events.html calendar download
        console.log(`[ICS] Generating calendar for all venues (from events.html)`);
        
        // Force null venue parameter to ensure all events are downloaded, regardless of body data-state
        downloadIcsFile(e, null);
      } else {
        // On other pages, get the current venue state from the body
        const currentState = document.body?.dataset.state || 'farewell';
        console.log(`[ICS] Generating calendar for venue: ${currentState}`);
        
        // Download the ICS file for the current venue only
        downloadIcsFile(e, currentState);
      }
    });
  });
  
  console.log(`[ICS] Initialized calendar downloads for ${icsLinks.length} links`);
});
