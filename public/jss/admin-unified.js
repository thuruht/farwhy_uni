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

/**
 * Sets up any dynamic styling needed for the dashboard
 */
function setupDashboardStyles() {
    console.log('Setting up dashboard styles');
    
    // Apply any dynamic styles needed for the dashboard
    // This ensures proper display of dashboard elements across browsers
    
    // Set theme-based styles
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
    }
    
    // Ensure responsive layout
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        // Make sure grid layout is properly applied
        if (window.innerWidth < 768) {
            dashboardContainer.classList.add('mobile-layout');
        } else {
            dashboardContainer.classList.remove('mobile-layout');
        }
    }
    
    // Add table styles if not already present
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
            case 'featured-videos': 
                if (window.featuredVideosManager && typeof window.featuredVideosManager.init === 'function') {
                    window.featuredVideosManager.init();
                } else {
                    console.error('Featured Videos Manager not found');
                }
                break;
            case 'help':
                // No specific loading needed for help section
                setupHelpSectionLinks();
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

function setupEventFilters() {
    console.log('Setting up event filters');
    
    // Get filter elements
    const venueFilter = document.getElementById('event-venue-filter');
    const searchInput = document.getElementById('event-search');
    
    if (!venueFilter || !searchInput) {
        console.error('Event filter elements not found');
        return;
    }
    
    // Filter function to apply both venue and search filters
    const filterEvents = () => {
        const venueValue = venueFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
        
        // Get all event rows
        const eventRows = document.querySelectorAll('#event-list tr.event-row');
        let visibleCount = 0;
        
        eventRows.forEach(row => {
            // Get venue from data attribute
            const venue = row.getAttribute('data-venue')?.toLowerCase() || '';
            // Get searchable content (combine all text content)
            const searchableText = row.textContent.toLowerCase();
            
            // Check if row matches both filters
            const matchesVenue = !venueValue || venue === venueValue;
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            
            // Show/hide based on filter match
            if (matchesVenue && matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update UI to show filter results
        const emptyMessage = document.querySelector('#event-list .empty-message');
        if (visibleCount === 0 && !emptyMessage) {
            // Add message when no events match filters
            const noResults = document.createElement('tr');
            noResults.className = 'empty-message';
            noResults.innerHTML = `<td colspan="5" class="text-center">No events match the current filters</td>`;
            document.querySelector('#event-list tbody').appendChild(noResults);
        } else if (visibleCount > 0 && emptyMessage) {
            // Remove message when events are visible
            emptyMessage.remove();
        }
    };
    
    // Add event listeners
    venueFilter.addEventListener('change', filterEvents);
    searchInput.addEventListener('input', filterEvents);
    
    // Initial filter application
    filterEvents();
}

function setupBlogFilters() {
    console.log('Setting up blog filters');
    
    // Get filter elements
    const statusFilter = document.getElementById('blog-status-filter');
    const searchInput = document.getElementById('blog-search');
    
    if (!statusFilter || !searchInput) {
        console.error('Blog filter elements not found');
        return;
    }
    
    // Filter function to apply both status and search filters
    const filterBlogPosts = () => {
        const statusValue = statusFilter.value.toLowerCase();
        const searchValue = searchInput.value.toLowerCase();
        
        // Get all blog rows
        const blogRows = document.querySelectorAll('#blog-list tr.blog-row');
        let visibleCount = 0;
        
        blogRows.forEach(row => {
            // Get status from classes (featured, published, etc.)
            const isFeatured = row.classList.contains('blog-featured');
            const status = isFeatured ? 'featured' : 'regular';
            // Get searchable content (combine all text content)
            const searchableText = row.textContent.toLowerCase();
            
            // Check if row matches both filters
            const matchesStatus = !statusValue || 
                                 (statusValue === 'all') || 
                                 (statusValue === 'featured' && isFeatured) ||
                                 (statusValue === 'regular' && !isFeatured);
            const matchesSearch = !searchValue || searchableText.includes(searchValue);
            
            // Show/hide based on filter match
            if (matchesStatus && matchesSearch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update UI to show filter results
        const emptyMessage = document.querySelector('#blog-list .empty-message');
        if (visibleCount === 0 && !emptyMessage) {
            // Add message when no blog posts match filters
            const noResults = document.createElement('tr');
            noResults.className = 'empty-message';
            noResults.innerHTML = `<td colspan="4" class="text-center">No blog posts match the current filters</td>`;
            document.querySelector('#blog-list tbody').appendChild(noResults);
        } else if (visibleCount > 0 && emptyMessage) {
            // Remove message when blog posts are visible
            emptyMessage.remove();
        }
    };
    
    // Add event listeners
    statusFilter.addEventListener('change', filterBlogPosts);
    searchInput.addEventListener('input', filterBlogPosts);
    
    // Initial filter application
    filterBlogPosts();
}


// ====================================
// VENUE SETTINGS & MENU MANAGEMENT
// ====================================

async function loadVenueSettings() {
    console.log('Loading venue settings...');
    
    // Get the venue settings container
    const venueSection = document.getElementById('section-venue');
    if (!venueSection) {
        console.error('Venue section not found');
        return;
    }
    
    // Initialize menu management elements
    const addMenuBtn = document.getElementById('add-menu-btn');
    const reorderMenuBtn = document.getElementById('reorder-menu-btn');
    const menuList = document.getElementById('menu-list');
    
    console.log('Menu management elements:', { addMenuBtn, reorderMenuBtn, menuList });
    
    if (!addMenuBtn || !reorderMenuBtn || !menuList) {
        console.error('Menu management elements not found');
        return;
    }
    
    // Clear and show loading state
    menuList.innerHTML = '<div class="loading">Loading menu items...</div>';
    
    try {
        // Load menu items for the current venue (hardcoded to 'farewell' for now)
        const venue = dashboardState.currentVenue || 'farewell';
        const response = await api.get(`/api/admin/venues/${venue}/menu-items`);
        
        console.log('Menu items response:', response);
        
        if (response && response.success && response.data) {
            // Group menu items by category
            const menuItemsByCategory = groupMenuItemsByCategory(response.data);
            
            // Render the menu items by category
            renderMenuItems(menuItemsByCategory, menuList);
        } else {
            menuList.innerHTML = '<div class="empty-state">No menu items found. Click "Add Menu Item" to create one.</div>';
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        menuList.innerHTML = '<div class="error-state">Failed to load menu items. Please try again.</div>';
    }
    
    // Add event listeners to menu management buttons
    addMenuBtn.addEventListener('click', () => {
        console.log('Add menu item button clicked');
        showMenuItemForm();
    });
    
    reorderMenuBtn.addEventListener('click', () => {
        console.log('Reorder menu button clicked');
        toggleMenuReorderMode();
    });
}

// Helper function to group menu items by category
function groupMenuItemsByCategory(menuItems) {
    const grouped = {};
    
    menuItems.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(item);
    });
    
    return grouped;
}

// Render menu items grouped by category
function renderMenuItems(menuItemsByCategory, container) {
    // Clear the container
    container.innerHTML = '';
    
    // Check if we have any menu items
    const categories = Object.keys(menuItemsByCategory);
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state">No menu items found. Click "Add Menu Item" to create one.</div>';
        return;
    }
    
    // Create a section for each category
    categories.sort().forEach(category => {
        const items = menuItemsByCategory[category];
        
        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category';
        
        categorySection.innerHTML = `
            <div class="menu-category-header">
                <h4>${escapeHTML(category)}</h4>
                <span class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="menu-items"></div>
        `;
        
        const menuItemsContainer = categorySection.querySelector('.menu-items');
        
        // Add each menu item to the category section
        items.forEach(item => {
            const menuItemEl = document.createElement('div');
            menuItemEl.className = `menu-item ${item.active ? 'active' : 'inactive'}`;
            menuItemEl.dataset.itemId = item.id;
            
            menuItemEl.innerHTML = `
                <div class="menu-item-details">
                    <div class="menu-item-name">${escapeHTML(item.name)}</div>
                    <div class="menu-item-price">$${parseFloat(item.price || 0).toFixed(2)}</div>
                </div>
                <div class="menu-item-description">${escapeHTML(item.description || '')}</div>
                <div class="menu-item-actions">
                    <button class="btn btn-sm btn-primary edit-menu-item-btn">Edit</button>
                    <button class="btn btn-sm btn-danger delete-menu-item-btn">Delete</button>
                </div>
            `;
            
            // Add event listeners
            menuItemEl.querySelector('.edit-menu-item-btn').addEventListener('click', () => {
                editMenuItem(item);
            });
            
            menuItemEl.querySelector('.delete-menu-item-btn').addEventListener('click', () => {
                deleteMenuItem(item);
            });
            
            menuItemsContainer.appendChild(menuItemEl);
        });
        
        container.appendChild(categorySection);
    });
}

// Helper function to escape HTML to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Show form to add or edit a menu item
function showMenuItemForm(item = null) {
    console.log('Showing menu item form', item);
    
    const isEditing = !!item;
    const modalTitle = isEditing ? 'Edit Menu Item' : 'Add Menu Item';
    
    const formModal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    
    if (!formModal || !modalBody) {
        console.error('Modal elements not found');
        return;
    }
    
    // Set modal title
    formModal.querySelector('.modal-title').textContent = modalTitle;
    
    // Create the form
    modalBody.innerHTML = `
        <form id="menu-item-form">
            <div class="form-group">
                <label for="menu-item-name">Name</label>
                <input type="text" id="menu-item-name" name="name" class="form-control" required value="${item ? escapeHTML(item.name) : ''}">
            </div>
            <div class="form-group">
                <label for="menu-item-category">Category</label>
                <select id="menu-item-category" name="category" class="form-control">
                    <option value="Domestics" ${item && item.category === 'Domestics' ? 'selected' : ''}>Domestics</option>
                    <option value="Boulevard" ${item && item.category === 'Boulevard' ? 'selected' : ''}>Boulevard</option>
                    <option value="Craft/Import" ${item && item.category === 'Craft/Import' ? 'selected' : ''}>Craft/Import</option>
                    <option value="Well" ${item && item.category === 'Well' ? 'selected' : ''}>Well</option>
                    <option value="Single" ${item && item.category === 'Single' ? 'selected' : ''}>Single</option>
                    <option value="Wine" ${item && item.category === 'Wine' ? 'selected' : ''}>Wine</option>
                    <option value="Food" ${item && item.category === 'Food' ? 'selected' : ''}>Food</option>
                    <option value="Specials" ${item && item.category === 'Specials' ? 'selected' : ''}>Specials</option>
                    <option value="Other" ${item && item.category === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="menu-item-description">Description</label>
                <textarea id="menu-item-description" name="description" class="form-control" rows="3">${item ? escapeHTML(item.description || '') : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="menu-item-price">Price</label>
                <input type="number" id="menu-item-price" name="price" class="form-control" step="0.01" min="0" value="${item ? (item.price || 0) : ''}">
            </div>
            <div class="form-group">
                <label for="menu-item-display-order">Display Order</label>
                <input type="number" id="menu-item-display-order" name="display_order" class="form-control" value="${item ? (item.display_order || 0) : 0}">
            </div>
            <div class="form-check">
                <input type="checkbox" id="menu-item-active" name="active" class="form-check-input" ${!item || item.active ? 'checked' : ''}>
                <label class="form-check-label" for="menu-item-active">Active (visible on menu)</label>
            </div>
            
            ${item ? `<input type="hidden" name="id" value="${item.id}">` : ''}
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancel-menu-item-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Add'} Menu Item</button>
            </div>
        </form>
    `;
    
    // Add event listeners
    const form = modalBody.querySelector('#menu-item-form');
    const cancelBtn = modalBody.querySelector('#cancel-menu-item-btn');
    
    cancelBtn.addEventListener('click', () => {
        formModal.classList.remove('active');
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveMenuItem(form, isEditing);
    });
    
    // Show the modal
    formModal.classList.add('active');
}

// Save a menu item (create or update)
async function saveMenuItem(form, isEditing) {
    const formData = new FormData(form);
    const menuItem = {
        name: formData.get('name'),
        category: formData.get('category'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price') || 0),
        display_order: parseInt(formData.get('display_order') || 0, 10),
        active: formData.get('active') === 'on'
    };
    
    console.log('Saving menu item:', menuItem, 'isEditing:', isEditing);
    
    try {
        let response;
        const venue = dashboardState.currentVenue || 'farewell';
        
        if (isEditing) {
            const itemId = formData.get('id');
            response = await api.put(`/api/admin/menu-items/${itemId}`, menuItem);
        } else {
            // For new menu items, we need a menu_id - we'll create one if needed
            // This is a simplification; in a full implementation you'd select from existing menus
            menuItem.menu_id = 1; // Assume the first menu for simplicity
            response = await api.post(`/api/admin/venues/${venue}/menu-items`, menuItem);
        }
        
        console.log('Save menu item response:', response);
        
        if (response && response.success) {
            // Close modal and reload menu items
            document.getElementById('form-modal').classList.remove('active');
            showToast(`Menu item ${isEditing ? 'updated' : 'added'} successfully`, 'success');
            loadVenueSettings();
        } else {
            showToast(`Failed to ${isEditing ? 'update' : 'add'} menu item: ${response ? response.error : 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast(`Error: ${error.message || 'Failed to save menu item'}`, 'error');
    }
}

// Edit a menu item
function editMenuItem(item) {
    console.log('Editing menu item:', item);
    showMenuItemForm(item);
}

// Delete a menu item
async function deleteMenuItem(item) {
    console.log('Deleting menu item:', item);
    
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
        return;
    }
    
    try {
        const response = await api.delete(`/api/admin/menu-items/${item.id}`);
        
        console.log('Delete menu item response:', response);
        
        if (response && response.ok) {
            showToast('Menu item deleted successfully', 'success');
            loadVenueSettings();
        } else {
            showToast(`Failed to delete menu item: ${response ? response.statusText : 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast(`Error: ${error.message || 'Failed to delete menu item'}`, 'error');
    }
}

// Toggle menu reorder mode
function toggleMenuReorderMode() {
    console.log('Toggling menu reorder mode');
    
    const menuList = document.getElementById('menu-list');
    const reorderBtn = document.getElementById('reorder-menu-btn');
    
    if (!menuList || !reorderBtn) {
        console.error('Menu elements not found');
        return;
    }
    
    const isReorderMode = menuList.classList.toggle('reorder-mode');
    
    if (isReorderMode) {
        reorderBtn.textContent = 'Save Order';
        reorderBtn.classList.add('btn-primary');
        reorderBtn.classList.remove('btn-secondary');
        
        // Enable drag and drop functionality
        enableDragAndDrop();
        
        showToast('Reorder mode activated. Drag items to reorder, then click "Save Order"', 'info');
    } else {
        reorderBtn.textContent = 'Reorder Menu';
        reorderBtn.classList.add('btn-secondary');
        reorderBtn.classList.remove('btn-primary');
        
        // Save the new order
        saveMenuOrder();
        
        // Disable drag and drop
        disableDragAndDrop();
    }
}

// Enable drag and drop for menu items
function enableDragAndDrop() {
    console.log('Enabling drag and drop');
    
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.setAttribute('draggable', 'true');
        
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// Disable drag and drop for menu items
function disableDragAndDrop() {
    console.log('Disabling drag and drop');
    
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.removeAttribute('draggable');
        
        item.removeEventListener('dragstart', handleDragStart);
        item.removeEventListener('dragover', handleDragOver);
        item.removeEventListener('drop', handleDrop);
        item.removeEventListener('dragend', handleDragEnd);
    });
}

// Handle drag start event
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.itemId);
    e.target.classList.add('dragging');
}

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

// Handle drop event
function handleDrop(e) {
    e.preventDefault();
    
    const sourceId = e.dataTransfer.getData('text/plain');
    const sourceItem = document.querySelector(`.menu-item[data-item-id="${sourceId}"]`);
    const targetItem = e.target.closest('.menu-item');
    
    if (sourceItem && targetItem && sourceItem !== targetItem) {
        const menuItemsContainer = targetItem.parentNode;
        
        // Check if dragging within the same category
        if (sourceItem.parentNode === menuItemsContainer) {
            // Determine if we're inserting before or after the target
            const rect = targetItem.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            
            if (e.clientY < midY) {
                menuItemsContainer.insertBefore(sourceItem, targetItem);
            } else {
                menuItemsContainer.insertBefore(sourceItem, targetItem.nextSibling);
            }
        }
    }
}

// Handle drag end event
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

// Save the new menu order
async function saveMenuOrder() {
    console.log('Saving menu order');
    
    try {
        // For each category, save the new order of menu items
        const categories = document.querySelectorAll('.menu-category');
        const venue = dashboardState.currentVenue || 'farewell';
        
        let promises = [];
        
        categories.forEach(category => {
            const menuItems = category.querySelectorAll('.menu-item');
            
            menuItems.forEach((item, index) => {
                const itemId = item.dataset.itemId;
                
                // Update the display order
                promises.push(
                    api.put(`/api/admin/menu-items/${itemId}`, {
                        display_order: index
                    })
                );
            });
        });
        
        await Promise.all(promises);
        
        showToast('Menu order saved successfully', 'success');
    } catch (error) {
        console.error('Error saving menu order:', error);
        showToast(`Error: ${error.message || 'Failed to save menu order'}`, 'error');
    }
}
