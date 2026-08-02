function showAlert(message, type = 'info') {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:6px;font-weight:bold;color:#fff;background:${type === 'success' ? '#b0ee00' : type === 'error' ? '#ff2b13' : '#d990ff'};color:${type === 'success' ? '#000' : '#fff'};box-shadow:0 3px 10px #0000004c;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
let currentUser = null;
let dashboardState = {
  currentSection: 'dashboard',
  currentVenue: 'farewell',
  quill: null,
  stats: {},
  events: [],
  blogPosts: [],
  editingEventId: null,
  editingPostId: null,
};
function parseEventDate(dateString) {
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = dateString.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateString);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
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
let currentEvents = [];
let currentBlogPosts = [];
let currentMenuItems = [];
let currentVenue = 'farewell';
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
  if (modalTitle) {
    modalTitle.textContent = isEdit ? 'Edit Event' : 'Add Event';
  }
  if (isEdit) {
    modal.dataset.eventId = eventData.id;
  } else {
    delete modal.dataset.eventId;
  }
  if (isEdit) {
    const normalizedEvent = normalizeLegacyEventForEditing(eventData);
    document.getElementById('event-title').value = normalizedEvent.title;
    document.getElementById('event-date').value = normalizedEvent.date
      ? normalizedEvent.date.split('T')[0]
      : '';
    document.getElementById('event-time').value = normalizedEvent.event_time;
    document.getElementById('event-venue').value = normalizedEvent.venue;
    document.getElementById('event-description').value = normalizedEvent.description;
    document.getElementById('event-flyer-url').value = normalizedEvent.flyer_image_url;
    document.getElementById('event-ticket-url').value = normalizedEvent.ticket_url;
  } else {
    document.getElementById('event-form').reset();
  }
  console.log('Adding show class to modal');
  modal.classList.add('show');
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.zIndex = '99999';
  modal.style.backgroundColor = '#000000cc';
  modal.style.opacity = '1';
  console.log('Modal classes after:', modal.className);
  console.log('Modal style display:', getComputedStyle(modal).display);
  console.log('Modal z-index:', getComputedStyle(modal).zIndex);
  console.log('Modal position:', getComputedStyle(modal).position);
  console.log('Modal visibility:', getComputedStyle(modal).visibility);
  console.log('Modal opacity:', getComputedStyle(modal).opacity);
  const form = document.getElementById('event-form');
  if (form) {
    form.removeEventListener('submit', handleEventFormSubmit);
    form.addEventListener('submit', handleEventFormSubmit);
    form.removeAttribute('data-event-id');
    if (isEdit) {
      form.setAttribute('data-event-id', eventData.id);
    }
  }
  setupFileUploadHandlers();
}
async function handleEventFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  if (form && form.dataset.processing === '1') {
    console.warn('Duplicate form submit detected; ignoring because processing flag is set');
    return;
  }
  if (form) form.dataset.processing = '1';
  const submitButton = form.querySelector('button[type="submit"]');
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
    const flyerFile = document.getElementById('event-flyer-upload').files[0];
    if (flyerFile) {
      try {
        console.log('Starting flyer upload for file:', flyerFile.name);
        showToast('Uploading image...', 'info');
        const uploadFormData = new FormData();
        uploadFormData.append('flyer', flyerFile);
        const uploadResponse = await apiCall('/api/admin/events/flyer', {
          method: 'POST',
          body: uploadFormData,
        });
        console.log('Upload response:', uploadResponse);
        if (uploadResponse && uploadResponse.imageUrl) {
          eventData.flyer_image_url = uploadResponse.imageUrl;
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
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    if (response && response.success) {
      showToast(isEdit ? 'Event updated successfully!' : 'Event created successfully!', 'success');
      closeEventForm();
      loadEvents();
    } else {
      showToast('Error saving event: ' + (response?.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving event:', error);
    showToast('Error saving event: ' + error.message, 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = isEdit ? 'Update Event' : 'Create Event';
    }
    try {
      if (form && form.dataset.processing) delete form.dataset.processing;
    } catch (err) {
      console.warn('Unable to clear form processing flag:', err);
    }
  }
}
function closeEventForm() {
  const modal = document.getElementById('event-modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    document.getElementById('event-form').reset();
  }
}
function editEvent(eventId) {
  console.log('Edit event clicked for id:', eventId);
  const event = currentEvents.find((e) => e.id === eventId);
  if (event) {
    showEventForm(event);
  } else {
    console.error('Event not found:', eventId);
  }
}
async function deleteEvent(eventId) {
  console.log('Delete event clicked for id:', eventId);
  const event = currentEvents.find((e) => e.id === eventId);
  if (!event) {
    console.error('Event not found:', eventId);
    return;
  }
  if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
    try {
      const response = await apiCall(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      if (response && response.success) {
        showToast('Event deleted successfully', 'success');
        loadEvents();
      } else {
        showToast('Failed to delete event: ' + (response?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Error deleting event', 'error');
    }
  }
}
function showBlogForm(blogData = null) {
  console.log('Showing blog form for:', blogData ? blogData.id : 'new');
  const modal = document.getElementById('blog-modal');
  const modalTitle = document.getElementById('blog-modal-title');
  if (!modal) {
    console.error('Blog modal not found');
    return;
  }
  const isEdit = blogData !== null;
  if (modalTitle) {
    modalTitle.textContent = isEdit ? 'Edit Blog Post' : 'Add Blog Post';
  }
  if (isEdit) {
    modal.dataset.blogId = blogData.id;
  } else {
    delete modal.dataset.blogId;
  }
  if (isEdit) {
    document.getElementById('blog-title').value = blogData.title || '';
    document.getElementById('blog-content').value = blogData.content || '';
    document.getElementById('blog-author').value = blogData.author || '';
    document.getElementById('blog-image-url').value = blogData.featured_image_url || '';
  } else {
    document.getElementById('blog-form').reset();
  }
  console.log('Adding show class to blog modal');
  modal.classList.add('show');
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.zIndex = '99999';
  modal.style.backgroundColor = '#000000cc';
  modal.style.opacity = '1';
  console.log('Blog modal classes after:', modal.className);
  const form = document.getElementById('blog-form');
  form.removeEventListener('submit', handleBlogFormSubmit);
  form.addEventListener('submit', handleBlogFormSubmit);
  setupFileUploadHandlers();
}
async function handleBlogFormSubmit(e) {
  e.preventDefault();
  const modal = document.getElementById('blog-modal');
  const isEdit = modal.dataset.blogId;
  const blogId = isEdit ? modal.dataset.blogId : null;
  const formData = new FormData(e.target);
  const blogData = Object.fromEntries(formData);
  const imageFile = document.getElementById('blog-image-upload').files[0];
  if (imageFile) {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', imageFile);
      const uploadResponse = await apiCall('/api/admin/blog/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      if (uploadResponse && uploadResponse.imageUrl) {
        blogData.featured_image_url = uploadResponse.imageUrl;
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
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData),
    });
    if (response.success) {
      showToast(
        isEdit ? 'Blog post updated successfully!' : 'Blog post created successfully!',
        'success'
      );
      closeBlogForm();
      loadBlogPosts();
    } else {
      showToast('Error saving blog post: ' + (response.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error saving blog post:', error);
    showToast('Error saving blog post', 'error');
  }
}
function closeBlogForm() {
  const modal = document.getElementById('blog-modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    document.getElementById('blog-form').reset();
  }
}
function editBlogPost(postId) {
  console.log('Edit blog post clicked for id:', postId);
  const numericId = parseInt(postId);
  const post = currentBlogPosts.find((p) => p.id === numericId || p.id === postId);
  if (post) {
    console.log('Found blog post:', post);
    showBlogForm(post);
  } else {
    console.error(
      'Blog post not found for id:',
      postId,
      'in posts:',
      currentBlogPosts.map((p) => p.id)
    );
  }
}
async function deleteBlogPost(postId) {
  console.log('Delete blog post clicked for id:', postId);
  const numericId = parseInt(postId);
  const post = currentBlogPosts.find((p) => p.id === numericId || p.id === postId);
  if (!post) {
    console.error('Blog post not found:', postId);
    return;
  }
  if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
    try {
      const response = await apiCall(`/api/admin/blog/posts/${postId}`, { method: 'DELETE' });
      if (response && response.success) {
        showToast('Blog post deleted successfully', 'success');
        loadBlogPosts();
      } else {
        showToast('Failed to delete blog post: ' + (response?.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      showToast('Error deleting blog post', 'error');
    }
  }
}
function editMenuItem(item) {
  console.log('Edit menu item clicked for:', item);
  if (typeof item === 'object' && item !== null) {
    showMenuItemForm(item);
  } else if (typeof item === 'string' || typeof item === 'number') {
    const itemObj = currentMenuItems.find((i) => i.id == item);
    if (itemObj) {
      showMenuItemForm(itemObj);
    } else {
      console.error('Menu item not found with ID:', item);
    }
  } else {
    console.error('Invalid menu item:', item);
  }
}
function deleteMenuItem(item) {
  console.log('Delete menu item clicked for:', item);
  if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
    const itemId = item.id;
    apiCall(`/api/admin/menu-items/${itemId}`, { method: 'DELETE' })
      .then((response) => {
        if (response && response.success) {
          showToast('Menu item deleted successfully', 'success');
          loadVenueSettings();
        } else {
          showToast('Failed to delete menu item: ' + (response?.error || 'Unknown error'), 'error');
        }
      })
      .catch((error) => {
        console.error('Error deleting menu item:', error);
        showToast('Error deleting menu item', 'error');
      });
  }
}
function showToast(message, type = 'info') {
  console.log(`Toast (${type}):`, message);
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            z-index: 10000;\n        `;
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `\n        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};\n        color: white;\n        padding: 12px 20px;\n        margin-bottom: 10px;\n        border-radius: 4px;\n        box-shadow: 0 2px 10px #0000001a;\n        transform: translateX(100%);\n        transition: transform 0.3s ease;\n    `;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3e3);
}
function showLoginScreen() {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  if (dashboardContainer) {
    dashboardContainer.style.display = 'none';
    console.log('Dashboard container hidden');
  }
  if (!loginContainer) return;
  loginContainer.classList.add('active');
  console.log('Added active class to login container');
  loginContainer.innerHTML = `\n        <div class="admin-header">\n            <h1>admin</h1>\n        </div>\n        <main>\n            <div class="login-container">\n                <div class="login-title">log in</div>\n                <form id="loginForm">\n                    <div class="form-group">\n                        <label for="username">user:</label>\n                        <input type="text" id="username" name="username" required autocomplete="username">\n                    </div>\n                    <div class="form-group">\n                        <label for="password">pass:</label>\n                        <input type="password" id="password" name="password" required autocomplete="current-password">\n                    </div>\n                    <button type="submit" class="login-btn">let me in</button>\n                    <div id="login-error" class="error"></div>\n                </form>\n            </div>\n        </main>\n        <style>\n            #login-container {\n                background: var(--header-bg);\n                font-family: var(--font-main, 'Lora', serif);\n                margin: 0;\n                min-height: 100vh;\n                display: flex;\n                flex-direction: column;\n                align-items: center;\n                justify-content: flex-start;\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                z-index: 9999;\n            }\n            .admin-header {\n                width: 100%;\n                background: var(--primary-bg-color) url('/img/bg4.png') center/cover no-repeat;\n                background-attachment: fixed;\n                border-bottom: 1px solid var(--nav-border-color);\n                padding: 1rem 2rem;\n                display: flex;\n                justify-content: center;\n                align-items: center;\n                min-height: 212px;\n            }\n            .admin-header h1 {\n                font-family: var(--font-db, 'Lora', serif);\n                font-size: clamp(2.5rem, 8vw, 4em);\n                color: var(--secondary-bg-color);\n                -webkit-text-stroke: 1px black;\n                text-shadow: -1px -1px 0 #000,\n                    1px -1px 0 #000,\n                    -1px 1px 0 #000,\n                    1px 1px 0 #000,\n                    -8px 8px 0px var(--nav-border-color);\n                margin: 0;\n            }\n            .login-container {\n                background: var(--card-bg-color);\n                border: 2px solid var(--nav-border-color);\n                border-radius: 8px;\n                box-shadow: -5px 5px 0px #00000014;\n                padding: 2.5rem 2rem 2rem 2rem;\n                margin: 2rem auto 0 auto;\n                max-width: 400px;\n                width: 100%;\n                display: flex;\n                flex-direction: column;\n                align-items: center;\n            }\n            .login-title {\n                font-family: var(--font-db, 'Lora', serif);\n                font-size: 2.2rem;\n                color: var(--accent-color);\n                margin-bottom: 1.5rem;\n                text-shadow: 2px 2px 4px var(--header-text-shadow);\n            }\n            .form-group {\n                width: 100%;\n                margin-bottom: 1.2rem;\n                text-align: left;\n            }\n            #loginForm label {\n                font-family: var(--font-main, 'Lora', serif);\n                color: var(--accent-color);\n                font-weight: bold;\n                margin-bottom: 0.3rem;\n                display: block;\n            }\n            #loginForm input {\n                width: 100%;\n                padding: 0.8rem;\n                border: 1.5px solid var(--nav-border-color);\n                border-radius: 4px;\n                font-family: var(--font-hnm11, 'Lora', serif);\n                font-size: 1rem;\n                background: #fffffff2;\n                color: var(--text-color);\n                transition: border 0.2s;\n            }\n            #loginForm input:focus {\n                outline: none;\n                border-color: var(--secondary-bg-color);\n                box-shadow: -3px 3px 0px #00000014;\n            }\n            .login-btn {\n                width: 100%;\n                padding: 1rem 2rem;\n                background: var(--button-bg-color);\n                color: var(--button-text-color);\n                font-family: var(--font-main, 'Lora', serif);\n                font-weight: bold;\n                border-radius: 4px;\n                border: 2px solid var(--text-color);\n                font-size: 1.1rem;\n                margin-top: 0.5rem;\n                cursor: pointer;\n                transition: all var(--transition-speed) ease;\n            }\n            .login-btn:hover {\n                background: var(--accent-color);\n                color: white;\n                transform: translateY(-2px);\n            }\n            .error {\n                color: var(--redd);\n                margin-top: 0.7rem;\n                font-size: 1rem;\n                min-height: 1.2em;\n                text-align: center;\n                font-family: var(--font-main, 'Lora', serif);\n            }\n            @media (max-width: 600px) {\n                .login-container { padding: 1.2rem 0.5rem; }\n                .admin-header { min-height: 120px; padding: 0.5rem; }\n                .admin-header h1 { font-size: 2rem; }\n            }\n        </style>\n    `;
  document.getElementById('loginForm').addEventListener('submit', handleLoginSubmit);
}
function showDashboard() {
  console.log('showDashboard called');
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  console.log('Login container:', loginContainer);
  console.log('Dashboard container:', dashboardContainer);
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
    if (dashboardContainer.style.display === 'none') {
      dashboardContainer.style.display = '';
      console.log('Cleared inline display style');
    }
    dashboardContainer.style.display = 'grid';
    console.log('Dashboard container display set to grid');
    dashboardContainer.classList.add('dashboard-visible');
    console.log('Added dashboard-visible class');
    console.log(
      'Dashboard container computed style after setting:',
      window.getComputedStyle(dashboardContainer).display
    );
    console.log(
      'Dashboard sections after display:',
      document.querySelectorAll('.admin-section').length
    );
    console.log('Active sections:', document.querySelectorAll('.admin-section.active').length);
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
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const result = await response.json();
      console.log('Login response:', result);
      if (result.success) {
        if (result.user) {
          currentUser = result.user;
          console.log('Updated currentUser from login:', currentUser);
        } else if (result.username) {
          currentUser = { username: result.username, role: result.role || 'admin' };
          console.log('Updated currentUser from login alternative format:', currentUser);
        } else {
          currentUser = { username: data.username, role: 'admin' };
          console.log('Created currentUser from login data:', currentUser);
        }
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
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Admin] App initializing...');
  const dashboardContainer = document.getElementById('dashboard-container');
  console.log('Dashboard container:', dashboardContainer);
  if (dashboardContainer) {
    dashboardContainer.style.display = 'none';
    console.log(
      'Dashboard container initially hidden, computed style:',
      window.getComputedStyle(dashboardContainer).display
    );
  }
  const sections = document.querySelectorAll('.admin-section');
  console.log(
    `Found ${sections.length} admin sections:`,
    Array.from(sections).map((s) => s.id)
  );
  console.log('Modal elements check:', {
    'form-modal': document.getElementById('form-modal'),
    'modal-form-body': document.getElementById('modal-form-body'),
    'add-event-btn': document.getElementById('add-event-btn'),
    'add-blog-btn': document.getElementById('add-blog-btn'),
  });
  setupModal();
  document.addEventListener('click', (e) => {
    if (e.target.id === 'add-event-btn' || e.target.closest('#add-event-btn')) {
      console.log('New Event button clicked');
      e.preventDefault();
      e.stopPropagation();
      showEventForm();
      return;
    }
    if (
      e.target.id === 'repair-legacy-events-btn' ||
      e.target.closest('#repair-legacy-events-btn')
    ) {
      console.log('Repair Legacy Events button clicked');
      e.preventDefault();
      e.stopPropagation();
      if (
        confirm(
          'This will scan all events and restore missing flyer URLs and event times from legacy data. Continue?'
        )
      ) {
        repairLegacyEvents();
      }
      return;
    }
    if (e.target.id === 'add-blog-btn' || e.target.closest('#add-blog-btn')) {
      console.log('New Blog button clicked');
      e.preventDefault();
      e.stopPropagation();
      showBlogForm();
      return;
    }
  });
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
      const response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        cache: 'no-store',
      });
      console.log(`API response status: ${response.status}`);
      if (endpoint.includes('menu')) {
        response
          .clone()
          .text()
          .then((text) => {
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
        try {
          const errorData = await response.json();
          console.error('API error details:', errorData);
          showToast(`API Error: ${errorData.error || response.statusText}`, 'error');
        } catch (jsonError) {
          showToast(`API Error: ${response.status} ${response.statusText}`, 'error');
        }
        return null;
      }
      return response;
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
      body: JSON.stringify(data),
    });
    if (res) return await res.json();
    return null;
  },
  put: async function (endpoint, data) {
    const res = await this._call(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res) return await res.json();
    return null;
  },
  delete: async function (endpoint) {
    const res = await this._call(endpoint, { method: 'DELETE' });
    if (res) return await res.json();
    return null;
  },
};
function apiCall(url, options = {}) {
  const method = options.method || 'GET';
  let cleanUrl = url;
  if (!url.startsWith('/api/')) {
    cleanUrl = `/api${url.startsWith('/') ? '' : '/'}${url}`;
  }
  console.log(`API call: ${method} ${cleanUrl}`);
  const isFormData = options.body instanceof FormData;
  switch (method.toUpperCase()) {
    case 'GET':
      return api.get(cleanUrl);
    case 'POST':
      if (isFormData) {
        return api
          ._call(cleanUrl, { method: 'POST', body: options.body })
          .then((res) => (res ? res.json() : null));
      }
      return api.post(cleanUrl, options.body ? JSON.parse(options.body) : {});
    case 'PUT':
      if (isFormData) {
        return api
          ._call(cleanUrl, { method: 'PUT', body: options.body })
          .then((res) => (res ? res.json() : null));
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
    const date = new Date(dateString);
    if (dateString.length <= 10) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}
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
function setupDashboardStyles() {
  console.log('Setting up dashboard styles');
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
  }
  const dashboardContainer = document.getElementById('dashboard-container');
  if (dashboardContainer) {
    if (window.innerWidth < 768) {
      dashboardContainer.classList.add('mobile-layout');
    } else {
      dashboardContainer.classList.remove('mobile-layout');
    }
  }
  if (!document.getElementById('admin-table-styles')) {
    const tableStyles = document.createElement('style');
    tableStyles.id = 'admin-table-styles';
    tableStyles.textContent = `\n            .admin-table {\n                width: 100%;\n                border-collapse: collapse;\n                margin-bottom: 1rem;\n                font-size: 14px;\n            }\n            \n            .admin-table thead th {\n                text-align: left;\n                padding: 12px 8px;\n                background-color: #f5f5f5;\n                border-bottom: 2px solid #ddd;\n                font-weight: bold;\n                color: #333;\n            }\n            \n            .admin-table tbody td {\n                padding: 10px 8px;\n                border-bottom: 1px solid #eee;\n                vertical-align: middle;\n            }\n            \n            .event-list-thumbnail, .thumbnail {\n                display: inline-block;\n                width: 70px;\n                height: 70px;\n                border-radius: 4px;\n                overflow: hidden;\n                background-color: #f0f0f0;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                border: 1px solid #ddd;\n                box-shadow: 0 1px 3px #0000001a;\n            }\n            \n            .event-list-thumbnail img, .thumbnail img {\n                max-width: 100%;\n                max-height: 100%;\n                object-fit: cover;\n            }\n            \n            .admin-table-actions {\n                white-space: nowrap;\n            }\n            \n            .admin-table-actions button {\n                margin-right: 5px;\n                padding: 4px 8px;\n                border-radius: 4px;\n                border: 1px solid #ddd;\n                background-color: #f5f5f5;\n                cursor: pointer;\n                transition: all 0.2s ease;\n            }\n            \n            .admin-table-actions button:hover {\n                background-color: #e0e0e0;\n            }\n            \n            .admin-table-actions button.edit-event-btn, \n            .admin-table-actions button.edit-blog-btn {\n                background-color: #e7f5ff;\n                border-color: #90c8f2;\n                color: #0066cc;\n            }\n            \n            .admin-table-actions button.edit-event-btn:hover, \n            .admin-table-actions button.edit-blog-btn:hover {\n                background-color: #d0e8ff;\n            }\n            \n            .admin-table-actions button.delete-event-btn, \n            .admin-table-actions button.delete-blog-btn {\n                background-color: #fff2f2;\n                border-color: #ffb8b8;\n                color: #cc0000;\n            }\n            \n            .admin-table-actions button.delete-event-btn:hover, \n            .admin-table-actions button.delete-blog-btn:hover {\n                background-color: #ffe0e0;\n            }\n            \n            .event-divider, .blog-divider {\n                display: none;\n            }\n            \n            .empty-thumbnail, .no-image {\n                background-color: #eee;\n                color: #999;\n                font-size: 12px;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                height: 100%;\n                width: 100%;\n                border-radius: 4px;\n            }\n            \n            .venue-tag {\n                display: inline-block;\n                padding: 3px 8px;\n                border-radius: 4px;\n                font-size: 12px;\n                font-weight: bold;\n            }\n            \n            .venue-farewell {\n                background-color: #f8e9b0;\n                color: #8a6d3b;\n            }\n            \n            .venue-howdy {\n                background-color: #d4edda;\n                color: #155724;\n            }\n            \n            .thumbnail-cell {\n                text-align: center;\n            }\n            \n            .status-tag {\n                display: inline-block;\n                padding: 3px 8px;\n                border-radius: 4px;\n                font-size: 12px;\n                font-weight: bold;\n            }\n            \n            .event-past {\n                background-color: #f2f2f2;\n                color: #666;\n            }\n            \n            .event-upcoming {\n                background-color: #e0f7fa;\n                color: #006064;\n            }\n            \n            .post-recent {\n                background-color: #e8f5e9;\n                color: #2e7d32;\n            }\n            \n            .post-older {\n                background-color: #f5f5f5;\n                color: #616161;\n            }\n            \n            .featured-indicator {\n                margin-top: 4px;\n                font-size: 12px;\n                color: #ff6d00;\n            }\n            \n            .ticket-info {\n                margin-top: 4px;\n                font-size: 12px;\n            }\n            \n            .ticket-link {\n                color: #0066cc;\n                text-decoration: none;\n            }\n            \n            .ticket-link:hover {\n                text-decoration: underline;\n            }\n            \n            .event-row:hover, .blog-row:hover, .admin-table tbody tr:hover {\n                background-color: #f9f9f9;\n            }\n        `;
    document.head.appendChild(tableStyles);
    console.log('Added table styles to document head');
  }
}
function showSection(sectionName) {
  console.log(`Showing section: ${sectionName}`);
  const sections = document.querySelectorAll('.admin-section');
  sections.forEach((section) => section.classList.remove('active'));
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.classList.add('active');
    dashboardState.currentSection = sectionName;
    const navSelect = document.getElementById('admin-nav-select');
    if (navSelect) {
      navSelect.value = sectionName;
    }
    const sectionNames = {
      dashboard: 'Dashboard',
      events: 'Event Management',
      blog: 'Blog Management',
      'featured-videos': 'Featured Videos',
      venue: 'Venue Settings',
      help: 'Help & Documentation',
    };
    const sectionIndicator = document.getElementById('section-indicator');
    const breadcrumb = document.getElementById('breadcrumb');
    if (sectionIndicator) sectionIndicator.textContent = sectionNames[sectionName] || sectionName;
    if (breadcrumb) breadcrumb.textContent = `Home / ${sectionNames[sectionName] || sectionName}`;
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
        if (typeof loadMenus === 'function') {
          loadMenus('farewell');
        }
        break;
      case 'booking':
        loadBookingSubmissions();
        break;
      case 'import':
        setupImportHandlers();
        break;
      case 'featured-videos':
        if (
          window.featuredVideosManager &&
          typeof window.featuredVideosManager.init === 'function'
        ) {
          window.featuredVideosManager.init();
        } else {
          console.error('Featured Videos Manager not found');
        }
        break;
      case 'help':
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
  navItems.forEach((item) => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
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
      const sectionNames = {
        dashboard: 'Dashboard',
        events: 'Event Management',
        blog: 'Blog Management',
        venue: 'Venue Settings',
        booking: 'Booking Submissions',
        import: 'Import Legacy Data',
      };
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
async function logout() {
  console.log('Logging out...');
  try {
    const response = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    if (response.ok) {
      console.log('Logout successful');
      localStorage.clear();
      window.location.reload();
    } else {
      console.error('Logout failed:', response.statusText);
      window.location.reload();
    }
  } catch (error) {
    console.error('Logout error:', error);
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
  navSelect.addEventListener('change', (e) => {
    const selectedSection = e.target.value;
    console.log('Navigation changed to:', selectedSection);
    if (selectedSection === 'logout') {
      navSelect.value = dashboardState.currentSection || 'dashboard';
      logout();
      return;
    }
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
  await loadDashboardStats();
  console.log('Preloading venue settings...');
  await loadVenueSettings();
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
  try {
    const bc = await api.get('/api/admin/booking/unseen-count');
    const badge = document.getElementById('booking-badge');
    const statEl = document.getElementById('stats-unseen-bookings');
    const seenEl = document.getElementById('stats-seen-bookings');
    const card = document.getElementById('booking-stat-card');
    if (statEl) statEl.textContent = bc.unseen ?? bc.count;
    if (seenEl) seenEl.textContent = (bc.total ?? 0) - (bc.unseen ?? bc.count ?? 0);
    if (badge) {
      badge.textContent = bc.unseen ?? bc.count;
      badge.style.display = (bc.unseen ?? bc.count) > 0 ? 'inline' : 'none';
    }
    if (card) card.style.outline = (bc.unseen ?? bc.count) > 0 ? '2px solid #b0ee00' : '';
    if ((bc.unseen ?? bc.count) > 0)
      showAlert(
        `${bc.unseen ?? bc.count} new booking submission${(bc.unseen ?? bc.count) > 1 ? 's' : ''} — click Booking Requests to review.`,
        'info'
      );
  } catch (e) {}
  console.log('Loading dashboard stats...');
  try {
    const events = await api.get('/api/admin/events');
    const blogData = await api.get('/api/admin/blog/posts');
    console.log('Stats data loaded:', { events: events, blogData: blogData });
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
    updateRecentActivity(events, blogData?.data || []);
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}
function updateRecentActivity(events, blogPosts) {
  const activityList = document.getElementById('recent-activity-list');
  if (!activityList) {
    console.error('Recent activity list element not found');
    return;
  }
  const activities = [];
  if (Array.isArray(events)) {
    events.forEach((event) => {
      const timestamp = event.updated_at || event.created_at || Date.now();
      activities.push({
        type: 'event',
        title: event.title,
        date: new Date(event.date),
        venue: event.venue,
        timestamp: new Date(timestamp),
        action: event.updated_at ? 'updated' : 'created',
        id: event.id,
      });
    });
  }
  if (Array.isArray(blogPosts)) {
    blogPosts.forEach((post) => {
      const timestamp = post.updated_at || post.created_at || Date.now();
      activities.push({
        type: 'blog',
        title: post.title,
        date: new Date(post.created_at || Date.now()),
        timestamp: new Date(timestamp),
        action: post.updated_at && post.updated_at !== post.created_at ? 'updated' : 'created',
        id: post.id,
      });
    });
  }
  activities.sort((a, b) => b.timestamp - a.timestamp);
  const recentActivities = activities.slice(0, 5);
  if (recentActivities.length === 0) {
    activityList.innerHTML = '<div class="empty-message">No recent activity</div>';
    return;
  }
  activityList.innerHTML = recentActivities
    .map((activity) => {
      const isEvent = activity.type === 'event';
      const icon = isEvent ? '🎪' : '📝';
      const typeLabel = isEvent ? 'Event' : 'Blog Post';
      const dateStr = formatDate(activity.date);
      const detailText = isEvent ? `${activity.venue?.toUpperCase() || ''} | ${dateStr}` : dateStr;
      const actionText = activity.action === 'updated' ? 'Updated' : 'Added';
      const timeAgo = getTimeAgo(activity.timestamp);
      return `\n            <div class="activity-item">\n                <span class="activity-icon">${icon}</span>\n                <div class="activity-content">\n                    <div class="activity-title">${activity.title}</div>\n                    <div class="activity-meta">\n                        <span class="activity-type">${actionText} ${timeAgo}</span>\n                        <span class="activity-details">${typeLabel}: ${detailText}</span>\n                    </div>\n                </div>\n            </div>\n        `;
    })
    .join('');
  if (!document.getElementById('activity-feed-styles')) {
    const style = document.createElement('style');
    style.id = 'activity-feed-styles';
    style.textContent = `\n            .activity-feed {\n                max-height: 300px;\n                overflow-y: auto;\n            }\n            .activity-item {\n                display: flex;\n                padding: 10px;\n                border-bottom: 1px solid #eee;\n                align-items: center;\n            }\n            .activity-item:last-child {\n                border-bottom: none;\n            }\n            .activity-icon {\n                font-size: 1.5rem;\n                margin-right: 15px;\n            }\n            .activity-content {\n                flex: 1;\n            }\n            .activity-title {\n                font-weight: bold;\n                margin-bottom: 3px;\n            }\n            .activity-meta {\n                font-size: 0.8rem;\n                color: #666;\n                display: flex;\n                justify-content: space-between;\n            }\n            .empty-message {\n                padding: 20px;\n                text-align: center;\n                color: #888;\n            }\n        `;
    document.head.appendChild(style);
  }
}
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1e3);
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
    currentEvents = events;
    renderEvents(events);
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
  eventList.innerHTML =
    `<table class="admin-table">\n        <thead>\n            <tr>\n                <th>&nbsp;</th>\n                <th>&nbsp;</th>\n                <th>&nbsp;</th>\n                <th>&nbsp;</th>\n                <th>&nbsp;</th>\n                <th>&nbsp;</th>\n            </tr>\n        </thead>\n        <tbody>` +
    events
      .map((ev) => {
        const eventDate = new Date(ev.date);
        const today = new Date();
        console.log('RAW EVENT DATE:', eventDate, 'TYPE:', typeof eventDate);
        const isPast = isPastEvent(eventDate);
        const isToday = isTodayEvent(eventDate);
        console.log(`Event: ${ev.title}`);
        console.log('Parsed event date:', parseEventDate(eventDate));
        console.log(
          'Today at midnight:',
          new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
        );
        console.log('isPast:', isPast, 'isToday:', isToday);
        const isTrulyPast = isPast && !isToday;
        const statusClass = isTrulyPast ? 'event-past' : 'event-upcoming';
        const statusText = isTrulyPast ? 'Past' : 'Upcoming';
        return `<tr class="event-row venue-${ev.venue || 'unknown'}">\n                <td class="thumbnail-cell" style="width: 80px; vertical-align: middle; text-align: center;">\n                    ${ev.flyer_image_url || ev.imageUrl ? `<div class="thumbnail"><img src="${ev.flyer_image_url || ev.imageUrl}" alt="${ev.title || 'Event'} flyer" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>` : `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`}\n                </td>\n                <td style="vertical-align: middle;">\n                    <strong>${ev.title || 'Untitled'}</strong>\n                    ${ev.ticketLink ? `<div class="ticket-info"><a href="${ev.ticketLink}" target="_blank" class="ticket-link">🎟️ Tickets</a></div>` : ''}\n                </td>\n                <td style="vertical-align: middle;">${formatDate(ev.date)}</td>\n                <td style="vertical-align: middle;"><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>\n                <td style="vertical-align: middle;"><span class="status-tag ${statusClass}">${statusText}</span></td>\n                <td class='admin-table-actions' style="vertical-align: middle;">\n                    <button class="edit-event-btn" data-id="${ev.id}">Edit</button>\n                    <button class="delete-event-btn" data-id="${ev.id}">Delete</button>\n                </td>\n            </tr>`;
      })
      .join('') +
    `</tbody></table>`;
  eventList.querySelectorAll('.edit-event-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      console.log('Edit event button clicked for id:', id);
      editEvent(id);
    });
  });
  eventList.querySelectorAll('.delete-event-btn').forEach((btn) => {
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
    currentBlogPosts = result.data;
    renderBlogPosts(result.data, true);
  }
}
function renderBlogPosts(posts, setupFilters = true) {
  const blogList = document.getElementById('blog-list');
  if (!blogList) return;
  if (!posts || posts.length === 0) {
    blogList.innerHTML = `<div class='status-message status-info'>No blog posts.</div>`;
    return;
  }
  blogList.innerHTML =
    `<table class="admin-table">\n        <thead>\n            <tr>\n                <th style="width: 80px; text-align: center;">Image</th>\n                <th>Title</th>\n                <th>Date</th>\n                <th>Status</th>\n                <th>Actions</th>\n            </tr>\n        </thead>\n        <tbody>` +
    posts
      .map((post) => {
        const postDate = new Date(post.date || post.created_at || new Date());
        const today = new Date();
        const daysDiff = Math.floor((today - postDate) / (1e3 * 60 * 60 * 24));
        const isRecent = daysDiff <= 7;
        const statusClass = isRecent ? 'post-recent' : 'post-older';
        const statusText = isRecent ? 'Recent' : 'Older';
        return `<tr class="blog-row">\n                <td class="thumbnail-cell" style="width: 80px; vertical-align: middle; text-align: center;">\n                    ${
          post.featured_image_url
            ? `<div class="thumbnail"><img src="${post.featured_image_url}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>`
            : (() => {
                const imgMatch = post.content?.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch && imgMatch[1]) {
                  return `<div class="thumbnail"><img src="${imgMatch[1]}" alt="${post.title}" loading="lazy" style="max-width: 70px; max-height: 70px; object-fit: cover;"></div>`;
                }
                return `<div class="thumbnail empty-thumbnail"><span>No Image</span></div>`;
              })()
        }\n                </td>\n                <td style="vertical-align: middle;">\n                    <strong>${post.title}</strong>\n                    ${post.featured ? `<div class="featured-indicator">⭐ Featured</div>` : ''}\n                </td>\n                <td style="vertical-align: middle;">${formatDate(post.date || post.created_at)}</td>\n                <td style="vertical-align: middle;"><span class="status-tag ${statusClass}">${statusText}</span></td>\n                <td class='admin-table-actions' style="vertical-align: middle;">\n                    <button class="edit-blog-btn" data-id="${post.id}">Edit</button>\n                    <button class="delete-blog-btn" data-id="${post.id}">Delete</button>\n                </td>\n            </tr>`;
      })
      .join('') +
    `</tbody></table>`;
  blogList.querySelectorAll('.edit-blog-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      console.log('Edit blog button clicked for id:', id);
      editBlogPost(id);
    });
  });
  blogList.querySelectorAll('.delete-blog-btn').forEach((btn) => {
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
  const venueFilter = document.getElementById('event-venue-filter');
  const searchInput = document.getElementById('event-search');
  if (!venueFilter || !searchInput) {
    console.error('Event filter elements not found');
    return;
  }
  const filterEvents = () => {
    const venueValue = venueFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();
    const eventRows = document.querySelectorAll('#event-list tr.event-row');
    let visibleCount = 0;
    eventRows.forEach((row) => {
      const venue = row.getAttribute('data-venue')?.toLowerCase() || '';
      const searchableText = row.textContent.toLowerCase();
      const matchesVenue = !venueValue || venue === venueValue;
      const matchesSearch = !searchValue || searchableText.includes(searchValue);
      if (matchesVenue && matchesSearch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    const emptyMessage = document.querySelector('#event-list .empty-message');
    if (visibleCount === 0 && !emptyMessage) {
      const noResults = document.createElement('tr');
      noResults.className = 'empty-message';
      noResults.innerHTML = `<td colspan="5" class="text-center">No events match the current filters</td>`;
      document.querySelector('#event-list tbody').appendChild(noResults);
    } else if (visibleCount > 0 && emptyMessage) {
      emptyMessage.remove();
    }
  };
  venueFilter.addEventListener('change', filterEvents);
  searchInput.addEventListener('input', filterEvents);
  filterEvents();
}
function setupBlogFilters() {
  console.log('Setting up blog filters');
  const statusFilter = document.getElementById('blog-status-filter');
  const searchInput = document.getElementById('blog-search');
  if (!statusFilter || !searchInput) {
    console.error('Blog filter elements not found');
    return;
  }
  const filterBlogPosts = () => {
    const statusValue = statusFilter.value.toLowerCase();
    const searchValue = searchInput.value.toLowerCase();
    const blogRows = document.querySelectorAll('#blog-list tr.blog-row');
    let visibleCount = 0;
    blogRows.forEach((row) => {
      const isFeatured = row.classList.contains('blog-featured');
      const status = isFeatured ? 'featured' : 'regular';
      const searchableText = row.textContent.toLowerCase();
      const matchesStatus =
        !statusValue ||
        statusValue === 'all' ||
        (statusValue === 'featured' && isFeatured) ||
        (statusValue === 'regular' && !isFeatured);
      const matchesSearch = !searchValue || searchableText.includes(searchValue);
      if (matchesStatus && matchesSearch) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });
    const emptyMessage = document.querySelector('#blog-list .empty-message');
    if (visibleCount === 0 && !emptyMessage) {
      const noResults = document.createElement('tr');
      noResults.className = 'empty-message';
      noResults.innerHTML = `<td colspan="4" class="text-center">No blog posts match the current filters</td>`;
      document.querySelector('#blog-list tbody').appendChild(noResults);
    } else if (visibleCount > 0 && emptyMessage) {
      emptyMessage.remove();
    }
  };
  statusFilter.addEventListener('change', filterBlogPosts);
  searchInput.addEventListener('input', filterBlogPosts);
  filterBlogPosts();
}
async function loadVenueSettings(venue) {
  if (!venue) {
    const venueSelector = document.getElementById('venue-selector');
    venue = venueSelector ? venueSelector.value || 'farewell' : 'farewell';
  }
  console.log(`Loading venue settings for venue: ${venue}`);
  window.currentVenue = venue;
  if (venue === 'farewell') {
    await loadHours();
  }
  console.log(`Menu management for venue ${venue} is handled by menu-management.js`);
  return;
}
function toggleMenuReorderMode() {
  console.log('Toggling menu reorder mode');
  const menuList = document.getElementById('menu-list');
  const reorderBtn = document.getElementById('reorder-menu-btn');
  if (!menuList || !reorderBtn) {
    console.error('Menu list or reorder button not found');
    return;
  }
  const isInReorderMode = menuList.classList.contains('reorder-mode');
  if (isInReorderMode) {
    menuList.classList.remove('reorder-mode');
    reorderBtn.textContent = 'Reorder Menu';
    saveMenuOrder();
  } else {
    menuList.classList.add('reorder-mode');
    reorderBtn.textContent = 'Save Order';
    setupDragAndDrop();
  }
}
function setupDragAndDrop() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach((item) => {
    if (!item.querySelector('.drag-handle')) {
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';
      dragHandle.innerHTML = '⋮⋮';
      item.insertBefore(dragHandle, item.firstChild);
    }
    item.setAttribute('draggable', 'true');
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
  });
}
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
    const thisCategory = this.closest('.menu-category');
    const draggedCategory = draggedItem.closest('.menu-category');
    if (thisCategory === draggedCategory) {
      const itemsContainer = thisCategory.querySelector('.menu-items');
      if (this.nextSibling === draggedItem) {
        itemsContainer.insertBefore(draggedItem, this);
      } else {
        itemsContainer.insertBefore(draggedItem, this.nextSibling);
      }
    } else {
      const itemsContainer = thisCategory.querySelector('.menu-items');
      itemsContainer.insertBefore(draggedItem, this.nextSibling);
      const categoryName = thisCategory.querySelector('.menu-category-header h4').textContent;
      draggedItem.dataset.category = categoryName;
    }
  }
  this.classList.remove('drag-over');
}
function handleDragEnd() {
  this.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach((item) => {
    item.classList.remove('drag-over');
  });
}
async function saveMenuOrder() {
  const menuItems = document.querySelectorAll('.menu-item');
  const items = [];
  menuItems.forEach((item, index) => {
    items.push({
      id: item.dataset.itemId,
      display_order: index,
      category:
        item.dataset.category ||
        item.closest('.menu-category').querySelector('.menu-category-header h4').textContent,
    });
  });
  console.log('Saving menu order with items:', items);
  try {
    const response = await apiCall('/api/admin/menu-items/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items }),
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
function groupMenuItemsByCategory(menuItems) {
  const grouped = {};
  menuItems.forEach((item) => {
    const category = item.category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(item);
  });
  return grouped;
}
function renderMenuItems(menuItemsByCategory, container) {
  container.innerHTML = '';
  const categories = Object.keys(menuItemsByCategory);
  if (categories.length === 0) {
    container.innerHTML =
      '<div class="empty-state">No menu items found. Click "Add Menu Item" to create one.</div>';
    return;
  }
  categories.sort().forEach((category) => {
    const items = menuItemsByCategory[category];
    const categorySection = document.createElement('div');
    categorySection.className = 'menu-category';
    categorySection.innerHTML = `\n            <div class="menu-category-header">\n                <h4>${escapeHTML(category)}</h4>\n                <span class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>\n            </div>\n            <div class="menu-items"></div>\n        `;
    const menuItemsContainer = categorySection.querySelector('.menu-items');
    items.forEach((item) => {
      const menuItemEl = document.createElement('div');
      menuItemEl.className = `menu-item ${item.active ? 'active' : 'inactive'}`;
      menuItemEl.dataset.itemId = item.id;
      menuItemEl.innerHTML = `\n                <div class="menu-item-details">\n                    <div class="menu-item-name">${escapeHTML(item.name)}</div>\n                    <div class="menu-item-price">$${parseFloat(item.price || 0).toFixed(2)}</div>\n                </div>\n                <div class="menu-item-description">${escapeHTML(item.description || '')}</div>\n                <div class="menu-item-actions">\n                    <button class="btn btn-sm btn-primary edit-menu-item-btn">Edit</button>\n                    <button class="btn btn-sm btn-danger delete-menu-item-btn">Delete</button>\n                </div>\n            `;
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
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function showMenuItemForm(item = null, venue = null) {
  if (!venue) venue = currentVenue;
  console.log(`Showing menu item form for venue: ${venue}`, item);
  const isEditing = !!item;
  const modal = document.getElementById('menu-item-modal');
  const modalTitle = document.getElementById('menu-item-modal-title');
  if (!modal) {
    console.error('Menu item modal not found');
    return;
  }
  if (modalTitle) {
    modalTitle.textContent = isEditing ? 'Edit Menu Item' : 'Add Menu Item';
  }
  if (item) {
    modal.dataset.itemId = item.id;
  } else {
    delete modal.dataset.itemId;
  }
  modal.dataset.venue = venue;
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
  console.log('Adding show class to menu item modal');
  modal.classList.add('show');
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.zIndex = '99999';
  modal.style.backgroundColor = '#000000cc';
  modal.style.opacity = '1';
  console.log('Menu modal classes after:', modal.className);
  setupMenuItemForm();
  setupFileUploadHandlers();
}
function closeMenuItemForm() {
  const modal = document.getElementById('menu-item-modal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.style.opacity = '0';
    const form = document.getElementById('menu-item-form');
    if (form) form.reset();
  }
}
function setupMenuItemForm() {
  const form = document.getElementById('menu-item-form');
  if (form) {
    console.log('Setting up menu item form submission handler');
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
        menu_id: 1,
      };
      console.log('Submitting menu item data:', data);
      try {
        let response;
        if (isEditing) {
          console.log(`Updating menu item ${itemId} with:`, data);
          response = await apiCall(`/api/admin/menu-items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } else {
          console.log('Creating new menu item with:', data);
          console.log(`Using venue for new menu item: ${venue}`);
          response = await apiCall(`/api/admin/venues/${venue}/menu-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        }
        if (response && response.success) {
          console.log(`Menu item saved successfully for venue: ${venue}`);
          showToast('Menu item saved successfully', 'success');
          closeMenuItemForm();
          loadVenueSettings(venue);
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
function setupHelpSectionLinks() {
  console.log('Setting up help section links');
}
function setupImportHandlers() {
  console.log('Setting up import handlers');
  const importButtons = document.querySelectorAll('.import-btn');
  importButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const importType = btn.dataset.importType;
      console.log(`Import ${importType} clicked`);
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
if (!window.featuredVideosManager) {
  window.featuredVideosManager = {
    init: function () {
      console.log('Featured Videos Manager initialized');
      this.loadVideos();
      this.setupEventHandlers();
    },
    loadVideos: async function () {
      try {
        const videos = await api.get('/api/admin/featured');
        console.log('Featured videos loaded:', videos);
        this.renderVideos(videos?.data || []);
      } catch (error) {
        console.error('Error loading featured videos:', error);
        showToast('Failed to load featured videos', 'error');
      }
    },
    renderVideos: function (videos) {
      const container = document.getElementById('featured-videos-list');
      if (!container) return;
      if (!videos || videos.length === 0) {
        container.innerHTML =
          '<div class="empty-state">No featured videos found. Add some videos to get started.</div>';
        return;
      }
      container.innerHTML = videos
        .map(
          (video) =>
            `\n                <div class="video-item" data-id="${video.id}">\n                    <div class="video-thumbnail">\n                        <img src="${video.thumbnail_url}" alt="${video.title}" loading="lazy">\n                    </div>\n                    <div class="video-info">\n                        <h4>${video.title}</h4>\n                        <p>${video.description || ''}</p>\n                        <div class="video-actions">\n                            <button class="btn btn-sm edit-video-btn" data-id="${video.id}">Edit</button>\n                            <button class="btn btn-sm btn-danger delete-video-btn" data-id="${video.id}">Delete</button>\n                        </div>\n                    </div>\n                </div>\n            `
        )
        .join('');
    },
    setupEventHandlers: function () {
      const addVideoBtn = document.getElementById('add-featured-video-btn');
      if (addVideoBtn) {
        addVideoBtn.addEventListener('click', () => this.showVideoForm());
      }
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
    showVideoForm: function (video = null) {
      console.log('Show video form:', video);
      showToast('Featured video management coming soon', 'info');
    },
    editVideo: function (videoId) {
      console.log('Edit video:', videoId);
      showToast('Video editing coming soon', 'info');
    },
    deleteVideo: function (videoId) {
      console.log('Delete video:', videoId);
      if (confirm('Are you sure you want to delete this video?')) {
        showToast('Video deletion coming soon', 'info');
      }
    },
  };
}
const DAYS_OF_WEEK = [
  { value: 0, name: 'Sunday' },
  { value: 1, name: 'Monday' },
  { value: 2, name: 'Tuesday' },
  { value: 3, name: 'Wednesday' },
  { value: 4, name: 'Thursday' },
  { value: 5, name: 'Friday' },
  { value: 6, name: 'Saturday' },
];
async function loadHours() {
  console.log('Loading business hours for Farewell...');
  try {
    const response = await fetch('/api/hours?venue=farewell', {
      method: 'GET',
      credentials: 'include',
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
      displayHoursEditor([]);
    }
  } catch (error) {
    console.error('Error loading hours:', error);
    showAlert('Error loading business hours. Please try again.', 'error');
    displayHoursEditor([]);
  }
}
function displayHoursEditor(hours) {
  const container = document.getElementById('hours-editor');
  if (!container) {
    console.error('Hours editor container not found');
    return;
  }
  const hoursData = {};
  DAYS_OF_WEEK.forEach((day) => {
    const existingHour = hours.find((h) => h.day_of_week === day.value);
    hoursData[day.value] = existingHour || {
      day_of_week: day.value,
      open_time: '09:00',
      close_time: '17:00',
      is_closed: false,
      notes: '',
    };
  });
  container.innerHTML = `\n        <div class="alert alert-info" style="margin-bottom: 20px;">\n            <strong>Farewell Cafe Hours:</strong> Set the regular business hours for Farewell Cafe. \n            These will be displayed on the public website.\n        </div>\n        \n        <table class="hours-table">\n            <thead>\n                <tr>\n                    <th>Day</th>\n                    <th>Open Time</th>\n                    <th>Close Time</th>\n                    <th>Closed</th>\n                    <th>Notes</th>\n                </tr>\n            </thead>\n            <tbody>\n                ${DAYS_OF_WEEK.map(
    (day) => {
      const dayData = hoursData[day.value];
      return `\n                        <tr class="${dayData.is_closed ? 'closed' : ''}">\n                            <td><strong>${day.name}</strong></td>\n                            <td>\n                                <input type="time" \n                                       id="open-${day.value}" \n                                       value="${dayData.open_time || '09:00'}"\n                                       ${dayData.is_closed ? 'disabled' : ''} />\n                            </td>\n                            <td>\n                                <input type="time" \n                                       id="close-${day.value}" \n                                       value="${dayData.close_time || '17:00'}"\n                                       ${dayData.is_closed ? 'disabled' : ''} />\n                            </td>\n                            <td>\n                                <input type="checkbox" \n                                       id="closed-${day.value}"\n                                       ${dayData.is_closed ? 'checked' : ''}\n                                       onchange="toggleDayStatus(${day.value})" />\n                            </td>\n                            <td>\n                                <input type="text" \n                                       id="notes-${day.value}" \n                                       value="${dayData.notes || ''}"\n                                       placeholder="Special notes..."\n                                       ${dayData.is_closed ? 'disabled' : ''} />\n                            </td>\n                        </tr>\n                    `;
    }
  ).join(
    ''
  )}\n            </tbody>\n        </table>\n        \n        <div style="margin-top: 20px;">\n            <button type="button" class="btn-primary" onclick="saveHours()">\n                Save Hours\n            </button>\n            <button type="button" class="btn-secondary" onclick="loadHours()">\n                Reset\n            </button>\n        </div>\n    `;
}
function toggleDayStatus(dayValue) {
  const isClosedCheckbox = document.getElementById(`closed-${dayValue}`);
  const openInput = document.getElementById(`open-${dayValue}`);
  const closeInput = document.getElementById(`close-${dayValue}`);
  const notesInput = document.getElementById(`notes-${dayValue}`);
  const row = isClosedCheckbox.closest('tr');
  const isClosed = isClosedCheckbox.checked;
  openInput.disabled = isClosed;
  closeInput.disabled = isClosed;
  notesInput.disabled = isClosed;
  if (isClosed) {
    row.classList.add('closed');
  } else {
    row.classList.remove('closed');
  }
}
async function saveHours() {
  console.log('Saving business hours...');
  try {
    const hoursData = DAYS_OF_WEEK.map((day) => {
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
        notes: notesInput.value.trim(),
      };
    });
    console.log('Hours data to save:', hoursData);
    const response = await fetch('/api/admin/hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ venue: 'farewell', hours: hoursData }),
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
function normalizeLegacyEventForEditing(eventData) {
  const normalized = {
    id: eventData.id,
    title: eventData.title || '',
    date: eventData.date || '',
    venue: eventData.venue || 'farewell',
    description: eventData.description || '',
    event_time: eventData.event_time || eventData.time || '',
    flyer_image_url: eventData.flyer_image_url || eventData.imageUrl || '',
    ticket_url: eventData.ticket_url || eventData.ticketLink || '',
    price: eventData.price || eventData.suggestedPrice || '',
    age_restriction: eventData.age_restriction || eventData.ageRestriction || '',
    status: eventData.status || 'active',
    is_featured: eventData.is_featured || false,
  };
  console.log('Normalized legacy event:', normalized);
  return normalized;
}
async function repairLegacyEvents() {
  try {
    showToast('Starting legacy event repair...', 'info');
    const events = await api.get('/api/admin/events');
    if (!events || !Array.isArray(events)) {
      showToast('Failed to load events for repair', 'error');
      return;
    }
    let repairedCount = 0;
    for (const event of events) {
      let needsUpdate = false;
      const updates = { id: event.id };
      if (!event.flyer_image_url && event.imageUrl) {
        updates.flyer_image_url = event.imageUrl;
        needsUpdate = true;
        console.log(`Repairing flyer URL for event ${event.id}: ${event.imageUrl}`);
      }
      if (!event.event_time && event.time) {
        updates.event_time = event.time;
        needsUpdate = true;
        console.log(`Repairing event time for event ${event.id}: ${event.time}`);
      }
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
            body: JSON.stringify(updates),
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
      loadEvents();
    } else {
      showToast('No legacy events needed repair', 'info');
    }
  } catch (error) {
    console.error('Error during legacy event repair:', error);
    showToast('Error during legacy event repair: ' + error.message, 'error');
  }
}
function setupFileUploadHandlers() {
  console.log('Setting up file upload handlers');
  const eventFlyerUpload = document.getElementById('event-flyer-upload');
  if (eventFlyerUpload) {
    eventFlyerUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Event flyer file selected:', file.name);
        if (!file.type.startsWith('image/')) {
          showToast('Please select an image file', 'error');
          e.target.value = '';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast('File size must be less than 5MB', 'error');
          e.target.value = '';
          return;
        }
        showToast('Image selected: ' + file.name, 'info');
      }
    });
  }
  const blogImageUpload = document.getElementById('blog-image-upload');
  if (blogImageUpload) {
    blogImageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Blog image file selected:', file.name);
        if (!file.type.startsWith('image/')) {
          showToast('Please select an image file', 'error');
          e.target.value = '';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast('File size must be less than 5MB', 'error');
          e.target.value = '';
          return;
        }
        showToast('Image selected: ' + file.name, 'info');
      }
    });
  }
  const menuImageUpload = document.getElementById('menu-item-image-upload');
  if (menuImageUpload) {
    menuImageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Menu item image file selected:', file.name);
        if (!file.type.startsWith('image/')) {
          showToast('Please select an image file', 'error');
          e.target.value = '';
          return;
        }
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
async function loadBookingSubmissions() {
  const section = document.getElementById('section-booking');
  if (!section) return;
  section.innerHTML = '<h2>Booking Submissions</h2><p>Loading...</p>';
  try {
    const data = await api.get('/api/admin/booking/submissions');
    const submissions = data.data || [];
    const unseen = submissions.filter((s) => !s.seen).length;
    const badge = document.getElementById('booking-badge');
    if (badge) {
      badge.textContent = unseen;
      badge.style.display = unseen > 0 ? 'inline' : 'none';
    }
    let html = `<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">\n            <h2 style="margin:0;">Booking Submissions (${submissions.length})</h2>\n            ${unseen > 0 ? `<button onclick="markAllBookingsSeen()" style="padding:0.4rem 1rem; cursor:pointer;">Mark all as seen</button>` : ''}\n        </div>`;
    if (submissions.length === 0) {
      html += '<p>No submissions yet.</p>';
    } else {
      submissions.forEach((s) => {
        const bg = s.seen ? 'transparent' : '#b0ee0014';
        const border = s.seen ? '1px solid var(--nav-border-color)' : '2px solid #b0ee00';
        html += `<div style="border:${border}; background:${bg}; padding:1rem; margin-bottom:0.75rem; border-radius:4px;">\n                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">\n                        <strong style="font-size:1.1rem;">${s.artist_name}</strong>\n                        <span style="font-size:0.85rem; opacity:0.6;">${new Date(s.created_at).toLocaleDateString()}</span>\n                    </div>\n                    <div style="margin-top:0.4rem; font-size:0.95rem;">\n                        <div>📧 <a href="mailto:${s.email}">${s.email}</a></div>\n                        <div>🎵 <a href="${s.music_link}" target="_blank" rel="noopener">${s.music_link}</a></div>\n                        ${s.social_link ? `<div>🔗 <a href="${s.social_link}" target="_blank" rel="noopener">${s.social_link}</a></div>` : ''}\n                        ${s.genre ? `<div>🎸 ${s.genre}</div>` : ''}\n                        ${s.notes ? `<div style="margin-top:0.4rem; font-style:italic;">${s.notes}</div>` : ''}\n                    </div>\n                    ${!s.seen ? `<button onclick="markBookingSeen(${s.id})" style="margin-top:0.5rem; padding:0.3rem 0.8rem; font-size:0.85rem; cursor:pointer;">Mark seen</button>` : '<span style="font-size:0.8rem; opacity:0.5;">✓ seen</span>'}\n                    <button onclick="deleteBooking(${s.id})" style="margin-top:0.5rem; margin-left:0.5rem; padding:0.3rem 0.8rem; font-size:0.85rem; cursor:pointer; background:#ff2b13; color:#fff; border:none;">Delete</button>\n                </div>`;
      });
    }
    section.innerHTML = html;
  } catch (e) {
    section.innerHTML =
      '<h2>Booking Submissions</h2><p style="color:#ff2b13;">Failed to load submissions.</p>';
  }
}
async function markBookingSeen(id) {
  await api.post(`/api/admin/booking/submissions/${id}/seen`, {});
  loadBookingSubmissions();
}
async function markAllBookingsSeen() {
  await api.post('/api/admin/booking/mark-all-seen', {});
  loadBookingSubmissions();
}
async function deleteBooking(id) {
  if (!confirm('Delete this submission?')) return;
  await api.delete(`/api/admin/booking/submissions/${id}`);
  loadBookingSubmissions();
  loadDashboardStats();
}
