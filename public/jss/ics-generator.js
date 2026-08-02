async function fetchUpcomingEvents(venue = null) {
  const BASE_URL = window.location.origin;
  try {
    const url = venue && venue !== 'both' ? `${BASE_URL}/list/${venue}` : `${BASE_URL}/api/events`;
    console.log(`[ICS] Fetching events from: ${url}`);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    let events = Array.isArray(data) ? data : data.data || [];
    if (venue && venue !== 'both') {
      events = events.filter((e) => e.venue === venue);
    }
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('[ICS] Error fetching events:', error);
    return [];
  }
}
function escapeIcsText(text) {
  if (!text) return '';
  return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
}
function formatIcsDate(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  let startHour = 19,
    startMin = 0;
  let endHour = 23,
    endMin = 0;
  if (timeStr) {
    const musicMatch = timeStr.match(/[Mm]usic(?:\s+at)?\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
    const doorsMatch = timeStr.match(/[Dd]oors?(?:\s+at)?\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
    const simpleMatch = timeStr.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
    const endMatch = timeStr.match(/to\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
    const startRef = musicMatch || doorsMatch || simpleMatch;
    if (startRef) {
      let h = parseInt(startRef[1], 10);
      const m = parseInt(startRef[2] || '0', 10);
      const p = startRef[3].toLowerCase();
      if (p === 'pm' && h < 12) h += 12;
      if (p === 'am' && h === 12) h = 0;
      startHour = h;
      startMin = m;
      endHour = Math.min(h + 4, 23);
      endMin = 0;
    }
    if (endMatch) {
      let h = parseInt(endMatch[1], 10);
      const m = parseInt(endMatch[2] || '0', 10);
      const p = endMatch[3].toLowerCase();
      if (p === 'pm' && h < 12) h += 12;
      if (p === 'am' && h === 12) h = 0;
      endHour = h;
      endMin = m;
    }
  }
  const startDate = new Date(year, month - 1, day, startHour, startMin, 0);
  const endDate = new Date(year, month - 1, day, endHour, endMin, 0);
  return { startDate: formatDateForIcs(startDate), endDate: formatDateForIcs(endDate) };
}
function formatDateForIcs(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}
function generateUid(event) {
  return `${event.id || event.title.replace(/\s+/g, '-')}-${event.date.replace(/\D/g, '')}-${event.venue}@farewell-howdy.com`;
}
function generateIcsContent(events) {
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Farewell & Howdy//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Farewell & Howdy Events',
    'X-WR-TIMEZONE:America/Chicago',
    'X-WR-CALDESC:Upcoming events at Farewell & Howdy in Kansas City, MO',
  ];
  events.forEach((event) => {
    const location =
      event.venue === 'farewell'
        ? 'Farewell, 6515 Stadium Drive, Kansas City, MO'
        : 'Howdy, 6523 Stadium Drive, Kansas City, MO';
    const eventTime = event.event_time || event.time || '';
    const ticketUrl = event.ticket_url || event.ticketLink || '';
    const ageRestr = event.age_restriction || event.ageRestriction || '';
    const price = event.price || event.suggestedPrice || '';
    const { startDate: startDate, endDate: endDate } = formatIcsDate(event.date, eventTime);
    const description = [
      event.description,
      '',
      eventTime ? `Time: ${eventTime}` : '',
      ageRestr ? `Age: ${ageRestr}` : '',
      price ? `Price: ${price}` : '',
      ticketUrl ? `Tickets: ${ticketUrl}` : '',
    ]
      .filter(Boolean)
      .join('\\n');
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
      'TRIGGER:-PT24H',
      'END:VALARM',
      'END:VEVENT',
    ]);
  });
  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}
async function downloadIcsFile(e, venue = null, futureOnly = false) {
  e.preventDefault();
  const originalText = e.target.closest('.cal-link-ics').innerHTML;
  e.target.closest('.cal-link-ics').innerHTML =
    '<span class="calendar-icon">⏳</span> Generating calendar...';
  try {
    const events = await fetchUpcomingEvents(venue);
    let filteredEvents = events;
    if (futureOnly) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      filteredEvents = events.filter((event) => event.date.split('T')[0] >= todayStr);
      console.log(
        `[ICS] Filtered to ${filteredEvents.length} future events from ${events.length} total events`
      );
    }
    if (filteredEvents.length === 0) {
      console.warn('[ICS] No upcoming events found');
      alert('No upcoming events found');
      e.target.closest('.cal-link-ics').innerHTML = originalText;
      return;
    }
    const icsContent = generateIcsContent(filteredEvents);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    let venueName = 'All_Venues';
    if (venue === 'farewell') venueName = 'Farewell';
    if (venue === 'howdy') venueName = 'Howdy';
    const today = new Date();
    const dateStamp = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    downloadLink.href = url;
    downloadLink.download = `${venueName}_Events_${dateStamp}.ics`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error('[ICS] Error generating ICS file:', error);
    alert('Error generating calendar file. Please try again later.');
  } finally {
    e.target.closest('.cal-link-ics').innerHTML = originalText;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const icsLinks = document.querySelectorAll('.cal-link-ics');
  icsLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const isEventsPage = window.location.pathname.includes('events.html');
      let venue;
      if (isEventsPage) {
        venue = window.currentVenue || 'both';
      } else {
        venue = document.body?.dataset.state || 'farewell';
      }
      const venueParam = venue === 'both' ? null : venue;
      console.log(`[ICS] Generating calendar for venue: ${venue}`);
      downloadIcsFile(e, venueParam, true);
    });
  });
  console.log(`[ICS] Initialized calendar downloads for ${icsLinks.length} links`);
});
