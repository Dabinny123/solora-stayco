# PayPal Split Payment Setup - Information Needed

## What We're Implementing

1. **Payment Options**:
   - Down Payment (percentage or fixed amount)
   - Full Payment
   - Custom Amount (minimum = down payment)

2. **Split Payment**:
   - Guest pays total amount via PayPal
   - Payment is split between:
     - **Host Account**: Base price + cleaning fee - service fee
     - **Admin/Company Account**: Service fee (commission)

3. **PayPal Sandbox Flow**:
   - Guest logs into PayPal sandbox
   - Payment popup shows total amount
   - Payment is processed
   - Split is tracked in database

## Information I Need From You

### 1. Host PayPal Sandbox Account
- **Email**: (e.g., `sb-host@business.example.com`)
- **Password**: (if you have one set)
- **Account Type**: Business Account

### 2. Admin/Company PayPal Sandbox Account
- **Email**: `sb-wvhfn47985802@business.example.com` (you already provided this)
- **Password**: `1kBI+zc?` (you already provided this)
- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`

### 3. Down Payment Settings
- **Down Payment Percentage**: (e.g., 20%, 30%, 50%)
- **OR Down Payment Fixed Amount**: (e.g., $100 minimum)
- **Which do you prefer?**

### 4. Payment Split Method
For sandbox testing, we have two options:

**Option A: Single Payment + Track Split** (Easier, works immediately)
- Guest pays full amount to one PayPal account
- We track the split in database
- Later, manually transfer or use PayPal Payouts API

**Option B: PayPal Marketplace** (More complex, requires approval)
- Requires PayPal Business account with marketplace features
- Direct split at payment time
- Requires server-side implementation

**Which option do you prefer for now?**

## Current Implementation Plan

I'll implement:
1. ✅ Payment amount selector (Down Payment / Full / Custom)
2. ✅ PayPal sandbox login flow
3. ✅ Payment breakdown display (showing split)
4. ✅ Track split payments in database
5. ⏳ Actual split payment (depends on your choice above)

## Next Steps

Please provide:
1. Host PayPal sandbox account email
2. Down payment percentage or amount
3. Preferred split payment method (Option A or B)

Once I have this, I'll implement the full payment flow!

