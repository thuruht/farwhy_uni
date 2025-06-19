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
        
        <!-- Aaron's Auto-Population Section -->
        <div class="auto-population-section" style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
          <h4 style="margin-top: 0; color: #333;">Auto-Populated Fields</h4>
          
          <div class="field-group" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong>Age Restriction:</strong>
              <span id="default-age-display" style="color: #666; font-style: italic;">Select venue first</span>
            </div>
            <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
              <input type="checkbox" id="override-age-check" style="margin-right: 0.5rem;"> 
              Use custom age restriction
            </label>
            <input type="text" id="custom-age-restriction" name="age_restriction" 
                   placeholder="Custom age restriction" style="display: none; width: 100%;">
          </div>
          
          <div class="field-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <strong>Event Time:</strong>
              <span id="default-time-display" style="color: #666; font-style: italic;">Select venue first</span>
            </div>
            <label style="display: flex; align-items: center; margin-bottom: 0.5rem;">
              <input type="checkbox" id="override-time-check" style="margin-right: 0.5rem;"> 
              Use custom event time
            </label>
            <input type="text" id="custom-event-time" name="event_time" 
                   placeholder="Custom event time" style="display: none; width: 100%;">
          </div>
        </div>
        
        <!-- Optional Fields -->
        <label>Description</label>
        <textarea name='description' rows="4" placeholder="Event description"></textarea>
        
        <!-- Enhanced Fields -->
        <label>Price</label>
        <input name='price' placeholder="e.g., $15, Free, Donation">
        
        <label>Capacity</label>
        <input name='capacity' type="number" placeholder="Maximum attendance">
        
        <div class="checkbox-group" style="margin: 1rem 0;">
          <label style="display: flex; align-items: center;">
            <input type="checkbox" name="is_featured" style="margin-right: 0.5rem;">
            Feature this event on homepage
          </label>
        </div>
        
        <!-- File Upload Section -->
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
      
      // Fill basic fields
      f.title.value = ev.title || '';
      f.date.value = ev.date || '';
      f.venue.value = ev.venue || '';
      f.description.value = ev.description || '';
      f.price.value = ev.price || '';
      f.capacity.value = ev.capacity || '';
      f.flyer_image_url.value = ev.imageUrl || ev.flyer_image_url || '';
      f.ticket_url.value = ev.ticketLink || ev.ticket_url || '';
      
      // Handle featured checkbox
      const featuredCheckbox = document.querySelector('input[name="is_featured"]');
      if (featuredCheckbox) {
        featuredCheckbox.checked = ev.is_featured || false;
      }
      
      // Handle Aaron's auto-population fields
      updateAutoPopulation(); // Set defaults first
      
      // Check if event has custom values (different from defaults)
      const defaultAge = ev.venue === 'howdy' ? 'All ages' : '21+ unless with parent or legal guardian';
      const defaultTime = 'Doors at 7pm / Music at 8pm';
      
      if (ev.ageRestriction && ev.ageRestriction !== defaultAge) {
        // Has custom age restriction
        document.getElementById('override-age-check').checked = true;
        document.getElementById('custom-age-restriction').style.display = 'block';
        document.getElementById('custom-age-restriction').value = ev.ageRestriction;
      }
      
      if (ev.time && ev.time !== defaultTime) {
        // Has custom event time
        document.getElementById('override-time-check').checked = true;
        document.getElementById('custom-event-time').style.display = 'block';
        document.getElementById('custom-event-time').value = ev.time;
      }
      
      // Trigger flyer preview
      if (ev.imageUrl || ev.flyer_image_url) {
        const imageUrl = ev.imageUrl || ev.flyer_image_url;
        flyerPreview.innerHTML = `<img src="${imageUrl}" alt="Current flyer" style="max-width: 300px; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">`;
      }
    }).catch(error => {
      console.error('Error loading event for editing:', error);
      alert('Error loading event data');
    });
  }
  document.getElementById('event-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    
    // Handle Aaron's auto-population logic
    const venue = data.venue;
    const overrideAge = document.getElementById('override-age-check').checked;
    const overrideTime = document.getElementById('override-time-check').checked;
    
    // If not overriding, remove custom fields so backend applies defaults
    if (!overrideAge) {
      delete data.age_restriction;
    }
    if (!overrideTime) {
      delete data.event_time;
    }
    
    // Convert checkbox to boolean
    data.is_featured = document.querySelector('input[name="is_featured"]').checked;
    
    // Convert capacity to number if present
    if (data.capacity) {
      data.capacity = parseInt(data.capacity);
    }
    
    try {
      let method = id ? 'PUT' : 'POST';
      let url = '/admin/api/events' + (id ? `/${id}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        closeEventForm();
        fetchEvents();
      } else {
        alert('Error saving event: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event: ' + error.message);
    }
  };
}

// Aaron's Auto-Population Logic
window.updateAutoPopulation = function() {
  const venueSelect = document.getElementById('venue-select');
  const venue = venueSelect.value;
  const defaultAgeDisplay = document.getElementById('default-age-display');
  const defaultTimeDisplay = document.getElementById('default-time-display');
  
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

// Override checkbox handlers
const overrideAgeCheck = document.getElementById('override-age-check');
const overrideTimeCheck = document.getElementById('override-time-check');
const customAgeInput = document.getElementById('custom-age-restriction');
const customTimeInput = document.getElementById('custom-event-time');

overrideAgeCheck.addEventListener('change', (e) => {
  if (e.target.checked) {
    customAgeInput.style.display = 'block';
    customAgeInput.required = true;
  } else {
    customAgeInput.style.display = 'none';
    customAgeInput.required = false;
    customAgeInput.value = '';
  }
});

overrideTimeCheck.addEventListener('change', (e) => {
  if (e.target.checked) {
    customTimeInput.style.display = 'block';
    customTimeInput.required = true;
  } else {
    customTimeInput.style.display = 'none';
    customTimeInput.required = false;
    customTimeInput.value = '';
  }
});

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
  console.log(`[DEBUG] Loading blog post for edit: ${id}`);
  fetch(`/admin/api/blog/${id}`)
    .then(r => {
      console.log(`[DEBUG] Blog fetch response status: ${r.status}`);
      return r.json();
    })
    .then(data => {
      console.log(`[DEBUG] Blog fetch response data:`, data);
      if (data.success && data.data) {
        const post = data.data;
        const f = document.getElementById('blog-form');
        if (f && f instanceof HTMLFormElement) {
          f.elements.namedItem('title').value = post.title || '';
          f.elements.namedItem('date').value = post.date || '';
          
          // Set Quill content
          if (quill) {
            quill.root.innerHTML = post.content || '';
          }
        }
      } else {
        console.error('[DEBUG] Failed to load blog post:', data.error || 'Unknown error');
        alert('Failed to load blog post: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('[DEBUG] Blog fetch error:', error);
      alert('Error loading blog post: ' + error.message);
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
