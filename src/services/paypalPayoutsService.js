// PayPal Payouts Service for Solora StayCo
// Handles automatic transfers from admin account to host accounts
// Uses Firebase Cloud Functions or standalone backend server

/**
 * Backend API Configuration
 * Set VITE_PAYOUTS_API_URL to your backend URL
 * For Firebase Functions: leave empty (uses Firebase SDK)
 * For standalone server: set to http://localhost:3001/api/paypal
 */
const PAYOUTS_API_URL = import.meta.env.VITE_PAYOUTS_API_URL || '';
const USE_FIREBASE_FUNCTIONS = !PAYOUTS_API_URL; // Use Firebase if no custom URL

/**
 * Call backend API for PayPal payout
 * Uses Firebase Cloud Functions or standalone server
 */
async function callPayoutAPI(payoutData) {
  if (USE_FIREBASE_FUNCTIONS) {
    // Use Firebase Cloud Functions
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { getApp } = await import('firebase/app');
      const app = getApp();
      const functions = getFunctions(app);
      const processPayout = httpsCallable(functions, 'processPayPalPayout');
      
      console.log('📞 Calling Firebase Function: processPayPalPayout', payoutData);
      const result = await processPayout(payoutData);
      console.log('✅ Firebase Function response:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Firebase Function Error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      
      // Provide helpful error message
      if (error.code === 'functions/not-found') {
        throw new Error('Firebase Functions not deployed. Please deploy functions or use standalone server.');
      } else if (error.code === 'functions/unavailable') {
        throw new Error('Firebase Functions unavailable. Check if functions are deployed and configured.');
      } else if (error.code === 'functions/invalid-argument') {
        throw new Error(`Invalid payout data: ${error.message}`);
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      throw new Error(`Payout failed: ${error.message || 'Unknown error'}`);
    }
  } else {
    // Use standalone server
    console.log('📞 Calling standalone server:', `${PAYOUTS_API_URL}/payout`);
    const response = await fetch(`${PAYOUTS_API_URL}/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payoutData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ Standalone server error:', error);
      throw new Error(error.error || `Payout request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Standalone server response:', result);
    return result;
  }
}

/**
 * Create PayPal payout to host
 * Calls backend server (Firebase Functions or standalone) to process payout securely
 * @param {Object} payoutData - Payout details
 * @param {string} payoutData.hostPayPalEmail - Host's PayPal email
 * @param {number} payoutData.amount - Amount to transfer
 * @param {string} payoutData.currency - Currency code
 * @param {string} payoutData.bookingId - Booking ID for reference
 * @param {string} payoutData.paymentId - Payment ID for reference
 * @param {string} payoutData.hostId - Host user ID
 * @returns {Promise<Object>} Payout result
 */
export async function createPayPalPayout(payoutData) {
  try {
    const { hostPayPalEmail, amount, currency = 'USD', bookingId, paymentId, hostId } = payoutData;

    if (!hostPayPalEmail || !amount || !bookingId || !paymentId || !hostId) {
      throw new Error('Missing required payout data: hostPayPalEmail, amount, bookingId, paymentId, hostId');
    }

    if (amount <= 0) {
      throw new Error('Payout amount must be greater than 0');
    }

    // Call backend API to process payout
    const result = await callPayoutAPI({
      paymentId,
      hostId,
      hostPayPalEmail,
      amount,
      currency,
      bookingId,
    });

    // Save payout record to Firestore
    const { createDocument } = await import('../firebase/firestoreService');
    
    await createDocument('payouts', {
      paymentId,
      hostId,
      hostPayPalEmail,
      amount,
      currency,
      bookingId,
      payout_batch_id: result.payout_batch_id,
      batch_status: result.batch_status,
      status: result.batch_status === 'PENDING' ? 'processing' : 'completed',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    });

    console.log(`✅ Payout processed: ${result.payout_batch_id} for ${hostPayPalEmail}`);

    return {
      success: true,
      payout_batch_id: result.payout_batch_id,
      batch_status: result.batch_status,
      amount,
      currency,
      recipientEmail: hostPayPalEmail,
      bookingId,
      paymentId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating PayPal payout:', error);
    
    // Save failed payout attempt
    try {
      const { createDocument } = await import('../firebase/firestoreService');
      await createDocument('payouts', {
        paymentId: payoutData.paymentId,
        hostId: payoutData.hostId,
        hostPayPalEmail: payoutData.hostPayPalEmail,
        amount: payoutData.amount,
        currency: payoutData.currency || 'USD',
        bookingId: payoutData.bookingId,
        status: 'failed',
        error: error.message,
        createdAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('Error saving failed payout:', dbError);
    }

    throw error;
  }
}

/**
 * Get payout status from PayPal
 * @param {string} payout_batch_id - PayPal payout batch ID
 * @returns {Promise<Object>} Payout status
 */
export async function getPayoutStatus(payout_batch_id) {
  try {
    if (USE_FIREBASE_FUNCTIONS) {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const { getApp } = await import('firebase/app');
      const app = getApp();
      const functions = getFunctions(app);
      const getStatus = httpsCallable(functions, 'getPayoutStatus');
      
      const result = await getStatus({ payout_batch_id });
      return result.data;
    } else {
      const response = await fetch(`${PAYOUTS_API_URL}/payout/${payout_batch_id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to get payout status');
      }

      return await response.json();
    }
  } catch (error) {
    console.error('Error getting payout status:', error);
    throw error;
  }
}


/**
 * Manual payout instructions (for admin)
 * @param {Object} payoutData - Payout details
 * @returns {string} Instructions for manual payout
 */
export function getManualPayoutInstructions(payoutData) {
  const { hostPayPalEmail, amount, currency, bookingId } = payoutData;
  
  return `
    MANUAL PAYOUT INSTRUCTIONS:
    
    1. Log in to PayPal Sandbox: https://www.sandbox.paypal.com
    2. Use Admin Account: sb-wvhfn47985802@business.example.com
    3. Go to Send & Request → Send Money
    4. Enter Host Email: ${hostPayPalEmail}
    5. Enter Amount: ${amount} ${currency}
    6. Add Note: "Booking ${bookingId} - Host Earnings"
    7. Complete Transfer
    
    Or use PayPal Payouts API via your backend server.
  `;
}

