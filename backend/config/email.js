const { Resend } = require('resend');

/**
 * Email Configuration
 * Using Resend API for email notifications (works on Railway free tier)
 */

let resend = null;
let isConfigured = false;

// Initialize Resend client
const initializeResend = () => {
  const apiKey = process.env.RESEND_API_KEY;

  console.log('📧 Email configuration check:');
  console.log('   RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 7)}***` : 'NOT SET');

  if (!apiKey) {
    console.warn('⚠️  Resend API key not configured. Email notifications will be disabled.');
    console.warn('   Set RESEND_API_KEY in environment variables to enable email notifications.');
    console.warn('   Get your API key at: https://resend.com/api-keys');
    return null;
  }

  try {
    resend = new Resend(apiKey);
    isConfigured = true;
    console.log('✅ Resend email service configured successfully');
    return resend;
  } catch (error) {
    console.error('❌ Failed to initialize Resend:', error.message);
    return null;
  }
};

// Lazy-initialize on first use
const getResend = () => {
  if (!resend && !isConfigured) {
    initializeResend();
  }
  return resend;
};

/**
 * Send email function with error handling
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML content
 * @param {string} [mailOptions.from] - Sender email (optional)
 */
const sendEmail = async (mailOptions) => {
  const resendClient = getResend();
  if (!resendClient) {
    console.log('📧 Email notification skipped (Resend not configured)');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Resend requires 'from' to be a verified domain
    // Default to onboarding@resend.dev for testing, or use your verified domain
    const from = mailOptions.from || process.env.EMAIL_FROM || 'BeeMiner <onboarding@resend.dev>';

    const { data, error } = await resendClient.emails.send({
      from: from,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
    });

    if (error) {
      console.error('❌ Failed to send email via Resend:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully via Resend:', data.id);
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 * For Resend, we just check if API key is set (no connection test needed)
 */
const verifyEmailConfig = async () => {
  const resendClient = getResend();
  if (!resendClient) {
    console.log('⚠️  Resend API key not configured - email notifications disabled');
    return { success: false, message: 'Resend API key not configured' };
  }

  console.log('✅ Resend email service ready');
  console.log('ℹ️  Get your API key at: https://resend.com/api-keys');
  console.log('ℹ️  Free tier: 100 emails/day, 3,000 emails/month');
  return { success: true, message: 'Resend configured successfully' };
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  isConfigured: () => isConfigured
};
