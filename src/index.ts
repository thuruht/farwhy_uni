// src/index.ts
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleBlog } from './handlers/blog';
import { authenticate } from './middleware/auth';
import { generateUnifiedDashboardHTML } from './dashboard/unified-admin-dashboard';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for API routes
app.use('/api/*', cors());

// Handle host-based routing first
app.use('*', async (c, next) => {
  const host = c.req.header('host') || '';
  console.log(`[DEBUG] Processing request for ${host} ${c.req.method} ${c.req.path}`);
  
  if (host.startsWith('admin.')) {
    // First handle static assets
    if (c.req.path.match(/^\/(css|jss|img|f)\//)) {
      console.log('[DEBUG] Serving admin static asset');
      try {
        return await c.env.ASSETS.fetch(c.req.raw);
      } catch (e) {
        return c.text('Asset not found', 404);
      }
    }
    
    // Then handle API routes
    if (c.req.path.startsWith('/api/')) {
      console.log('[DEBUG] Processing admin API request');
      return await next();
    }

    // For authenticated users, serve the dashboard
    const cookie = c.req.header('cookie') || '';
    const tokenMatch = cookie.match(/sessionToken=([^;]+)/);
    if (tokenMatch) {
      const token = tokenMatch[1];
      try {
        const sessionData = await c.env.SESSIONS_KV.get(token);
        if (sessionData) {
          return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <!-- Include your CSS and other head elements -->
</head>
<body>
  <h1>Admin Dashboard</h1>
  <p>You are logged in!</p>
  <!-- Add your dashboard content -->
</body>
</html>`);
        }
      } catch (e) {
        console.error('Session verification failed:', e);
      }
    }

    // If not authenticated or session invalid, serve login page
    return serveLoginPage(c);
  }
  
  // Continue to next handler for non-admin domains
  await next();
});

// Admin API routes
app.post('/api/login', (c) => handleAuth(c, 'login'));
app.post('/api/logout', (c) => handleAuth(c, 'logout'));

// Protected admin API routes
app.use('/api/*', authenticate);
app.get('/api/events', (c) => handleEvents(c, 'list'));
app.post('/api/events', (c) => handleEvents(c, 'create'));
app.put('/api/events/:id', (c) => handleEvents(c, 'update'));
app.delete('/api/events/:id', (c) => handleEvents(c, 'delete'));
app.get('/api/blog/posts', async (c) => {
  const response = await handleBlog(c.req.raw, c.env);
  return new Response(response.body, response);
});
app.post('/api/blog/posts', async (c) => {
  const response = await handleBlog(c.req.raw, c.env);
  return new Response(response.body, response);
});

// Public API routes (for dev.farewellcafe.com)
app.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
app.get('/archives', (c) => handleEvents(c, 'archives'));
app.get('/api/events/slideshow', (c) => handleEvents(c, 'slideshow'));

// Serve static files and handle SPA routing for non-admin domains
app.get('*', async (c) => {
  const host = c.req.header('host') || '';
  if (host.startsWith('admin.')) {
    return serveLoginPage(c);
  }
  
  try {
    return await c.env.ASSETS.fetch(c.req.raw);
  } catch (e) {
    try {
      return await c.env.ASSETS.fetch(new Request('http://localhost/index.html'));
    } catch (e) {
      return c.text('Not found', 404);
    }
  }
});

// Function to serve the login page with username field
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
  <div class="admin-header">
    <h1>administration!</h1>
  </div>
  <main>
    <div class="login-container">
      <div class="login-title">log in</div>
      <form id="loginForm">
        <div class="form-group">
          <label for="username">username:</label>
          <input type="text" id="username" name="username" required autocomplete="username" placeholder="enter username">
        </div>
        <div class="form-group">
          <label for="password">pass:</label>
          <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="enter password">
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
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.get('username'),
            password: formData.get('password')
          })
        });
        const result = await response.json();
        if (result.success) {
          window.location.href = '/';
        } else {
          document.getElementById('error').textContent = result.error || 'invalid credentials';
        }
      } catch (err) {
        document.getElementById('error').textContent = 'try again later.';
      }
    });
  </script>
</body>
</html>`);
}

// Serve login page for unauthenticated users
app.get('/login', (c) => serveLoginPage(c));

// Protected dashboard route
app.get('/', authenticate, async (c) => {
  try {
    const html = generateUnifiedDashboardHTML();
    return c.html(html);
  } catch (e) {
    console.error('Error serving dashboard:', e);
    return c.text('Error loading dashboard', 500);
  }
});

// Fallback route - serve login for unauthenticated, redirect to dashboard for authenticated
app.get('*', async (c) => {
  // Check for authentication
  const cookie = c.req.header('cookie') || '';
  const tokenMatch = cookie.match(/sessionToken=([^;]+)/);
  
  if (tokenMatch) {
    const token = tokenMatch[1];
    try {
      const sessionData = await c.env.SESSIONS_KV.get(token);
      if (sessionData) {
        return c.redirect('/'); // Redirect to dashboard if authenticated
      }
    } catch (e) {
      console.error('Session verification failed:', e);
    }
  }
  
  return serveLoginPage(c);
});

export default app;
