// admin-unified.js - Consolidated admin dashboard functionality
// Merges functionality from admin-redesigned.js and admin-dashboard-redesigned.js

// ====================================
// Global state management
// ====================================
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
// UI Rendering Functions
// ====================================

function showLoginScreen() {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (!loginContainer) return;
    
    // Inject login form HTML
    loginContainer.innerHTML = `
        <div class="login-page">
            <div class="login-form-container">
                <h1>F/H Admin</h1>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="login-btn">Log In</button>
                    <div id="login-error" class="error-message"></div>
                </form>
            </div>
        </div>
    `;
    
    // Add event listener for the new form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
}

function showDashboard() {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (loginContainer) loginContainer.innerHTML = ''; // Clear login form
    if (dashboardContainer) dashboardContainer.style.display = 'grid'; // Show dashboard
    
    // Initialize dashboard components now that we're logged in
    initializeDashboard();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('login-error');
    const form = e.target;
    const data = {
        username: form.username.value,
        password: form.password.value
    };
    
    if (errorDiv) errorDiv.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            // Success! Show the dashboard.
            showDashboard();
        } else {
            if (errorDiv) errorDiv.textContent = result.error || 'Invalid credentials.';
        }
    } catch (err) {
        if (errorDiv) errorDiv.textContent = 'An error occurred. Please try again.';
    }
}

// ====================================
// Initialization & Authentication
// ====================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin] App initializing...');
    
    const sessionToken = getCookie('sessionToken');
    
    if (!sessionToken) {
        console.log('[Admin] No session token found. Showing login screen.');
        showLoginScreen();
        return;
    }

    try {
        console.log('[Admin] Verifying session token...');
        const authResponse = await fetch('/api/check', {
            credentials: 'include',
            cache: 'no-store'
        });
        
        if (authResponse.ok) {
            const authData = await authResponse.json();
            if (authData.success && authData.user) {
                console.log('[Admin] Auth check successful:', authData.user);
                currentUser = authData.user;
                showDashboard(); // Show the main dashboard
                return;
            }
        }
        
        // If we reach here, the token was invalid
        console.log('[Admin] Invalid session token. Showing login screen.');
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Clear bad token
        showLoginScreen();

    } catch (error) {
        console.error('[Admin] Error during initialization:', error);
        showLoginScreen();
    }
});

// Dashboard initialization
async function initializeDashboard() {
    setupNavigation();
    setupMobileMenu();
    setupModal();
    setupToasts();
    await loadInitialData();
    await loadDashboardStats();
    showSection('dashboard');
}

// ====================================
// Helper Functions
// ====================================

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const api = {
    get: async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                credentials: 'include',
                cache: 'no-store'
            });
            if (response.status === 401) {
                showLoginScreen();
                return null;
            }
            if (!response.ok) throw new Error(`API error (${response.status})`);
            return await response.json();
        } catch (error) {
            console.error(`API GET error for ${endpoint}:`, error);
            showToast('Error fetching data. Please try again.', 'error');
            return null;
        }
    },
    post: async (endpoint, data) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (response.status === 401) {
                showLoginScreen();
                return null;
            }
            if (!response.ok) throw new Error(`API error (${response.status})`);
            return await response.json();
        } catch (error) {
            console.error('API POST error:', error);
            showToast('Error saving data. Please try again.', 'error');
            return null;
        }
    },
    put: async (endpoint, data) => {
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            if (response.status === 401) {
                showLoginScreen();
                return null;
            }
            if (!response.ok) throw new Error(`API error (${response.status})`);
            return await response.json();
        } catch (error) {
            console.error('API PUT error:', error);
            showToast('Error updating data. Please try again.', 'error');
            return null;
        }
    },
    delete: async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.status === 401) {
                showLoginScreen();
                return null;
            }
            if (!response.ok) throw new Error(`API error (${response.status})`);
            return await response.json();
        } catch (error) {
            console.error('API DELETE error:', error);
            showToast('Error deleting data. Please try again.', 'error');
            return null;
        }
    }
};

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return dateString;
    }
}

// ====================================
// Navigation & UI Setup
// ====================================

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

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST', credentials: 'include' });
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                showLoginScreen();
            }
        });
    }
}

function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

function setupModal() {
    const modal = document.getElementById('form-modal');
    const closeBtn = modal?.querySelector('.modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });
}

function setupToasts() {
    // The container is already in admin.html, this function is a placeholder for future enhancements.
}

function showSection(sectionName) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        dashboardState.currentSection = sectionName;
        switch (sectionName) {
            case 'events': loadEvents(); break;
            case 'blog': loadBlogPosts(); break;
            case 'venue': loadVenueSettings(); break;
            case 'import': setupImportHandlers(); break;
        }
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
// Dashboard Data Loading
// ====================================

async function loadInitialData() {
    const currentUserEl = document.getElementById('current-user');
    if (currentUserEl && currentUser) {
        currentUserEl.textContent = currentUser.username;
    }
}

async function loadDashboardStats() {
    try {
        const [eventsData, blogData] = await Promise.all([
            api.get('/api/admin/events'),
            api.get('/api/admin/blog/posts')
        ]);
        if (eventsData) document.getElementById('stats-total-events').textContent = eventsData.length || 0;
        if (blogData) document.getElementById('stats-total-posts').textContent = blogData.length || 0;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ====================================
// Events Management
// ====================================

async function loadEvents() {
    const events = await api.get('/api/admin/events');
    if (events) {
        dashboardState.events = events;
        renderEvents(events);
    }
}

function renderEvents(events) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    if (!Array.isArray(events) || events.length === 0) {
        eventList.innerHTML = `<div class='status-message status-info'>No events found.</div>`;
        return;
    }
    eventList.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead>
            <tbody>
                ${events.map(ev => `
                    <tr>
                        <td><strong>${ev.title || 'Untitled'}</strong></td>
                        <td>${formatDate(ev.date)}</td>
                        <td><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>
                        <td class='admin-table-actions'>
                            <button class="btn-icon" onclick='editEvent("${ev.id}")' title="Edit">✏️</button>
                            <button class="btn-icon" onclick='deleteEvent("${ev.id}")' title="Delete">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
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

document.getElementById('add-event-btn')?.addEventListener('click', () => showEventForm());

window.deleteEvent = async function(id) {
    if (confirm('Are you sure you want to delete this event?')) {
        const res = await api.delete(`/api/admin/events/${id}`);
        if (res) {
            showToast('Event deleted successfully', 'success');
            loadEvents();
        }
    }
};

window.editEvent = function(id) {
    showEventForm(id);
};

// ... All other functions like showEventForm, loadBlogPosts, etc. continue from here
// as they were in the original file, unchanged. I will include them for completeness.

function showEventForm(id = null) {
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    if (!modal || !modalBody) return;
    
    dashboardState.editingEventId = id;
    
    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit Event' : 'Create New Event'}</h3>
            <form id='event-form'>
                <label>Venue *</label>
                <select name='venue' id='venue-select' required>
                    <option value="">-- Select --</option>
                    <option value="farewell">Farewell</option>
                    <option value="howdy">Howdy</option>
                </select>
                <label>Title *</label>
                <input name='title' required>
                <label>Date & Time *</label>
                <input name='date' type='datetime-local' required>
                <label>Description</label>
                <textarea name='description' rows="4"></textarea>
                <label>Price</label>
                <input name='price' placeholder="$15, Free, etc.">
                <label>Age Restriction</label>
                <input name='age_restriction' placeholder="e.g. 21+">
                <label>Ticket URL</label>
                <input name='ticket_url' type="url" placeholder="https://...">
                <div class="form-actions">
                    <button type='submit' class='btn btn-primary'>${id ? 'Update' : 'Create'}</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.add('active');

    if (id) {
        const event = dashboardState.events.find(e => e.id === id);
        if (event) {
            const form = document.getElementById('event-form');
            form.venue.value = event.venue;
            form.title.value = event.title;
            form.date.value = new Date(event.date).toISOString().slice(0, 16);
            form.description.value = event.description || '';
            form.price.value = event.price || '';
            form.age_restriction.value = event.age_restriction || '';
            form.ticket_url.value = event.ticket_url || '';
        }
    }
    
    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = Object.fromEntries(new FormData(form).entries());
        const url = id ? `/api/admin/events/${id}` : '/api/admin/events';
        const method = id ? 'put' : 'post';
        const result = await api[method](url, data);
        if (result) {
            showToast(`Event ${id ? 'updated' : 'created'}`, 'success');
            modal.classList.remove('active');
            loadEvents();
        }
    });
}


async function loadBlogPosts() {
    const posts = await api.get('/api/admin/blog/posts');
    if (posts) {
        dashboardState.blogPosts = posts;
        renderBlogPosts(posts);
    }
}

function renderBlogPosts(posts) {
    const blogList = document.getElementById('blog-list');
    if(!blogList) return;
    if (!posts || posts.length === 0) {
        blogList.innerHTML = `<div class='status-message status-info'>No blog posts.</div>`;
        return;
    }
    blogList.innerHTML = `
        <table class="admin-table">
            <thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
                ${posts.map(post => `
                    <tr>
                        <td><strong>${post.title}</strong></td>
                        <td>${formatDate(post.date || post.created_at)}</td>
                        <td class='admin-table-actions'>
                            <button class="btn-icon" onclick='editBlogPost("${post.id}")' title="Edit">✏️</button>
                            <button class="btn-icon" onclick='deleteBlogPost("${post.id}")' title="Delete">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
}

document.getElementById('add-blog-btn')?.addEventListener('click', () => showBlogForm());

window.editBlogPost = (id) => showBlogForm(id);

window.deleteBlogPost = async (id) => {
    if (confirm('Are you sure?')) {
        const res = await api.delete(`/api/admin/blog/${id}`);
        if(res) {
            showToast('Post deleted', 'success');
            loadBlogPosts();
        }
    }
}

function showBlogForm(id = null) {
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    if (!modal || !modalBody) return;
    
    dashboardState.editingPostId = id;
    
    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit Post' : 'New Post'}</h3>
            <form id='blog-form'>
                <label>Title *</label>
                <input name='title' required>
                <label>Content *</label>
                <div id='quill-editor' style='height:250px; background:white;'></div>
                <div class="form-actions">
                    <button type='submit' class='btn btn-primary'>${id ? 'Update' : 'Create'}</button>
                </div>
            </form>
        </div>
    `;
    modal.classList.add('active');

    const quill = new Quill('#quill-editor', { theme: 'snow' });

    if (id) {
        const post = dashboardState.blogPosts.find(p => p.id === id);
        if (post) {
            const form = document.getElementById('blog-form');
            form.title.value = post.title;
            quill.root.innerHTML = post.content_html || '';
        }
    }

    document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = {
            title: form.title.value,
            content_html: quill.root.innerHTML,
            content_delta: JSON.stringify(quill.getContents())
        };
        const url = id ? `/api/admin/blog/${id}` : '/api/admin/blog/posts';
        const method = id ? 'put' : 'post';
        const result = await api[method](url, data);
        if(result) {
            showToast(`Post ${id ? 'updated' : 'created'}`, 'success');
            modal.classList.remove('active');
            loadBlogPosts();
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
            statusDiv.textContent = 'Importing...';
            const result = await api.post('/api/admin/sync-events', {});
            if (result) {
                statusDiv.textContent = `Imported ${result.imported} events. Skipped ${result.skipped}.`;
                showToast(`Import complete`, 'success');
                loadEvents();
            } else {
                statusDiv.textContent = 'Import failed.';
            }
        };
    }
}
