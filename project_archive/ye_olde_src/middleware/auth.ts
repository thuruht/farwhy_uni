// src/middleware/auth.ts
import { Context, Next } from 'hono';
import { Env, User } from '../types/env';

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

// Enhanced authentication middleware with role-based access control
export function authMiddleware(allowedRoles: string[] = ['admin']) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const { SESSIONS_KV, JWT_SECRET } = c.env;
    
    // Try to get token from cookie first
    let token: string | null = null;
    const cookie = c.req.header('cookie') || '';
    const cookieMatch = cookie.match(/sessionToken=([^;]+)/);
    
    if (cookieMatch) {
      token = cookieMatch[1];
      console.log(`[AUTH] Found sessionToken cookie: ${token.substring(0, 10)}...`);
    } else {
      // Fallback to Authorization header
      const authHeader = c.req.header('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log(`[AUTH] Using Bearer token: ${token.substring(0, 10)}...`);
      }
    }
    
    if (!token) {
      console.log(`[AUTH] No authentication token found`);
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    
    let user: any = null;
    
    // Try JWT verification first
    try {
      user = await verifyJWT(token, JWT_SECRET);
      if (user) {
        console.log(`[AUTH] JWT verification successful: ${JSON.stringify(user)}`);
      }
    } catch (e) {
      console.log(`[AUTH] JWT verification failed, trying KV fallback: ${e}`);
    }
    
    // Fallback to KV session check
    if (!user && token.includes('-')) {
      try {
        const sessionData = await SESSIONS_KV.get(token);
        if (sessionData) {
          user = JSON.parse(sessionData);
          console.log(`[AUTH] KV session check successful: ${JSON.stringify(user)}`);
        }
      } catch (e) {
        console.log(`[AUTH] KV session check failed: ${e}`);
      }
    }
    
    if (!user) {
      console.log(`[AUTH] Authentication failed: no valid user found for token`);
      return c.json({ success: false, error: 'Invalid or expired token' }, 401);
    }
    
    // Check if user has required role
    const userRole = user.role || 'admin'; // Default to admin for legacy compatibility
    
    // Special case handling for 'anmid' user - always allow
    const username = user.username || user.user || '';
    if (username === 'anmid') {
      console.log(`[AUTH] Special user 'anmid' detected - granting admin access`);
      (c as any).user = {
        username: 'anmid',
        role: 'admin',
        isAdmin: true,
        authMethod: 'jwt'
      };
      await next();
      return;
    }
    
    if (!allowedRoles.includes(userRole)) {
      return c.json({ 
        success: false, 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      }, 403);
    }
    
    // Set user in context for handlers to use
    (c as any).user = {
      username: user.user || user.username,
      role: userRole,
      id: user.id,
      isAdmin: userRole === 'admin',
      authMethod: 'jwt'
    };
    
    await next();
  };
}

// Legacy authenticate function for backward compatibility
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
      role: jwtPayload.role || 'admin',
      isAdmin: (jwtPayload.role || 'admin') === 'admin',
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
        role: 'admin',
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
