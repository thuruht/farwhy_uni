// src/handlers/auth.ts
import { Context } from 'hono';
import { Env, User } from '../types/env';

// JWT utility functions
async function createJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

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
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

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

function generateSessionToken(): string {
  return crypto.randomUUID();
}

async function hashPassword(password: string, salt?: string): Promise<string> {
  console.log(`[AUTH] Hashing password with salt: ${salt || 'default-salt'}`);
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (salt || 'default-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log(`[AUTH] Password hash first 8 chars: ${hash.substring(0, 8)}...`);
  return hash;
}

async function verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    console.log(`[AUTH] Verifying password, stored hash first 8 chars: ${hashedPassword.substring(0, 8)}...`);
    
    // Handle bcrypt-style hashes or simple SHA-256 hashes
    if (hashedPassword.startsWith('$2')) {
      console.log('[AUTH] Bcrypt hash detected - skipping (not supported)');
      // This would be bcrypt, but we'll use simple comparison for now
      // In production, you'd want to use a proper bcrypt library
      return false;
    } else {
      // Simple SHA-256 comparison
      const inputHash = await hashPassword(inputPassword);
      const match = inputHash === hashedPassword;
      console.log(`[AUTH] Simple hash match: ${match}, input hash first 8 chars: ${inputHash.substring(0, 8)}...`);
      return match;
    }
  } catch (error) {
    console.error('[AUTH] Password verification error:', error);
    return false;
  }
}

async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  try {
    const result = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
    if (!result) return null;
    
    const row = result as any; // D1 returns unknown, so we cast to any for property access
    
    return {
      id: row.id,
      username: row.username,
      password_hash: row.password_hash,
      role: row.role as 'admin' | 'user',
      isAdmin: row.role === 'admin',
      authMethod: 'jwt'
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export type AuthAction = 'login' | 'logout' | 'check';

export async function handleAuth(c: Context<{ Bindings: Env }>, action: AuthAction): Promise<Response> {
  const { JWT_SECRET } = c.env;
  
  console.log(`[AUTH] Handling ${action} action`);
  
  switch (action) {
    case 'login':
      return handleLogin(c);
    case 'logout':
      return handleLogout(c);
    case 'check':
      return checkAuth(c);
    default:
      return c.json({ success: false, error: 'Invalid action' }, 400);
  }
}

async function checkAuth(c: Context<{ Bindings: Env }>): Promise<Response> {
  const { JWT_SECRET } = c.env;
  const cookie = c.req.header('cookie') || '';
  const sessionToken = cookie.match(/sessionToken=([^;]+)/)?.[1];
  
  if (!sessionToken) {
    return c.json({ success: false, error: 'No session token' }, 401);
  }
  
  try {
    const payload = await verifyJWT(sessionToken, JWT_SECRET);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid session token' }, 401);
    }
    
    return c.json({ 
      success: true, 
      user: { 
        username: payload.username,
        role: payload.role 
      } 
    });
  } catch (error) {
    console.error('[AUTH] Error verifying session:', error);
    return c.json({ success: false, error: 'Session verification failed' }, 401);
  }
}

async function handleLogin(c: Context<{ Bindings: Env }>): Promise<Response> {
  const { FWHY_D1, JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH } = c.env;
  
  try {
    const body = await c.req.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return c.json({ success: false, error: 'Username and password required' }, 400);
    }
    
    console.log(`[AUTH] Attempting login for user: ${username}`);
    
    // Check against environment variable credentials
    if (username === ADMIN_USERNAME) {
      console.log('[AUTH] Validating against environment credentials');
      
      // Hash the input password and compare with stored hash
      const inputHash = await hashPassword(password);
      if (inputHash === ADMIN_PASSWORD_HASH) {
        console.log('[AUTH] Admin credentials valid from environment variables');
        
        // Create JWT token
        const token = await createJWT({
          username: username,
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        }, JWT_SECRET);
        
        return c.json(
          { success: true, message: 'Login successful' },
          200,
          {
            'Set-Cookie': `sessionToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`
          }
        );
      } else {
        console.log('[AUTH] Invalid password for admin user');
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
    }
    
    // Regular DB lookup for users
    const { results } = await FWHY_D1.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).all();
    
    if (!results || results.length === 0) {
      console.log(`[AUTH] No user found with username: ${username}`);
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    const user = results[0] as User;
    console.log(`[AUTH] User found, verifying password`);
    
    const isValid = user.password_hash ? await verifyPassword(password, user.password_hash) : false;
    if (!isValid) {
      console.log(`[AUTH] Invalid password for user: ${username}`);
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    console.log(`[AUTH] Valid credentials for user: ${username}`);
    
    // Create JWT token
    const token = await createJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }, JWT_SECRET);
    
    return c.json(
      { success: true, message: 'Login successful' },
      200,
      {
        'Set-Cookie': `sessionToken=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${24 * 60 * 60}`
      }
    );
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
}

async function handleLogout(c: Context<{ Bindings: Env }>): Promise<Response> {
  // Clear the JWT cookie
  const cookieOptions = [
    'sessionToken=',
    'HttpOnly',
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'SameSite=Strict'
  ].join('; ');
  
  c.header('Set-Cookie', cookieOptions);
  
  return c.json({ success: true, message: 'Logout successful' });
}