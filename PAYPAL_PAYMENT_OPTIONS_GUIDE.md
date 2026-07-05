# PayPal Payment Options - Implementation Guide

## ✅ What's Been Implemented

### 1. Payment Type Options
- **Full Payment**: Pay the entire booking amount upfront
- **Down Payment**: Pay 30% of the total (default, configurable)
- **Custom Amount**: Pay any amount between down payment and full amount

### 2. Payment Split Tracking
- **Host Earnings**: Base price + cleaning fee - service fee
- **Admin Commission**: Service fee (configurable percentage)
- Split is calculated proportionally for partial payments

### 3. PayPal Sandbox Integration
- Guest can log into PayPal sandbox
- Payment popup shows total amount and breakdown
- Payment is processed through PayPal
- Split is tracked in database

### 4. Payment Breakdown Display
- Shows total amount
- Shows payment amount (if partial)
- Shows remaining balance (if partial)
- Shows host earnings split
- Shows admin commission split

## 📋 Information Still Needed

To complete the implementation, please provide:

### 1. Host PayPal Sandbox Account
- **Email**: (e.g., `sb-host@business.example.com`)
- **Password**: (if you have one set)

### 2. Down Payment Configuration
- **Current**: 30% (hardcoded)
- **Preferred**: What percentage or fixed amount?

### 3. Payment Split Method
Currently, we're using **Option A** (Single Payment + Track Split):
- Guest pays full amount to admin PayPal account
- Split is tracked in database
- Later, you can manually transfer or use PayPal Payouts API

**Alternative Option B** (PayPal Marketplace):
- Requires PayPal Business account with marketplace features
- Direct split at payment time
- Requires server-side implementation

## 🔧 How It Works Now

### For Guests:
1. Select booking dates and guest information
2. Choose PayPal as payment method
3. Select payment type:
   - **Full Payment**: Pay entire amount
   - **Down Payment**: Pay 30% (minimum)
   - **Custom Amount**: Pay any amount ≥ 30%
4. See payment breakdown showing:
   - Total amount
   - Payment amount
   - Remaining balance (if partial)
   - Host earnings split
   - Admin commission split
5. Click PayPal button → Login to PayPal sandbox
6. Complete payment

### Payment Flow:
```
Guest Payment → Admin PayPal Account
                ↓
         Track Split in Database:
         - Host Earnings: $X
         - Admin Commission: $Y
```

### Database Tracking:
- **Booking**: Tracks `paymentStatus` ('paid' or 'partial'), `remainingBalance`, `totalPaid`
- **Payment**: Tracks `amount`, `totalAmount`, `remainingBalance`, `commission` split

## 🚀 Next Steps

1. **Provide Host PayPal Account**: So we can set up proper split payments
2. **Configure Down Payment**: Set your preferred percentage or amount
3. **Test Payment Flow**: 
   - Use PayPal sandbox test accounts
   - Test full payment
   - Test down payment
   - Test custom amount
4. **Verify Split Tracking**: Check that splits are correctly calculated and stored

## 📝 Notes

- **Current Implementation**: Single payment to admin account with split tracking
- **Future Enhancement**: Can implement PayPal Payouts API for automatic transfers
- **Sandbox Testing**: All payments go through PayPal sandbox for testing
- **Production**: Will need production PayPal credentials when ready

## 🧪 Testing

1. **Test Accounts**:
   - Guest: Use any PayPal sandbox personal account
   - Admin: `sb-wvhfn47985802@business.example.com` (you provided)

2. **Test Scenarios**:
   - ✅ Full payment
   - ✅ Down payment (30%)
   - ✅ Custom amount (between 30% and 100%)
   - ✅ Validation (custom amount < 30% should be rejected)

3. **Verify**:
   - Payment is processed
   - Split is calculated correctly
   - Remaining balance is tracked (for partial payments)
   - Booking status is updated

## 💡 Questions?

If you need any changes or have questions about the implementation, let me know!

