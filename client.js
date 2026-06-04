import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Replace these with your Supabase Project URL and anon public key.
// Supabase Dashboard → Project Settings → API
const SUPABASE_URL = 'https://lacbkdudcjebllcshmhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhY2JrZHVkY2plYmxsY3NobWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDY4OTUsImV4cCI6MjA5NDY4Mjg5NX0.MHX_DTIDFYm7eAQJjkwy_QLrzELyHo2pB0FtBgFBwYA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});
