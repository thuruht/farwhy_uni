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
  const errors: string[] = [];
  const statements = [];
  const stmt = FWHY_D1.prepare(
    "REPLACE INTO events (id, title, date, venue, flyer_image_url, ticket_url, description, age_restriction, event_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  for (const venue of venues) {
    try {
      const response = await fetch(`https://fygw0.kcmo.xyz/list/${venue}`);
      if (!response.ok) {
        errors.push(`Failed to fetch from ${venue} endpoint: ${response.statusText}`);
        continue;
      }
      const legacyEvents: LegacyEvent[] = await response.json();
      for (const event of legacyEvents) {
        const flyerUrl = event.imageUrl || event.flyer_url || event.flyerUrl || '';
        const ticketUrl = event.ticket_url || event.ticketLink || '';
        const age = event.age_restriction || event.ageRestriction || null;
        statements.push(
          stmt.bind(event.id, event.title, event.date, venue, flyerUrl, ticketUrl, event.description, age, event.time)
        );
        totalImported++;
      }
    } catch (e: any) {
      errors.push(`Error for ${venue}: ${e.message}`);
    }
  }

  if (statements.length > 0) await FWHY_D1.batch(statements);
  if (errors.length > 0) return c.json({ success: false, error: 'Sync completed with errors', details: errors, imported: totalImported }, 500);
  return c.json({ success: true, message: 'Sync completed successfully.', imported: totalImported });
}
