const API_BASE = '/api';
let editingPostId = null;

// DOM Elements
const publicPostsListEl = document.getElementById('public-posts-list');
const publicFeaturedContentEl = document.getElementById('public-featured-content');
const adminPostsListEl = document.getElementById('admin-posts-list');
const adminFeaturedContentEl = document.getElementById('admin-featured-content');
const currentFeaturedTextEl = document.getElementById('current-featured-text');
const currentFeaturedYoutubeEl = document.getElementById('current-featured-youtube');
const currentFeaturedPreviewEl = document.getElementById('current-featured-preview');
const featuredForm = document.getElementById('featured-form');
const featuredTextEl = document.getElementById('featured-text');
const youtubeUrlInput = document.getElementById('youtube-url');
const youtubeListContainer = document.getElementById('youtube-list-container');
const addYoutubeBtn = document.getElementById('add-youtube-btn');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginPasswordEl = document.getElementById('password');
const loginErrorEl = document.getElementById('login-error');
const cancelLoginBtn = document.getElementById('cancel-login-btn');
const postForm = document.getElementById('post-form');
const postIdInput = document.getElementById('post-id');
const postTitleEl = document.getElementById('post-title');
const editorContainer = document.getElementById('editor-container');
const postImageUploadInput = document.getElementById('post-image-upload');
const postImagePreviewEl = document.getElementById('post-image-preview');
const postImageUrlDisplayEl = document.getElementById('post-image-url-display');
const removePostImageBtn = document.getElementById('remove-post-image-btn');
const postImageUrlInput = document.getElementById('post-image-url');
const postUploadProgressEl = document.getElementById('upload-progress');
const formHeadingEl = document.getElementById('form-heading');
const submitPostBtn = document.getElementById('submit-post-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

// Quill Editor Initialization
let postEditor;
if (editorContainer) {
    postEditor = new Quill('#editor-container', {
        theme: "snow",
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                ["blockquote", "code-block"],
                [{ list: "ordered" }, { list: "bullet" }],
                ["link", "image"],
                ["clean"]
            ]
        }
    });
}

// Remove sessionStorage-based sessionToken, use cookie-based session
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function isLoggedIn() {
    return !!getCookie('sessionToken');
}

function createYouTubeEmbed(urls) {
    if (!urls) return '';
    // Support comma-separated or array of URLs
    let urlArr = Array.isArray(urls) ? urls : (typeof urls === 'string' ? urls.split(',').map(u => u.trim()).filter(Boolean) : []);
    urlArr = urlArr.filter(Boolean);
    if (urlArr.length === 0) return '';
    if (urlArr.length === 1) {
        // Single video
        try {
            const videoId = new URL(urlArr[0]).searchParams.get('v');
            if (!videoId) return '';
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
            const videoId = new URL(url).searchParams.get('v');
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
    let controls = `<button class="yt-prev" onclick="window.ytCarouselNav('${carouselId}', -1)">Prev</button>
        <button class="yt-next" onclick="window.ytCarouselNav('${carouselId}', 1)">Next</button>`;
    // Wrapper
    return `<div id="${carouselId}" class="yt-carousel" style="position:relative;max-width:100%;height:0;padding-bottom:56.25%;overflow:hidden;">
        ${slides}
        <div class="yt-controls" style="position:absolute;bottom:10px;left:50%;transform:translateX(-50%);z-index:2;">${controls}</div>
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
};

let inactivityTimer;

function resetAuthTimer() {
    clearTimeout(inactivityTimer);
    if (isLoggedIn()) {
        inactivityTimer = setTimeout(handleLogout, 1800000);
    }
}

async function checkAuth() {
    try {
        const res = await fetch('/api/check', { credentials: 'include', cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            return data.success && data.user;
        }
    } catch (e) {}
    return false;
}

function handleLogout() {
    fetch('/api/logout', { method: 'POST', credentials: 'include' })
        .then(() => {
            // Clear UI and redirect to login or public view
            updateView();
        });
}

document.addEventListener('mousemove', resetAuthTimer);
document.addEventListener('keydown', resetAuthTimer);

async function fetchApi(endpoint, options = {}, isRetry = false) {
    // Determine the proper URL based on whether this is an admin or public endpoint
    const isAdminEndpoint = endpoint.startsWith('/admin/');
    const url = `${API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Always include credentials
            headers: headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 401 && !isRetry) {
                // Just trigger UI update if session expired
                updateView();
                alert("Session expired - please login again");
            }
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

async function uploadImage(file, progressElement) {
    if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit');
        return null;
    }

    progressElement.style.display = 'block';
    progressElement.value = 0;

    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/admin/blog/upload-image', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        progressElement.style.display = 'none';
        
        if (result.success) {
            return result.imageUrl;
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        progressElement.style.display = 'none';
        throw error;
    }
}

async function deleteR2Image(key) {
    try {
        await fetchApi('/upload', {
            method: 'DELETE',
            body: JSON.stringify({ key })
        });
        return true;
    } catch (error) {
        console.error('Delete failed:', error);
        return false;
    }
}

function updateView() {
    const loggedIn = isLoggedIn();
    document.getElementById('admin-view').style.display = loggedIn ? 'block' : 'none';
    document.getElementById('public-view').style.display = loggedIn ? 'none' : 'block';
    if (loggedIn) {
        loadAdminPosts();
        loadAdminFeatured();
        resetAuthTimer();
    } else {
        loadPublicPosts();
        loadPublicFeatured();
    }
    clearPostForm();
}

async function loadPublicPosts() {
    try {
        const { data: posts } = await fetchApi('/blog/posts', { method: 'GET', excludeAuth: true });
        // Sort posts in reverse chronological order (newest first)
        const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        publicPostsListEl.innerHTML = sortedPosts.length ? sortedPosts.map(post => `
            <article class="post-item-public">
                <h3>${post.title.replace(/</g, '&lt;')}</h3>
                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-image-public">` : ''}
                <div class="post-content-public">${post.content}</div>
                <p><small>Posted: ${new Date(post.created_at).toLocaleDateString()}</small></p>
            </article>
        `).join('') : '<p>No posts available</p>';
    } catch (err) {
        publicPostsListEl.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    }
}

async function loadPublicFeatured() {
    try {
        const { data: featured } = await fetchApi('/blog/featured', { method: 'GET', excludeAuth: true });
        
        // Create featured content HTML with enhanced styling
        let featuredHTML = `<div class="featured-content-wrapper">`;
        
        // Add featured text
        if (featured.text) {
            featuredHTML += `<div class="featured-text">${featured.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>`;
        }
        
        // Add YouTube videos with enhanced carousel if multiple videos
        if (featured.youtubeUrl) {
            featuredHTML += `<div class="featured-video-container">${createYouTubeEmbed(featured.youtubeUrl)}</div>`;
        }
        
        featuredHTML += `</div>`;
        
        publicFeaturedContentEl.innerHTML = featuredHTML;
        
        // Initialize carousel navigation if needed
        const carousel = publicFeaturedContentEl.querySelector('.yt-carousel');
        if (carousel) {
            // Make sure controls are visible and styled well
            const controls = carousel.querySelector('.yt-controls');
            if (controls) {
                controls.style.backgroundColor = 'rgba(0,0,0,0.5)';
                controls.style.padding = '5px 10px';
                controls.style.borderRadius = '5px';
            }
        }
    } catch (err) {
        publicFeaturedContentEl.innerHTML = `<p>Error loading featured content: ${err.message}</p>`;
    }
}

async function loadAdminPosts() {
    try {
        const { data: posts } = await fetchApi('/admin/blog/posts');
        // Sort posts in reverse chronological order (newest first)
        const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        adminPostsListEl.innerHTML = sortedPosts.length ? sortedPosts.map(post => `
            <div class="post-item-admin" data-post-id="${post.id}">
                <strong>${post.title.replace(/</g, '&lt;')}</strong>
                <p>${post.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
                ${post.image_url ? `<p><small>Image: ${post.image_url.split('/').pop()}</small></p>` : ''}
                <div class="post-actions">
                    <button class="edit-btn" data-post-id="${post.id}">Edit</button>
                    <button class="delete-btn" data-post-id="${post.id}">Delete</button>
                </div>
            </div>
        `).join('') : '<p>No posts created</p>';
    } catch (err) {
        adminPostsListEl.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    }
}

async function loadAdminFeatured() {
    try {
        const { data: featured } = await fetchApi('/blog/featured');
        currentFeaturedTextEl.textContent = featured.text || 'No text set';
        featuredTextEl.value = featured.text || '';
        // Parse YouTube URLs into array
        let ytArr = (featured.youtubeUrl || '').split(',').map(u => u.trim()).filter(Boolean);
        renderYoutubeList(ytArr);
        currentFeaturedYoutubeEl.textContent = featured.youtubeUrl || 'No video URL set';
        currentFeaturedPreviewEl.innerHTML = featured.youtubeUrl ? createYouTubeEmbed(featured.youtubeUrl) : '';
    } catch (err) {
        currentFeaturedTextEl.textContent = `Error loading: ${err.message}`;
    }
}

// --- Featured YouTube admin UI logic ---
// Make sure we have the container before modifying it
if (!youtubeListContainer && document.getElementById('youtube-list-container')) {
    // If the container exists in the HTML but wasn't captured in the variables
    const youtubeListContainer = document.getElementById('youtube-list-container');
} else if (!youtubeListContainer) {
    // If the container doesn't exist at all, create it
    const tempContainer = document.createElement('div');
    tempContainer.id = 'youtube-list-container';
    if (youtubeUrlInput && youtubeUrlInput.parentNode) {
        youtubeUrlInput.parentNode.insertBefore(tempContainer, youtubeUrlInput.nextSibling);
    }
}

// Add YouTube button handler
if (addYoutubeBtn) {
    addYoutubeBtn.addEventListener('click', () => {
        const urlPrompt = prompt("Enter YouTube video URL:");
        if (urlPrompt && urlPrompt.trim()) {
            const textarea = document.getElementById('youtube-list-textarea');
            if (textarea) {
                const currentUrls = textarea.value.split('\n').filter(Boolean);
                currentUrls.push(urlPrompt.trim());
                textarea.value = currentUrls.join('\n');
                // Trigger the update
                const event = new Event('input');
                textarea.dispatchEvent(event);
            }
        }
    });
}

function renderYoutubeList(urlArr) {
    const container = document.getElementById('youtube-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    if (!Array.isArray(urlArr)) urlArr = [];
    
    // Textarea for manual editing
    const textarea = document.createElement('textarea');
    textarea.id = 'youtube-list-textarea';
    textarea.rows = Math.max(3, urlArr.length);
    textarea.style.width = '100%';
    textarea.placeholder = 'One YouTube URL per line';
    textarea.value = urlArr.join('\n');
    container.appendChild(textarea);
    
    // List with controls
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    urlArr.forEach((url, i) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.marginBottom = '4px';
        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        urlSpan.style.flex = '1';
        urlSpan.style.overflowWrap = 'anywhere';
        li.appendChild(urlSpan);
        // Move Up
        const upBtn = document.createElement('button');
        upBtn.textContent = '↑';
        upBtn.title = 'Move Up';
        upBtn.disabled = i === 0;
        upBtn.style.marginLeft = '4px';
        upBtn.onclick = () => {
            if (i > 0) {
                [urlArr[i-1], urlArr[i]] = [urlArr[i], urlArr[i-1]];
                renderYoutubeList(urlArr);
            }
        };
        li.appendChild(upBtn);
        // Move Down
        const downBtn = document.createElement('button');
        downBtn.textContent = '↓';
        downBtn.title = 'Move Down';
        downBtn.disabled = i === urlArr.length - 1;
        downBtn.style.marginLeft = '2px';
        downBtn.onclick = () => {
            if (i < urlArr.length - 1) {
                [urlArr[i+1], urlArr[i]] = [urlArr[i], urlArr[i+1]];
                renderYoutubeList(urlArr);
            }
        };
        li.appendChild(downBtn);
        // Remove
        const rmBtn = document.createElement('button');
        rmBtn.textContent = '✕';
        rmBtn.title = 'Remove';
        rmBtn.style.marginLeft = '2px';
        rmBtn.onclick = () => {
            urlArr.splice(i, 1);
            renderYoutubeList(urlArr);
        };
        li.appendChild(rmBtn);
        list.appendChild(li);
    });
    container.appendChild(list);
    
    // Sync textarea and list
    textarea.oninput = () => {
        const lines = textarea.value.split('\n').map(u => u.trim()).filter(Boolean);
        renderYoutubeList(lines);
    };
}

// On admin featured form submit, use textarea value (one per line, joined as comma-separated)
featuredForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = featuredForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
        // Get URLs from textarea if present
        let ytArr = [];
        const textarea = document.getElementById('youtube-list-textarea');
        if (textarea) {
            ytArr = textarea.value.split('\n').map(u => u.trim()).filter(Boolean);
        } else if (youtubeUrlInput.value) {
            ytArr = youtubeUrlInput.value.split(',').map(u => u.trim()).filter(Boolean);
        }
        youtubeUrlInput.value = ytArr.join(','); // keep input in sync for backend
        await fetchApi('/admin/blog/featured', {
            method: 'POST',
            body: JSON.stringify({
                text: featuredTextEl.value.trim(),
                youtubeUrl: youtubeUrlInput.value.trim() || null
            })
        });
        alert('Featured section updated!');
        loadAdminFeatured();
        loadPublicFeatured();
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        submitButton.disabled = false;
    }
});

loginBtn.addEventListener('click', () => {
    window.location.href = '/admin/login';
});

logoutBtn.addEventListener('click', handleLogout);

adminPostsListEl.addEventListener('click', async (e) => {
    const postId = e.target.dataset?.postId;
    if (e.target.classList.contains('delete-btn')) {
        if (confirm('Delete this post?')) {
            try {
                await fetchApi(`/admin/blog/posts/${postId}`, { method: 'DELETE' });
                loadAdminPosts();
            } catch (err) {
                alert(`Delete failed: ${err.message}`);
            }
        }
    } else if (e.target.classList.contains('edit-btn')) {
        try {
            const { data: post } = await fetchApi(`/admin/blog/posts/${postId}`);
            if (post) {
                postIdInput.value = post.id;
                postTitleEl.value = post.title;
                postEditor.root.innerHTML = post.content;
                postImageUrlInput.value = post.image_url || '';
                postImageUrlDisplayEl.textContent = post.image_url?.split('/').pop() || '';
                formHeadingEl.textContent = 'Edit Post';
                submitPostBtn.textContent = 'Update Post';
                cancelEditBtn.style.display = 'inline-block';
            }
        } catch (err) {
            alert(`Error loading post: ${err.message}`);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (loginModal.classList.contains('active') && 
            !e.target.closest('.modal-content') &&
            !e.target.closest('#login-btn')) {
            loginModal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal.classList.contains('active')) {
            loginModal.classList.remove('active');
        }
    });

    document.querySelector('.close-button').addEventListener('click', () => {
        loginModal.classList.remove('active');
    });

    updateView();
});

// Clear the post form for a new post
function clearPostForm() {
    postIdInput.value = '';
    postTitleEl.value = '';
    postEditor.root.innerHTML = '';
    postImageUrlInput.value = '';
    postImagePreviewEl.src = '';
    postImageUrlDisplayEl.textContent = '';
    formHeadingEl.textContent = 'Create New Post';
    submitPostBtn.textContent = 'Submit Post';
    cancelEditBtn.style.display = 'none';
}

// Post form submission handler
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = postForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    
    try {
        const postId = postIdInput.value;
        const method = postId ? 'PUT' : 'POST';
        const endpoint = postId ? `/admin/blog/posts/${postId}` : '/admin/blog/posts';
        
        // Get the content from Quill editor
        const content = postEditor.root.innerHTML;
        
        const postData = {
            title: postTitleEl.value.trim(),
            content: content,
            image_url: postImageUrlInput.value || null
        };
        
        await fetchApi(endpoint, {
            method,
            body: JSON.stringify(postData)
        });
        
        alert(postId ? 'Post updated!' : 'Post created!');
        loadAdminPosts();
        clearPostForm();
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        submitButton.disabled = false;
    }
});

// Cancel edit button handler
cancelEditBtn.addEventListener('click', () => {
    clearPostForm();
});

// Image upload handler
postImageUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const imageUrl = await uploadImage(file, postUploadProgressEl);
        if (imageUrl) {
            postImageUrlInput.value = imageUrl;
            postImagePreviewEl.src = imageUrl;
            postImagePreviewEl.style.display = 'block';
            postImageUrlDisplayEl.textContent = imageUrl.split('/').pop();
            removePostImageBtn.style.display = 'inline-block';
        }
    } catch (err) {
        alert(`Image upload failed: ${err.message}`);
    }
});

// Remove image button handler
removePostImageBtn.addEventListener('click', () => {
    postImageUrlInput.value = '';
    postImagePreviewEl.src = '';
    postImagePreviewEl.style.display = 'none';
    postImageUrlDisplayEl.textContent = '';
    removePostImageBtn.style.display = 'none';
});
