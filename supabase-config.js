// Supabase Configuration
// 
// UPDATED PROFILES TABLE SCHEMA:
// Run this in Supabase SQL Editor:
//
// create table profiles (
//   id uuid references auth.users on delete cascade primary key,
//   fullname text,
//   username text,
//   avatar text,
//   role text, -- student, educator, professional, hobbyist
//   discovery_source text, -- youtube, instagram, tiktok, linkedin, school, friend, search, other
//   onboarding_completed boolean default false,
//   created_at timestamp with time zone default timezone('utc'::text, now()),
//   updated_at timestamp with time zone default timezone('utc'::text, now())
// );
//
// Enable RLS and create policies as before...
//
const SUPABASE_URL = 'https://asylgnxgjyubixorsfmg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzeWxnbnhnanl1Yml4b3JzZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNDA0MjUsImV4cCI6MjA5MTgxNjQyNX0.gRFw2KL8yUtJ74OUUcUKREKAj1DoXep_gmwr5ZfOYOI';

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }
    console.error('Supabase library not loaded');
    return null;
}

function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}
