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

async function resetDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('Starting database reset...\n');

    // Drop all tables in the correct order (respecting foreign key constraints)
    console.log('Dropping tables...');
    await client.query(`
      DROP TABLE IF EXISTS rule_function_steps CASCADE;
      DROP TABLE IF EXISTS rule_functions CASCADE;
      DROP TABLE IF EXISTS rules CASCADE;
      DROP TABLE IF EXISTS subfunctions CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
    `);
    console.log('✓ All tables dropped');

    // Drop all custom types
    console.log('Dropping custom types...');
    await client.query(`
      DROP TYPE IF EXISTS rule_status CASCADE;
      DROP TYPE IF EXISTS step_type CASCADE;
      DROP TYPE IF EXISTS param_type CASCADE;
      DROP TYPE IF EXISTS data_source_type CASCADE;
    `);
    console.log('✓ All custom types dropped');

    // Drop the trigger function
    console.log('Dropping functions...');
    await client.query(`
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    console.log('✓ All functions dropped');

    console.log('\n--- Recreating database schema ---\n');

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
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

    // Verify types were created
    const typesResult = await client.query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('rule_status', 'step_type', 'param_type', 'data_source_type');
    `);

    console.log('\nCreated types:');
    typesResult.rows.forEach((row) => {
      console.log(`  - ${row.typname}`);
    });

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase()
  .then(() => {
    console.log('\n✓ Database reset completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database reset failed:', error.message);
    process.exit(1);
  });
