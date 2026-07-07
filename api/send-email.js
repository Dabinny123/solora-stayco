import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Add CORS headers for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code, displayName } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    return res.status(500).json({ error: 'SMTP credentials not configured. Please add SMTP_EMAIL and SMTP_PASSWORD to Vercel environment variables.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });

  const digits = String(code).split('');
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:#f8f5ff;border:2px solid #e8dff5;border-radius:12px;text-align:center;vertical-align:middle;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;color:#7c3aed;letter-spacing:2px;">${d}</td>`
    )
    .join('<td style="width:8px;"></td>');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1fb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1fb;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.08);">
<tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#f59e42 100%);padding:36px 32px 28px;text-align:center;">
  <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:52px;font-size:28px;margin-bottom:12px;">☀️</div>
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Solora StayCo</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Mood-based staycations, made personal</p>
</td></tr>
<tr><td style="padding:36px 32px 16px;text-align:center;">
  <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Verify your email</h2>
  <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
    Hi <strong style="color:#1e1b4b;">${displayName || 'there'}</strong>, enter the code below in the app to verify your email and unlock your staycation experience.
  </p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
    <tr>${digitBoxes}</tr>
  </table>
  <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">This code expires in <strong style="color:#7c3aed;">10 minutes</strong></p>
  <p style="margin:0;color:#d1d5db;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
</td></tr>
<tr><td style="padding:0 32px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e8dff5,transparent);"></div></td></tr>
<tr><td style="padding:24px 32px 32px;text-align:center;">
  <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.5;">
    Solora StayCo · Mood-matched staycations<br>
    This is an automated message — please do not reply.
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Solora StayCo" <${smtpEmail}>`,
      to: email,
      subject: 'Your Solora StayCo verification code',
      html,
    });
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send verification email: ' + error.message });
  }
}
