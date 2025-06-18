// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { authenticate } from './middleware/auth';
import { generateUnifiedDashboardHTML } from './dashboard/unified-admin-dashboard';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// Add CORS for API endpoints
app.use('/api/*', cors());

// --- Legacy API Endpoints (for ffww frontend compatibility) ---
// These endpoints match what the original script.js expects

// GET /list/{state} - Event listings per venue
app.get('/list/:state', async (c) => {
  const state = c.req.param('state'); // 'farewell' or 'howdy'
  return handleEvents(c, 'list', { venue: state });
});

// GET /archives - Past events with type parameter
app.get('/archives', async (c) => {
  const type = c.req.query('type'); // 'farewell' or 'howdy'
  return handleEvents(c, 'archives', { venue: type });
});

// --- Modern API Routes ---
const api = new Hono<{ Bindings: Env }>();

// Events API
api.get('/events', (c) => handleEvents(c, 'list'));
api.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
api.post('/events', (c) => handleEvents(c, 'create'));
api.put('/events/:id', (c) => handleEvents(c, 'update'));
api.delete('/events/:id', (c) => handleEvents(c, 'delete'));

// Legacy sync from old site
api.post('/sync-events', (c) => handleSync(c));

// Auth API
api.post('/login', (c) => handleAuth(c, 'login'));
api.post('/logout', (c) => handleAuth(c, 'logout'));

// --- Admin Dashboard & API (Requires Auth) ---
const admin = new Hono<{ Bindings: Env }>();
admin.use('*', authenticate);

// Serve the admin dashboard HTML
admin.get('/', (c) => c.html(generateUnifiedDashboardHTML()));

// Admin APIs for Events
admin.get('/api/events', (c) => handleEvents(c, 'list'));
admin.post('/api/events', (c) => handleEvents(c, 'create'));
admin.put('/api/events/:id', (c) => handleEvents(c, 'update'));
admin.delete('/api/events/:id', (c) => handleEvents(c, 'delete'));

// Admin APIs for flyer uploads
admin.post('/api/flyers/upload', (c) => handleEvents(c, 'upload-flyer'));

// Route for triggering the legacy sync
admin.post('/api/sync-events', (c) => handleSync(c));

// Wire up the routers
app.route('/api', api);
app.route('/admin', admin);

// --- Host-based Routing ---
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  
  // Admin domain: serve /admin dashboard and /login.html
  if (host.startsWith('admin.')) {
    if (c.req.path === '/login.html') {
      try {
        const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
        return new Response(asset.body, {
          headers: asset.headers
        });
      } catch (e) {
        return c.text('Login page not found', 404);
      }
    }
    if (c.req.path.startsWith('/admin')) {
      return await next(); // Let /admin routes handle
    }
    // Redirect all other requests to /admin
    return c.redirect('/admin');
  }
  
  // Dev/public domain: serve frontend
  if (host.startsWith('dev.')) {
    // Handle API endpoints first
    if (c.req.path.startsWith('/api/') || 
        c.req.path.startsWith('/list/') || 
        c.req.path.startsWith('/archives')) {
      return await next();
    }
    
    // Serve static assets
    try {
      const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
      return new Response(asset.body, {
        headers: asset.headers
      });
    } catch (e) {
      // Fallback to index.html for SPA
      try {
        const asset = await c.env.ASSETS.fetch(new Request('http://localhost/index.html'));
        return new Response(asset.body, {
          headers: asset.headers
        });
      } catch (e) {
        return c.text('Site not found', 404);
      }
    }
  }
  
  // Default: continue to next handler
  return await next();
});

// --- Fallback for any unmatched routes ---
app.get('*', async (c) => {
  try {
    const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
    return new Response(asset.body, {
      headers: asset.headers
    });
  } catch (e) {
    return c.text('Not found', 404);
  }
});

export default app;
