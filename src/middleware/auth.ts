// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { Env } from '../types/env';

export async function authenticate(c: Context<{ Bindings: Env }>, next: Next) {
  const { SESSIONS_KV } = c.env;
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sessionToken=([^;]+)/);
  if (!match) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  const sessionToken = match[1];
  const session = await SESSIONS_KV.get(sessionToken);
  if (!session) {
    return c.json({ success: false, error: 'Session expired or invalid' }, 401);
  }
  // Optionally, set user info on context
  c.set('user', { isAdmin: true });
  await next();
}
