// PayPal Service for Solora StayCo
// Supports PayPal Sandbox for testing and Production for live payments

/**
 * PayPal Configuration
 * Set these in environment variables or update directly
 */
const PAYPAL_CONFIG = {
  // Sandbox credentials (for testing)
  sandbox: {
    // Fallback to hardcoded sandbox client ID if env var not set
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX || 'AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW',
    // Use sandbox script: https://www.sandbox.paypal.com/sdk/js
  },
  // Production credentials (for live)
  production: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
    // Use production script: https://www.paypal.com/sdk/js
  },
  // Current environment
  environment: import.meta.env.VITE_PAYPAL_ENV || 'sandbox', // 'sandbox' or 'production'
  currency: 'USD',
};

/**
 * Load PayPal SDK script
 * @returns {Promise<void>}
 */
export function loadPayPalSDK(currency = PAYPAL_CONFIG.currency) {
  return new Promise((resolve, reject) => {
    const requestedCurrency = currency || PAYPAL_CONFIG.currency;
    const existingScript = document.querySelector('script[data-solora-paypal-sdk="true"]');

    if (window.paypal && existingScript?.dataset.currency === requestedCurrency) {
      resolve();
      return;
    }

    if (existingScript && existingScript.dataset.currency !== requestedCurrency) {
      existingScript.remove();
      delete window.paypal;
    }

    const script = document.createElement('script');
    const env = PAYPAL_CONFIG.environment === 'production' ? '' : 'sandbox';
    const clientId = PAYPAL_CONFIG.environment === 'production' 
      ? PAYPAL_CONFIG.production.clientId 
      : PAYPAL_CONFIG.sandbox.clientId;
    
    // Validate client ID
    if (!clientId || clientId.trim() === '') {
      reject(new Error('PayPal Client ID is not configured. Please set VITE_PAYPAL_CLIENT_ID_SANDBOX in your .env file.'));
      return;
    }
    
    // Ensure sandbox mode for guest/host login
    const intent = 'capture'; // Required for payments
    // Enable payment methods including PayPal balance
    const components = 'buttons,marks,funding-eligibility';
    script.src = `https://www${env ? '.sandbox' : ''}.paypal.com/sdk/js?client-id=${clientId}&currency=${requestedCurrency}&intent=${intent}&components=${components}`;
    script.async = true;
    script.dataset.soloraPaypalSdk = 'true';
    script.dataset.currency = requestedCurrency;
    
    script.onload = () => {
      console.log('PayPal SDK loaded successfully');
      // Verify PayPal is actually available
      if (window.paypal && window.paypal.Buttons) {
        resolve();
      } else {
        reject(new Error('PayPal SDK loaded but buttons are not available. Please check your Client ID.'));
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load PayPal SDK:', error);
      console.error('Client ID used:', clientId.substring(0, 20) + '...');
      console.error('Environment:', PAYPAL_CONFIG.environment);
      reject(new Error(`Failed to load PayPal SDK. Please check your Client ID and ensure it's valid. If using sandbox, make sure you're using a sandbox Client ID.`));
    };
    
    document.body.appendChild(script);
  });
}

/**
 * Create PayPal payment
 * @param {Object} paymentData - Payment details
 * @param {string} paymentData.amount - Payment amount
 * @param {string} paymentData.currency - Currency code (default: USD)
 * @param {string} paymentData.description - Payment description
 * @param {string} paymentData.bookingId - Booking ID for reference
 * @param {string} paymentData.paymentType - Payment type ('full', 'down', 'custom')
 * @param {number} paymentData.totalAmount - Total booking amount
 * @param {number} paymentData.hostEarnings - Host earnings amount
 * @param {number} paymentData.adminCommission - Admin commission amount
 * @param {Function} onApprove - Callback when payment is approved
 * @param {Function} onError - Callback when payment fails
 * @returns {Promise<Object>} PayPal buttons container
 */
export async function createPayPalPayment(paymentData, onApprove, onError) {
  try {
    await loadPayPalSDK(paymentData.currency || PAYPAL_CONFIG.currency);
    
    if (!window.paypal) {
      throw new Error('PayPal SDK not loaded');
    }

    const { 
      amount, 
      currency = 'USD', 
      description, 
      bookingId,
      paymentType = 'full',
      totalAmount,
      hostEarnings,
      adminCommission
    } = paymentData;

    // Format breakdown for PayPal description
    let fullDescription = description || `Booking ${bookingId}`;
    if (paymentType !== 'full' && totalAmount) {
      const remaining = (totalAmount - parseFloat(amount)).toFixed(2);
      fullDescription += ` (${paymentType === 'down' ? 'Down Payment' : 'Partial Payment'}: $${amount}, Remaining: $${remaining})`;
    }

    return window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal',
      },
      // Remove fundingSource restriction to allow both personal and business accounts
      // This enables PayPal balance, credit cards, and all funding sources
      createOrder: (data, actions) => {
        // Create order with proper configuration to allow PayPal balance and all account types
        // This configuration allows both personal and business sandbox accounts
        const orderData = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              value: amount.toString(),
              currency_code: currency,
            },
            description: fullDescription,
            custom_id: bookingId || '',
          }],
          application_context: {
            brand_name: 'Solora StayCo',
            landing_page: 'BILLING', // BILLING allows all payment methods including balance
            user_action: 'PAY_NOW',
            return_url: window.location.href,
            cancel_url: window.location.href,
            // Don't restrict payment method - allow all funding sources
          },
        };

        console.log('Creating PayPal order (sandbox mode):', {
          ...orderData,
          environment: PAYPAL_CONFIG.environment,
        });
        return actions.order.create(orderData);
      },
      onApprove: async (data, actions) => {
        try {
          console.log('PayPal payment approved, capturing order...', data);
          const order = await actions.order.capture();
          console.log('PayPal order captured:', order);
          
          if (order.status === 'COMPLETED') {
            onApprove({
              success: true,
              orderId: order.id,
              payerId: order.payer?.payer_id || order.payer?.payer_info?.payer_id,
              transactionId: order.purchase_units[0]?.payments?.captures[0]?.id || order.id,
              amount: order.purchase_units[0]?.amount?.value || amount,
              currency: order.purchase_units[0]?.amount?.currency_code || currency,
              bookingId: order.purchase_units[0]?.custom_id || bookingId,
            });
          } else {
            console.error('PayPal order status:', order.status);
            onError(new Error(`Payment status: ${order.status}. Please try again.`));
          }
        } catch (error) {
          console.error('PayPal payment error:', error);
          const errorMessage = error.message || 'Payment processing failed. Please try again or contact support.';
          onError(new Error(errorMessage));
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        onError(err);
      },
      onCancel: () => {
        onError(new Error('Payment cancelled by user'));
      },
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    throw error;
  }
}

/**
 * Verify PayPal payment (server-side verification recommended)
 * @param {string} transactionId - PayPal transaction ID
 * @returns {Promise<Object>} Payment verification result
 */
export async function verifyPayPalPayment(transactionId) {
  // Note: This should be done server-side for security
  // This is a placeholder for client-side verification
  // In production, verify payments on your backend
  
  return {
    verified: true,
    transactionId,
    note: 'Client-side verification. Implement server-side verification for production.',
  };
}

/**
 * Get PayPal environment info
 * @returns {Object} Environment configuration
 */
export function getPayPalConfig() {
  return {
    environment: PAYPAL_CONFIG.environment,
    isSandbox: PAYPAL_CONFIG.environment === 'sandbox',
    clientId: PAYPAL_CONFIG.environment === 'production' 
      ? PAYPAL_CONFIG.production.clientId 
      : PAYPAL_CONFIG.sandbox.clientId,
  };
}

