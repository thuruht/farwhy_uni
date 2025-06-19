import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';

import { handleLogin, handleLogout } from './handlers/auth';
import { handleBlogPosts, handleFeaturedPost, handleAdminBlogPosts, handleAdminFeaturedPost, handleAdminCreateBlogPost, handleAdminUpdateBlogPost, handleAdminDeleteBlogPost } from './handlers/blog';
import { handleEvents }from './handlers/events-new';
import { handleMenu } from './handlers/menu';
import { handleSync } from './handlers/sync';
import { handleThrift } from './handlers/thrift';
import { requireAdminAuth } from './middleware/auth';
import { Env } from './types/env';

// --- Main Application Router ---
const app = new Hono<{ Bindings: Env }>();

// --- Middleware ---
app.use('*', timing());
app.use('/api/*', cors());

// --- Public API Routes (for dev.farewellcafe.com) ---
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/archives', (c) => handleEvents(c, 'archives'));
publicApi.get('/blog/posts', handleBlogPosts);
publicApi.get('/blog/featured', handleFeaturedPost);
publicApi.get('/menu', handleMenu);
publicApi.get('/sync', handleSync);
publicApi.get('/thrift', handleThrift);
publicApi.post('/login', handleLogin); // Public login endpoint

app.route('/api', publicApi);


// --- Admin Routes (for admin.farewellcafe.com) ---
const adminRoutes = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all admin routes
adminRoutes.use('*', requireAdminAuth);

// Admin API
adminRoutes.get('/api/events', (c) => handleEvents(c, 'list', { admin: true }));
adminRoutes.post('/api/events', (c) => handleEvents(c, 'create'));
adminRoutes.put('/api/events/:id', (c) => handleEvents(c, 'update'));
adminRoutes.delete('/api/events/:id', (c) => handleEvents(c, 'delete'));

adminRoutes.get('/api/blog/posts', handleAdminBlogPosts);
adminRoutes.get('/api/blog/featured', handleAdminFeaturedPost);
adminRoutes.post('/api/blog/posts', handleAdminCreateBlogPost);
adminRoutes.put('/api/blog/posts/:id', handleAdminUpdateBlogPost);
adminRoutes.delete('/api/blog/posts/:id', handleAdminDeleteBlogPost);

adminRoutes.post('/api/logout', handleLogout);

// Serve Admin UI (HTML, CSS, JS from /public)
adminRoutes.get('/*', serveStatic({ root: './public' }));
adminRoutes.get('/admin', serveStatic({ path: './public/admin.html' }));
adminRoutes.get('/admin/login', serveStatic({ path: './public/login.html' }));


// --- Main Routing Logic based on Hostname ---
app.all('*', async (c, next) => {
  const host = c.req.header('host');

  if (host === 'admin.farewellcafe.com') {
    return adminRoutes.fetch(c.req.raw, c.env, c.executionCtx);
  }

  // Default to serving public assets
  const staticMiddleware = serveStatic({ root: './public' });
  return staticMiddleware(c, next);
});


export default app;