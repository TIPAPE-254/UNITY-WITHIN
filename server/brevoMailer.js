import nodemailer from 'nodemailer';

const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
const smtpUser = process.env.BREVO_SMTP_USER;
const smtpPass = process.env.BREVO_SMTP_PASS;
const fromEmail = process.env.BREVO_FROM_EMAIL || 'no-reply@unitywithin.app';
const fromName = process.env.BREVO_FROM_NAME || 'UnityWithin';

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: smtpUser && smtpPass
        ? {
            user: smtpUser,
            pass: smtpPass
        }
        : undefined,
});

export async function sendResetEmail(to, resetLink) {
    if (!smtpUser || !smtpPass) {
        throw new Error('Brevo SMTP credentials are missing. Set BREVO_SMTP_USER and BREVO_SMTP_PASS.');
    }

    await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: 'Reset your UnityWithin password',
        html: `
      <p>Hello,</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `
    });
}
