import { Router, type Request, type Response } from 'express';
import { sendOtpEmail } from '../services/email.service.js';

const router = Router();

interface OtpRecord {
    otp: string;
    expiresAt: number;
}

// In-memory store (or Redis in clustered production environments)
const otpStore = new Map<string, OtpRecord>();

// Simple email format check
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// 1. Send OTP Endpoint
router.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
            return res.status(400).json({ success: false, error: 'A valid email address is required' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 5-minute expiry
        otpStore.set(cleanEmail, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

        await sendOtpEmail({
            to: cleanEmail,
            otp,
        });

        return res.json({ success: true, message: 'Verification code sent' });
    } catch (error: any) {
        console.error('Error in /send-otp:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to send verification code',
        });
    }
});

// 2. Verify OTP Endpoint
router.post('/verify-otp', async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Email and OTP are required' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOtp = otp.toString().trim();
        const record = otpStore.get(cleanEmail);

        if (!record) {
            return res.status(400).json({
                success: false,
                error: 'No OTP requested or it has already expired.',
            });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(cleanEmail);
            return res.status(400).json({
                success: false,
                error: 'Verification code has expired. Please request a new one.',
            });
        }

        if (record.otp !== cleanOtp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid verification code.',
            });
        }

        // Clear after single successful use
        otpStore.delete(cleanEmail);

        return res.json({
            success: true,
            message: 'Email successfully verified',
            email: cleanEmail,
        });
    } catch (error: any) {
        console.error('Error in /verify-otp:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Verification process failed',
        });
    }
});

export default router;