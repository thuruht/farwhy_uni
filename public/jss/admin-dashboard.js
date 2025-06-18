// Extracted admin dashboard JS from the HTML template
// --- SPA Navigation ---
const navs = [
  { btn: document.getElementById('nav-events'), section: 'events' },
  { btn: document.getElementById('nav-import'), section: 'import' },
  { btn: document.getElementById('nav-blog'), section: 'blog' }
];
navs.forEach(({btn, section}) => {
  btn.onclick = () => {
    navs.forEach(({btn: b, section: s}) => {
      b.classList.toggle('active', s === section);
      document.getElementById(`section-${s}`).classList.toggle('active', s === section);
    });
  };
});
document.getElementById('nav-logout').onclick = async () => {
  await fetch('/admin/api/logout', { method: 'POST' });
  window.location.href = '/admin/login';
};

// --- Event CRUD ---
async function fetchEvents() {
  try {
    const res = await fetch('/admin/api/events');
    const events = await res.json();
    
    if (!Array.isArray(events)) {
      return document.getElementById('event-list').innerHTML = `<div class='status-message status-error'>Failed to load events: Invalid response format</div>`;
    }
    
    if (events.length === 0) {
      return document.getElementById('event-list').innerHTML = `<div class='status-message status-info'>No events found. Use the Import Legacy button to load events.</div>`;
    }
    
    let html = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Venue</th><th>Actions</th></tr></thead><tbody>`;
    for (const ev of events) {
      html += `<tr>
        <td><strong>${ev.title}</strong></td>
        <td>${new Date(ev.date).toLocaleDateString()}</td>
        <td><span style="text-transform: capitalize; color: var(--${ev.venue === 'farewell' ? 'blue' : 'magenta'});">${ev.venue}</span></td>
        <td class='admin-table-actions'>
          <button onclick='editEvent("${ev.id}")'>Edit</button>
          <button onclick='deleteEvent("${ev.id}")'>Delete</button>
        </td>
      </tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById('event-list').innerHTML = html;
  } catch (error) {
    console.error('Error fetching events:', error);
    document.getElementById('event-list').innerHTML = `<div class='status-message status-error'>Error loading events: ${error.message}</div>`;
  }
}
fetchEvents();
document.getElementById('add-event-btn').onclick = () => showEventForm();
window.editEvent = function(id) { showEventForm(id); };
window.deleteEvent = async function(id) {
  if (!confirm('Delete this event?')) return;
  await fetch(`/admin/api/events/${id}`, { method: 'DELETE' });
  fetchEvents();
};
function showEventForm(id = null) {
  let formHtml = `
    <div class="admin-form">
      <h3>${id ? 'Edit Event' : 'Create New Event'}</h3>
      <form id='event-form'>
        <label>Title *</label>
        <input name='title' required placeholder="Event title">
        
        <label>Date *</label>
        <input name='date' type='date' required>
        
        <label>Venue *</label>
        <select name='venue' required>
          <option value="">Select venue</option>
          <option value="farewell">Farewell</option>
          <option value="howdy">Howdy</option>
        </select>
        
        <label>Event Time</label>
        <input name='event_time' placeholder="e.g., 8:00 PM, Doors at 7:30">
        
        <label>Description</label>
        <textarea name='description' rows="4" placeholder="Event description"></textarea>
        
        <label>Age Restriction</label>
        <input name='age_restriction' placeholder="e.g., 21+, All Ages">
        
        <label>Flyer Image</label>
        <div class="flyer-upload-section">
          <input name='flyer_image_url' type="url" placeholder="Enter image URL or upload file below">
          <div style="margin: 0.5rem 0; text-align: center; color: #666; font-size: 0.9em;">OR</div>
          <input type="file" id="flyer-file-input" accept="image/*" style="margin-bottom: 0.5rem;">
          <button type="button" id="upload-flyer-btn" class="admin-btn secondary" style="width: 100%; margin-bottom: 1rem;">Upload Flyer</button>
          <div id="upload-status" style="margin: 0.5rem 0; text-align: center;"></div>
        </div>
        <div id="flyer-preview" style="margin: 1rem 0;"></div>
        
        <label>Ticket URL</label>
        <input name='ticket_url' type="url" placeholder="https://...">
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button type='submit' class='admin-btn'>${id ? 'Update Event' : 'Create Event'}</button>
          <button type='button' class='admin-btn secondary' onclick='closeEventForm()'>Cancel</button>
        </div>
      </form>
    </div>`;
  
  document.getElementById('event-form-container').innerHTML = formHtml;
  
  // Add flyer preview functionality
  const flyerInput = document.querySelector('input[name="flyer_image_url"]');
  const flyerPreview = document.getElementById('flyer-preview');
  const fileInput = document.getElementById('flyer-file-input');
  const uploadBtn = document.getElementById('upload-flyer-btn');
  const uploadStatus = document.getElementById('upload-status');
  
  flyerInput.addEventListener('input', (e) => {
    const url = e.target.value;
    if (url && url.startsWith('http')) {
      flyerPreview.innerHTML = `<img src="${url}" alt="Flyer preview" style="max-width: 300px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
    } else {
      flyerPreview.innerHTML = '';
    }
  });
  
  // Handle file upload
  uploadBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    
    if (!file) {
      uploadStatus.innerHTML = '<div style="color: #f44336;">Please select a file first</div>';
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      uploadStatus.innerHTML = '<div style="color: #f44336;">Please select an image file</div>';
      return;
    }
    
    const formData = new FormData();
    formData.append('flyer', file);
    
    uploadStatus.innerHTML = '<div style="color: #2196F3;">Uploading...</div>';
    uploadBtn.disabled = true;
    
    try {
      const response = await fetch('/admin/api/flyers/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        flyerInput.value = result.url;
        flyerPreview.innerHTML = `<img src="${result.url}" alt="Uploaded flyer" style="max-width: 300px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
        uploadStatus.innerHTML = '<div style="color: #4CAF50;">Upload successful!</div>';
        fileInput.value = ''; // Clear file input
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          uploadStatus.innerHTML = '';
        }, 3000);
      } else {
        uploadStatus.innerHTML = `<div style="color: #f44336;">Upload failed: ${result.error}</div>`;
      }
    } catch (error) {
      uploadStatus.innerHTML = `<div style="color: #f44336;">Upload failed: ${error.message}</div>`;
    } finally {
      uploadBtn.disabled = false;
    }
  });
  
  window.closeEventForm = function() {
    document.getElementById('event-form-container').innerHTML = '';
  };
  
  if (id) {
    fetch(`/admin/api/events`).then(r => r.json()).then(events => {
      const ev = events.find(e => e.id === id);
      if (!ev) return;
      const f = document.getElementById('event-form');
      f.title.value = ev.title;
      f.date.value = ev.date;
      f.venue.value = ev.venue;
      f.flyer_image_url.value = ev.imageUrl || ''; // Use legacy format
      f.ticket_url.value = ev.ticketLink || ''; // Use legacy format
      f.description.value = ev.description || '';
      f.age_restriction.value = ev.ageRestriction || ''; // Use legacy format
      f.event_time.value = ev.time || ''; // Use legacy format
      
      // Trigger flyer preview
      if (ev.imageUrl) {
        flyerPreview.innerHTML = `<img src="${ev.imageUrl}" alt="Current flyer" style="max-width: 300px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
      }
    });
  }
  document.getElementById('event-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    let method = id ? 'PUT' : 'POST';
    let url = '/admin/api/events' + (id ? `/${id}` : '');
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    closeEventForm();
    fetchEvents();
  };
}
// --- Import Legacy ---
document.getElementById('import-legacy-btn').onclick = async () => {
  const status = document.getElementById('import-status');
  status.textContent = 'Importing...';
  const res = await fetch('/admin/api/sync-events', { method: 'POST' });
  const data = await res.json();
  if (data.success) {
    status.textContent = `Imported ${data.imported} events!`;
    fetchEvents();
  } else {
    status.textContent = `Import failed: ${data.error || 'Unknown error'}`;
  }
};
// --- Blog Management (full CRUD with Quill, browser JS, fixed window/Quill/TS issues) ---
// @ts-ignore
let quill = null;
// @ts-ignore
window.editBlogPost = function(id) { showBlogForm(id); };
// @ts-ignore
window.deleteBlogPost = async function(id) {
  if (!confirm('Delete this blog post?')) return;
  await fetch(`/admin/api/blog/${id}`, { method: 'DELETE' });
  fetchBlog();
};
async function fetchBlog() {
  try {
    const res = await fetch('/admin/api/blog');
    const data = await res.json();
    if (!data.data || !Array.isArray(data.data)) {
      const blogList = document.getElementById('blog-list');
      if (blogList) blogList.innerHTML = `<div class='status-message status-error'>Failed to load blog posts: Invalid response format</div>`;
      return;
    }
    let html = `<table class="admin-table"><thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead><tbody>`;
    for (const post of data.data) {
      html += `<tr><td><strong>${post.title}</strong></td><td>${post.date || new Date(post.created_at).toLocaleDateString()}</td><td class='admin-table-actions'>
        <button onclick='window.editBlogPost("${post.id}")'>Edit</button>
        <button onclick='window.deleteBlogPost("${post.id}")'>Delete</button>
      </td></tr>`;
    }
    html += `</tbody></table>`;
    const blogList = document.getElementById('blog-list');
    if (blogList) blogList.innerHTML = html;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    const blogList = document.getElementById('blog-list');
    if (blogList) blogList.innerHTML = `<div class='status-message status-error'>Failed to load blog posts: ${error.message}</div>`;
  }
}
fetchBlog();
const addBlogBtn = document.getElementById('add-blog-btn');
if (addBlogBtn) addBlogBtn.onclick = () => showBlogForm();
function showBlogForm(id = null) {
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
        
        <div style="margin-top: 2rem; display: flex; gap: 1rem;">
          <button type='submit' class='admin-btn'>${id ? 'Update Post' : 'Create Post'}</button>
          <button type='button' class='admin-btn secondary' onclick='closeBlogForm()'>Cancel</button>
        </div>
      </form>
    </div>`;
  
  const blogFormContainer = document.getElementById('blog-form-container');
  if (blogFormContainer) blogFormContainer.innerHTML = formHtml;
  
  // Initialize Quill editor after DOM is updated
  setTimeout(() => {
    if (typeof Quill !== 'undefined') {
      // @ts-ignore
      quill = new Quill('#quill-editor', { 
        theme: 'snow',
        placeholder: 'Write your blog post content here...'
      });
      
      // Load existing post data if editing
      if (id) {
        loadBlogPostForEdit(id);
      }
    } else {
      console.error('Quill library not loaded');
      document.getElementById('quill-editor').innerHTML = '<p style="color: red; padding: 1rem;">Rich text editor failed to load. Please refresh the page.</p>';
    }
  }, 100);
  
  // Set up form submission
  setupBlogFormSubmission(id);
}

function loadBlogPostForEdit(id) {
  fetch(`/admin/api/blog/${id}`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data) {
        const post = data.data;
        const f = document.getElementById('blog-form');
        if (f && f instanceof HTMLFormElement) {
          f.elements.namedItem('title').value = post.title || '';
          f.elements.namedItem('date').value = post.date || '';
          // @ts-ignore
          if (quill) quill.root.innerHTML = post.content || '';
        }
      } else {
        console.error('Failed to load blog post:', data.error);
        alert('Failed to load blog post for editing');
      }
    })
    .catch(error => {
      console.error('Error loading blog post:', error);
      alert('Error loading blog post for editing');
    });
}

function setupBlogFormSubmission(id) {
  const blogForm = document.getElementById('blog-form');
  if (blogForm && blogForm instanceof HTMLFormElement) {
    blogForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(blogForm);
      const data = Object.fromEntries(fd.entries());
      
      // Get content from Quill editor
      // @ts-ignore
      data.content = quill ? quill.root.innerHTML : '';
      
      if (!data.title || !data.content) {
        alert('Title and content are required');
        return;
      }
      
      try {
        let method = id ? 'PUT' : 'POST';
        let url = '/admin/api/blog' + (id ? `/${id}` : '');
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          closeBlogForm();
          fetchBlog();
        } else {
          alert('Failed to save blog post: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error saving blog post:', error);
        alert('Error saving blog post');
      }
    };
  }
}

window.closeBlogForm = function() {
  const blogFormContainer = document.getElementById('blog-form-container');
  if (blogFormContainer) blogFormContainer.innerHTML = '';
  quill = null;
};
