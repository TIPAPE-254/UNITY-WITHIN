import nodemailer from 'nodemailer';

const getEnv = (key) => process.env[key] || process.env[`APPSETTING_${key}`];

const smtpHost = getEnv('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com';
const smtpPort = parseInt(getEnv('BREVO_SMTP_PORT') || '587', 10);
const smtpUser = getEnv('BREVO_SMTP_USER');
// Brevo API key can often be used as the SMTP password
const smtpPass = getEnv('BREVO_SMTP_PASS') || getEnv('BREVO_API_KEY');
const fromEmail = getEnv('BREVO_FROM_EMAIL') || 'hello@unitywithin.app';
const fromName = getEnv('BREVO_FROM_NAME') || 'UnityWithin';

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false, // true for 465, false for 587
    auth: smtpUser && smtpPass
        ? {
            user: smtpUser,
            pass: smtpPass
        }
        : undefined,
});

/**
 * Generic email sender for both automated and manual (unautomated) emails.
 */
export async function sendEmail(to, subject, html) {
    if (!smtpUser || !smtpPass) {
        console.warn('⚠️ Brevo SMTP credentials (USER/PASS or API_KEY) are missing. Email not sent.');
        console.log(`📧 Mock Email to: ${to} | Subject: ${subject}`);
        return { success: false, error: 'SMTP credentials missing', mock: true };
    }

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send email via Brevo:', error);
        return { success: false, error: error.message };
    }
}

export async function sendResetEmail(to, resetLink) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6d28d9;">Reset your password</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 11px; color: #999;">This link expires in 1 hour. If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `;
    return sendEmail(to, 'Reset your UnityWithin password', html);
}

export async function sendVolunteerInvite(to, inviteLink) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">Welcome to Unity Within</h2>
            <p>Hello,</p>
            <p>You have been invited to join our volunteer team as we build a safer, more empathetic community.</p>
            <p>Click the button below to begin your onboarding flow and select your role:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Onboarding</a>
            </div>
            <p style="font-size: 12px; color: #666;">This invitation link will expire in 7 days.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">Unity Within - Empathy. Community. Healing.</p>
        </div>
    `;
    return sendEmail(to, 'Invite: Join the Unity Within Volunteer Team', html);
}

export async function sendTherapistInvite(to, inviteLink) {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
            <h2 style="color: #6d28d9;">You're Invited to Join Unity Within as a Therapist</h2>
            <p>Hello,</p>
            <p>We are honored to invite you to join our community as a licensed therapist. Your expertise and compassion can make a real difference in the lives of those we serve.</p>
            <p>Click the button below to complete your onboarding and set up your therapist profile:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #6d28d9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Complete Therapist Onboarding</a>
            </div>
            <p style="font-size: 12px; color: #666;">This invitation link will expire in 3 days.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999;">Unity Within - Empathy. Community. Healing.</p>
        </div>
    `;
    return sendEmail(to, 'You have been invited to Unity Within', html);
}
