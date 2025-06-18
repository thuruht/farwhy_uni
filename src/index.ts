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

// Events API (public)
api.get('/events', (c) => handleEvents(c, 'list'));
api.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));

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
  <title>Admin Login - Farewell/Howdy</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/fleeting-journey.css">
  <style>
    .login-container {
      max-width: 400px;
      margin: 5rem auto;
      padding: 2rem;
      background: var(--base2);
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .login-form input {
      padding: 0.75rem;
      border: 2px solid var(--base1);
      border-radius: 0.5rem;
      font-size: 1rem;
    }
    .login-form button {
      padding: 0.75rem;
      background: var(--blue);
      color: var(--base3);
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    .login-form button:hover {
      background: var(--cyan);
    }
    .error {
      color: var(--red);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <h1>Admin Login</h1>
    <form class="login-form" id="loginForm">
      <input type="password" id="password" placeholder="Admin Password" required>
      <button type="submit">Login</button>
    </form>
    <div id="error" class="error"></div>
  </div>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
          window.location.href = '/admin';
        } else {
          errorDiv.textContent = result.error || 'Login failed';
        }
      } catch (error) {
        errorDiv.textContent = 'Login failed - please try again';
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

// Route for triggering the legacy sync (requires auth)
admin.post('/api/sync-events', authenticate, (c) => handleSync(c));

// Wire up the routers
app.route('/api', api);
app.route('/admin', admin);

// --- Host-based Routing ---
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  
  // Admin domain: handle admin routes
  if (host.startsWith('admin.')) {
    // Let admin routes handle all admin domain requests
    if (c.req.path.startsWith('/admin') || 
        c.req.path.startsWith('/api/') || 
        c.req.path.startsWith('/login') ||
        c.req.path.startsWith('/css/') ||
        c.req.path.startsWith('/jss/')) {
      return await next();
    }
    // Redirect root to login page
    if (c.req.path === '/') {
      return c.redirect('/login');
    }
    // Serve static assets for admin domain
    try {
      const asset = await c.env.ASSETS.fetch(new Request(`http://localhost${c.req.path}`));
      return new Response(asset.body, {
        headers: asset.headers
      });
    } catch (e) {
      return c.redirect('/login');
    }
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
