/**
 * Featured Videos Management Module
 * 
 * This module handles the functionality for managing featured YouTube videos
 * that appear in the carousel on the blog/news page.
 */

// Video management state
let featuredVideos = [];
let isLoadingVideos = false;

// DOM Elements
const youtubeListContainer = document.getElementById('youtube-list-container');
const youtubeUrlInput = document.getElementById('youtube-url');
const addYoutubeBtn = document.getElementById('add-youtube-btn');
const saveVideosBtn = document.getElementById('save-featured-videos-btn');
const videosStatusEl = document.getElementById('featured-videos-status');
const previewContainer = document.getElementById('featured-videos-preview-container');

// Initialize Featured Videos Management
function initFeaturedVideosManager() {
    if (!youtubeListContainer || !youtubeUrlInput || !addYoutubeBtn || !saveVideosBtn) {
        console.warn('Featured Videos elements not found, skipping initialization');
        return;
    }

    // Event Listeners
    addYoutubeBtn.addEventListener('click', addYoutubeVideo);
    saveVideosBtn.addEventListener('click', saveFeaturedVideos);
    youtubeUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addYoutubeVideo();
        }
    });

    // Load existing videos
    loadFeaturedVideos();
}

// Load featured videos from the API
async function loadFeaturedVideos() {
    isLoadingVideos = true;
    showStatus(videosStatusEl, 'Loading featured videos...', 'info');
    
    try {
        // Try the primary endpoint first
        const response = await api.get('/api/admin/featured');
        const data = response.data || {};
        console.log('Featured data from admin/featured:', data);
        
        // If no videos found in primary endpoint, check the blog/featured endpoint
        if (!data.youtube || (Array.isArray(data.youtube) && data.youtube.length === 0)) {
            try {
                const blogResponse = await api.get('/api/admin/blog/featured');
                const blogData = blogResponse.data || {};
                console.log('Featured data from blog/featured:', blogData);
                
                if (blogData.youtubeUrl) {
                    // Extract videos from the blog/featured endpoint
                    if (typeof blogData.youtubeUrl === 'string') {
                        featuredVideos = blogData.youtubeUrl.split(',').filter(url => url.trim());
                    } else if (Array.isArray(blogData.youtubeUrl)) {
                        featuredVideos = blogData.youtubeUrl.filter(url => url);
                    }
                    console.log('Found videos in blog/featured:', featuredVideos);
                }
            } catch (e) {
                console.warn('Could not load from blog/featured endpoint:', e);
            }
        } else {
            // Extract YouTube URLs from the featured content
            if (typeof data.youtube === 'string') {
                // Handle single URL
                featuredVideos = [data.youtube];
            } else if (Array.isArray(data.youtube)) {
                // Handle array of URLs
                featuredVideos = data.youtube.filter(url => url);
            }
            console.log('Found videos in admin/featured:', featuredVideos);
        }
        
        // Render the videos list and preview
        renderYoutubeList();
        renderPreview();
        
        showStatus(videosStatusEl, 'Featured videos loaded', 'success', 3000);
    } catch (error) {
        console.error('Failed to load featured videos:', error);
        showStatus(videosStatusEl, 'Failed to load featured videos', 'error');
        featuredVideos = [];
    } finally {
        isLoadingVideos = false;
    }
}

// Add a YouTube video to the list
function addYoutubeVideo() {
    const url = youtubeUrlInput.value.trim();
    if (!url) {
        showStatus(videosStatusEl, 'Please enter a YouTube URL', 'error', 3000);
        return;
    }
    
    // Validate YouTube URL
    try {
        const videoUrl = new URL(url);
        if (!videoUrl.hostname.includes('youtube.com') && !videoUrl.hostname.includes('youtu.be')) {
            showStatus(videosStatusEl, 'Please enter a valid YouTube URL', 'error', 3000);
            return;
        }
        
        // Extract video ID
        let videoId;
        if (videoUrl.hostname.includes('youtube.com')) {
            videoId = videoUrl.searchParams.get('v');
        } else if (videoUrl.hostname.includes('youtu.be')) {
            videoId = videoUrl.pathname.slice(1);
        }
        
        if (!videoId) {
            showStatus(videosStatusEl, 'Could not extract video ID from URL', 'error', 3000);
            return;
        }
        
        // Add to array and clear input
        featuredVideos.push(url);
        youtubeUrlInput.value = '';
        
        // Re-render the list and preview
        renderYoutubeList();
        renderPreview();
        
        showStatus(videosStatusEl, 'Video added', 'success', 2000);
    } catch (e) {
        showStatus(videosStatusEl, 'Please enter a valid URL', 'error', 3000);
    }
}

// Render the YouTube videos list
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
                
                // Optionally, you could fetch video titles from the YouTube API
                // but that would require API keys and additional complexity
            }
            
            const itemEl = document.createElement('div');
            itemEl.className = 'youtube-item';
            itemEl.dataset.index = index;
            itemEl.innerHTML = `
                <span class="drag-handle">☰</span>
                <span class="video-title">${videoTitle}</span>
                <button type="button" class="remove-btn" title="Remove video">×</button>
            `;
            
            // Add event listener to remove button
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
    
    // Initialize drag-and-drop reordering
    initDragAndDrop();
}

// Initialize drag-and-drop functionality
function initDragAndDrop() {
    const items = youtubeListContainer.querySelectorAll('.youtube-item');
    
    items.forEach(item => {
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
                
                // Remove item from original position
                featuredVideos.splice(fromIndex, 1);
                
                // Insert at new position
                featuredVideos.splice(toIndex, 0, temp);
                
                // Re-render
                renderYoutubeList();
                renderPreview();
            }
        });
    });
}

// Render the preview of the featured videos
function renderPreview() {
    if (!previewContainer) return;
    
    if (featuredVideos.length === 0) {
        previewContainer.innerHTML = '<p>No featured videos added yet</p>';
        return;
    }
    
    // Create YouTube embed
    previewContainer.innerHTML = createYouTubeEmbed(featuredVideos);
}

// Create YouTube embed HTML
function createYouTubeEmbed(urls) {
    if (!urls || urls.length === 0) return '<p>No videos available</p>';
    
    // Support array of URLs
    let urlArr = Array.isArray(urls) ? urls : [urls];
    urlArr = urlArr.filter(Boolean);
    
    if (urlArr.length === 0) return '<p>No valid videos</p>';
    
    if (urlArr.length === 1) {
        // Single video
        try {
            let videoId;
            const videoUrl = new URL(urlArr[0]);
            
            if (videoUrl.hostname.includes('youtube.com')) {
                videoId = videoUrl.searchParams.get('v');
            } else if (videoUrl.hostname.includes('youtu.be')) {
                videoId = videoUrl.pathname.slice(1);
            }
            
            if (!videoId) return '<p>Invalid YouTube URL</p>';
            
            return `<div class="embed-container" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;">
                <iframe src="https://www.youtube.com/embed/${videoId}" 
                    style="position:absolute;top:0;left:0;width:100%;height:100%;" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
                </div>`;
        } catch {
            return '<p>Invalid YouTube URL</p>';
        }
    }
    
    // Carousel for multiple videos
    let carouselId = 'yt-carousel-' + Math.random().toString(36).slice(2, 8);
    let slides = urlArr.map((url, i) => {
        try {
            let videoId;
            const videoUrl = new URL(url);
            
            if (videoUrl.hostname.includes('youtube.com')) {
                videoId = videoUrl.searchParams.get('v');
            } else if (videoUrl.hostname.includes('youtu.be')) {
                videoId = videoUrl.pathname.slice(1);
            }
            
            if (!videoId) return '';
            
            return `<div class="yt-slide" style="display:${i === 0 ? 'block' : 'none'};">\
                <iframe src="https://www.youtube.com/embed/${videoId}" 
                    style="position:absolute;top:0;left:0;width:100%;height:100%;" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
                </div>`;
        } catch {
            return '<p>Invalid YouTube URL</p>';
        }
    }).join('');
    
    // Carousel controls
    let controls = `<button class="yt-prev" onclick="ytCarouselNav('${carouselId}', -1)">Prev</button>
        <button class="yt-next" onclick="ytCarouselNav('${carouselId}', 1)">Next</button>`;
    
    // Wrapper
    return `<div id="${carouselId}" class="yt-carousel" style="position:relative;max-width:100%;height:0;padding-bottom:56.25%;overflow:hidden;">
        ${slides}
        <div class="yt-controls" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:2;">${controls}</div>
    </div>
    <script>
        function ytCarouselNav(carouselId, dir) {
            const carousel = document.getElementById(carouselId);
            if (!carousel) return;
            const slides = carousel.querySelectorAll('.yt-slide');
            let active = Array.from(slides).findIndex(s => s.style.display !== 'none');
            slides[active].style.display = 'none';
            let next = (active + dir + slides.length) % slides.length;
            slides[next].style.display = 'block';
        }
    </script>`;
}

// Save featured videos to the API
async function saveFeaturedVideos() {
    showStatus(videosStatusEl, 'Saving featured videos...', 'info');
    
    try {
        // Save to the admin/featured endpoint
        const response = await api.post('/api/admin/featured', {
            youtube: featuredVideos
        });
        
        // Also save to main featured endpoint to ensure compatibility
        // This ensures the videos appear in both admin and public views
        try {
            await api.post('/api/admin/featured', {
                youtube: featuredVideos
            });
            
            console.log('Featured videos saved to main endpoint');
        } catch (e) {
            console.warn('Could not save to featured endpoint:', e);
        }
        
        showStatus(videosStatusEl, 'Featured videos saved successfully', 'success', 3000);
        
        // Refresh the blog page if it's in an iframe
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

// Show status message
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

// Export functions for use in main admin script
window.featuredVideosManager = {
    init: initFeaturedVideosManager,
    load: loadFeaturedVideos
};
