document.addEventListener('DOMContentLoaded', function () {
  console.log('Recent activity patch loaded');
  const originalLoadDashboardStats = window.loadDashboardStats;
  if (typeof originalLoadDashboardStats === 'function') {
    window.loadDashboardStats = async function () {
      await originalLoadDashboardStats.apply(this, arguments);
      updateRecentActivity();
    };
    console.log('Dashboard stats function patched to include recent activity');
  } else {
    console.warn('Original loadDashboardStats function not found');
    setTimeout(updateRecentActivity, 1e3);
  }
});
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay > 30) {
    return date.toLocaleDateString();
  } else if (diffDay > 0) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffMin > 0) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else {
    return 'just now';
  }
}
async function updateRecentActivity() {
  console.log('Updating recent activity');
  const activityList = document.getElementById('recent-activity-list');
  if (!activityList) {
    console.warn('Recent activity list element not found');
    return;
  }
  activityList.innerHTML = '<div class="loading-indicator">Loading recent activity...</div>';
  try {
    let events = [];
    let blogPosts = [];
    try {
      const eventsResponse = await fetch('/api/admin/events', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (eventsResponse.ok) {
        events = await eventsResponse.json();
        console.log(`Loaded ${events.length} events for recent activity`);
      }
    } catch (error) {
      console.error('Error loading events for recent activity:', error);
    }
    try {
      const blogResponse = await fetch('/api/admin/blog/posts', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        blogPosts = blogData.data || [];
        console.log(`Loaded ${blogPosts.length} blog posts for recent activity`);
      }
    } catch (error) {
      console.error('Error loading blog posts for recent activity:', error);
    }
    const activities = [
      ...events.map((event) => ({
        type: 'event',
        title: event.title,
        date: event.updated_at || event.created_at || event.date,
        venue: event.venue,
        id: event.id,
        image: event.flyer_image_url || event.imageUrl,
      })),
      ...blogPosts.map((post) => ({
        type: 'blog',
        title: post.title,
        date: post.updated_at || post.created_at || post.date,
        id: post.id,
        image: post.featured_image_url,
      })),
    ];
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentActivities = activities.slice(0, 5);
    if (recentActivities.length === 0) {
      activityList.innerHTML = '<div class="empty-activity">No recent activity to display</div>';
      return;
    }
    const activityItems = recentActivities
      .map((activity) => {
        const timeAgo = getTimeAgo(activity.date);
        const iconClass = activity.type === 'event' ? 'event-icon' : 'blog-icon';
        const iconEmoji = activity.type === 'event' ? '🎪' : '📝';
        const venueTag = activity.venue
          ? `<span class="venue-tag venue-${activity.venue}">${activity.venue}</span>`
          : '';
        const imagePlaceholder = activity.image
          ? `<div class="activity-image"><img src="${activity.image}" alt="${activity.title}"></div>`
          : `<div class="activity-image empty-image">${iconEmoji}</div>`;
        return `\n                <div class="activity-item ${activity.type}-activity">\n                    ${imagePlaceholder}\n                    <div class="activity-details">\n                        <div class="activity-title">${activity.title}</div>\n                        <div class="activity-meta">\n                            <span class="activity-type">${activity.type === 'event' ? 'Event' : 'Blog Post'}</span>\n                            ${venueTag}\n                            <span class="activity-time">${timeAgo}</span>\n                        </div>\n                    </div>\n                </div>\n            `;
      })
      .join('');
    activityList.innerHTML = activityItems;
    if (!document.getElementById('recent-activity-styles')) {
      const styles = document.createElement('style');
      styles.id = 'recent-activity-styles';
      styles.textContent = `\n                .activity-item {\n                    display: flex;\n                    padding: 12px;\n                    border-bottom: 1px solid #eee;\n                    gap: 15px;\n                    align-items: center;\n                }\n                \n                .activity-item:last-child {\n                    border-bottom: none;\n                }\n                \n                .activity-image {\n                    width: 50px;\n                    height: 50px;\n                    border-radius: 4px;\n                    overflow: hidden;\n                    flex-shrink: 0;\n                    background-color: #f5f5f5;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                    font-size: 24px;\n                }\n                \n                .activity-image img {\n                    width: 100%;\n                    height: 100%;\n                    object-fit: cover;\n                }\n                \n                .activity-details {\n                    flex-grow: 1;\n                }\n                \n                .activity-title {\n                    font-weight: bold;\n                    margin-bottom: 5px;\n                }\n                \n                .activity-meta {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 8px;\n                    font-size: 0.85rem;\n                    color: #666;\n                }\n                \n                .activity-type, .activity-time {\n                    color: #666;\n                }\n                \n                .empty-activity {\n                    padding: 20px;\n                    text-align: center;\n                    color: #666;\n                }\n                \n                .loading-indicator {\n                    padding: 20px;\n                    text-align: center;\n                    color: #666;\n                    font-style: italic;\n                }\n            `;
      document.head.appendChild(styles);
    }
  } catch (error) {
    console.error('Error updating recent activity:', error);
    activityList.innerHTML = '<div class="error-message">Failed to load recent activity</div>';
  }
}
