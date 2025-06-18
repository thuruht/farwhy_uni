// src/handlers/menu.ts
import { Context } from 'hono';
import { Env, Menu, MenuItem } from '../types/env';

type MenuAction = 'list' | 'create' | 'update' | 'delete' | 'items' | 'create-item' | 'update-item' | 'delete-item';

async function listMenus(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const venue = c.req.query('venue');
  
  let query = "SELECT * FROM menus WHERE active = 1 ORDER BY display_order ASC, name ASC";
  let params: any[] = [];
  
  if (venue) {
    query = "SELECT * FROM menus WHERE venue = ? AND active = 1 ORDER BY display_order ASC, name ASC";
    params = [venue];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  return c.json({ success: true, data: results || [] });
}

async function createMenu(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { venue, name, display_order = 0 } = await c.req.json();
  
  if (!venue || !name) {
    return c.json({ success: false, error: "Venue and name are required" }, 400);
  }
  
  const result = await FWHY_D1.prepare(`
    INSERT INTO menus (venue, name, display_order, created_at, updated_at) 
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(venue, name, display_order).run();
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201);
}

async function updateMenu(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const menuId = c.req.param('id');
  const { venue, name, display_order, active } = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE menus SET 
      venue = ?, name = ?, display_order = ?, active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(venue, name, display_order, active ? 1 : 0, menuId).run();
  
  return c.json({ success: true });
}

async function deleteMenu(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const menuId = c.req.param('id');
  
  // Soft delete by setting active to 0
  await FWHY_D1.prepare("UPDATE menus SET active = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(menuId).run();
  
  return c.json({ success: true });
}

async function listMenuItems(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const menuId = c.req.param('id');
  
  const { results } = await FWHY_D1.prepare(`
    SELECT * FROM menu_items 
    WHERE menu_id = ? AND active = 1 
    ORDER BY display_order ASC, name ASC
  `).bind(menuId).all();
  
  return c.json({ success: true, data: results || [] });
}

async function createMenuItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const menuId = c.req.param('id');
  const { name, description, price, category, display_order = 0 } = await c.req.json();
  
  if (!name) {
    return c.json({ success: false, error: "Name is required" }, 400);
  }
  
  const result = await FWHY_D1.prepare(`
    INSERT INTO menu_items (menu_id, name, description, price, category, display_order, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(menuId, name, description, price, category, display_order).run();
  
  return c.json({ success: true, id: result.meta.last_row_id }, 201);
}

async function updateMenuItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const itemId = c.req.param('itemId');
  const { name, description, price, category, display_order, active } = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE menu_items SET 
      name = ?, description = ?, price = ?, category = ?, display_order = ?, active = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(name, description, price, category, display_order, active ? 1 : 0, itemId).run();
  
  return c.json({ success: true });
}

async function deleteMenuItem(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const itemId = c.req.param('itemId');
  
  // Soft delete by setting active to 0
  await FWHY_D1.prepare("UPDATE menu_items SET active = 0, updated_at = datetime('now') WHERE id = ?")
    .bind(itemId).run();
  
  return c.json({ success: true });
}

export async function handleMenu(
  c: Context<{ Bindings: Env }>, 
  action: MenuAction
) {
  try {
    switch (action) {
      case 'list':
        return listMenus(c);
      case 'create':
        return createMenu(c);
      case 'update':
        return updateMenu(c);
      case 'delete':
        return deleteMenu(c);
      case 'items':
        return listMenuItems(c);
      case 'create-item':
        return createMenuItem(c);
      case 'update-item':
        return updateMenuItem(c);
      case 'delete-item':
        return deleteMenuItem(c);
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400);
    }
  } catch (e: any) {
    console.error(`Menu handler error in action ${action}:`, e);
    return c.json({ success: false, error: 'Failed to process menu request' }, 500);
  }
}
