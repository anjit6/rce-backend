import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'rce_database',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  udt_name: string;
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
}

// Parse column definitions from CREATE TABLE statement
function parseTableColumns(createStatement: string): SchemaColumn[] {
  const columns: SchemaColumn[] = [];

  // Extract content between parentheses
  const match = createStatement.match(/CREATE TABLE \w+ \(([\s\S]+)\);?/i);
  if (!match) return columns;

  const content = match[1];
  const lines = content.split('\n').map(l => l.trim()).filter(l => l);

  for (const line of lines) {
    // Skip constraints, indexes, primary keys, foreign keys, checks
    if (line.match(/^(PRIMARY KEY|FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT|CREATE INDEX)/i)) continue;
    if (line.startsWith('--')) continue;

    // Match column definition: name type [constraints]
    const colMatch = line.match(/^(\w+)\s+([A-Z0-9_()]+(?:\s+WITH\s+TIME\s+ZONE)?)\s*(.*?)(?:,)?$/i);
    if (colMatch) {
      const [, name, type, constraints] = colMatch;

      // Skip if it looks like a constraint
      if (['PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK', 'CONSTRAINT'].includes(name.toUpperCase())) continue;

      const nullable = !constraints.toUpperCase().includes('NOT NULL');
      const defaultMatch = constraints.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT NULL|UNIQUE|PRIMARY|REFERENCES|,|$))/i);
      const default_value = defaultMatch ? defaultMatch[1].trim() : null;

      columns.push({
        name,
        type: type.toUpperCase(),
        nullable,
        default_value
      });
    }
  }

  return columns;
}

// Extract table definitions from schema.sql
function parseSchemaFile(schema: string): Map<string, SchemaColumn[]> {
  const tables = new Map<string, SchemaColumn[]>();

  // Match CREATE TABLE statements
  const tableRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(schema)) !== null) {
    const tableName = match[1].toLowerCase();
    const tableContent = match[0];
    const columns = parseTableColumns(tableContent);
    tables.set(tableName, columns);
  }

  return tables;
}

async function refreshDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('Starting database refresh...\n');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Parse expected schema
    const expectedTables = parseSchemaFile(schema);

    // Get existing tables
    const existingTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);
    const existingTableNames = new Set(existingTablesResult.rows.map(r => r.table_name.toLowerCase()));

    let changesApplied = 0;

    // Process each expected table
    for (const [tableName, expectedColumns] of expectedTables) {
      console.log(`\nProcessing table: ${tableName}`);

      if (!existingTableNames.has(tableName)) {
        // Table doesn't exist - need full reset
        console.log(`  ⚠ Table ${tableName} does not exist. Run db:reset to create it.`);
        continue;
      }

      // Get existing columns
      const columnsResult = await client.query<ColumnInfo>(`
        SELECT column_name, data_type, is_nullable, column_default, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      const existingColumns = new Map(
        columnsResult.rows.map(col => [col.column_name.toLowerCase(), col])
      );

      // Check for new columns
      for (const expectedCol of expectedColumns) {
        const colName = expectedCol.name.toLowerCase();
        const existingCol = existingColumns.get(colName);

        if (!existingCol) {
          // Add new column
          console.log(`  + Adding column: ${expectedCol.name}`);

          let alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${expectedCol.name} ${expectedCol.type}`;

          if (expectedCol.default_value) {
            alterSql += ` DEFAULT ${expectedCol.default_value}`;
          }

          if (!expectedCol.nullable && !expectedCol.default_value) {
            // For NOT NULL columns without default, we need to set a default first
            console.log(`    ⚠ Column is NOT NULL without default - setting temporary default`);
            alterSql += ` DEFAULT ''`;  // Temporary default
          }

          try {
            await client.query(alterSql);
            changesApplied++;
            console.log(`    ✓ Column added successfully`);
          } catch (err) {
            console.error(`    ✗ Failed to add column: ${(err as Error).message}`);
          }
        }
      }

      // Check for columns to remove (exist in DB but not in schema)
      for (const [existingColName] of existingColumns) {
        const stillExists = expectedColumns.some(c => c.name.toLowerCase() === existingColName);
        if (!stillExists) {
          console.log(`  - Column ${existingColName} exists in DB but not in schema (kept for safety)`);
        }
      }
    }

    // Refresh indexes - drop and recreate
    console.log('\n--- Refreshing indexes ---');

    // Get all custom indexes
    const indexesResult = await client.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%';
    `);

    // Drop existing custom indexes
    for (const idx of indexesResult.rows) {
      try {
        await client.query(`DROP INDEX IF EXISTS ${idx.indexname}`);
        console.log(`  Dropped index: ${idx.indexname}`);
      } catch (err) {
        console.log(`  Could not drop index ${idx.indexname}: ${(err as Error).message}`);
      }
    }

    // Recreate indexes from schema
    const indexRegex = /CREATE INDEX[^;]+;/gi;
    const indexStatements = schema.match(indexRegex) || [];

    for (const indexSql of indexStatements) {
      try {
        await client.query(indexSql);
        const indexName = indexSql.match(/CREATE INDEX (\w+)/i)?.[1];
        console.log(`  ✓ Created index: ${indexName}`);
        changesApplied++;
      } catch (err) {
        // Index might already exist or table doesn't exist
        const msg = (err as Error).message;
        if (!msg.includes('already exists')) {
          console.log(`  ✗ Index creation failed: ${msg}`);
        }
      }
    }

    // Refresh triggers
    console.log('\n--- Refreshing triggers ---');

    // Recreate the update function and triggers
    const functionMatch = schema.match(/CREATE OR REPLACE FUNCTION update_updated_at_column[\s\S]+?language 'plpgsql';/i);
    if (functionMatch) {
      await client.query(functionMatch[0]);
      console.log('  ✓ Updated trigger function: update_updated_at_column');
    }

    // Summary
    console.log('\n--- Summary ---');
    console.log(`Changes applied: ${changesApplied}`);

    // Show current table structure
    console.log('\nCurrent tables:');
    const finalTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    finalTablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Database refresh failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

refreshDatabase()
  .then(() => {
    console.log('\n✓ Database refresh completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database refresh failed:', error.message);
    process.exit(1);
  });
