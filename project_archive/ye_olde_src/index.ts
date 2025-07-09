// src/index.ts - NEW, SIMPLIFIED VERSION
import { Hono, Context } from 'hono';
import type { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// This is the only route handler needed for serving the frontend.
app.get('*', async (c) => {
  const host = c.req.header('host') || '';

  try {
    // First, try to serve a static asset from the /public directory
    const asset = await c.env.ASSETS.fetch(c.req.raw);
    if (asset.ok) {
      return asset;
    }
  } catch (e) {
    // This isn't an error, it just means the path is not a static file.
    // We will now serve the HTML for the Single-Page Application.
  }

  // If the request was not for a static asset, serve the correct SPA shell.
  if (host.startsWith('admin.')) {
    // For the admin domain, serve admin.html.
    // The JavaScript in this file will handle showing the login or dashboard.
    return c.env.ASSETS.fetch(new Request(new URL('/admin.html', c.req.url)));
  } else {
    // For the public domain, serve index.html
    return c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
  }
});

export default app;