import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://pjxvbsoqwcppuyctwxeh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqeHZic29xd2NwcHV5Y3R3eGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjAxNDMsImV4cCI6MjA2NjA5NjE0M30.d8ODXPZVO7EKjRROvrMTvLxLNitsyMQ7dG1NvmqH5Tc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);