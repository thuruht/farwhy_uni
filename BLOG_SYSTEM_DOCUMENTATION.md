# Blog & News System Documentation

This document provides a comprehensive overview of the blog and news system implemented in the Farewell/Howdy unified project.

## Overview

The blog and news system allows for:
1. Publishing and displaying blog posts in reverse chronological order (newest first)
2. Featured content display with text and YouTube videos (single or carousel)
3. Unified admin management through the main admin dashboard
4. Separate public display through the /u/ section

## Architecture

### Backend Components

1. **API Endpoints**:
   - `/api/blog/posts`: Public endpoint to fetch published posts
   - `/api/blog/featured`: Public endpoint to fetch featured content
   - `/api/admin/blog/posts`: Admin endpoint for CRUD operations on posts (protected)
   - `/api/admin/blog/featured`: Admin endpoint to update featured content (protected)
   - `/api/admin/blog/upload-image`: Admin endpoint for image uploads (protected)

2. **Data Storage**:
   - Blog posts stored in D1 database (`blog_posts` table)
   - Featured content stored in D1 database (`featured_content` table)
   - Images stored in R2 storage with paths saved in the database

3. **Data Models**:
   ```typescript
   // Blog Post Model
   interface BlogPost {
     id: number;
     title: string;
     content: string;
     image_url?: string;
     created_at: string;
     updated_at: string;
   }

   // Featured Content Model
   interface FeaturedContent {
     id: number;
     text?: string;
     youtubeUrl?: string;
     updated_at: string;
   }
   ```

### Frontend Components

1. **Admin Interface** (`/public/admin.html` and `/public/literary-admin-debug.html`):
   - Integrated blog post management in the main admin dashboard
   - Blog post editor with Quill rich text editor
   - Image upload functionality
   - Featured content management
   - YouTube URL management with multi-video support

2. **Public Display** (`/public/u/index.html`):
   - Simplified public-only view with no admin functionality
   - Displays blog posts in reverse chronological order
   - Shows featured content and YouTube videos/carousel
   - Links to the main admin dashboard for content management
   - Responsive design for mobile and desktop viewing

## Public Blog/News Implementation

The public blog/news page is located at `/public/u/index.html` with its supporting files:

- `news.js`: Handles fetching and displaying posts and featured content
- `news.css`: Styles the public blog interface and YouTube carousel

Key features of the public interface:

1. **Blog Posts Display**:
   - Posts shown in reverse chronological order (newest first)
   - Full content display with formatting preserved
   - Image display for posts with images
   - Date information shown for each post

2. **Featured Content**:
   - Text section for announcements or special messages
   - YouTube video embed support
   - Multi-video carousel with navigation controls
   - Support for various YouTube URL formats (youtube.com/watch, youtu.be, youtube.com/embed)

3. **YouTube Carousel**:
   - Supports multiple videos displayed in a carousel
   - Navigation buttons for previous/next
   - Video counter showing current position (e.g., "Video 1/3")
   - Responsive design that works on mobile and desktop

## Admin Blog Management

Blog management is integrated into the main admin dashboard with the following components:

1. **Blog Post Editor**:
   - Quill rich text editor for formatting
   - Title input field
   - Image upload with file browser and URL display
   - Create, edit, update and delete functionality

2. **Featured Content Editor**:
   - Text input for featured announcements
   - YouTube URL input with support for multiple videos
   - Preview of current featured content

3. **Image Upload**:
   - File input for selecting images
   - Automatic upload to R2 storage
   - URL display after successful upload
   - Clear button to reset fields

## YouTube Video Integration

One of the standout features is the YouTube video integration that supports:

1. **Multiple formats of YouTube URLs**:
   - Standard watch URLs: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Short URLs: `https://youtu.be/VIDEO_ID`
   - Embed URLs: `https://www.youtube.com/embed/VIDEO_ID`

2. **Video Carousel**:
   - Automatically creates a carousel when multiple videos are provided
   - Navigation controls for moving between videos
   - Responsive design that works on all device sizes

3. **Implementation Details**:
   - URLs stored as comma-separated values in the database
   - Front-end parsing and formatting into proper embeds
   - YouTube ID extraction to ensure proper embedding

## Image Management

Images for blog posts are handled through:

1. **Upload Process**:
   - Direct upload from the admin interface
   - Server-side storage in R2
   - URL reference stored in the database

2. **Display Process**:
   - Images served through the `/images/*` endpoint
   - Responsive styling on the public blog page
   - Proper alt text for accessibility

## Security Considerations

1. **Authentication**:
   - All admin operations require a valid JWT token
   - Session management with expiration
   - CSRF protection

2. **Content Validation**:
   - Sanitization of HTML content
   - Size limits on uploads
   - File type restrictions

3. **Access Control**:
   - Role-based access control for admin operations
   - Public access limited to published content only

## User Flow

### Public Users

1. Visit `/u/` to view the blog
2. See all posts in reverse chronological order
3. View featured content at the top
4. Watch embedded YouTube videos
5. Access admin dashboard via link if needed

### Admin Users

1. Log in to the main admin dashboard
2. Navigate to the Blog section
3. Create, edit, or delete posts
4. Manage featured content and YouTube videos
5. Upload and manage images

## Implementation Details

### Rendering Blog Posts

```javascript
async function loadPublicPosts() {
    try {
        const { data: posts } = await fetchApi('/blog/posts', { method: 'GET' });
        
        // Sort posts in reverse chronological order (newest first)
        const sortedPosts = [...posts].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        publicPostsListEl.innerHTML = sortedPosts.length ? 
            sortedPosts.map(post => `
                <article class="post-item-public">
                    <h3>${post.title.replace(/</g, '&lt;')}</h3>
                    ${post.image_url ? 
                        `<img src="${post.image_url}" alt="${post.title}" class="post-image-public">` 
                        : ''}
                    <div class="post-content-public">${post.content}</div>
                    <p><small>Posted: ${new Date(post.created_at).toLocaleDateString()}</small></p>
                </article>
            `).join('') 
            : '<p>No posts available</p>';
    } catch (err) {
        publicPostsListEl.innerHTML = `<p>Error loading posts: ${err.message}</p>`;
    }
}
```

### YouTube Embedding

```javascript
function createYouTubeEmbed(urls) {
    // Support comma-separated or array of URLs
    let urlArr = Array.isArray(urls) 
        ? urls 
        : (typeof urls === 'string' 
            ? urls.split(',').map(u => u.trim()).filter(Boolean) 
            : []);
    
    if (urlArr.length === 0) return '';
    
    if (urlArr.length === 1) {
        // Single video embed
        // ...
    } else {
        // Multiple videos carousel
        // ...
    }
}
```

## Best Practices

1. **Performance Optimization**:
   - Minimize DOM operations
   - Use appropriate caching strategies
   - Optimize image sizes

2. **Accessibility**:
   - Include alt text for images
   - Ensure keyboard navigation for carousels
   - Maintain sufficient color contrast

3. **Maintainability**:
   - Clear separation of concerns
   - Well-documented code
   - Consistent styling conventions

## Future Enhancements

1. **Content Categorization**:
   - Add tags and categories to posts
   - Implement filtering by category

2. **Social Media Integration**:
   - Add social sharing buttons
   - Open Graph meta tags for better sharing

3. **Enhanced Media Support**:
   - Support for embedded audio
   - Gallery/slideshow functionality for multiple images

4. **Analytics**:
   - Track post views
   - Gather engagement metrics

## Troubleshooting

Common issues and their solutions:

1. **Posts not displaying**:
   - Check API endpoint responses
   - Verify database connectivity
   - Ensure posts are properly sorted

2. **YouTube videos not embedding**:
   - Check URL format
   - Verify YouTube video is public
   - Check browser console for errors

3. **Image upload issues**:
   - Verify R2 storage configuration
   - Check file size limits
   - Ensure proper CORS settings

## Conclusion

The blog and news system provides a robust solution for content management and display, with special attention to:

1. **User Experience**: Clean design, intuitive navigation
2. **Performance**: Efficient loading and rendering
3. **Maintainability**: Well-structured code, clear documentation
4. **Security**: Proper authentication and authorization

This documentation serves as a comprehensive reference for developers working with or extending the blog functionality.
