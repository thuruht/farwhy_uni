// src/handlers/auth.ts
import { Context } from 'hono';
import { Env } from '../types/env';

function generateSessionToken() {
  return crypto.randomUUID();
}

export async function handleAuth(c: Context<{ Bindings: Env }>, mode: 'login' | 'logout') {
  const { SESSIONS_KV, ADMIN_PASSWORD } = c.env;
  if (mode === 'login') {
    const { password } = await c.req.json();
    if (!password || password !== ADMIN_PASSWORD) {
      return c.json({ success: false, error: 'Invalid password' }, 401);
    }
    const sessionToken = generateSessionToken();
    await SESSIONS_KV.put(sessionToken, '1', { expirationTtl: 60 * 60 * 24 }); // 24h session
    c.header('Set-Cookie', `sessionToken=${sessionToken}; HttpOnly; Path=/; SameSite=Strict`);
    return c.json({ success: true, sessionToken });
  } else if (mode === 'logout') {
    const cookie = c.req.header('cookie') || '';
    const match = cookie.match(/sessionToken=([^;]+)/);
    if (match) {
      await SESSIONS_KV.delete(match[1]);
    }
    c.header('Set-Cookie', 'sessionToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict');
    return c.json({ success: true });
  }
  return c.json({ success: false, error: 'Invalid mode' }, 400);
}
