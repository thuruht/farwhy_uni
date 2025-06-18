// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleBlog } from './handlers/blog';
import { authenticate } from './middleware/auth';
import { generateUnifiedDashboardHTML } from './dashboard/unified-admin-dashboard';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// Add CORS for API endpoints
app.use('/api/*', cors());

// --- Host-based Routing (FIRST - before other routes) ---
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  console.log(`[DEBUG] Host: ${host}, Path: ${c.req.path}`);
  
  // Admin domain: handle admin routes
  if (host.startsWith('admin.')) {
    console.log(`[DEBUG] Admin domain detected, path: ${c.req.path}`);
    
    // Serve static assets for admin domain (CSS, JS, fonts, images etc.)
    if (c.req.path.startsWith('/css/') ||
        c.req.path.startsWith('/jss/') ||
        c.req.path.startsWith('/img/') ||
        c.req.path.startsWith('/f/')) {
      console.log(`[DEBUG] Serving static asset: ${c.req.path}`);
      try {
        const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
        return new Response(asset.body, {
          headers: asset.headers
        });
      } catch (e) {
        return c.text('Asset not found', 404);
      }
    }
    
    // Handle admin routes
    if (c.req.path.startsWith('/admin')) {
      console.log(`[DEBUG] Admin route detected: ${c.req.path}`);
      return await next();
    }
    
    // Redirect root and /login to admin login page
    if (c.req.path === '/' || c.req.path === '/login') {
      console.log(`[DEBUG] Redirecting ${c.req.path} to /admin/login`);
      return c.redirect('/admin/login');
    }
    
    // For any other path on admin domain, redirect to login
    console.log(`[DEBUG] Other admin path, redirecting to login: ${c.req.path}`);
    return c.redirect('/admin/login');
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
  
  // Continue to next handler for non-host-specific routes
  return await next();
});

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

// Events API (public)
api.get('/events', (c) => handleEvents(c, 'list'));
api.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));

// Blog API (public)
api.get('/blog/posts', async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});
api.get('/blog/featured', async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});

// Legacy sync from old site (public for testing)
api.post('/sync-events', (c) => handleSync(c));

// --- Admin Dashboard & API ---
const admin = new Hono<{ Bindings: Env }>();

// Login page (no auth required)
admin.get('/login', (c) => {
  console.log('[DEBUG] Admin login route hit!');
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
  <div class="admin-header">
    <h1>administration!</h1>
  </div>
  <main>
    <div class="login-container">
      <div class="login-title">log in</div>
      <form id="loginForm">
        <div class="form-group">
          <label for="password">pass:</label>
          <input type="password" id="password" name="password" required autocomplete="current-password">
        </div>
        <button type="submit" class="login-btn">let me in</button>
        <div id="error" class="error"></div>
      </form>
    </div>
  </main>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      try {
        const response = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'anmid',
            password: formData.get('password')
          })
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = '/admin';
        } else {
          document.getElementById('error').textContent = result.error || 'nope.';
        }
      } catch (err) {
        document.getElementById('error').textContent = 'try again later.';
      }
    });
  </script>
</body>
</html>`);
});

// Auth API (no auth required)
admin.post('/api/login', (c) => handleAuth(c, 'login'));
admin.post('/api/logout', (c) => handleAuth(c, 'logout'));

// Serve the admin dashboard HTML (redirect to login if not authenticated)
admin.get('/', async (c) => {
  const { SESSIONS_KV, JWT_SECRET } = c.env;
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sessionToken=([^;]+)/);
  
  // Check if user is authenticated
  let isAuthenticated = false;
  
  if (match) {
    const token = match[1];
    
    // Try JWT verification
    try {
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
          isAuthenticated = true;
        }
      }
    } catch (e) {
      // JWT verification failed, try session
    }
    
    // Fallback to KV session check
    if (!isAuthenticated && token.includes('-')) {
      const session = await SESSIONS_KV.get(token);
      if (session) {
        isAuthenticated = true;
      }
    }
  }
  
  if (isAuthenticated) {
    // Serve the redesigned admin.html file
    try {
      const asset = await c.env.ASSETS.fetch(new Request('http://localhost/admin.html'));
      return new Response(asset.body, {
        headers: {
          'content-type': 'text/html'
        }
      });
    } catch (e) {
      console.error('Error serving admin.html:', e);
      return c.text('Admin dashboard not found', 404);
    }
  } else {
    return c.redirect('/admin/login');
  }
});

// Also serve the admin dashboard at /dashboard
admin.get('/dashboard', async (c) => {
  const { SESSIONS_KV, JWT_SECRET } = c.env;
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sessionToken=([^;]+)/);
  
  // Check if user is authenticated
  let isAuthenticated = false;
  
  if (match) {
    const token = match[1];
    
    // Try JWT verification
    try {
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
          isAuthenticated = true;
        }
      }
    } catch (e) {
      // JWT verification failed, try session
    }
    
    // Fallback to KV session check
    if (!isAuthenticated && token.includes('-')) {
      const session = await SESSIONS_KV.get(token);
      if (session) {
        isAuthenticated = true;
      }
    }
  }
  
  if (isAuthenticated) {
    // Serve the redesigned admin.html file
    try {
      const asset = await c.env.ASSETS.fetch(new Request('http://localhost/admin.html'));
      return new Response(asset.body, {
        headers: {
          'content-type': 'text/html'
        }
      });
    } catch (e) {
      console.error('Error serving admin.html:', e);
      return c.text('Admin dashboard not found', 404);
    }
  } else {
    return c.redirect('/admin/login');
  }
});

// Admin APIs for Events (requires auth)
admin.get('/api/events', authenticate, (c) => handleEvents(c, 'list'));
admin.post('/api/events', authenticate, (c) => handleEvents(c, 'create'));
admin.put('/api/events/:id', authenticate, (c) => handleEvents(c, 'update'));
admin.delete('/api/events/:id', authenticate, (c) => handleEvents(c, 'delete'));

// Admin APIs for flyer uploads (requires auth)
admin.post('/api/flyers/upload', authenticate, (c) => handleEvents(c, 'upload-flyer'));

// Admin APIs for Blog (requires auth)
admin.get('/api/blog', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});
admin.post('/api/blog', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });
  return await handleBlog(request, c.env);
});
admin.put('/api/blog', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });
  return await handleBlog(request, c.env);
});
admin.delete('/api/blog', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});

// Individual blog post routes with ID parameter
admin.get('/api/blog/:id', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});
admin.put('/api/blog/:id', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });
  return await handleBlog(request, c.env);
});
admin.delete('/api/blog/:id', authenticate, async (c) => {
  const request = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.raw.headers
  });
  return await handleBlog(request, c.env);
});

// Route for triggering the legacy sync (requires auth)
admin.post('/api/sync-events', authenticate, (c) => handleSync(c));

// Wire up the routers (IMPORTANT: Must be after router definitions but before middleware)
console.log('[DEBUG] Mounting routers...');
app.route('/api', api);
app.route('/admin', admin);
console.log('[DEBUG] Routers mounted successfully');

// --- Image serving from R2 ---
app.get('/images/*', async (c) => {
  try {
    const imagePath = c.req.path.replace('/images/', '');
    const object = await c.env.FWHY_IMAGES.get(imagePath);
    
    if (!object) {
      return c.text('Image not found', 404);
    }
    
    const headers = new Headers();
    
    // Detect content type from file extension
    const contentType = imagePath.toLowerCase().endsWith('.png') ? 'image/png' :
                       imagePath.toLowerCase().endsWith('.webp') ? 'image/webp' :
                       imagePath.toLowerCase().endsWith('.gif') ? 'image/gif' :
                       'image/jpeg'; // Default to JPEG
    
    headers.set('content-type', contentType);
    headers.set('cache-control', 'public, max-age=31536000'); // 1 year cache
    
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return c.text('Error serving image', 500);
  }
});

// --- Fallback for any unmatched routes ---
app.get('*', async (c) => {
  const host = c.req.header('host') || '';
  console.log(`[DEBUG] FALLBACK HIT - Host: ${host}, Path: ${c.req.path}`);
  console.log(`[DEBUG] This should NOT happen for admin.farewellcafe.com/`);
  
  try {
    const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
    console.log(`[DEBUG] Fallback serving asset: ${c.req.path}`);
    return new Response(asset.body, {
      headers: asset.headers
    });
  } catch (e) {
    console.log(`[DEBUG] Fallback asset not found: ${c.req.path}`);
    return c.text('Not found', 404);
  }
});

export default app;
