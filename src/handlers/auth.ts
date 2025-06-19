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
      role: row.role as 'admin' | 'thrift' | 'user',
      isAdmin: row.role === 'admin',
      authMethod: 'jwt'
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function handleAuth(c: Context<{ Bindings: Env }>, mode: 'login' | 'logout') {
  const { SESSIONS_KV, FWHY_D1, ADMIN_PASSWORD_HASH, ADMIN_USERNAME, JWT_SECRET } = c.env;
  
  console.log(`[AUTH] Mode: ${mode}, Env username: ${ADMIN_USERNAME}, Has password hash: ${!!ADMIN_PASSWORD_HASH}, Has JWT secret: ${!!JWT_SECRET}`);
  
  if (mode === 'login') {
    try {
      const body = await c.req.json();
      const { username, password } = body;
      console.log(`[AUTH] Login attempt for username: ${username}`);
      
      if (!username || !password) {
        console.log('[AUTH] Missing username or password');
        return c.json({ success: false, error: 'Username and password required' }, 400);
      }
      
      let user: User | null = null;
      let isValid = false;
      
      // First try to check database for user, but gracefully fall back if table doesn't exist
      try {
        user = await getUserByUsername(FWHY_D1, username);
        console.log(`[AUTH] Database lookup: ${user ? 'User found' : 'User not found'}`);
        if (user) {
          isValid = await verifyPassword(password, user.password_hash!);
          console.log(`[AUTH] Password verification from DB: ${isValid ? 'Success' : 'Failed'}`);
        }
      } catch (error) {
        console.log('[AUTH] Database user lookup failed, falling back to environment variables:', error);
        user = null; // Continue to fallback
      }
      
      // Fallback to environment variables if database lookup failed or user not found
      if (!user) {
        if (username === ADMIN_USERNAME) {
          console.log('[AUTH] Username matches env variable, checking password');
          isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
          console.log(`[AUTH] Password verification from env: ${isValid ? 'Success' : 'Failed'}`);
          if (isValid) {
            user = {
              username: ADMIN_USERNAME,
              role: 'admin',
              isAdmin: true,
              authMethod: 'jwt'
            };
          }
        } else {
          console.log('[AUTH] Username does not match env variable');
        }
      }
      
      if (!user || !isValid) {
        console.log('[AUTH] Authentication failed');
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
      
      // Create JWT token with role information
      const payload = {
        user: user.username,
        role: user.role,
        id: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      console.log(`[AUTH] Creating JWT with payload:`, payload);
      const jwtToken = await createJWT(payload, JWT_SECRET);
      
      // Also store in KV as fallback
      const sessionToken = generateSessionToken();
      await SESSIONS_KV.put(sessionToken, JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 });
      console.log(`[AUTH] Session token stored in KV: ${sessionToken.substring(0, 8)}...`);
      
      // Set secure HTTP-only cookie with JWT
      const cookieOptions = [
        `sessionToken=${jwtToken}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict',
        'Secure' // Only over HTTPS
      ].join('; ');
      
      c.header('Set-Cookie', cookieOptions);
      console.log(`[AUTH] Login successful, cookie set`);
      
      return c.json({ 
        success: true, 
        token: jwtToken,
        user: {
          username: user.username,
          role: user.role
        },
        message: 'Login successful' 
      });
    } catch (error) {
      console.error('[AUTH] Unexpected error during login:', error);
      return c.json({ success: false, error: 'Login failed due to server error' }, 500);
    }
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