/**
 * Simplified Public Blog Display
 * 
 * This is the public-only version of the blog/news page that:
 * 1. Displays blog posts in reverse chronological order (newest first)
 * 2. Shows featured content including YouTube videos
 * 3. Links to the main admin dashboard for content management
 * 
 * All admin functionality has been removed and consolidated in the main admin dashboard.
 */

const API_BASE = '/api';

// DOM Elements
const publicPostsListEl = document.getElementById('public-posts-list');
const publicFeaturedContentEl = document.getElementById('public-featured-content');

/**
 * Creates a YouTube embed from one or more URLs
 * @param {string|string[]} urls - Single URL or array of URLs
 * @returns {string} HTML for embedding the video(s)
 */
function createYouTubeEmbed(urls) {
    if (!urls) return '';
    console.log('Creating YouTube embed for:', urls);
    
    // Support comma-separated or array of URLs
    let urlArr = Array.isArray(urls) ? urls : (typeof urls === 'string' ? urls.split(',').map(u => u.trim()).filter(Boolean) : []);
    urlArr = urlArr.filter(Boolean);
    console.log('Processed URL array:', urlArr);
    
    if (urlArr.length === 0) return '';
    
    if (urlArr.length === 1) {
        // Single video
        try {
            let videoId;
            const url = urlArr[0];
            
            // Handle different YouTube URL formats
            if (url.includes('youtube.com/watch')) {
                videoId = new URL(url).searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1].split('?')[0];
            }
            
            if (!videoId) {
                console.log('Could not extract video ID from:', url);
                return '<p>Invalid YouTube URL</p>';
            }
            
            console.log('Embedding single video with ID:', videoId);
            return `<div class="embed-container">
                <iframe src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
                </div>`;
        } catch (error) {
            console.error('Error creating YouTube embed:', error);
            return '<p>Invalid YouTube URL</p>';
        }
    }
    
    // Carousel for multiple videos
    console.log('Creating carousel for multiple videos:', urlArr);
    let carouselId = 'yt-carousel-' + Math.random().toString(36).slice(2, 8);
    let slides = urlArr.map((url, i) => {
        try {
            let videoId;
            
            // Handle different YouTube URL formats
            if (url.includes('youtube.com/watch')) {
                videoId = new URL(url).searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1].split('?')[0];
            }
            
            if (!videoId) return '';
            
            return `<div class="yt-slide" style="display:${i === 0 ? 'block' : 'none'};">
                <iframe src="https://www.youtube.com/embed/${videoId}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen></iframe>
            </div>`;
        } catch (error) {
            console.error('Error creating carousel slide:', error);
            return '';
        }
    }).filter(Boolean).join('');
    
    // Add video counter indicator
    let indicator = urlArr.length > 1 ? 
        `<div class="yt-indicator">Video 1/${urlArr.length}</div>` : '';
    
    // Carousel controls
    let controls = `
        <button class="yt-prev" onclick="window.ytCarouselNav('${carouselId}', -1)">Prev</button>
        <button class="yt-next" onclick="window.ytCarouselNav('${carouselId}', 1)">Next</button>
    `;
    
    // Wrapper
    return `<div id="${carouselId}" class="yt-carousel" data-current="0" data-total="${urlArr.length}">
        ${slides}
        <div class="yt-controls">${indicator}${controls}</div>
    </div>`;
}

// Carousel navigation logic (global for inline onclick)
window.ytCarouselNav = function(carouselId, dir) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.yt-slide');
    let active = Array.from(slides).findIndex(s => s.style.display !== 'none');
    slides[active].style.display = 'none';
    
    let next = (active + dir + slides.length) % slides.length;
    slides[next].style.display = 'block';
    
    // Update indicator if it exists
    const indicator = carousel.querySelector('.yt-indicator');
    if (indicator) {
        const total = carousel.getAttribute('data-total') || slides.length;
        indicator.textContent = `Video ${next + 1}/${total}`;
    }
    
    // Update carousel data attribute
    carousel.setAttribute('data-current', next);
};

/**
 * Fetches data from the API
 * @param {string} endpoint - API endpoint to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} API response
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error || `Request failed: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        return response.status === 204 ? { success: true } : await response.json();
    } catch (error) {
        console.error(`API Error: ${error.message}`);
        throw error;
    }
}

/**
 * Loads blog posts from the API and displays them
 */
async function loadPublicPosts() {
    try {
        const { data: posts } = await fetchApi('/blog/posts', { method: 'GET' });
        console.log('Original posts order:', posts.map(p => ({ title: p.title, date: p.created_at })));
        
        // Sort posts in reverse chronological order (newest first)
        const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        console.log('Sorted posts order:', sortedPosts.map(p => ({ title: p.title, date: p.created_at })));
        
        publicPostsListEl.innerHTML = sortedPosts.length ? sortedPosts.map(post => `
            <article class="post-item-public">
                <h3>${post.title.replace(/</g, '&lt;')}</h3>
                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-image-public">` : ''}
                <div class="post-content-public">${post.content}</div>
                <p><small>Posted: ${new Date(post.created_at).toLocaleDateString()}</small></p>
            </article>
        `).join('') : '<p>No posts available</p>';
    } catch (err) {
        console.error('Error loading posts:', err);
        publicPostsListEl.innerHTML = `
            <div class="error-fallback">
                <p>Unable to load posts at this time.</p>
                <p><small>This page will work correctly after deployment to Cloudflare.</small></p>
            </div>
        `;
    }
}

/**
 * Loads featured content from the API and displays it
 */
async function loadPublicFeatured() {
    try {
        const { data: featured } = await fetchApi('/blog/featured', { method: 'GET' });
        console.log('Featured data from API:', featured);
        
        // Create featured content HTML with enhanced styling
        let featuredHTML = `<div class="featured-content-wrapper">`;
        
        // Add featured text
        if (featured.text) {
            featuredHTML += `<div class="featured-text">${featured.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>`;
        }
        
        // Add YouTube videos with enhanced carousel if multiple videos
        if (featured.youtubeUrl) {
            console.log('YouTube URLs:', featured.youtubeUrl);
            featuredHTML += `<div class="featured-video-container">${createYouTubeEmbed(featured.youtubeUrl)}</div>`;
        } else if (featured.youtube) {
            // Support the alternate 'youtube' property
            console.log('YouTube property found:', featured.youtube);
            featuredHTML += `<div class="featured-video-container">${createYouTubeEmbed(featured.youtube)}</div>`;
        }
        
        featuredHTML += `</div>`;
        
        publicFeaturedContentEl.innerHTML = featuredHTML;
    } catch (err) {
        console.error('Error loading featured content:', err);
        publicFeaturedContentEl.innerHTML = `
            <div class="error-fallback">
                <p>Unable to load featured content at this time.</p>
                <p><small>This page will work correctly after deployment to Cloudflare.</small></p>
            </div>
        `;
    }
}

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('News.js initialized');
    
    // Check if we're in the right page
    if (publicPostsListEl) {
        console.log('Loading public content');
        loadPublicPosts();
        loadPublicFeatured();
    }
});
