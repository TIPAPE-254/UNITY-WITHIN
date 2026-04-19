import Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY || "";
  const fromEmail = process.env.BREVO_FROM_EMAIL || "no-reply@unitywithin.app";
  const fromName = process.env.BREVO_FROM_NAME || "Unity Within";

  if (apiKey) {
    console.log("Brevo configuration: API key mode");
  } else {
    console.log("Brevo not configured - emails will not be sent");
  }

  return {
    apiKey,
    fromEmail,
    fromName,
  };
};

const setBrevoApiKey = (apiKey) => {
  if (!apiKey) {
    return false;
  }
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    apiKey,
  );
  return true;
};

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

export const sendEmail = async (toEmail, subject, htmlContent) => {
  try {
    const config = getBrevoConfig();
    if (!toEmail) {
      return { success: false, error: "Missing recipient email" };
    }

    if (!setBrevoApiKey(config.apiKey)) {
      return {
        success: false,
        error: "Brevo API key not configured",
        mock: true,
      };
    }

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: config.fromEmail,
      name: config.fromName,
    };
    sendSmtpEmail.to = [{ email: toEmail }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return {
      success: true,
      messageId: data?.messageId || null,
      provider: "brevo-api",
    };
  } catch (error) {
    console.error("Brevo API error:", error?.message || error);
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
