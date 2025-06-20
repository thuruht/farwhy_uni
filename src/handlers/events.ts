// src/handlers/events.ts - Enhanced for legacy compatibility and Aaron's requirements
import { Context } from 'hono';
import { Env, Event, LegacyEvent } from '../types/env';

type EventAction = 'list' | 'create' | 'update' | 'delete' | 'slideshow' | 'archives' | 'upload-flyer';

// NEW: Helper function to delete a flyer from R2 based on its URL
async function deleteFlyerFromR2(env: Env, flyerUrl?: string | null) {
  if (!flyerUrl) return;

  try {
    // Extract the R2 object key from the full URL (e.g., https://.../images/flyers/123.jpg -> flyers/123.jpg)
    const key = new URL(flyerUrl).pathname.substring('/images/'.length);
    if (key) {
      await env.FWHY_IMAGES.delete(key);
      console.log(`[R2] Deleted flyer: ${key}`);
    }
  } catch (r2Error) {
    // Log the error but don't block the main operation (e.g., if the URL is malformed)
    console.error(`[R2] Failed to parse URL and delete flyer from R2 for URL ${flyerUrl}:`, r2Error);
  }
}

// Helper function to normalize event data for display
function normalizeEventForDisplay(event: Event): any {
  return {
    id: event.id,
    title: event.title || 'Untitled Event',
    venue: event.venue || 'unknown',
    date: event.date || '',
    time: event.event_time || 'Time TBD',
    imageUrl: event.flyer_image_url || event.legacy_image_url || '',
    description: event.description || '',
    suggestedPrice: event.price || '', // Legacy field mapping
    ticketLink: event.ticket_url || '',
    ageRestriction: event.age_restriction || 'Check with venue',
    status: event.status || 'active',
    is_featured: event.is_featured || false,
    capacity: event.capacity || null,
    // Include new CMS fields
    event_type: event.event_type || 'music', // Default to music
    performers: event.performers || '[]', // Empty JSON array as default
    tags: event.tags || '[]', // Empty JSON array as default
    external_links: event.external_links || '{}', // Empty JSON object as default
    // Include legacy data if present
    legacy_id: event.legacy_id || null,
    created_at: event.created_at,
    updated_at: event.updated_at
  };
}

// Helper function to apply Aaron's auto-population rules
function applyAutoPopulationRules(eventData: Partial<Event>): Partial<Event> {
  const result = { ...eventData };

  // Auto-populate age restriction based on venue if not provided
  if (!result.age_restriction && result.venue) {
    result.age_restriction = result.venue === 'howdy'
      ? 'All ages'
      : '21+ unless with parent or legal guardian';
  }

  // Auto-populate event time if not provided
  if (!result.event_time) {
    result.event_time = 'Doors at 7pm / Music at 8pm';
  }

  // Set default status
  if (!result.status) {
    result.status = 'active';
  }

  return result;
}

async function listEvents(c: Context<{ Bindings: Env }>, options?: { venue?: string }) {
  const { FWHY_D1 } = c.env;

  try {
    let query = "SELECT * FROM events WHERE status != 'cancelled' ORDER BY date DESC";
    let params: any[] = [];

    if (options?.venue) {
      query = "SELECT * FROM events WHERE venue = ? AND status != 'cancelled' ORDER BY date DESC";
      params = [options.venue];
    }

    console.log(`[DEBUG] Running events query: ${query} with params:`, params);

    const { results } = await FWHY_D1.prepare(query).bind(...params).all();

    const events = (results as Event[] ?? []).map(normalizeEventForDisplay);

    console.log(`[DEBUG] Returning ${events.length} events`);

    return c.json(events, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
  } catch (error) {
    console.error('Error listing events:', error);
    return c.json({ success: false, error: 'Failed to fetch events' }, 500);
  }
}

async function getArchives(c: Context<{ Bindings: Env }>, options?: { venue?: string }) {
  const { FWHY_D1 } = c.env;

  try {
    let query = "SELECT * FROM events WHERE date < datetime('now') ORDER BY date DESC";
    let params: any[] = [];

    if (options?.venue) {
      query = "SELECT * FROM events WHERE venue = ? AND date < datetime('now') ORDER BY date DESC";
      params = [options.venue];
    }

    console.log(`[DEBUG] Running archives query: ${query} with params:`, params);

    const { results } = await FWHY_D1.prepare(query).bind(...params).all();
    const events = (results as Event[] ?? []).map(normalizeEventForDisplay);

    console.log(`[DEBUG] Returning ${events.length} archive events`);

    return c.json(events, 200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
  } catch (error) {
    console.error('Error fetching archives:', error);
    return c.json({ success: false, error: 'Failed to fetch archived events' }, 500);
  }
}

async function getSlideshow(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;

  try {
    const { results } = await FWHY_D1.prepare(`
      SELECT * FROM events
      WHERE date >= datetime('now') AND status = 'active'
      ORDER BY date ASC
    `).all();

    const events = (results as Event[] ?? []).map(event => ({
      id: event.id,
      title: event.title || 'Untitled Event',
      venue: event.venue || 'unknown',
      date: event.date || '',
      time: event.event_time || 'Doors at 7pm / Music at 8pm',
      imageUrl: event.flyer_image_url || event.legacy_image_url || '',
      description: event.description || '',
      is_featured: event.is_featured || false,
      ticketLink: event.ticket_url || '',
      price: event.price || '',
      ageRestriction: event.age_restriction || 'Check with venue',
      event_type: event.event_type || 'music',
      performers: event.performers || '[]',
      tags: event.tags || '[]',
      external_links: event.external_links || '{}'
    }));

    return c.json(events);
  } catch (error) {
    console.error('Error fetching slideshow events:', error);
    return c.json({ success: false, error: 'Failed to fetch slideshow events' }, 500);
  }
}

async function createEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;

  try {
    const eventData: Partial<Event> = await c.req.json();

    if (!eventData.title || !eventData.date || !eventData.venue) {
      return c.json({ success: false, error: "Missing required fields: title, date, venue" }, 400);
    }

    if (!['farewell', 'howdy'].includes(eventData.venue)) {
      return c.json({ success: false, error: "Invalid venue. Must be 'farewell' or 'howdy'" }, 400);
    }

    const normalizedData = applyAutoPopulationRules(eventData);
    const newId = `event_${crypto.randomUUID()}`;

    await FWHY_D1.prepare(`
      INSERT INTO events (
        id, title, date, venue, ticket_url, flyer_image_url, description,
        age_restriction, event_time, price, capacity, status, is_featured,
        event_type, performers, tags, external_links, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      newId,
      normalizedData.title,
      normalizedData.date,
      normalizedData.venue,
      normalizedData.ticket_url || null,
      normalizedData.flyer_image_url || null,
      normalizedData.description || null,
      normalizedData.age_restriction,
      normalizedData.event_time,
      normalizedData.price || null,
      normalizedData.capacity || null,
      normalizedData.status || 'active',
      normalizedData.is_featured || false,
      normalizedData.event_type || 'music',
      normalizedData.performers || '[]',
      normalizedData.tags || '[]',
      normalizedData.external_links || '{}'
    ).run();

    return c.json({ success: true, id: newId }, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ success: false, error: 'Failed to create event' }, 500);
  }
}

// MODIFIED: updateEvent function with flyer cleanup logic
async function updateEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');

  try {
    const eventData: Partial<Event> = await c.req.json();

    // Fetch the current event to check if the flyer URL is changing
    const result = await FWHY_D1.prepare("SELECT flyer_image_url FROM events WHERE id = ?")
      .bind(eventId)
      .first();
    const currentEvent = result as any;

    // If the flyer URL is being updated and is different from the old one, delete the old flyer
    if (currentEvent && currentEvent.flyer_image_url && currentEvent.flyer_image_url !== eventData.flyer_image_url) {
      await deleteFlyerFromR2(c.env, currentEvent.flyer_image_url);
    }

    const normalizedData = applyAutoPopulationRules(eventData);

    await FWHY_D1.prepare(`
      UPDATE events SET
        title = ?, date = ?, venue = ?, ticket_url = ?,
        flyer_image_url = ?, description = ?, age_restriction = ?,
        event_time = ?, price = ?, capacity = ?, status = ?,
        is_featured = ?, event_type = ?, performers = ?,
        tags = ?, external_links = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      normalizedData.title,
      normalizedData.date,
      normalizedData.venue,
      normalizedData.ticket_url || null,
      normalizedData.flyer_image_url || null,
      normalizedData.description || null,
      normalizedData.age_restriction,
      normalizedData.event_time,
      normalizedData.price || null,
      normalizedData.capacity || null,
      normalizedData.status || 'active',
      normalizedData.is_featured || false,
      normalizedData.event_type || 'music',
      normalizedData.performers || '[]',
      normalizedData.tags || '[]',
      normalizedData.external_links || '{}',
      eventId
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ success: false, error: 'Failed to update event' }, 500);
  }
}

// MODIFIED: deleteEvent function with flyer cleanup logic
async function deleteEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');

  try {
    // First, find the event to get its flyer URL
    const result = await FWHY_D1.prepare("SELECT flyer_image_url FROM events WHERE id = ?")
        .bind(eventId)
        .first();
    const event = result as any;

    // If the event exists and has a flyer, delete it from R2
    if (event && event.flyer_image_url) {
      await deleteFlyerFromR2(c.env, event.flyer_image_url);
    }

    // Now, delete the event record from D1
    await FWHY_D1.prepare("DELETE FROM events WHERE id = ?").bind(eventId).run();

    return c.json({ success: true, message: 'Event and associated flyer deleted.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return c.json({ success: false, error: 'Failed to delete event' }, 500);
  }
}

// Function to handle flyer uploads for events
async function uploadFlyer(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    // Check for multipart form data
    const formData = await c.req.formData();
    const file = formData.get('flyer') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No flyer file provided' }, 400);
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'Invalid file type. Supported formats: JPG, PNG, GIF, WebP' 
      }, 400);
    }
    
    // Get file data
    const fileData = await file.arrayBuffer();
    
    // Generate a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `flyers/${timestamp}-${randomString}.${fileExtension}`;
    
    // Upload to R2
    await c.env.FWHY_IMAGES.put(filename, fileData, {
      httpMetadata: {
        contentType: file.type,
      }
    });
    
    // Construct the public URL
    const imageUrl = `/images/${filename}`;
    
    return c.json({ 
      success: true, 
      imageUrl,
      url: imageUrl,  // For backward compatibility
      message: 'Flyer uploaded successfully' 
    });
    
  } catch (error) {
    console.error('[Flyer Upload]', error);
    return c.json({ 
      success: false, 
      error: 'Failed to upload flyer' 
    }, 500);
  }
}

// Helper function to migrate legacy event data
async function migrateLegacyEvent(legacyEvent: LegacyEvent): Promise<Event> {
  const normalizedEvent: Partial<Event> = {
    id: legacyEvent.id,
    title: legacyEvent.title || 'Untitled Event',
    venue: legacyEvent.venue as 'farewell' | 'howdy' || 'farewell',
    date: legacyEvent.date || new Date().toISOString(),
    event_time: legacyEvent.time || 'Time TBD',
    flyer_image_url: legacyEvent.imageUrl || undefined,
    description: legacyEvent.description || undefined,
    price: legacyEvent.suggestedPrice || undefined,
    ticket_url: legacyEvent.ticketLink || undefined,
    age_restriction: legacyEvent.ageRestriction || undefined,
    legacy_id: legacyEvent.id,
    legacy_data: JSON.stringify(legacyEvent)
  };

  return applyAutoPopulationRules(normalizedEvent) as Event;
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

export { createEvent, updateEvent, deleteEvent, uploadFlyer, migrateLegacyEvent, normalizeEventForDisplay };
