// src/handlers/events.ts
import { Context } from 'hono';
import { Env, Event } from '../types/env';

type EventAction = 'list' | 'create' | 'update' | 'delete' | 'slideshow' | 'archives' | 'upload-flyer';

async function listEvents(c: Context<{ Bindings: Env }>, options?: { venue?: string }) {
  const { FWHY_D1 } = c.env;
  
  let query = "SELECT * FROM events ORDER BY date DESC";
  let params: any[] = [];
  
  if (options?.venue) {
    query = "SELECT * FROM events WHERE venue = ? ORDER BY date DESC";
    params = [options.venue];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  
  // Format for legacy frontend compatibility
  const events = (results as Event[] ?? []).map(event => ({
    id: event.id,
    title: event.title || '',
    venue: event.venue || '',
    date: event.date || '',
    time: event.event_time || '',
    imageUrl: event.flyer_image_url || '',
    description: event.description || '',
    suggestedPrice: '', // Legacy field
    ticketLink: event.ticket_url || '',
    ageRestriction: event.age_restriction || ''
  }));
  
  return c.json(events);
}

async function getArchives(c: Context<{ Bindings: Env }>, options?: { venue?: string }) {
  const { FWHY_D1 } = c.env;
  
  let query = "SELECT * FROM events WHERE date < datetime('now') ORDER BY date DESC";
  let params: any[] = [];
  
  if (options?.venue) {
    query = "SELECT * FROM events WHERE venue = ? AND date < datetime('now') ORDER BY date DESC";
    params = [options.venue];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  
  const events = (results as Event[] ?? []).map(event => ({
    id: event.id,
    title: event.title || '',
    venue: event.venue || '',
    date: event.date || '',
    time: event.event_time || '',
    imageUrl: event.flyer_image_url || '',
    description: event.description || '',
    suggestedPrice: '',
    ticketLink: event.ticket_url || '',
    ageRestriction: event.age_restriction || ''
  }));
  
  return c.json(events);
}

async function getSlideshow(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { results } = await FWHY_D1.prepare("SELECT * FROM events WHERE date >= datetime('now') ORDER BY date ASC").all();
  
  const events = (results as Event[] ?? []).map(event => ({
    id: event.id,
    title: event.title || '',
    venue: event.venue || '',
    date: event.date || '',
    imageUrl: event.flyer_image_url || '',
    description: event.description || ''
  }));
  
  return c.json(events);
}

async function createEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventData: Partial<Event> = await c.req.json();
  
  if (!eventData.title || !eventData.date || !eventData.venue) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  
  // Auto-populate based on venue (per requirements)
  const ageRestriction = eventData.venue === 'howdy' 
    ? 'All ages' 
    : '21+ unless with parent or legal guardian';
  
  const eventTime = eventData.event_time || 'Doors at 7pm / Music at 8pm';
  
  const newId = `event_${crypto.randomUUID()}`;
  await FWHY_D1.prepare(`
    INSERT INTO events (id, title, date, venue, ticket_url, flyer_image_url, description, age_restriction, event_time, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    newId, 
    eventData.title, 
    eventData.date, 
    eventData.venue, 
    eventData.ticket_url || '', 
    eventData.flyer_image_url || '', 
    eventData.description || '', 
    ageRestriction, 
    eventTime
  ).run();
  
  return c.json({ success: true, id: newId }, 201);
}

async function updateEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');
  const eventData: Partial<Event> = await c.req.json();
  
  await FWHY_D1.prepare(`
    UPDATE events SET 
      title = ?, date = ?, venue = ?, ticket_url = ?, 
      flyer_image_url = ?, description = ?, age_restriction = ?, 
      event_time = ?, updated_at = datetime('now') 
    WHERE id = ?
  `).bind(
    eventData.title, eventData.date, eventData.venue, eventData.ticket_url, 
    eventData.flyer_image_url, eventData.description, eventData.age_restriction, 
    eventData.event_time, eventId
  ).run();
  
  return c.json({ success: true });
}

async function deleteEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');
  
  await FWHY_D1.prepare("DELETE FROM events WHERE id = ?").bind(eventId).run();
  return c.json({ success: true });
}

async function uploadFlyer(c: Context<{ Bindings: Env }>) {
  const { FWHY_IMAGES } = c.env;
  
  try {
    const formData = await c.req.formData();
    const file = formData.get('flyer') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No file uploaded' }, 400);
    }
    
    const fileName = `flyers/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    
    // R2 put method expects key, value, and optional options
    await FWHY_IMAGES.put(fileName, arrayBuffer);
    
    const flyerUrl = `https://fwhy-images.farewellcafe.com/${fileName}`;
    
    return c.json({ 
      success: true, 
      url: flyerUrl,
      fileName: fileName
    });
  } catch (error) {
    return c.json({ success: false, error: 'Upload failed' }, 500);
  }
}

export async function handleEvents(
  c: Context<{ Bindings: Env }>, 
  action: EventAction, 
  options?: { venue?: string }
) {
  try {
    switch (action) {
      case 'list':
        return listEvents(c, options);
      case 'archives':
        return getArchives(c, options);
      case 'slideshow':
        return getSlideshow(c);
      case 'create':
        return createEvent(c);
      case 'update':
        return updateEvent(c);
      case 'delete':
        return deleteEvent(c);
      case 'upload-flyer':
        return uploadFlyer(c);
      default:
        return c.json({ success: false, error: 'Invalid action' }, 400);
    }
  } catch (e: any) {
    console.error(`Event handler error in action ${action}:`, e);
    return c.json({ success: false, error: 'Failed to process event request' }, 500);
  }
}
