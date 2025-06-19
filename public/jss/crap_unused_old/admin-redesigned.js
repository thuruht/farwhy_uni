// public/jss/admin-redesigned.js - Complete Multi-Tenant Admin Dashboard

// Global state management
let currentUser = null;
let dashboardState = {
    currentSection: 'dashboard',
    currentVenue: 'farewell',
    quill: null,
    stats: {}
};

// Authentication and initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    try {
        // Validate token and get user info
        const response = await fetch('/admin/api/events', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        // Initialize dashboard
        await initializeDashboard();
        
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('authToken');
        window.location.href = '/admin/login';
    }
});

// Dashboard initialization
async function initializeDashboard() {
    setupNavigation();
    setupMobileMenu();
    setupModal();
    setupToasts();
    await loadDashboardStats();
    await loadInitialData();
    showSection('dashboard');
}

// Navigation setup
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const mainTitle = document.getElementById('main-title');
    const breadcrumb = document.getElementById('breadcrumb');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            
            // Update active states
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Show section
            showSection(target);
            
            // Update header
            const sectionNames = {
                'dashboard': 'Dashboard',
                'events': 'Event Management',
                'blog': 'Blog Management',
                'venue': 'Venue Settings',
                'import': 'Import Legacy Data'
            };
            
            mainTitle.textContent = sectionNames[target] || target;
            breadcrumb.textContent = `Home / ${sectionNames[target] || target}`;
        });
    });

    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('/admin/api/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            window.location.href = '/admin/login';
        }
    });
}

// Mobile menu setup
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
}

// Section management
function showSection(sectionName) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        dashboardState.currentSection = sectionName;
        
        // Load section-specific data
        switch (sectionName) {
            case 'events':
                loadEvents();
                break;
            case 'blog':
                loadBlogPosts();
                break;
            case 'venue':
                loadVenueSettings();
                break;
            case 'import':
                setupImportHandlers();
                break;
        }
    }
}

// Dashboard stats loading
async function loadDashboardStats() {
    try {
        const [eventsRes, blogRes] = await Promise.all([
            apiCall('/admin/api/events'),
            apiCall('/admin/api/blog')
        ]);
        
        const events = await eventsRes.json();
        const blogData = await blogRes.json();
        
        // Update stats
        document.getElementById('stats-total-events').textContent = Array.isArray(events) ? events.length : 0;
        document.getElementById('stats-total-posts').textContent = blogData.data ? blogData.data.length : 0;
        document.getElementById('stats-total-users').textContent = '1'; // TODO: Implement when user API is ready
        
        // Update recent activity
        updateRecentActivity([
            { time: 'Just now', text: 'Dashboard loaded successfully' },
            { time: '5 min ago', text: `Loaded ${Array.isArray(events) ? events.length : 0} events` },
            { time: '10 min ago', text: `Found ${blogData.data ? blogData.data.length : 0} blog posts` }
        ]);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Failed to load dashboard statistics', 'error');
    }
}

function updateRecentActivity(activities) {
    const activityList = document.getElementById('recent-activity-list');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <span class="activity-time">${activity.time}</span>
            <span class="activity-text">${activity.text}</span>
        </div>
    `).join('');
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    return fetch(endpoint, { ...defaultOptions, ...options });
}

// Events management
async function loadEvents() {
    try {
        const response = await apiCall('/admin/api/events');
        const events = await response.json();
        
        if (!Array.isArray(events)) {
            throw new Error('Invalid events data');
        }
        
        renderEventsList(events);
        setupEventHandlers();
        
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events', 'error');
    }
}

function renderEventsList(events) {
    const eventList = document.getElementById('event-list');
    
    if (events.length === 0) {
        eventList.innerHTML = `
            <div class="list-item-card">
                <div class="list-item-info">
                    <div class="list-item-title">No events found</div>
                    <div class="list-item-meta">Use the "Import Legacy" section to load events or create new ones.</div>
                </div>
            </div>
        `;
        return;
    }
    
    eventList.innerHTML = events.map(event => `
        <div class="list-item-card">
            <div class="list-item-info">
                <div class="list-item-title">${event.title}</div>
                <div class="list-item-meta">
                    ${new Date(event.date).toLocaleDateString()} • 
                    <span style="color: var(--${event.venue === 'farewell' ? 'blue' : 'magenta'}); text-transform: capitalize;">
                        ${event.venue}
                    </span>
                    ${event.description ? ` • ${event.description.substring(0, 50)}...` : ''}
                </div>
            </div>
            <div class="list-item-card-actions">
                <button class="btn btn-secondary" onclick="editEvent('${event.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteEvent('${event.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function setupEventHandlers() {
    const addEventBtn = document.getElementById('add-event-btn');
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => showEventForm());
    }
    
    if (venueFilter) {
        venueFilter.addEventListener('change', filterEvents);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
    }
}

function showEventForm(eventId = null) {
    const modalBody = document.getElementById('modal-form-body');
    const isEdit = eventId !== null;
    
    modalBody.innerHTML = `
        <h2>${isEdit ? 'Edit Event' : 'Create New Event'}</h2>
        <form id="event-form">
            <div class="form-group">
                <label>Title *</label>
                <input name="title" required placeholder="Event title">
            </div>
            
            <div class="form-group">
                <label>Date *</label>
                <input name="date" type="date" required>
            </div>
            
            <div class="form-group">
                <label>Venue *</label>
                <select name="venue" required>
                    <option value="">Select venue</option>
                    <option value="farewell">Farewell</option>
                    <option value="howdy">Howdy</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Event Time</label>
                <input name="event_time" placeholder="e.g., 8:00 PM, Doors at 7:30">
            </div>
            
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="4" placeholder="Event description"></textarea>
            </div>
            
            <div class="form-group">
                <label>Age Restriction</label>
                <input name="age_restriction" placeholder="e.g., 21+, All Ages">
            </div>
            
            <div class="form-group">
                <label>Flyer Image</label>
                <input name="flyer_image_url" type="url" placeholder="Image URL">
                <div style="margin: 0.5rem 0; text-align: center; color: var(--text-secondary);">OR</div>
                <input type="file" id="flyer-file-input" accept="image/*">
                <button type="button" id="upload-flyer-btn" class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;">Upload Flyer</button>
                <div id="upload-status" style="margin-top: 0.5rem; text-align: center;"></div>
                <div id="flyer-preview" style="margin-top: 1rem;"></div>
            </div>
            
            <div class="form-group">
                <label>Ticket URL</label>
                <input name="ticket_url" type="url" placeholder="https://...">
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update Event' : 'Create Event'}</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    // Setup flyer upload
    setupFlyerUpload();
    
    // Load event data if editing
    if (isEdit) {
        loadEventForEdit(eventId);
    }
    
    // Setup form submission
    document.getElementById('event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitEventForm(eventId);
    });
    
    openModal();
}

function setupFlyerUpload() {
    const flyerInput = document.querySelector('input[name="flyer_image_url"]');
    const flyerPreview = document.getElementById('flyer-preview');
    const fileInput = document.getElementById('flyer-file-input');
    const uploadBtn = document.getElementById('upload-flyer-btn');
    const uploadStatus = document.getElementById('upload-status');
    
    // Preview URL input
    flyerInput.addEventListener('input', (e) => {
        const url = e.target.value;
        if (url && url.startsWith('http')) {
            flyerPreview.innerHTML = `<img src="${url}" alt="Flyer preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        } else {
            flyerPreview.innerHTML = '';
        }
    });
    
    // Handle file upload
    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        
        if (!file) {
            uploadStatus.innerHTML = '<div style="color: var(--error);">Please select a file first</div>';
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            uploadStatus.innerHTML = '<div style="color: var(--error);">Please select an image file</div>';
            return;
        }
        
        const formData = new FormData();
        formData.append('flyer', file);
        
        uploadStatus.innerHTML = '<div style="color: var(--cyan);">Uploading...</div>';
        uploadBtn.disabled = true;
        
        try {
            const response = await fetch('/admin/api/flyers/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                flyerInput.value = result.url;
                flyerPreview.innerHTML = `<img src="${result.url}" alt="Uploaded flyer" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
                uploadStatus.innerHTML = '<div style="color: var(--success);">Upload successful!</div>';
                fileInput.value = '';
                
                setTimeout(() => {
                    uploadStatus.innerHTML = '';
                }, 3000);
            } else {
                uploadStatus.innerHTML = `<div style="color: var(--error);">Upload failed: ${result.error}</div>`;
            }
        } catch (error) {
            uploadStatus.innerHTML = `<div style="color: var(--error);">Upload failed: ${error.message}</div>`;
        } finally {
            uploadBtn.disabled = false;
        }
    });
}

async function loadEventForEdit(eventId) {
    try {
        const response = await apiCall('/admin/api/events');
        const events = await response.json();
        const event = events.find(e => e.id === eventId);
        
        if (!event) {
            throw new Error('Event not found');
        }
        
        const form = document.getElementById('event-form');
        form.title.value = event.title || '';
        form.date.value = event.date || '';
        form.venue.value = event.venue || '';
        form.event_time.value = event.time || event.event_time || '';
        form.description.value = event.description || '';
        form.age_restriction.value = event.ageRestriction || event.age_restriction || '';
        form.flyer_image_url.value = event.imageUrl || event.flyer_image_url || '';
        form.ticket_url.value = event.ticketLink || event.ticket_url || '';
        
        // Trigger flyer preview
        if (event.imageUrl || event.flyer_image_url) {
            const flyerPreview = document.getElementById('flyer-preview');
            flyerPreview.innerHTML = `<img src="${event.imageUrl || event.flyer_image_url}" alt="Current flyer" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        }
        
    } catch (error) {
        console.error('Error loading event for edit:', error);
        showToast('Failed to load event data', 'error');
    }
}

async function submitEventForm(eventId) {
    const formData = new FormData(document.getElementById('event-form'));
    const data = Object.fromEntries(formData.entries());
    
    if (!data.title || !data.date || !data.venue) {
        showToast('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        const method = eventId ? 'PUT' : 'POST';
        const url = eventId ? `/admin/api/events/${eventId}` : '/admin/api/events';
        
        const response = await apiCall(url, {
            method,
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal();
            loadEvents();
            showToast(`Event ${eventId ? 'updated' : 'created'} successfully`, 'success');
        } else {
            showToast(`Failed to ${eventId ? 'update' : 'create'} event: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error submitting event:', error);
        showToast('Failed to save event', 'error');
    }
}

// Global functions for event actions
window.editEvent = function(id) {
    showEventForm(id);
};

window.deleteEvent = async function(id) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/admin/api/events/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadEvents();
            showToast('Event deleted successfully', 'success');
        } else {
            showToast('Failed to delete event', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
    }
};

// Blog management
async function loadBlogPosts() {
    try {
        const response = await apiCall('/admin/api/blog');
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid blog data');
        }
        
        renderBlogList(data.data);
        setupBlogHandlers();
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showToast('Failed to load blog posts', 'error');
    }
}

function renderBlogList(posts) {
    const blogList = document.getElementById('blog-list');
    
    if (posts.length === 0) {
        blogList.innerHTML = `
            <div class="list-item-card">
                <div class="list-item-info">
                    <div class="list-item-title">No blog posts found</div>
                    <div class="list-item-meta">Create your first blog post to get started.</div>
                </div>
            </div>
        `;
        return;
    }
    
    blogList.innerHTML = posts.map(post => `
        <div class="list-item-card">
            <div class="list-item-info">
                <div class="list-item-title">${post.title}</div>
                <div class="list-item-meta">
                    ${post.date || new Date(post.created_at).toLocaleDateString()}
                    ${post.status ? ` • ${post.status}` : ''}
                </div>
            </div>
            <div class="list-item-card-actions">
                <button class="btn btn-secondary" onclick="editBlogPost('${post.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteBlogPost('${post.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function setupBlogHandlers() {
    const addBlogBtn = document.getElementById('add-blog-btn');
    const statusFilter = document.getElementById('blog-status-filter');
    const searchInput = document.getElementById('blog-search');
    
    if (addBlogBtn) {
        addBlogBtn.addEventListener('click', () => showBlogForm());
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterBlogPosts);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterBlogPosts);
    }
}

function showBlogForm(postId = null) {
    const modalBody = document.getElementById('modal-form-body');
    const isEdit = postId !== null;
    
    modalBody.innerHTML = `
        <h2>${isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
        <form id="blog-form">
            <div class="form-group">
                <label>Title *</label>
                <input name="title" required placeholder="Blog post title">
            </div>
            
            <div class="form-group">
                <label>Date</label>
                <input name="date" type="date">
            </div>
            
            <div class="form-group">
                <label>Status</label>
                <select name="status">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Tags (comma-separated)</label>
                <input name="tags" placeholder="blog, news, events">
            </div>
            
            <div class="form-group">
                <label>Content *</label>
                <div id="quill-editor" style="height: 300px; background: white; color: black;"></div>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update Post' : 'Create Post'}</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    // Initialize Quill editor
    setTimeout(() => {
        if (typeof Quill !== 'undefined') {
            dashboardState.quill = new Quill('#quill-editor', {
                theme: 'snow',
                placeholder: 'Write your blog post content here...'
            });
            
            // Load post data if editing
            if (isEdit) {
                loadBlogPostForEdit(postId);
            }
        } else {
            console.error('Quill library not loaded');
            document.getElementById('quill-editor').innerHTML = '<p style="color: red; padding: 1rem;">Rich text editor failed to load. Please refresh the page.</p>';
        }
    }, 100);
    
    // Setup form submission
    document.getElementById('blog-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitBlogForm(postId);
    });
    
    openModal();
}

async function loadBlogPostForEdit(postId) {
    try {
        const response = await apiCall(`/admin/api/blog/${postId}`);
        const data = await response.json();
        
        if (!data.success || !data.data) {
            throw new Error('Blog post not found');
        }
        
        const post = data.data;
        const form = document.getElementById('blog-form');
        
        form.title.value = post.title || '';
        form.date.value = post.date || '';
        form.status.value = post.status || 'draft';
        form.tags.value = post.tags || '';
        
        // Set Quill content
        if (dashboardState.quill) {
            dashboardState.quill.root.innerHTML = post.content || '';
        }
        
    } catch (error) {
        console.error('Error loading blog post for edit:', error);
        showToast('Failed to load blog post data', 'error');
    }
}

async function submitBlogForm(postId) {
    const formData = new FormData(document.getElementById('blog-form'));
    const data = Object.fromEntries(formData.entries());
    
    // Get content from Quill editor
    data.content = dashboardState.quill ? dashboardState.quill.root.innerHTML : '';
    
    if (!data.title || !data.content) {
        showToast('Please fill in title and content', 'warning');
        return;
    }
    
    try {
        const method = postId ? 'PUT' : 'POST';
        const url = postId ? `/admin/api/blog/${postId}` : '/admin/api/blog';
        
        const response = await apiCall(url, {
            method,
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal();
            loadBlogPosts();
            showToast(`Blog post ${postId ? 'updated' : 'created'} successfully`, 'success');
        } else {
            showToast(`Failed to ${postId ? 'update' : 'create'} blog post: ${result.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Error submitting blog post:', error);
        showToast('Failed to save blog post', 'error');
    }
}

// Global functions for blog actions
window.editBlogPost = function(id) {
    showBlogForm(id);
};

window.deleteBlogPost = async function(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/admin/api/blog/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadBlogPosts();
            showToast('Blog post deleted successfully', 'success');
        } else {
            showToast('Failed to delete blog post', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting blog post:', error);
        showToast('Failed to delete blog post', 'error');
    }
};

// Venue settings (placeholder)
async function loadVenueSettings() {
    // TODO: Implement venue settings when backend is ready
    showToast('Venue settings coming soon!', 'warning');
}

// Thrift store (placeholder)
// Import handlers
function setupImportHandlers() {
    const importLegacyBtn = document.getElementById('import-legacy-btn');
    const importBlogBtn = document.getElementById('import-blog-btn');
    
    if (importLegacyBtn) {
        importLegacyBtn.addEventListener('click', async () => {
            const status = document.getElementById('import-status');
            status.innerHTML = '<div style="color: var(--cyan);">Importing events...</div>';
            
            try {
                const response = await apiCall('/admin/api/sync-events', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    status.innerHTML = `<div style="color: var(--success);">Imported ${result.imported} events!</div>`;
                    loadEvents(); // Refresh events list
                    loadDashboardStats(); // Refresh stats
                } else {
                    status.innerHTML = `<div style="color: var(--error);">Import failed: ${result.error}</div>`;
                }
                
            } catch (error) {
                status.innerHTML = `<div style="color: var(--error);">Import failed: ${error.message}</div>`;
            }
        });
    }
    
    if (importBlogBtn) {
        importBlogBtn.addEventListener('click', () => {
            showToast('Blog import coming soon!', 'warning');
        });
    }
}

// Modal management
function setupModal() {
    const modal = document.getElementById('form-modal');
    const closeBtn = document.querySelector('.modal-close-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('form-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('form-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clean up Quill instance
    if (dashboardState.quill) {
        dashboardState.quill = null;
    }
}

// Make closeModal global
window.closeModal = closeModal;

// Toast notifications
function setupToasts() {
    // Toast container is already in HTML
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 5000);
}

// Filter functions
function filterEvents() {
    const venueFilter = document.getElementById('event-venue-filter').value;
    const searchTerm = document.getElementById('event-search').value.toLowerCase();
    
    // TODO: Implement filtering logic
    console.log('Filtering events:', { venue: venueFilter, search: searchTerm });
}

function filterBlogPosts() {
    const statusFilter = document.getElementById('blog-status-filter').value;
    const searchTerm = document.getElementById('blog-search').value.toLowerCase();
    
    // TODO: Implement filtering logic
    console.log('Filtering blog posts:', { status: statusFilter, search: searchTerm });
}

// Initial data loading
async function loadInitialData() {
    // Load data for all sections to populate stats
    try {
        await Promise.all([
            loadEvents(),
            loadBlogPosts()
        ]);
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}
