const nodemailer = require('nodemailer');

// Configure transporter (use environment variables in production)
// FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

const sendLoginAlertEmail = async (email, firstName, ip, userAgent) => {
  try {
    const deviceInfo = getDeviceInfo(userAgent);
    
    const mailOptions = {
      from: `"CBC Education System" <${process.env.EMAIL_USER || 'noreply@cbc-education.com'}>`,
      to: email,
      subject: 'New Login Alert - CBC Education System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New login detected</h2>
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>We detected a new login to your CBC Education System account:</p>
          <ul>
            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            <li><strong>IP Address:</strong> ${ip}</li>
            <li><strong>Device:</strong> ${deviceInfo?.deviceName || 'Unknown'}</li>
            <li><strong>User Agent:</strong> ${userAgent?.substring(0, 100) || 'Unknown'}...</li>
          </ul>
          <p>If this was you, you can safely ignore this email.</p>
          <p style="color: red; font-weight: bold;">
            If you didn't log in, <a href="${process.env.FRONTEND_URL || 'https://yourapp.com'}/security">secure your account immediately</a>.
          </p>
          <hr>
          <p>Best regards,<br> CBC Education System Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Login alert email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send login alert email:', error);
    // Don't fail login on email issues
  }
};

// Simple device info helper
const getDeviceInfo = (userAgent) => {
  const ua = userAgent || '';
  let deviceType = 'desktop';
  let deviceName = 'Unknown Device';
  
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'mobile';
  } else if (ua.includes('iPad')) {
    deviceType = 'tablet';
  }
  
  if (ua.includes('Chrome')) deviceName = 'Chrome';
  else if (ua.includes('Firefox')) deviceName = 'Firefox';
  else if (ua.includes('Safari')) deviceName = 'Safari';
  else if (ua.includes('Edge')) deviceName = 'Edge';
  
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';
  
  return { deviceType, deviceName: `${deviceName} on ${os}` };
};

// Sends the school-admin welcome email (login URL + email + temp password)
// via a Supabase Edge Function that calls Resend, sending from
// welcome@noneaa.com. See: supabase/functions/send-school-admin-welcome
const sendSchoolAdminWelcomeEmail = async (email, firstName, schoolName, tempPassword) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Cannot send welcome email: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    return false;
  }

  const functionUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/send-school-admin-welcome`;
  const loginUrl = `${process.env.FRONTEND_URL || 'https://yourapp.com'}/login`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ email, firstName, schoolName, tempPassword, loginUrl }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('❌ send-school-admin-welcome edge function error:', data);
      return false;
    }

    console.log(`✅ School admin welcome email sent to ${email} (Resend id: ${data.id})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to call send-school-admin-welcome edge function:', error);
    return false;
  }
};

module.exports = { sendLoginAlertEmail, sendSchoolAdminWelcomeEmail };
