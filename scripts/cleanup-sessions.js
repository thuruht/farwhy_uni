#!/usr/bin/env node
const { exec: exec } = require('child_process');
const readline = require('readline');
console.log('Farewell/Howdy Session Cleanup Utility');
console.log('--------------------------------------');
console.log('This utility will remove expired session tokens from the KV store.');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Are you sure you want to proceed? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  console.log('Fetching session data...');
  exec('npx wrangler kv:key list --binding=FWHY_KV', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      rl.close();
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      rl.close();
      return;
    }
    try {
      const keys = JSON.parse(stdout);
      if (!keys || keys.length === 0) {
        console.log('No session keys found.');
        rl.close();
        return;
      }
      console.log(`Found ${keys.length} keys in KV store.`);
      const sessionKeys = keys.filter((key) => key.name.startsWith('session:'));
      console.log(`Found ${sessionKeys.length} session keys.`);
      if (sessionKeys.length === 0) {
        console.log('No session keys to clean up.');
        rl.close();
        return;
      }
      const now = Date.now();
      const expiredKeys = sessionKeys.filter((key) => key.expiration && key.expiration < now);
      console.log(`Found ${expiredKeys.length} expired session keys.`);
      if (expiredKeys.length === 0) {
        console.log('No expired sessions to clean up.');
        rl.close();
        return;
      }
      rl.question(`Delete ${expiredKeys.length} expired session keys? (yes/no): `, (confirm) => {
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Deletion cancelled.');
          rl.close();
          return;
        }
        console.log('Deleting expired session keys...');
        let deletedCount = 0;
        let errorCount = 0;
        const deleteNextKey = (index) => {
          if (index >= expiredKeys.length) {
            console.log(
              `Session cleanup completed. Deleted ${deletedCount} keys. Errors: ${errorCount}`
            );
            rl.close();
            return;
          }
          const key = expiredKeys[index];
          exec(`npx wrangler kv:key delete --binding=FWHY_KV "${key.name}"`, (err) => {
            if (err) {
              console.error(`Error deleting key ${key.name}: ${err.message}`);
              errorCount++;
            } else {
              console.log(`Deleted key: ${key.name}`);
              deletedCount++;
            }
            deleteNextKey(index + 1);
          });
        };
        deleteNextKey(0);
      });
    } catch (parseError) {
      console.error(`Error parsing KV keys: ${parseError.message}`);
      rl.close();
    }
  });
});
