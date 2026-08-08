import { createClient } from '@supabase/supabase-js';

console.log('supabaseClient.js cargado');

// Valores fijos para evitar problemas con variables de entorno
const supabaseUrl = 'https://wuikfqtbzaenvearysfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWtmcXRiemFlbnZlYXJ5c2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjkwMDksImV4cCI6MjEwMTY0NTAwOX0.reDHNy0iPccsmUxT_qr4FZaiE7RbZ8iSqS9ASkx8Q5o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);