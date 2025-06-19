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
    return new Response(asset.body, { ...asset, headers: newHeaders });
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
publicApi.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
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
adminApi.get('/events', authMiddleware(['admin']), (c) => handleEvents(c, 'list'));
adminApi.post('/events', authMiddleware(['admin']), (c) => handleEvents(c, 'create'));
adminApi.put('/events/:id', authMiddleware(['admin']), (c) => handleEvents(c, 'update'));
adminApi.delete('/events/:id', authMiddleware(['admin']), (c) => handleEvents(c, 'delete'));
adminApi.post('/events/flyer', authMiddleware(['admin']), (c) => handleEvents(c, 'upload-flyer'));
adminApi.get('/blog/posts', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.post('/blog/posts', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.put('/blog/:id', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.delete('/blog/:id', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.post('/sync-events', authMiddleware(['admin']), (c) => handleSync(c));
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
    const imagePath = new URL(c.req.url).pathname.replace('/images/', '');
    const object = await c.env.FWHY_IMAGES.get(imagePath);
    if (!object) return c.text('Image not found', 404);

    const headers = new Headers();
    headers.set('cache-control', 'public, max-age=31536000');
    headers.set('content-type', object.httpMetadata?.contentType || 'image/jpeg');
    return new Response(object.body, { headers });
  } catch (error) {
    return c.text('Error serving image', 500);
  }
});

// --- Main application serving (SPA Handler) ---
app.get('*', async (c) => {
    const host = c.req.header('host') || '';
    
    // --- Step 1: Attempt to serve a static asset directly ---
    // This handles /css, /jss, /f, etc. for both domains.
    try {
        const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
        if (assetResponse.ok) {
            return assetResponse;
        }
    } catch (e) {
        // This is expected if the file is not a static asset, so we continue.
    }
    
    // --- Step 2: If not a static asset, handle SPA routing ---
    if (host.startsWith('admin.')) {
        // For the admin domain, any non-asset request serves the admin app shell.
        return serveAsset(c, 'admin.html', {
            'Cache-Control': 'no-store, must-revalidate, no-cache',
            'Expires': '0'
        });
    } else {
        // For the public domain, any non-asset request serves the public app shell.
        return serveAsset(c, 'index.html');
    }
});

export default app;