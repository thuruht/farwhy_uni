const API_BASE = '/api';
const publicPostsListEl = document.getElementById('public-posts-list');
async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.status === 204 ? { success: true } : response.json();
}
async function loadPublicPosts() {
  try {
    const { data: posts } = await fetchApi('/blog/posts', { method: 'GET' });
    const sorted = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    publicPostsListEl.innerHTML = sorted.length
      ? sorted
          .map(
            (post) =>
              `\n            <article class="post-item-public">\n                <h3>${post.title.replace(/</g, '&lt;')}</h3>\n                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="post-image-public">` : ''}\n                <div class="post-content-public">${post.content}</div>\n                <p><small>Posted: ${new Date(post.created_at).toLocaleDateString()}</small></p>\n            </article>\n        `
          )
          .join('')
      : '<p>No posts available</p>';
  } catch (err) {
    publicPostsListEl.innerHTML = '<p>Unable to load posts at this time.</p>';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  if (publicPostsListEl) loadPublicPosts();
});
