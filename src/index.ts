// src/index.ts
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

// --- Helper Functions ---
const serveAsset = async (c: Context<{ Bindings: Env }>, path: string, headers: Record<string, string> = {}) => {
  try {
    const asset = await c.env.ASSETS.fetch(new Request(new URL(path, c.req.url)));
    if (!asset.ok) {
        return c.text(`${path} not found`, 404);
    }
    const newHeaders = new Headers(asset.headers);
    Object.entries(headers).forEach(([key, value]) => newHeaders.set(key, value));
    return new Response(asset.body, { ...asset, headers: newHeaders });
  } catch (e) {
    console.error(`[ERROR] Asset fetch failed for ${path}:`, e);
    return c.text('Asset not found', 404);
  }
};

const serveLoginPage = (c: Context<{ Bindings: Env }>) => {
    return serveAsset(c, 'login.html');
};

const serveAdminDashboard = (c: Context<{ Bindings: Env }>) => {
    return serveAsset(c, 'admin.html', {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
};

// --- Middleware ---
app.use('*', timing());
app.use('/api/*', cors());

// --- API Routes ---
const api = new Hono<{ Bindings: Env }>();

// Public API
api.get('/events', (c) => handleEvents(c, 'list'));
api.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
api.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
api.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));
api.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
api.get('/blog/featured', (c) => handleBlog(c.req.raw, c.env));

// Admin API
api.post('/login', (c) => handleAuth(c, 'login'));
api.post('/logout', (c) => handleAuth(c, 'logout'));
api.get('/check', authMiddleware(), (c) => handleAuth(c, 'check'));

const adminRoutes = new Hono<{ Bindings: Env }>().use('*', authMiddleware());
adminRoutes.get('/events', (c) => handleEvents(c, 'list'));
adminRoutes.post('/events', (c) => handleEvents(c, 'create'));
adminRoutes.put('/events/:id', (c) => handleEvents(c, 'update'));
adminRoutes.delete('/events/:id', (c) => handleEvents(c, 'delete'));
adminRoutes.post('/events/flyer', (c) => handleEvents(c, 'upload-flyer'));
adminRoutes.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
adminRoutes.post('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
adminRoutes.put('/blog/:id', (c) => handleBlog(c.req.raw, c.env));
adminRoutes.delete('/blog/:id', (c) => handleBlog(c.req.raw, c.env));
adminRoutes.post('/sync-events', (c) => handleSync(c));

api.route('/admin', adminRoutes);
app.route('/api', api);

// --- Frontend & Asset Serving ---
app.get('*', async (c, next) => {
    const host = c.req.header('host') || '';
    const isAdminDomain = host.startsWith('admin.');

    if (isAdminDomain) {
        // --- Admin Domain Logic ---
        const cookie = c.req.header('cookie') || '';
        const hasSession = cookie.includes('sessionToken='); // Simple check

        if (c.req.path === '/login') {
            return serveLoginPage(c);
        }

        // For any other path, check for a session.
        // If it exists, serve the dashboard (auth middleware will handle API validation).
        // If not, redirect to the login page.
        if (hasSession) {
            return serveAdminDashboard(c);
        } else {
            return c.redirect('/login');
        }
    } else {
        // --- Public Domain Logic ---
        const url = new URL(c.req.url);

        // Serve R2 images
        if (url.pathname.startsWith('/images/')) {
            try {
                const imagePath = url.pathname.replace('/images/', '');
                const object = await c.env.FWHY_IMAGES.get(imagePath);
                if (!object) return c.text('Image not found', 404);

                const headers = new Headers();
                headers.set('cache-control', 'public, max-age=31536000');
                headers.set('content-type', object.httpMetadata?.contentType || 'image/jpeg');
                return new Response(object.body, { headers });

            } catch (error) {
                console.error('Error serving image:', error);
                return c.text('Error serving image', 500);
            }
        }
        
        // Let ASSETS handler try to find the file
        try {
            const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
            if (assetResponse.ok) {
                return assetResponse;
            }
        } catch (e) {
            // This is expected when a file is not found.
        }

        // Fallback to index.html for SPA routing on the public site
        return serveAsset(c, 'index.html', {'Cache-Control': 'public, max-age=3600'});
    }
});

export default app;