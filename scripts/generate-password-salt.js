#!/usr/bin/env node
const crypto = require('crypto');
const { execSync: execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function generateSalt(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
async function main() {
  console.log('===== Password Salt Generator =====');
  console.log('This tool will generate a secure random salt for password hashing.');
  console.log('');
  const salt = generateSalt();
  console.log(`Generated salt: ${salt}`);
  console.log('');
  console.log('IMPORTANT: Changing the salt will invalidate all existing password hashes!');
  console.log(
    '           Only use this for a fresh installation or if you plan to reset all passwords.'
  );
  console.log('');
  const askQuestion = (question) =>
    new Promise((resolve) => {
      rl.question(question, (answer) => resolve(answer));
    });
  try {
    const shouldSaveToEnv = await askQuestion('Save to .env file? (y/n): ');
    if (shouldSaveToEnv.toLowerCase() === 'y') {
      const envPath = path.join(__dirname, '../.env');
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/^PASSWORD_SALT=.*/m, '');
        if (!envContent.endsWith('\n')) {
          envContent += '\n';
        }
      }
      envContent += `PASSWORD_SALT=${salt}\n`;
      fs.writeFileSync(envPath, envContent);
      console.log('Salt saved to .env file');
    }
    const shouldAddToWrangler = await askQuestion('Add to Cloudflare Workers as a secret? (y/n): ');
    if (shouldAddToWrangler.toLowerCase() === 'y') {
      try {
        console.log('Running: npx wrangler secret put PASSWORD_SALT');
        const wranglerCmd = `echo "${salt}" | npx wrangler secret put PASSWORD_SALT`;
        execSync(wranglerCmd, { stdio: 'inherit' });
        console.log('Salt added to Cloudflare Workers secrets successfully');
      } catch (error) {
        console.error('Failed to add secret to Cloudflare Workers:', error.message);
        console.log('You can manually add the secret with:');
        console.log(`npx wrangler secret put PASSWORD_SALT`);
      }
    }
    console.log('');
    console.log('===== Next Steps =====');
    console.log('1. If using an existing database with password hashes:');
    console.log('   - IMPORTANT: All existing passwords will continue to work as long as');
    console.log('     both the script and auth handler can access the salt value');
    console.log('2. If setting up a fresh installation:');
    console.log(
      '   - Generate admin password hash: node scripts/hash-password.js "your-secure-password"'
    );
    console.log('   - Use the generated hash in your Cloudflare Workers environment');
  } finally {
    rl.close();
  }
}
main().catch(console.error);
