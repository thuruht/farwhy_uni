let currentUser = null;
let dashboardState = {
    currentSection: 'dashboard',
    currentVenue: 'farewell',
    quill: null,
    stats: {},
    events: [],
    blogPosts: [],
    editingEventId: null,
    editingPostId: null
};

// ====================================
// CORE APP LOGIC (Login/Dashboard Rendering)
// ====================================

function showLoginScreen() {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (dashboardContainer) {
        dashboardContainer.style.display = 'none';
        console.log('Dashboard container hidden');
    }
    
    if (!loginContainer) return;

    loginContainer.innerHTML = `
        <div class="login-page" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: var(--bg-dark);">
            <div class="login-form-container" style="max-width: 400px; width: 100%; padding: 2.5rem; background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 12px;">
                <h1 style="text-align: center; color: var(--cyan); font-family: var(--font-display);">F/H Admin</h1>
                <form id="loginForm">
                    <div class="form-group"><label for="username">Username</label><input type="text" id="username" name="username" required autocomplete="username"></div>
                    <div class="form-group"><label for="password">Password</label><input type="password" id="password" name="password" required autocomplete="current-password"></div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem;">Log In</button>
                    <div id="login-error" style="color: var(--error); margin-top: 1rem; text-align: center; min-height: 1.2em;"></div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
}

function showDashboard() {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    if (loginContainer) loginContainer.innerHTML = '';
    if (dashboardContainer) {
        // Display the dashboard container with the correct display type
        dashboardContainer.style.display = 'grid';
        console.log('Dashboard container display set to grid');
    }
    initializeDashboard();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error');
    const form = e.target;
    const data = { username: form.username.value, password: form.password.value };
    if (errorDiv) errorDiv.textContent = '';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showDashboard();
            } else {
                if (errorDiv) errorDiv.textContent = result.error || 'Invalid credentials.';
            }
        } else {
            if (errorDiv) errorDiv.textContent = 'Invalid credentials.';
        }
    } catch (err) {
        if (errorDiv) errorDiv.textContent = 'An error occurred. Please try again.';
    }
}


// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin] App initializing...');

    // Check if modal elements exist
    console.log('Modal elements check:', {
        'form-modal': document.getElementById('form-modal'),
        'modal-form-body': document.getElementById('modal-form-body'),
        'add-event-btn': document.getElementById('add-event-btn'),
        'add-blog-btn': document.getElementById('add-blog-btn')
    });

    // Manually setup modal before any auth checks
    setupModal();

    // Set up global click handlers for all interactive elements
    document.addEventListener('click', (e) => {
        // Handle New Event button click
        if (e.target.id === 'add-event-btn' || e.target.closest('#add-event-btn')) {
            console.log('New Event button clicked via global handler');
            e.preventDefault();
            showEventForm();
        }

        // Handle New Blog Post button click
        if (e.target.id === 'add-blog-btn' || e.target.closest('#add-blog-btn')) {
            console.log('New Blog button clicked via global handler');
            e.preventDefault();
            showBlogForm();
        }

        // Debug clicked element for troubleshooting
        console.log('Clicked element:', e.target);
    });

    // Add direct event handlers for additional reliability
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        console.log('Found add event button, adding direct click handler');
        addEventBtn.addEventListener('click', () => {
            console.log('Add event button clicked via direct handler');
            showEventForm();
        });
    }

    // Set up mobile menu toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (mobileToggle && sidebar) {
        console.log('Found mobile toggle, adding direct click handler');
        mobileToggle.addEventListener('click', () => {
            console.log('Mobile menu toggle clicked');
            sidebar.classList.toggle('open');
        });
    }

    const sessionToken = getCookie('sessionToken');

    if (!sessionToken) {
        console.log('[Admin] No session token found. Showing login screen.');
        showLoginScreen();
        return;
    }
    try {
        const authResponse = await fetch('/api/admin/check', { credentials: 'include', cache: 'no-store' });
        if (authResponse && authResponse.ok) {
            const authData = await authResponse.json();
            if (authData.success && authData.user) {
                currentUser = authData.user;
                showDashboard();
                return;
            }
        }
        // If the check fails for any reason (401, network error, etc.), show login
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        showLoginScreen();
    } catch (error) {
        console.error("Auth check failed, showing login screen.", error);
        showLoginScreen();
    }
});


// ====================================
// HELPER FUNCTIONS
// ====================================

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const api = {
    _call: async (endpoint, options = {}) => {
        try {
            console.log(`API call to ${endpoint}`, options);
            const response = await fetch(endpoint, { ...options, credentials: 'include', cache: 'no-store' });
            console.log(`API response status: ${response.status}`);

            if (response.status === 401) {
                console.error('API Auth failed (401)');
                showToast('Authentication failed. Please log in again.', 'error');
                showLoginScreen();
                return null;
            }

            if (!response.ok) {
                console.error(`API Error for ${endpoint}: ${response.status}`);
                // Try to get more error details
                try {
                    const errorData = await response.json();
                    console.error('API error details:', errorData);
                    showToast(`API Error: ${errorData.error || response.statusText}`, 'error');
                } catch (jsonError) {
                    showToast(`API Error: ${response.status} ${response.statusText}`, 'error');
                }
                return null;
            }

            return response; // Return the whole response object
        } catch (error) {
            console.error(`API call error for ${endpoint}:`, error);
            showToast('Network error. Please try again.', 'error');
            return null;
        }
    },
    get: async function (endpoint) {
        const res = await this._call(endpoint);
        if (res) return await res.json();
        return null;
    },
    post: async function (endpoint, data) {
        const res = await this._call(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res) return await res.json();
        return null;
    },
    put: async function (endpoint, data) {
        const res = await this._call(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res) return await res.json();
        return null;
    },
    delete: async function (endpoint) {
        return await this._call(endpoint, { method: 'DELETE' });
    }
};

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        // Handles both full ISO strings and "YYYY-MM-DD"
        const date = new Date(dateString);
        // Add a time zone check to avoid UTC conversion issues on simple dates
        if (dateString.length <= 10) {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString();
        }
        return date.toLocaleDateString();
    } catch (e) {
        return dateString;
    }
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toastContainer.removeChild(toast), 300);
    }, 3000);
}

// ====================================
// DASHBOARD INITIALIZATION & UI
// ====================================

async function initializeDashboard() {
    setupNavigation();
    setupMobileMenu();
    setupModal();
    setupToasts();
    await loadInitialData();
    showSection('dashboard');
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const mainTitle = document.getElementById('main-title');
    const breadcrumb = document.getElementById('breadcrumb');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            showSection(target);
            const sectionNames = { 'dashboard': 'Dashboard', 'events': 'Event Management', 'blog': 'Blog Management', 'venue': 'Venue Settings', 'import': 'Import Legacy Data' };
            if (mainTitle) mainTitle.textContent = sectionNames[target] || target;
            if (breadcrumb) breadcrumb.textContent = `Home / ${sectionNames[target] || target}`;
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await api.post('/api/admin/logout', {});
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        showLoginScreen();
    });
}

function setupMobileMenu() {
    console.log('Setting up mobile menu toggle');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    console.log('Mobile menu elements:', mobileToggle, sidebar);

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            console.log('Mobile menu toggle clicked');
            e.preventDefault();
            sidebar.classList.toggle('open');
            console.log('Sidebar classes after toggle:', sidebar.classList);
        });

        document.addEventListener('click', (e) => {
            if (sidebar &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        console.log('Mobile menu handlers set up successfully');
    } else {
        console.error('Mobile menu elements not found');
    }
}

function setupModal() {
    console.log('Setting up modal...');
    const modal = document.getElementById('form-modal');
    console.log('Modal element:', modal);

    const closeBtn = modal?.querySelector('.modal-close-btn');
    console.log('Modal close button:', closeBtn);

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            console.log('Modal close button clicked');
            modal.classList.remove('active');
        });
    } else {
        console.error('Modal close button not found');
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Modal background clicked, closing modal');
                modal.classList.remove('active');
            }
        });
        console.log('Modal setup complete');
    } else {
        console.error('Modal element not found during setup');
    }
}

function setupToasts() {
    // This is a placeholder, a real implementation would create the container if it doesn't exist.
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

async function loadInitialData() {
    console.log('Loading initial data, currentUser:', currentUser);
    const currentUserEl = document.getElementById('current-user');
    const userRoleEl = document.getElementById('user-role');

    if (currentUserEl) {
        if (currentUser && currentUser.username) {
            currentUserEl.textContent = currentUser.username;
            console.log('Updated current user element with:', currentUser.username);

            if (userRoleEl && currentUser.role) {
                userRoleEl.textContent = currentUser.role;
            }
        } else {
            currentUserEl.textContent = 'Not logged in';
            console.log('No current user, displaying "Not logged in"');
        }
    } else {
        console.error('Current user element not found');
    }

    // Load dashboard stats
    await loadDashboardStats();
}

async function loadDashboardStats() {
    console.log('Loading dashboard stats...');
    
    try {
        const events = await api.get('/api/admin/events');
        const blogData = await api.get('/api/admin/blog/posts');
        
        console.log('Stats data loaded:', { events, blogData });
        
        const totalEventsEl = document.getElementById('stats-total-events');
        const statsTotalPostsEl = document.getElementById('stats-total-posts');
        
        if (totalEventsEl) {
            const eventCount = Array.isArray(events) ? events.length : 0;
            totalEventsEl.textContent = eventCount;
            console.log(`Updated events count: ${eventCount}`);
        } else {
            console.error('Stats total events element not found');
        }
        
        if (statsTotalPostsEl && blogData && blogData.data) {
            const postCount = Array.isArray(blogData.data) ? blogData.data.length : 0;
            statsTotalPostsEl.textContent = postCount;
            console.log(`Updated blog posts count: ${postCount}`);
        } else {
            console.error('Stats total posts element not found or blogData invalid', blogData);
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadEvents() {
    console.log('Loading events...');
    const events = await api.get('/api/admin/events');
    if (events) {
        console.log(`Loaded ${events.length} events`);
        dashboardState.events = events;
        renderEvents(events);

        const addEventBtn = document.getElementById('add-event-btn');
        console.log('Add Event button element:', addEventBtn);
        if (addEventBtn) {
            // To prevent multiple listeners on re-renders, we clone and replace the button
            const newAddEventBtn = addEventBtn.cloneNode(true);
            addEventBtn.parentNode.replaceChild(newAddEventBtn, addEventBtn);
            // And add the listener to the new button
            newAddEventBtn.addEventListener('click', (e) => {
                console.log('New Event button clicked via direct handler');
                e.preventDefault();
                showEventForm();
            });
            console.log('New Event button listener attached');
        } else {
            console.log('Add Event button not found in the DOM');
        }
    } else {
        console.log('Failed to load events or received empty response');
    }
}

function renderEvents(events) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    if (!Array.isArray(events) || events.length === 0) {
        eventList.innerHTML = `<div class='status-message status-info'>No events found.</div>`;
        return;
    }
    eventList.innerHTML = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>` +
        events.map(ev => `<tr>
            <td><strong>${ev.title || 'Untitled'}</strong></td>
            <td>${formatDate(ev.date)}</td>
            <td><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>
            <td class='admin-table-actions'>
                <button onclick='editEvent("${ev.id}")'>Edit</button>
                <button onclick='deleteEvent("${ev.id}")'>Delete</button>
            </td>
        </tr>`).join('') + `</tbody></table>`;
    setupEventFilters();
}

function setupEventFilters() {
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    const applyFilters = () => {
        const venue = venueFilter ? venueFilter.value : '';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filteredEvents = dashboardState.events.filter(event =>
            (!venue || event.venue === venue) &&
            (!searchTerm || (event.title && event.title.toLowerCase().includes(searchTerm)))
        );
        renderEvents(filteredEvents);
    };
    if (venueFilter) venueFilter.onchange = applyFilters;
    if (searchInput) searchInput.oninput = applyFilters;
}

window.deleteEvent = async function (id) {
    if (confirm('Are you sure? This will also delete the flyer from storage.')) {
        const res = await api.delete(`/api/admin/events/${id}`);
        if (res) { loadEvents(); showToast('Event deleted.', 'success'); }
    }
};

window.editEvent = function (id) {
    console.log('editEvent called with id:', id);
    const event = dashboardState.events.find(e => e.id === id);
    console.log('Found event:', event);
    if (event) {
        showEventForm(id);
    } else {
        console.error('Event not found with ID:', id);
        showToast('Event not found', 'error');
    }
};

function showEventForm(id = null) {
    console.log('showEventForm called with id:', id);
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    console.log('Modal elements:', modal, modalBody);
    if (!modal || !modalBody) {
        console.error('Modal elements not found!');
        return;
    }

    // Explicitly add the active class and verify
    modal.classList.add('active');
    console.log('Modal active class added, classList:', modal.classList);

    dashboardState.editingEventId = id;
    let event = id ? dashboardState.events.find(e => e.id === id) : {};
    console.log('Event data:', event);

    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit Event' : 'Create New Event'}</h3>
            <form id='event-form'>
                <label>Venue *</label>
                <select name='venue' required>
                    <option value="">-- Select Venue --</option>
                    <option value="farewell" ${event?.venue === 'farewell' ? 'selected' : ''}>Farewell</option>
                    <option value="howdy" ${event?.venue === 'howdy' ? 'selected' : ''}>Howdy</option>
                </select>
                <label>Title *</label>
                <input name='title' required placeholder="Event title" value="${event?.title || ''}">
                <label>Date & Time *</label>
                <input name='date' type='datetime-local' required value="${event?.date ? new Date(event.date).toISOString().slice(0, 16) : ''}">
                <label>Description</label>
                <textarea name='description' rows="4">${event?.description || ''}</textarea>
                <label>Price</label>
                <input name='price' placeholder="e.g., $15, Free, Donation" value="${event?.price || ''}">
                <label>Age Restriction</label>
                <input name='age_restriction' placeholder="e.g. 21+" value="${event?.age_restriction || ''}">
                <label>Ticket URL</label>
                <input name='ticket_url' type="url" placeholder="https://..." value="${event?.ticket_url || ''}">
                <label>Flyer Image URL</label>
                <div class="flyer-upload-group">
                  <input name='flyer_image_url' type="url" placeholder="Upload a flyer to get a URL" value="${event?.imageUrl || event?.flyer_image_url || ''}">
                  <input type="file" id="flyer-upload-input" style="display:none;">
                  <button type="button" id="flyer-upload-btn">Upload Flyer</button>
                </div>
                <div class="form-actions"><button type='submit' class='btn btn-primary'>${id ? 'Update Event' : 'Create Event'}</button></div>
            </form>
        </div>
    `;
    // Modal class already added at the beginning of the function, don't add it twice

    document.getElementById('flyer-upload-btn').addEventListener('click', () => {
        document.getElementById('flyer-upload-input').click();
    });    // Add auto-population logic for venue selection
    const venueSelect = document.querySelector('select[name="venue"]');
    const ageRestrictionInput = document.querySelector('input[name="age_restriction"]');
    const descriptionTextarea = document.querySelector('textarea[name="description"]');
    
    // Auto-populate defaults if creating a new event (not editing)
    if (!id) {
        // Auto-populate "Doors at 7pm / Music at 8pm" for all new events
        if (descriptionTextarea && !descriptionTextarea.value) {
            descriptionTextarea.value = 'Doors at 7pm / Music at 8pm';
            console.log('Auto-populated event time in description field');
        }
    }
    
    // Set up venue change handler for auto-population
    venueSelect.addEventListener('change', (e) => {
        const venue = e.target.value;
        
        // Auto-populate age restriction based on venue
        if (venue === 'farewell') {
            ageRestrictionInput.value = '21+ unless with parent or legal guardian';
        } else if (venue === 'howdy') {
            ageRestrictionInput.value = 'All ages';
        }
        
        console.log(`Auto-populated age restriction for ${venue}: ${ageRestrictionInput.value}`);
    });
    
    // Trigger the change event if a venue is already selected (for edit mode)
    if (venueSelect.value) {
        venueSelect.dispatchEvent(new Event('change'));
    }

    document.getElementById('flyer-upload-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('flyer', file);

        showToast('Uploading flyer...', 'info');

        const res = await fetch('/api/admin/events/flyer', { method: 'POST', body: formData, credentials: 'include' });
        const result = await res.json();

        if (res.ok && result.success) {
            document.querySelector('input[name="flyer_image_url"]').value = result.url;
            showToast('Flyer uploaded!', 'success');
        } else {
            showToast(result.error || 'Flyer upload failed.', 'error');
        }
    });    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Event form submitted');
        
        try {
            // Disable submit button and show loading state
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Saving...';
            submitButton.disabled = true;
            
            // Get form data
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            console.log('Event form data:', data);
            
            // Validate required fields
            if (!data.title || !data.venue || !data.date) {
                showToast('Please fill in all required fields.', 'error');
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                return;
            }
            
            // Determine API endpoint and method
            const url = id ? `/api/admin/events/${id}` : '/api/admin/events';
            const method = id ? 'put' : 'post';
            console.log(`Making ${method.toUpperCase()} request to ${url}`);
            
            const response = await api[method](url, data);
            console.log('API response:', response);
            
            if (response) {
                showToast(`Event ${id ? 'updated' : 'created'} successfully!`, 'success');
                modal.classList.remove('active');
                loadEvents();
            } else {
                console.error('API call returned null response');
                showToast('Failed to save event. Please try again.', 'error');
            }
            
            // Restore button state
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        } catch (error) {
            console.error('Error submitting event form:', error);
            showToast('An error occurred while saving the event.', 'error');
            
            // Ensure button is restored even if there's an error
            const submitButton = e.target.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = id ? 'Update Event' : 'Create Event';
                submitButton.disabled = false;
            }
        }
    });
}

async function loadBlogPosts() {
    const result = await api.get('/api/admin/blog/posts');
    if (result && result.data) {
        dashboardState.blogPosts = result.data;
        renderBlogPosts(result.data);

        const addBlogBtn = document.getElementById('add-blog-btn');
        if (addBlogBtn) {
            // To prevent multiple listeners on re-renders, we clone and replace the button
            const newAddBlogBtn = addBlogBtn.cloneNode(true);
            addBlogBtn.parentNode.replaceChild(newAddBlogBtn, addBlogBtn);
            // And add the listener to the new button
            newAddBlogBtn.addEventListener('click', () => showBlogForm());
            console.log('New Blog Post button listener attached');
        }
    }
}

function renderBlogPosts(posts) {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;
    if (!posts || posts.length === 0) {
        blogList.innerHTML = `<div class='status-message status-info'>No blog posts.</div>`;
        return;
    }
    blogList.innerHTML = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead><tbody>` +
        posts.map(post => `<tr>
            <td><strong>${post.title}</strong></td>
            <td>${formatDate(post.date || post.created_at)}</td>
            <td class='admin-table-actions'>
                <button onclick='editBlogPost("${post.id}")'>Edit</button>
                <button onclick='deleteBlogPost("${post.id}")'>Delete</button>
            </td>
        </tr>`).join('') + `</tbody></table>`;
}

// THIS is the problematic listener that is now removed.
// document.getElementById('add-blog-btn')?.addEventListener('click', () => showBlogForm());

window.editBlogPost = (id) => {
    const post = dashboardState.blogPosts.find(p => p.id === id);
    if (post) showBlogForm(id);
};

window.deleteBlogPost = async (id) => {
    if (confirm('Are you sure?')) {
        const res = await api.delete(`/api/admin/blog/posts/${id}`);
        if (res) { loadBlogPosts(); showToast('Post deleted.', 'success'); }
    }
}

function showBlogForm(id = null) {
    console.log('showBlogForm called with id:', id);
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    console.log('Blog modal elements:', modal, modalBody);
    if (!modal || !modalBody) {
        console.error('Blog modal elements not found!');
        return;
    }

    // Explicitly add the active class and verify
    modal.classList.add('active');
    console.log('Blog modal active class added, classList:', modal.classList);

    dashboardState.editingPostId = id;
    let post = id ? dashboardState.blogPosts.find(p => p.id === id) : null;
    console.log('Post data:', post);

    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit Blog Post' : 'New Blog Post'}</h3>
            <form id='blog-form'>
                <label>Title *</label>
                <input name='title' required value="${post?.title || ''}">
                <label>Date</label>
                <input name='date' type='date' value="${post?.date ? new Date(post.date).toISOString().split('T')[0] : ''}">
                <label>Content *</label>
                <div id='quill-editor' style='height:250px; background:white;'></div>
                <div class="form-actions">
                    <button type='submit' class='btn btn-primary'>${id ? 'Update Post' : 'Create Post'}</button>
                </div>
            </form>
        </div>
    `;
    // Modal class already added at the beginning of the function, don't add it twice

    const quill = new Quill('#quill-editor', { theme: 'snow' });
    dashboardState.quill = quill;

    if (post) {
        quill.root.innerHTML = post.content || '';
    }

    document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Blog form submitted');

        // Get form data
        const data = {
            title: e.target.title.value,
            date: e.target.date.value,
            content: dashboardState.quill.root.innerHTML
        };
        console.log('Blog form data:', data);

        // Determine API endpoint and method
        const url = id ? `/api/admin/blog/posts/${id}` : '/api/admin/blog/posts';
        const method = id ? 'put' : 'post';
        console.log(`Making ${method.toUpperCase()} request to ${url}`);

        try {
            const response = await api[method](url, data);
            console.log('API response:', response);

            if (response) {
                showToast(`Post ${id ? 'updated' : 'created'}`, 'success');
                modal.classList.remove('active');
                loadBlogPosts();
            } else {
                console.error('API call returned null response');
                showToast('Failed to save blog post. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting blog form:', error);
            showToast('An error occurred while saving the blog post.', 'error');
        }
    });
}

function loadVenueSettings() {
    showToast('Venue settings not yet implemented.', 'info');
}

function setupImportHandlers() {
    const importBtn = document.getElementById('import-legacy-btn');
    if (importBtn) {
        importBtn.onclick = async () => {
            const statusDiv = document.getElementById('import-status');
            if (statusDiv) statusDiv.textContent = 'Importing...';
            const response = await api.post('/api/admin/sync-events', {});
            if (response) {
                const result = await response.json();
                if (statusDiv) statusDiv.textContent = `Imported ${result.imported} events. Skipped ${result.skipped}.`;
                showToast(`Import complete`, 'success');
                loadEvents();
            } else {
                if (statusDiv) statusDiv.textContent = 'Import failed.';
            }
        };
    }
}

function showSection(sectionName) {
    console.log(`Attempting to show section: ${sectionName}`);
    const sections = document.querySelectorAll('.admin-section');
    console.log(`Found ${sections.length} admin sections`);
    
    sections.forEach(section => {
        section.classList.remove('active');
        console.log(`Removed 'active' class from section: ${section.id}`);
    });

    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        console.log(`Found target section: section-${sectionName}`);
        targetSection.classList.add('active');
        console.log(`Added 'active' class to section-${sectionName}`);
        
        dashboardState.currentSection = sectionName;
        switch (sectionName) {
            case 'dashboard': loadDashboardStats(); break;
            case 'events': loadEvents(); break;
            case 'blog': loadBlogPosts(); break;
            case 'venue': loadVenueSettings(); break;
            case 'import': setupImportHandlers(); break;
        }
    } else {
        console.error(`Section not found: section-${sectionName}`);
    }
}

// End of file