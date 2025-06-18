# Security Setup

## JWT + Session Authentication System

This project uses a robust dual authentication system with JWT tokens and KV session fallback for enhanced security.

### Setting up the Admin Password

1. **Generate a password hash:**
   ```bash
   node scripts/hash-password.js "your_secure_password"
   ```

2. **Generate a JWT secret:**
   ```bash
   node scripts/generate-jwt-secret.js
   ```

3. **Set both secrets:**
   ```bash
   # Set the password hash
   echo "your_generated_hash" | npx wrangler secret put ADMIN_PASSWORD_HASH
   
   # Set the JWT secret
   echo "your_jwt_secret" | npx wrangler secret put JWT_SECRET
   ```

4. **Or set them interactively:**
   ```bash
   npx wrangler secret put ADMIN_PASSWORD_HASH
   npx wrangler secret put JWT_SECRET
   ```

### Environment Variables & Secrets

- `ADMIN_USERNAME`: Set in wrangler.jsonc (currently: "admin")
- `ADMIN_PASSWORD_HASH`: Cloudflare Worker secret (SHA-256 hash)
- `JWT_SECRET`: Cloudflare Worker secret (512-bit cryptographic key)

### Authentication Flow

1. **Login Process:**
   - User enters password in admin login
   - Password is hashed using SHA-256
   - Hash is compared with stored `ADMIN_PASSWORD_HASH`
   - If valid, system creates:
     - JWT token (signed with `JWT_SECRET`)
     - KV session as backup
   - Both tokens are set as HTTP-only cookies

2. **Request Authentication:**
   - Middleware checks for `sessionToken` cookie
   - First attempts JWT verification
   - Falls back to KV session lookup if needed
   - Sets user context for authenticated requests

3. **Logout Process:**
   - Clears JWT and session cookies
   - Removes KV session entry
   - Client redirected to login page

### Security Features

- **✅ Password Security**: SHA-256 hashed passwords (no plain text storage)
- **✅ JWT Tokens**: Cryptographically signed with HS256 algorithm
- **✅ Session Management**: 24-hour expiration with KV fallback
- **✅ HTTP-only Cookies**: Prevent XSS attacks
- **✅ SameSite=Strict**: Prevent CSRF attacks
- **✅ Secure Flag**: HTTPS-only cookies in production
- **✅ Dual Authentication**: JWT primary, KV session fallback
- **✅ Token Expiration**: Automatic 24-hour token expiry
- **✅ Strong Secrets**: 512-bit cryptographic keys

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user": "admin",
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

### Security Best Practices Implemented

1. **Secret Management**: All sensitive data stored as Cloudflare secrets
2. **Token Rotation**: 24-hour token expiration forces regular renewal
3. **Multiple Layers**: JWT + KV session provides redundancy
4. **Secure Transport**: HTTPS-only in production
5. **Input Validation**: Proper password and token validation
6. **Error Handling**: Generic error messages prevent information leakage

This system provides enterprise-grade security suitable for production use.
