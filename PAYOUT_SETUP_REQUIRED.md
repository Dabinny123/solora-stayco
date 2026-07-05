# ⚠️ PayPal Payout Setup Required

## Current Issue

The money is going to the admin account but **NOT being automatically split to hosts**. This is because the **Firebase Cloud Functions are not deployed or configured**.

## Quick Fix Options

### Option 1: Deploy Firebase Functions (Recommended)

1. **Install Firebase Functions dependencies:**
   ```bash
   cd functions
   npm install
   ```

2. **Set PayPal credentials in Firebase:**
   ```bash
   firebase functions:config:set paypal.client_id_sandbox="AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW"
   firebase functions:config:set paypal.secret_sandbox="EDX-_Q61TP7Ek5XTQIVVXrVy9L5FY-Q-YRQ3ypyhEGtHjhgw9MqtdYMCz4fI3XqgZTgD6Tpkj4LoIXSM"
   firebase functions:config:set paypal.environment="sandbox"
   ```

3. **Deploy Functions:**
   ```bash
   firebase deploy --only functions
   ```

### Option 2: Use Standalone Server

1. **Start the standalone server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Set environment variable in `.env`:**
   ```env
   VITE_PAYOUTS_API_URL=http://localhost:3001/api/paypal
   ```

3. **Restart your dev server**

### Option 3: Manual Processing (Temporary)

Until automated payouts are set up:
1. Check `payout_requests` collection in Firestore
2. Manually transfer money from admin to host PayPal accounts
3. Update payout status in Firestore

## Testing

After setup:
1. Make a test booking with full payment
2. Check browser console for payout logs
3. Check Firestore `payouts` collection for payout records
4. Verify host receives money in their PayPal sandbox account

## Troubleshooting

### Error: "Firebase Functions not deployed"
- Deploy functions: `firebase deploy --only functions`

### Error: "PayPal credentials not configured"
- Set Firebase config: `firebase functions:config:set paypal.client_id_sandbox="..."`

### Error: "Functions unavailable"
- Check Firebase project settings
- Verify functions are enabled in Firebase Console

## Current Status

- ✅ Payment split calculation works
- ✅ Payout tracking in Firestore works
- ❌ **Automated payout API calls failing** (needs backend setup)

