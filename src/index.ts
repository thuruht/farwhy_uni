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
    setFeaturedContent,
    uploadBlogImage // Added import for the new image upload handler
} from './handlers/blog';
import { authMiddleware } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// ====================================
// API ROUTING
// ====================================
app.use('/api/*', timing());
app.use('/api/*', cors());

// --- Image serving from R2 ---
app.get('/images/*', async (c) => {
  const path = c.req.path.replace('/images/', '');
  
  try {
    // Get the image from R2
    const object = await c.env.FWHY_IMAGES.get(path);
    
    if (!object) {
      // Return a 404 if the image doesn't exist
      return new Response('Image not found', { status: 404 });
    }
    
    // Return the image with appropriate headers
    const headers = new Headers();
    
    // Set content type header if available
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('Error serving image from R2:', error);
    return new Response('Error fetching image', { status: 500 });
  }
});

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
adminApi.get('/check', (c) => handleAuth(c, 'check')); // Auth status check endpoint

// Protected admin actions are grouped and have middleware applied
const protectedAdminApi = new Hono<{ Bindings: Env }>();
protectedAdminApi.use('*', authMiddleware());

// Blog management endpoints
protectedAdminApi.get('/blog/posts', listAllPosts);
protectedAdminApi.post('/blog/posts', createPost);
protectedAdminApi.get('/blog/posts/:id', getPostById);
protectedAdminApi.put('/blog/posts/:id', updatePostById);
protectedAdminApi.delete('/blog/posts/:id', deletePostById);
protectedAdminApi.post('/blog/featured', setFeaturedContent);
protectedAdminApi.post('/blog/upload-image', uploadBlogImage); // New endpoint for blog image uploads

// Event management endpoints (admin)
protectedAdminApi.get('/events', (c) => handleEvents(c, 'list'));
protectedAdminApi.post('/events', (c) => handleEvents(c, 'create'));
protectedAdminApi.put('/events/:id', (c) => handleEvents(c, 'update'));
protectedAdminApi.delete('/events/:id', (c) => handleEvents(c, 'delete'));
protectedAdminApi.post('/events/flyer', (c) => handleEvents(c, 'upload-flyer'));
// Add sync-events endpoint for legacy import
protectedAdminApi.post('/events/sync', handleSync);

// Mount the protected routes under the /admin path
adminApi.route('/admin', protectedAdminApi);

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
