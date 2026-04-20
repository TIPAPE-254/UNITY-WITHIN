// Fetch Brevo configuration from environment variables
// Supports both standard names and Azure-prefixed (APPSETTING_) names
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.APPSETTING_BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.APPSETTING_BREVO_FROM_EMAIL || "info.unitywithin@gmail.com";
const FROM_NAME = process.env.BREVO_FROM_NAME || process.env.APPSETTING_BREVO_FROM_NAME || "Unity Within";

export async function sendEmail(to, subject, htmlContent) {
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          email: FROM_EMAIL,
          name: FROM_NAME
        },
        to: [{ email: to }],
        subject,
        htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Brevo API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Email sent:", data.messageId);

    return data;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    throw error;
  }
}

const ctaButton = (href, label) => `
  <a
    href="${href}"
    style="
      display: inline-block;
      background: #ec4899;
      color: #ffffff;
      text-decoration: none;
      padding: 12px 18px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
    "
  >${label}</a>
`;

const wrapTemplate = ({ title, body }) => `
  <div style="background: #ffffff; margin: 0; padding: 24px 12px; font-family: 'Segoe UI', Arial, sans-serif; color: #111111;">
    <div style="max-width: 640px; margin: 0 auto; border: 1px solid #fbcfe8; border-radius: 16px; overflow: hidden; background: #ffffff;">
      <div style="background: #111111; padding: 20px 24px;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 1.2px; text-transform: uppercase; color: #fbcfe8; font-weight: 700;">Unity Within</p>
        <h2 style="margin: 8px 0 0; color: #ffffff; font-size: 22px; line-height: 1.3;">${title}</h2>
      </div>
      <div style="padding: 24px; font-size: 14px; line-height: 1.7; color: #111111;">
        ${body}
      </div>
      <div style="border-top: 1px solid #fce7f3; background: #fff1f2; padding: 16px 24px;">
        <p style="margin: 0; font-size: 12px; color: #4b5563;">Unity Within • Empathy. Community. Healing.</p>
      </div>
    </div>
  </div>
`;

export const sendResetEmail = async (email, resetLink) => {
  const html = wrapTemplate({
    title: "Reset your Unity Within password",
    body: `
      <p style="margin: 0 0 12px;">We received a request to reset your password.</p>
      <p style="margin: 0 0 12px;">${ctaButton(resetLink, "Reset Password")}</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return sendEmail(email, "Reset your Unity Within password", html);
};

export const sendVolunteerInvite = async (email, inviteLink) => {
  const html = wrapTemplate({
    title: "You are invited to volunteer with Unity Within",
    body: `
      <p style="margin: 0 0 12px;">Thank you for your interest in supporting mental wellness in our community.</p>
      <p style="margin: 0 0 12px;">${ctaButton(inviteLink, "Start Volunteer Onboarding")}</p>
      <p>This link may expire for security reasons.</p>
    `,
  });

  return sendEmail(email, "Unity Within volunteer invite", html);
};

export const sendTherapistInvite = async (email, inviteLink) => {
  const html = wrapTemplate({
    title: "Therapist invite to Unity Within",
    body: `
      <p style="margin: 0 0 12px;">You have been selected for therapist onboarding on Unity Within.</p>
      <p style="margin: 0 0 12px;">${ctaButton(inviteLink, "Complete Therapist Onboarding")}</p>
      <p>This secure invite link expires in 3 days.</p>
    `,
  });

  return sendEmail(email, "Therapist invite - Unity Within", html);
};

export const automateTherapistInvite = async ({
  therapistEmail,
  inviteLink,
  therapistName,
}) => {
  const safeName = therapistName ? ` ${therapistName}` : "";

  const html = wrapTemplate({
    title: `Welcome${safeName}, your Unity Within therapist portal is ready`,
    body: `
      <p style="margin: 0 0 12px;">Use the link below to complete onboarding and access your therapist workspace.</p>
      <p style="margin: 0 0 12px;">${ctaButton(inviteLink, "Open Therapist Onboarding")}</p>
      <p>If you need help, reply to this email and our team will assist you.</p>
    `,
  });

  return sendEmail(
    therapistEmail,
    "Complete your therapist onboarding",
    html,
  );
};
