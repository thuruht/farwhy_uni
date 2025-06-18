// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { Env } from '../types/env';

async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureBuffer = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, encoder.encode(data));
    
    if (!isValid) return null;
    
    const decodedPayload = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (decodedPayload.exp && Date.now() / 1000 > decodedPayload.exp) {
      return null;
    }
    
    return decodedPayload;
  } catch (error) {
    return null;
  }
}

export async function authenticate(c: Context<{ Bindings: Env }>, next: Next) {
  const { SESSIONS_KV, JWT_SECRET } = c.env;
  const cookie = c.req.header('cookie') || '';
  const match = cookie.match(/sessionToken=([^;]+)/);
  
  if (!match) {
    return c.json({ success: false, error: 'No authentication token provided' }, 401);
  }
  
  const token = match[1];
  
  // First try JWT verification
  const jwtPayload = await verifyJWT(token, JWT_SECRET);
  if (jwtPayload) {
    // Valid JWT token - store user info in a simple way
    (c as any).user = { 
      username: jwtPayload.user, 
      isAdmin: true,
      authMethod: 'jwt'
    };
    await next();
    return;
  }
  
  // Fallback to KV session check (for legacy sessions)
  if (token.includes('-')) { // UUID format suggests legacy session
    const session = await SESSIONS_KV.get(token);
    if (session) {
      (c as any).user = { 
        username: 'admin', 
        isAdmin: true,
        authMethod: 'session'
      };
      await next();
      return;
    }
  }
  
  // No valid authentication found
  return c.json({ 
    success: false, 
    error: 'Session expired or invalid - please login again' 
  }, 401);
}
