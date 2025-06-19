import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';

import { handleAuth } from './handlers/auth';
import { handleBlog } from './handlers/blog';
import { handleEvents } from './handlers/events-new';
import { handleMenu } from './handlers/menu';
import { handleSync } from './handlers/sync';
import { handleThrift } from './handlers/thrift';
import { authMiddleware } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// --- Middleware ---
app.use('*', timing());
app.use('/api/*', cors());


// --- Admin vs. Public Routing Logic ---

// Group all admin-only routes
const adminApp = new Hono<{ Bindings: Env }>();
adminApp.use('/api/*', authMiddleware(['admin'])); // Secure all admin API routes

// Pass requests to the correct handlers
adminApp.all('/api/blog/*', (c) => handleBlog(c.req.raw, c.env));
adminApp.all('/api/events/*', (c) => handleEvents(c, 'list'));
adminApp.post('/api/logout', (c) => handleAuth(c, 'logout'));

// Serve the admin-specific HTML pages and static assets
adminApp.get('/admin', serveStatic({ path: './public/admin.html', manifest: {} }));
adminApp.get('/admin/login', serveStatic({ path: './public/login.html', manifest: {} }));
adminApp.get('/*', serveStatic({ root: './public', manifest: {} }));


// Group all public routes
const publicApp = new Hono<{ Bindings: Env }>();

// Public API routes
publicApp.post('/api/login', (c) => handleAuth(c, 'login'));
publicApp.all('/api/blog/*', (c) => handleBlog(c.req.raw, c.env));
publicApp.all('/api/events/*', (c) => handleEvents(c, 'list'));
publicApp.get('/api/menu', (c) => handleMenu(c, 'list'));
publicApp.get('/api/sync', (c) => handleSync(c));
// Corrected call with the required 'page-content' action from your file
publicApp.get('/api/thrift', (c) => handleThrift(c, 'page-content'));

// Serve the public-facing static site
publicApp.get('/*', serveStatic({ root: './public', manifest: {} }));


// --- Main Entry Point ---

// Use the hostname to decide which group of routes to use
app.all('*', (c) => {
  const host = c.req.header('host');
  if (host === 'admin.farewellcafe.com') {
    return adminApp.fetch(c.req.raw, c.env, c.executionCtx);
  }
  return publicApp.fetch(c.req.raw, c.env, c.executionCtx);
});

export default app;