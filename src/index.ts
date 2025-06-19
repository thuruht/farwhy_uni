// src/index.ts - Complete overhaul
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleBlog } from './handlers/blog';
import { authMiddleware } from './middleware/auth';
import { Env } from './types/env';

// Create the main app
const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', timing());

// Function to serve the login page
function serveLoginPage(c: Context<{ Bindings: Env }>) {
  console.log('[DEBUG] Serving login page');
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>admin login</title>
  <link rel="stylesheet" href="/css/ccssss.css">
  <link rel="stylesheet" href="/css/fleeting-journey.css">
  <style>
    body {
      background: var(--header-bg);
      font-family: var(--font-main, 'Lora', serif);
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }
    .admin-header {
      width: 100%;
      background: var(--primary-bg-color) url('/img/bg4.png') center/cover no-repeat;
      background-attachment: fixed;
      border-bottom: 1px solid var(--nav-border-color);
      padding: 1rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 212px;
    }
    .admin-header h1 {
      font-family: var(--font-db, 'Lora', serif);
      font-size: clamp(2.5rem, 8vw, 4em);
      color: var(--secondary-bg-color);
      -webkit-text-stroke: 1px black;
      text-shadow: -1px -1px 0 #000,
           1px -1px 0 #000,
          -1px  1px 0 #000,
           1px  1px 0 #000,
          -8px 8px 0px var(--nav-border-color);
      margin: 0;
    }
    .login-container {
      background: var(--card-bg-color);
      border: 2px solid var(--nav-border-color);
      border-radius: 8px;
      box-shadow: -5px 5px 0px rgba(0,0,0,0.08);
      padding: 2.5rem 2rem 2rem 2rem;
      margin: 2rem auto 0 auto;
      max-width: 400px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .login-title {
      font-family: var(--font-db, 'Lora', serif);
      font-size: 2.2rem;
      color: var(--accent-color);
      margin-bottom: 1.5rem;
      text-shadow: 2px 2px 4px var(--header-text-shadow);
    }
    .form-group {
      width: 100%;
      margin-bottom: 1.2rem;
      text-align: left;
    }
    label {
      font-family: var(--font-main, 'Lora', serif);
      color: var(--accent-color);
      font-weight: bold;
      margin-bottom: 0.3rem;
      display: block;
    }
    input {
      width: 100%;
      padding: 0.8rem;
      border: 1.5px solid var(--nav-border-color);
      border-radius: 4px;
      font-family: var(--font-hnm11, 'Lora', serif);
      font-size: 1rem;
      background: rgba(255,255,255,0.95);
      color: var(--text-color);
      transition: border 0.2s;
    }
    input:focus {
      outline: none;
      border-color: var(--secondary-bg-color);
      box-shadow: -3px 3px 0px rgba(0,0,0,0.08);
    }
    .login-btn {
      width: 100%;
      padding: 1rem 2rem;
      background: var(--button-bg-color);
      color: var(--button-text-color);
      font-family: var(--font-main, 'Lora', serif);
      font-weight: bold;
      border-radius: 4px;
      border: 2px solid var(--text-color);
      font-size: 1.1rem;
      margin-top: 0.5rem;
      cursor: pointer;
      transition: all var(--transition-speed) ease;
    }
    .login-btn:hover {
      background: var(--accent-color);
      color: white;
      transform: translateY(-2px);
    }
    .error {
      color: var(--redd);
      margin-top: 0.7rem;
      font-size: 1rem;
      min-height: 1.2em;
      text-align: center;
      font-family: var(--font-main, 'Lora', serif);
    }
    @media (max-width: 600px) {
      .login-container { padding: 1.2rem 0.5rem; }
      .admin-header { min-height: 120px; padding: 0.5rem; }
      .admin-header h1 { font-size: 2rem; }
    }
  </style>
</head>
<body data-state="farewell">
  <div class="admin-header"><h1>administration!</h1></div>
  <main><div class="login-container"><div class="login-title">log in</div><form id="loginForm"><div class="form-group"><label for="username">username:</label><input type="text" id="username" name="username" required autocomplete="username" placeholder="enter username"></div><div class="form-group"><label for="password">pass:</label><input type="password" id="password" name="password" required autocomplete="current-password" placeholder="enter password"></div><button type="submit" class="login-btn">let me in</button><div id="error" class="error"></div></form></div></main>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: formData.get('username'), 
            password: formData.get('password') 
          })
        });
        const result = await response.json();
        if (response.ok && result.success) {
          window.location.href = '/';
        } else {
          document.getElementById('error').textContent = result.error || 'invalid credentials';
        }
      } catch (err) {
        document.getElementById('error').textContent = 'try again later.';
      }
    });
  </script>
</body></html>`);
}

// --- PUBLIC API ROUTES ---
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.use('*', cors());

// Public events endpoints
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));

// Legacy endpoints
publicApi.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
publicApi.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));

// Blog endpoints
publicApi.get('/blog/posts', (c) => handleBlog(c.req.raw, c.env));
publicApi.get('/blog/featured', (c) => handleBlog(c.req.raw, c.env));

// Mount public API
app.route('/api', publicApi);

// --- ADMIN API ROUTES ---
const adminApi = new Hono<{ Bindings: Env }>();
adminApi.use('*', cors());

// Auth endpoints (public)
adminApi.post('/login', (c) => handleAuth(c, 'login'));
adminApi.post('/logout', (c) => handleAuth(c, 'logout'));

// Protected endpoints
adminApi.get('/events', authMiddleware(['admin']), (c) => handleEvents(c, 'list'));
adminApi.post('/events', authMiddleware(['admin']), (c) => handleEvents(c, 'create'));
adminApi.put('/events/:id', authMiddleware(['admin']), (c) => handleEvents(c, 'update'));
adminApi.delete('/events/:id', authMiddleware(['admin']), (c) => handleEvents(c, 'delete'));
adminApi.post('/events/flyer', authMiddleware(['admin']), (c) => handleEvents(c, 'upload-flyer'));

// Blog admin endpoints
adminApi.get('/blog/posts', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.post('/blog/posts', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.put('/blog/:id', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));
adminApi.delete('/blog/:id', authMiddleware(['admin']), (c) => handleBlog(c.req.raw, c.env));

// Legacy sync
adminApi.post('/sync-events', authMiddleware(['admin']), (c) => handleSync(c));

// Mount admin API
app.route('/api', adminApi);

// --- HOST-BASED ROUTING ---
// For static assets and page serving
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  console.log(`[DEBUG] Host: ${host}, Path: ${c.req.path}`);
  
  // Static assets serving for both domains
  if (c.req.path.startsWith('/css/') || 
      c.req.path.startsWith('/jss/') || 
      c.req.path.startsWith('/img/') || 
      c.req.path.startsWith('/f/')) {
    console.log(`[DEBUG] Serving static asset: ${c.req.path}`);
    try {
      const asset = await c.env.ASSETS.fetch(c.req.raw);
      return asset;
    } catch (e) {
      console.error(`[ERROR] Asset not found: ${c.req.path}`, e);
      return c.text('Asset not found', 404);
    }
  }
  
  // Admin domain handling
  if (host.includes('admin.farewellcafe.com')) {
    console.log(`[DEBUG] Admin domain detected: ${host}, Path: ${c.req.path}`);
    // Admin login flow - check for existing session
    const cookie = c.req.header('cookie') || '';
    const hasSession = cookie.includes('sessionToken=');
    
    // Handle /admin/api/* paths - these should be passed to the next middleware
    if (c.req.path.startsWith('/api/')) {
      console.log(`[DEBUG] Admin API request: ${c.req.path}`);
      return next();
    }
    
    // For admin dashboard paths
    if (hasSession) {
      // If user has a session, serve admin dashboard
      console.log(`[DEBUG] Session found, serving admin dashboard`);
      try {
        const asset = await c.env.ASSETS.fetch(new Request('http://localhost/admin.html'));
        return new Response(asset.body, {
          headers: asset.headers
        });
      } catch (e) {
        console.error('[ERROR] Admin dashboard not found', e);
        return c.text('Admin dashboard not found', 404);
      }
    } else {
      // No session, serve login page
      console.log(`[DEBUG] No session found, serving login page`);
      return serveLoginPage(c);
    }
  }
  
  // Public domain fallback
  console.log(`[DEBUG] Public domain request: ${c.req.path}`);
  return next();
});

// --- ADMIN DOMAIN FALLBACK ---
// Serve login page for any other admin domain requests
app.get('*', async (c) => {
  const host = c.req.header('host') || '';
  
  if (host.includes('admin.farewellcafe.com')) {
    console.log(`[DEBUG] Admin domain fallback: ${c.req.path}`);
    return serveLoginPage(c);
  }
  
  // Public domain - serve static files or index.html for SPA
  try {
    console.log(`[DEBUG] Trying to serve: ${c.req.path}`);
    const asset = await c.env.ASSETS.fetch(c.req.raw);
    return asset;
  } catch (e) {
    // Fallback to index.html for SPA routes
    try {
      console.log(`[DEBUG] Fallback to index.html for: ${c.req.path}`);
      const asset = await c.env.ASSETS.fetch(new Request('http://localhost/index.html'));
      return new Response(asset.body, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } catch (e) {
      console.error(`[ERROR] Not found: ${c.req.path}`, e);
      return c.text('Not found', 404);
    }
  }
});

// Direct route for admin.farewellcafe.com root path
app.get('/', (c) => {
  const host = c.req.header('host') || '';
  if (host.includes('admin.')) {
    console.log(`[DEBUG] Admin domain root route: ${host}`);
    return serveLoginPage(c);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

// --- R2 IMAGE SERVING ---
app.get('/images/*', async (c) => {
  try {
    const imagePath = c.req.path.replace('/images/', '');
    console.log(`[DEBUG] Serving image: ${imagePath}`);
    const object = await c.env.FWHY_IMAGES.get(imagePath);
    
    if (!object) {
      return c.text('Image not found', 404);
    }
    
    const headers = new Headers();
    headers.set('cache-control', 'public, max-age=31536000'); // 1 year cache
    
    // Detect content type from file extension
    const contentType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                       imagePath.toLowerCase().endsWith('.webp') ? 'image/webp' :
                       imagePath.toLowerCase().endsWith('.gif') ? 'image/gif' :
                       'image/jpeg'; // Default to JPEG
    
    headers.set('content-type', contentType);
    
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return c.text('Error serving image', 500);
  }
});

export default app;