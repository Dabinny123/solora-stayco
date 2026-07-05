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

