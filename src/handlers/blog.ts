// src/handlers/blog.ts
import { Context } from 'hono';
import { Env, BlogPost } from '../types/env';

/*
 * =======================================================================================
 * OLD MONOLITHIC BLOG HANDLER (REPLACED AND COMMENTED OUT FOR REFERENCE)
 * This pattern is not recommended when using a router like Hono, as it duplicates routing logic.
 * =======================================================================================

export async function handleBlog(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  const pathParts = pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  console.log(`Blog handler - Method: ${method}, Action: ${action}, Path: ${pathname}`);

  try {
    // Public endpoints (no auth required)
    if (method === 'GET' && (action === 'posts' || pathname.endsWith('/blog/posts'))) {
      return await getPublicPosts(request, env);
    }

    if (method === 'GET' && (action === 'featured' || pathname.endsWith('/blog/featured'))) {
      return await getFeaturedContent(request, env);
    }

    // Admin endpoints (auth required)
    if (pathname.includes('/admin/')) {
      const postIdMatch = pathname.match(/\/admin\/api\/blog\/([^\/]+)$/);
      const postId = postIdMatch ? postIdMatch[1] : null;

      if (postId) {
        // Individual post operations
        if (method === 'GET') return await getPostById(request, env, postId);
        if (method === 'PUT') return await updatePostById(request, env, postId);
        if (method === 'DELETE') return await deletePostById(request, env, postId);
      } else {
        // General blog operations
        if (method === 'GET' && (action === 'posts' || action === 'blog')) return await listAllPosts(request, env);
        if (method === 'POST' && (action === 'posts' || action === 'blog')) return await createPost(request, env);
        if (method === 'PUT' && (action === 'posts' || action === 'blog')) return await updatePost(request, env);
        if (method === 'DELETE' && (action === 'posts' || action === 'blog')) return await deletePost(request, env);
        if (method === 'POST' && action === 'featured') return await setFeaturedContent(request, env);
      }
    }

    return new Response(JSON.stringify({ error: 'Blog endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Blog handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
*/


/**
 * =======================================================================================
 * NEW REFACTORED HONO-STYLE HANDLERS
 * Each function is an independent, exported handler for a specific route.
 * This is the recommended, type-safe pattern.
 * =======================================================================================
 */

// Helper to safely get and parse KV data
async function getPostsFromKV(c: Context<{ Bindings: Env }>): Promise<BlogPost[]> {
    const postsData = await c.env.BLOG_KV.get('blog:posts');
    return postsData ? JSON.parse(postsData) : [];
}

// --- Public Handlers ---

export async function getPublicPosts(c: Context<{ Bindings: Env }>): Promise<Response> {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');

    try {
        const posts = await getPostsFromKV(c);
        const publishedPosts = posts
            .filter((post: any) => post.status === 'published' || !post.status)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const paginatedPosts = publishedPosts.slice(offset, offset + limit);

        return c.json({
            data: paginatedPosts,
            total: publishedPosts.length
        });
    } catch (error) {
        console.error('Get public posts error:', error);
        return c.json({ error: 'Failed to fetch posts' }, 500);
    }
}

export async function getFeaturedContent(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const featuredData = await c.env.BLOG_KV.get('blog:featured');
        const featured = featuredData ? JSON.parse(featuredData) : { text: '', youtubeUrl: '' };
        return c.json(featured);
    } catch (error) {
        console.error('Get featured content error:', error);
        return c.json({ error: 'Failed to fetch featured content' }, 500);
    }
}


// --- Admin Handlers ---

export async function listAllPosts(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const posts = await getPostsFromKV(c);
        posts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return c.json({ data: posts });
    } catch (error) {
        console.error('List all posts error:', error);
        return c.json({ error: 'Failed to list posts' }, 500);
    }
}

export async function createPost(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const postData = await c.req.json<any>();
        if (!postData.title || !postData.content) {
            return c.json({ error: 'Title and content are required' }, 400);
        }

        const newPost: Partial<BlogPost> = {
            id: crypto.randomUUID(),
            title: postData.title,
            content: postData.content,
            image_url: postData.imageUrl || postData.image_url || null, // Handle both field naming conventions
            status: postData.status || 'published',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const posts = await getPostsFromKV(c);
        posts.push(newPost as BlogPost);
        await c.env.BLOG_KV.put('blog:posts', JSON.stringify(posts));
        return c.json({ success: true, data: newPost }, 201);
    } catch (error) {
        console.error('Create post error:', error);
        return c.json({ error: 'Failed to create post' }, 500);
    }
}

export async function getPostById(c: Context<{ Bindings: Env }>): Promise<Response> {
    const postId = c.req.param('id');
    const posts = await getPostsFromKV(c);
    const post = posts.find((p: any) => p.id === postId);

    if (!post) {
        return c.json({ success: false, error: 'Post not found' }, 404);
    }
    return c.json({ success: true, data: post });
}

export async function updatePostById(c: Context<{ Bindings: Env }>): Promise<Response> {
    const postId = c.req.param('id');

    try {
        const updateData = await c.req.json();
        const posts = await getPostsFromKV(c);
        const postIndex = posts.findIndex((p: any) => p.id === postId);

        if (postIndex === -1) {
            return c.json({ success: false, error: 'Post not found' }, 404);
        }

        posts[postIndex] = {
            ...posts[postIndex],
            ...updateData,
            // Ensure consistent field naming
            image_url: updateData.image_url || updateData.imageUrl || posts[postIndex].image_url,
            id: postId, // Ensure ID is not overwritten
            updated_at: new Date().toISOString()
        };

        await c.env.BLOG_KV.put('blog:posts', JSON.stringify(posts));
        return c.json({ success: true, data: posts[postIndex] });
    } catch (error) {
        console.error(`Update post error for ID ${postId}:`, error);
        return c.json({ success: false, error: 'Failed to update post' }, 500);
    }
}

export async function deletePostById(c: Context<{ Bindings: Env }>): Promise<Response> {
    const postId = c.req.param('id');

    try {
        let posts = await getPostsFromKV(c);
        const initialLength = posts.length;

        posts = posts.filter((p: any) => p.id !== postId);

        if (posts.length === initialLength) {
            return c.json({ success: false, error: 'Post not found' }, 404);
        }

        await c.env.BLOG_KV.put('blog:posts', JSON.stringify(posts));
        return c.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error(`Delete post error for ID ${postId}:`, error);
        return c.json({ success: false, error: 'Failed to delete post' }, 500);
    }
}

export async function setFeaturedContent(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const featuredData = await c.req.json<any>();
        // Normalize YouTube URLs - could be array, comma-separated string, or single string
        let youtubeUrls = '';
        if (Array.isArray(featuredData.youtubeUrl)) {
            youtubeUrls = featuredData.youtubeUrl.join(',');
        } else if (featuredData.youtubeUrl && typeof featuredData.youtubeUrl === 'string') {
            // Use as is if it's already a string
            youtubeUrls = featuredData.youtubeUrl;
        }
        
        const featured = {
            text: featuredData.text || '',
            youtubeUrl: youtubeUrls,
            updated_at: new Date().toISOString()
        };
        await c.env.BLOG_KV.put('blog:featured', JSON.stringify(featured));
        return c.json({ success: true, data: featured });
    } catch (error) {
        console.error('Set featured content error:', error);
        return c.json({ error: 'Failed to set featured content' }, 500);
    }
}

/**
 * Handles uploading blog post images to R2
 */
export async function uploadBlogImage(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Check for multipart form data
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No image file provided' }, 400);
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'Invalid file type. Supported formats: JPG, PNG, GIF, WebP' 
      }, 400);
    }
    
    // Get file data
    const fileData = await file.arrayBuffer();
    
    // Generate a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `blog/${timestamp}-${randomString}.${fileExtension}`;
    
    // Upload to R2
    await c.env.FWHY_IMAGES.put(filename, fileData, {
      httpMetadata: {
        contentType: file.type,
      }
    });
    
    // Construct the public URL
    // Using the /images/ path that would be handled by a route in index.ts
    const imageUrl = `/images/${filename}`;
    
    return c.json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully' 
    });
    
  } catch (error) {
    console.error('[Blog Image Upload]', error);
    return c.json({ 
      success: false, 
      error: 'Failed to upload image' 
    }, 500);
  }
}
