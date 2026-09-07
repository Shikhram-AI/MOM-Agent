import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendOtpEmailParams {
  to: string;
  otp: string;
}

export const sendOtpEmail = async ({ to, otp }: SendOtpEmailParams): Promise<void> => {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'MIRA <onboarding@resend.dev>';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: 'Your MIRA Verification Code',
    text: `Your 6-digit verification code is: ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #0F172A; max-width: 480px; margin: 0 auto; border: 1px solid #E2E8F0; borderRadius: 12px;">
        <h2 style="margin-top: 0; color: #4338CA;">Verify your email for MIRA</h2>
        <p style="font-size: 15px; color: #475569;">
          Use the 6-digit code below to link your email address to MIRA and receive your meeting notes.
        </p>
        <div style="background-color: #F1F5F9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1E293B;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #94A3B8;">
          This code is valid for 5 minutes. If you did not request this code, please ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend Error: ${error.message}`);
  }
};