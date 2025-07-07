// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';
import { handleAuth } from './handlers/auth';
import { handleEvents } from './handlers/events';
import { handleSync } from './handlers/sync';
import { handleMenu } from './handlers/menu';
import { handleHours } from './handlers/hours';
import { handleFeatured } from './handlers/featured';
// import { handleBlog } from './handlers/blog'; // We now import individual handlers instead
import {
    getPublicPosts,
    getFeaturedContent,
    listAllPosts,
    createPost,
    getPostById,
    updatePostById,
    deletePostById,
    setFeaturedContent,
    uploadBlogImage // Added import for the new image upload handler
} from './handlers/blog';
import { authMiddleware } from './middleware/auth';
import { Env } from './types/env';

const app = new Hono<{ Bindings: Env }>();

// ====================================
// API ROUTING
// ====================================
app.use('/api/*', timing());
app.use('/api/*', cors());

// Authentication endpoints (login, logout, session check)
app.post('/api/login', c => handleAuth(c, 'login'));
app.post('/api/logout', c => handleAuth(c, 'logout'));
app.get('/api/check', c => handleAuth(c, 'check'));

// --- Image serving from R2 ---
app.get('/images/*', async (c) => {
  const path = c.req.path.replace('/images/', '');
  
  try {
    // Security check: Only allow specific image paths and extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const hasValidExtension = allowedExtensions.some(ext => path.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension) {
      console.warn(`[SECURITY] Blocked request for non-image file: ${path}`);
      return new Response('Not found', { status: 404 });
    }
    
    // Prevent directory traversal attacks
    if (path.includes('../') || path.includes('..\\') || path.startsWith('/')) {
      console.warn(`[SECURITY] Blocked directory traversal attempt: ${path}`);
      return new Response('Not found', { status: 404 });
    }
    
    // For admin-uploaded content, some paths might require authorization
    if (path.startsWith('admin/')) { // REMOVED 'flyers/' and 'blog/' from this check
      // Check if user has admin access for private images
      const { JWT_SECRET, SESSIONS_KV } = c.env;
      let isAuthorized = false;
      
      // Try to get token from cookie first
      let token: string | null = null;
      const cookie = c.req.header('cookie') || '';
      const cookieMatch = cookie.match(/sessionToken=([^;]+)/);
      
      if (cookieMatch) {
        token = cookieMatch[1];
      } else {
        // Fallback to Authorization header
        const authHeader = c.req.header('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (token) {
        try {
          // Use the same JWT verification as auth middleware
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
              const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
              
              // Check expiration
              if (!decodedPayload.exp || decodedPayload.exp > Date.now() / 1000) {
                // Check if token is in the blocklist
                if (decodedPayload.jti) {
                  const isBlocked = await SESSIONS_KV.get(`blocked:${decodedPayload.jti}`);
                  if (!isBlocked) {
                    isAuthorized = true;
                  }
                } else {
                  isAuthorized = true; // Legacy token without jti
                }
              }
            }
          }
        } catch (error) {
          console.warn(`[SECURITY] JWT verification failed for image request: ${error}`);
        }
      }
      
      if (!isAuthorized) {
        console.warn(`[SECURITY] Unauthorized access attempt to private image: ${path}`);
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    // Get the image from R2
    const object = await c.env.FWHY_IMAGES.get(path);
    
    if (!object) {
      // Return a 404 if the image doesn't exist
      return new Response('Image not found', { status: 404 });
    }
    
    // Return the image with appropriate headers
    const headers = new Headers();
    
    // Set content type header if available
    if (object.httpMetadata?.contentType) {
      headers.set('Content-Type', object.httpMetadata.contentType);
    }
    
    // Set appropriate cache headers based on image type
    if (path.startsWith('blog/') || path.startsWith('flyers/') || path.startsWith('admin/')) {
      headers.set('Cache-Control', 'private, max-age=3600'); // Private cache for 1 hour
    } else {
      headers.set('Cache-Control', 'public, max-age=31536000'); // Public cache for 1 year
    }
    
    return new Response(object.body, {
      headers
    });
  } catch (error) {
    console.error('Error serving image from R2:', error);
    return new Response('Error fetching image', { status: 500 });
  }
});

// --- Public API Routes ---
const publicApi = new Hono<{ Bindings: Env }>();
publicApi.get('/health', (c) => c.json({ status: 'ok' }));
publicApi.get('/events', (c) => handleEvents(c, 'list'));
publicApi.get('/events/slideshow', (c) => handleEvents(c, 'slideshow'));
publicApi.get('/events/:id', (c) => {
  // Custom handler for getting event by ID since it's not in EventAction type
  const eventId = c.req.param('id');
  const { FWHY_D1 } = c.env;
  
  return c.json({ success: true, message: `Get event by ID endpoint` });
});
publicApi.get('/blog', getPublicPosts);
publicApi.get('/blog/posts', getPublicPosts); // Alternative endpoint that frontend uses
publicApi.get('/blog/featured', getFeaturedContent); // Specific endpoint for blog featured content - MUST come before /blog/:id
publicApi.get('/blog/:id', getPostById);
publicApi.get('/featured', (c) => handleFeatured(c, 'get')); // Main featured endpoint
publicApi.get('/venues/:venue/featured', (c) => {
  // Custom handler for venue-specific featured content
  const venue = c.req.param('venue');
  return c.json({ success: true, data: [], venue });
});
publicApi.get('/venues/:venue/menu', (c) => handleMenu(c, 'list'));
publicApi.get('/venues/:venue/menu-items', async (c) => {
  const { FWHY_D1 } = c.env;
  const venue = c.req.param('venue');
  
  try {
    // Get all menu items for the specified venue
    const { results } = await FWHY_D1.prepare(`
      SELECT mi.* 
      FROM menu_items mi
      JOIN menus m ON mi.menu_id = m.id
      WHERE m.venue = ? AND mi.active = 1
      ORDER BY mi.category, mi.display_order ASC, mi.name ASC
    `).bind(venue).all();
    
    if (!results || results.length === 0) {
      console.log(`No menu items found for venue ${venue}`);
      return c.json({ success: false, error: `No menu items found for ${venue}` }, 404);
    }
    
    console.log(`Found ${results.length} menu items for venue ${venue}`);
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error(`Error fetching menu items for ${venue}:`, error);
    return c.json({ success: false, error: `Failed to fetch menu items for ${venue}` }, 500);
  }
});
publicApi.get('/menu', async (c) => {
  const { FWHY_D1 } = c.env;
  try {
    // Get all menu items for Farewell (venue specific)
    const { results } = await FWHY_D1.prepare(`
      SELECT * FROM menu_items 
      WHERE active = 1
      ORDER BY category, display_order ASC, name ASC
    `).all();
    
    if (!results || results.length === 0) {
      console.log('No menu items found in database');
      return c.json({ success: false, error: "No menu items found" }, 404);
    }
    
    console.log(`Found ${results.length} menu items to return`);
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching unified menu:', error);
    return c.json({ success: false, error: "Failed to fetch menu items" }, 500);
  }
});
publicApi.get('/hours', (c) => handleHours(c, 'list-all'));
publicApi.get('/slideshow', (c) => handleEvents(c, 'slideshow'));

// Public authentication endpoints (login/logout/check)
publicApi.post('/login', (c) => handleAuth(c, 'login'));
publicApi.post('/logout', (c) => handleAuth(c, 'logout'));
publicApi.get('/check', (c) => handleAuth(c, 'check'));

// --- Admin API Routes ---
const adminApi = new Hono<{ Bindings: Env }>();
// Protect all admin endpoints with authentication middleware
adminApi.use('/*', authMiddleware());

// Add all admin routes here
adminApi.get('/health', (c) => c.json({ status: 'admin-ok' }));
adminApi.get('/events', (c) => handleEvents(c, 'list'));
adminApi.post('/events', (c) => handleEvents(c, 'create'));
adminApi.put('/events/:id', (c) => handleEvents(c, 'update'));
adminApi.delete('/events/:id', (c) => handleEvents(c, 'delete'));
adminApi.post('/events/sync', (c) => handleSync(c));
adminApi.post('/events/flyer', async (c) => {
  // Handle event flyer uploads
  try {
    const formData = await c.req.formData();
    const file = formData.get('flyer') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `flyers/event-${timestamp}.${extension}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.FWHY_IMAGES.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });
    
    const imageUrl = `/images/${filename}`;
    return c.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading event flyer:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});

// Menu CRUD endpoints for admin
adminApi.get('/venues/:venue/menu', async (c) => {
  const { FWHY_D1 } = c.env;
  const venue = c.req.param('venue');
  
  try {
    // Get menu info for the venue (simplified since we only have one menu)
    const menuData = {
      id: 1,
      venue: venue,
      name: `${venue.charAt(0).toUpperCase() + venue.slice(1)} Menu`,
      active: true
    };
    
    return c.json({ success: true, data: menuData });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return c.json({ success: false, error: 'Failed to fetch menu' }, 500);
  }
});

adminApi.post('/venues/:venue/menu', async (c) => {
  const venue = c.req.param('venue');
  const data = await c.req.json();
  
  // Since we only have one menu, just return success
  return c.json({ 
    success: true, 
    data: { 
      id: 1, 
      venue: venue, 
      name: data.name || `${venue} Menu`,
      active: true 
    } 
  });
});

adminApi.put('/venues/:venue/menu/:id', async (c) => {
  const venue = c.req.param('venue');
  const menuId = c.req.param('id');
  const data = await c.req.json();
  
  // Since we only have one menu, just return success
  return c.json({ 
    success: true, 
    data: { 
      id: parseInt(menuId), 
      venue: venue, 
      name: data.name || `${venue} Menu`,
      active: data.active !== false 
    } 
  });
});

adminApi.delete('/venues/:venue/menu/:id', async (c) => {
  const venue = c.req.param('venue');
  const menuId = c.req.param('id');
  
  // Since we only have one menu, return error for deletion
  return c.json({ success: false, error: 'Cannot delete the main menu' }, 400);
});

// Menu item image upload endpoint
adminApi.post('/menu-items/upload-image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `menu/menu-item-${timestamp}.${extension}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.FWHY_IMAGES.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });
    
    const imageUrl = `/images/${filename}`;
    return c.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading menu item image:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});
adminApi.get('/menu-items', async (c) => {
  const { FWHY_D1 } = c.env;
  try {
    // Simplified: Just get all menu items since there's only one menu
    const { results } = await FWHY_D1.prepare(`
      SELECT * FROM menu_items 
      WHERE active = 1
      ORDER BY category, display_order ASC, name ASC
    `).all();
    return c.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return c.json({ success: false, error: 'Failed to fetch menu items' }, 500);
  }
});
adminApi.get('/venues/:venue/menu-items', async (c) => {
  const { FWHY_D1 } = c.env;
  const venue = c.req.param('venue');
  
  try {
    // Simplified: Since there's only one menu (farewell), just get all menu items
    const { results } = await FWHY_D1.prepare(`
      SELECT * FROM menu_items 
      WHERE active = 1
      ORDER BY category, display_order ASC, name ASC
    `).all();
    
    console.log(`Found ${results?.length || 0} menu items for venue ${venue}`);
    return c.json({ success: true, data: results || [] });
  } catch (error) {
    console.error(`Error fetching menu items for ${venue}:`, error);
    return c.json({ success: false, error: `Failed to fetch menu items for ${venue}` }, 500);
  }
});
adminApi.post('/menu-items', (c) => handleMenu(c, 'create'));
adminApi.put('/menu-items/:id', (c) => handleMenu(c, 'update'));
adminApi.delete('/menu-items/:id', (c) => handleMenu(c, 'delete'));
adminApi.post('/menu-items/reorder', async (c) => {
  const { FWHY_D1 } = c.env;
  const data = await c.req.json();
  const { items } = data;
  
  if (!Array.isArray(items)) {
    return c.json({ success: false, error: 'Invalid items array' }, 400);
  }
  
  try {
    // Update display_order for each item
    const updates = items.map((item, index) => 
      FWHY_D1.prepare('UPDATE menu_items SET display_order = ? WHERE id = ?')
        .bind(index + 1, item.id)
    );
    
    await Promise.all(updates.map(stmt => stmt.run()));
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    return c.json({ success: false, error: 'Failed to reorder menu items' }, 500);
  }
});
adminApi.post('/venues/:venue/menu-items', async (c) => {
  const venue = c.req.param('venue');
  const data = await c.req.json();
  const { FWHY_D1 } = c.env;
  
  try {
    // Simplified: Since there's only one menu, just insert directly
    const { success, meta } = await FWHY_D1.prepare(`
      INSERT INTO menu_items (name, description, price, category, active, display_order)
      VALUES (?, ?, ?, ?, 1, COALESCE((SELECT MAX(display_order) FROM menu_items), 0) + 1)
    `).bind(data.name, data.description, data.price, data.category).run();
    
    if (success) {
      return c.json({ success: true, id: meta.last_row_id });
    } else {
      return c.json({ success: false, error: 'Failed to create menu item' }, 500);
    }
  } catch (error) {
    console.error('Error creating menu item:', error);
    return c.json({ success: false, error: 'Failed to create menu item' }, 500);
  }
});
adminApi.post('/hours', (c) => handleHours(c, 'create'));
adminApi.put('/hours/:id', (c) => handleHours(c, 'update'));
adminApi.delete('/hours/:id', (c) => handleHours(c, 'delete'));
adminApi.post('/featured', (c) => handleFeatured(c, 'update'));
adminApi.get('/featured', (c) => handleFeatured(c, 'list'));
adminApi.get('/blog/posts', listAllPosts);
adminApi.post('/blog/posts', createPost);
adminApi.put('/blog/posts/:id', updatePostById);
adminApi.delete('/blog/posts/:id', deletePostById);
adminApi.get('/blog/featured', getFeaturedContent); // GET endpoint for admin featured content
adminApi.post('/blog/featured', setFeaturedContent); // POST endpoint for admin featured content
adminApi.post('/blog/upload-image', async (c) => {
  // Handle blog image uploads
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `blog/blog-${timestamp}.${extension}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.FWHY_IMAGES.put(filename, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });
    
    const imageUrl = `/images/${filename}`;
    return c.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error uploading blog image:', error);
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
});
adminApi.post('/blog', createPost);
adminApi.put('/blog/:id', updatePostById);
adminApi.delete('/blog/:id', deletePostById);

// Menu cleanup endpoint to remove duplicates
adminApi.post('/menu/cleanup', async (c) => {
  const { FWHY_D1 } = c.env;
  
  try {
    console.log('Starting menu cleanup process...');
    
    // First, get all menu items grouped by unique combinations
    const { results: duplicates } = await FWHY_D1.prepare(`
      SELECT name, description, price, category, menu_id, COUNT(*) as count,
             GROUP_CONCAT(id) as ids
      FROM menu_items
      GROUP BY name, description, price, category, menu_id
      HAVING COUNT(*) > 1
    `).all();
    
    if (!duplicates || duplicates.length === 0) {
      return c.json({ success: true, message: 'No duplicates found', cleaned: 0 });
    }
    
    let totalCleaned = 0;
    
    // For each group of duplicates, keep the oldest one and delete the rest
    for (const duplicate of duplicates) {
      const ids = (duplicate as any).ids.split(',');
      const idsToDelete = ids.slice(1); // Keep the first (oldest) one
      
      for (const id of idsToDelete) {
        await FWHY_D1.prepare(`DELETE FROM menu_items WHERE id = ?`).bind(id).run();
        totalCleaned++;
      }
    }
    
    console.log(`Menu cleanup complete. Removed ${totalCleaned} duplicate items.`);
    return c.json({ 
      success: true, 
      message: `Cleanup complete. Removed ${totalCleaned} duplicate items.`,
      cleaned: totalCleaned 
    });
  } catch (error) {
    console.error('Error during menu cleanup:', error);
    return c.json({ success: false, error: 'Cleanup failed' }, 500);
  }
});

// Migration endpoints
adminApi.post('/migrate/events', async (c) => {
  const { FWHY_D1 } = c.env;
  
  try {
    // Check if migration has already been run
    const { results: existingColumns } = await FWHY_D1.prepare(`
      PRAGMA table_info(events)
    `).all();
    
    const hasTicketUrl = existingColumns?.some((col: any) => col.name === 'ticket_url');
    
    if (!hasTicketUrl) {
      // Add ticket_url column if it doesn't exist
      await FWHY_D1.prepare(`
        ALTER TABLE events ADD COLUMN ticket_url TEXT
      `).run();
      
      console.log('Added ticket_url column to events table');
    }
    
    return c.json({ 
      success: true, 
      message: 'Event schema migration completed',
      changes_made: !hasTicketUrl
    });
  } catch (error) {
    console.error('Error during events migration:', error);
    return c.json({ success: false, error: 'Migration failed' }, 500);
  }
});

// Mount admin API before public API to avoid prefix conflicts
app.route('/api/admin', adminApi);
app.route('/api', publicApi);

// ====================================
// FRONTEND & ASSET SERVING
// ====================================

// --- Root-level legacy routes for backward compatibility ---
app.get('/list/:state', (c) => handleEvents(c, 'list', { venue: c.req.param('state') }));
app.get('/archives', (c) => handleEvents(c, 'archives', { venue: c.req.query('type') }));


// --- Final catch-all route for serving the SPA and static assets ---
app.get('*', async (c) => {
    const host = c.req.header('host') || '';
    try {
        // First, try to serve a static asset (CSS, JS, fonts, images)
        return await c.env.ASSETS.fetch(c.req.raw);
    } catch (e) {
        // Not a static file, fall through to serve the HTML shell.
    }

    if (host.startsWith('admin.')) {
        return c.env.ASSETS.fetch(new Request(new URL('/admin.html', c.req.url)));
    }

    // Fallback for public site
    return c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
});

export default app;
