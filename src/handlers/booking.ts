import { Context } from 'hono';
import { Env } from '../types/env';

export async function handleBooking(c: Context<{ Bindings: Env }>, action: string) {
  const { FWHY_D1 } = c.env;

  if (action === 'submit') {
    const { artist_name, email, music_link, social_link, genre, notes } = await c.req.json();
    if (!artist_name || !email || !music_link) {
      return c.json({ success: false, error: 'artist_name, email, and music_link are required' }, 400);
    }
    await FWHY_D1.prepare(
      `INSERT INTO booking_submissions (artist_name, email, music_link, social_link, genre, notes) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(artist_name, email, music_link, social_link || null, genre || null, notes || null).run();

    return c.json({ success: true });
  }

  if (action === 'list') {
    const { results } = await FWHY_D1.prepare(
      `SELECT * FROM booking_submissions ORDER BY created_at DESC`
    ).all();
    return c.json({ success: true, data: results || [] });
  }

  if (action === 'unseen-count') {
    const { results } = await FWHY_D1.prepare(
      `SELECT SUM(CASE WHEN seen = 0 THEN 1 ELSE 0 END) as unseen, COUNT(*) as total FROM booking_submissions`
    ).all();
    const row = results[0] as any;
    return c.json({ success: true, count: row.unseen, unseen: row.unseen, total: row.total });
  }

  if (action === 'mark-seen') {
    const id = c.req.param('id');
    await FWHY_D1.prepare(`UPDATE booking_submissions SET seen = 1 WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  }

  if (action === 'mark-all-seen') {
    await FWHY_D1.prepare(`UPDATE booking_submissions SET seen = 1`).run();
    return c.json({ success: true });
  }

  if (action === 'delete') {
    const id = c.req.param('id');
    await FWHY_D1.prepare(`DELETE FROM booking_submissions WHERE id = ?`).bind(id).run();
    return c.json({ success: true });
  }

  return c.json({ success: false, error: 'Invalid action' }, 400);
}
