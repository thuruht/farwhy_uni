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
// Helper Functions
// ====================================

// Cookie helper function
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// API helper functions
const api = {
    get: async (endpoint) => {
        const response = await fetch(endpoint, {
            credentials: 'include'
        });
        if (response.status === 401) {
            console.error('Authentication failed, redirecting to login');
            window.location.href = '/';
            return null;
        }
        return response;
    },
    post: async (endpoint, data) => {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            console.error('Authentication failed, redirecting to login');
            window.location.href = '/';
            return null;
        }
        return response;
    },
    put: async (endpoint, data) => {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            console.error('Authentication failed, redirecting to login');
            window.location.href = '/';
            return null;
        }
        return response;
    },
    delete: async (endpoint) => {
        const response = await fetch(endpoint, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.status === 401) {
            console.error('Authentication failed, redirecting to login');
            window.location.href = '/';
            return null;
        }
        return response;
    }
};

// Date formatter
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// ====================================
// Initialization & Authentication
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const sessionToken = getCookie('sessionToken');
    if (!sessionToken) {
        console.log('No session token found, redirecting to login');
        window.location.href = '/';
        return;
    }

    try {
        // Validate session and get user info
        const response = await api.get('/api/events');
        if (!response || !response.ok) {
            throw new Error('Authentication failed');
        }
        
        // Initialize dashboard
        await initializeDashboard();
    } catch (error) {
        console.error('Authentication error:', error);
        // Clear session cookie and redirect to login
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/';
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

// ====================================
// Navigation & UI Setup
// ====================================

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
            await fetch('/api/logout', { 
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Ensure cookie is properly cleared with correct path
            document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('Logged out, redirecting to login page');
            window.location.href = '/';
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

// Modal setup
function setupModal() {
    const modal = document.getElementById('form-modal');
    const closeBtn = document.querySelector('.modal-close-btn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Toast notifications setup
function setupToasts() {
    // Will be implemented when needed
}

// Show a section
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

// Display toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}

// ====================================
// Dashboard Data Loading
// ====================================

// Load initial data for dashboard
async function loadInitialData() {
    const currentUser = document.getElementById('current-user');
    currentUser.textContent = 'Admin User';
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const [eventsRes, blogRes] = await Promise.all([
            api.get('/api/events'),
            api.get('/api/blog')
        ]);
        
        const events = await eventsRes.json();
        const blogData = await blogRes.json();
        
        // Update stats
        document.getElementById('stats-total-events').textContent = Array.isArray(events) ? events.length : 0;
        document.getElementById('stats-total-posts').textContent = blogData.data ? blogData.data.length : 0;
        document.getElementById('stats-total-users').textContent = '1';
        
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

// ====================================
// Events Management
// ====================================

// Load events for event management section
async function loadEvents() {
    try {
        const response = await api.get('/api/events');
        const events = await response.json();
        dashboardState.events = events;
        
        renderEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        showToast('Failed to load events', 'error');
    }
}

// Render events list
function renderEvents(events) {
    const eventList = document.getElementById('event-list');
    
    if (!Array.isArray(events)) {
        eventList.innerHTML = `<div class='status-message status-error'>Failed to load events: Invalid response format</div>`;
        return;
    }
    
    if (events.length === 0) {
        eventList.innerHTML = `<div class='status-message status-info'>No events found. Use the Import Legacy button to load events.</div>`;
        return;
    }
    
    let html = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>`;
    
    for (const ev of events) {
        html += `<tr>
            <td><strong>${ev.title || 'Untitled'}</strong></td>
            <td>${formatDate(ev.date)}</td>
            <td><span style="text-transform: capitalize; color: var(--${ev.venue === 'farewell' ? 'blue' : 'magenta'});">${ev.venue || 'Unknown'}</span></td>
            <td class='admin-table-actions'>
                <button onclick='editEvent("${ev.id}")'>Edit</button>
                <button onclick='deleteEvent("${ev.id}")'>Delete</button>
            </td>
        </tr>`;
    }
    
    html += `</tbody></table>`;
    eventList.innerHTML = html;
    
    // Setup event filters
    setupEventFilters();
}

// Setup event filters
function setupEventFilters() {
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    
    if (venueFilter) {
        venueFilter.addEventListener('change', filterEvents);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
    }
}

// Filter events based on venue and search term
function filterEvents() {
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    
    const venue = venueFilter ? venueFilter.value : '';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filteredEvents = dashboardState.events.filter(event => {
        const matchesVenue = !venue || event.venue === venue;
        const matchesSearch = !searchTerm || 
            (event.title && event.title.toLowerCase().includes(searchTerm)) || 
            (event.description && event.description.toLowerCase().includes(searchTerm));
        
        return matchesVenue && matchesSearch;
    });
    
    renderEvents(filteredEvents);
}

// Add event button handler
document.addEventListener('DOMContentLoaded', () => {
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => showEventForm());
    }
});

// Delete event handler
window.deleteEvent = async function(id) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        const response = await api.delete(`/admin/api/events/${id}`);
        if (response.ok) {
            showToast('Event deleted successfully', 'success');
            loadEvents();
        } else {
            const error = await response.json();
            showToast(`Failed to delete event: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showToast('Failed to delete event', 'error');
    }
};

// Edit event handler
window.editEvent = function(id) {
    showEventForm(id);
};

// Show event form for creating/editing
function showEventForm(id = null) {
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    
    dashboardState.editingEventId = id;
    
    // Build form HTML
    let formHtml = `
        <div class="admin-form">
            <h3>${id ? 'Edit Event' : 'Create New Event'}</h3>
            <form id='event-form'>
                <!-- Required Fields -->
                <label>Venue * <span class="required-note">(Determines auto-populated defaults)</span></label>
                <select name='venue' id='venue-select' required onchange='updateAutoPopulation()'>
                    <option value="">-- Select Venue --</option>
                    <option value="farewell">Farewell</option>
                    <option value="howdy">Howdy</option>
                </select>
                
                <label>Title *</label>
                <input name='title' required placeholder="Event title">
                
                <label>Date & Time *</label>
                <input name='date' type='datetime-local' required>
                
                <!-- Auto-Population Section -->
                <div class="auto-population-section">
                    <h4>Auto-Populated Fields</h4>
                    
                    <div class="field-group">
                        <div>
                            <strong>Age Restriction:</strong>
                            <span id="default-age-display">Select venue first</span>
                        </div>
                        <label>
                            <input type="checkbox" id="override-age-check"> 
                            Use custom age restriction
                        </label>
                        <input type="text" id="custom-age-restriction" name="age_restriction" 
                               placeholder="Custom age restriction" style="display: none;">
                    </div>
                    
                    <div class="field-group">
                        <div>
                            <strong>Event Time:</strong>
                            <span id="default-time-display">Select venue first</span>
                        </div>
                        <label>
                            <input type="checkbox" id="override-time-check"> 
                            Use custom event time
                        </label>
                        <input type="text" id="custom-event-time" name="event_time" 
                               placeholder="Custom event time" style="display: none;">
                    </div>
                </div>
                
                <!-- Optional Fields -->
                <label>Description</label>
                <textarea name='description' rows="4" placeholder="Event description"></textarea>
                
                <label>Price</label>
                <input name='price' placeholder="e.g., $15, Free, Donation">
                
                <label>Capacity</label>
                <input name='capacity' type="number" placeholder="Maximum attendance">
                
                <div class="checkbox-group">
                    <label>
                        <input type="checkbox" name="is_featured">
                        Feature this event on homepage
                    </label>
                </div>
                
                <!-- File Upload Section -->
                <label>Flyer Image</label>
                <div class="flyer-upload-section">
                    <input name='flyer_image_url' type="url" placeholder="Enter image URL or upload file below">
                    <div>OR</div>
                    <input type="file" id="flyer-file-input" accept="image/*">
                    <button type="button" id="upload-flyer-btn" class="admin-btn secondary">Upload Flyer</button>
                    <div id="upload-status"></div>
                </div>
                <div id="flyer-preview"></div>
                
                <label>Ticket URL</label>
                <input name='ticket_url' type="url" placeholder="https://...">
                
                <div class="form-actions">
                    <button type='submit' class='admin-btn'>${id ? 'Update Event' : 'Create Event'}</button>
                    <button type='button' class='admin-btn secondary' onclick='closeEventForm()'>Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    modalBody.innerHTML = formHtml;
    modal.classList.add('active');
    
    // Setup auto-population logic
    setupAutoPopulation();
    
    // Setup flyer preview and upload
    setupFlyerUpload();
    
    // If editing, load existing data
    if (id) {
        loadEventData(id);
    }
    
    // Setup form submission
    setupEventFormSubmission(id);
}

// Aaron's auto-population logic
function setupAutoPopulation() {
    // Override checkbox handlers
    const overrideAgeCheck = document.getElementById('override-age-check');
    const overrideTimeCheck = document.getElementById('override-time-check');
    const customAgeInput = document.getElementById('custom-age-restriction');
    const customTimeInput = document.getElementById('custom-event-time');
    
    if (overrideAgeCheck && customAgeInput) {
        overrideAgeCheck.addEventListener('change', (e) => {
            customAgeInput.style.display = e.target.checked ? 'block' : 'none';
            customAgeInput.required = e.target.checked;
            if (!e.target.checked) customAgeInput.value = '';
        });
    }
    
    if (overrideTimeCheck && customTimeInput) {
        overrideTimeCheck.addEventListener('change', (e) => {
            customTimeInput.style.display = e.target.checked ? 'block' : 'none';
            customTimeInput.required = e.target.checked;
            if (!e.target.checked) customTimeInput.value = '';
        });
    }
}

// Update auto-population values based on venue
window.updateAutoPopulation = function() {
    const venueSelect = document.getElementById('venue-select');
    const defaultAgeDisplay = document.getElementById('default-age-display');
    const defaultTimeDisplay = document.getElementById('default-time-display');
    
    if (!venueSelect || !defaultAgeDisplay || !defaultTimeDisplay) return;
    
    const venue = venueSelect.value;
    
    if (venue === 'howdy') {
        defaultAgeDisplay.textContent = 'All ages';
        defaultTimeDisplay.textContent = 'Doors at 7pm / Music at 8pm';
    } else if (venue === 'farewell') {
        defaultAgeDisplay.textContent = '21+ unless with parent or legal guardian';
        defaultTimeDisplay.textContent = 'Doors at 7pm / Music at 8pm';
    } else {
        defaultAgeDisplay.textContent = 'Select venue first';
        defaultTimeDisplay.textContent = 'Select venue first';
    }
};

// Setup flyer image upload
function setupFlyerUpload() {
    const flyerInput = document.querySelector('input[name="flyer_image_url"]');
    const flyerPreview = document.getElementById('flyer-preview');
    const fileInput = document.getElementById('flyer-file-input');
    const uploadBtn = document.getElementById('upload-flyer-btn');
    const uploadStatus = document.getElementById('upload-status');
    
    if (!flyerInput || !flyerPreview || !fileInput || !uploadBtn || !uploadStatus) return;
    
    // Preview URL when entered manually
    flyerInput.addEventListener('input', (e) => {
        const url = e.target.value;
        if (url && url.startsWith('http')) {
            flyerPreview.innerHTML = `<img src="${url}" alt="Flyer preview" style="max-width: 300px; max-height: 300px;">`;
        } else {
            flyerPreview.innerHTML = '';
        }
    });
    
    // Handle file upload
    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        
        if (!file) {
            uploadStatus.innerHTML = '<div class="status-error">Please select a file first</div>';
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            uploadStatus.innerHTML = '<div class="status-error">Please select an image file</div>';
            return;
        }
        
        const formData = new FormData();
        formData.append('flyer', file);
        
        uploadStatus.innerHTML = '<div class="status-info">Uploading...</div>';
        uploadBtn.disabled = true;
        
        try {
            const response = await fetch('/api/events/flyer', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                flyerInput.value = result.url;
                flyerPreview.innerHTML = `<img src="${result.url}" alt="Uploaded flyer" style="max-width: 300px; max-height: 300px;">`;
                uploadStatus.innerHTML = '<div class="status-success">Upload successful!</div>';
                fileInput.value = '';
                
                setTimeout(() => {
                    uploadStatus.innerHTML = '';
                }, 3000);
            } else {
                uploadStatus.innerHTML = `<div class="status-error">Upload failed: ${result.error || 'Unknown error'}</div>`;
            }
        } catch (error) {
            uploadStatus.innerHTML = `<div class="status-error">Upload failed: ${error.message}</div>`;
        } finally {
            uploadBtn.disabled = false;
        }
    });
}

// Load event data for editing
async function loadEventData(id) {
    try {
        // Find event in state or fetch if needed
        let event = dashboardState.events.find(e => e.id === id);
        
        if (!event) {
            const response = await api.get(`/admin/api/events`);
            const events = await response.json();
            event = events.find(e => e.id === id);
        }
        
        if (!event) {
            showToast('Event not found', 'error');
            return;
        }
        
        const form = document.getElementById('event-form');
        if (!form) return;
        
        // Fill basic fields
        form.title.value = event.title || '';
        form.date.value = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';
        form.venue.value = event.venue || '';
        form.description.value = event.description || '';
        form.price.value = event.price || '';
        form.capacity.value = event.capacity || '';
        form.flyer_image_url.value = event.flyer_image_url || event.imageUrl || '';
        form.ticket_url.value = event.ticket_url || event.ticketLink || '';
        
        // Handle featured checkbox
        const featuredCheckbox = form.querySelector('input[name="is_featured"]');
        if (featuredCheckbox) {
            featuredCheckbox.checked = !!event.is_featured;
        }
        
        // Handle auto-population fields
        updateAutoPopulation();
        
        // Check if event has custom values (different from defaults)
        const defaultAge = event.venue === 'howdy' ? 'All ages' : '21+ unless with parent or legal guardian';
        const defaultTime = 'Doors at 7pm / Music at 8pm';
        
        const overrideAgeCheck = document.getElementById('override-age-check');
        const overrideTimeCheck = document.getElementById('override-time-check');
        const customAgeInput = document.getElementById('custom-age-restriction');
        const customTimeInput = document.getElementById('custom-event-time');
        
        if (event.age_restriction && event.age_restriction !== defaultAge) {
            if (overrideAgeCheck && customAgeInput) {
                overrideAgeCheck.checked = true;
                customAgeInput.style.display = 'block';
                customAgeInput.value = event.age_restriction;
            }
        }
        
        if (event.event_time && event.event_time !== defaultTime) {
            if (overrideTimeCheck && customTimeInput) {
                overrideTimeCheck.checked = true;
                customTimeInput.style.display = 'block';
                customTimeInput.value = event.event_time;
            }
        }
        
        // Trigger flyer preview
        const flyerUrl = event.flyer_image_url || event.imageUrl;
        const flyerPreview = document.getElementById('flyer-preview');
        if (flyerUrl && flyerPreview) {
            flyerPreview.innerHTML = `<img src="${flyerUrl}" alt="Current flyer" style="max-width: 300px; max-height: 300px;">`;
        }
    } catch (error) {
        console.error('Error loading event for editing:', error);
        showToast('Error loading event data', 'error');
    }
}

// Close event form
window.closeEventForm = function() {
    const modal = document.getElementById('form-modal');
    modal.classList.remove('active');
    dashboardState.editingEventId = null;
};

// Setup event form submission
function setupEventFormSubmission(id) {
    const form = document.getElementById('event-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Handle auto-population logic
        const overrideAge = document.getElementById('override-age-check').checked;
        const overrideTime = document.getElementById('override-time-check').checked;
        
        if (!overrideAge) {
            delete data.age_restriction;
        }
        
        if (!overrideTime) {
            delete data.event_time;
        }
        
        // Convert checkbox to boolean
        data.is_featured = form.querySelector('input[name="is_featured"]').checked;
        
        // Convert capacity to number if present
        if (data.capacity) {
            data.capacity = parseInt(data.capacity);
        }
        
        try {
            let method = id ? 'put' : 'post';
            let url = '/api/events' + (id ? `/${id}` : '');
            
            const response = await api[method](url, data);
            const result = await response.json();
            
            if (result.success || response.ok) {
                showToast(`Event ${id ? 'updated' : 'created'} successfully`, 'success');
                closeEventForm();
                loadEvents();
            } else {
                showToast(`Error saving event: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            showToast(`Error saving event: ${error.message}`, 'error');
        }
    });
}

// ====================================
// Blog Management
// ====================================

// Load blog posts
async function loadBlogPosts() {
    try {
        const response = await api.get('/api/blog');
        const result = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
            document.getElementById('blog-list').innerHTML = `
                <div class='status-message status-error'>Failed to load blog posts: Invalid response format</div>
            `;
            return;
        }
        
        dashboardState.blogPosts = result.data;
        renderBlogPosts(result.data);
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blog-list').innerHTML = `
            <div class='status-message status-error'>Failed to load blog posts: ${error.message}</div>
        `;
    }
}

// Render blog posts
function renderBlogPosts(posts) {
    const blogList = document.getElementById('blog-list');
    
    if (posts.length === 0) {
        blogList.innerHTML = `<div class='status-message status-info'>No blog posts found. Create your first post!</div>`;
        return;
    }
    
    let html = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;
    
    for (const post of posts) {
        html += `<tr>
            <td><strong>${post.title || 'Untitled'}</strong></td>
            <td>${formatDate(post.date || post.created_at)}</td>
            <td class='admin-table-actions'>
                <button onclick='editBlogPost("${post.id}")'>Edit</button>
                <button onclick='deleteBlogPost("${post.id}")'>Delete</button>
            </td>
        </tr>`;
    }
    
    html += `</tbody></table>`;
    blogList.innerHTML = html;
}

// Add blog post button handler
document.addEventListener('DOMContentLoaded', () => {
    const addBlogBtn = document.getElementById('add-blog-btn');
    if (addBlogBtn) {
        addBlogBtn.addEventListener('click', () => showBlogForm());
    }
});

// Edit blog post handler
window.editBlogPost = function(id) {
    showBlogForm(id);
};

// Delete blog post handler
window.deleteBlogPost = async function(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) {
        return;
    }
    
    try {
        const response = await api.delete(`/admin/api/blog/${id}`);
        if (response.ok) {
            showToast('Blog post deleted successfully', 'success');
            loadBlogPosts();
        } else {
            const error = await response.json();
            showToast(`Failed to delete blog post: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting blog post:', error);
        showToast('Failed to delete blog post', 'error');
    }
};

// Show blog form for creating/editing
function showBlogForm(id = null) {
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    
    dashboardState.editingPostId = id;
    
    // Build form HTML
    let formHtml = `
        <div class="admin-form">
            <h3>${id ? 'Edit Blog Post' : 'Create New Blog Post'}</h3>
            <form id='blog-form'>
                <label>Title *</label>
                <input name='title' required placeholder="Blog post title">
                
                <label>Date</label>
                <input name='date' type='date'>
                
                <label>Content *</label>
                <div id='quill-editor' style='height:300px; background: white;'></div>
                
                <div class="form-actions">
                    <button type='submit' class='admin-btn'>${id ? 'Update Post' : 'Create Post'}</button>
                    <button type='button' class='admin-btn secondary' onclick='closeBlogForm()'>Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    modalBody.innerHTML = formHtml;
    modal.classList.add('active');
    
    // Initialize Quill editor
    setTimeout(() => {
        if (typeof Quill !== 'undefined') {
            dashboardState.quill = new Quill('#quill-editor', { 
                theme: 'snow',
                placeholder: 'Write your blog post content here...'
            });
            
            // Load existing post data if editing
            if (id) {
                loadBlogPostData(id);
            }
        } else {
            console.error('Quill library not loaded');
            document.getElementById('quill-editor').innerHTML = 
                '<p style="color: red; padding: 1rem;">Rich text editor failed to load. Please refresh the page.</p>';
        }
    }, 100);
    
    // Setup form submission
    setupBlogFormSubmission(id);
}

// Load blog post data for editing
async function loadBlogPostData(id) {
    try {
        const response = await api.get(`/admin/api/blog/${id}`);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            showToast('Failed to load blog post', 'error');
            return;
        }
        
        const post = result.data;
        const form = document.getElementById('blog-form');
        
        if (form) {
            form.querySelector('[name="title"]').value = post.title || '';
            form.querySelector('[name="date"]').value = post.date || '';
            
            // Set Quill content
            if (dashboardState.quill) {
                dashboardState.quill.root.innerHTML = post.content || '';
            }
        }
    } catch (error) {
        console.error('Error loading blog post:', error);
        showToast(`Error loading blog post: ${error.message}`, 'error');
    }
}

// Close blog form
window.closeBlogForm = function() {
    const modal = document.getElementById('form-modal');
    modal.classList.remove('active');
    dashboardState.editingPostId = null;
    dashboardState.quill = null;
};

// Setup blog form submission
function setupBlogFormSubmission(id) {
    const form = document.getElementById('blog-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Get content from Quill editor
        data.content = dashboardState.quill ? dashboardState.quill.root.innerHTML : '';
        
        if (!data.title || !data.content) {
            showToast('Title and content are required', 'error');
            return;
        }
        
        try {
            let method = id ? 'put' : 'post';
            let url = '/api/blog' + (id ? `/${id}` : '');
            
            const response = await api[method](url, data);
            const result = await response.json();
            
            if (result.success) {
                showToast(`Blog post ${id ? 'updated' : 'created'} successfully`, 'success');
                closeBlogForm();
                loadBlogPosts();
            } else {
                showToast(`Failed to save blog post: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Error saving blog post:', error);
            showToast('Error saving blog post', 'error');
        }
    });
}

// ====================================
// Venue Settings
// ====================================

// Load venue settings
function loadVenueSettings() {
    const venueTabs = document.querySelectorAll('.venue-tabs .tab-btn');
    if (venueTabs) {
        venueTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                venueTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                dashboardState.currentVenue = tab.getAttribute('data-venue');
                // Load venue-specific data
                loadVenueData(dashboardState.currentVenue);
            });
        });
        
        // Load default venue data
        loadVenueData(dashboardState.currentVenue);
    }
    
    showToast('Venue settings functionality will be implemented soon', 'info');
}

// Load venue-specific data
function loadVenueData(venue) {
    // This will be implemented in the future
    console.log(`Loading data for venue: ${venue}`);
}

// ====================================
// Import Legacy
// ====================================

// Setup import handlers
function setupImportHandlers() {
    const importLegacyBtn = document.getElementById('import-legacy-btn');
    const importBlogBtn = document.getElementById('import-blog-btn');
    
    if (importLegacyBtn) {
        importLegacyBtn.addEventListener('click', async () => {
            const status = document.getElementById('import-status');
            status.textContent = 'Importing...';
            
            try {
                const response = await api.post('/api/sync-events');
                const data = await response.json();
                
                if (data.success) {
                    status.textContent = `Imported ${data.imported} events!`;
                    showToast(`Successfully imported ${data.imported} events`, 'success');
                    loadEvents();
                } else {
                    status.textContent = `Import failed: ${data.error || 'Unknown error'}`;
                    showToast(`Import failed: ${data.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Error importing events:', error);
                status.textContent = `Import failed: ${error.message}`;
                showToast(`Import failed: ${error.message}`, 'error');
            }
        });
    }
    
    if (importBlogBtn) {
        importBlogBtn.addEventListener('click', () => {
            const status = document.getElementById('import-blog-status');
            status.textContent = 'Blog import functionality coming soon...';
            showToast('Blog import will be implemented soon', 'info');
        });
    }
}
