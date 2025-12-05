const brevo = require('@getbrevo/brevo');

/**
 * Email Configuration
 * Using Brevo (formerly Sendinblue) API for email notifications
 * Works on Railway free tier - no domain verification needed
 */

let apiInstance = null;
let isConfigured = false;

// Initialize Brevo client
const initializeBrevo = () => {
  const apiKey = process.env.BREVO_API_KEY;

  console.log('📧 Email configuration check:');
  console.log('   BREVO_API_KEY:', apiKey ? `${apiKey.substring(0, 7)}***` : 'NOT SET');

  if (!apiKey) {
    console.warn('⚠️  Brevo API key not configured. Email notifications will be disabled.');
    console.warn('   Set BREVO_API_KEY in environment variables to enable email notifications.');
    console.warn('   Get your API key at: https://app.brevo.com/settings/keys/api');
    return null;
  }

  try {
    apiInstance = new brevo.TransactionalEmailsApi();
    const apiKeyAuth = apiInstance.authentications['apiKey'];
    apiKeyAuth.apiKey = apiKey;
    isConfigured = true;
    console.log('✅ Brevo email service configured successfully');
    return apiInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Brevo:', error.message);
    return null;
  }
};

// Lazy-initialize on first use
const getBrevo = () => {
  if (!apiInstance && !isConfigured) {
    initializeBrevo();
  }
  return apiInstance;
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
  const brevoClient = getBrevo();
  if (!brevoClient) {
    console.log('📧 Email notification skipped (Brevo not configured)');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const senderEmail = process.env.EMAIL_FROM || 'noreply@beeminor.com';
    const senderName = 'BeeMiner';

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: senderEmail, name: senderName };
    sendSmtpEmail.to = [{ email: mailOptions.to }];
    sendSmtpEmail.subject = mailOptions.subject;
    sendSmtpEmail.htmlContent = mailOptions.html;

    const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo:', data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ Failed to send email via Brevo:', error);
    return { success: false, error: error.message || error.toString() };
  }
};

/**
 * Verify email configuration
 * For Brevo, we just check if API key is set
 */
const verifyEmailConfig = async () => {
  const brevoClient = getBrevo();
  if (!brevoClient) {
    console.log('⚠️  Brevo API key not configured - email notifications disabled');
    return { success: false, message: 'Brevo API key not configured' };
  }

  console.log('✅ Brevo email service ready');
  console.log('ℹ️  Get your API key at: https://app.brevo.com/settings/keys/api');
  console.log('ℹ️  Free tier: 300 emails/day, no domain verification needed');
  return { success: true, message: 'Brevo configured successfully' };
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  isConfigured: () => isConfigured
};
