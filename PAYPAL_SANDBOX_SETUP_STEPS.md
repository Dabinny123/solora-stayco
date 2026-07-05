# PayPal Sandbox Setup - Step-by-Step Guide

## Current Status

✅ **You Have:**
- Admin PayPal Sandbox Account: `sb-wvhfn47985802@business.example.com`
- Client ID: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`
- Guest payment flow (working)
- Payment tracking (working)

❌ **You Need:**
- Host PayPal Sandbox Account
- Guest PayPal Sandbox Account (for testing)
- PayPal Payouts API setup (for automatic transfers)

---

## Step 1: Create Sandbox Accounts

### 1.1 Access PayPal Developer Dashboard

1. Go to: **https://developer.paypal.com/**
2. Sign in with your PayPal account
3. Navigate to: **Dashboard** → **Sandbox** → **Accounts**

### 1.2 Create Host Business Account

1. Click **"Create Account"** button
2. Select **"Business"** account type
3. Fill in:
   - **Email**: `sb-host@business.example.com` (or any email)
   - **Password**: Create a password (e.g., `TestHost123!`)
   - **Country**: United States (or your country)
4. Click **"Create Account"**
5. **Save these credentials** - you'll need them!

### 1.3 Create Guest Personal Account

1. Click **"Create Account"** again
2. Select **"Personal"** account type
3. Fill in:
   - **Email**: `sb-guest@personal.example.com` (or any email)
   - **Password**: Create a password (e.g., `TestGuest123!`)
   - **Country**: United States (or your country)
4. Click **"Create Account"**
5. **Save these credentials** - you'll need them!

### 1.4 Fund Sandbox Accounts

1. Go to **Sandbox** → **Accounts**
2. For each account, click on it
3. Click **"Add Funds"** or **"Manage Account"**
4. Add test funds:
   - **Guest Account**: Add $10,000 (for making payments)
   - **Host Account**: Add $1,000 (to verify they can receive)
   - **Admin Account**: Should already have funds

---

## Step 2: Get PayPal REST API Credentials (For Payouts)

### 2.1 Access Your App

1. Go to **Dashboard** → **My Apps & Credentials**
2. Find your app (the one with Client ID: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`)
3. Click on it

### 2.2 Get Client Secret

1. Under **"Sandbox"** section, you'll see:
   - **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW` ✅
   - **Secret**: Click **"Show"** to reveal it
2. **Copy the Secret** - you'll need this for server-side Payouts API

**⚠️ IMPORTANT**: The Secret should NEVER be exposed in client-side code. It's only for server-side use.

---

## Step 3: Configure Your Application

### 3.1 Update Environment Variables

Add to your `.env` file:

```env
# PayPal Configuration
VITE_PAYPAL_ENV=sandbox
VITE_PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW

# PayPal Payouts API (Server-side only - DO NOT expose in frontend)
# These should be in your backend server's environment variables
PAYPAL_SECRET_SANDBOX=your_secret_here
PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
```

### 3.2 Connect Host PayPal Account

1. Sign in to your app as a **Host**
2. Go to **Settings** → **Account Settings**
3. Scroll to **"PayPal Account Integration"**
4. Enter the **Host PayPal Email** (from Step 1.2)
5. Click **"Connect PayPal Account"**

---

## Step 4: Test the Payment Flow

### 4.1 Test as Guest

1. Sign in as **Guest** (or create a guest account)
2. Go to a listing and click **"Book"**
3. Fill in booking details
4. Select **PayPal** as payment method
5. Click **PayPal button**
6. **Log in with Guest PayPal Account** (from Step 1.3)
7. Complete payment

### 4.2 Verify Payment

1. Check **Admin PayPal Sandbox Account**:
   - Go to: https://www.sandbox.paypal.com
   - Log in with: `sb-wvhfn47985802@business.example.com`
   - Check **Activity** → You should see the payment received

2. Check **Database**:
   - Go to Firestore → `payments` collection
   - Find the payment record
   - Verify `commission.hostEarnings` is calculated correctly

3. Check **Payout Request**:
   - Go to Firestore → `payout_requests` collection
   - You should see a payout request for the host

---

## Step 5: Manual Payout to Host (For Testing)

Since automatic payouts require a backend server, you can test manually:

### 5.1 Manual Transfer via PayPal Sandbox

1. Log in to PayPal Sandbox: https://www.sandbox.paypal.com
2. Use **Admin Account**: `sb-wvhfn47985802@business.example.com`
3. Go to **Send & Request** → **Send Money**
4. Enter:
   - **Email**: Host's PayPal email (from Step 1.2)
   - **Amount**: Check `payout_requests` collection for the amount
   - **Note**: "Booking [ID] - Host Earnings"
5. Complete the transfer

### 5.2 Mark Payout as Completed

After manual transfer, update the payout request in Firestore:
- Set `status` to `"completed"`
- Set `processedAt` to current timestamp

---

## Step 6: Automatic Payouts (Requires Backend Server)

For automatic payouts, you need a backend server. Here's what you need:

### 6.1 Backend Requirements

- Node.js, Python, or any server technology
- PayPal REST API SDK
- Secure storage for Client ID and Secret

### 6.2 Backend Endpoint Needed

Create an endpoint like: `POST /api/paypal/payout`

This endpoint should:
1. Authenticate the request
2. Get PayPal access token using Client ID + Secret
3. Call PayPal Payouts API
4. Transfer money to host
5. Update payout request status

### 6.3 Example Backend Code (Node.js)

```javascript
// Backend endpoint example (Node.js)
app.post('/api/paypal/payout', async (req, res) => {
  const { hostEmail, amount, currency, bookingId } = req.body;
  
  // Get access token
  const accessToken = await getPayPalAccessToken();
  
  // Create payout
  const payout = await fetch('https://api.sandbox.paypal.com/v1/payments/payouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `batch_${Date.now()}`,
        email_subject: 'You have a payout from Solora StayCo',
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toString(),
          currency: currency,
        },
        receiver: hostEmail,
        note: `Host earnings for booking ${bookingId}`,
      }],
    }),
  });
  
  const result = await payout.json();
  res.json(result);
});
```

---

## Information I Need From You

Please provide:

1. **Host PayPal Sandbox Account**:
   - Email: `?`
   - Password: `?`

2. **Guest PayPal Sandbox Account** (for testing):
   - Email: `?`
   - Password: `?`

3. **PayPal Secret** (from Step 2.2):
   - Secret: `?` (This is sensitive - you can share it, but keep it secure)

4. **Backend Server**:
   - Do you have a backend server? (Yes/No)
   - If yes, what technology? (Node.js, Python, etc.)
   - If no, we'll use manual transfer tracking

---

## Current Implementation

✅ **What's Working:**
- Guest can pay via PayPal
- Payment goes to admin account
- Commission split is calculated
- Payout requests are tracked in database

⏳ **What's Pending:**
- Automatic transfer to hosts (requires backend)
- Host PayPal account verification
- Payment webhooks (requires backend)

---

## Next Steps

Once you provide the information above, I will:

1. ✅ Update the code to use your host/guest accounts
2. ✅ Create automatic payout service (if you have backend)
3. ✅ Add payout management in admin dashboard
4. ✅ Create testing guide with your specific accounts
5. ✅ Fix any remaining issues

**Please provide the information requested above!**

