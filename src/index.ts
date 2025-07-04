// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleMenu } from './handlers/menu';
import { handleHours } from './handlers/hours';
import { handleFeatured } from './handlers/featured';
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

// Authentication endpoints (login, logout, session check)
app.post('/api/login', c => handleAuth(c, 'login'));
app.post('/api/logout', c => handleAuth(c, 'logout'));
app.get('/api/check', c => handleAuth(c, 'check'));

// --- Image serving from R2 ---
app.get('/images/*', async (c) => {
  const path = c.req.path.replace('/images/', '');
  
  try {
    // Security check: Only allow specific image paths and extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = allowedExtensions.some(ext => path.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      console.warn(`[SECURITY] Blocked request for non-image file: ${path}`);
      return new Response('Not found', { status: 404 });
    }
    
    // Prevent directory traversal attacks
    if (path.includes('../') || path.includes('..\\') || path.startsWith('/')) {
      console.warn(`[SECURITY] Blocked directory traversal attempt: ${path}`);
      return new Response('Not found', { status: 404 });
    }
    
    // For admin-uploaded content, some paths might require authorization
    if (path.startsWith('admin/')) { // REMOVED 'flyers/' and 'blog/' from this check
      // Check if user has admin access for private images
      const { JWT_SECRET, SESSIONS_KV } = c.env;
      let isAuthorized = false;
      
      // Try to get token from cookie first
      let token: string | null = null;
      const cookie = c.req.header('cookie') || '';
      const cookieMatch = cookie.match(/sessionToken=([^;]+)/);
      
      if (cookieMatch) {
        token = cookieMatch[1];
      } else {
        // Fallback to Authorization header
        const authHeader = c.req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (token) {
        try {
          // Use the same JWT verification as auth middleware
          const parts = token.split('.');
          if (parts.length === 3) {
            const [header, payload, signature] = parts;
            const data = `${header}.${payload}`;
            
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
              'raw',
              encoder.encode(JWT_SECRET),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['verify']
            );
            
            const signatureBuffer = Uint8Array.from(
              atob(signature.replace(/-/g, '+').replace(/_/g, '/')), 
              c => c.charCodeAt(0)
            );
            
            const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(data));
            
            if (isValid) {
              const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
              
              // Check expiration
              if (!decodedPayload.exp || decodedPayload.exp > Date.now() / 1000) {
                // Check if token is in the blocklist
                if (decodedPayload.jti) {
                  const isBlocked = await SESSIONS_KV.get(`blocked:${decodedPayload.jti}`);
                  if (!isBlocked) {
                    isAuthorized = true;
                  }
                } else {
                  isAuthorized = true; // Legacy token without jti
                }
              }
            }
          }
        } catch (error) {
          console.warn(`[SECURITY] JWT verification failed for image request: ${error}`);
        }
      }
      
      if (!isAuthorized) {
        console.warn(`[SECURITY] Unauthorized access attempt to private image: ${path}`);
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
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
    
    // Set appropriate cache headers based on image type
    if (path.startsWith('blog/') || path.startsWith('flyers/') || path.startsWith('admin/')) {
      headers.set('Cache-Control', 'private, max-age=3600'); // Private cache for 1 hour
    } else {
      headers.set('Cache-Control', 'public, max-age=31536000'); // Public cache for 1 year
    }
    
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
publicApi.get('/health', (c) => c.json({ status: 'ok' }));
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/:id', (c) => {
  // Custom handler for getting event by ID since it's not in EventAction type
  const eventId = c.req.param('id');
  const { FWHY_D1 } = c.env;
  
  return c.json({ success: true, message: `Get event by ID endpoint` });
});
publicApi.get('/blog', getPublicPosts);
publicApi.get('/blog/posts', getPublicPosts); // Alternative endpoint that frontend uses
publicApi.get('/blog/:id', getPostById);
publicApi.get('/featured', (c) => handleFeatured(c, 'get'));
publicApi.get('/blog/featured', getFeaturedContent); // Specific endpoint for blog featured content
publicApi.get('/venues/:venue/featured', (c) => {
  // Custom handler for venue-specific featured content
  const venue = c.req.param('venue');
  return c.json({ success: true, data: [], venue });
});
publicApi.get('/venues/:venue/menu', (c) => handleMenu(c, 'list'));
publicApi.get('/venues/:venue/menu-items', async (c) => {
  const { FWHY_D1 } = c.env;
  const venue = c.req.param('venue');
  
  try {
    // Get all menu items for the specified venue
    const { results } = await FWHY_D1.prepare(`
      SELECT mi.* 
      FROM menu_items mi
      JOIN menus m ON mi.menu_id = m.id
      WHERE m.venue = ? AND mi.active = 1
      ORDER BY mi.category, mi.display_order ASC, mi.name ASC
    `).bind(venue).all();
    
    if (!results || results.length === 0) {
      console.log(`No menu items found for venue ${venue}`);
      return c.json({ success: false, error: `No menu items found for ${venue}` }, 404);
    }
    
    console.log(`Found ${results.length} menu items for venue ${venue}`);
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error(`Error fetching menu items for ${venue}:`, error);
    return c.json({ success: false, error: `Failed to fetch menu items for ${venue}` }, 500);
  }
});
publicApi.get('/menu', async (c) => {
  const { FWHY_D1 } = c.env;
  try {
    // Get all menu items for Farewell (venue specific)
    const { results } = await FWHY_D1.prepare(`
      SELECT * FROM menu_items 
      WHERE active = 1
      ORDER BY category, display_order ASC, name ASC
    `).all();
    
    if (!results || results.length === 0) {
      console.log('No menu items found in database');
      return c.json({ success: false, error: "No menu items found" }, 404);
    }
    
    console.log(`Found ${results.length} menu items to return`);
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching unified menu:', error);
    return c.json({ success: false, error: "Failed to fetch menu items" }, 500);
  }
});
publicApi.get('/hours', (c) => handleHours(c, 'list-all'));

// Add the slideshow endpoint to the public API
publicApi.get('/slideshow', (c) => handleEvents(c, 'slideshow'));
// Public authentication endpoints (login/logout/check)
publicApi.post('/login', (c) => handleAuth(c, 'login'));
publicApi.post('/logout', (c) => handleAuth(c, 'logout'));
publicApi.get('/check', (c) => handleAuth(c, 'check'));

// --- Admin API Routes ---
const adminApi = new Hono<{ Bindings: Env }>();
// Protect all admin endpoints with authentication middleware
adminApi.use('/*', authMiddleware());

// Add all admin routes here
adminApi.get('/health', (c) => c.json({ status: 'admin-ok' }));
adminApi.get('/events', (c) => handleEvents(c, 'list'));
adminApi.post('/events', (c) => handleEvents(c, 'create'));
adminApi.put('/events/:id', (c) => handleEvents(c, 'update'));
adminApi.delete('/events/:id', (c) => handleEvents(c, 'delete'));
adminApi.post('/menu', (c) => handleMenu(c, 'create'));
adminApi.put('/menu/:id', (c) => handleMenu(c, 'update'));
adminApi.delete('/menu/:id', (c) => handleMenu(c, 'delete'));
adminApi.post('/hours', (c) => handleHours(c, 'create'));
adminApi.put('/hours/:id', (c) => handleHours(c, 'update'));
adminApi.delete('/hours/:id', (c) => handleHours(c, 'delete'));
adminApi.post('/featured', (c) => handleFeatured(c, 'update'));
adminApi.get('/featured', (c) => handleFeatured(c, 'list'));
adminApi.get('/blog/posts', listAllPosts);
adminApi.post('/blog', createPost);
adminApi.put('/blog/:id', updatePostById);
adminApi.delete('/blog/:id', deletePostById);
adminApi.post('/blog/images', uploadBlogImage);

// Mount admin API before public API to avoid prefix conflicts
app.route('/api/admin', adminApi);
app.route('/api', publicApi);

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
