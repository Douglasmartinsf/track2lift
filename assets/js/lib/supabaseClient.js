// assets/js/lib/supabaseClient.js
// Centraliza a criação da instância do Supabase e a exporta para os módulos.
// IMPORTANTE: nunca comitar chaves privadas. Aqui usamos a anon key do cliente.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://qxyazvgwlenprvmbjehr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4eWF6dmd3bGVucHJ2bWJqZWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjYwMjcsImV4cCI6MjA3ODY0MjAyN30.gDpxBscKUbLK9IlR3lqH7Wuh3_IdFPG6uPCEQ-dIYZI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
