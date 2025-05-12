import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not found in environment variables. Please set it in your .env file.");
  console.warn("For Supabase, the format is: postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklm.supabase.co:5432/postgres");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  // Enable SSL for Supabase connections
  ssl: true,
});
