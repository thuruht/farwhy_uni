document.addEventListener('DOMContentLoaded', () => {
  const zoomableImages = document.querySelectorAll('.cally, #slide-image, .event-item img');
  if (zoomableImages.length > 0) {
    const modal = document.createElement('div');
    modal.id = 'image-zoom-modal';
    modal.classList.add('image-zoom-modal');
    const closeBtn = document.createElement('span');
    closeBtn.classList.add('image-zoom-close');
    closeBtn.innerHTML = '&times;';
    modal.appendChild(closeBtn);
    const modalImg = document.createElement('img');
    modalImg.classList.add('image-zoom-modal-content');
    modal.appendChild(modalImg);
    document.body.appendChild(modal);
    zoomableImages.forEach((image) => {
      image.addEventListener('click', () => {
        modal.style.display = 'block';
        modalImg.src = image.src;
      });
    });
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
});
