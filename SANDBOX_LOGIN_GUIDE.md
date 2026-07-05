# How to Login as Guest/Host Using PayPal Sandbox

## Overview

The PayPal integration is configured to use **sandbox mode** for testing. This means guests and hosts will log into PayPal sandbox accounts, NOT their real PayPal accounts.

## PayPal SDK Configuration

The PayPal SDK is automatically configured to use sandbox mode:
- **Sandbox URL**: `https://www.sandbox.paypal.com/sdk/js`
- **Environment**: Set via `VITE_PAYPAL_ENV=sandbox` in `.env`

## Guest Login Flow

### How It Works:
1. Guest selects PayPal as payment method
2. Guest clicks PayPal button
3. PayPal popup opens (sandbox.paypal.com)
4. Guest logs in with **sandbox personal account**
5. Payment is processed through sandbox

### Testing as Guest:
1. **Create Sandbox Personal Account**:
   - Go to: https://developer.paypal.com/
   - Navigate to: Sandbox → Accounts
   - Click "Create Account"
   - Select "Personal" account type
   - Email: `sb-guest@personal.example.com` (or any email)
   - Password: Create a password
   - **Save credentials**

2. **Fund the Account**:
   - Click on the account
   - Add test funds (e.g., $10,000)

3. **Use in App**:
   - When PayPal popup appears, use the sandbox email/password
   - Complete payment

## Host Login/Connection Flow

### How It Works:
1. Host goes to Settings → PayPal Account Integration
2. Host enters their **sandbox business account email**
3. System connects the account (stores email in database)
4. When payout is processed, money goes to this email

### Testing as Host:
1. **Create Sandbox Business Account**:
   - Go to: https://developer.paypal.com/
   - Navigate to: Sandbox → Accounts
   - Click "Create Account"
   - Select "Business" account type
   - Email: `sb-host@business.example.com` (or any email)
   - Password: Create a password
   - **Save credentials**

2. **Connect in App**:
   - Sign in as host
   - Go to Settings → PayPal Account Integration
   - Enter sandbox business email
   - Click "Connect PayPal Account"

3. **Verify Connection**:
   - Account shows as "Connected"
   - Email is displayed
   - Ready to receive payouts

## Sandbox Account Types

### Personal Account (For Guests):
- **Purpose**: Make payments
- **Type**: Personal
- **Features**: Can send/receive money, link cards
- **Use Case**: Guest booking payments

### Business Account (For Hosts):
- **Purpose**: Receive payouts
- **Type**: Business
- **Features**: Can receive payments, business features
- **Use Case**: Host earnings from bookings

### Business Account (For Admin):
- **Purpose**: Receive all payments, send payouts
- **Type**: Business
- **Email**: `sb-wvhfn47985802@business.example.com`
- **Use Case**: Platform admin account

## Important Notes

### ✅ Sandbox Mode is Active:
- All PayPal interactions use sandbox
- No real money is involved
- Perfect for testing

### ✅ Login Happens in Popup:
- PayPal SDK opens a popup window
- User logs in within the popup
- Popup closes after authentication

### ✅ No Real PayPal Accounts Needed:
- Guests don't need real PayPal accounts
- Hosts don't need real PayPal accounts
- All testing uses sandbox accounts

## Troubleshooting

### "PayPal balance unavailable":
- Ensure sandbox account has funds
- Check you're using sandbox account (not real account)
- Verify Client ID is sandbox Client ID

### "Can't login to PayPal":
- Verify you're using sandbox account credentials
- Check popup isn't blocked by browser
- Ensure sandbox.paypal.com is accessible

### "Host payout failed":
- Verify host connected sandbox business account
- Check host email is correct
- Ensure admin account has sufficient funds

## Testing Checklist

- [ ] Guest sandbox personal account created
- [ ] Guest account has test funds
- [ ] Host sandbox business account created
- [ ] Host account connected in app settings
- [ ] Admin sandbox business account configured
- [ ] All accounts are in sandbox mode
- [ ] PayPal SDK loads correctly (check console)
- [ ] Guest can log in and pay
- [ ] Host receives automatic payout

## Current Configuration

- **Environment**: Sandbox ✅
- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`
- **Admin Account**: `sb-wvhfn47985802@business.example.com`
- **SDK URL**: `https://www.sandbox.paypal.com/sdk/js`

## Next Steps

1. Create guest and host sandbox accounts
2. Fund the accounts
3. Test the complete flow:
   - Guest payment → Admin receives → Automatic payout → Host receives

