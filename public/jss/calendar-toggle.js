document.addEventListener('DOMContentLoaded', () => {
  const calendarToggle = document.getElementById('calendar-toggle');
  const calendarImages = document.getElementById('calendar-images');
  if (calendarToggle && calendarImages) {
    const buttons = calendarToggle.querySelectorAll('button');
    const images = calendarImages.querySelectorAll('img');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const type = button.dataset.type;
        const currentVenue = document.body.dataset.state;
        images.forEach((image) => {
          if (image.dataset.venue === currentVenue && image.dataset.type === type) {
            image.style.display = 'block';
          } else {
            image.style.display = 'none';
          }
        });
      });
    });
    const currentVenue = document.body.dataset.state;
    images.forEach((image) => {
      if (image.dataset.venue === currentVenue && image.dataset.type === 'cal') {
        image.style.display = 'block';
      } else {
        image.style.display = 'none';
      }
    });
  }
});
