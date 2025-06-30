// src/handlers/hours.ts
import { Context } from 'hono';
import { Env } from '../types/env';

type HoursAction = 'list' | 'update';

export async function handleHours(c: Context<{ Bindings: Env }>, action: HoursAction) {
  const { FWHY_D1 } = c.env;
  
  switch (action) {
    case 'list':
      return listHours(c);
    case 'update':
      return updateHours(c);
    default:
      return c.json({ success: false, error: "Invalid action" }, 400);
  }
}

async function listHours(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const venue = c.req.query('venue');
  
  let query = "SELECT * FROM business_hours ORDER BY venue, day_of_week";
  let params: any[] = [];
  
  if (venue) {
    query = "SELECT * FROM business_hours WHERE venue = ? ORDER BY day_of_week";
    params = [venue];
  }
  
  const { results } = await FWHY_D1.prepare(query).bind(...params).all();
  
  // Format the results in a more usable structure
  const formattedResults: Record<string, any[]> = {};
  
  if (results && Array.isArray(results)) {
    results.forEach((hour: any) => {
      if (!formattedResults[hour.venue]) {
        formattedResults[hour.venue] = [];
      }
      formattedResults[hour.venue].push(hour);
    });
  }
  
  return c.json({ success: true, data: formattedResults });
}

async function updateHours(c: Context<{ Bindings: Env }>) {
  const { FWHY_D1 } = c.env;
  const { venue, hours } = await c.req.json();
  
  if (!venue || !hours || !Array.isArray(hours)) {
    return c.json({ success: false, error: "Invalid input format" }, 400);
  }
  
  try {
    // Process each hour update in sequence
    for (const hour of hours) {
      const { day_of_week, open_time, close_time, is_closed, notes } = hour;
      
      if (day_of_week === undefined || day_of_week < 0 || day_of_week > 6) {
        return c.json({ success: false, error: `Invalid day_of_week: ${day_of_week}` }, 400);
      }
      
      // Check if a record already exists for this venue and day
      const { results } = await FWHY_D1.prepare(
        "SELECT id FROM business_hours WHERE venue = ? AND day_of_week = ?"
      ).bind(venue, day_of_week).all();
      
      if (results && results.length > 0) {
        // Update existing record
        await FWHY_D1.prepare(`
          UPDATE business_hours SET 
            open_time = ?, 
            close_time = ?, 
            is_closed = ?, 
            notes = ?,
            updated_at = datetime('now')
          WHERE venue = ? AND day_of_week = ?
        `).bind(
          open_time, 
          close_time, 
          is_closed ? 1 : 0, 
          notes || '',
          venue,
          day_of_week
        ).run();
      } else {
        // Insert new record
        await FWHY_D1.prepare(`
          INSERT INTO business_hours (
            venue, day_of_week, open_time, close_time, is_closed, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          venue,
          day_of_week,
          open_time,
          close_time,
          is_closed ? 1 : 0,
          notes || ''
        ).run();
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating hours:', error);
    return c.json({ success: false, error: "Failed to update hours" }, 500);
  }
}
