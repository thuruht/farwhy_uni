// src/handlers/thrift.ts
import { Context } from 'hono';
import { Env, ThriftItem, ThriftContent, ThriftSocialLink } from '../types/env';

type ThriftAction = 'page-content' | 'list-content' | 'create-content' | 'update-content' | 'delete-content' |
                    'list-items' | 'create-item' | 'update-item' | 'delete-item' |
                    'list-social' | 'create-social' | 'update-social' | 'delete-social';

// Public endpoint - get all content for the thrift store page
async function getPageContent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  
  // Get all active content sections
  const { results: content } = await FWHY_D1.prepare(`
    SELECT * FROM thrift_content 
    WHERE active = 1 
    ORDER BY display_order ASC, section ASC
  `).all();
  
  // Get all active social links
  const { results: socialLinks } = await FWHY_D1.prepare(`
    SELECT * FROM thrift_social_links 
    WHERE active = 1 
    ORDER BY display_order ASC
  `).all();
  
  // Get available items
  const { results: items } = await FWHY_D1.prepare(`
    SELECT * FROM thrift_items 
    WHERE status = 'available' 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all();
  
  // Organize content by section
  const contentSections: { [key: string]: any[] } = {};
  (content as ThriftContent[] || []).forEach(item => {
    if (!contentSections[item.section]) {
      contentSections[item.section] = [];
    }
    contentSections[item.section].push(item);
  });
  
  return c.json({
    success: true,
    data: {
      content: contentSections,
      socialLinks: socialLinks || [],
      featuredItems: items || []
    }
  });
}

// Content management
async function listContent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const section = c.req.query('section');
  
  let query = "SELECT * FROM thrift_content ORDER BY section ASC, display_order ASC";
  let params: any[] = [];
  
  if (section) {
    query = "SELECT * FROM thrift_content WHERE section = ? ORDER BY display_order ASC";
    params = [section];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  return c.json({ success: true, data: results || [] });
}

async function createContent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { section, title, content, custom_css, display_order = 0 } = await c.req.json();
  
  if (!section || !content) {
    return c.json({ success: false, error: "Section and content are required" }, 400);
  }
  
  const result = await FWHY_D1.prepare(`
    INSERT INTO thrift_content (section, title, content, custom_css, display_order, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(section, title, content, custom_css, display_order).run();
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201);
}

async function updateContent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const contentId = c.req.param('id');
  const { section, title, content, custom_css, display_order, active } = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE thrift_content SET 
      section = ?, title = ?, content = ?, custom_css = ?, display_order = ?, active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(section, title, content, custom_css, display_order, active ? 1 : 0, contentId).run();
  
  return c.json({ success: true });
}

async function deleteContent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const contentId = c.req.param('id');
  
  await FWHY_D1.prepare("DELETE FROM thrift_content WHERE id = ?").bind(contentId).run();
  return c.json({ success: true });
}

// Item management
async function listItems(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const status = c.req.query('status') || 'available';
  const category = c.req.query('category');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  let query = "SELECT * FROM thrift_items WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
  let params: any[] = [status, limit, offset];
  
  if (category) {
    query = "SELECT * FROM thrift_items WHERE status = ? AND category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params = [status, category, limit, offset];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  return c.json({ success: true, data: results || [] });
}

async function createItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { name, description, price, category, condition, image_url } = await c.req.json();
  
  if (!name) {
    return c.json({ success: false, error: "Name is required" }, 400);
  }
  
  const result = await FWHY_D1.prepare(`
    INSERT INTO thrift_items (name, description, price, category, condition, image_url, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(name, description, price, category, condition, image_url).run();
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201);
}

async function updateItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const itemId = c.req.param('id');
  const { name, description, price, category, condition, image_url, status } = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE thrift_items SET 
      name = ?, description = ?, price = ?, category = ?, condition = ?, image_url = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(name, description, price, category, condition, image_url, status, itemId).run();
  
  return c.json({ success: true });
}

async function deleteItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const itemId = c.req.param('id');
  
  await FWHY_D1.prepare("DELETE FROM thrift_items WHERE id = ?").bind(itemId).run();
  return c.json({ success: true });
}

// Social links management
async function listSocialLinks(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  
  const { results } = await FWHY_D1.prepare(`
    SELECT * FROM thrift_social_links 
    WHERE active = 1 
    ORDER BY display_order ASC
  `).all();
  
  return c.json({ success: true, data: results || [] });
}

async function createSocialLink(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { platform, url, display_name, icon_class, display_order = 0 } = await c.req.json();
  
  if (!platform || !url) {
    return c.json({ success: false, error: "Platform and URL are required" }, 400);
  }
  
  const result = await FWHY_D1.prepare(`
    INSERT INTO thrift_social_links (platform, url, display_name, icon_class, display_order, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(platform, url, display_name, icon_class, display_order).run();
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201);
}

async function updateSocialLink(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const linkId = c.req.param('id');
  const { platform, url, display_name, icon_class, display_order, active } = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE thrift_social_links SET 
      platform = ?, url = ?, display_name = ?, icon_class = ?, display_order = ?, active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(platform, url, display_name, icon_class, display_order, active ? 1 : 0, linkId).run();
  
  return c.json({ success: true });
}

async function deleteSocialLink(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const linkId = c.req.param('id');
  
  await FWHY_D1.prepare("DELETE FROM thrift_social_links WHERE id = ?").bind(linkId).run();
  return c.json({ success: true });
}

export async function handleThrift(
  c: Context<{ Bindings: Env }>, 
  action: ThriftAction
) {
  try {
    switch (action) {
      case 'page-content':
        return getPageContent(c);
      case 'list-content':
        return listContent(c);
      case 'create-content':
        return createContent(c);
      case 'update-content':
        return updateContent(c);
      case 'delete-content':
        return deleteContent(c);
      case 'list-items':
        return listItems(c);
      case 'create-item':
        return createItem(c);
      case 'update-item':
        return updateItem(c);
      case 'delete-item':
        return deleteItem(c);
      case 'list-social':
        return listSocialLinks(c);
      case 'create-social':
        return createSocialLink(c);
      case 'update-social':
        return updateSocialLink(c);
      case 'delete-social':
        return deleteSocialLink(c);
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400);
    }
  } catch (e: any) {
    console.error(`Thrift handler error in action ${action}:`, e);
    return c.json({ success: false, error: 'Failed to process thrift request' }, 500);
  }
}
