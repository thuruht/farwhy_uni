let featuredVideos = [];
let isLoadingVideos = false;
const youtubeListContainer = document.getElementById('youtube-list-container');
const youtubeUrlInput = document.getElementById('youtube-url');
const addYoutubeBtn = document.getElementById('add-youtube-btn');
const saveVideosBtn = document.getElementById('save-featured-videos-btn');
const videosStatusEl = document.getElementById('featured-videos-status');
const previewContainer = document.getElementById('featured-videos-preview-container');
function initFeaturedVideosManager() {
  if (!youtubeListContainer || !youtubeUrlInput || !addYoutubeBtn || !saveVideosBtn) {
    console.warn('Featured Videos elements not found, skipping initialization');
    return;
  }
  addYoutubeBtn.addEventListener('click', addYoutubeVideo);
  saveVideosBtn.addEventListener('click', saveFeaturedVideos);
  youtubeUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addYoutubeVideo();
    }
  });
  loadFeaturedVideos();
}
async function loadFeaturedVideos() {
  isLoadingVideos = true;
  showStatus(videosStatusEl, 'Loading featured videos...', 'info');
  try {
    const response = await api.get('/api/admin/featured');
    const data = response.data || {};
    console.log('Featured data from admin/featured:', data);
    if (!data.youtube || (Array.isArray(data.youtube) && data.youtube.length === 0)) {
      try {
        const blogResponse = await api.get('/api/admin/blog/featured');
        const blogData = blogResponse.data || {};
        console.log('Featured data from blog/featured:', blogData);
        if (blogData.youtubeUrl) {
          if (typeof blogData.youtubeUrl === 'string') {
            featuredVideos = blogData.youtubeUrl.split(',').filter((url) => url.trim());
          } else if (Array.isArray(blogData.youtubeUrl)) {
            featuredVideos = blogData.youtubeUrl.filter((url) => url);
          }
          console.log('Found videos in blog/featured:', featuredVideos);
        }
      } catch (e) {
        console.warn('Could not load from blog/featured endpoint:', e);
      }
    } else {
      if (typeof data.youtube === 'string') {
        featuredVideos = [data.youtube];
      } else if (Array.isArray(data.youtube)) {
        featuredVideos = data.youtube.filter((url) => url);
      }
      console.log('Found videos in admin/featured:', featuredVideos);
    }
    renderYoutubeList();
    renderPreview();
    showStatus(videosStatusEl, 'Featured videos loaded', 'success', 3e3);
  } catch (error) {
    console.error('Failed to load featured videos:', error);
    showStatus(videosStatusEl, 'Failed to load featured videos', 'error');
    featuredVideos = [];
  } finally {
    isLoadingVideos = false;
  }
}
function addYoutubeVideo() {
  const url = youtubeUrlInput.value.trim();
  if (!url) {
    showStatus(videosStatusEl, 'Please enter a YouTube URL', 'error', 3e3);
    return;
  }
  try {
    const videoUrl = new URL(url);
    if (!videoUrl.hostname.includes('youtube.com') && !videoUrl.hostname.includes('youtu.be')) {
      showStatus(videosStatusEl, 'Please enter a valid YouTube URL', 'error', 3e3);
      return;
    }
    let videoId;
    if (videoUrl.hostname.includes('youtube.com')) {
      videoId = videoUrl.searchParams.get('v');
    } else if (videoUrl.hostname.includes('youtu.be')) {
      videoId = videoUrl.pathname.slice(1);
    }
    if (!videoId) {
      showStatus(videosStatusEl, 'Could not extract video ID from URL', 'error', 3e3);
      return;
    }
    featuredVideos.push(url);
    youtubeUrlInput.value = '';
    renderYoutubeList();
    renderPreview();
    showStatus(videosStatusEl, 'Video added', 'success', 2e3);
  } catch (e) {
    showStatus(videosStatusEl, 'Please enter a valid URL', 'error', 3e3);
  }
}
function renderYoutubeList() {
  if (!youtubeListContainer) return;
  youtubeListContainer.innerHTML = '';
  if (featuredVideos.length === 0) {
    youtubeListContainer.innerHTML = '<p>No videos added yet</p>';
    return;
  }
  featuredVideos.forEach((url, index) => {
    try {
      const videoUrl = new URL(url);
      let videoId, videoTitle;
      if (videoUrl.hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      } else if (videoUrl.hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.slice(1);
      }
      if (!videoId) {
        videoTitle = 'Invalid YouTube URL';
      } else {
        videoTitle = `YouTube Video: ${videoId}`;
      }
      const itemEl = document.createElement('div');
      itemEl.className = 'youtube-item';
      itemEl.dataset.index = index;
      itemEl.innerHTML = `\n                <span class="drag-handle">☰</span>\n                <span class="video-title">${videoTitle}</span>\n                <button type="button" class="remove-btn" title="Remove video">×</button>\n            `;
      const removeBtn = itemEl.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        featuredVideos.splice(index, 1);
        renderYoutubeList();
        renderPreview();
      });
      youtubeListContainer.appendChild(itemEl);
    } catch (e) {
      console.error('Error rendering video item:', e);
    }
  });
  initDragAndDrop();
}
function initDragAndDrop() {
  const items = youtubeListContainer.querySelectorAll('.youtube-item');
  items.forEach((item) => {
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.index);
      item.classList.add('dragging');
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(item.dataset.index);
      if (fromIndex !== toIndex) {
        const temp = featuredVideos[fromIndex];
        featuredVideos.splice(fromIndex, 1);
        featuredVideos.splice(toIndex, 0, temp);
        renderYoutubeList();
        renderPreview();
      }
    });
  });
}
function renderPreview() {
  if (!previewContainer) return;
  if (featuredVideos.length === 0) {
    previewContainer.innerHTML = '<p>No featured videos added yet</p>';
    return;
  }
  previewContainer.innerHTML = createYouTubeEmbed(featuredVideos);
}
function createYouTubeEmbed(urls) {
  if (!urls || urls.length === 0) return '<p>No videos available</p>';
  let urlArr = Array.isArray(urls) ? urls : [urls];
  urlArr = urlArr.filter(Boolean);
  if (urlArr.length === 0) return '<p>No valid videos</p>';
  if (urlArr.length === 1) {
    try {
      let videoId;
      const videoUrl = new URL(urlArr[0]);
      if (videoUrl.hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      } else if (videoUrl.hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.slice(1);
      }
      if (!videoId) return '<p>Invalid YouTube URL</p>';
      return `<div class="embed-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">\n                <iframe src="https://www.youtube.com/embed/${videoId}" \n                    style="position:absolute;top:0;left:0;width:100%;height:100%;" \n                    frameborder="0" \n                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" \n                    allowfullscreen></iframe>\n                </div>`;
    } catch {
      return '<p>Invalid YouTube URL</p>';
    }
  }
  let carouselId = 'yt-carousel-' + Math.random().toString(36).slice(2, 8);
  let slides = urlArr
    .map((url, i) => {
      try {
        let videoId;
        const videoUrl = new URL(url);
        if (videoUrl.hostname.includes('youtube.com')) {
          videoId = videoUrl.searchParams.get('v');
        } else if (videoUrl.hostname.includes('youtu.be')) {
          videoId = videoUrl.pathname.slice(1);
        }
        if (!videoId) return '';
        return `<div class="yt-slide" style="display:${i === 0 ? 'block' : 'none'};">                <iframe src="https://www.youtube.com/embed/${videoId}" \n                    style="position:absolute;top:0;left:0;width:100%;height:100%;" \n                    frameborder="0" \n                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" \n                    allowfullscreen></iframe>\n                </div>`;
      } catch {
        return '<p>Invalid YouTube URL</p>';
      }
    })
    .join('');
  let controls = `<button class="yt-prev" onclick="ytCarouselNav('${carouselId}', -1)">Prev</button>\n        <button class="yt-next" onclick="ytCarouselNav('${carouselId}', 1)">Next</button>`;
  return `<div id="${carouselId}" class="yt-carousel" style="position:relative;max-width:100%;height:0;padding-bottom:56.25%;overflow:hidden;">\n        ${slides}\n        <div class="yt-controls" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:2;">${controls}</div>\n    </div>\n    <script>\n        function ytCarouselNav(carouselId, dir) {\n            const carousel = document.getElementById(carouselId);\n            if (!carousel) return;\n            const slides = carousel.querySelectorAll('.yt-slide');\n            let active = Array.from(slides).findIndex(s => s.style.display !== 'none');\n            slides[active].style.display = 'none';\n            let next = (active + dir + slides.length) % slides.length;\n            slides[next].style.display = 'block';\n        }\n    <\/script>`;
}
async function saveFeaturedVideos() {
  showStatus(videosStatusEl, 'Saving featured videos...', 'info');
  try {
    const response = await api.post('/api/admin/featured', { youtube: featuredVideos });
    try {
      await api.post('/api/admin/featured', { youtube: featuredVideos });
      console.log('Featured videos saved to main endpoint');
    } catch (e) {
      console.warn('Could not save to featured endpoint:', e);
    }
    showStatus(videosStatusEl, 'Featured videos saved successfully', 'success', 3e3);
    try {
      const blogFrame = document.querySelector('iframe[src*="/u/index.html"]');
      if (blogFrame && blogFrame.contentWindow) {
        blogFrame.contentWindow.location.reload();
      }
    } catch (e) {
      console.warn('Could not refresh blog iframe:', e);
    }
  } catch (error) {
    console.error('Failed to save featured videos:', error);
    showStatus(videosStatusEl, 'Failed to save featured videos', 'error');
  }
}
function showStatus(element, message, type = 'info', duration = 0) {
  if (!element) return;
  element.innerHTML = `<div class="status-${type}">${message}</div>`;
  element.style.display = 'block';
  if (duration > 0) {
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
}
window.featuredVideosManager = { init: initFeaturedVideosManager, load: loadFeaturedVideos };
