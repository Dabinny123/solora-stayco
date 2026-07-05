/**
 * Standalone Node.js Server for PayPal Payouts
 * Alternative to Firebase Cloud Functions
 * 
 * Run: node server/paypal-payouts-server.js
 * Requires: npm install express cors dotenv
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PayPal Configuration from environment variables
const PAYPAL_CONFIG = {
  sandbox: {
    clientId: process.env.PAYPAL_CLIENT_ID_SANDBOX,
    clientSecret: process.env.PAYPAL_SECRET_SANDBOX,
    apiUrl: 'https://api-m.sandbox.paypal.com',
  },
  production: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_SECRET,
    apiUrl: 'https://api-m.paypal.com',
  },
  environment: process.env.PAYPAL_ENV || 'sandbox',
};

/**
 * Get PayPal OAuth Access Token
 */
async function getPayPalAccessToken() {
  const config = PAYPAL_CONFIG.environment === 'production' 
    ? PAYPAL_CONFIG.production 
    : PAYPAL_CONFIG.sandbox;

  if (!config.clientId || !config.clientSecret) {
    throw new Error('PayPal credentials not configured in environment variables');
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
    throw new Error(`Failed to get PayPal access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create PayPal Payout
 */
async function createPayPalPayout(payoutData) {
  const { hostPayPalEmail, amount, currency = 'USD', bookingId, paymentId } = payoutData;

  const accessToken = await getPayPalAccessToken();
  const config = PAYPAL_CONFIG.environment === 'production' 
    ? PAYPAL_CONFIG.production 
    : PAYPAL_CONFIG.sandbox;

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

  return await response.json();
}

/**
 * POST /api/paypal/payout
 * Process PayPal payout
 */
app.post('/api/paypal/payout', async (req, res) => {
  try {
    const { paymentId, hostId, hostPayPalEmail, amount, currency, bookingId } = req.body;

    // Validate input
    if (!paymentId || !hostId || !hostPayPalEmail || !amount || !bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: paymentId, hostId, hostPayPalEmail, amount, bookingId',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    // Create payout
    const payoutResult = await createPayPalPayout({
      hostPayPalEmail,
      amount,
      currency: currency || 'USD',
      bookingId,
      paymentId,
    });

    console.log(`✅ Payout created: ${payoutResult.batch_header?.payout_batch_id}`);

    res.json({
      success: true,
      payout_batch_id: payoutResult.batch_header?.payout_batch_id,
      batch_status: payoutResult.batch_header?.batch_status,
      items: payoutResult.items || [],
    });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/paypal/payout/:batchId
 * Get payout status
 */
app.get('/api/paypal/payout/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const accessToken = await getPayPalAccessToken();
    const config = PAYPAL_CONFIG.environment === 'production' 
      ? PAYPAL_CONFIG.production 
      : PAYPAL_CONFIG.sandbox;

    const response = await fetch(`${config.apiUrl}/v1/payments/payouts/${batchId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payout status: ${response.status}`);
    }

    const result = await response.json();
    res.json({
      success: true,
      payout_batch_id: result.batch_header?.payout_batch_id,
      batch_status: result.batch_header?.batch_status,
      items: result.items || [],
    });
  } catch (error) {
    console.error('Error getting payout status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PayPal Payouts API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PayPal Payouts Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${PAYPAL_CONFIG.environment}`);
  console.log(`🔑 Client ID: ${PAYPAL_CONFIG[PAYPAL_CONFIG.environment].clientId?.substring(0, 20)}...`);
});

