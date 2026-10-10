(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const overlay = document.querySelector('.events-modal-overlay');
          if (overlay && overlay.classList.contains('active')) {
            addCalendarButton();
          }
        }
      });
    });
    const overlay = document.querySelector('.events-modal-overlay');
    if (overlay) {
      observer.observe(overlay, { attributes: true });
      console.log('[Calendar] Initialized event modal calendar extension');
    }
  });
  function addCalendarButton() {
    const eventDetails = document.querySelector('.event-details');
    if (!eventDetails || document.querySelector('.event-calendar-download')) {
      return;
    }
    const buttonsContainer = eventDetails.querySelector('.event-buttons');
    if (!buttonsContainer) {
      console.warn('[Calendar] Could not find buttons container');
      return;
    }
    const calendarButton = document.createElement('a');
    calendarButton.className = 'event-calendar-download glitch-effect tooltip';
    calendarButton.innerHTML =
      '<span class="calendar-icon">📅</span> ADD TO CALENDAR<span class="tooltip-text">Download this event as an .ics file to add it to your calendar app (Google Calendar, Apple Calendar, Outlook, etc.)</span>';
    calendarButton.href = '#';
    calendarButton.addEventListener('click', generateSingleEventCalendar);
    buttonsContainer.appendChild(calendarButton);
    console.log('[Calendar] Added calendar download button to event modal');
  }
  async function generateSingleEventCalendar(e) {
    e.preventDefault();
    const eventId = document.querySelector('.event-list-item.active')?.dataset.id;
    if (!eventId) {
      console.warn('[Calendar] No event selected');
      return;
    }
    const button = e.target.closest('.event-calendar-download');
    const originalText = button.innerHTML;
    button.innerHTML = 'GENERATING...';
    button.style.pointerEvents = 'none';
    try {
      const event = extractEventDetails();
      if (!event) {
        throw new Error('Could not extract event details');
      }
      const icsContent = generateIcsContent([event]);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      const venue = event.venue.charAt(0).toUpperCase() + event.venue.slice(1);
      const formattedDate = event.date.replace(/-/g, '');
      downloadLink.download = `${venue}_Event_${formattedDate}.ics`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('[Calendar] Error generating ICS file:', error);
      alert('Error generating calendar file. Please try again later.');
    } finally {
      button.innerHTML = originalText;
      button.style.pointerEvents = '';
    }
  }
  function extractEventDetails() {
    try {
      const eventDetailsEl = document.querySelector('.event-details');
      if (!eventDetailsEl) return null;
      const eventId = document.querySelector('.event-list-item.active')?.dataset.id;
      const title = eventDetailsEl.querySelector('.event-title')?.textContent;
      const venueBadge = eventDetailsEl.querySelector('.venue-badge');
      const venue = venueBadge?.classList.contains('venue-farewell') ? 'farewell' : 'howdy';
      const dateTimeText = eventDetailsEl.querySelector('.event-date-time')?.textContent || '';
      const [dateText, timeText] = dateTimeText.split('|').map((str) => str.trim());
      const dateObj = parseDisplayDate(dateText);
      const dateStr = dateObj ? formatDateISO(dateObj) : '';
      const infoItems = eventDetailsEl.querySelectorAll('.event-info-item');
      let price = '';
      let ageRestriction = '';
      let description = '';
      infoItems.forEach((item) => {
        const text = item.textContent;
        if (text.includes('Price:')) {
          price = text.split('Price:')[1].trim();
        } else if (text.includes('Age:')) {
          ageRestriction = text.split('Age:')[1].trim();
        } else if (text.includes('Info:')) {
          description = text.split('Info:')[1].trim();
        }
      });
      const ticketLink = eventDetailsEl.querySelector('.event-cta')?.href;
      return {
        id: eventId,
        title: title,
        venue: venue,
        date: dateStr,
        time: timeText,
        price: price,
        ageRestriction: ageRestriction,
        description: description,
        ticketLink: ticketLink,
      };
    } catch (error) {
      console.error('[Calendar] Error extracting event details:', error);
      return null;
    }
  }
  function parseDisplayDate(displayDate) {
    try {
      const parts = displayDate.split(', ');
      if (parts.length !== 2) return null;
      const [dayOfWeek, monthDay] = parts;
      const [month, day] = monthDay.split(' ');
      const months = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const monthNum = months[month];
      if (monthNum === undefined) return null;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      let year = currentYear;
      if (monthNum < currentMonth) {
        year = currentYear + 1;
      }
      return new Date(year, monthNum, parseInt(day, 10));
    } catch (error) {
      console.error('[Calendar] Error parsing display date:', error, displayDate);
      return null;
    }
  }
  function formatDateISO(date) {
    if (!date || isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function escapeIcsText(text) {
    if (!text) return '';
    return text.replace(/[\\;,]/g, '\\$&').replace(/\n/g, '\\n');
  }
  function formatIcsDate(dateStr, timeStr) {
    const date = new Date(dateStr);
    let startHour = 19;
    let endHour = 23;
    if (timeStr) {
      const doorTimeMatch = timeStr.match(/Doors at (\d+)(?::(\d+))?\s*(am|pm)/i);
      const musicTimeMatch = timeStr.match(/Music at (\d+)(?::(\d+))?\s*(am|pm)/i);
      const showTimeMatch = timeStr.match(/Show at (\d+)(?::(\d+))?\s*(am|pm)/i);
      const timeMatch = musicTimeMatch || showTimeMatch || doorTimeMatch;
      if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        const minute = parseInt(timeMatch[2] || '0', 10);
        const period = timeMatch[3].toLowerCase();
        if (period === 'pm' && hour < 12) hour += 12;
        if (period === 'am' && hour === 12) hour = 0;
        startHour = hour;
        endHour = Math.min(hour + 4, 23);
      }
    }
    const startDate = new Date(date);
    startDate.setHours(startHour, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(endHour, 0, 0, 0);
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
      const { startDate: startDate, endDate: endDate } = formatIcsDate(event.date, event.time);
      const description = [
        event.description,
        '',
        `Time: ${event.time || 'TBD'}`,
        `Age: ${event.ageRestriction || 'See venue'}`,
        event.price ? `Price: ${event.price}` : '',
        event.ticketLink ? `Tickets: ${event.ticketLink}` : '',
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
        `URL:${event.ticketLink || window.location.origin}`,
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
})();
