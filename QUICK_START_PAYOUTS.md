# Quick Start: Automated PayPal Payouts

## 🚀 Fast Setup (5 minutes)

### Step 1: Choose Backend Option

**Option A: Firebase Cloud Functions** (Recommended)
```bash
cd functions
npm install
firebase functions:config:set paypal.client_id_sandbox="AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW"
firebase functions:config:set paypal.secret_sandbox="EDX-_Q61TP7Ek5XTQIVVXrVy9L5FY-Q-YRQ3ypyhEGtHjhgw9MqtdYMCz4fI3XqgZTgD6Tpkj4LoIXSM"
firebase deploy --only functions
```

**Option B: Standalone Server**
```bash
cd server
npm install
# Create server/.env with credentials
npm start
# Update frontend .env: VITE_PAYOUTS_API_URL=http://localhost:3001/api/paypal
```

### Step 2: Update Frontend .env

```env
VITE_PAYPAL_ENV=sandbox
VITE_PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
VITE_PAYOUTS_API_URL=  # Leave empty for Firebase Functions
```

### Step 3: Test

1. Create host account → Connect PayPal sandbox business email
2. Create guest account → Use PayPal sandbox personal account
3. Make booking → Payment → Automatic payout happens!

## ✅ What's Implemented

- ✅ Automatic payout after guest payment
- ✅ Secure backend API (Firebase Functions or Node.js)
- ✅ PayPal Payouts API integration
- ✅ Payout tracking in database
- ✅ Error handling and retries
- ✅ Sandbox mode for testing

## 📋 What You Need

1. **Host PayPal Sandbox Email**: `?` (create in PayPal Developer Dashboard)
2. **Guest PayPal Sandbox Email**: `?` (create in PayPal Developer Dashboard)
3. **Backend Running**: Firebase Functions deployed OR standalone server started

## 🔒 Security

- ✅ PayPal Secret stored only in backend
- ✅ No credentials in frontend code
- ✅ All API calls through secure backend
- ✅ Environment variables for all secrets

## 📚 Full Documentation

See `PAYPAL_AUTOMATED_PAYOUTS_SETUP.md` for complete guide.

