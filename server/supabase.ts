import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Check if Supabase environment variables are set
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client if environment variables are set
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to check if Supabase client is available
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

// Log Supabase availability
if (isSupabaseAvailable()) {
  console.log('Supabase client initialized successfully');
} else {
  console.log('Supabase client not initialized. Set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file to use Supabase features.');
}
