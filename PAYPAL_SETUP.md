# PayPal Integration Setup Guide

This guide explains how to set up PayPal payment integration for Solora StayCo, including both Sandbox (testing) and Production (live) environments.

## Overview

The PayPal integration supports:
- **PayPal Account Payments**: Users can pay with their PayPal account
- **Credit/Debit Card Payments**: Users can pay with cards without a PayPal account
- **Sandbox Mode**: For testing with fake accounts and transactions
- **Production Mode**: For live payments with real money

## Setup Steps

### 1. Create PayPal Developer Account

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Sign in with your PayPal account (or create one)
3. Navigate to **Dashboard** → **My Apps & Credentials**

### 2. Create Sandbox App (For Testing)

1. In the Dashboard, click **Create App**
2. Fill in:
   - **App Name**: `Solora StayCo - Sandbox`
   - **Merchant**: Select your sandbox business account
3. Click **Create App**
4. Copy the **Client ID** (you'll need this)

### 3. Create Production App (For Live Payments)

1. Click **Create App** again
2. Fill in:
   - **App Name**: `Solora StayCo - Production`
   - **Merchant**: Select your live business account
3. Click **Create App**
4. Copy the **Client ID** (keep this secure)

### 4. Configure Environment Variables

Create a `.env` file in your project root (or update existing one):

```env
# PayPal Configuration
VITE_PAYPAL_ENV=sandbox  # Use 'sandbox' for testing, 'production' for live
VITE_PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
VITE_PAYPAL_CLIENT_ID=your_production_client_id_here
```

**Current Sandbox Credentials:**
- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`
- **Business Account Email**: `sb-wvhfn47985802@business.example.com`
- **Environment**: Sandbox

**Important**: 
- Never commit `.env` files with production credentials to Git
- Add `.env` to `.gitignore`
- Use environment variables in your deployment platform (Vercel, Netlify, etc.)

### 5. Test with Sandbox Accounts

PayPal provides test accounts for sandbox mode:

1. Go to [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)
2. You'll see pre-created test accounts:
   - **Personal Account**: For testing buyer experience
   - **Business Account**: For testing merchant experience

#### Test Account Credentials

You can use these default test accounts or create custom ones:

**Buyer Account (Personal)**:
- Email: `sb-buyer@business.example.com`
- Password: (set when creating account)

**Merchant Account (Business)**:
- Email: `sb-merchant@business.example.com`
- Password: (set when creating account)

### 6. Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to a listing** and click "Book"

3. **Select PayPal** as payment method

4. **Fill in booking details** (dates, guest info)

5. **Click PayPal button** - you'll be redirected to PayPal

6. **Sign in with sandbox test account**:
   - Use the buyer test account credentials
   - Complete the payment flow

7. **Verify payment**:
   - Check that booking is created
   - Check payment status in Firestore
   - Verify notifications are sent

### 7. Switch to Production

When ready for live payments:

1. **Update `.env`**:
   ```env
   VITE_PAYPAL_ENV=production
   VITE_PAYPAL_CLIENT_ID=your_production_client_id
   ```

2. **Deploy with production credentials**:
   - Set environment variables in your hosting platform
   - Never expose production Client ID in client-side code

3. **Test with small amounts first**

## PayPal SDK Configuration

The PayPal SDK is loaded dynamically in `src/services/paypalService.js`:

- **Sandbox**: `https://www.sandbox.paypal.com/sdk/js`
- **Production**: `https://www.paypal.com/sdk/js`

The script automatically loads based on `VITE_PAYPAL_ENV`.

## Payment Flow

1. User selects PayPal payment method
2. PayPal SDK loads and renders buttons
3. User clicks "Pay with PayPal"
4. Redirected to PayPal checkout
5. User completes payment on PayPal
6. PayPal redirects back with payment confirmation
7. System creates booking and marks payment as paid
8. User sees confirmation page

## Security Considerations

### Client-Side (Current Implementation)
- ✅ Payment buttons rendered securely
- ✅ Payment verification happens via PayPal callbacks
- ⚠️ **Recommended**: Add server-side verification

### Server-Side Verification (Recommended for Production)

For production, implement server-side payment verification:

1. **Create backend endpoint** to verify PayPal payments
2. **Use PayPal REST API** to verify transaction IDs
3. **Store payment secrets** on server only
4. **Verify payment before confirming booking**

Example server-side verification (Node.js):
```javascript
const paypal = require('@paypal/checkout-server-sdk');

async function verifyPayment(orderId) {
  const request = new paypal.orders.OrdersGetRequest(orderId);
  const order = await client.execute(request);
  return order.result.status === 'COMPLETED';
}
```

## Troubleshooting

### PayPal Buttons Not Showing

1. **Check Client ID**: Ensure `VITE_PAYPAL_CLIENT_ID_SANDBOX` is set
2. **Check Console**: Look for PayPal SDK loading errors
3. **Check Network**: Ensure PayPal SDK can be loaded (no CORS issues)

### Payment Not Completing

1. **Check Sandbox Account**: Ensure you're using valid test account
2. **Check Console Logs**: Look for payment callback errors
3. **Check Firestore**: Verify booking and payment records are created

### "Invalid Client ID" Error

- Verify Client ID is correct
- Ensure environment variable is loaded
- Check that you're using sandbox Client ID in sandbox mode

## PayPal Sandbox Test Cards

For card payments without PayPal account:

- **Card Number**: `4111111111111111`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVV**: Any 3 digits (e.g., `123`)
- **Name**: Any name

## Support

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Support](https://www.paypal.com/support)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)

## Next Steps

1. ✅ Set up sandbox account
2. ✅ Configure environment variables
3. ✅ Test payment flow
4. ⏳ Implement server-side verification (recommended)
5. ⏳ Set up production account
6. ⏳ Deploy with production credentials

