import twilio from 'twilio';

// Get Twilio credentials from environment
const TWILIO_SID = process.env.TWILIO_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || '';
const ADMIN_WHATSAPP = process.env.ADMIN_WHATSAPP || 'whatsapp:+254715765561';

let twilioClient = null;

// Initialize Twilio client if credentials are available
if (TWILIO_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio WhatsApp client initialized');
} else {
  console.warn('⚠️ Twilio credentials not configured. WhatsApp features disabled.');
  console.warn('   Set TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env');
}

/**
 * Format volunteer application data for WhatsApp message
 */
export const formatApplicationMessage = (applicationData) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    location,
    category,
    availability,
    roles,
    skills,
    whyVolunteer,
    mentalHealthContext,
    workPreference,
  } = applicationData;

  const roleList = Array.isArray(roles) 
    ? roles.join(', ') 
    : (typeof roles === 'string' ? roles : '');

  return `*New Volunteer Application — UNITY WITHIN*

*Name:* ${firstName} ${lastName}
*Email:* ${email}
*Phone:* ${phone || 'Not provided'}
*Location:* ${location}
*Category:* ${category}
*Availability:* ${availability}
*Roles:* ${roleList || 'Not specified'}
*Work Preference:* ${workPreference}
*Mental Health Context:* ${mentalHealthContext || 'Not specified'}

*Why volunteer:*
${whyVolunteer}

${skills ? `*Skills:*\n${skills}` : '*Skills:* Not provided'}

*Submitted:* ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} (Africa/Nairobi)`;
};

/**
 * Send WhatsApp message to admin on application submission
 */
export const sendApplicationNotification = async (applicationData) => {
  if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
    console.warn('⚠️ Twilio not configured. Skipping WhatsApp notification.');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const message = formatApplicationMessage(applicationData);
    
    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: ADMIN_WHATSAPP,
      body: message,
    });

    console.log(`✅ Application notification sent via WhatsApp (SID: ${result.sid})`);
    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp notification:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send WhatsApp message to admin on invite sent
 */
export const sendInviteNotification = async (volunteerData) => {
  if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
    console.warn('⚠️ Twilio not configured. Skipping WhatsApp notification.');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const { name, email, role, inviteLink } = volunteerData;
    
    const message = `*Volunteer Invitation Sent — UNITY WITHIN*

*Name:* ${name}
*Email:* ${email}
*Role:* ${role}
*Invite Link:* ${inviteLink}

*Status:* Invitation dispatched to volunteer.
*Submitted:* ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}`;

    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: ADMIN_WHATSAPP,
      body: message,
    });

    console.log(`✅ Invite notification sent via WhatsApp (SID: ${result.sid})`);
    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp invite notification:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send WhatsApp to volunteer on milestone achievement
 */
export const sendMilestoneNotification = async (phoneNumber, milestoneName, hours) => {
  if (!twilioClient || !TWILIO_WHATSAPP_FROM) {
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const message = `🎉 *Congratulations!* You've reached ${hours} hours with UNITY WITHIN!\n\nYour dedication to mental health and community support is making a real difference. Keep up the amazing work!`;

    // Ensure phone number is in WhatsApp format
    const whatsappNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber}`;

    const result = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: whatsappNumber,
      body: message,
    });

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error) {
    console.error('❌ Failed to send WhatsApp milestone notification:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  sendApplicationNotification,
  sendInviteNotification,
  sendMilestoneNotification,
  formatApplicationMessage,
};
