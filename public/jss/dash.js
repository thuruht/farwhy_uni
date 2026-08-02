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
function showLoginScreen() {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  if (dashboardContainer) dashboardContainer.style.display = 'none';
  if (!loginContainer) return;
  loginContainer.innerHTML = `\n        <div class="login-page" style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; background: var(--bg-dark);">\n            <div class="login-form-container" style="max-width: 400px; width: 100%; padding: 2.5rem; background: var(--bg-light); border: 1px solid var(--border-color); border-radius: 12px;">\n                <h1 style="text-align: center; color: var(--cyan); font-family: var(--font-display);">F/H Admin</h1>\n                <form id="loginForm">\n                    <div class="form-group"><label for="username">Username</label><input type="text" id="username" name="username" required autocomplete="username"></div>\n                    <div class="form-group"><label for="password">Password</label><input type="password" id="password" name="password" required autocomplete="current-password"></div>\n                    <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem;">Log In</button>\n                    <div id="login-error" style="color: var(--error); margin-top: 1rem; text-align: center; min-height: 1.2em;"></div>\n                </form>\n            </div>\n        </div>\n    `;
  document.getElementById('loginForm')?.addEventListener('submit', handleLoginSubmit);
}
function showDashboard() {
  const loginContainer = document.getElementById('login-container');
  const dashboardContainer = document.getElementById('dashboard-container');
  if (loginContainer) loginContainer.innerHTML = '';
  if (dashboardContainer) dashboardContainer.style.display = 'grid';
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
      body: JSON.stringify(data),
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
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Admin] App initializing...');
  const sessionToken = getCookie('sessionToken');
  if (!sessionToken) {
    console.log('[Admin] No session token found. Showing login screen.');
    showLoginScreen();
    return;
  }
  try {
    const authResponse = await fetch('/api/check', { credentials: 'include', cache: 'no-store' });
    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.success && authData.user) {
        currentUser = authData.user;
        showDashboard();
        return;
      }
    }
    document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    showLoginScreen();
  } catch (error) {
    console.error('Auth check failed, showing login screen.', error);
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
      const response = await fetch(endpoint, {
        ...options,
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.status === 401) {
        console.error('API Auth failed (401)');
        showLoginScreen();
        return null;
      }
      if (!response.ok) {
        console.error(`API Error for ${endpoint}: ${response.status}`);
        showToast(`API Error: ${response.status}`, 'error');
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
    return await this._call(endpoint);
  },
  post: async function (endpoint, data) {
    return await this._call(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  put: async function (endpoint, data) {
    return await this._call(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  delete: async function (endpoint) {
    return await this._call(endpoint, { method: 'DELETE' });
  },
};
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
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
  }, 3e3);
}
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
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      navItems.forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      showSection(target);
      const sectionNames = {
        dashboard: 'Dashboard',
        events: 'Event Management',
        blog: 'Blog Management',
        venue: 'Venue Settings',
        import: 'Import Legacy Data',
      };
      if (mainTitle) mainTitle.textContent = sectionNames[target] || target;
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
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar && !sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }
}
function setupModal() {
  const modal = document.getElementById('form-modal');
  const closeBtn = modal?.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
}
function setupToasts() {}
function showSection(sectionName) {
  const sections = document.querySelectorAll('.admin-section');
  sections.forEach((section) => section.classList.remove('active'));
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) {
    targetSection.classList.add('active');
    dashboardState.currentSection = sectionName;
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
  }
}
async function loadInitialData() {
  const currentUserEl = document.getElementById('current-user');
  if (currentUserEl && currentUser) currentUserEl.textContent = currentUser.username;
}
async function loadDashboardStats() {
  const eventsRes = await api.get('/api/admin/events');
  const blogRes = await api.get('/api/admin/blog/posts');
  if (eventsRes) {
    const events = await eventsRes.json();
    document.getElementById('stats-total-events').textContent = Array.isArray(events)
      ? events.length
      : 0;
  }
  if (blogRes) {
    const blogData = await blogRes.json();
    document.getElementById('stats-total-posts').textContent = blogData.length || 0;
  }
}
async function loadEvents() {
  const response = await api.get('/api/admin/events');
  if (response) {
    const events = await response.json();
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
  eventList.innerHTML =
    `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>` +
    events
      .map(
        (ev) =>
          `<tr>\n            <td><strong>${ev.title || 'Untitled'}</strong></td>\n            <td>${formatDate(ev.date)}</td>\n            <td><span class="venue-tag venue-${ev.venue}">${ev.venue || 'N/A'}</span></td>\n            <td class='admin-table-actions'>\n                <button onclick='editEvent("${ev.id}")'>Edit</button>\n                <button onclick='deleteEvent("${ev.id}")'>Delete</button>\n            </td>\n        </tr>`
      )
      .join('') +
    `</tbody></table>`;
}
function setupEventFilters() {}
function showEventForm(id = null) {
  showToast('Event form not fully implemented in this version.');
}
function loadBlogPosts() {
  showToast('Blog functionality not fully implemented in this version.');
}
function loadVenueSettings() {
  showToast('Venue settings not yet implemented.', 'info');
}
function setupImportHandlers() {
  showToast('Import functionality not yet implemented.', 'info');
}
window.editEvent = (id) => showEventForm(id);
window.deleteEvent = (id) => showToast('Delete not implemented.', 'warning');
