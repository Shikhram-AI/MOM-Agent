import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { AssemblyAI } from 'assemblyai';
import { Resend } from 'resend';

dotenv.config();

const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    ASSEMBLYAI_API_KEY,
    RESEND_API_KEY,
    RESEND_FROM_EMAIL = 'MIRA <onboarding@resend.dev>',
    MAKE_WEBHOOK_URL,
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

if (!ASSEMBLYAI_API_KEY) {
    throw new Error('[Config Error] Missing ASSEMBLYAI_API_KEY in environment variables.');
}

if (!MAKE_WEBHOOK_URL) {
    console.warn('[Config Warning] MAKE_WEBHOOK_URL is not defined. Webhook triggering will be skipped.');
}

// 1. Initialize Supabase Client with Service Role (Admin privileges, no session persistence)
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

// 2. Initialize AssemblyAI SDK Client
export const assemblyAi = new AssemblyAI({
    apiKey: ASSEMBLYAI_API_KEY,
});

// 3. Initialize Resend Client (for OTP mailing)
export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Export application configuration
export const CONFIG = {
    PORT: parseInt(PORT, 10),
    NODE_ENV,
    MAKE_WEBHOOK_URL,
    RESEND_FROM_EMAIL,
} as const;