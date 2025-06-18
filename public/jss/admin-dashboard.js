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
  await fetch('/admin/logout', { method: 'POST' });
  window.location.reload();
};
// --- Event CRUD ---
async function fetchEvents() {
  const res = await fetch('/admin/api/events');
  const data = await res.json();
  if (!data.success) return document.getElementById('event-list').innerHTML = `<div class='well'>Failed to load events.</div>`;
  let html = `<table><thead><tr><th>Title</th><th>Date</th><th>Venue</th><th></th></tr></thead><tbody>`;
  for (const ev of data.data) {
    html += `<tr><td>${ev.title}</td><td>${ev.date}</td><td>${ev.venue}</td><td class='admin-table-actions'>
      <button onclick='editEvent("${ev.id}")'>Edit</button>
      <button onclick='deleteEvent("${ev.id}")'>Delete</button>
    </td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('event-list').innerHTML = html;
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
  let formHtml = `<form id='event-form'>
    <label>Title<input name='title' required></label>
    <label>Date<input name='date' type='date' required></label>
    <label>Venue<input name='venue' required></label>
    <label>Flyer Image URL<input name='flyer_image_url'></label>
    <label>Ticket URL<input name='ticket_url'></label>
    <label>Description<textarea name='description'></textarea></label>
    <label>Age Restriction<input name='age_restriction'></label>
    <label>Event Time<input name='event_time'></label>
    <button type='submit' class='btn'>${id ? 'Update' : 'Create'}</button>
    <button type='button' class='btn' onclick='closeEventForm()'>Cancel</button>
  </form>`;
  document.getElementById('event-form-container').innerHTML = formHtml;
  window.closeEventForm = function() {
    document.getElementById('event-form-container').innerHTML = '';
  };
  if (id) {
    fetch(`/admin/api/events`).then(r => r.json()).then(data => {
      const ev = data.data.find(e => e.id === id);
      if (!ev) return;
      const f = document.getElementById('event-form');
      f.title.value = ev.title;
      f.date.value = ev.date;
      f.venue.value = ev.venue;
      f.flyer_image_url.value = ev.flyer_image_url || '';
      f.ticket_url.value = ev.ticket_url || '';
      f.description.value = ev.description || '';
      f.age_restriction.value = ev.age_restriction || '';
      f.event_time.value = ev.event_time || '';
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
  const res = await fetch('/admin/api/blog');
  const data = await res.json();
  if (!data.success) {
    const blogList = document.getElementById('blog-list');
    if (blogList) blogList.innerHTML = `<div class='well'>Failed to load blog posts.</div>`;
    return;
  }
  let html = `<table><thead><tr><th>Title</th><th>Date</th><th></th></tr></thead><tbody>`;
  for (const post of data.data) {
    html += `<tr><td>${post.title}</td><td>${post.date || ''}</td><td class='admin-table-actions'>
      <button onclick='window.editBlogPost("${post.id}")'>Edit</button>
      <button onclick='window.deleteBlogPost("${post.id}")'>Delete</button>
    </td></tr>`;
  }
  html += `</tbody></table>`;
  const blogList = document.getElementById('blog-list');
  if (blogList) blogList.innerHTML = html;
}
fetchBlog();
const addBlogBtn = document.getElementById('add-blog-btn');
if (addBlogBtn) addBlogBtn.onclick = () => showBlogForm();
function showBlogForm(id = null) {
  let formHtml = `<form id='blog-form'>
    <label>Title<input name='title' required></label>
    <label>Date<input name='date' type='date'></label>
    <label>Content<div id='quill-editor' style='height:200px;'></div></label>
    <button type='submit' class='btn'>${id ? 'Update' : 'Create'}</button>
    <button type='button' class='btn' id='cancel-blog-btn'>Cancel</button>
  </form>`;
  const blogFormContainer = document.getElementById('blog-form-container');
  if (blogFormContainer) blogFormContainer.innerHTML = formHtml;
  // @ts-ignore
  quill = new Quill('#quill-editor', { theme: 'snow' });
  const cancelBtn = document.getElementById('cancel-blog-btn');
  if (cancelBtn) cancelBtn.onclick = closeBlogForm;
  function closeBlogForm() {
    if (blogFormContainer) blogFormContainer.innerHTML = '';
  }
  if (id) {
    fetch(`/admin/api/blog`).then(r => r.json()).then(data => {
      const post = data.data.find(p => p.id === id);
      if (!post) return;
      const f = document.getElementById('blog-form');
      if (f && f instanceof HTMLFormElement) {
        f.elements.namedItem('title').value = post.title;
        f.elements.namedItem('date').value = post.date || '';
        // @ts-ignore
        if (quill) quill.root.innerHTML = post.content || '';
      }
    });
  }
  const blogForm = document.getElementById('blog-form');
  if (blogForm && blogForm instanceof HTMLFormElement) {
    blogForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(blogForm);
      const data = Object.fromEntries(fd.entries());
      // @ts-ignore
      data.content = quill ? quill.root.innerHTML : '';
      let method = id ? 'PUT' : 'POST';
      let url = '/admin/api/blog' + (id ? `/${id}` : '');
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      closeBlogForm();
      fetchBlog();
    };
  }
}
