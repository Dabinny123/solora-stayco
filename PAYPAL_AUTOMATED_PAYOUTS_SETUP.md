# PayPal Automated Payouts - Complete Setup Guide

## ✅ Implementation Complete

I've implemented automated PayPal payouts that transfer money from admin to hosts after successful guest payments.

## Architecture

### Current Setup:
- **Frontend**: React app (Vite)
- **Backend Options**:
  1. **Firebase Cloud Functions** (Recommended - already using Firebase)
  2. **Standalone Node.js Server** (Alternative)

### Payment Flow:
```
Guest Payment → Admin PayPal Account → Automatic Payout → Host PayPal Account
```

## Setup Instructions

### Option 1: Firebase Cloud Functions (Recommended)

#### Step 1: Install Firebase Functions
```bash
cd functions
npm install
```

#### Step 2: Set PayPal Credentials
```bash
firebase functions:config:set paypal.client_id_sandbox="AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW"
firebase functions:config:set paypal.secret_sandbox="EDX-_Q61TP7Ek5XTQIVVXrVy9L5FY-Q-YRQ3ypyhEGtHjhgw9MqtdYMCz4fI3XqgZTgD6Tpkj4LoIXSM"
firebase functions:config:set paypal.environment="sandbox"
```

#### Step 3: Deploy Functions
```bash
firebase deploy --only functions
```

#### Step 4: Update Frontend
The frontend is already configured to use Firebase Functions automatically (no URL needed).

### Option 2: Standalone Node.js Server

#### Step 1: Install Dependencies
```bash
cd server
npm install
```

#### Step 2: Create `.env` file in `server/` directory
```env
PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
PAYPAL_SECRET_SANDBOX=EDX-_Q61TP7Ek5XTQIVVXrVy9L5FY-Q-YRQ3ypyhEGtHjhgw9MqtdYMCz4fI3XqgZTgD6Tpkj4LoIXSM
PAYPAL_ENV=sandbox
PORT=3001
```

#### Step 3: Start Server
```bash
npm start
```

#### Step 4: Update Frontend `.env`
```env
VITE_PAYOUTS_API_URL=http://localhost:3001/api/paypal
```

## How It Works

### 1. Guest Payment Flow
1. Guest selects PayPal payment method
2. Guest logs into PayPal sandbox (personal account)
3. Payment goes to admin PayPal account
4. Payment is captured and booking is created

### 2. Automatic Payout Flow
1. After successful payment, system:
   - Calculates host earnings (base price + cleaning fee)
   - Gets host's PayPal email from their account settings
   - Calls backend API to create PayPal payout
   - Backend uses admin credentials to transfer money
   - Money is sent to host's PayPal account

### 3. Payout Tracking
- Payout records saved in Firestore `payouts` collection
- Includes: `payout_batch_id`, `batch_status`, `amount`, `host_email`
- Status updates tracked automatically

## PayPal Sandbox Login

### For Guests:
- Use **Personal** sandbox account
- PayPal SDK automatically uses sandbox mode
- Login happens in PayPal popup window

### For Hosts:
- Use **Business** sandbox account
- Connect account in Settings → PayPal Account Integration
- Enter sandbox email address

### Testing Accounts Needed:
1. **Guest Account** (Personal):
   - Email: `?` (create in PayPal Developer Dashboard)
   - Password: `?`

2. **Host Account** (Business):
   - Email: `?` (create in PayPal Developer Dashboard)
   - Password: `?`

## Environment Variables

### Frontend (.env):
```env
VITE_PAYPAL_ENV=sandbox
VITE_PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
VITE_PAYOUTS_API_URL=  # Leave empty for Firebase Functions
```

### Backend (server/.env or Firebase Functions config):
```env
PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
PAYPAL_SECRET_SANDBOX=EDX-_Q61TP7Ek5XTQIVVXrVy9L5FY-Q-YRQ3ypyhEGtHjhgw9MqtdYMCz4fI3XqgZTgD6Tpkj4LoIXSM
PAYPAL_ENV=sandbox
```

## Security Notes

✅ **Secure Implementation:**
- PayPal Secret stored only in backend (never in frontend)
- OAuth tokens generated server-side
- All API calls go through backend
- Credentials in environment variables

❌ **Never Do:**
- Expose PayPal Secret in frontend code
- Log credentials in console
- Commit `.env` files to Git
- Hardcode credentials in code

## Testing

### Test Flow:
1. **Create Host Account**:
   - Sign up as host
   - Go to Settings → PayPal Account Integration
   - Enter host sandbox email
   - Connect account

2. **Create Guest Account**:
   - Sign up as guest
   - Use guest sandbox account for payments

3. **Make Test Booking**:
   - Guest books a listing
   - Select PayPal payment
   - Log in with guest sandbox account
   - Complete payment

4. **Verify Payout**:
   - Check Firestore `payouts` collection
   - Check host's PayPal sandbox account
   - Verify money was received

## Database Collections

### New Collections:
- **`payouts`**: Tracks all payout transactions
  - Fields: `payout_batch_id`, `hostPayPalEmail`, `amount`, `status`, `createdAt`

- **`payout_requests`**: Manual payout requests (if host account not connected)
  - Fields: `paymentId`, `hostId`, `amount`, `status`, `error`

## Troubleshooting

### Payout Fails:
1. Check host PayPal account is connected
2. Verify host email is correct
3. Check backend logs for errors
4. Verify PayPal credentials are correct
5. Check PayPal sandbox account has sufficient funds

### Guest Can't Login:
1. Ensure using sandbox personal account
2. Check PayPal SDK is loading (sandbox URL)
3. Verify Client ID is correct
4. Check browser console for errors

### Host Can't Connect:
1. Use business sandbox account email
2. Verify email format is correct
3. Check Firestore permissions

## Next Steps

1. **Create Sandbox Accounts**:
   - Create guest personal account
   - Create host business account
   - Fund both accounts

2. **Deploy Backend**:
   - Choose Firebase Functions or standalone server
   - Set credentials
   - Deploy/start server

3. **Test End-to-End**:
   - Guest payment → Automatic payout → Host receives money

## Files Created/Modified

### New Files:
- `functions/index.js` - Firebase Cloud Functions
- `functions/package.json` - Functions dependencies
- `server/paypal-payouts-server.js` - Standalone server
- `server/package.json` - Server dependencies
- `PAYPAL_AUTOMATED_PAYOUTS_SETUP.md` - This guide

### Modified Files:
- `src/services/paypalPayoutsService.js` - Updated to call backend
- `src/services/paypalService.js` - Added intent parameter
- `src/pages/guest/Booking.jsx` - Automatic payout trigger
- `.env.example` - Added all credentials

## Questions?

If you need help:
1. Check backend logs for errors
2. Verify PayPal credentials
3. Check Firestore for payout records
4. Test with PayPal sandbox accounts

