// src/handlers/auth.ts
import { Context } from 'hono';
import { Env } from '../types/env';

// Simple JWT implementation for Cloudflare Workers
async function createJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${encodedSignature}`;
}

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

function generateSessionToken() {
  return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === hashedPassword;
}

export async function handleAuth(c: Context<{ Bindings: Env }>, mode: 'login' | 'logout') {
  const { SESSIONS_KV, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, JWT_SECRET } = c.env;
  
  if (mode === 'login') {
    const { username, password } = await c.req.json();
    
    if (!username || !password) {
      return c.json({ success: false, error: 'Username and password required' }, 400);
    }
    
    // Check username
    if (username !== ADMIN_USERNAME) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    // Check password
    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    // Create JWT token
    const payload = {
      user: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const jwtToken = await createJWT(payload, JWT_SECRET);
    
    // Also store in KV as fallback
    const sessionToken = generateSessionToken();
    await SESSIONS_KV.put(sessionToken, jwtToken, { expirationTtl: 60 * 60 * 24 });
    
    // Set secure HTTP-only cookie with JWT
    const cookieOptions = [
      `sessionToken=${jwtToken}`,
      'HttpOnly',
      'Path=/',
      'SameSite=Strict',
      'Secure' // Only over HTTPS
    ].join('; ');
    
    c.header('Set-Cookie', cookieOptions);
    
    return c.json({ 
      success: true, 
      token: jwtToken,
      message: 'Login successful' 
    });
    
  } else if (mode === 'logout') {
    // Clear the JWT cookie
    const cookieOptions = [
      'sessionToken=',
      'HttpOnly',
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'SameSite=Strict'
    ].join('; ');
    
    c.header('Set-Cookie', cookieOptions);
    
    // Also clean up KV if using fallback
    const cookie = c.req.header('cookie') || '';
    const match = cookie.match(/sessionToken=([^;]+)/);
    if (match) {
      // If it's a UUID (legacy session), delete from KV
      if (match[1].includes('-')) {
        await SESSIONS_KV.delete(match[1]);
      }
    }
    
    return c.json({ success: true, message: 'Logout successful' });
  }
  
  return c.json({ success: false, error: 'Invalid mode' }, 400);
}
