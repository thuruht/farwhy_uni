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

    // Now check authentication and show the appropriate screen
    const sessionToken = getCookie('sessionToken');
    
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
    
    console.log('Setting up dashboard styles...');
    setupDashboardStyles();
    
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
    const overlay = document.getElementById('sidebar-overlay');

    console.log('Mobile menu elements:', mobileToggle, sidebar, overlay);

    if (mobileToggle && sidebar) {
        // Add better click handling for mobile
        const toggleMobileMenu = (e) => {
            console.log('Mobile menu toggle clicked');
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.toggle('open');
            
            // Toggle overlay
            if (overlay) {
                overlay.classList.toggle('active');
            }
            
            console.log('Sidebar classes after toggle:', sidebar.classList);
        };

        // Use both click and touchend events for better mobile response
        mobileToggle.addEventListener('click', toggleMobileMenu);
        mobileToggle.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleMobileMenu(e);
        });

        // Add overlay click handler
        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
            
            overlay.addEventListener('touchend', (e) => {
                e.preventDefault();
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Close sidebar when clicking outside of it
        document.addEventListener('click', (e) => {
            if (sidebar &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !mobileToggle.contains(e.target)) {
                sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            }
        });
        
        // Close sidebar when a nav item is clicked
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        sidebar.classList.remove('open');
                        if (overlay) overlay.classList.remove('active');
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

function renderEvents(events, setupFilters = true) {
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    if (!Array.isArray(events) || events.length === 0) {
        eventList.innerHTML = `<div class='status-message status-info'>No events found.</div>`;
        return;
    }
    
    eventList.innerHTML = `<table class="admin-table">
        <thead>
            <tr>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
                <th>&nbsp;</th>
            </tr>
        </thead>
        <tbody>` +
        events.map(ev => {
            // Calculate if event is past or upcoming
            const eventDate = new Date(ev.date);
            const today = new Date();
            
            // Only consider an event as "past" after the day is completely over (midnight)
            // This ensures events happening today are still shown as "upcoming"
            const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const eventDateWithoutTime = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            const isPast = eventDateWithoutTime < todayWithoutTime;
            
            const statusClass = isPast ? 'event-past' : 'event-upcoming';
            const statusText = isPast ? 'Past' : 'Upcoming';
            
            return `<tr class="event-row venue-${ev.venue || 'unknown'}">
                <td class="thumbnail-cell" style="width: 80px; vertical-align: middle; text-align: center;">
                    ${ev.flyer_image_url || ev.imageUrl ? 
                      `<div class="thumbnail"><img src="${ev.flyer_image_url || ev.imageUrl}" alt="${ev.title || 'Event'} flyer" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>` : 
                      `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`}
                </td>
                <td style="vertical-align: middle;">
                    <strong>${ev.title || 'Untitled'}</strong>
                    ${ev.ticketLink ? `<div class="ticket-info"><a href="${ev.ticketLink}" target="_blank" class="ticket-link">🎟️ Tickets</a></div>` : ''}
                </td>
                <td style="vertical-align: middle;">${formatDate(ev.date)}</td>
                <td style="vertical-align: middle;"><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>
                <td style="vertical-align: middle;"><span class="status-tag ${statusClass}">${statusText}</span></td>
                <td class='admin-table-actions' style="vertical-align: middle;">
                    <button class="edit-event-btn" data-id="${ev.id}">Edit</button>
                    <button class="delete-event-btn" data-id="${ev.id}">Delete</button>
                </td>
            </tr>`;
        }).join('') + `</tbody></table>`;
    
    // Add event listeners to the newly created buttons
    eventList.querySelectorAll('.edit-event-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            console.log('Edit event button clicked for id:', id);
            editEvent(id);
        });
    });
    
    eventList.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            console.log('Delete event button clicked for id:', id);
            deleteEvent(id);
        });
    });
    
    if (setupFilters) {
        setupEventFilters();
    }
}

async function loadBlogPosts() {
    const result = await api.get('/api/admin/blog/posts');
    if (result && result.data) {
        dashboardState.blogPosts = result.data;
        renderBlogPosts(result.data, true);

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

function renderBlogPosts(posts, setupFilters = true) {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;
    if (!posts || posts.length === 0) {
        blogList.innerHTML = `<div class='status-message status-info'>No blog posts.</div>`;
        return;
    }
    
    blogList.innerHTML = `<table class="admin-table">
        <thead>
            <tr>
                <th style="width: 80px; text-align: center;">Image</th>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>` +
        posts.map(post => {
            // Calculate if post is recent (within last 7 days)
            const postDate = new Date(post.date || post.created_at || new Date());
            const today = new Date();
            const daysDiff = Math.floor((today - postDate) / (1000 * 60 * 60 * 24));
            const isRecent = daysDiff <= 7;
            const statusClass = isRecent ? 'post-recent' : 'post-older';
            const statusText = isRecent ? 'Recent' : 'Older';
            
            return `<tr class="blog-row">
                <td class="thumbnail-cell" style="width: 80px; vertical-align: middle; text-align: center;">
                    ${post.image_url ? 
                        `<div class="thumbnail"><img src="${post.image_url}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>` : 
                        `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`}
                </td>
                <td style="vertical-align: middle;">
                    <strong>${post.title}</strong>
                    ${post.featured ? `<div class="featured-indicator">⭐ Featured</div>` : ''}
                </td>
                <td style="vertical-align: middle;">${formatDate(post.date || post.created_at)}</td>
                <td style="vertical-align: middle;"><span class="status-tag ${statusClass}">${statusText}</span></td>
                <td class='admin-table-actions' style="vertical-align: middle;">
                    <button class="edit-blog-btn" data-id="${post.id}">Edit</button>
                    <button class="delete-blog-btn" data-id="${post.id}">Delete</button>
                </td>
            </tr>`;
        }).join('') + `</tbody></table>`;
    
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
    
    if (setupFilters) {
        setupBlogFilters();
    }
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
                console.log('Flyer upload response:', result);
                
                if (result.success) {
                    // Get the image URL from the response (check for both imageUrl and url fields)
                    let uploadedUrl = result.imageUrl || result.url || '';
                    console.log('Raw URL from server:', uploadedUrl);
                    
                    // Ensure it's a full URL (add origin if it's a relative path)
                    if (uploadedUrl && !uploadedUrl.startsWith('http')) {
                        uploadedUrl = `${window.location.origin}${uploadedUrl.startsWith('/') ? '' : '/'}${uploadedUrl}`;
                    }
                    
                    console.log('Processed URL for form:', uploadedUrl);
                    
                    // Update the form field
                    const flyerUrlInput = document.querySelector('input[name="flyer_image_url"]');
                    if (flyerUrlInput) {
                        flyerUrlInput.value = uploadedUrl;
                        console.log('Form field updated with URL:', uploadedUrl);
                    } else {
                        console.error('Could not find flyer_image_url input field');
                    }
                    
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
            console.log('Event form data (before processing):', data);
            
            // Convert full URLs to relative paths for the backend
            if (data.flyer_image_url && data.flyer_image_url.startsWith(window.location.origin)) {
                // Remove the origin from the URL, leaving only the path
                data.flyer_image_url = data.flyer_image_url.replace(window.location.origin, '');
                console.log('Processed flyer URL for backend:', data.flyer_image_url);
            }
            
            console.log('Event form data (after processing):', data);
            
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

function renderBlogPosts(posts, setupFilters = true) {
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;
    if (!posts || posts.length === 0) {
        blogList.innerHTML = `<div class='status-message status-info'>No blog posts.</div>`;
        return;
    }
    
    blogList.innerHTML = `<table class="admin-table">
        <thead>
            <tr>
                <th style="width: 80px; text-align: center;">Image</th>
                <th>Title</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>` +
        posts.map(post => {
            // Calculate if post is recent (within last 7 days)
            const postDate = new Date(post.date || post.created_at || new Date());
            const today = new Date();
            const daysDiff = Math.floor((today - postDate) / (1000 * 60 * 60 * 24));
            const isRecent = daysDiff <= 7;
            const statusClass = isRecent ? 'post-recent' : 'post-older';
            const statusText = isRecent ? 'Recent' : 'Older';
            
            return `<tr class="blog-row">
                <td class="thumbnail-cell" style="width: 80px; vertical-align: middle; text-align: center;">
                    ${post.image_url ? 
                        `<div class="thumbnail"><img src="${post.image_url}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>` : 
                        `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`}
                </td>
                <td style="vertical-align: middle;">
                    <strong>${post.title}</strong>
                    ${post.featured ? `<div class="featured-indicator">⭐ Featured</div>` : ''}
                </td>
                <td style="vertical-align: middle;">${formatDate(post.date || post.created_at)}</td>
                <td style="vertical-align: middle;"><span class="status-tag ${statusClass}">${statusText}</span></td>
                <td class='admin-table-actions' style="vertical-align: middle;">
                    <button class="edit-blog-btn" data-id="${post.id}">Edit</button>
                    <button class="delete-blog-btn" data-id="${post.id}">Delete</button>
                </td>
            </tr>`;
        }).join('') + `</tbody></table>`;
    
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

// Only add the styles once when the dashboard is initialized
function setupDashboardStyles() {
    console.log('Setting up dashboard styles...');
    if (!document.getElementById('admin-table-styles')) {
        const tableStyles = document.createElement('style');
        tableStyles.id = 'admin-table-styles';
        tableStyles.textContent = `
            .admin-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 1rem;
                font-size: 14px;
            }
            
            .admin-table thead th {
                text-align: left;
                padding: 12px 8px;
                background-color: #f5f5f5;
                border-bottom: 2px solid #ddd;
                font-weight: bold;
                color: #333;
            }
            
            .admin-table tbody td {
                padding: 10px 8px;
                border-bottom: 1px solid #eee;
                vertical-align: middle;
            }
            
            .event-list-thumbnail, .thumbnail {
                display: inline-block;
                width: 70px;
                height: 70px;
                border-radius: 4px;
                overflow: hidden;
                background-color: #f0f0f0;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #ddd;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .event-list-thumbnail img, .thumbnail img {
                max-width: 100%;
                max-height: 100%;
                object-fit: cover;
            }
            
            .admin-table-actions {
                white-space: nowrap;
            }
            
            .admin-table-actions button {
                margin-right: 5px;
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid #ddd;
                background-color: #f5f5f5;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .admin-table-actions button:hover {
                background-color: #e0e0e0;
            }
            
            .admin-table-actions button.edit-event-btn, 
            .admin-table-actions button.edit-blog-btn {
                background-color: #e7f5ff;
                border-color: #90c8f2;
                color: #0066cc;
            }
            
            .admin-table-actions button.edit-event-btn:hover, 
            .admin-table-actions button.edit-blog-btn:hover {
                background-color: #d0e8ff;
            }
            
            .admin-table-actions button.delete-event-btn, 
            .admin-table-actions button.delete-blog-btn {
                background-color: #fff2f2;
                border-color: #ffb8b8;
                color: #cc0000;
            }
            
            .admin-table-actions button.delete-event-btn:hover, 
            .admin-table-actions button.delete-blog-btn:hover {
                background-color: #ffe0e0;
            }
            
            .event-divider, .blog-divider {
                display: none;
            }
            
            .empty-thumbnail, .no-image {
                background-color: #eee;
                color: #999;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                width: 100%;
                border-radius: 4px;
            }
            
            .venue-tag {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .venue-farewell {
                background-color: #f8e9b0;
                color: #8a6d3b;
            }
            
            .venue-howdy {
                background-color: #d4edda;
                color: #155724;
            }
            
            .thumbnail-cell {
                text-align: center;
            }
            
            .status-tag {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .event-past {
                background-color: #f2f2f2;
                color: #666;
            }
            
            .event-upcoming {
                background-color: #e0f7fa;
                color: #006064;
            }
            
            .post-recent {
                background-color: #e8f5e9;
                color: #2e7d32;
            }
            
            .post-older {
                background-color: #f5f5f5;
                color: #616161;
            }
            
            .featured-indicator {
                margin-top: 4px;
                font-size: 12px;
                color: #ff6d00;
            }
            
            .ticket-info {
                margin-top: 4px;
                font-size: 12px;
            }
            
            .ticket-link {
                color: #0066cc;
                text-decoration: none;
            }
            
            .ticket-link:hover {
                text-decoration: underline;
            }
            
            .event-row:hover, .blog-row:hover, .admin-table tbody tr:hover {
                background-color: #f9f9f9;
            }
        `;
        document.head.appendChild(tableStyles);
        console.log('Added table styles to document head');
    }
}

// Event Filters Implementation
function setupEventFilters() {
    console.log('Setting up event filters');
    const eventList = document.getElementById('event-list');
    if (!eventList) return;
    
    // Add filter controls if they don't exist yet
    if (!document.getElementById('event-filters')) {
        const filtersContainer = document.createElement('div');
        filtersContainer.id = 'event-filters';
        filtersContainer.className = 'filters-container';
        filtersContainer.innerHTML = `
            <div class="filter-group">
                <button class="filter-btn active" data-filter="all">All Events</button>
                <button class="filter-btn" data-filter="upcoming">Upcoming</button>
                <button class="filter-btn" data-filter="past">Past</button>
            </div>
            <div class="filter-group">
                <button class="filter-btn" data-filter="farewell">Farewell Only</button>
                <button class="filter-btn" data-filter="howdy">Howdy Only</button>
            </div>
        `;
        
        eventList.parentNode.insertBefore(filtersContainer, eventList);
        
        // Add event listeners to filter buttons
        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active state on buttons in the same group
                const group = btn.closest('.filter-group');
                group.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filters
                applyEventFilters();
            });
        });
    }
    
    // Initial filter application
    applyEventFilters();
}

function applyEventFilters() {
    // Get active filters
    const venueFilterBtn = document.querySelector('.filter-group:nth-child(2) .filter-btn.active');
    const statusFilterBtn = document.querySelector('.filter-group:nth-child(1) .filter-btn.active');
    
    const venueFilter = venueFilterBtn ? venueFilterBtn.getAttribute('data-filter') : 'all';
    const statusFilter = statusFilterBtn ? statusFilterBtn.getAttribute('data-filter') : 'all';
    
    console.log(`Applying filters: venue=${venueFilter}, status=${statusFilter}`);
    
    // Apply filters to rows
    const rows = document.querySelectorAll('.event-row');
    rows.forEach(row => {
        let showRow = true;
        
        // Apply venue filter
        if (venueFilter !== 'all') {
            if (!row.classList.contains(`venue-${venueFilter}`)) {
                showRow = false;
            }
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            const statusTag = row.querySelector('.status-tag');
            if (statusTag) {
                if (statusFilter === 'upcoming' && !statusTag.classList.contains('event-upcoming')) {
                    showRow = false;
                } else if (statusFilter === 'past' && !statusTag.classList.contains('event-past')) {
                    showRow = false;
                }
            }
        }
        
        // Show or hide the row
        row.style.display = showRow ? '' : 'none';
    });
    
    // Update counter
    const visibleRows = document.querySelectorAll('.event-row[style=""]').length;
    console.log(`${visibleRows} events visible after filtering`);
}

// Blog Filters Implementation
function setupBlogFilters() {
    console.log('Setting up blog filters');
    const blogList = document.getElementById('blog-list');
    if (!blogList) return;
    
    // Add filter controls if they don't exist yet
    if (!document.getElementById('blog-filters')) {
        const filtersContainer = document.createElement('div');
        filtersContainer.id = 'blog-filters';
        filtersContainer.className = 'filters-container';
        filtersContainer.innerHTML = `
            <div class="filter-group">
                <button class="filter-btn active" data-filter="all">All Posts</button>
                <button class="filter-btn" data-filter="recent">Recent</button>
                <button class="filter-btn" data-filter="featured">Featured</button>
            </div>
        `;
        
        blogList.parentNode.insertBefore(filtersContainer, blogList);
        
        // Add event listeners to filter buttons
        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Toggle active state on buttons
                filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filters
                applyBlogFilters();
            });
        });
    }
    
    // Initial filter application
    applyBlogFilters();
}

function applyBlogFilters() {
    // Get active filter
    const filterBtn = document.querySelector('#blog-filters .filter-btn.active');
    const filter = filterBtn ? filterBtn.getAttribute('data-filter') : 'all';
    
    console.log(`Applying blog filter: ${filter}`);
    
    // Apply filter to rows
    const rows = document.querySelectorAll('.blog-row');
    rows.forEach(row => {
        let showRow = true;
        
        if (filter === 'recent') {
            const statusTag = row.querySelector('.status-tag');
            if (statusTag && !statusTag.classList.contains('post-recent')) {
                showRow = false;
            }
        } else if (filter === 'featured') {
            const featuredIndicator = row.querySelector('.featured-indicator');
            if (!featuredIndicator) {
                showRow = false;
            }
        }
        
        // Show or hide the row
        row.style.display = showRow ? '' : 'none';
    });
    
    // Update counter
    const visibleRows = document.querySelectorAll('.blog-row[style=""]').length;
    console.log(`${visibleRows} blog posts visible after filtering`);
}

// Venue Settings Implementation
function loadVenueSettings() {
    console.log('Loading venue settings');
    
    const venueSection = document.getElementById('section-venue');
    if (!venueSection) {
        console.error('Venue section not found');
        return;
    }
    
    // Check if venue settings already loaded
    if (venueSection.querySelector('.venue-settings-container')) {
        console.log('Venue settings already loaded');
        return;
    }
    
    // Add venue settings UI
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'venue-settings-container';
    settingsContainer.innerHTML = `
        <div class="venue-tabs">
            <button class="tab-btn active" data-venue="farewell">Farewell Settings</button>
            <button class="tab-btn" data-venue="howdy">Howdy Settings</button>
        </div>
        
        <div class="venue-tab-content active" id="farewell-settings">
            <h3>Farewell Café Settings</h3>
            <div class="settings-form">
                <div class="form-group">
                    <label>Venue Name</label>
                    <input type="text" id="farewell-name" value="Farewell Café">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" id="farewell-address" value="909 S 5th Ave, Tucson, AZ 85701">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="farewell-phone" value="(520) 448-4009">
                </div>
                <div class="form-group">
                    <label>Hours</label>
                    <textarea id="farewell-hours" rows="5">Monday-Friday: 7am-11pm
Saturday-Sunday: 8am-11pm</textarea>
                </div>
                <div class="form-group">
                    <label>Default Age Restriction</label>
                    <input type="text" id="farewell-age" value="21+ unless with parent or legal guardian">
                </div>
                <div class="form-actions">
                    <button id="save-farewell-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </div>
        
        <div class="venue-tab-content" id="howdy-settings">
            <h3>Howdy Settings</h3>
            <div class="settings-form">
                <div class="form-group">
                    <label>Venue Name</label>
                    <input type="text" id="howdy-name" value="Howdy">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" id="howdy-address" value="911 S 5th Ave, Tucson, AZ 85701">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="howdy-phone" value="(520) 448-4009">
                </div>
                <div class="form-group">
                    <label>Hours</label>
                    <textarea id="howdy-hours" rows="5">Wednesday-Saturday: 5pm-9pm
Closed Sunday-Tuesday</textarea>
                </div>
                <div class="form-group">
                    <label>Default Age Restriction</label>
                    <input type="text" id="howdy-age" value="All ages">
                </div>
                <div class="form-actions">
                    <button id="save-howdy-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </div>
        
        <div class="venue-food-menu-section">
            <h3>Menu Management</h3>
            <div class="menu-controls">
                <button id="add-menu-btn" class="btn btn-secondary">Add Menu Item</button>
                <button id="reorder-menu-btn" class="btn btn-secondary">Reorder Menu</button>
            </div>
            <div id="menu-list" class="menu-list">
                <div class="status-message status-info">Select a venue tab to view menu items.</div>
            </div>
        </div>
    `;
    
    venueSection.appendChild(settingsContainer);
    
    // Add event listeners for tab switching
    settingsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab button
            settingsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding tab content
            const venue = btn.getAttribute('data-venue');
            settingsContainer.querySelectorAll('.venue-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${venue}-settings`).classList.add('active');
            
            // Update dashboardState
            dashboardState.currentVenue = venue;
            
            // Load menu for selected venue
            loadVenueMenu(venue);
        });
    });
    
    // Add handlers for save buttons
    document.getElementById('save-farewell-btn').addEventListener('click', () => saveVenueSettings('farewell'));
    document.getElementById('save-howdy-btn').addEventListener('click', () => saveVenueSettings('howdy'));
    
    // Add handlers for menu buttons
    document.getElementById('add-menu-btn').addEventListener('click', () => showMenuItemForm());
    document.getElementById('reorder-menu-btn').addEventListener('click', () => toggleMenuReordering());
    
    // Load initial menu for the active venue
    loadVenueMenu(dashboardState.currentVenue);
}

function loadVenueMenu(venue) {
    console.log(`Loading menu for ${venue}`);
    const menuList = document.getElementById('menu-list');
    if (!menuList) return;
    
    // Load real menu data from the API
    fetchVenueMenu(venue).then(menuItems => {
        renderMenuItems(menuList, menuItems, venue);
    }).catch(error => {
        console.error(`Error loading menu for ${venue}:`, error);
        menuList.innerHTML = `<div class="status-message status-error">Error loading menu. Please try again.</div>`;
    });
}

// Function to fetch menu data from API or fallback to static data
async function fetchVenueMenu(venue) {
    try {
        // Try to get menu from API
        const response = await api.get(`/api/admin/venues/${venue}/menu`);
        if (response && response.success && response.data && response.data.length > 0) {
            return response.data;
        }
        
        // Fallback to static menu data if API fails or returns empty
        return getStaticMenuData(venue);
    } catch (error) {
        console.warn('API fetch failed, using static menu data:', error);
        return getStaticMenuData(venue);
    }
}

// Function to get static menu data based on actual menu content
function getStaticMenuData(venue) {
    if (venue === 'farewell') {
        // This matches the actual Farewell menu from the static HTML
        return [
            // Cocktails section
            { id: 'c1', name: 'STRAY DOG', price: '$9', category: 'Cocktails', description: 'Tito\'s vodka, kahlua, non-dairy milk.' },
            { id: 'c2', name: 'CRANSYLVANIA', price: '$9', category: 'Cocktails', description: 'Old grandad bourbon, cranberry juice, lemon juice, maple syrup, sparkling water.' },
            { id: 'c3', name: 'RYE & GOSLING', price: '$7', category: 'Cocktails', description: 'Roulette rye, lime juice, ginger beer, aromatic bitters.' },
            { id: 'c4', name: 'LEAKY ROOF', price: '$9', category: 'Cocktails', description: 'Farewell\'s mystery liquor concoction, triple sec, sweet n\' sour, cola.' },
            { id: 'c5', name: 'YUPPIE SPEEDBALL', price: '$9', category: 'Cocktails', description: 'Jose cuervo blanco tequila, revel berry yerba mate, pear liquor, grenadine.' },
            { id: 'c6', name: 'WELL SHOT', price: '$4', category: 'Cocktails', description: '' },
            { id: 'c7', name: 'WELL MIX', price: '$5', category: 'Cocktails', description: '' },
            
            // Domestics section
            { id: 'b1', name: 'Hamm\'s', price: '$3', category: 'Domestics', description: '' },
            { id: 'b2', name: 'PBR', price: '$5', category: 'Domestics', description: '' },
            { id: 'b3', name: 'Rolling Rock', price: '$4', category: 'Domestics', description: '' },
            { id: 'b4', name: 'Miller Lite', price: '$5', category: 'Domestics', description: '' },
            { id: 'b5', name: 'Bud Light', price: '$6', category: 'Domestics', description: '' },
            { id: 'b6', name: 'Bud Heavy', price: '$6', category: 'Domestics', description: '' },
            { id: 'b7', name: 'Coors Banquet', price: '$5', category: 'Domestics', description: '' },
            { id: 'b8', name: 'Michelob', price: '$6', category: 'Domestics', description: '' },
            { id: 'b9', name: 'Yeungling', price: '$5', category: 'Domestics', description: '' },
            { id: 'b10', name: 'Twisted Tea', price: '$5', category: 'Domestics', description: '' },
            
            // Boulevard section
            { id: 'blvd1', name: 'Wheat', price: '$5', category: 'Boulevard', description: '' },
            { id: 'blvd2', name: 'Pale Ale', price: '$5', category: 'Boulevard', description: '' },
            { id: 'blvd3', name: 'Tank 7', price: '$7', category: 'Boulevard', description: '' },
            { id: 'blvd4', name: 'Space Camper', price: '$5', category: 'Boulevard', description: '' },
            { id: 'blvd5', name: 'Quirk', price: '$6', category: 'Boulevard', description: '' },
            
            // Seasonal section
            { id: 's1', name: 'TL Monk & Honey', price: '$6', category: 'Seasonal', description: '' },
            { id: 's2', name: 'Mother\'s Coffee Stout', price: '$5', category: 'Seasonal', description: '' },
            
            // Craft/Import section
            { id: 'ci1', name: 'Modelo', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci2', name: 'Victoria', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci3', name: 'Guinness', price: '$6', category: 'Craft/Import', description: '' },
            { id: 'ci4', name: 'Stella', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci5', name: 'Blue Moon', price: '$6', category: 'Craft/Import', description: '' },
            { id: 'ci6', name: 'Founder\'s IPA', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci7', name: 'Lagunita\'s IPA', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci8', name: 'Sea Quench Sour', price: '$6', category: 'Craft/Import', description: '' },
            { id: 'ci9', name: 'Angry Orchard', price: '$5', category: 'Craft/Import', description: '' },
            { id: 'ci10', name: 'Blake\'s Ciders', price: '$7', category: 'Craft/Import', description: '' },
            { id: 'ci11', name: 'Stiegl Radler', price: '$8', category: 'Craft/Import', description: '' },
            
            // Booze-Free section
            { id: 'bf1', name: 'Athletics', price: '$5', category: 'Booze-Free', description: '' },
            { id: 'bf2', name: 'Coors Edge N/A', price: '$4', category: 'Booze-Free', description: '' },
            { id: 'bf3', name: 'Red Bull', price: '$5', category: 'Booze-Free', description: '' },
            { id: 'bf4', name: 'AriZona Iced Tea', price: '$2.50', category: 'Booze-Free', description: '' },
            { id: 'bf5', name: 'Yerba Mate', price: '$5', category: 'Booze-Free', description: '' },
            { id: 'bf6', name: 'Waterloo', price: '$2', category: 'Booze-Free', description: '' },
            { id: 'bf7', name: 'Coke', price: '$2', category: 'Booze-Free', description: '' },
            { id: 'bf8', name: 'Diet Coke', price: '$2', category: 'Booze-Free', description: '' },
            { id: 'bf9', name: 'Sprite', price: '$2', category: 'Booze-Free', description: '' },
            { id: 'bf10', name: 'Ginger Ale', price: '$2', category: 'Booze-Free', description: '' },
            { id: 'bf11', name: 'Casamara', price: '$6', category: 'Booze-Free', description: '' }
        ];
    } else {
        // Howdy menu items
        return [
            { id: 'h1', name: 'Nachos', price: '$8.95', category: 'Appetizers', description: 'Tortilla chips, queso, jalapeños, sour cream, and salsa.' },
            { id: 'h2', name: 'Quesadilla', price: '$9.95', category: 'Appetizers', description: 'Flour tortilla, cheese, peppers, and onions. Served with salsa and sour cream.' },
            { id: 'h3', name: 'Chips & Salsa', price: '$6.95', category: 'Appetizers', description: 'House-made tortilla chips with fresh salsa.' },
            { id: 'h4', name: 'Pretzel Bites', price: '$7.95', category: 'Appetizers', description: 'Warm pretzel bites served with cheese sauce.' },
            
            // Non-alcoholic drinks
            { id: 'hd1', name: 'Fountain Soda', price: '$2.50', category: 'Drinks', description: 'Coke, Diet Coke, Sprite, Dr. Pepper' },
            { id: 'hd2', name: 'Iced Tea', price: '$2.50', category: 'Drinks', description: 'Sweetened or unsweetened' },
            { id: 'hd3', name: 'Lemonade', price: '$3.00', category: 'Drinks', description: 'Fresh-squeezed' },
            { id: 'hd4', name: 'Hot Chocolate', price: '$3.50', category: 'Drinks', description: 'With whipped cream' },
            { id: 'hd5', name: 'Coffee', price: '$2.50', category: 'Drinks', description: 'Regular or decaf' }
        ];
    }
    
// Function to render menu items in the admin dashboard
function renderMenuItems(menuList, menuItems, venue) {
    if (!menuList) return;
    
    if (menuItems.length === 0) {
        menuList.innerHTML = `<div class="status-message status-info">No menu items found for ${venue}.</div>`;
        return;
    }
    
    menuList.innerHTML = `<table class="admin-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>` +
        menuItems.map(item => `
            <tr class="menu-item" data-id="${item.id}">
                <td>${item.name}</td>
                <td>${item.price}</td>
                <td>${item.category}</td>
                <td class="admin-table-actions">
                    <button class="edit-menu-btn" data-id="${item.id}">Edit</button>
                    <button class="delete-menu-btn" data-id="${item.id}">Delete</button>
                </td>
            </tr>
        `).join('') + 
        `</tbody>
    </table>`;
    
    // Add event listeners to buttons
    menuList.querySelectorAll('.edit-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editMenuItem(id);
        });
    });
    
    menuList.querySelectorAll('.delete-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteMenuItem(id);
        });
    });
}
}

function saveVenueSettings(venue) {
    console.log(`Saving settings for ${venue}`);
    
    // Get form values
    const name = document.getElementById(`${venue}-name`).value;
    const address = document.getElementById(`${venue}-address`).value;
    const phone = document.getElementById(`${venue}-phone`).value;
    const hours = document.getElementById(`${venue}-hours`).value;
    const ageRestriction = document.getElementById(`${venue}-age`).value;
    
    // Save to API
    const data = { name, address, phone, hours, ageRestriction };
    
    try {
        api.post(`/api/admin/venues/${venue}`, data)
            .then(response => {
                showToast(`${venue.charAt(0).toUpperCase() + venue.slice(1)} settings saved!`, 'success');
            })
            .catch(error => {
                console.error('Error saving venue settings:', error);
                showToast('Error saving settings. Please try again.', 'error');
            });
    } catch (error) {
        console.error('Error saving venue settings:', error);
        showToast('Error saving settings. Please try again.', 'error');
    }
}

function showMenuItemForm(id = null) {
    console.log(`Showing menu item form for id: ${id}`);
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    
    if (!modal || !modalBody) return;
    
    // Get item data if editing
    let item = null;
    if (id) {
        // Find the item from the current menu items
        const venue = dashboardState.currentVenue;
        const menuItems = getStaticMenuData(venue);
        item = menuItems.find(item => item.id === id);
    }
    
    modal.classList.add('active');
    modalBody.innerHTML = `
        <div class="admin-form">
            <h3>${id ? 'Edit' : 'Add'} Menu Item</h3>
            <form id="menu-item-form">
                <input type="hidden" name="id" value="${id || ''}">
                <input type="hidden" name="venue" value="${dashboardState.currentVenue}">
                <div class="form-group">
                    <label>Name *</label>
                    <input type="text" name="name" required value="${item ? item.name : ''}">
                </div>
                <div class="form-group">
                    <label>Price *</label>
                    <input type="text" name="price" required value="${item ? item.price : ''}">
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select name="category" required>
                        <option value="Cocktails" ${item && item.category === 'Cocktails' ? 'selected' : ''}>Cocktails</option>
                        <option value="Domestics" ${item && item.category === 'Domestics' ? 'selected' : ''}>Domestics</option>
                        <option value="Boulevard" ${item && item.category === 'Boulevard' ? 'selected' : ''}>Boulevard</option>
                        <option value="Seasonal" ${item && item.category === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
                        <option value="Craft/Import" ${item && item.category === 'Craft/Import' ? 'selected' : ''}>Craft/Import</option>
                        <option value="Booze-Free" ${item && item.category === 'Booze-Free' ? 'selected' : ''}>Booze-Free</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="3">${item ? item.description : ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${id ? 'Update' : 'Add'} Item</button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('menu-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            // Get form data
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Determine if this is an add or update
            const isUpdate = !!data.id;
            
            // Call API to save the menu item
            let response;
            if (isUpdate) {
                response = await api.put(`/api/admin/menu-items/${data.id}`, data);
            } else {
                response = await api.post(`/api/admin/venues/${data.venue}/menu-items`, data);
            }
            
            if (response && response.success) {
                showToast(`Menu item ${isUpdate ? 'updated' : 'added'} successfully!`, 'success');
                modal.classList.remove('active');
                loadVenueMenu(dashboardState.currentVenue);
            } else {
                showToast('Error saving menu item. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error saving menu item:', error);
            showToast('Error saving menu item. Please try again.', 'error');
        }
    });
}

function editMenuItem(id) {
    showMenuItemForm(id);
}

function deleteMenuItem(id) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        try {
            // Call API to delete the menu item
            api.delete(`/api/admin/menu-items/${id}`)
                .then(response => {
                    if (response && response.success) {
                        showToast('Menu item deleted successfully.', 'success');
                        loadVenueMenu(dashboardState.currentVenue);
                    } else {
                        showToast('Error deleting menu item. Please try again.', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error deleting menu item:', error);
                    showToast('Error deleting menu item. Please try again.', 'error');
                });
        } catch (error) {
            console.error('Error deleting menu item:', error);
            showToast('Error deleting menu item. Please try again.', 'error');
        }
    }
}

function toggleMenuReordering() {
    const menuList = document.getElementById('menu-list');
    const isReordering = menuList.classList.toggle('reordering');
    
    if (isReordering) {
        // Set up drag and drop
        console.log('Enabling menu reordering');
        document.getElementById('reorder-menu-btn').textContent = 'Save Order';
        showToast('Drag items to reorder, then click Save Order', 'info');
    } else {
        // Save the new order
        console.log('Saving menu order');
        document.getElementById('reorder-menu-btn').textContent = 'Reorder Menu';
        showToast('Menu order saved!', 'success');
    }
}

// Import Handlers Implementation
function setupImportHandlers() {
    console.log('Setting up import handlers');
    
    const importSection = document.getElementById('section-import');
    if (!importSection) {
        console.error('Import section not found');
        return;
    }
    
    // Check if import UI already loaded
    if (importSection.querySelector('.import-container')) {
        console.log('Import UI already loaded');
        return;
    }
    
    // Add import UI
    const importContainer = document.createElement('div');
    importContainer.className = 'import-container';
    importContainer.innerHTML = `
        <div class="import-card">
            <h3>Import Legacy Events</h3>
            <p>Import events from the legacy system. This will merge data with existing events based on dates and titles.</p>
            <button id="import-legacy-btn" class="btn btn-primary">Import Legacy Events</button>
            <div id="import-legacy-status" class="import-status"></div>
        </div>
        
        <div class="import-card">
            <h3>Import Blog Posts</h3>
            <p>Import blog posts from WordPress export. This will not overwrite existing posts.</p>
            <div class="file-upload-group">
                <input type="file" id="blog-import-file" style="display:none;" accept=".xml,.json">
                <button id="import-blog-btn" class="btn btn-secondary">Select WordPress Export</button>
            </div>
            <div id="import-blog-status" class="import-status"></div>
        </div>
        
        <div class="import-card">
            <h3>Sync with External Calendar</h3>
            <p>Pull events from external calendar services (Google Calendar, iCal).</p>
            <input type="text" id="calendar-url" placeholder="Calendar URL (ics or Google Calendar ID)">
            <button id="sync-calendar-btn" class="btn btn-secondary">Sync Calendar</button>
            <div id="sync-calendar-status" class="import-status"></div>
        </div>
    `;
    
    importSection.appendChild(importContainer);
    
    // Add event listeners
    document.getElementById('import-legacy-btn').addEventListener('click', importLegacyEvents);
    document.getElementById('import-blog-btn').addEventListener('click', () => {
        document.getElementById('blog-import-file').click();
    });
    document.getElementById('blog-import-file').addEventListener('change', importBlogPosts);
    document.getElementById('sync-calendar-btn').addEventListener('click', syncExternalCalendar);
}

async function importLegacyEvents() {
    console.log('Importing legacy events');
    const statusEl = document.getElementById('import-legacy-status');
    const importBtn = document.getElementById('import-legacy-btn');
    
    // Update UI to show progress
    statusEl.innerHTML = '<div class="loading-spinner"></div> Importing events...';
    importBtn.disabled = true;
    
    try {
        // Call the API endpoint
        const result = await api.post('/api/admin/events/sync', {});
        
        if (result && result.success) {
            const count = result.count || 0;
            statusEl.innerHTML = `<div class="status-success">✓ Imported ${count} events successfully.</div>`;
            showToast(`${count} events imported successfully!`, 'success');
        } else {
            statusEl.innerHTML = `<div class="status-error">✗ Import failed: ${result?.error || 'Unknown error'}</div>`;
            showToast('Failed to import events.', 'error');
        }
    } catch (error) {
        console.error('Error importing legacy events:', error);
        statusEl.innerHTML = `<div class="status-error">✗ Import failed: ${error.message || 'Network error'}</div>`;
        showToast('Error importing events.', 'error');
    } finally {
        importBtn.disabled = false;
    }
}

async function importBlogPosts(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log(`Importing blog posts from file: ${file.name}`);
    const statusEl = document.getElementById('import-blog-status');
    const importBtn = document.getElementById('import-blog-btn');
    
    // Update UI to show progress
    statusEl.innerHTML = '<div class="loading-spinner"></div> Reading file...';
    importBtn.disabled = true;
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Call the API endpoint
        const response = await api._call('/api/admin/blog/import', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set content-type with boundary
        });
        
        if (response) {
            const result = await response.json();
            
            if (result.success) {
                const count = result.count || 0;
                statusEl.innerHTML = `<div class="status-success">✓ Imported ${count} blog posts successfully.</div>`;
                showToast(`${count} blog posts imported!`, 'success');
            } else {
                statusEl.innerHTML = `<div class="status-error">✗ Import failed: ${result.error || 'Unknown error'}</div>`;
                showToast('Failed to import blog posts.', 'error');
            }
        } else {
            statusEl.innerHTML = `<div class="status-error">✗ Import failed: Network error</div>`;
            showToast('Network error during import.', 'error');
        }
    } catch (error) {
        console.error('Error importing blog posts:', error);
        statusEl.innerHTML = `<div class="status-error">✗ Import failed: ${error.message || 'Unknown error'}</div>`;
        showToast('Error importing blog posts.', 'error');
    } finally {
        importBtn.disabled = false;
        // Reset file input
        e.target.value = '';
    }
}

async function syncExternalCalendar() {
    const calendarUrl = document.getElementById('calendar-url').value.trim();
    if (!calendarUrl) {
        showToast('Please enter a calendar URL.', 'error');
        return;
    }
    
    console.log(`Syncing calendar from URL: ${calendarUrl}`);
    const statusEl = document.getElementById('sync-calendar-status');
    const syncBtn = document.getElementById('sync-calendar-btn');
    
    // Update UI to show progress
    statusEl.innerHTML = '<div class="loading-spinner"></div> Syncing calendar...';
    syncBtn.disabled = true;
    
    try {
        // Call the API endpoint
        const result = await api.post('/api/admin/events/calendar-sync', { calendarUrl });
        
        if (result && result.success) {
            const count = result.count || 0;
            statusEl.innerHTML = `<div class="status-success">✓ Synced ${count} events from calendar.</div>`;
            showToast(`${count} events synced from calendar!`, 'success');
        } else {
            statusEl.innerHTML = `<div class="status-error">✗ Sync failed: ${result?.error || 'Invalid calendar URL'}</div>`;
            showToast('Failed to sync calendar.', 'error');
        }
    } catch (error) {
        console.error('Error syncing calendar:', error);
        statusEl.innerHTML = `<div class="status-error">✗ Sync failed: ${error.message || 'Network error'}</div>`;
        showToast('Error syncing calendar.', 'error');
    } finally {
        syncBtn.disabled = false;
    }
}

// End of file