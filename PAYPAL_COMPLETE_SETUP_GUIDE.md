# Complete PayPal Sandbox Setup & Payment Transfer Guide

## Current Situation Analysis

### What You Have:
- ✅ Admin PayPal Sandbox Account: `sb-wvhfn47985802@business.example.com`
- ✅ Client ID: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`
- ✅ Guest can pay via PayPal (payment goes to admin account)
- ✅ Payment tracking in database with commission split
- ❌ **NO automatic transfer to hosts** (money stays in admin account)

### The Problem:
Currently, when a guest pays:
1. Payment goes to admin PayPal account ✅
2. Split is calculated and tracked in database ✅
3. **But money is NOT automatically transferred to host** ❌

## What You Need

### 1. PayPal Sandbox Accounts Setup

You need **THREE** PayPal sandbox accounts:

#### Account 1: Admin/Company (You have this ✅)
- **Email**: `sb-wvhfn47985802@business.example.com`
- **Password**: `1kBI+zc?`
- **Type**: Business Account
- **Purpose**: Receives all payments from guests
- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`

#### Account 2: Host Account (You need to create this)
- **Email**: Create a new sandbox business account
- **Type**: Business Account
- **Purpose**: Receives payments from admin after booking
- **How to create**: See steps below

#### Account 3: Guest Account (You need to create this)
- **Email**: Create a new sandbox personal account
- **Type**: Personal Account
- **Purpose**: Makes payments for bookings
- **How to create**: See steps below

### 2. PayPal Developer Dashboard Setup

#### Step 1: Access PayPal Developer Dashboard
1. Go to: https://developer.paypal.com/
2. Sign in with your PayPal account
3. Navigate to **Dashboard** → **My Apps & Credentials**

#### Step 2: Create Sandbox Accounts
1. Go to **Sandbox** → **Accounts**
2. Click **Create Account**
3. Create accounts:
   - **Host Account**: Business account, email like `sb-host@business.example.com`
   - **Guest Account**: Personal account, email like `sb-guest@personal.example.com`

#### Step 3: Get Sandbox Account Credentials
For each sandbox account:
1. Click on the account
2. Note the email and password
3. For business accounts, note the Client ID and Secret (if needed for Payouts API)

#### Step 4: Fund Sandbox Accounts
1. Go to **Sandbox** → **Accounts**
2. Click on each account
3. Click **Add Funds** or **Manage Account**
4. Add test funds (e.g., $10,000) to:
   - Guest account (for making payments)
   - Host account (to verify they can receive)

### 3. PayPal Payouts API Setup (For Automatic Transfers)

**IMPORTANT**: PayPal Payouts API requires:
- Server-side implementation (cannot be done purely client-side)
- PayPal REST API credentials (Client ID + Secret)
- Proper authentication

**Options**:x
1. **Option A**: Use PayPal Payouts API (requires backend server)
2. **Option B**: Manual transfers (admin manually sends money to hosts)
3. **Option C**: Use PayPal Marketplace (complex, requires approval)

For now, I'll implement **Option B** (tracking + manual transfer guide) and provide code for **Option A** (when you have a backend).

## Required Information From You

Please provide:

1. **Host PayPal Sandbox Account**:
   - Email: `?`
   - Password: `?`
   - Account Type: Business

2. **Guest PayPal Sandbox Account** (for testing):
   - Email: `?`
   - Password: `?`
   - Account Type: Personal

3. **PayPal REST API Credentials** (for Payouts API):
   - Go to PayPal Developer Dashboard
   - Navigate to your app
   - Get **Client ID** and **Secret** (for server-side)
   - Or confirm if you want to use client-side only

4. **Backend Server**:
   - Do you have a backend server? (Node.js, Python, etc.)
   - If yes, what technology?
   - If no, we'll use manual transfer tracking

## Next Steps

Once you provide the above information, I will:

1. ✅ Create PayPal Payouts service (for automatic transfers)
2. ✅ Update payment flow to transfer to hosts
3. ✅ Add host PayPal account verification
4. ✅ Create webhook handler (if you have backend)
5. ✅ Provide complete testing guide

## Current Implementation Status

- ✅ Guest payment flow (works)
- ✅ Payment tracking (works)
- ✅ Commission calculation (works)
- ❌ Automatic host payout (NOT implemented)
- ❌ Host account verification (basic only)
- ❌ Payment webhooks (NOT implemented)

## Testing Checklist

Before testing, ensure:
- [ ] Admin PayPal account has funds
- [ ] Host PayPal account is created and connected
- [ ] Guest PayPal account has funds
- [ ] All accounts are in sandbox mode
- [ ] Client ID is correct

