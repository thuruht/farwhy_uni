// Script to apply the migration to add missing columns to the events table
// This script can be run with wrangler to apply the changes to the D1 database

// Import the necessary wrangler API
import { unstable_dev } from 'wrangler';

// Function to apply the migrations
async function applyMigrations() {
  try {
    console.log('Applying migrations to add missing columns to events table...');
    
    // Read the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrations/add_missing_columns.sql'),
      'utf8'
    );
    
    // Execute the SQL using wrangler and D1
    const worker = await unstable_dev('src/index.ts', {
      experimental: { disableExperimentalWarning: true }
    });
    
    // Execute the migration against the FWHY_D1 database
    const response = await worker.fetch('/api/admin/execute-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.MIGRATION_SECRET
      },
      body: JSON.stringify({ sql: migrationSQL })
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

// Run the function
applyMigrations();
