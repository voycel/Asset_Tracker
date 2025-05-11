import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function runMigration() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool);

    // Log migration start
    console.log('Starting database schema migration...');

    // Create sessions table - this is needed for authentication
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "sessions" (
          "sid" VARCHAR(255) PRIMARY KEY,
          "sess" JSONB NOT NULL,
          "expire" TIMESTAMP(6) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
      `);
      console.log('Sessions table created or verified');
    } catch (err) {
      console.error('Error creating sessions table:', err);
    }

    // Create default workspace if it doesn't exist
    try {
      const workspaces = await db.select().from(schema.workspaces);
      if (workspaces.length === 0) {
        await db.insert(schema.workspaces).values({
          name: 'Default Workspace'
        });
        console.log('Default workspace created');
      }
    } catch (err) {
      console.error('Error checking/creating default workspace:', err);
    }

    // Create default statuses if they don't exist
    try {
      const defaultStatuses = [
        { name: 'Available', color: '#22c55e' }, // Green
        { name: 'In Use', color: '#3b82f6' },    // Blue
        { name: 'Under Maintenance', color: '#f59e0b' }, // Amber
        { name: 'Retired', color: '#6b7280' }    // Gray
      ];

      const statuses = await db.select().from(schema.statuses);
      if (statuses.length === 0) {
        // Get the default workspace id
        const [workspace] = await db.select().from(schema.workspaces).limit(1);
        if (workspace) {
          for (const status of defaultStatuses) {
            await db.insert(schema.statuses).values({
              workspaceId: workspace.id,
              assetTypeId: null, // Global status
              name: status.name,
              color: status.color
            });
          }
          console.log('Default statuses created');
        }
      }
    } catch (err) {
      console.error('Error checking/creating default statuses:', err);
    }

    // Create default locations if they don't exist
    try {
      const defaultLocations = [
        { name: 'Office', description: 'Main office location' },
        { name: 'Storage', description: 'Storage room or warehouse' },
        { name: 'Remote', description: 'Off-site location' }
      ];

      const locations = await db.select().from(schema.locations);
      if (locations.length === 0) {
        // Get the default workspace id
        const [workspace] = await db.select().from(schema.workspaces).limit(1);
        if (workspace) {
          for (const location of defaultLocations) {
            await db.insert(schema.locations).values({
              workspaceId: workspace.id,
              assetTypeId: null, // Global location
              name: location.name,
              description: location.description
            });
          }
          console.log('Default locations created');
        }
      }
    } catch (err) {
      console.error('Error checking/creating default locations:', err);
    }

    console.log('Database migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run the migration
runMigration();