import { unstable_dev } from 'wrangler';
async function applyMigrations() {
  try {
    console.log('Applying migrations to add missing columns to events table...');
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrations/add_missing_columns.sql'),
      'utf8'
    );
    const worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true },
    });
    const response = await worker.fetch('/api/admin/execute-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env.MIGRATION_SECRET,
      },
      body: JSON.stringify({ sql: migrationSQL }),
    });
    const result = await response.json();
    console.log('Migration result:', result);
    await worker.stop();
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}
applyMigrations();
