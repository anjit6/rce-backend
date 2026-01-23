const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rce',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function migrateStatus() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting status enum migration...');

    // Start transaction
    await client.query('BEGIN');

    // Step 1: Create new enum type
    console.log('📝 Creating new enum type rule_status_new...');
    await client.query(`
      CREATE TYPE rule_status_new AS ENUM ('WIP', 'TEST', 'PENDING', 'PROD')
    `);

    // Step 2: Add a temporary column with the new type
    console.log('📝 Adding temporary column...');
    await client.query(`
      ALTER TABLE rules ADD COLUMN status_new rule_status_new
    `);

    // Step 3: Migrate data with mapping
    console.log('📝 Migrating existing data...');
    await client.query(`
      UPDATE rules
      SET status_new = CASE status::text
        WHEN 'WIP' THEN 'WIP'::rule_status_new
        WHEN 'ACTIVE' THEN 'PROD'::rule_status_new
        WHEN 'ARCHIVED' THEN 'TEST'::rule_status_new
      END
    `);

    // Step 4: Drop old column and rename new column
    console.log('📝 Replacing old column...');
    await client.query('ALTER TABLE rules DROP COLUMN status');
    await client.query('ALTER TABLE rules RENAME COLUMN status_new TO status');

    // Step 5: Set default value
    console.log('📝 Setting default value...');
    await client.query(`ALTER TABLE rules ALTER COLUMN status SET DEFAULT 'WIP'::rule_status_new`);

    // Step 6: Drop old enum and rename new one
    console.log('📝 Cleaning up old enum type...');
    await client.query('DROP TYPE rule_status');
    await client.query('ALTER TYPE rule_status_new RENAME TO rule_status');

    // Commit transaction
    await client.query('COMMIT');

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Status mapping applied:');
    console.log('   WIP     -> WIP');
    console.log('   ACTIVE  -> PROD');
    console.log('   ARCHIVED -> TEST');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrateStatus()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
