import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in your environment variables.");
  console.error("Please create a .env file with your Supabase connection string:");
  console.error("DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres");
  process.exit(1);
}

// Create a PostgreSQL pool with SSL enabled for Supabase
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });
