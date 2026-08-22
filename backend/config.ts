import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL) {
    throw new Error('Missing SUPABASE_URL in environment variables.');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.'
    );
}

if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY in environment variables.');
}

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    }
);

export const groq = new Groq({
    apiKey: GROQ_API_KEY,
});