// src/index.ts
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
// import { handleBlog } from './handlers/blog'; // We now import individual handlers instead
import {
    getPublicPosts,
    getFeaturedContent,
    listAllPosts,
    createPost,
    getPostById,
    updatePostById,
    deletePostById,
    setFeaturedContent
} from './handlers/blog';
import { authMiddleware } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// ====================================
// API ROUTING
// ====================================
app.use('/api/*', timing());
app.use('/api/*', cors());

// --- Public API Routes ---
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
publicApi.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
publicApi.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));
// publicApi.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
// publicApi.get('/blog/featured', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
publicApi.get('/blog/posts', getPublicPosts);
publicApi.get('/blog/featured', getFeaturedContent);
app.route('/api', publicApi);


// --- Admin API Routes ---
const adminApi = new Hono<{ Bindings: Env }>();

// Unprotected admin actions
adminApi.post('/login', (c) => handleAuth(c, 'login'));
adminApi.post('/logout', (c) => handleAuth(c, 'logout'));

// Protected admin actions are grouped and have middleware applied
const protectedRoutes = new Hono<{ Bindings: Env }>().use('*', authMiddleware());
protectedRoutes.get('/check', (c) => handleAuth(c, 'check'));
protectedRoutes.get('/events', (c) => handleEvents(c, 'list'));
protectedRoutes.post('/events', (c) => handleEvents(c, 'create'));
protectedRoutes.put('/events/:id', (c) => handleEvents(c, 'update'));
protectedRoutes.delete('/events/:id', (c) => handleEvents(c, 'delete'));
protectedRoutes.post('/events/flyer', (c) => handleEvents(c, 'upload-flyer'));
protectedRoutes.post('/sync-events', (c) => handleSync(c));

// --- Protected Blog Routes ---
// protectedRoutes.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
// protectedRoutes.post('/blog/posts', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
// protectedRoutes.put('/blog/:id', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
// protectedRoutes.delete('/blog/:id', (c) => handleBlog(c.req.raw, c.env)); // Replaced with direct handler
protectedRoutes.get('/blog/posts', listAllPosts);
protectedRoutes.post('/blog/posts', createPost);
protectedRoutes.get('/blog/posts/:id', getPostById); // Added for completeness
protectedRoutes.put('/blog/posts/:id', updatePostById); // Corrected route for REST
protectedRoutes.delete('/blog/posts/:id', deletePostById); // Corrected route for REST
protectedRoutes.post('/blog/featured', setFeaturedContent);


// Mount the protected routes under the /admin path
adminApi.route('/admin', protectedRoutes);

// Mount the entire admin API router under /api
app.route('/api', adminApi);


// ====================================
// FRONTEND & ASSET SERVING
// ====================================

// --- Root-level legacy routes for backward compatibility ---
app.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
app.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));

// --- NEW: Flyer/Image serving route from R2 ---
app.get('/images/*', async (c) => {
    try {
        const key = c.req.path.substring('/images/'.length);
        const object = await c.env.FWHY_IMAGES.get(key);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        // Manually set HTTP metadata headers if present
        if (object.httpMetadata) {
            for (const [key, value] of Object.entries(object.httpMetadata)) {
                if (typeof value === 'string') {
                    headers.set(key, value);
                }
            }
        }
        if ('httpEtag' in object && typeof object.httpEtag === 'string' && object.httpEtag) {
            headers.set('etag', object.httpEtag);
        }
        headers.set('cache-control', 'public, max-age=31536000'); // Cache for 1 year

        return new Response(object.body, { headers });
    } catch (e) {
        console.error("Error serving image from R2:", e);
        return new Response('Error serving file', { status: 500 });
    }
});


// --- Final catch-all route for serving the SPA and static assets ---
app.get('*', async (c) => {
    const host = c.req.header('host') || '';
    try {
        // First, try to serve a static asset (CSS, JS, fonts, images)
        return await c.env.ASSETS.fetch(c.req.raw);
    } catch (e) {
        // Not a static file, fall through to serve the HTML shell.
    }

    if (host.startsWith('admin.')) {
        return c.env.ASSETS.fetch(new Request(new URL('/admin.html', c.req.url)));
    }

    // Fallback for public site
    return c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
});

export default app;
