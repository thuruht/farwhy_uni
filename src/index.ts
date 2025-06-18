// src/index.ts
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { authenticate } from './middleware/auth';
import { generateUnifiedDashboardHTML } from './dashboard/unified-admin-dashboard';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// --- Static Asset Serving for subdirectories ---
app.get('/css/*', serveStatic({ root: './' }))
app.get('/jss/*', serveStatic({ root: './' }))
app.get('/img/*', serveStatic({ root: './' }))

// --- Public API Routes (for frontend consumption) ---
const api = new Hono<{ Bindings: Env }>();
api.get('/events', (c) => handleEvents(c, 'list'));
api.post('/login', (c) => handleAuth(c, 'login'));
api.post('/logout', (c) => handleAuth(c, 'logout'));

// --- Admin Dashboard & API (Requires Auth) ---
const admin = new Hono<{ Bindings: Env }>();
admin.use('*', authenticate);

// Serve the admin dashboard HTML
admin.get('/', (c) => c.html(generateUnifiedDashboardHTML(c.get('user'))));

// CRUD APIs for Events
admin.get('/api/events', (c) => handleEvents(c, 'list'));
admin.post('/api/events', (c) => handleEvents(c, 'create'));
admin.put('/api/events/:id', (c) => handleEvents(c, 'update'));
admin.delete('/api/events/:id', (c) => handleEvents(c, 'delete'));

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
      return await serveStatic({ root: './' })(c);
    }
    if (c.req.path.startsWith('/admin')) {
      return await next(); // Let /admin routes handle
    }
    // Redirect all other requests to /admin
    return c.redirect('/admin');
  }
  // Dev/public domain: serve frontend
  if (host.startsWith('dev.')) {
    // Allow /login.html for dev if desired
    if (c.req.path === '/login.html') {
      return await serveStatic({ root: './' })(c);
    }
    // Otherwise, let static/public routes handle
    return await next();
  }
  // Default: serve static
  return await next();
});

// --- Fallback to serving static site files (index.html, etc.) ---
app.get('*', serveStatic({ root: './' }));

export default app;
