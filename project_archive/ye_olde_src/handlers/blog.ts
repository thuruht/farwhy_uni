// src/handlers/blog.ts
import { Context } from 'hono';
import { Env, BlogPost } from '../types/env';

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
            image_url: postData.imageUrl || null,
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
    const updateData = await c.req.json();

    const posts = await getPostsFromKV(c);
    const postIndex = posts.findIndex((p: any) => p.id === postId);

    if (postIndex === -1) {
        return c.json({ success: false, error: 'Post not found' }, 404);
    }

    posts[postIndex] = {
        ...posts[postIndex],
        ...updateData,
        id: postId, // Ensure ID is not overwritten
        updated_at: new Date().toISOString()
    };

    await c.env.BLOG_KV.put('blog:posts', JSON.stringify(posts));
    return c.json({ success: true, data: posts[postIndex] });
}

export async function deletePostById(c: Context<{ Bindings: Env }>): Promise<Response> {
    const postId = c.req.param('id');
    let posts = await getPostsFromKV(c);
    const initialLength = posts.length;

    posts = posts.filter((p: any) => p.id !== postId);

    if (posts.length === initialLength) {
        return c.json({ success: false, error: 'Post not found' }, 404);
    }

    await c.env.BLOG_KV.put('blog:posts', JSON.stringify(posts));
    return c.json({ success: true, message: 'Post deleted successfully' });
}


export async function setFeaturedContent(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
        const featuredData = await c.req.json<any>();
        const featured = {
            text: featuredData.text || '',
            youtubeUrl: featuredData.youtubeUrl || '',
            updated_at: new Date().toISOString()
        };
        await c.env.BLOG_KV.put('blog:featured', JSON.stringify(featured));
        return c.json({ success: true, data: featured });
    } catch (error) {
        console.error('Set featured content error:', error);
        return c.json({ error: 'Failed to set featured content' }, 500);
    }
}
