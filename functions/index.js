/**
 * Firebase Cloud Functions for Solora StayCo
 * PayPal Payouts API Integration
 * 
 * IMPORTANT: Never expose PayPal Secret in client-side code
 * This function handles all PayPal Payouts API calls securely
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * PayPal Configuration from environment variables
 * Set these in Firebase Functions config:
 * firebase functions:config:set paypal.client_id_sandbox="YOUR_CLIENT_ID"
 * firebase functions:config:set paypal.secret_sandbox="YOUR_SECRET"
 */
const PAYPAL_CONFIG = {
  sandbox: {
    clientId: functions.config().paypal?.client_id_sandbox || process.env.PAYPAL_CLIENT_ID_SANDBOX,
    clientSecret: functions.config().paypal?.secret_sandbox || process.env.PAYPAL_SECRET_SANDBOX,
    apiUrl: 'https://api-m.sandbox.paypal.com',
  },
  production: {
    clientId: functions.config().paypal?.client_id || process.env.PAYPAL_CLIENT_ID,
    clientSecret: functions.config().paypal?.secret || process.env.PAYPAL_SECRET,
    apiUrl: 'https://api-m.paypal.com',
  },
  environment: functions.config().paypal?.environment || process.env.PAYPAL_ENV || 'sandbox',
};

/**
 * Get PayPal OAuth Access Token
 * @returns {Promise<string>} Access token
 */
async function getPayPalAccessToken() {
  const config = PAYPAL_CONFIG.environment === 'production' 
    ? PAYPAL_CONFIG.production 
    : PAYPAL_CONFIG.sandbox;

  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPal credentials not configured. Set Firebase Functions config.');
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(`${config.apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal OAuth Error:', error);
    throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal Payout
 * @param {Object} payoutData - Payout details
 * @returns {Promise<Object>} Payout result
 */
async function createPayPalPayout(payoutData) {
  const { hostPayPalEmail, amount, currency = 'USD', bookingId, paymentId } = payoutData;

  const accessToken = await getPayPalAccessToken();
  const config = PAYPAL_CONFIG.environment === 'production' 
    ? PAYPAL_CONFIG.production 
    : PAYPAL_CONFIG.sandbox;

  // Generate unique batch ID
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const payoutRequest = {
    sender_batch_header: {
      sender_batch_id: batchId,
      email_subject: 'You have a payout from Solora StayCo',
      email_message: `You received ${currency} ${amount} for booking ${bookingId}. Thank you for hosting with Solora StayCo!`,
    },
    items: [
      {
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toString(),
          currency: currency,
        },
        receiver: hostPayPalEmail,
        note: `Host earnings for booking ${bookingId}`,
        sender_item_id: paymentId,
      },
    ],
  };

  const response = await fetch(`${config.apiUrl}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payoutRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal Payout Error:', error);
    throw new Error(`PayPal payout failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return {
    success: true,
    payout_batch_id: result.batch_header?.payout_batch_id,
    batch_status: result.batch_header?.batch_status,
    items: result.items || [],
    links: result.links || [],
  };
}

/**
 * Cloud Function: Process PayPal Payout
 * Called from frontend after successful guest payment
 * 
 * Request body:
 * {
 *   paymentId: string,
 *   hostId: string,
 *   hostPayPalEmail: string,
 *   amount: number,
 *   currency: string,
 *   bookingId: string
 * }
 */
exports.processPayPalPayout = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { paymentId, hostId, hostPayPalEmail, amount, currency, bookingId } = data;

  // Validate input
  if (!paymentId || !hostId || !hostPayPalEmail || !amount || !bookingId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be greater than 0');
  }

  try {
    // Create payout via PayPal API
    const payoutResult = await createPayPalPayout({
      hostPayPalEmail,
      amount,
      currency: currency || 'USD',
      bookingId,
      paymentId,
    });

    // Save payout record to Firestore
    const payoutRecord = {
      paymentId,
      hostId,
      hostPayPalEmail,
      amount,
      currency: currency || 'USD',
      bookingId,
      payout_batch_id: payoutResult.payout_batch_id,
      batch_status: payoutResult.batch_status,
      status: 'processing',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      items: payoutResult.items || [],
    };

    await db.collection('payouts').add(payoutRecord);

    // Update payment record with payout info
    await db.collection('payments').doc(paymentId).update({
      payout_batch_id: payoutResult.payout_batch_id,
      payout_status: 'processing',
      payout_processed_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Payout created: ${payoutResult.payout_batch_id} for payment ${paymentId}`);

    return {
      success: true,
      payout_batch_id: payoutResult.payout_batch_id,
      batch_status: payoutResult.batch_status,
      message: 'Payout processed successfully',
    };
  } catch (error) {
    console.error('Error processing payout:', error);

    // Save failed payout attempt
    await db.collection('payouts').add({
      paymentId,
      hostId,
      hostPayPalEmail,
      amount,
      currency: currency || 'USD',
      bookingId,
      status: 'failed',
      error: error.message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    throw new functions.https.HttpsError('internal', `Payout failed: ${error.message}`);
  }
});

/**
 * Cloud Function: Get Payout Status
 * Check status of a payout batch
 */
exports.getPayoutStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { payout_batch_id } = data;

  if (!payout_batch_id) {
    throw new functions.https.HttpsError('invalid-argument', 'payout_batch_id is required');
  }

  try {
    const accessToken = await getPayPalAccessToken();
    const config = PAYPAL_CONFIG.environment === 'production' 
      ? PAYPAL_CONFIG.production 
      : PAYPAL_CONFIG.sandbox;

    const response = await fetch(`${config.apiUrl}/v1/payments/payouts/${payout_batch_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payout status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      payout_batch_id: result.batch_header?.payout_batch_id,
      batch_status: result.batch_header?.batch_status,
      items: result.items || [],
    };
  } catch (error) {
    console.error('Error getting payout status:', error);
    throw new functions.https.HttpsError('internal', `Failed to get payout status: ${error.message}`);
  }
});

// ─── Email Verification Code System ─────────────────────────────────────────

const nodemailer = require('nodemailer');

/**
 * SMTP config from Firebase Functions environment variables.
 * Set with:
 *   firebase functions:config:set smtp.email="your@gmail.com" smtp.password="your-app-password"
 *
 * For Gmail, use an App Password (https://support.google.com/accounts/answer/185833).
 */
function getMailTransporter() {
  const smtpEmail = functions.config().smtp?.email || process.env.SMTP_EMAIL;
  const smtpPassword = functions.config().smtp?.password || process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    throw new Error(
      'SMTP credentials not configured. Run: firebase functions:config:set smtp.email="…" smtp.password="…"'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: smtpEmail, pass: smtpPassword },
  });
}

/**
 * Build the branded HTML email for the verification code.
 */
function buildVerificationEmailHtml(code, displayName) {
  const digits = String(code).split('');
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width:48px;height:56px;background:#f8f5ff;border:2px solid #e8dff5;border-radius:12px;text-align:center;vertical-align:middle;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;color:#7c3aed;letter-spacing:2px;">${d}</td>`
    )
    .join('<td style="width:8px;"></td>');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f1fb;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1fb;padding:40px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.08);">

<!-- Gradient Header -->
<tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#f59e42 100%);padding:36px 32px 28px;text-align:center;">
  <div style="display:inline-block;width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:52px;font-size:28px;margin-bottom:12px;">☀️</div>
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Solora StayCo</h1>
  <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Mood-based staycations, made personal</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:36px 32px 16px;text-align:center;">
  <h2 style="margin:0 0 8px;color:#1e1b4b;font-size:22px;font-weight:700;">Verify your email</h2>
  <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">
    Hi <strong style="color:#1e1b4b;">${displayName || 'there'}</strong>, enter the code below in the app to verify your email and unlock your staycation experience.
  </p>

  <!-- Code display -->
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
    <tr>${digitBoxes}</tr>
  </table>

  <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">This code expires in <strong style="color:#7c3aed;">10 minutes</strong></p>
  <p style="margin:0;color:#d1d5db;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 32px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#e8dff5,transparent);"></div></td></tr>

<!-- Footer -->
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
}

/**
 * Cloud Function: Send Email Verification Code
 *
 * Generates a 6-digit code, stores it in Firestore, and emails it.
 * Rate-limited to 1 request per 60 seconds per user.
 *
 * Request body: { email: string, displayName?: string }
 */
exports.sendVerificationCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { email, displayName } = data;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  // Rate-limit: check last code timestamp
  const codeDocRef = db.collection('verification_codes').doc(userId);
  const existingDoc = await codeDocRef.get();

  if (existingDoc.exists) {
    const lastSent = existingDoc.data().sentAt?.toDate?.() || new Date(0);
    const secondsSinceLastSent = (Date.now() - lastSent.getTime()) / 1000;
    if (secondsSinceLastSent < 60) {
      const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Please wait ${waitSeconds} seconds before requesting a new code.`
      );
    }
  }

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store in Firestore with 10-minute expiry
  await codeDocRef.set({
    code,
    email,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
    verified: false,
    attempts: 0,
  });

  // Send email
  try {
    const transporter = getMailTransporter();
    await transporter.sendMail({
      from: `"Solora StayCo" <${functions.config().smtp?.email || process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your Solora StayCo verification code',
      html: buildVerificationEmailHtml(code, displayName),
    });

    console.log(`✅ Verification code sent to ${email} for user ${userId}`);
    return { success: true, message: 'Verification code sent' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send verification email. Please try again.');
  }
});

/**
 * Cloud Function: Verify Email Code
 *
 * Validates the code and marks the user as email-verified in Firestore.
 * Max 5 attempts per code to prevent brute-force.
 *
 * Request body: { code: string }
 */
exports.verifyEmailCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const { code } = data;

  if (!code || typeof code !== 'string' || code.length !== 6) {
    throw new functions.https.HttpsError('invalid-argument', 'A valid 6-digit code is required');
  }

  const codeDocRef = db.collection('verification_codes').doc(userId);
  const codeDoc = await codeDocRef.get();

  if (!codeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'No verification code found. Please request a new one.');
  }

  const codeData = codeDoc.data();

  // Check attempts
  if ((codeData.attempts || 0) >= 5) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many attempts. Please request a new verification code.'
    );
  }

  // Increment attempts
  await codeDocRef.update({ attempts: (codeData.attempts || 0) + 1 });

  // Check expiry
  const expiresAt = codeData.expiresAt?.toDate?.() || new Date(codeData.expiresAt);
  if (Date.now() > expiresAt.getTime()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'This code has expired. Please request a new one.');
  }

  // Check code match
  if (codeData.code !== code.trim()) {
    const remaining = 5 - ((codeData.attempts || 0) + 1);
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Incorrect code. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Please request a new code.'}`
    );
  }

  // Code is valid — mark user as verified
  await codeDocRef.update({ verified: true });

  // Update user document
  await db.collection('users').doc(userId).update({
    emailVerified: true,
    emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Email verified for user ${userId}`);
  return { success: true, message: 'Email verified successfully' };
});


