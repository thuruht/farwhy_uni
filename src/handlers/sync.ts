// src/handlers/sync.ts
import { Context } from 'hono';
import { Env } from '../types/env';

interface LegacyEvent {
  id: string;
  title: string;
  date: string;
  imageUrl?: string;
  flyerUrl?: string;
  flyer_url?: string;
  ticketLink?: string;
  ticket_url?: string;
  description?: string;
  ageRestriction?: string;
  age_restriction?: string;
  time?: string;
}

export async function handleSync(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const venues = ['farewell', 'howdy'];
  let totalImported = 0;
  let totalSkipped = 0;
  const errors: string[] = [];
  const statements = [];
  
  // First, get all existing events to avoid duplicates
  const { results } = await FWHY_D1.prepare("SELECT id, title, date, venue FROM events").all();
  const existingEvents = results as any[] || [];
  console.log(`Found ${existingEvents.length} existing events`);
  
  // Create lookup maps for faster checking
  const existingEventIds = new Set();
  const existingEventSignatures = new Set();
  
  existingEvents.forEach((event: any) => {
    existingEventIds.add(event.id);
    const signature = `${event.title}-${event.date}-${event.venue}`.toLowerCase();
    existingEventSignatures.add(signature);
  });
  
  // Use INSERT instead of REPLACE to avoid overwriting existing data
  const insertStmt = FWHY_D1.prepare(
    "INSERT INTO events (id, title, date, venue, flyer_image_url, ticket_url, description, age_restriction, event_time, legacy_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))"
  );

  for (const venue of venues) {
    try {
      console.log(`Fetching events from legacy system for venue: ${venue}`);
      const response = await fetch(`https://fygw0.kcmo.xyz/list/${venue}`);
      if (!response.ok) {
        errors.push(`Failed to fetch from ${venue} endpoint: ${response.statusText}`);
        continue;
      }
      
      const legacyEvents: LegacyEvent[] = await response.json();
      console.log(`Retrieved ${legacyEvents.length} legacy events for ${venue}`);
      
      for (const event of legacyEvents) {
        // Check if this event already exists (by ID or by title+date+venue combination)
        const eventSignature = `${event.title}-${event.date}-${venue}`.toLowerCase();
        
        if (existingEventIds.has(event.id) || existingEventSignatures.has(eventSignature)) {
          console.log(`Skipping duplicate event: ${event.title} on ${event.date} at ${venue}`);
          totalSkipped++;
          continue;
        }
        
        // Process new event
        const flyerUrl = event.imageUrl || event.flyer_url || event.flyerUrl || '';
        const ticketUrl = event.ticket_url || event.ticketLink || '';
        const age = event.age_restriction || event.ageRestriction || null;
        
        // Generate a new ID to avoid conflicts
        const newId = `legacy_${crypto.randomUUID()}`;
        
        statements.push(
          insertStmt.bind(newId, event.title, event.date, venue, flyerUrl, ticketUrl, event.description, age, event.time, event.id)
        );
        
        // Add to our tracking sets to avoid duplicates in the same import batch
        existingEventIds.add(newId);
        existingEventSignatures.add(eventSignature);
        
        totalImported++;
      }
    } catch (e: any) {
      errors.push(`Error for ${venue}: ${e.message}`);
    }
  }

  // Execute all statements
  if (statements.length > 0) {
    try {
      for (const stmt of statements) {
        await stmt.run();
      }
    } catch (e: any) {
      errors.push(`Database error: ${e.message}`);
    }
  }
  
  const result = { 
    success: errors.length === 0, 
    message: errors.length === 0 ? 'Sync completed successfully.' : 'Sync completed with errors',
    imported: totalImported,
    skipped: totalSkipped,
    errors: errors.length > 0 ? errors : undefined
  };
  
  return c.json(result, errors.length > 0 ? 207 : 200);
}
