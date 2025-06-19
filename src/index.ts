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

// --- Helper: Serves a specific asset from the ASSETS binding ---
const serveAsset = async (c: Context<{ Bindings: Env }>, assetPath: string, headers: Record<string, string> = {}) => {
  try {
    const assetRequest = new Request(`http://assets-server/${assetPath}`, c.req.raw);
    const asset = await c.env.ASSETS.fetch(assetRequest);
    if (!asset.ok) return c.text(`${assetPath} not found`, 404);
    
    const newHeaders = new Headers(asset.headers);
    Object.entries(headers).forEach(([key, value]) => newHeaders.set(key, value));
    return new Response(asset.body, { status: asset.status, statusText: asset.statusText, headers: newHeaders });
  } catch (e) {
    return c.text('Asset not found', 404);
  }
};


// ====================================
// API ROUTING
// ====================================
app.use('/api/*', timing());
app.use('/api/*', cors());

// --- Public API Routes ---
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
publicApi.get('/list/:state', (c) => {
publicApi.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('venue') }));
  const state = c.req.param('state');
  if (!state) return c.text('State parameter is required', 400);
  return handleEvents(c, 'list', { venue: state });
});
publicApi.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));
publicApi.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
publicApi.get('/blog/featured', (c) => handleBlog(c.req.raw, c.env));
app.route('/api', publicApi);


// --- Admin API Routes ---
const adminApi = new Hono<{ Bindings: Env }>();
// Publicly accessible admin actions
adminApi.post('/login', (c) => handleAuth(c, 'login'));
adminApi.post('/logout', (c) => handleAuth(c, 'logout'));
adminApi.get('/check', authMiddleware(), (c) => handleAuth(c, 'check'));

// Protected Admin Actions
adminApi.use('/admin/events/*', authMiddleware());
adminApi.get('/admin/events', (c) => handleEvents(c, 'list'));
adminApi.post('/admin/events', (c) => handleEvents(c, 'create'));
adminApi.put('/admin/events/:id', (c) => handleEvents(c, 'update'));
adminApi.delete('/admin/events/:id', (c) => handleEvents(c, 'delete'));
adminApi.post('/admin/events/flyer', (c) => handleEvents(c, 'upload-flyer'));

adminApi.use('/admin/blog/*', authMiddleware());
adminApi.get('/admin/blog/posts', (c) => handleBlog(c.req.raw, c.env));
adminApi.post('/admin/blog/posts', (c) => handleBlog(c.req.raw, c.env));
adminApi.put('/admin/blog/:id', (c) => handleBlog(c.req.raw, c.env));
adminApi.delete('/admin/blog/:id', (c) => handleBlog(c.req.raw, c.env));

adminApi.use('/admin/sync-events*', authMiddleware());
adminApi.post('/admin/sync-events', (c) => handleSync(c));
app.route('/api', adminApi);


// ====================================
// ROOT LEVEL & ASSET SERVING
// ====================================

// --- Root-level legacy routes for backward compatibility ---
app.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
app.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));

// --- R2 Image Serving ---
app.get('/images/*', async (c) => {
    try {
        const imagePath = c.req.path.slice('/images/'.length);
        const object = await c.env.FWHY_IMAGES.get(imagePath);
        if (!object) return c.text('Image not found', 404);

        const headers = new Headers();
        headers.set('cache-control', 'public, max-age=31536000');
        let contentType = 'application/octet-stream';
        if (object.httpMetadata && object.httpMetadata.contentType) {
            contentType = object.httpMetadata.contentType;
        } else if (object.metadata && object.metadata.contentType) {
            contentType = object.metadata.contentType;
        }
        headers.set('content-type', contentType);
        return new Response(object.body, { headers });
    } catch (error) {
        return c.text('Error serving image', 500);
    }
});

// --- Main application serving (SPA Handler) ---
app.get('*', async (c) => {
    const host = c.req.header('host') || '';
    const url = new URL(c.req.url);

    // If on the admin domain, serve the admin SPA shell for any non-asset/API path.
    if (host.startsWith('admin.')) {
        if (url.pathname.startsWith('/api/')) {
            return c.text('API endpoint not found', 404);
        }
        // For any other path, serve the main admin html file.
        // The client-side JS will handle showing the login form or the dashboard.
        return serveAsset(c, 'admin.html');
    }

    // --- Public Domain Logic ---
    // Try to fetch a static asset directly from the binding
    // Cache for index.html fallback to avoid repeated fetches
    const cache = c.env.CACHE || new Map<string, Response>();
    try {
        const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
        if (assetResponse.ok) return assetResponse;
    } catch (e) { /* Expected when file not found, fall through */ }

    // If not a static asset, fall back to the public index.html for SPA routing
    if (cache.has('index.html')) {
        // Clone the cached response to avoid body stream lock
        const cached = cache.get('index.html');
        if (cached) return cached.clone();
    }
    const indexResponse = await serveAsset(c, 'index.html');
    if (indexResponse instanceof Response && indexResponse.ok) {
        cache.set('index.html', indexResponse.clone());
    }
    return indexResponse;
});

export default app;