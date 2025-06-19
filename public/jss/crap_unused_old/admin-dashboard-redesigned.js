// Admin Dashboard JavaScript - Redesigned Version
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const sessionToken = getCookie('sessionToken');
    if (!sessionToken) {
        window.location.href = '/admin/login';
        return;
    }

    // Global state
    let events = [];
    let blogPosts = [];
    let editingEventId = null;
    let editingPostId = null;
    let quillEditor = null;

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
                window.location.href = '/admin/login';
                return;
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
                window.location.href = '/admin/login';
                return;
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
                window.location.href = '/admin/login';
                return;
            }
            return response;
        },
        delete: async (endpoint) => {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            return response;
        },
        upload: async (endpoint, formData) => {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            if (response.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            return response;
        }
    };

    // Navigation handling
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const mainTitle = document.getElementById('main-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');

            // Update active states
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            const targetSection = document.getElementById(`section-${target}`);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update title
            const sectionTitle = item.textContent.trim();
            mainTitle.textContent = sectionTitle;

            // Load data when switching to sections
            if (target === 'events') {
                loadEvents();
            } else if (target === 'blog') {
                loadBlogPosts();
            } else if (target === 'dashboard') {
                loadDashboardStats();
            }
        });
    });

    // Logout handling
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/admin/api/logout', { 
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            window.location.href = '/admin/login';
        });
    }

    // Modal handling
    const modal = document.getElementById('form-modal');
    const modalBody = document.getElementById('modal-form-body');
    const closeModalBtn = document.querySelector('.modal-close-btn');

    function openModal() { 
        modal.classList.add('active'); 
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() { 
        modal.classList.remove('active'); 
        document.body.style.overflow = 'auto';
        if (quillEditor) {
            quillEditor = null;
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Dashboard stats
    async function loadDashboardStats() {
        try {
            // Load events count
            const eventsResponse = await api.get('/admin/api/events');
            if (eventsResponse && eventsResponse.ok) {
                const eventsData = await eventsResponse.json();
                document.getElementById('stats-total-events').textContent = eventsData.length;
                
                // Show recent events in dashboard
                const recentEvents = eventsData.slice(0, 5);
                const dashboardEventsEl = document.getElementById('dashboard-recent-events');
                if (dashboardEventsEl) {
                    dashboardEventsEl.innerHTML = recentEvents.map(event => `
                        <div class="list-item-card">
                            <div class="list-item-info">
                                <h4>${event.title}</h4>
                                <p>${new Date(event.date).toLocaleDateString()} - ${event.venue}</p>
                            </div>
                        </div>
                    `).join('') || '<p>No recent events</p>';
                }
            }

            // Load blog posts count
            const blogResponse = await api.get('/admin/api/blog');
            if (blogResponse && blogResponse.ok) {
                const blogData = await blogResponse.json();
                document.getElementById('stats-total-posts').textContent = blogData.length;
            }

        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    // Event Management with Aaron's Requirements and Legacy Compatibility
    async function loadEvents() {
        try {
            const response = await api.get('/admin/api/events');
            if (response && response.ok) {
                events = await response.json();
                renderEvents();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            displayMessage('event-list', `Error loading events: ${error.message}`, 'error');
        }
    }

    function renderEvents() {
        const eventList = document.getElementById('event-list');
        if (!eventList) return;
        
        if (!events || events.length === 0) {
            eventList.innerHTML = '<div class="empty-state"><p>No events found. Create your first event or import legacy events!</p></div>';
            return;
        }
        
        eventList.innerHTML = events.map(event => `
            <div class="list-item-card" data-event-id="${event.id}">
                <div class="list-item-info">
                    <h4>${event.title || 'Untitled Event'}</h4>
                    <p class="event-description">${event.description || 'No description'}</p>
                    <div class="event-details">
                        <span class="event-date"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</span>
                        <span class="event-venue venue-${event.venue}"><strong>Venue:</strong> ${event.venue}</span>
                        <span class="event-time"><strong>Time:</strong> ${event.time || event.event_time || 'Time TBD'}</span>
                        <span class="event-age"><strong>Age:</strong> ${event.ageRestriction || event.age_restriction || 'Check with venue'}</span>
                        ${event.status && event.status !== 'active' ? `<span class="event-status status-${event.status}"><strong>Status:</strong> ${event.status}</span>` : ''}
                        ${event.legacy_id ? `<span class="legacy-indicator">Legacy Event</span>` : ''}
                    </div>
                </div>
                <div class="list-item-card-actions">
                    <button onclick="editEvent('${event.id}')" class="btn btn-secondary">Edit</button>
                    <button onclick="deleteEvent('${event.id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        `).join('');
    }

    function showEventForm(event = null) {
        editingEventId = event ? event.id : null;
        
        modalBody.innerHTML = `
            <div class="modal-form">
                <h2>${event ? 'Edit Event' : 'Create New Event'}</h2>
                <form id="event-form">
                    
                    <!-- Required Fields -->
                    <div class="form-group required">
                        <label for="event-venue">Venue *</label>
                        <select id="event-venue" required onchange="updateAutoPopulation()">
                            <option value="">-- Select a Venue --</option>
                            <option value="farewell" ${event && event.venue === 'farewell' ? 'selected' : ''}>Farewell</option>
                            <option value="howdy" ${event && event.venue === 'howdy' ? 'selected' : ''}>Howdy</option>
                        </select>
                    </div>

                    <div class="form-group required">
                        <label for="event-title">Event Title *</label>
                        <input type="text" id="event-title" value="${event ? (event.title || '') : ''}" required placeholder="Enter event title">
                    </div>
                    
                    <div class="form-group required">
                        <label for="event-date">Event Date *</label>
                        <input type="datetime-local" id="event-date" value="${event && event.date ? new Date(event.date).toISOString().slice(0,16) : ''}" required>
                    </div>

                    <!-- Aaron's Auto-Population Section -->
                    <div class="auto-population-section">
                        <h3>Venue Defaults (Aaron's Requirements)</h3>
                        
                        <div class="form-group">
                            <label>Age Restriction</label>
                            <div class="auto-field">
                                <p class="default-value">Default: <span id="default-age-restriction">Select a venue first</span></p>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="override-age-restriction" onchange="toggleOverride('age-restriction')">
                                    Override default
                                </label>
                                <input type="text" id="custom-age-restriction" class="override-input" style="display: none;" placeholder="Enter custom age restriction" value="">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Event Time</label>
                            <div class="auto-field">
                                <p class="default-value">Default: <span id="default-event-time">Doors at 7pm / Music at 8pm</span></p>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="override-event-time" onchange="toggleOverride('event-time')">
                                    Override default
                                </label>
                                <input type="text" id="custom-event-time" class="override-input" style="display: none;" placeholder="Enter custom event time" value="">
                            </div>
                        </div>
                    </div>

                    <!-- Optional Fields -->
                    <div class="form-group">
                        <label for="event-description">Description</label>
                        <textarea id="event-description" rows="4" placeholder="Event description (optional)">${event ? (event.description || '') : ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="event-price">Price</label>
                        <input type="text" id="event-price" value="${event ? (event.suggestedPrice || event.price || '') : ''}" placeholder="e.g., $15, Free, Donation">
                    </div>

                    <div class="form-group">
                        <label for="event-capacity">Capacity</label>
                        <input type="number" id="event-capacity" value="${event ? (event.capacity || '') : ''}" placeholder="Maximum attendees">
                    </div>

                    <div class="form-group">
                        <label for="event-ticket-url">Ticket URL</label>
                        <input type="url" id="event-ticket-url" value="${event ? (event.ticketLink || event.ticket_url || '') : ''}" placeholder="https://...">
                    </div>

                    <!-- Flyer Upload Section -->
                    <div class="form-group">
                        <label>Event Flyer</label>
                        <div class="flyer-upload-section">
                            <input type="url" id="event-flyer-url" value="${event ? (event.imageUrl || event.flyer_image_url || '') : ''}" placeholder="Enter image URL or upload file below">
                            <div class="upload-divider">OR</div>
                            <input type="file" id="flyer-file-input" accept="image/*">
                            <button type="button" id="upload-flyer-btn" class="btn btn-secondary">Upload Flyer</button>
                            <div id="upload-status"></div>
                            <div id="flyer-preview">
                                ${event && (event.imageUrl || event.flyer_image_url) ? `<img src="${event.imageUrl || event.flyer_image_url}" alt="Current flyer" class="flyer-preview-img">` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Status and Features -->
                    <div class="form-group">
                        <label for="event-status">Status</label>
                        <select id="event-status">
                            <option value="active" ${!event || event.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="cancelled" ${event && event.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            <option value="postponed" ${event && event.status === 'postponed' ? 'selected' : ''}>Postponed</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="event-featured" ${event && event.is_featured ? 'checked' : ''}>
                            Feature this event on homepage
                        </label>
                    </div>

                    <!-- Form Actions -->
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">${event ? 'Update Event' : 'Create Event'}</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        // Set up event listeners after DOM is updated
        setTimeout(() => {
            setupEventFormListeners();
            if (event) {
                populateEventForm(event);
            }
            updateAutoPopulation(); // Initialize auto-population display
        }, 100);

        openModal();
    }

    // Aaron's auto-population logic
    window.updateAutoPopulation = function() {
        const venue = document.getElementById('event-venue').value;
        const defaultAgeElement = document.getElementById('default-age-restriction');
        const defaultTimeElement = document.getElementById('default-event-time');
        
        if (venue === 'howdy') {
            defaultAgeElement.textContent = 'All ages';
        } else if (venue === 'farewell') {
            defaultAgeElement.textContent = '21+ unless with parent or legal guardian';
        } else {
            defaultAgeElement.textContent = 'Select a venue first';
        }
        
        defaultTimeElement.textContent = 'Doors at 7pm / Music at 8pm';
    };

    // Toggle override inputs
    window.toggleOverride = function(field) {
        const checkbox = document.getElementById(`override-${field}`);
        const input = document.getElementById(`custom-${field}`);
        
        if (checkbox.checked) {
            input.style.display = 'block';
            input.focus();
        } else {
            input.style.display = 'none';
            input.value = '';
        }
    };

    function populateEventForm(event) {
        // Handle custom overrides for age restriction and time
        const currentAge = event.ageRestriction || event.age_restriction || '';
        const currentTime = event.time || event.event_time || '';
        
        // Check if current values differ from defaults
        const venue = document.getElementById('event-venue').value;
        const defaultAge = venue === 'howdy' ? 'All ages' : '21+ unless with parent or legal guardian';
        const defaultTime = 'Doors at 7pm / Music at 8pm';
        
        if (currentAge && currentAge !== defaultAge) {
            document.getElementById('override-age-restriction').checked = true;
            document.getElementById('custom-age-restriction').style.display = 'block';
            document.getElementById('custom-age-restriction').value = currentAge;
        }
        
        if (currentTime && currentTime !== defaultTime) {
            document.getElementById('override-event-time').checked = true;
            document.getElementById('custom-event-time').style.display = 'block';
            document.getElementById('custom-event-time').value = currentTime;
        }
    }

    function setupEventFormListeners() {
        // Flyer upload functionality
        const flyerInput = document.getElementById('event-flyer-url');
        const flyerPreview = document.getElementById('flyer-preview');
        const fileInput = document.getElementById('flyer-file-input');
        const uploadBtn = document.getElementById('upload-flyer-btn');
        const uploadStatus = document.getElementById('upload-status');
        
        // Preview flyer from URL
        flyerInput.addEventListener('input', (e) => {
            const url = e.target.value;
            if (url && url.startsWith('http')) {
                flyerPreview.innerHTML = `<img src="${url}" alt="Flyer preview" class="flyer-preview-img">`;
            } else if (!url) {
                flyerPreview.innerHTML = '';
            }
        });
        
        // Handle file upload
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const file = fileInput.files[0];
            
            if (!file) {
                uploadStatus.innerHTML = '<div class="upload-error">Please select a file first</div>';
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                uploadStatus.innerHTML = '<div class="upload-error">Please select an image file</div>';
                return;
            }
            
            const formData = new FormData();
            formData.append('flyer', file);
            
            uploadStatus.innerHTML = '<div class="upload-progress">Uploading...</div>';
            uploadBtn.disabled = true;
            
            try {
                const response = await api.upload('/admin/api/flyers/upload', formData);
                
                if (response && response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        flyerInput.value = result.url;
                        flyerPreview.innerHTML = `<img src="${result.url}" alt="Uploaded flyer" class="flyer-preview-img">`;
                        uploadStatus.innerHTML = '<div class="upload-success">Upload successful!</div>';
                        fileInput.value = '';
                        
                        setTimeout(() => {
                            uploadStatus.innerHTML = '';
                        }, 3000);
                    } else {
                        uploadStatus.innerHTML = `<div class="upload-error">Upload failed: ${result.error}</div>`;
                    }
                } else {
                    uploadStatus.innerHTML = '<div class="upload-error">Upload failed: Server error</div>';
                }
            } catch (error) {
                uploadStatus.innerHTML = `<div class="upload-error">Upload failed: ${error.message}</div>`;
            } finally {
                uploadBtn.disabled = false;
            }
        });
        
        // Form submission
        document.getElementById('event-form').addEventListener('submit', handleEventSubmit);
    }

    // Handle form submission with proper data mapping
    async function handleEventSubmit(e) {
        e.preventDefault();
        
        const venue = document.getElementById('event-venue').value;
        const formData = {
            title: document.getElementById('event-title').value.trim(),
            date: document.getElementById('event-date').value,
            venue: venue,
            description: document.getElementById('event-description').value.trim(),
            price: document.getElementById('event-price').value.trim(),
            capacity: document.getElementById('event-capacity').value ? parseInt(document.getElementById('event-capacity').value) : undefined,
            ticket_url: document.getElementById('event-ticket-url').value.trim(),
            flyer_image_url: document.getElementById('event-flyer-url').value.trim(),
            status: document.getElementById('event-status').value,
            is_featured: document.getElementById('event-featured').checked
        };
        
        // Handle age restriction (custom or default)
        if (document.getElementById('override-age-restriction').checked) {
            formData.age_restriction = document.getElementById('custom-age-restriction').value.trim();
        } else {
            // Let backend apply default based on venue
            formData.age_restriction = venue === 'howdy' ? 'All ages' : '21+ unless with parent or legal guardian';
        }
        
        // Handle event time (custom or default)
        if (document.getElementById('override-event-time').checked) {
            formData.event_time = document.getElementById('custom-event-time').value.trim();
        } else {
            // Let backend apply default
            formData.event_time = 'Doors at 7pm / Music at 8pm';
        }
        
        // Validate required fields
        if (!formData.title || !formData.date || !formData.venue) {
            alert('Please fill in all required fields (Title, Date, Venue)');
            return;
        }
        
        try {
            let response;
            if (editingEventId) {
                response = await api.put(`/admin/api/events/${editingEventId}`, formData);
            } else {
                response = await api.post('/admin/api/events', formData);
            }
            
            if (response && response.ok) {
                const result = await response.json();
                if (result.success) {
                    closeModal();
                    loadEvents(); // Refresh the list
                    showNotification(`Event ${editingEventId ? 'updated' : 'created'} successfully!`, 'success');
                } else {
                    alert(`Failed to ${editingEventId ? 'update' : 'create'} event: ${result.error}`);
                }
            } else {
                alert(`Failed to ${editingEventId ? 'update' : 'create'} event`);
            }
        } catch (error) {
            console.error('Error submitting event:', error);
            alert(`Error ${editingEventId ? 'updating' : 'creating'} event`);
        }
    }

    // Global functions for event management
    window.editEvent = (id) => {
        const event = events.find(e => e.id === id);
        if (event) {
            showEventForm(event);
        }
    };

    window.deleteEvent = async (id) => {
        if (confirm('Are you sure you want to delete this event?')) {
            try {
                const response = await api.delete(`/admin/api/events/${id}`);
                if (response && response.ok) {
                    await loadEvents();
                    showSuccessMessage('Event deleted successfully!');
                } else {
                    alert('Error deleting event');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Error deleting event');
            }
        }
    };

    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => showEventForm());
    }

    // Blog Management
    async function loadBlogPosts() {
        try {
            const response = await api.get('/admin/api/blog');
            if (response && response.ok) {
                blogPosts = await response.json();
                renderBlogPosts();
            }
        } catch (error) {
            console.error('Error loading blog posts:', error);
        }
    }

    function renderBlogPosts() {
        const blogList = document.getElementById('blog-list');
        if (!blogList) return;
        
        blogList.innerHTML = blogPosts.map(post => `
            <div class="list-item-card">
                <div class="list-item-info">
                    <h4>${post.title}</h4>
                    <p>${post.content ? stripHtml(post.content).substring(0, 100) + '...' : 'No content'}</p>
                    <p><strong>Date:</strong> ${new Date(post.date).toLocaleDateString()} | <strong>Author:</strong> ${post.author || 'Unknown'}</p>
                </div>
                <div class="list-item-card-actions">
                    <button onclick="editBlogPost('${post.id}')" class="btn btn-secondary">Edit</button>
                    <button onclick="deleteBlogPost('${post.id}')" class="btn btn-danger">Delete</button>
                </div>
            </div>
        `).join('') || '<p>No blog posts found. Create your first post!</p>';
    }

    function showBlogForm(post = null) {
        editingPostId = post ? post.id : null;
        
        modalBody.innerHTML = `
            <h2>${post ? 'Edit Blog Post' : 'Create New Blog Post'}</h2>
            <form id="blog-form">
                <div class="form-group">
                    <label for="blog-title">Title</label>
                    <input type="text" id="blog-title" value="${post ? post.title : ''}" required>
                </div>
                <div class="form-group">
                    <label for="blog-author">Author</label>
                    <input type="text" id="blog-author" value="${post ? (post.author || '') : ''}">
                </div>
                <div class="form-group">
                    <label for="blog-date">Date</label>
                    <input type="date" id="blog-date" value="${post ? post.date : new Date().toISOString().split('T')[0]}" required>
                </div>
                <div class="form-group">
                    <label for="blog-content">Content</label>
                    <div id="blog-content-editor" style="height: 300px;"></div>
                </div>
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Post</button>
                </div>
            </form>
        `;

        // Initialize Quill editor
        setTimeout(() => {
            const editorElement = document.getElementById('blog-content-editor');
            if (editorElement) {
                quillEditor = new Quill('#blog-content-editor', {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link', 'image'],
                            ['clean']
                        ]
                    }
                });

                // Set existing content
                if (post && post.content) {
                    quillEditor.root.innerHTML = post.content;
                }
            }
        }, 100);

        // Handle form submission
        const blogForm = document.getElementById('blog-form');
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBlogPost();
        });

        openModal();
    }

    async function saveBlogPost() {
        const postData = {
            title: document.getElementById('blog-title').value,
            author: document.getElementById('blog-author').value,
            date: document.getElementById('blog-date').value,
            content: quillEditor ? quillEditor.root.innerHTML : ''
        };

        try {
            let response;
            if (editingPostId) {
                response = await api.put(`/admin/api/blog/${editingPostId}`, postData);
            } else {
                response = await api.post('/admin/api/blog', postData);
            }

            if (response && response.ok) {
                closeModal();
                await loadBlogPosts();
                showSuccessMessage(editingPostId ? 'Blog post updated successfully!' : 'Blog post created successfully!');
            } else {
                const error = await response.json();
                alert(`Error saving blog post: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving blog post:', error);
            alert('Error saving blog post');
        }
    }

    // Global functions for blog management
    window.editBlogPost = (id) => {
        const post = blogPosts.find(p => p.id === id);
        if (post) {
            showBlogForm(post);
        }
    };

    window.deleteBlogPost = async (id) => {
        if (confirm('Are you sure you want to delete this blog post?')) {
            try {
                const response = await api.delete(`/admin/api/blog/${id}`);
                if (response && response.ok) {
                    await loadBlogPosts();
                    showSuccessMessage('Blog post deleted successfully!');
                } else {
                    alert('Error deleting blog post');
                }
            } catch (error) {
                console.error('Error deleting blog post:', error);
                alert('Error deleting blog post');
            }
        }
    };

    // Add blog button
    const addBlogBtn = document.getElementById('add-blog-btn');
    if (addBlogBtn) {
        addBlogBtn.addEventListener('click', () => showBlogForm());
    }

    // Legacy import
    const importLegacyBtn = document.getElementById('import-legacy-btn');
    const importStatus = document.getElementById('import-status');

    if (importLegacyBtn) {
        importLegacyBtn.addEventListener('click', async () => {
            if (importStatus) {
                importStatus.innerHTML = '<div class="status-message info"><div class="spinner"></div>Importing legacy events...</div>';
            }

            try {
                const response = await api.post('/admin/api/sync');
                if (response) {
                    const result = await response.json();

                    if (importStatus) {
                        if (response.ok) {
                            importStatus.innerHTML = `<div class="status-message success">${result.message}</div>`;
                            await loadEvents(); // Refresh events list
                        } else {
                            importStatus.innerHTML = `<div class="status-message error">Error: ${result.error}</div>`;
                        }
                    }
                }
            } catch (error) {
                console.error('Error importing legacy events:', error);
                if (importStatus) {
                    importStatus.innerHTML = '<div class="status-message error">Error importing legacy events</div>';
                }
            }
        });
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                sidebar.classList.remove('mobile-open');
            }
        });
    }

    // Utility functions
    function displayMessage(containerId, message, type = 'info') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
        }
    }

    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Make closeModal available globally
    window.closeModal = closeModal;

    // Initial load
    loadDashboardStats();
});
