import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vhjtiiyzajoxmadokkcp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoanRpaXl6YWpveG1hZG9ra2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDk3OTMsImV4cCI6MjEwMjk4NTc5M30.u0obwU6aiame0TTTQidyRybaKNWa1idXmZR2LztfKH8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
