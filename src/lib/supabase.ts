import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zqgfmeutlojvrocghiny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZ2ZtZXV0bG9qdnJvY2doaW55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MDAzNzAsImV4cCI6MjA1NzE3NjM3MH0.aNMvRgAoX8EeteOPICssZY-P2AuTrr6ja1kZPIgIq7w';

export const supabase = createClient(supabaseUrl, supabaseKey); 