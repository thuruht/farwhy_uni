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

// ================================
// DATE HANDLING UTILITY FUNCTIONS
// ================================

// SAFE DATE PARSING (handles both ISO strings, local dates, and Date objects)
function parseEventDate(dateInput) {
  // Handle Date objects directly
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  
  // If date is in format "YYYY-MM-DD"
  if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateInput.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  
  // For full ISO strings or other formats
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// UNIVERSAL COMPARISON LOGIC
function isPastEvent(eventDate, referenceDate = new Date()) {
  const eventDay = parseEventDate(eventDate);
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  
  return eventDay < referenceDay;
}

function isTodayEvent(eventDate, referenceDate = new Date()) {
  const eventDay = parseEventDate(eventDate);
  const referenceDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  
  return eventDay.getTime() === referenceDay.getTime();
}

// ================================
// MISSING CRITICAL FUNCTIONS - EMERGENCY FIX
// ================================

// Global variables for admin data
let currentEvents = [];
let currentBlogPosts = [];
let currentMenuItems = [];
let currentVenue = 'farewell'; // Default venue

// Event Management Functions
function showEventForm(eventData = null) {
    console.log('Showing event form for:', eventData ? eventData.id : 'new');
    
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('event-modal-title');
    
    console.log('Modal element found:', modal);
    console.log('Modal classes before:', modal ? modal.className : 'modal not found');
    
    if (!modal) {
        console.error('Event modal not found');
        return;
    }
    
    const isEdit = eventData !== null;
    
    // Set modal title
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'Edit Event' : 'Add Event';
    }
    
    // Store event ID if editing
    if (isEdit) {
        modal.dataset.eventId = eventData.id;
    } else {
        delete modal.dataset.eventId;
    }
    
    // Populate form if editing
    if (isEdit) {
        // Normalize legacy event data to ensure all fields are properly mapped
        const normalizedEvent = normalizeLegacyEventForEditing(eventData);
        
        document.getElementById('event-title').value = normalizedEvent.title;
        document.getElementById('event-date').value = normalizedEvent.date ? normalizedEvent.date.split('T')[0] : '';
        document.getElementById('event-time').value = normalizedEvent.event_time;
        document.getElementById('event-venue').value = normalizedEvent.venue;
        document.getElementById('event-description').value = normalizedEvent.description;
        document.getElementById('event-flyer-url').value = normalizedEvent.flyer_image_url;
        document.getElementById('event-ticket-url').value = normalizedEvent.ticket_url;
    } else {
        document.getElementById('event-form').reset();
    }
    
    // Show modal
    console.log('Adding show class to modal');
    modal.classList.add('show');
    modal.style.display = 'flex'; // Fallback in case CSS class doesn't work
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '99999';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.opacity = '1'; // CRITICAL: Force opacity to 1
    console.log('Modal classes after:', modal.className);
    console.log('Modal style display:', getComputedStyle(modal).display);
    console.log('Modal z-index:', getComputedStyle(modal).zIndex);
    console.log('Modal position:', getComputedStyle(modal).position);
    console.log('Modal visibility:', getComputedStyle(modal).visibility);
    console.log('Modal opacity:', getComputedStyle(modal).opacity);
    
    // Make sure the form submit handler is attached only once
    const form = document.getElementById('event-form');
    if (form) {
        // Remove any existing listeners first
        form.removeEventListener('submit', handleEventFormSubmit);
        form.addEventListener('submit', handleEventFormSubmit);
        
        // Clear any existing dataset to prevent conflicts
        form.removeAttribute('data-event-id');
        if (isEdit) {
            form.setAttribute('data-event-id', eventData.id);
        }
    }
    
    // Set up file upload handlers
    setupFileUploadHandlers();
}

// Handle event form submission
async function handleEventFormSubmit(e) {
    e.preventDefault();
    
    // Prevent multiple submissions
    const submitButton = e.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
    }
    
    const modal = document.getElementById('event-modal');
    const isEdit = modal.dataset.eventId;
    const eventId = isEdit ? modal.dataset.eventId : null;
    
    try {
        const formData = new FormData(e.target);
        const eventData = Object.fromEntries(formData);
        
        // Handle file upload if present
        const flyerFile = document.getElementById('event-flyer-upload').files[0];
        if (flyerFile) {
            try {
                console.log('Starting flyer upload for file:', flyerFile.name);
                showToast('Uploading image...', 'info');
                
                const uploadFormData = new FormData();
                uploadFormData.append('flyer', flyerFile);
                
                const uploadResponse = await apiCall('/api/admin/events/flyer', {
                    method: 'POST',
                    body: uploadFormData
                });
                
                console.log('Upload response:', uploadResponse);
                
                if (uploadResponse && uploadResponse.imageUrl) {
                    eventData.flyer_image_url = uploadResponse.imageUrl;
                    // Update the URL input field so user can see the uploaded URL
                    document.getElementById('event-flyer-url').value = uploadResponse.imageUrl;
                    showToast('Image uploaded successfully!', 'success');
                    console.log('Image URL set to:', uploadResponse.imageUrl);
                } else {
                    console.error('Upload response missing imageUrl:', uploadResponse);
                    showToast('Image upload failed - no URL returned', 'error');
                }
            } catch (error) {
                console.error('Error uploading flyer:', error);
                showToast('Error uploading image: ' + error.message, 'error');
            }
        }
        
        const url = isEdit ? `/api/admin/events/${eventId}` : '/api/admin/events';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiCall(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData) 
        });
        
        if (response && response.success) {
            showToast(isEdit ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            closeEventForm();
            loadEvents(); // Reload events
        } else {
            showToast('Error saving event: ' + (response?.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        showToast('Error saving event: ' + error.message, 'error');
    } finally {
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = isEdit ? 'Update Event' : 'Create Event';
        }
    }
}

// Close event form modal
function closeEventForm() {
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none'; // Ensure it's hidden
        modal.style.opacity = '0'; // Ensure it's invisible
        document.getElementById('event-form').reset();
    }
}

function editEvent(eventId) {
    console.log('Edit event clicked for id:', eventId);
    const event = currentEvents.find(e => e.id === eventId);
    if (event) {
        showEventForm(event);
    } else {
        console.error('Event not found:', eventId);
    }
}

// Delete event function
async function deleteEvent(eventId) {
    console.log('Delete event clicked for id:', eventId);
    const event = currentEvents.find(e => e.id === eventId);
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
        try {
            const response = await apiCall(`/api/admin/events/${eventId}`, { method: 'DELETE' });
            
            if (response && response.success) {
                showToast('Event deleted successfully', 'success');
                loadEvents(); // Reload events
            } else {
                showToast('Failed to delete event: ' + (response?.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            showToast('Error deleting event', 'error');
        }
    }
}

// Blog Management Functions
function showBlogForm(blogData = null) {
    console.log('Showing blog form for:', blogData ? blogData.id : 'new');
    
    const modal = document.getElementById('blog-modal');
    const modalTitle = document.getElementById('blog-modal-title');
    
    if (!modal) {
        console.error('Blog modal not found');
        return;
    }
    
    const isEdit = blogData !== null;
    
    // Set modal title
    if (modalTitle) {
        modalTitle.textContent = isEdit ? 'Edit Blog Post' : 'Add Blog Post';
    }
    
    // Store blog post ID if editing
    if (isEdit) {
        modal.dataset.blogId = blogData.id;
    } else {
        delete modal.dataset.blogId;
    }
    
    // Populate form if editing
    if (isEdit) {
        document.getElementById('blog-title').value = blogData.title || '';
        document.getElementById('blog-content').value = blogData.content || '';
        document.getElementById('blog-author').value = blogData.author || '';
        document.getElementById('blog-image-url').value = blogData.featured_image_url || '';
    } else {
        document.getElementById('blog-form').reset();
    }
    
    // Show modal with forced styling
    console.log('Adding show class to blog modal');
    modal.classList.add('show');
    modal.style.display = 'flex'; // Fallback in case CSS class doesn't work
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '99999';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.opacity = '1'; // CRITICAL: Force opacity to 1
    console.log('Blog modal classes after:', modal.className);
    
    // Make sure the form submit handler is attached only once
    const form = document.getElementById('blog-form');
    form.removeEventListener('submit', handleBlogFormSubmit);
    form.addEventListener('submit', handleBlogFormSubmit);
    
    // Set up file upload handlers
    setupFileUploadHandlers();
}

// Handle blog form submission
async function handleBlogFormSubmit(e) {
    e.preventDefault();
    
    const modal = document.getElementById('blog-modal');
    const isEdit = modal.dataset.blogId;
    const blogId = isEdit ? modal.dataset.blogId : null;
    
    const formData = new FormData(e.target);
    const blogData = Object.fromEntries(formData);
    
    // Handle file upload if present
    const imageFile = document.getElementById('blog-image-upload').files[0];
    if (imageFile) {
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', imageFile);
            
            const uploadResponse = await apiCall('/api/admin/blog/upload-image', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (uploadResponse && uploadResponse.imageUrl) {
                blogData.featured_image_url = uploadResponse.imageUrl;
                // Update the URL input field so user can see the uploaded URL
                document.getElementById('blog-image-url').value = uploadResponse.imageUrl;
            }
        } catch (error) {
            console.error('Error uploading blog image:', error);
        }
    }
    
    try {
        const url = isEdit ? `/api/admin/blog/posts/${blogId}` : '/api/admin/blog/posts';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await apiCall(url, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blogData) 
        });
        
        if (response.success) {
            showToast(isEdit ? 'Blog post updated successfully!' : 'Blog post created successfully!', 'success');
            closeBlogForm();
            loadBlogPosts(); // Reload blog posts
        } else {
            showToast('Error saving blog post: ' + (response.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving blog post:', error);
        showToast('Error saving blog post', 'error');
    }
}

// Close blog form modal
function closeBlogForm() {
    const modal = document.getElementById('blog-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none'; // Ensure it's hidden
        modal.style.opacity = '0'; // Ensure it's invisible
        document.getElementById('blog-form').reset();
    }
}

function editBlogPost(postId) {
    console.log('Edit blog post clicked for id:', postId);
    // Convert to number to ensure proper comparison
    const numericId = parseInt(postId);
    const post = currentBlogPosts.find(p => p.id === numericId || p.id === postId);
    if (post) {
        console.log('Found blog post:', post);
        showBlogForm(post);
    } else {
        console.error('Blog post not found for id:', postId, 'in posts:', currentBlogPosts.map(p => p.id));
    }
}

// Delete blog post function
async function deleteBlogPost(postId) {
    console.log('Delete blog post clicked for id:', postId);
    // Convert to number to ensure proper comparison
    const numericId = parseInt(postId);
    const post = currentBlogPosts.find(p => p.id === numericId || p.id === postId);
    if (!post) {
        console.error('Blog post not found:', postId);
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
        try {
            const response = await apiCall(`/api/admin/blog/posts/${postId}`, { method: 'DELETE' });
            
            if (response && response.success) {
                showToast('Blog post deleted successfully', 'success');
                loadBlogPosts(); // Reload blog posts
            } else {
                showToast('Failed to delete blog post: ' + (response?.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting blog post:', error);
            showToast('Error deleting blog post', 'error');
        }
    }
}

// Menu Management Functions
function editMenuItem(item) {
    console.log('Edit menu item clicked for:', item);
    if (typeof item === 'object' && item !== null) {
        showMenuItemForm(item);
    } else if (typeof item === 'string' || typeof item === 'number') {
        // If ID was passed instead of object, find the item
        const itemObj = currentMenuItems.find(i => i.id == item);
        if (itemObj) {
            showMenuItemForm(itemObj);
        } else {
            console.error('Menu item not found with ID:', item);
        }
    } else {
        console.error('Invalid menu item:', item);
    }
}

// Function to delete a menu item
function deleteMenuItem(item) {
    console.log('Delete menu item clicked for:', item);
    
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        const itemId = item.id;
        
        // Call the API to delete the item
        apiCall(`/api/admin/menu-items/${itemId}`, { method: 'DELETE' })
            .then(response => {
                if (response && response.success) {
                    showToast('Menu item deleted successfully', 'success');
                    loadVenueSettings(); // Reload the menu
                } else {
                    showToast('Failed to delete menu item: ' + (response?.error || 'Unknown error'), 'error');
                }
            })
            .catch(error => {
                console.error('Error deleting menu item:', error);
                showToast('Error deleting menu item', 'error');
            });
    }
}

// Toast notification function
function showToast(message, type = 'info') {
    console.log(`Toast (${type}):`, message);
    
    // Create toast element if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

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
            credentials: 'include',
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
            console.log('New Event button clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent duplicate calls
            showEventForm();
            return;
        }

        // Handle Repair Legacy Events button click
        if (e.target.id === 'repair-legacy-events-btn' || e.target.closest('#repair-legacy-events-btn')) {
            console.log('Repair Legacy Events button clicked');
            e.preventDefault();
            e.stopPropagation();
            if (confirm('This will scan all events and restore missing flyer URLs and event times from legacy data. Continue?')) {
                repairLegacyEvents();
            }
            return;
        }

        // Handle New Blog Post button click
        if (e.target.id === 'add-blog-btn' || e.target.closest('#add-blog-btn')) {
            console.log('New Blog button clicked');
            e.preventDefault();
            e.stopPropagation(); // Prevent duplicate calls
            showBlogForm();
            return;
        }
    });

    // Now check authentication and show the appropriate screen
    // Directly check authentication validity without relying on reading cookies via JS
    try {
        console.log('[Admin] Checking session validity...');
        const authResponse = await fetch('/api/check', { credentials: 'include', cache: 'no-store' });
        if (authResponse.ok) {
            const authData = await authResponse.json();
            if (authData.success && authData.user) {
                console.log('[Admin] Valid user session, showing dashboard');
                currentUser = authData.user;
                showDashboard();
            } else {
                console.log('[Admin] Invalid user session data, showing login');
                showLoginScreen();
            }
        } else {
            console.log('[Admin] Auth check failed with status:', authResponse.status);
            showLoginScreen();
        }
    } catch (error) {
        console.error('[Admin] Auth check error, showing login screen.', error);
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
            
            // Log full response for debugging
            if (endpoint.includes('menu')) {
                response.clone().text().then(text => {
                    console.log(`API response for ${endpoint}:`, text);
                });
            }

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
        const res = await this._call(endpoint, { method: 'DELETE' });
        if (res) return await res.json();
        return null;
    }
};

// Helper function to wrap api calls and handle URL path conversion
function apiCall(url, options = {}) {
    // Convert URL paths to match the backend
    // Define the method based on options
    const method = options.method || 'GET';
    
    // Clean up URL for consistency
    let cleanUrl = url;
    
    // Make sure we have the /api prefix
    if (!url.startsWith('/api/')) {
        cleanUrl = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    console.log(`API call: ${method} ${cleanUrl}`);
    
    // Handle FormData properly - don't try to JSON.parse FormData
    const isFormData = options.body instanceof FormData;
    
    // Call the appropriate api method based on the HTTP method
    switch (method.toUpperCase()) {
        case 'GET':
            return api.get(cleanUrl);
        case 'POST':
            if (isFormData) {
                return api._call(cleanUrl, { method: 'POST', body: options.body })
                    .then(res => res ? res.json() : null);
            }
            return api.post(cleanUrl, options.body ? JSON.parse(options.body) : {});
        case 'PUT':
            if (isFormData) {
                return api._call(cleanUrl, { method: 'PUT', body: options.body })
                    .then(res => res ? res.json() : null);
            }
            return api.put(cleanUrl, options.body ? JSON.parse(options.body) : {});
        case 'DELETE':
            return api.delete(cleanUrl);
        default:
            throw new Error(`Unsupported HTTP method: ${method}`);
    }
}

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
    setupDropdownNavigation();
    
    console.log('Setting up modal...');
    setupModal();
    
    console.log('Setting up toasts...');
    setupToasts();
    
    console.log('Setting up menu item form...');
    setupMenuItemForm();
    
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
        
        // Update dropdown selection
        const navSelect = document.getElementById('admin-nav-select');
        if (navSelect) {
            navSelect.value = sectionName;
        }
        
        // Update section indicator and breadcrumb
        const sectionNames = { 
            'dashboard': 'Dashboard', 
            'events': 'Event Management', 
            'blog': 'Blog Management', 
            'featured-videos': 'Featured Videos', 
            'venue': 'Venue Settings', 
            'help': 'Help & Documentation' 
        };
        
        const sectionIndicator = document.getElementById('section-indicator');
        const breadcrumb = document.getElementById('breadcrumb');
        
        if (sectionIndicator) sectionIndicator.textContent = sectionNames[sectionName] || sectionName;
        if (breadcrumb) breadcrumb.textContent = `Home / ${sectionNames[sectionName] || sectionName}`;
        
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
                // Auto-load menu for Farewell since there's only one venue
                if (typeof loadMenus === 'function') {
                    loadMenus('farewell');
                }
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
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Load specific data based on the section
            if (target === 'venue') {
                console.log('Venue section clicked, loading venue settings...');
                await loadVenueSettings();
            } else if (target === 'events') {
                console.log('Events section clicked, loading events...');
                await loadEvents();
            } else if (target === 'blog') {
                console.log('Blog section clicked, loading blog posts...');
                await loadBlogPosts();
            }
            
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

// Logout function
async function logout() {
    console.log('Logging out...');
    
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            console.log('Logout successful');
            // Clear any local storage/session data
            localStorage.clear();
            // Redirect to login or refresh page
            window.location.reload();
        } else {
            console.error('Logout failed:', response.statusText);
            // Still redirect on failure to clear any stale auth
            window.location.reload();
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect on error to clear any stale auth
        window.location.reload();
    }
}

function setupDropdownNavigation() {
    console.log('Setting up dropdown navigation');
    
    const navSelect = document.getElementById('admin-nav-select');
    if (!navSelect) {
        console.error('Navigation dropdown not found');
        return;
    }
    
    // Handle navigation changes
    navSelect.addEventListener('change', (e) => {
        const selectedSection = e.target.value;
        console.log('Navigation changed to:', selectedSection);
        
        if (selectedSection === 'logout') {
            // Reset dropdown to current section before logout
            navSelect.value = dashboardState.currentSection || 'dashboard';
            // Handle logout
            logout();
            return;
        }
        
        // Navigate to section
        showSection(selectedSection);
    });
    
    console.log('Dropdown navigation setup complete');
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
    
    // Load venue settings including menu items
    console.log('Preloading venue settings...');
    await loadVenueSettings();
    
    // Initialize event listeners for venue settings
    console.log('Setting up venue settings event listeners...');
    const addMenuBtn = document.getElementById('add-menu-btn');
    if (addMenuBtn) {
        console.log('Adding click listener to add menu button');
        addMenuBtn.addEventListener('click', () => {
            console.log('Add menu item button clicked');
            showMenuItemForm();
        });
    }
    
    const reorderMenuBtn = document.getElementById('reorder-menu-btn');
    if (reorderMenuBtn) {
        console.log('Adding click listener to reorder menu button');
        reorderMenuBtn.addEventListener('click', () => {
            console.log('Reorder menu button clicked');
            toggleMenuReorderMode();
        });
    }
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
        
        // Update recent activity
        updateRecentActivity(events, blogData?.data || []);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Function to show recent activity in the dashboard
function updateRecentActivity(events, blogPosts) {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) {
        console.error('Recent activity list element not found');
        return;
    }
    
    // Combine events and blog posts into a single array of activities
    const activities = [];
    
    // Add events
    if (Array.isArray(events)) {
        events.forEach(event => {
            // Use created_at timestamp, or updated_at if available, or fallback to current time
            const timestamp = event.updated_at || event.created_at || Date.now();
            activities.push({
                type: 'event',
                title: event.title,
                date: new Date(event.date),
                venue: event.venue,
                timestamp: new Date(timestamp),
                action: event.updated_at ? 'updated' : 'created',
                id: event.id
            });
        });
    }
    
    // Add blog posts
    if (Array.isArray(blogPosts)) {
        blogPosts.forEach(post => {
            // Use updated_at if available, otherwise created_at
            const timestamp = post.updated_at || post.created_at || Date.now();
            activities.push({
                type: 'blog',
                title: post.title,
                date: new Date(post.created_at || Date.now()),
                timestamp: new Date(timestamp),
                action: post.updated_at && post.updated_at !== post.created_at ? 'updated' : 'created',
                id: post.id
            });
        });
    }
    
    // Sort by timestamp, most recent first
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    // Take the 5 most recent
    const recentActivities = activities.slice(0, 5);
    
    if (recentActivities.length === 0) {
        activityList.innerHTML = '<div class="empty-message">No recent activity</div>';
        return;
    }
    
    // Generate HTML
    activityList.innerHTML = recentActivities.map(activity => {
        const isEvent = activity.type === 'event';
        const icon = isEvent ? '🎪' : '📝';
        const typeLabel = isEvent ? 'Event' : 'Blog Post';
        const dateStr = formatDate(activity.date);
        const detailText = isEvent ? `${activity.venue?.toUpperCase() || ''} | ${dateStr}` : dateStr;
        const actionText = activity.action === 'updated' ? 'Updated' : 'Added';
        const timeAgo = getTimeAgo(activity.timestamp);
        
        return `
            <div class="activity-item">
                <span class="activity-icon">${icon}</span>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-meta">
                        <span class="activity-type">${actionText} ${timeAgo}</span>
                        <span class="activity-details">${typeLabel}: ${detailText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add some basic styles if not already present
    if (!document.getElementById('activity-feed-styles')) {
        const style = document.createElement('style');
        style.id = 'activity-feed-styles';
        style.textContent = `
            .activity-feed {
                max-height: 300px;
                overflow-y: auto;
            }
            .activity-item {
                display: flex;
                padding: 10px;
                border-bottom: 1px solid #eee;
                align-items: center;
            }
            .activity-item:last-child {
                border-bottom: none;
            }
            .activity-icon {
                font-size: 1.5rem;
                margin-right: 15px;
            }
            .activity-content {
                flex: 1;
            }
            .activity-title {
                font-weight: bold;
                margin-bottom: 3px;
            }
            .activity-meta {
                font-size: 0.8rem;
                color: #666;
                display: flex;
                justify-content: space-between;
            }
            .empty-message {
                padding: 20px;
                text-align: center;
                color: #888;
            }
        `;
        document.head.appendChild(style);
    }
}

// Helper function to format "time ago" text
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    }
    if (diffHour > 0) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    }
    if (diffMin > 0) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    return 'just now';
}

async function loadEvents() {
    console.log('Loading events...');
    const events = await api.get('/api/admin/events');
    if (events) {
        console.log(`Loaded ${events.length} events`);
        dashboardState.events = events;
        currentEvents = events; // Set global variable for other functions
        renderEvents(events);

        // Button listeners are handled by global click handler, no need to duplicate
        console.log('Add Event button element:', document.getElementById('add-event-btn'));
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
            const eventDateRaw = ev.date; // Use the raw date string
            
            // DEBUG: Log the raw event date for inspection
            console.log('RAW EVENT DATE:', eventDateRaw, 'TYPE:', typeof eventDateRaw);
            
            // Use the utility functions for consistent date handling
            const isPast = isPastEvent(eventDateRaw);
            const isToday = isTodayEvent(eventDateRaw);
            
            // Debug output for thorough diagnosis
            console.log(`Event: ${ev.title}`);
            console.log('Parsed event date:', parseEventDate(eventDateRaw));
            console.log('Today at midnight:', new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
            console.log('isPast:', isPast, 'isToday:', isToday);
            
            // Only mark as past if it's truly past (not today)
            const isTrulyPast = isPast && !isToday;
            
            const statusClass = isTrulyPast ? 'event-past' : 'event-upcoming';
            const statusText = isTrulyPast ? 'Past' : 'Upcoming';
            
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
        currentBlogPosts = result.data; // Set global variable for other functions
        renderBlogPosts(result.data, true);

        // Button listeners are handled by global click handler, no need to duplicate
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
                    ${post.featured_image_url ? 
                        `<div class="thumbnail"><img src="${post.featured_image_url}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>` : 
                        (() => {
                            // Check if legacy post has image in content
                            const imgMatch = post.content?.match(/<img[^>]+src="([^"]+)"/);
                            if (imgMatch && imgMatch[1]) {
                                return `<div class="thumbnail"><img src="${imgMatch[1]}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>`;
                            }
                            return `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`;
                        })()}
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

async function loadVenueSettings(venue) {
    // Get the current active venue if not provided
    if (!venue) {
        const venueSelector = document.getElementById('venue-selector');
        venue = venueSelector ? venueSelector.value || 'farewell' : 'farewell';
    }
    
    console.log(`Loading venue settings for venue: ${venue}`);
    window.currentVenue = venue; // Store the current venue globally
    
    // Load business hours for Farewell (only venue that needs dynamic hours management)
    if (venue === 'farewell') {
        await loadHours();
    }
    
    // Menu management is now handled by menu-management.js
    // Skip old menu management code to avoid conflicts
    console.log(`Menu management for venue ${venue} is handled by menu-management.js`);
    
    // Load other venue settings if needed (business hours, etc.)
    // but skip menu items since that's handled by the new system
    return;
}

// Function to toggle menu reorder mode
function toggleMenuReorderMode() {
    console.log('Toggling menu reorder mode');
    
    const menuList = document.getElementById('menu-list');
    const reorderBtn = document.getElementById('reorder-menu-btn');
    
    if (!menuList || !reorderBtn) {
        console.error('Menu list or reorder button not found');
        return;
    }
    
    // Check if we're already in reorder mode
    const isInReorderMode = menuList.classList.contains('reorder-mode');
    
    if (isInReorderMode) {
        // Exit reorder mode
        menuList.classList.remove('reorder-mode');
        reorderBtn.textContent = 'Reorder Menu';
        
        // Get the new order and save it
        saveMenuOrder();
    } else {
        // Enter reorder mode
        menuList.classList.add('reorder-mode');
        reorderBtn.textContent = 'Save Order';
        
        // Add drag handles and make items draggable
        setupDragAndDrop();
    }
}

// Setup drag and drop for menu items
function setupDragAndDrop() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        // Add drag handle if not already present
        if (!item.querySelector('.drag-handle')) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '⋮⋮';
            item.insertBefore(dragHandle, item.firstChild);
        }
        
        // Make draggable
        item.setAttribute('draggable', 'true');
        
        // Add drag events
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

// Drag event handlers
function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.itemId);
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const draggedItemId = e.dataTransfer.getData('text/plain');
    const draggedItem = document.querySelector(`.menu-item[data-item-id="${draggedItemId}"]`);
    
    if (draggedItem && this !== draggedItem) {
        // Get the category container
        const thisCategory = this.closest('.menu-category');
        const draggedCategory = draggedItem.closest('.menu-category');
        
        if (thisCategory === draggedCategory) {
            // Same category, just reorder
            const itemsContainer = thisCategory.querySelector('.menu-items');
            
            if (this.nextSibling === draggedItem) {
                itemsContainer.insertBefore(draggedItem, this);
            } else {
                itemsContainer.insertBefore(draggedItem, this.nextSibling);
            }
        } else {
            // Different category, update the category
            const itemsContainer = thisCategory.querySelector('.menu-items');
            itemsContainer.insertBefore(draggedItem, this.nextSibling);
            
            // Update the item's category
            const categoryName = thisCategory.querySelector('.menu-category-header h4').textContent;
            draggedItem.dataset.category = categoryName;
        }
    }
    
    this.classList.remove('drag-over');
}

function handleDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Save the new menu order
async function saveMenuOrder() {
    const menuItems = document.querySelectorAll('.menu-item');
    const items = [];
    
    // Collect all items with their new order
    menuItems.forEach((item, index) => {
        items.push({
            id: item.dataset.itemId,
            display_order: index,
            category: item.dataset.category || item.closest('.menu-category').querySelector('.menu-category-header h4').textContent
        });
    });
    
    console.log('Saving menu order with items:', items);
    
    try {
        const response = await apiCall('/api/admin/menu-items/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
        
        console.log('Menu reorder response:', response);
        
        if (response && response.success) {
            showToast('Menu order saved successfully', 'success');
        } else {
            showToast('Failed to save menu order: ' + (response?.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error saving menu order:', error);
        showToast('Error saving menu order', 'error');
    }
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
function showMenuItemForm(item = null, venue = null) {
    // Use provided venue or global currentVenue
    if (!venue) venue = currentVenue;
    
    console.log(`Showing menu item form for venue: ${venue}`, item);
    
    const isEditing = !!item;
    const modal = document.getElementById('menu-item-modal');
    const modalTitle = document.getElementById('menu-item-modal-title');
    
    if (!modal) {
        console.error('Menu item modal not found');
        return;
    }
    
    // Set modal title
    if (modalTitle) {
        modalTitle.textContent = isEditing ? 'Edit Menu Item' : 'Add Menu Item';
    }
    
    // Store item ID if editing
    if (item) {
        modal.dataset.itemId = item.id;
    } else {
        delete modal.dataset.itemId;
    }
    
    // Store the venue in the modal data
    modal.dataset.venue = venue;
    
    // Populate form if editing
    if (item) {
        const nameInput = document.getElementById('menu-item-name');
        const descInput = document.getElementById('menu-item-description');
        const priceInput = document.getElementById('menu-item-price');
        const categoryInput = document.getElementById('menu-item-category');
        const imageUrlInput = document.getElementById('menu-item-image-url');
        
        if (nameInput) nameInput.value = item.name || '';
        if (descInput) descInput.value = item.description || '';
        if (priceInput) priceInput.value = item.price || '';
        if (categoryInput) categoryInput.value = item.category || '';
        if (imageUrlInput) imageUrlInput.value = item.image_url || '';
    } else {
        const form = document.getElementById('menu-item-form');
        if (form) form.reset();
    }
    
    // Show modal with forced styling
    console.log('Adding show class to menu item modal');
    modal.classList.add('show');
    modal.style.display = 'flex'; // Fallback in case CSS class doesn't work
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '99999';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.opacity = '1'; // CRITICAL: Force opacity to 1
    console.log('Menu modal classes after:', modal.className);
    
    // Make sure the form submit handler is set up
    setupMenuItemForm();
    
    // Set up file upload handlers (even though commented out, keeps consistency)
    setupFileUploadHandlers();
}

// Close menu item form
function closeMenuItemForm() {
    const modal = document.getElementById('menu-item-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none'; // Ensure it's hidden
        modal.style.opacity = '0'; // Ensure it's invisible
        const form = document.getElementById('menu-item-form');
        if (form) form.reset();
    }
}

// Set up menu item form handler
function setupMenuItemForm() {
    const form = document.getElementById('menu-item-form');
    if (form) {
        console.log('Setting up menu item form submission handler');
        
        // Remove any existing event listeners
        const newForm = form.cloneNode(true);
        if (form.parentNode) {
            form.parentNode.replaceChild(newForm, form);
        }
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Menu item form submitted');
            
            const modal = document.getElementById('menu-item-modal');
            const isEditing = modal && modal.dataset.itemId;
            const itemId = isEditing ? modal.dataset.itemId : null;
            const venue = modal?.dataset.venue || currentVenue;
            
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')) || 0,
                category: formData.get('category'),
                image_url: formData.get('image_url'),
                menu_id: 1 // Default menu ID for Farewell
            };
            
            console.log('Submitting menu item data:', data);
            
            try {
                let response;
                if (isEditing) {
                    console.log(`Updating menu item ${itemId} with:`, data);
                    response = await apiCall(`/api/admin/menu-items/${itemId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } else {
                    console.log('Creating new menu item with:', data);
                    console.log(`Using venue for new menu item: ${venue}`);
                    
                    response = await apiCall(`/api/admin/venues/${venue}/menu-items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }
                
                if (response && response.success) {
                    console.log(`Menu item saved successfully for venue: ${venue}`);
                    showToast('Menu item saved successfully', 'success');
                    closeMenuItemForm();
                    loadVenueSettings(venue); // Reload the menu with the current venue
                } else {
                    showToast('Failed to save menu item: ' + (response?.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Error saving menu item:', error);
                showToast('Error saving menu item', 'error');
            }
        });
    } else {
        console.error('Menu item form not found');
    }
}

// Help section setup
function setupHelpSectionLinks() {
    console.log('Setting up help section links');
    // This function sets up any interactive elements in the help section
    // Currently just a placeholder - help section is mostly static
}

// Import handlers setup
function setupImportHandlers() {
    console.log('Setting up import handlers');
    
    const importButtons = document.querySelectorAll('.import-btn');
    importButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const importType = btn.dataset.importType;
            console.log(`Import ${importType} clicked`);
            
            // Show appropriate import modal or process
            switch (importType) {
                case 'events':
                    showImportEventsModal();
                    break;
                case 'blog':
                    showImportBlogModal();
                    break;
                case 'menu':
                    showImportMenuModal();
                    break;
                default:
                    showToast('Import type not implemented yet', 'info');
            }
        });
    });
}

function showImportEventsModal() {
    console.log('Show import events modal');
    showToast('Event import feature coming soon', 'info');
}

function showImportBlogModal() {
    console.log('Show import blog modal');
    showToast('Blog import feature coming soon', 'info');
}

function showImportMenuModal() {
    console.log('Show import menu modal');
    showToast('Menu import feature coming soon', 'info');
}

// Featured videos manager placeholder
if (!window.featuredVideosManager) {
    window.featuredVideosManager = {
        init: function() {
            console.log('Featured Videos Manager initialized');
            this.loadVideos();
            this.setupEventHandlers();
        },
        
        loadVideos: async function() {
            try {
                const videos = await api.get('/api/admin/featured');
                console.log('Featured videos loaded:', videos);
                this.renderVideos(videos?.data || []);
            } catch (error) {
                console.error('Error loading featured videos:', error);
                showToast('Failed to load featured videos', 'error');
            }
        },
        
        renderVideos: function(videos) {
            const container = document.getElementById('featured-videos-list');
            if (!container) return;
            
            if (!videos || videos.length === 0) {
                container.innerHTML = '<div class="empty-state">No featured videos found. Add some videos to get started.</div>';
                return;
            }
            
            container.innerHTML = videos.map(video => `
                <div class="video-item" data-id="${video.id}">
                    <div class="video-thumbnail">
                        <img src="${video.thumbnail_url}" alt="${video.title}" loading="lazy">
                    </div>
                    <div class="video-info">
                        <h4>${video.title}</h4>
                        <p>${video.description || ''}</p>
                        <div class="video-actions">
                            <button class="btn btn-sm edit-video-btn" data-id="${video.id}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-video-btn" data-id="${video.id}">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('');
        },
        
        setupEventHandlers: function() {
            const addVideoBtn = document.getElementById('add-featured-video-btn');
            if (addVideoBtn) {
                addVideoBtn.addEventListener('click', () => this.showVideoForm());
            }
            
            // Delegate click events for edit/delete buttons
            document.addEventListener('click', (e) => {
                if (e.target.matches('.edit-video-btn')) {
                    const videoId = e.target.dataset.id;
                    this.editVideo(videoId);
                } else if (e.target.matches('.delete-video-btn')) {
                    const videoId = e.target.dataset.id;
                    this.deleteVideo(videoId);
                }
            });
        },
        
        showVideoForm: function(video = null) {
            console.log('Show video form:', video);
            showToast('Featured video management coming soon', 'info');
        },
        
        editVideo: function(videoId) {
            console.log('Edit video:', videoId);
            showToast('Video editing coming soon', 'info');
        },
        
        deleteVideo: function(videoId) {
            console.log('Delete video:', videoId);
            if (confirm('Are you sure you want to delete this video?')) {
                showToast('Video deletion coming soon', 'info');
            }
        }
    };
}

// ================================
// HOURS MANAGEMENT (FAREWELL ONLY)
// ================================

// Days of the week mapping
const DAYS_OF_WEEK = [
    { value: 0, name: 'Sunday' },
    { value: 1, name: 'Monday' },
    { value: 2, name: 'Tuesday' },
    { value: 3, name: 'Wednesday' },
    { value: 4, name: 'Thursday' },
    { value: 5, name: 'Friday' },
    { value: 6, name: 'Saturday' }
];

async function loadHours() {
    console.log('Loading business hours for Farewell...');
    
    try {
        const response = await fetch('/api/hours?venue=farewell', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Hours API response:', result);
        
        if (result.success) {
            displayHoursEditor(result.data.farewell || []);
        } else {
            console.error('Failed to load hours:', result.error);
            displayHoursEditor([]); // Show empty form if no hours exist
        }
    } catch (error) {
        console.error('Error loading hours:', error);
        showAlert('Error loading business hours. Please try again.', 'error');
        displayHoursEditor([]); // Show empty form on error
    }
}

function displayHoursEditor(hours) {
    const container = document.getElementById('hours-editor');
    if (!container) {
        console.error('Hours editor container not found');
        return;
    }
    
    // Create hours data with defaults
    const hoursData = {};
    
    // Initialize with existing hours or defaults
    DAYS_OF_WEEK.forEach(day => {
        const existingHour = hours.find(h => h.day_of_week === day.value);
        hoursData[day.value] = existingHour || {
            day_of_week: day.value,
            open_time: '09:00',
            close_time: '17:00',
            is_closed: false,
            notes: ''
        };
    });
    
    container.innerHTML = `
        <div class="alert alert-info" style="margin-bottom: 20px;">
            <strong>Farewell Cafe Hours:</strong> Set the regular business hours for Farewell Cafe. 
            These will be displayed on the public website.
        </div>
        
        <table class="hours-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Open Time</th>
                    <th>Close Time</th>
                    <th>Closed</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${DAYS_OF_WEEK.map(day => {
                    const dayData = hoursData[day.value];
                    return `
                        <tr class="${dayData.is_closed ? 'closed' : ''}">
                            <td><strong>${day.name}</strong></td>
                            <td>
                                <input type="time" 
                                       id="open-${day.value}" 
                                       value="${dayData.open_time || '09:00'}"
                                       ${dayData.is_closed ? 'disabled' : ''} />
                            </td>
                            <td>
                                <input type="time" 
                                       id="close-${day.value}" 
                                       value="${dayData.close_time || '17:00'}"
                                       ${dayData.is_closed ? 'disabled' : ''} />
                            </td>
                            <td>
                                <input type="checkbox" 
                                       id="closed-${day.value}"
                                       ${dayData.is_closed ? 'checked' : ''}
                                       onchange="toggleDayStatus(${day.value})" />
                            </td>
                            <td>
                                <input type="text" 
                                       id="notes-${day.value}" 
                                       value="${dayData.notes || ''}"
                                       placeholder="Special notes..."
                                       ${dayData.is_closed ? 'disabled' : ''} />
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 20px;">
            <button type="button" class="btn-primary" onclick="saveHours()">
                Save Hours
            </button>
            <button type="button" class="btn-secondary" onclick="loadHours()">
                Reset
            </button>
        </div>
    `;
}

function toggleDayStatus(dayValue) {
    const isClosedCheckbox = document.getElementById(`closed-${dayValue}`);
    const openInput = document.getElementById(`open-${dayValue}`);
    const closeInput = document.getElementById(`close-${dayValue}`);
    const notesInput = document.getElementById(`notes-${dayValue}`);
    const row = isClosedCheckbox.closest('tr');
    
    const isClosed = isClosedCheckbox.checked;
    
    // Enable/disable time inputs
    openInput.disabled = isClosed;
    closeInput.disabled = isClosed;
    notesInput.disabled = isClosed;
    
    // Update row styling
    if (isClosed) {
        row.classList.add('closed');
    } else {
        row.classList.remove('closed');
    }
}

async function saveHours() {
    console.log('Saving business hours...');
    
    try {
        // Collect hours data from the form
        const hoursData = DAYS_OF_WEEK.map(day => {
            const isClosedCheckbox = document.getElementById(`closed-${day.value}`);
            const openInput = document.getElementById(`open-${day.value}`);
            const closeInput = document.getElementById(`close-${day.value}`);
            const notesInput = document.getElementById(`notes-${day.value}`);
            
            const isClosed = isClosedCheckbox.checked;
            
            return {
                day_of_week: day.value,
                open_time: isClosed ? null : openInput.value,
                close_time: isClosed ? null : closeInput.value,
                is_closed: isClosed,
                notes: notesInput.value.trim()
            };
        });
        
        console.log('Hours data to save:', hoursData);
        
        const response = await fetch('/api/admin/hours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                venue: 'farewell',
                hours: hoursData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Business hours updated successfully!', 'success');
            console.log('Hours saved successfully');
        } else {
            console.error('Failed to save hours:', result.error);
            showAlert(`Failed to save hours: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error saving hours:', error);
        showAlert('Error saving business hours. Please try again.', 'error');
    }
}

// Legacy event field mapping helper
function normalizeLegacyEventForEditing(eventData) {
    // Create a normalized event object that works with the form
    const normalized = {
        id: eventData.id,
        title: eventData.title || '',
        date: eventData.date || '',
        venue: eventData.venue || 'farewell',
        description: eventData.description || '',
        // Handle both legacy and modern field names
        event_time: eventData.event_time || eventData.time || '',
        flyer_image_url: eventData.flyer_image_url || eventData.imageUrl || '',
        ticket_url: eventData.ticket_url || eventData.ticketLink || '',
        // Additional legacy fields
        price: eventData.price || eventData.suggestedPrice || '',
        age_restriction: eventData.age_restriction || eventData.ageRestriction || '',
        status: eventData.status || 'active',
        is_featured: eventData.is_featured || false
    };
    
    console.log('Normalized legacy event:', normalized);
    return normalized;
}

// Function to repair legacy events and restore missing flyer URLs
async function repairLegacyEvents() {
    try {
        showToast('Starting legacy event repair...', 'info');
        
        // Get all events to check for legacy issues
        const events = await api.get('/api/admin/events');
        if (!events || !Array.isArray(events)) {
            showToast('Failed to load events for repair', 'error');
            return;
        }
        
        let repairedCount = 0;
        
        for (const event of events) {
            let needsUpdate = false;
            const updates = { id: event.id };
            
            // Check if event has legacy imageUrl but no flyer_image_url
            if (!event.flyer_image_url && event.imageUrl) {
                updates.flyer_image_url = event.imageUrl;
                needsUpdate = true;
                console.log(`Repairing flyer URL for event ${event.id}: ${event.imageUrl}`);
            }
            
            // Check if event has legacy time but no event_time
            if (!event.event_time && event.time) {
                updates.event_time = event.time;
                needsUpdate = true;
                console.log(`Repairing event time for event ${event.id}: ${event.time}`);
            }
            
            // Check if event has legacy ticketLink but no ticket_url
            if (!event.ticket_url && event.ticketLink) {
                updates.ticket_url = event.ticketLink;
                needsUpdate = true;
                console.log(`Repairing ticket URL for event ${event.id}: ${event.ticketLink}`);
            }
            
            if (needsUpdate) {
                try {
                    const response = await apiCall(`/api/admin/events/${event.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                    });
                    
                    if (response && response.success) {
                        repairedCount++;
                    } else {
                        console.error(`Failed to repair event ${event.id}:`, response);
                    }
                } catch (error) {
                    console.error(`Error repairing event ${event.id}:`, error);
                }
            }
        }
        
        if (repairedCount > 0) {
            showToast(`Successfully repaired ${repairedCount} legacy events!`, 'success');
            loadEvents(); // Reload events to show updated data
        } else {
            showToast('No legacy events needed repair', 'info');
        }
        
    } catch (error) {
        console.error('Error during legacy event repair:', error);
        showToast('Error during legacy event repair: ' + error.message, 'error');
    }
}

// File upload handlers setup
function setupFileUploadHandlers() {
    console.log('Setting up file upload handlers');
    
    // Set up event flyer upload handler
    const eventFlyerUpload = document.getElementById('event-flyer-upload');
    if (eventFlyerUpload) {
        eventFlyerUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('Event flyer file selected:', file.name);
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file', 'error');
                    e.target.value = '';
                    return;
                }
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    e.target.value = '';
                    return;
                }
                showToast('Image selected: ' + file.name, 'info');
            }
        });
    }
    
    // Set up blog image upload handler
    const blogImageUpload = document.getElementById('blog-image-upload');
    if (blogImageUpload) {
        blogImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('Blog image file selected:', file.name);
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file', 'error');
                    e.target.value = '';
                    return;
                }
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    e.target.value = '';
                    return;
                }
                showToast('Image selected: ' + file.name, 'info');
            }
        });
    }
    
    // Set up menu item image upload handler
    const menuImageUpload = document.getElementById('menu-item-image-upload');
    if (menuImageUpload) {
        menuImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('Menu item image file selected:', file.name);
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file', 'error');
                    e.target.value = '';
                    return;
                }
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size must be less than 5MB', 'error');
                    e.target.value = '';
                    return;
                }
                showToast('Image selected: ' + file.name, 'info');
            }
        });
    }
}
