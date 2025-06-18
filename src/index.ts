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
  
  // Admin domain: handle admin routes
  if (host.startsWith('admin.')) {
    // Serve static assets for admin domain (CSS, JS, etc.)
    if (c.req.path.startsWith('/css/') ||
        c.req.path.startsWith('/jss/') ||
        c.req.path.startsWith('/img/')) {
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
      return await next();
    }
    
    // Redirect root and /login to admin login page
    if (c.req.path === '/' || c.req.path === '/login') {
      return c.redirect('/admin/login');
    }
    
    // For any other path on admin domain, redirect to login
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
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Administrate Me! - Farewell/Howdy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/fleeting-journey.css">
  <style>
    body {
      background: linear-gradient(135deg, var(--magenta), var(--cyan));
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-main);
      margin: 0;
      padding: 2rem;
    }
    
    .login-container {
      max-width: 450px;
      width: 100%;
      text-align: center;
      background: rgba(0, 23, 31, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 2rem;
      padding: 3rem 2.5rem;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      border: 2px solid var(--cyan);
    }
    
    .login-container h1 {
      color: var(--base3);
      font-size: 3rem;
      margin-bottom: 0.5rem;
      font-family: var(--font-hnb2);
      text-shadow: 0 0 20px var(--cyan);
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .login-subtitle {
      color: var(--base1);
      font-size: 1.2rem;
      margin-bottom: 2.5rem;
      font-family: var(--font-hnm11);
      opacity: 0.8;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      text-align: left;
    }
    
    .login-form label {
      font-weight: 600;
      color: var(--base2);
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
      font-family: var(--font-hnm11);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .login-form input {
      padding: 1.2rem;
      border: 2px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      font-size: 1.1rem;
      background: rgba(255, 255, 255, 0.05);
      color: var(--base3);
      font-family: var(--font-main);
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;
    }
    
    .login-form input:focus {
      outline: none;
      border-color: var(--cyan);
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 0 0 3px rgba(42, 161, 152, 0.2),
        0 0 20px rgba(42, 161, 152, 0.3);
      transform: translateY(-2px);
    }
    
    .login-form input::placeholder {
      color: var(--base1);
      opacity: 0.6;
    }
    
    .login-form button {
      padding: 1.3rem 2rem;
      background: linear-gradient(135deg, var(--blue), var(--violet));
      color: var(--base3);
      border: 2px solid var(--cyan);
      border-radius: 1rem;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: var(--font-hnb2);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 1rem;
      position: relative;
      overflow: hidden;
    }
    
    .login-form button:before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    
    .login-form button:hover {
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      transform: translateY(-3px);
      box-shadow: 
        0 15px 25px rgba(0, 0, 0, 0.2),
        0 0 30px var(--cyan);
      border-color: var(--magenta);
    }
    
    .login-form button:hover:before {
      left: 100%;
    }
    
    .login-form button:active {
      transform: translateY(-1px);
    }
    
    .error {
      color: var(--red);
      text-align: center;
      font-weight: 600;
      background: rgba(220, 50, 47, 0.1);
      padding: 1rem;
      border-radius: 1rem;
      border: 2px solid var(--red);
      font-family: var(--font-main);
      margin-top: 1.5rem;
      backdrop-filter: blur(5px);
      display: none;
    }
    
    .error.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .login-container {
        margin: 1rem;
        padding: 2rem 1.5rem;
      }
      
      .login-container h1 {
        font-size: 2.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>ADMINISTRATE ME!</h1>
    <p class="login-subtitle">Farewell & Howdy Management Portal</p>
    <form class="login-form" id="loginForm">
      <label for="username">Username</label>
      <input type="text" id="username" required placeholder="Enter your username">
      <label for="password">Password</label>
      <input type="password" id="password" required placeholder="Enter your password">
      <button type="submit">AUTHENTICATE</button>
    </form>
    <div id="error" class="error"></div>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const response = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          errorDiv.textContent = result.error || 'Login failed';
          errorDiv.classList.add('show');
          setTimeout(() => errorDiv.classList.remove('show'), 5000);
        }
      } catch (error) {
        errorDiv.textContent = 'Login failed - please try again';
        errorDiv.classList.add('show');
        setTimeout(() => errorDiv.classList.remove('show'), 5000);
      }
    });
  </script>
</body>
</html>`);
});

// Auth API (no auth required)
admin.post('/api/login', (c) => handleAuth(c, 'login'));
admin.post('/api/logout', (c) => handleAuth(c, 'logout'));

// Serve the admin dashboard HTML (requires auth)
admin.get('/', authenticate, (c) => c.html(generateUnifiedDashboardHTML()));

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
app.route('/api', api);
app.route('/admin', admin);

// --- Image serving from R2 ---
app.get('/images/*', async (c) => {
  try {
    const imagePath = c.req.path.replace('/images/', '');
    const object = await c.env.FWHY_IMAGES.get(imagePath);
    
    if (!object) {
      return c.text('Image not found', 404);
    }
    
    const headers = new Headers();
    headers.set('content-type', 'image/jpeg'); // Default to JPEG for flyer images
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
