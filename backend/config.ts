import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration in environment variables.');
}

if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
}

// Supabase client initialized with Service Role for administrative DB & Storage operations
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

// Groq client initialized for Whisper transcription
export const groq = new Groq({
    apiKey: GROQ_API_KEY,
});