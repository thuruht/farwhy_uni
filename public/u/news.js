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
            
            if (!videoId) {
                console.warn('Could not extract video ID from:', url);
                return '';
            }
            
            console.log(`Adding slide ${i} with video ID: ${videoId}`);
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
    
    // If no valid slides were created, return empty
    if (!slides) {
        console.error('No valid slides were created for carousel');
        return '<p>Could not load YouTube videos</p>';
    }
    
    // Add video counter indicator
    let indicator = urlArr.length > 1 ? 
        `<div class="yt-indicator">Video 1/${urlArr.length}</div>` : '';
    
    // Carousel controls
    let controls = `
        <button class="yt-prev" onclick="window.ytCarouselNav('${carouselId}', -1)">Prev</button>
        <button class="yt-next" onclick="window.ytCarouselNav('${carouselId}', 1)">Next</button>
    `;
    
    // Wrapper
    console.log(`Created carousel with ID: ${carouselId} and ${urlArr.length} videos`);
    return `<div id="${carouselId}" class="yt-carousel" data-current="0" data-total="${urlArr.length}">
        ${slides}
        <div class="yt-controls">${indicator}${controls}</div>
    </div>`;
}

// Carousel navigation logic (global for inline onclick)
window.ytCarouselNav = function(carouselId, dir) {
    console.log(`Navigating carousel ${carouselId} in direction ${dir}`);
    const carousel = document.getElementById(carouselId);
    if (!carousel) {
        console.error(`Carousel with ID ${carouselId} not found`);
        return;
    }
    
    const slides = carousel.querySelectorAll('.yt-slide');
    if (!slides || slides.length === 0) {
        console.error(`No slides found in carousel ${carouselId}`);
        return;
    }
    
    console.log(`Found ${slides.length} slides in carousel`);
    
    // Find the active slide
    let active = -1;
    for (let i = 0; i < slides.length; i++) {
        if (slides[i].style.display === 'block') {
            active = i;
            break;
        }
    }
    
    // If no active slide found, use the first one
    if (active === -1) {
        console.warn(`No active slide found, defaulting to first slide`);
        active = 0;
    }
    
    console.log(`Current active slide: ${active}`);
    
    // Hide the current active slide
    slides[active].style.display = 'none';
    
    // Calculate the next slide index
    let next = (active + dir + slides.length) % slides.length;
    console.log(`Next slide: ${next}`);
    
    // Show the next slide
    slides[next].style.display = 'block';
    
    // Update indicator if it exists
    const indicator = carousel.querySelector('.yt-indicator');
    if (indicator) {
        const total = slides.length;
        indicator.textContent = `Video ${next + 1}/${total}`;
        console.log(`Updated indicator to: Video ${next + 1}/${total}`);
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
            </div>
        `;
    }
}

/**
 * Loads featured content from the API and displays it
 */
async function loadPublicFeatured() {
    try {
        let featuredHTML = `<div class="featured-content-wrapper">`;
        let youtubeUrls = null;
        
        // Try the blog/featured endpoint first, but don't fail if it errors
        try {
            const response = await fetchApi('/blog/featured', { method: 'GET' });
            console.log('Featured API response:', response);
            
            const featured = response.data || {};
            console.log('Featured data from API:', featured);
            
            // Add featured text if available
            if (featured.text) {
                featuredHTML += `<div class="featured-text">${featured.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>`;
            }
            
            // Check for YouTube videos in the blog featured response
            if (featured.youtubeUrl) {
                console.log('YouTube URLs from youtubeUrl property:', featured.youtubeUrl);
                youtubeUrls = featured.youtubeUrl;
            } else if (featured.youtube) {
                console.log('YouTube URLs from youtube property:', featured.youtube);
                youtubeUrls = featured.youtube;
            }
        } catch (blogError) {
            console.log('Blog featured endpoint failed, trying general featured endpoint:', blogError.message);
        }
        
        // If we didn't find videos yet, try the general featured endpoint
        if (!youtubeUrls) {
            try {
                const { data: generalFeatured } = await fetchApi('/featured', { method: 'GET' });
                console.log('Featured data from general API:', generalFeatured);
                
                if (generalFeatured && generalFeatured.youtube) {
                    console.log('Found YouTube URLs in general endpoint:', generalFeatured.youtube);
                    youtubeUrls = generalFeatured.youtube;
                }
            } catch (err) {
                console.warn('Could not load from general featured endpoint:', err);
            }
        }
        
        // Add YouTube videos if we found any
        if (youtubeUrls) {
            console.log('Adding YouTube carousel with URLs:', youtubeUrls);
            const youtubeEmbed = createYouTubeEmbed(youtubeUrls);
            console.log('Generated YouTube embed HTML:', youtubeEmbed.substring(0, 100) + '...');
            featuredHTML += `<div class="featured-video-container">${youtubeEmbed}</div>`;
        } else {
            console.log('No YouTube URLs found in any endpoint');
            featuredHTML += `<div class="no-featured">No featured content available</div>`;
        }
        
        featuredHTML += `</div>`;
        
        publicFeaturedContentEl.innerHTML = featuredHTML;
        
        // After content is loaded, ensure all carousels are properly initialized
        setTimeout(() => {
            document.querySelectorAll('.yt-carousel').forEach(carousel => {
                console.log('Initializing carousel:', carousel.id);
                const slides = carousel.querySelectorAll('.yt-slide');
                console.log(`Carousel has ${slides.length} slides`);
                
                // Make sure first slide is visible
                if (slides.length > 0) {
                    slides.forEach((slide, i) => {
                        slide.style.display = i === 0 ? 'block' : 'none';
                    });
                }
            });
        }, 500);
    } catch (err) {
        console.error('Error loading featured content:', err);
        publicFeaturedContentEl.innerHTML = `
            <div class="error-fallback">
                <p>Unable to load featured content at this time.</p>
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
