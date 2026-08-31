import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

dotenv.config();

const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY,
    MAKE_WEBHOOK_URL,
    N8N_WEBHOOK_URL,
    PORT = '3000',
    NODE_ENV = 'development',
} = process.env;

// Required Environment Variable Validations
if (!SUPABASE_URL) {
    throw new Error('[Config Error] Missing SUPABASE_URL in environment variables.');
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[Config Error] Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
}

if (!GROQ_API_KEY) {
    throw new Error('[Config Error] Missing GROQ_API_KEY in environment variables.');
}

if (!MAKE_WEBHOOK_URL) {
    console.warn('[Config Warning] MAKE_WEBHOOK_URL is defined. Webhook triggering will be skipped.');
}

// Initialize Supabase Client with Service Role (Admin privileges, no session persistence)
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

// Initialize Groq SDK Client
export const groq = new Groq({
    apiKey: GROQ_API_KEY,
});

export const CONFIG = {
    PORT: parseInt(PORT, 10),
    NODE_ENV,
    MAKE_WEBHOOK_URL,
} as const;