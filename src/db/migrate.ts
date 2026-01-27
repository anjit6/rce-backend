import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rce_database',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigration(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...');

    // Run pre-schema migrations to add missing columns before schema runs
    // This is needed because CREATE TABLE IF NOT EXISTS won't add new columns
    console.log('\nRunning pre-schema migrations...');

    // Add rule_id column to rule_approvals if table exists but column doesn't
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_name = 'rule_approvals'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'rule_approvals' AND column_name = 'rule_id'
        ) THEN
          ALTER TABLE rule_approvals ADD COLUMN rule_id INTEGER REFERENCES rules(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✓ Pre-schema migrations completed!');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await client.query(schema);

    console.log('✓ Database schema applied successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  });
