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
    
    // Add the active class to make the login container visible
    loginContainer.classList.add('active');
    console.log('Added active class to login container');

    loginContainer.innerHTML = `
        <div class="admin-header">
            <h1>admin</h1>
        </div>
        <main>
            <div class="login-container">
                <div class="login-title">log in</div>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">user:</label>
                        <input type="text" id="username" name="username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">pass:</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="submit" class="login-btn">let me in</button>
                    <div id="login-error" class="error"></div>
                </form>
            </div>
        </main>
        <style>
            #login-container {
                background: var(--header-bg);
                font-family: var(--font-main, 'Lora', serif);
                margin: 0;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 9999;
            }
            .admin-header {
                width: 100%;
                background: var(--primary-bg-color) url('/img/bg4.png') center/cover no-repeat;
                background-attachment: fixed;
                border-bottom: 1px solid var(--nav-border-color);
                padding: 1rem 2rem;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 212px;
            }
            .admin-header h1 {
                font-family: var(--font-db, 'Lora', serif);
                font-size: clamp(2.5rem, 8vw, 4em);
                color: var(--secondary-bg-color);
                -webkit-text-stroke: 1px black;
                text-shadow: -1px -1px 0 #000,
                    1px -1px 0 #000,
                    -1px 1px 0 #000,
                    1px 1px 0 #000,
                    -8px 8px 0px var(--nav-border-color);
                margin: 0;
            }
            .login-container {
                background: var(--card-bg-color);
                border: 2px solid var(--nav-border-color);
                border-radius: 8px;
                box-shadow: -5px 5px 0px rgba(0,0,0,0.08);
                padding: 2.5rem 2rem 2rem 2rem;
                margin: 2rem auto 0 auto;
                max-width: 400px;
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .login-title {
                font-family: var(--font-db, 'Lora', serif);
                font-size: 2.2rem;
                color: var(--accent-color);
                margin-bottom: 1.5rem;
                text-shadow: 2px 2px 4px var(--header-text-shadow);
            }
            .form-group {
                width: 100%;
                margin-bottom: 1.2rem;
                text-align: left;
            }
            #loginForm label {
                font-family: var(--font-main, 'Lora', serif);
                color: var(--accent-color);
                font-weight: bold;
                margin-bottom: 0.3rem;
                display: block;
            }
            #loginForm input {
                width: 100%;
                padding: 0.8rem;
                border: 1.5px solid var(--nav-border-color);
                border-radius: 4px;
                font-family: var(--font-hnm11, 'Lora', serif);
                font-size: 1rem;
                background: rgba(255,255,255,0.95);
                color: var(--text-color);
                transition: border 0.2s;
            }
            #loginForm input:focus {
                outline: none;
                border-color: var(--secondary-bg-color);
                box-shadow: -3px 3px 0px rgba(0,0,0,0.08);
            }
            .login-btn {
                width: 100%;
                padding: 1rem 2rem;
                background: var(--button-bg-color);
                color: var(--button-text-color);
                font-family: var(--font-main, 'Lora', serif);
                font-weight: bold;
                border-radius: 4px;
                border: 2px solid var(--text-color);
                font-size: 1.1rem;
                margin-top: 0.5rem;
                cursor: pointer;
                transition: all var(--transition-speed) ease;
            }
            .login-btn:hover {
                background: var(--accent-color);
                color: white;
                transform: translateY(-2px);
            }
            .error {
                color: var(--redd);
                margin-top: 0.7rem;
                font-size: 1rem;
                min-height: 1.2em;
                text-align: center;
                font-family: var(--font-main, 'Lora', serif);
            }
            @media (max-width: 600px) {
                .login-container { padding: 1.2rem 0.5rem; }
                .admin-header { min-height: 120px; padding: 0.5rem; }
                .admin-header h1 { font-size: 2rem; }
            }
        </style>
    `;

    document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
}

function showDashboard() {
    console.log('showDashboard called');
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    console.log('Login container:', loginContainer);
    console.log('Dashboard container:', dashboardContainer);
    
    // Update user info display if we have a current user
    if (currentUser && currentUser.username) {
        const currentUserEl = document.getElementById('current-user');
        const userRoleEl = document.getElementById('user-role');
        
        if (currentUserEl) {
            currentUserEl.textContent = currentUser.username;
            console.log('Dashboard: Updated user display to', currentUser.username);
        }
        
        if (userRoleEl && currentUser.role) {
            userRoleEl.textContent = currentUser.role;
            console.log('Dashboard: Updated role display to', currentUser.role);
        }
    }
    
    if (loginContainer) {
        loginContainer.classList.remove('active');
        loginContainer.innerHTML = '';
        console.log('Removed active class and cleared login container');
    }
    
    if (dashboardContainer) {
        // Clear any potentially problematic inline styles
        if (dashboardContainer.style.display === 'none') {
            dashboardContainer.style.display = '';
            console.log('Cleared inline display style');
        }
        
        // Display the dashboard container with the correct display type
        dashboardContainer.style.display = 'grid';
        console.log('Dashboard container display set to grid');
        
        // Add a class to track visibility issues
        dashboardContainer.classList.add('dashboard-visible');
        console.log('Added dashboard-visible class');
        
        // Log the computed style to verify
        console.log('Dashboard container computed style after setting:', window.getComputedStyle(dashboardContainer).display);
        
        // Extra debugging to make sure dashboard elements are visible
        console.log('Dashboard sections after display:', document.querySelectorAll('.admin-section').length);
        console.log('Active sections:', document.querySelectorAll('.admin-section.active').length);
        
        // Force reflow to ensure styles are applied
        void dashboardContainer.offsetWidth;
    }
    
    console.log('Calling initializeDashboard...');
    initializeDashboard();
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('Login form submitted');
    const errorDiv = document.getElementById('login-error');
    const form = e.target;
    const data = { username: form.username.value, password: form.password.value };
    console.log('Login data:', { username: form.username.value, password: '********' });
    if (errorDiv) errorDiv.textContent = '';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const result = await response.json();
            console.log('Login response:', result);
            if (result.success) {
                // Set current user data from login response
                if (result.user) {
                    currentUser = result.user;
                    console.log('Updated currentUser from login:', currentUser);
                } else if (result.username) {
                    // Alternative response format
                    currentUser = {
                        username: result.username,
                        role: result.role || 'admin'
                    };
                    console.log('Updated currentUser from login alternative format:', currentUser);
                } else {
                    // If no user data in response, create from login data
                    currentUser = {
                        username: data.username,
                        role: 'admin'  // Default role
                    };
                    console.log('Created currentUser from login data:', currentUser);
                }
                
                // Update user info display
                const currentUserEl = document.getElementById('current-user');
                const userRoleEl = document.getElementById('user-role');
                
                if (currentUserEl) {
                    currentUserEl.textContent = currentUser.username;
                    console.log('Set username display to:', currentUser.username);
                }
                
                if (userRoleEl && currentUser.role) {
                    userRoleEl.textContent = currentUser.role;
                    console.log('Set user role display to:', currentUser.role);
                }
                
                // Slightly increased delay to ensure all DOM updates complete
                setTimeout(() => {
                    showDashboard();
                }, 100);
            } else {
                if (errorDiv) errorDiv.textContent = result.error || 'Invalid credentials.';
            }
        } else {
            if (errorDiv) errorDiv.textContent = 'Invalid credentials.';
        }
    } catch (err) {
        console.error('Login error:', err);
        if (errorDiv) errorDiv.textContent = 'An error occurred. Please try again.';
    }
}


// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Admin] App initializing...');
    
    // Inspect dashboard container
    const dashboardContainer = document.getElementById('dashboard-container');
    console.log('Dashboard container:', dashboardContainer);
    if (dashboardContainer) {
        // Initially hide the dashboard container until we know the auth status
        dashboardContainer.style.display = 'none';
        console.log('Dashboard container initially hidden, computed style:', window.getComputedStyle(dashboardContainer).display);
    }

    // Check if admin sections exist
    const sections = document.querySelectorAll('.admin-section');
    console.log(`Found ${sections.length} admin sections:`, Array.from(sections).map(s => s.id));

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
    
    // Add direct handler for the Add Blog Post button as well
    const addBlogBtn = document.getElementById('add-blog-btn');
    if (addBlogBtn) {
        console.log('Found add blog button, adding direct click handler');
        addBlogBtn.addEventListener('click', () => {
            console.log('Add blog button clicked via direct handler');
            showBlogForm();
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

    // Now check authentication and show the appropriate screen
    try {
        if (!sessionToken) {
            console.log('[Admin] No session token found. Showing login screen.');
            showLoginScreen();
        } else {
            console.log('[Admin] Session token found, checking validity...');
            const authResponse = await fetch('/api/check', { credentials: 'include', cache: 'no-store' });
            if (authResponse && authResponse.ok) {
                const authData = await authResponse.json();
                if (authData.success && authData.user) {
                    console.log('[Admin] Valid user session, showing dashboard');
                    currentUser = authData.user;
                    showDashboard();
                } else {
                    console.log('[Admin] Invalid user session data, showing login');
                    document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    showLoginScreen();
                }
            } else {
                console.log('[Admin] Auth check failed, showing login');
                document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                showLoginScreen();
            }
        }
    } catch (error) {
        console.error("[Admin] Auth check error, showing login screen.", error);
        document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
    console.log('initializeDashboard started');
    
    console.log('Setting up navigation...');
    setupNavigation();
    
    console.log('Setting up mobile menu...');
    setupMobileMenu();
    
    console.log('Setting up modal...');
    setupModal();
    
    console.log('Setting up toasts...');
    setupToasts();
    
    console.log('Loading initial data...');
    await loadInitialData();
    
    console.log('Showing dashboard section...');
    showSection('dashboard');
    
    console.log('initializeDashboard completed');
}

function showSection(sectionName) {
    console.log(`Showing section: ${sectionName}`);
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => section.classList.remove('active'));

    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        dashboardState.currentSection = sectionName;
        
        // Call appropriate loading function based on section
        switch (sectionName) {
            case 'dashboard': 
                loadDashboardStats(); 
                break;
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
    } else {
        console.error(`Section not found: section-${sectionName}`);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sectionIndicator = document.getElementById('section-indicator');
    const breadcrumb = document.getElementById('breadcrumb');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            showSection(target);
            const sectionNames = { 'dashboard': 'Dashboard', 'events': 'Event Management', 'blog': 'Blog Management', 'venue': 'Venue Settings', 'import': 'Import Legacy Data' };
            if (sectionIndicator) sectionIndicator.textContent = sectionNames[target] || target;
            if (breadcrumb) breadcrumb.textContent = `Home / ${sectionNames[target] || target}`;
        });
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        await api.post('/api/logout', {});
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

        // Close sidebar when clicking outside of it
        document.addEventListener('click', (e) => {
            if (sidebar &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
        
        // Close sidebar when a nav item is clicked
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        sidebar.classList.remove('open');
                    }, 150);
                }
            });
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
                console.log('Updated user role element with:', currentUser.role);
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
    eventList.innerHTML = `<table class="admin-table"><thead><tr><th>Image</th><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>` +
        events.map(ev => `<tr class="event-row venue-${ev.venue || 'unknown'}">
            <td style="width: 80px; vertical-align: middle;">
              <div class="event-list-thumbnail" style="display: inline-block;">
                ${ev.flyer_image_url || ev.imageUrl ? 
                  `<img src="${ev.flyer_image_url || ev.imageUrl}" alt="${ev.title || 'Event'} flyer" style="max-width: 70px; max-height: 70px; object-fit: cover;">` : 
                  `<span class="no-image">📷</span>`}
              </div>
            </td>
            <td style="vertical-align: middle;"><strong>${ev.title || 'Untitled'}</strong></td>
            <td style="vertical-align: middle;">${formatDate(ev.date)}</td>
            <td style="vertical-align: middle;"><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>
            <td class='admin-table-actions' style="vertical-align: middle;">
                <button onclick='editEvent("${ev.id}")'>Edit</button>
                <button onclick='deleteEvent("${ev.id}")'>Delete</button>
            </td>
        </tr>
        <tr class="event-divider"><td colspan="5"><hr/></td></tr>`).join('') + `</tbody></table>`;
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

        try {
            const res = await api._call('/api/admin/events/flyer', { 
                method: 'POST', 
                body: formData,
                headers: {} // Override default Content-Type for FormData
            });
            
            if (res) {
                const result = await res.json();
                if (result.success) {
                    document.querySelector('input[name="flyer_image_url"]').value = result.imageUrl;
                    showToast('Flyer uploaded!', 'success');
                } else {
                    showToast(result.error || 'Flyer upload failed.', 'error');
                }
            } else {
                showToast('Flyer upload failed.', 'error');
            }
        } catch (error) {
            console.error('Flyer upload error:', error);
            showToast('Error uploading flyer: ' + (error.message || 'Unknown error'), 'error');
        }
    });
    
    document.getElementById('event-form').addEventListener('submit', async (e) => {
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
    
    blogList.innerHTML = `<table class="admin-table"><thead><tr><th>Image</th><th>Title</th><th>Date</th><th>Actions</th></tr></thead><tbody>` +
        posts.map(post => `<tr>
            <td class="thumbnail-cell">
                ${post.image_url ? 
                    `<div class="thumbnail"><img src="${post.image_url}" alt="${post.title}" loading="lazy"></div>` : 
                    `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`}
            </td>
            <td><strong>${post.title}</strong></td>
            <td>${formatDate(post.date || post.created_at)}</td>
            <td class='admin-table-actions'>
                <button class="edit-blog-btn" data-id="${post.id}">Edit</button>
                <button class="delete-blog-btn" data-id="${post.id}">Delete</button>
            </td>
        </tr>
        <tr class="blog-divider"><td colspan="4"><hr/></td></tr>`).join('') + `</tbody></table>`;
    
    // Add event listeners to the newly created buttons
    blogList.querySelectorAll('.edit-blog-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            console.log('Edit blog button clicked for id:', id);
            editBlogPost(id);
        });
    });
    
    blogList.querySelectorAll('.delete-blog-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteBlogPost(id);
        });
    });
}

window.editBlogPost = (id) => {
    console.log('editBlogPost called with id:', id);
    const post = dashboardState.blogPosts.find(p => p.id === id);
    console.log('Found post:', post);
    
    if (post) {
        // Log post properties to debug
        console.log('Post properties:', Object.keys(post));
        console.log('Post content preview:', post.content ? post.content.substring(0, 100) + '...' : 'No content');
        
        showBlogForm(id);
    } else {
        console.error('Blog post not found with id:', id);
        console.log('Available posts:', dashboardState.blogPosts.map(p => ({ id: p.id, title: p.title })));
        showToast('Error: Blog post not found', 'error');
    }
};

window.deleteBlogPost = async (id) => {
    if (confirm('Are you sure?')) {
        const res = await api.delete(`/api/admin/blog/posts/${id}`);
        if (res) { 
            loadBlogPosts(); 
            showToast('Post deleted.', 'success'); 
        } else {
            showToast('Failed to delete post. Please try again.', 'error');
        }
    }
}

function showBlogForm(id = null) {
    console.log('showBlogForm called with id:', id);
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    console.log('Blog modal elements:', modal, modalBody);
    
    if (!modal || !modalBody) {
        console.error('Blog modal elements not found!');
        showToast('Error: Could not open blog form', 'error');
        return;
    }

    // Clear any existing content and reset
    modalBody.innerHTML = '';
    
    // Explicitly add the active class and verify
    modal.classList.add('active');
    console.log('Blog modal active class added, classList:', modal.classList);

    // Force reflow to ensure CSS transitions work
    void modal.offsetWidth;
    
    // Check computed style to verify visibility
    console.log('Modal computed display after adding active class:', window.getComputedStyle(modal).display);

    dashboardState.editingPostId = id;
    
    // Find the post and log its properties for debugging
    let post = null;
    if (id) {
        post = dashboardState.blogPosts.find(p => p.id === id);
        console.log('Post data for form:', post);
        
        if (!post) {
            console.error('Blog post not found with id:', id);
            showToast('Error: Blog post not found', 'error');
            modal.classList.remove('active');
            return;
        }
        
        // Normalize post data for consistent field access
        if (!post.title && post.post_title) post.title = post.post_title;
        if (!post.content && post.post_content) post.content = post.post_content;
        if (!post.date && post.post_date) post.date = post.post_date;
        if (!post.date && post.created_at) post.date = post.created_at;
        
        console.log('Normalized post data:', {
            title: post.title,
            date: post.date,
            contentPreview: post.content ? post.content.substring(0, 50) + '...' : 'No content'
        });
    }

    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit Blog Post' : 'New Blog Post'}</h3>
            <form id='blog-form'>
                <label>Title *</label>
                <input name='title' required value="${post?.title || ''}">
                <label>Date</label>
                <input name='date' type='date' value="${post?.date ? new Date(post.date).toISOString().split('T')[0] : ''}">
                <label>Featured Image</label>
                <div class="image-upload-group">
                  <input name='image_url' type="url" placeholder="Upload an image or enter URL" value="${post?.image_url || ''}">
                  <input type="file" id="blog-image-upload-input" accept="image/*" style="display:none;">
                  <button type="button" id="blog-image-upload-btn">Upload Image</button>
                </div>
                <div id="blog-image-preview" class="image-preview ${post?.image_url ? 'has-image' : ''}">
                  ${post?.image_url ? `<img src="${post.image_url}" alt="Featured image">` : ''}
                </div>
                <label>Content *</label>
                <div id='quill-editor' style='height:250px; background:white;'></div>
                <div class="form-actions">
                    <button type='submit' class='btn btn-primary'>${id ? 'Update Post' : 'Create Post'}</button>
                </div>
            </form>
        </div>
    `;
    // Modal class already added at the beginning of the function, don't add it twice

    // Initialize Quill editor with a slight delay to ensure the DOM is ready
    setTimeout(() => {
        try {
            console.log('Initializing Quill editor...');
            if (!document.getElementById('quill-editor')) {
                console.error('Quill editor element not found!');
                return;
            }
            
            // Set up blog image upload handler for the featured image
            const blogImageUploadBtn = document.getElementById('blog-image-upload-btn');
            const blogImageUploadInput = document.getElementById('blog-image-upload-input');
            const blogImagePreview = document.getElementById('blog-image-preview');
            const blogImageUrlInput = document.querySelector('input[name="image_url"]');
            
            if (blogImageUploadBtn && blogImageUploadInput) {
                blogImageUploadBtn.addEventListener('click', () => {
                    blogImageUploadInput.click();
                });
                
                blogImageUploadInput.addEventListener('change', async (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        
                        try {
                            // Show loading indicator
                            blogImageUploadBtn.disabled = true;
                            blogImageUploadBtn.textContent = 'Uploading...';
                            showToast('Uploading featured image...', 'info');
                            
                            // Create form data and upload
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            const res = await api._call('/api/admin/blog/upload-image', { 
                                method: 'POST', 
                                body: formData,
                                headers: {} // Override default Content-Type for FormData
                            });
                            
                            if (res) {
                                const result = await res.json();
                                
                                if (result.success) {
                                    // Update the URL input with the new image URL
                                    blogImageUrlInput.value = result.imageUrl;
                                    
                                    // Update the preview
                                    blogImagePreview.innerHTML = `<img src="${result.imageUrl}" alt="Featured image">`;
                                    blogImagePreview.classList.add('has-image');
                                    
                                    showToast('Featured image uploaded successfully!', 'success');
                                } else {
                                    showToast(result.error || 'Failed to upload image', 'error');
                                }
                            } else {
                                showToast('Failed to upload image', 'error');
                            }
                        } catch (error) {
                            console.error('Error uploading featured image:', error);
                            showToast('Error uploading image: ' + (error.message || 'Unknown error'), 'error');
                        } finally {
                            // Reset the button
                            blogImageUploadBtn.disabled = false;
                            blogImageUploadBtn.textContent = 'Upload Image';
                        }
                    }
                });
            }
            
            // Check if we already have an active Quill instance and destroy it first
            if (dashboardState.quill) {
                console.log('Removing existing Quill instance');
                dashboardState.quill = null;
                // Clear any existing Quill-related elements to prevent duplications
                const quillContainer = document.getElementById('quill-editor');
                // Ensure we don't have lingering toolbar elements that might cause issues
                const quillToolbars = document.querySelectorAll('.ql-toolbar');
                quillToolbars.forEach(toolbar => {
                    if (toolbar.parentNode === quillContainer.parentNode) {
                        toolbar.remove();
                    }
                });
            }
            
            // Create a fresh Quill instance
            const quill = new Quill('#quill-editor', { 
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'link'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['image'],
                        ['clean']
                    ]
                }
            });
            
            console.log('Quill editor initialized:', quill);
            dashboardState.quill = quill;

            // Set up custom image handler for Quill
            const toolbar = quill.getModule('toolbar');
            toolbar.addHandler('image', () => {
                // Give user a choice between URL and upload
                const useUrl = confirm('Would you like to use an image URL? Click OK for URL, Cancel for file upload.');
                
                if (useUrl) {
                    // Prompt for URL
                    const url = prompt('Enter the image URL:');
                    if (url) {
                        // Get the current selection
                        const range = quill.getSelection(true);
                        // Insert the image
                        quill.insertEmbed(range.index, 'image', url);
                        // Move cursor after image
                        quill.setSelection(range.index + 1);
                    }
                } else {
                    // Create a custom file input for upload
                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.click();
                    
                    // Listen for the file selection
                    input.onchange = async () => {
                        const file = input.files[0];
                        if (file) {
                            try {
                                // Show a loading toast
                                showToast('Uploading image to editor...', 'info');
                                
                                // Upload the file
                                const formData = new FormData();
                                formData.append('image', file);
                                
                                const res = await fetch('/api/admin/blog/upload-image', { 
                                    method: 'POST', 
                                    body: formData, 
                                    credentials: 'include' 
                                });
                                
                                const result = await res.json();
                                
                                if (res.ok && result.success) {
                                    // Get the current selection range
                                    const range = quill.getSelection(true);
                                    
                                    // Insert the image at the selection using the imageUrl from response
                                    quill.insertEmbed(range.index, 'image', result.imageUrl);
                                    // Move cursor after the image
                                    quill.setSelection(range.index + 1);
                                    
                                    showToast('Image inserted!', 'success');
                                } else {
                                    showToast(result.error || 'Image upload failed.', 'error');
                                }
                            } catch (error) {
                                console.error('Error uploading image to editor:', error);
                                showToast('Image upload failed: ' + (error.message || 'Unknown error'), 'error');
                            }
                        }
                    };
                }
            });

            if (post) {
                console.log('Setting quill content from post');
                // Try different content field names that might be present
                let content = null;
                
                if (post.content) {
                    content = post.content;
                    console.log('Using post.content');
                } else if (post.post_content) {
                    content = post.post_content;
                    console.log('Using post.post_content');
                } else {
                    console.warn('No content found in post');
                }
                
                if (content) {
                    // Use Quill's setContents or clipboard API to properly set content
                    // First, try to set via innerHTML (safe approach)
                    quill.root.innerHTML = content;
                    console.log('Set Quill content via innerHTML');
                    
                    // Ensure editor becomes focusable
                    quill.root.setAttribute('contenteditable', 'true');
                    
                    // Force a refresh of the Quill editor
                    quill.update();
                    console.log('Quill editor updated and refreshed');
                } else {
                    quill.root.innerHTML = '';
                    console.warn('Set empty Quill content');
                }
            }
        } catch (error) {
            console.error('Error initializing Quill:', error);
        }
    }, 100);

    document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Blog form submitted');

        // Disable submit button to prevent double-submission
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = id ? 'Updating...' : 'Creating...';
        }

        // Get form data
        const data = {
            title: e.target.title.value,
            date: e.target.date.value,
            image_url: e.target.image_url.value || null,
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
                await loadBlogPosts(); // Ensure blog posts are reloaded
            } else {
                console.error('API call returned null response');
                showToast('Failed to save blog post. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error submitting blog form:', error);
            showToast('An error occurred while saving the blog post.', 'error');
        } finally {
            // Re-enable submit button regardless of outcome
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

// Patch blog image upload to update input and preview
function patchBlogImageUpload() {
    document.body.addEventListener('change', async function(e) {
        if (e.target && e.target.id === 'blog-image-upload-input') {
            const file = e.target.files[0];
            if (!file) return;
            const btn = document.getElementById('blog-image-upload-btn');
            const urlInput = document.querySelector('input[name="image_url"]');
            const preview = document.getElementById('blog-image-preview');
            if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }
            try {
                const formData = new FormData();
                formData.append('image', file);
                const res = await api._call('/api/admin/blog/upload-image', { method: 'POST', body: formData, headers: {} });
                if (res) {
                    const result = await res.json();
                    if (result.success && result.imageUrl) {
                        if (urlInput) urlInput.value = result.imageUrl;
                        if (preview) {
                            preview.innerHTML = `<img src="${result.imageUrl}" alt="Featured image">`;
                            preview.classList.add('has-image');
                        }
                        showToast('Image uploaded!', 'success');
                    } else {
                        showToast(result.error || 'Image upload failed.', 'error');
                    }
                } else {
                    showToast('Image upload failed.', 'error');
                }
            } catch (err) {
                showToast('Error uploading image', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Upload Image'; }
            }
        }
    });
}
patchBlogImageUpload();

// Patch blog form input styles for visibility
const style = document.createElement('style');
style.textContent = `
#blog-form input, #blog-form textarea {
  background: #fff !important;
  color: #222 !important;
  border: 1px solid #bbb;
}
#blog-form input:focus, #blog-form textarea:focus {
  border-color: #333;
}
`;
document.head.appendChild(style);

// Patch event table column layout
const eventTableStyle = document.createElement('style');
eventTableStyle.textContent = `
.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 1rem;
}
.admin-table th, .admin-table td {
  padding: 0.75rem;
  text-align: left;
  vertical-align: middle !important;
}
.admin-table th { 
  white-space: nowrap; 
  background-color: #f8f9fa;
  font-weight: 600;
}
.admin-table td { 
  max-width: 200px; 
  overflow-wrap: break-word; 
}
`;
document.head.appendChild(eventTableStyle);

// Make sure sidebar toggle is working on mobile
const mobileToggle = document.getElementById('mobile-menu-toggle');
if (mobileToggle) {
  console.log('Adding additional mobile toggle listener for safety');
  mobileToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
      console.log('Toggled sidebar open class:', sidebar.classList.contains('open'));
    }
  });
}

// Patch import events feedback
const importBtn = document.getElementById('import-legacy-btn');
if (importBtn) {
  importBtn.addEventListener('click', async () => {
    importBtn.disabled = true;
    importBtn.textContent = 'Importing...';
    const status = document.getElementById('import-status');
    try {
      const res = await api.post('/api/admin/events/sync', {});
      if (res && res.success) {
        if (status) status.textContent = 'Import successful!';
        showToast('Events imported!', 'success');
      } else {
        if (status) status.textContent = res?.error || 'Import failed.';
        showToast('Import failed.', 'error');
      }
    } catch (err) {
      if (status) status.textContent = 'Error importing events.';
      showToast('Error importing events.', 'error');
    } finally {
      importBtn.disabled = false;
      importBtn.textContent = 'Import Events';
    }
  });
}

// End of file