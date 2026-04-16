// SQL Schema:
// create table profiles (id uuid primary key, fullname text, username text, avatar text, role text, discovery_source text, onboarding_completed boolean, created_at timestamptz, updated_at timestamptz);
// alter table profiles enable row level security;

const SUPABASE_URL = 'https://asylgnxgjyubixorsfmg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzeWxnbnhnanl1Yml4b3JzZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDA0MjUsImV4cCI6MjA5MTgxNjQyNX0.gRFw2KL8yUtJ74OUUcUKREKAj1DoXep_gmwr5ZfOYOI';

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
            return supabaseClient;
        } else {
            console.error('Supabase library not loaded - falling back to demo mode');
            return null;
        }
    } catch (error) {
        console.error('Supabase initialization error:', error);
        return null;
    }
}

function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});
