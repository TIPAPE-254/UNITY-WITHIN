const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY || "";
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@unitywithin.app";
  const fromName = process.env.BREVO_FROM_NAME || "Unity Within";
  return { apiKey, fromEmail, fromName };
};

const wrapTemplate = ({ title, body }) => `
  <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
    <h2 style="margin: 0 0 12px; color: #be123c;">${title}</h2>
    <div style="font-size: 14px;">${body}</div>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 12px; color: #6b7280; margin: 0;">Unity Within</p>
  </div>
`;

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const { apiKey, fromEmail, fromName } = getBrevoConfig();
    if (!toEmail) {
      return { success: false, error: "Missing recipient email" };
    }

    if (!apiKey) {
      return {
        success: false,
        error: "BREVO_API_KEY is not configured",
        mock: true,
      };
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Brevo request failed (${response.status})`,
      };
    }

    return {
      success: true,
      messageId: data?.messageId || data?.message_id || null,
      provider: "brevo",
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message || "Failed to send email",
    };
  }
};

export const sendResetEmail = async (email, resetLink) => {
  const html = wrapTemplate({
    title: "Reset your Unity Within password",
    body: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return sendEmail(email, "Reset your Unity Within password", html);
};

export const sendVolunteerInvite = async (email, inviteLink) => {
  const html = wrapTemplate({
    title: "You are invited to volunteer with Unity Within",
    body: `
      <p>Thank you for your interest in supporting mental wellness in our community.</p>
      <p><a href="${inviteLink}">Start your volunteer onboarding</a></p>
      <p>This link may expire for security reasons.</p>
    `,
  });

  return sendEmail(email, "Unity Within volunteer invite", html);
};

export const sendTherapistInvite = async (email, inviteLink) => {
  const html = wrapTemplate({
    title: "Therapist invite to Unity Within",
    body: `
      <p>You have been selected for therapist onboarding on Unity Within.</p>
      <p><a href="${inviteLink}">Complete therapist onboarding</a></p>
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
      <p>Use the link below to complete onboarding and access your therapist workspace.</p>
      <p><a href="${inviteLink}">Open therapist onboarding</a></p>
      <p>If you need help, reply to this email and our team will assist you.</p>
    `,
  });

  return sendEmail(
    therapistEmail,
    "Complete your therapist onboarding",
    html,
  );
};
