# Fix Firestore Permissions & Indexes

## Issues Fixed

### 1. Firestore Permission Errors ✅

**Fixed Rules:**
- ✅ **Users**: Can now read/update their own documents
- ✅ **Listings**: Guests can increment views (for analytics)
- ✅ **Payments**: Users and hosts can update payments (not just admin)
- ✅ **Payouts**: Added rules for new `payouts` collection
- ✅ **Payout Requests**: Added rules for `payout_requests` collection

### 2. Missing Firestore Indexes ✅

**Added Indexes:**
- ✅ **Notifications**: `userId` + `isRead` + `createdAt` (descending)
- ✅ **Reviews**: `listingId` + `status` + `createdAt` (descending)

### 3. PayPal Balance Unavailable ✅

**Fixed:**
- ✅ Added `intent: 'CAPTURE'` to order
- ✅ Added `payment_method` configuration
- ✅ Set `payer_selected: 'PAYPAL'` to allow PayPal balance
- ✅ Set `payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'`

## Deploy Changes

### Step 1: Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Step 2: Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

Or indexes will be created automatically when you click the links in the error messages.

## Testing

After deploying:
1. ✅ Users can read their own data
2. ✅ Payments can be created and updated
3. ✅ Listings views can be incremented
4. ✅ Notifications load without errors
5. ✅ Reviews load without errors
6. ✅ PayPal balance should be available

## PayPal Balance Fix

The PayPal balance "unavailable" issue should now be fixed. The order structure now:
- Explicitly allows PayPal as payment method
- Sets proper payment preferences
- Uses CAPTURE intent (required for balance)

If it still shows unavailable:
1. Check sandbox account has sufficient balance
2. Verify you're using sandbox account (not real account)
3. Try a smaller test amount

