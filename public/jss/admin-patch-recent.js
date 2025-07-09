// Recent Activity Dashboard Patch
// Adds functionality to display recent events and blog posts in the dashboard

// Wait for page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Recent activity patch loaded');
    
    // Add an event listener to update recent activity when dashboard stats load
    const originalLoadDashboardStats = window.loadDashboardStats;
    
    if (typeof originalLoadDashboardStats === 'function') {
        window.loadDashboardStats = async function() {
            // Call the original function first
            await originalLoadDashboardStats.apply(this, arguments);
            
            // Then update recent activity
            updateRecentActivity();
        };
        
        console.log('Dashboard stats function patched to include recent activity');
    } else {
        console.warn('Original loadDashboardStats function not found');
        
        // Try to directly call updateRecentActivity on page load
        setTimeout(updateRecentActivity, 1000);
    }
});

/**
 * Function to get relative time (e.g. "2 days ago")
 */
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
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

/**
 * Updates the recent activity section on the dashboard
 */
async function updateRecentActivity() {
    console.log('Updating recent activity');
    
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) {
        console.warn('Recent activity list element not found');
        return;
    }
    
    // Show loading state
    activityList.innerHTML = '<div class="loading-indicator">Loading recent activity...</div>';
    
    try {
        // Fetch events and blog posts
        let events = [];
        let blogPosts = [];
        
        try {
            const eventsResponse = await fetch('/api/admin/events', {
                credentials: 'include',
                cache: 'no-store'
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
                cache: 'no-store'
            });
            if (blogResponse.ok) {
                const blogData = await blogResponse.json();
                blogPosts = blogData.data || [];
                console.log(`Loaded ${blogPosts.length} blog posts for recent activity`);
            }
        } catch (error) {
            console.error('Error loading blog posts for recent activity:', error);
        }
        
        // Combine and sort activities by date
        const activities = [
            ...events.map(event => ({
                type: 'event',
                title: event.title,
                date: event.updated_at || event.created_at || event.date,
                venue: event.venue,
                id: event.id,
                image: event.flyer_image_url || event.imageUrl
            })),
            ...blogPosts.map(post => ({
                type: 'blog',
                title: post.title,
                date: post.updated_at || post.created_at || post.date,
                id: post.id,
                image: post.featured_image_url
            }))
        ];
        
        // Sort by date, newest first
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Limit to 5 most recent activities
        const recentActivities = activities.slice(0, 5);
        
        if (recentActivities.length === 0) {
            activityList.innerHTML = '<div class="empty-activity">No recent activity to display</div>';
            return;
        }
        
        // Create activity items
        const activityItems = recentActivities.map(activity => {
            const timeAgo = getTimeAgo(activity.date);
            const iconClass = activity.type === 'event' ? 'event-icon' : 'blog-icon';
            const iconEmoji = activity.type === 'event' ? '🎪' : '📝';
            const venueTag = activity.venue ? `<span class="venue-tag venue-${activity.venue}">${activity.venue}</span>` : '';
            const imagePlaceholder = activity.image ? 
                `<div class="activity-image"><img src="${activity.image}" alt="${activity.title}"></div>` : 
                `<div class="activity-image empty-image">${iconEmoji}</div>`;
            
            return `
                <div class="activity-item ${activity.type}-activity">
                    ${imagePlaceholder}
                    <div class="activity-details">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-meta">
                            <span class="activity-type">${activity.type === 'event' ? 'Event' : 'Blog Post'}</span>
                            ${venueTag}
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update the activity list
        activityList.innerHTML = activityItems;
        
        // Add some basic styles if not already present
        if (!document.getElementById('recent-activity-styles')) {
            const styles = document.createElement('style');
            styles.id = 'recent-activity-styles';
            styles.textContent = `
                .activity-item {
                    display: flex;
                    padding: 12px;
                    border-bottom: 1px solid #eee;
                    gap: 15px;
                    align-items: center;
                }
                
                .activity-item:last-child {
                    border-bottom: none;
                }
                
                .activity-image {
                    width: 50px;
                    height: 50px;
                    border-radius: 4px;
                    overflow: hidden;
                    flex-shrink: 0;
                    background-color: #f5f5f5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                
                .activity-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .activity-details {
                    flex-grow: 1;
                }
                
                .activity-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                
                .activity-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: #666;
                }
                
                .activity-type, .activity-time {
                    color: #666;
                }
                
                .empty-activity {
                    padding: 20px;
                    text-align: center;
                    color: #666;
                }
                
                .loading-indicator {
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }
            `;
            document.head.appendChild(styles);
        }
        
    } catch (error) {
        console.error('Error updating recent activity:', error);
        activityList.innerHTML = '<div class="error-message">Failed to load recent activity</div>';
    }
}
