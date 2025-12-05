const nodemailer = require('nodemailer');

/**
 * Email Configuration
 * Using Gmail SMTP for email notifications
 * NOTE: Railway free tier blocks SMTP ports (587, 465)
 * Emails will not work on Railway without upgrading or using HTTP-based email service
 */

let transporter = null;
let isConfigured = false;

// Create transporter
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  console.log('📧 Email configuration check:');
  console.log('   EMAIL_USER:', emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1] || ''}` : 'NOT SET');
  console.log('   EMAIL_PASSWORD:', emailPassword ? '****** (set)' : 'NOT SET');

  if (!emailUser || !emailPassword) {
    console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
    console.warn('   Set EMAIL_USER and EMAIL_PASSWORD in environment variables to enable email notifications.');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    isConfigured = true;
    console.log('✅ Email transporter configured');
    console.log('⚠️  WARNING: Railway free tier blocks SMTP ports - emails will fail');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
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
  if (!transporter && !isConfigured) {
    createTransporter();
  }

  if (!transporter) {
    console.log('📧 Email notification skipped (email not configured)');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    if (!mailOptions.from) {
      mailOptions.from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  if (!transporter && !isConfigured) {
    createTransporter();
  }

  if (!transporter) {
    console.log('⚠️  Email service not configured - skipping verification');
    return { success: false, message: 'Email service not configured' };
  }

  console.log('⚠️  Email configured but Railway free tier blocks SMTP ports');
  console.log('ℹ️  Emails will NOT work on Railway without:');
  console.log('   1. Upgrading Railway plan, OR');
  console.log('   2. Using HTTP-based email service (SendGrid, Postmark, etc.)');
  return { success: true, message: 'Email configured (will fail on Railway free tier)' };
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  isConfigured: () => isConfigured
};
