import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleBlog } from './handlers/blog';
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
publicApi.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
publicApi.get('/blog/featured', (c) => handleBlog(c.req.raw, c.env));
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
protectedRoutes.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
protectedRoutes.post('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
protectedRoutes.put('/blog/:id', (c) => handleBlog(c.req.raw, c.env));
protectedRoutes.delete('/blog/:id', (c) => handleBlog(c.req.raw, c.env));
protectedRoutes.post('/sync-events', (c) => handleSync(c));

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