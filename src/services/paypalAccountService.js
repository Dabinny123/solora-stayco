// PayPal Account Linking Service for Solora StayCo
// Handles PayPal account connection for hosts and guests

import { updateUser, getUser } from './usersService';
import { loadPayPalSDK } from './paypalService';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID_SANDBOX || 'AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW';
const PAYPAL_ENV = import.meta.env.VITE_PAYPAL_ENV || 'sandbox';

/**
 * Check if user has PayPal account connected
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function hasPayPalConnected(userId) {
  try {
    const user = await getUser(userId);
    return user?.paypalAccount?.isConnected === true;
  } catch (error) {
    console.error('Error checking PayPal connection:', error);
    return false;
  }
}

/**
 * Get PayPal account status
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export async function getPayPalAccountStatus(userId) {
  try {
    const user = await getUser(userId);
    return {
      isConnected: user?.paypalAccount?.isConnected === true,
      email: user?.paypalAccount?.email || null,
      merchantId: user?.paypalAccount?.merchantId || null,
      connectedAt: user?.paypalAccount?.connectedAt || null,
    };
  } catch (error) {
    console.error('Error getting PayPal account status:', error);
    return {
      isConnected: false,
      email: null,
      merchantId: null,
      connectedAt: null,
    };
  }
}

/**
 * Connect PayPal account using PayPal SDK
 * @param {string} userId - User ID
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Promise<void>}
 */
export async function connectPayPalAccount(userId, onSuccess, onError) {
  try {
    // Load PayPal SDK
    await loadPayPalSDK();
    
    if (!window.paypal) {
      throw new Error('PayPal SDK failed to load');
    }

    // Initialize PayPal account linking
    // Note: This is a simplified version. In production, you'd use PayPal's Onboarding API
    // For now, we'll simulate the connection process
    
    // Show PayPal login dialog
    const paypalWindow = window.open(
      `https://www${PAYPAL_ENV === 'sandbox' ? '.sandbox' : ''}.paypal.com/signin/authorize?client_id=${PAYPAL_CLIENT_ID}&response_type=code&scope=email profile&redirect_uri=${encodeURIComponent(window.location.origin + '/paypal/callback')}`,
      'PayPal Login',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Listen for message from PayPal window
    const messageListener = async (event) => {
      // Security: Verify origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'PAYPAL_AUTH_SUCCESS') {
        window.removeEventListener('message', messageListener);
        paypalWindow.close();

        // Save PayPal account info
        const paypalData = {
          isConnected: true,
          email: event.data.email || 'Connected',
          merchantId: event.data.merchantId || event.data.payerId,
          connectedAt: new Date().toISOString(),
        };

        await updateUser(userId, {
          paypalAccount: paypalData,
        });

        onSuccess(paypalData);
      } else if (event.data.type === 'PAYPAL_AUTH_ERROR') {
        window.removeEventListener('message', messageListener);
        paypalWindow.close();
        onError(new Error(event.data.error || 'PayPal connection failed'));
      }
    };

    window.addEventListener('message', messageListener);

    // Fallback: For sandbox testing, we'll use a simplified approach
    // In production, implement proper OAuth flow with backend
    setTimeout(() => {
      // Simulate successful connection for sandbox
      if (PAYPAL_ENV === 'sandbox') {
        // For sandbox, we'll allow manual connection
        // In production, this should be done through proper OAuth
        console.log('PayPal sandbox mode: Manual connection available');
      }
    }, 1000);

  } catch (error) {
    console.error('Error connecting PayPal account:', error);
    onError(error);
  }
}

/**
 * Simplified PayPal connection for sandbox/testing
 * @param {string} userId - User ID
 * @param {string} paypalEmail - PayPal email (for sandbox testing)
 * @returns {Promise<Object>}
 */
export async function connectPayPalAccountSimple(userId, paypalEmail) {
  try {
    const paypalData = {
      isConnected: true,
      email: paypalEmail,
      merchantId: `merchant_${userId}_${Date.now()}`,
      connectedAt: new Date().toISOString(),
    };

    await updateUser(userId, {
      paypalAccount: paypalData,
    });

    return paypalData;
  } catch (error) {
    console.error('Error connecting PayPal account:', error);
    throw error;
  }
}

/**
 * Disconnect PayPal account
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function disconnectPayPalAccount(userId) {
  try {
    await updateUser(userId, {
      paypalAccount: {
        isConnected: false,
        email: null,
        merchantId: null,
        connectedAt: null,
      },
    });
  } catch (error) {
    console.error('Error disconnecting PayPal account:', error);
    throw error;
  }
}

