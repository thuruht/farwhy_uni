#!/usr/bin/env node
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
console.log('Generated JWT Secret:', secret);
console.log('');
console.log('Set this as a secret with:');
console.log(`echo "${secret}" | npx wrangler secret put JWT_SECRET`);
console.log('');
console.log('Or set it interactively:');
console.log('npx wrangler secret put JWT_SECRET');
