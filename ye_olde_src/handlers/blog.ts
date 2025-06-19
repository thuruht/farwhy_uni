import { Context, HonoRequest } from 'hono';
import { Env } from '../types/env';

export async function handleBlog(req: HonoRequest, env: Env): Promise<Response> {
    const { BLOG_KV } = env;
    const url = new URL(req.url);
    const method = req.method;
    const pathname = url.pathname;

    try {
        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];

        // --- PUBLIC GET Endpoints ---
        if (method === 'GET') {
            if (pathname.endsWith('/blog/posts')) {
                const data = await BLOG_KV.get('blog:posts');
                return new Response(data || '[]', { headers: { 'Content-Type': 'application/json' } });
            }
            if (pathname.endsWith('/blog/featured')) {
                const data = await BLOG_KV.get('post_featured_info');
                return new Response(data || '{}', { headers: { 'Content-Type': 'application/json' } });
            }
        }

        // --- ADMIN API Endpoints (/api/admin/blog/...) ---
        const isAdminRoute = pathname.includes('/api/admin/blog');
        if (isAdminRoute) {
            const adminPathParts = pathname.split('/api/admin/blog/');
            const slug = adminPathParts[1]; // This will be 'posts' or an ID

            if (method === 'GET') {
                if (slug === 'posts') {
                    const data = await BLOG_KV.get('blog:posts');
                    return new Response(data || '[]', { headers: { 'Content-Type': 'application/json' } });
                }
                // GET single post by ID
                const postData = await BLOG_KV.get(`blog:${slug}`);
                return new Response(postData || null, { status: postData ? 200 : 404, headers: { 'Content-Type': 'application/json' } });
            }

            if (method === 'POST' && slug === 'posts') {
                const newPost = await req.json();
                const postsData = await BLOG_KV.get('blog:posts');
                const posts = postsData ? JSON.parse(postsData) : [];

                const createdPost = { ...newPost, id: crypto.randomUUID(), created_at: new Date().toISOString() };

                posts.unshift(createdPost);

                await BLOG_KV.put(`blog:${createdPost.id}`, JSON.stringify(createdPost));
                await BLOG_KV.put('blog:posts', JSON.stringify(posts));

                return new Response(JSON.stringify({ success: true, id: createdPost.id }), { status: 201 });
            }

            if (method === 'PUT' && slug) {
                const updatedData = await req.json();
                const postsData = await BLOG_KV.get('blog:posts');
                const posts = postsData ? JSON.parse(postsData) : [];

                const postIndex = posts.findIndex((p: any) => p.id == slug);
                if (postIndex === -1) return new Response(JSON.stringify({ error: 'Post not found in index' }), { status: 404 });

                const originalPostData = await BLOG_KV.get(`blog:${slug}`);
                if (!originalPostData) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });

                const originalPost = JSON.parse(originalPostData);
                const updatedPost = { ...originalPost, ...updatedData, updated_at: new Date().toISOString() };

                posts[postIndex] = updatedPost;

                await BLOG_KV.put(`blog:${slug}`, JSON.stringify(updatedPost));
                await BLOG_KV.put('blog:posts', JSON.stringify(posts));

                return new Response(JSON.stringify({ success: true, data: updatedPost }));
            }

            if (method === 'DELETE' && slug) {
                const postsData = await BLOG_KV.get('blog:posts');
                const posts = postsData ? JSON.parse(postsData) : [];
                const updatedPosts = posts.filter((p: any) => p.id != slug);

                await BLOG_KV.delete(`blog:${slug}`);
                await BLOG_KV.put('blog:posts', JSON.stringify(updatedPosts));

                return new Response(JSON.stringify({ success: true }));
            }
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
    } catch (e: any) {
        console.error(`[blog.ts] Error: ${e.message}`);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
