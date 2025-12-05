const nodemailer = require('nodemailer');

/**
 * Email Configuration
 * Using Gmail SMTP for email notifications
 */

// Create transporter with Gmail SMTP settings
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  // Debug: Check if variables are loaded
  console.log('📧 Email configuration check:');
  console.log('   EMAIL_USER:', emailUser ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1] || ''}` : 'NOT SET');
  console.log('   EMAIL_PASSWORD:', emailPassword ? '****** (set)' : 'NOT SET');

  if (!emailUser || !emailPassword) {
    console.warn('⚠️  Email credentials not configured. Email notifications will be disabled.');
    console.warn('   Set EMAIL_USER and EMAIL_PASSWORD in environment variables to enable email notifications.');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      },
      // Add timeout and connection settings
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000, // 10 seconds
      // TLS settings for Gmail
      secure: false, // use STARTTLS
      requireTLS: true,
      tls: {
        rejectUnauthorized: false // For development/production compatibility
      }
    });

    console.log('✅ Email transporter configured successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

// Lazy-initialize transporter on first use
let transporter = null;
let transporterInitialized = false;

const getTransporter = () => {
  if (!transporterInitialized) {
    transporter = createTransporter();
    transporterInitialized = true;
  }
  return transporter;
};

/**
 * Send email function with error handling
 */
const sendEmail = async (mailOptions) => {
  const currentTransporter = getTransporter();
  if (!currentTransporter) {
    console.log('📧 Email notification skipped (email not configured)');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Add default sender if not specified
    if (!mailOptions.from) {
      mailOptions.from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    }

    const info = await currentTransporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration with timeout
 */
const verifyEmailConfig = async () => {
  const currentTransporter = getTransporter();
  if (!currentTransporter) {
    console.log('⚠️  Email service not configured - skipping verification');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Add timeout to prevent hanging
    const verifyPromise = currentTransporter.verify();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email verification timeout')), 15000)
    );
    
    await Promise.race([verifyPromise, timeoutPromise]);
    console.log('✅ Email server is ready to send messages');
    return { success: true, message: 'Email configuration verified' };
  } catch (error) {
    console.error('⚠️  Email configuration verification failed (non-critical):', error.message);
    console.log('   Email sending will be attempted but may fail if credentials are incorrect');
    // Don't fail startup - return success with warning
    return { success: true, warning: error.message };
  }
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  isConfigured: () => transporter !== null
};
