// src/handlers/events.ts
import { Context } from 'hono';
import { Env, Event } from '../types/env';

async function listEvents(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { results } = await FWHY_D1.prepare("SELECT * FROM events ORDER BY date DESC").all<Event>();
  return c.json({ success: true, data: results ?? [] });
}

async function createEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventData: Partial<Event> = await c.req.json();
  if (!eventData.title || !eventData.date || !eventData.venue) {
    return c.json({ success: false, error: "Missing required fields" }, 400);
  }
  const newId = `event_${crypto.randomUUID()}`;
  await FWHY_D1.prepare("INSERT INTO events (id, title, date, venue, ticket_url, flyer_image_url, description, age_restriction, event_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(newId, eventData.title, eventData.date, eventData.venue, eventData.ticket_url, eventData.flyer_image_url, eventData.description, eventData.age_restriction, eventData.event_time)
    .run();
  return c.json({ success: true, id: newId }, 201);
}

async function updateEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');
  const eventData: Partial<Event> = await c.req.json();
  await FWHY_D1.prepare("UPDATE events SET title = ?, date = ?, venue = ?, ticket_url = ?, flyer_image_url = ?, description = ?, age_restriction = ?, event_time = ? WHERE id = ?")
    .bind(eventData.title, eventData.date, eventData.venue, eventData.ticket_url, eventData.flyer_image_url, eventData.description, eventData.age_restriction, eventData.event_time, eventId)
    .run();
  return c.json({ success: true });
}

async function deleteEvent(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const eventId = c.req.param('id');
  await FWHY_D1.prepare("DELETE FROM events WHERE id = ?").bind(eventId).run();
  return c.json({ success: true });
}

export async function handleEvents(c: Context<{ Bindings: Env }>, mode: 'list' | 'create' | 'update' | 'delete') {
  try {
    switch (mode) {
      case 'list': return listEvents(c);
      case 'create': return createEvent(c);
      case 'update': return updateEvent(c);
      case 'delete': return deleteEvent(c);
    }
  } catch (e: any) {
    console.error(`Event handler error in mode ${mode}:`, e);
    return c.json({ success: false, error: 'Failed to process event request' }, 500);
  }
}
