# PayPal Account Linking Implementation

## Overview

This document describes the PayPal account linking feature that requires hosts to connect their PayPal account before creating listings.

## Features Implemented

### 1. PayPal Account Linking Service (`src/services/paypalAccountService.js`)

A new service that handles:
- Checking if a user has PayPal connected
- Getting PayPal account status
- Connecting PayPal accounts (simplified for sandbox)
- Disconnecting PayPal accounts

**Key Functions:**
- `hasPayPalConnected(userId)` - Check connection status
- `getPayPalAccountStatus(userId)` - Get account details
- `connectPayPalAccountSimple(userId, email)` - Connect account (sandbox)
- `disconnectPayPalAccount(userId)` - Disconnect account

### 2. Account Settings Integration

**Location**: `src/pages/guest/AccountSettings.jsx`

Added a new "PayPal Account Integration" section that:
- Shows connection status
- Allows hosts and guests to connect/disconnect PayPal
- Displays connected PayPal email
- Shows connection date
- Includes terms and conditions

**Features:**
- Connection status indicator (green badge when connected)
- Email input for PayPal account
- Connect/Disconnect buttons
- Collapsible terms and conditions section

### 3. Create Listing Protection

**Location**: `src/pages/host/CreateListing.jsx`

Added protection that:
- Checks PayPal connection on page load
- Shows a floating notification banner if not connected
- Displays a modal with terms and conditions
- Prevents listing creation without PayPal connection
- Provides direct link to settings page

**UI Components:**
- **Floating Banner**: Yellow notification at top of page
- **Modal Dialog**: Full-screen modal with terms and connection instructions
- **Form Validation**: Blocks submission if PayPal not connected

### 4. User Model Update

**Location**: `src/models/dataModels.js`

Added PayPal account fields to user model:
```javascript
paypalAccount: {
  isConnected: false,
  email: null,
  merchantId: null,
  connectedAt: null,
}
```

## User Flow

### For Hosts

1. **Sign up as Host** → Account created
2. **Navigate to Create Listing** → System checks PayPal connection
3. **If not connected**:
   - Floating banner appears
   - Modal shows with terms
   - User redirected to Settings
4. **In Settings**:
   - Enter PayPal email
   - Click "Connect PayPal Account"
   - Account connected
5. **Return to Create Listing**:
   - Banner disappears
   - Can now create listings

### For Guests

1. **Navigate to Settings** → PayPal Account Integration section
2. **Optional**: Connect PayPal for faster checkout
3. **Not required** for booking (can use other payment methods)

## Terms and Conditions

The following terms are displayed to users:

1. **Payment Processing**: PayPal as payment processor
2. **Account Verification**: Account must be verified
3. **Transaction Fees**: Standard PayPal fees apply
4. **Payout Schedule**: According to PayPal's schedule
5. **Account Security**: User responsible for security
6. **Compliance**: Must comply with laws and regulations
7. **Disconnection**: Can disconnect anytime (listings paused)
8. **Liability**: Solora StayCo not responsible for PayPal issues

## Configuration

### Environment Variables

```env
VITE_PAYPAL_ENV=sandbox
VITE_PAYPAL_CLIENT_ID_SANDBOX=AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW
```

### Sandbox Credentials

- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`
- **Business Account Email**: `sb-wvhfn47985802@business.example.com`
- **Password**: `1kBI+zc?`

## Testing

### Test Flow

1. **Create a host account** (or switch existing to host)
2. **Try to create listing** → Should see PayPal requirement
3. **Go to Settings** → Connect PayPal with sandbox email
4. **Return to Create Listing** → Should work now
5. **Create a listing** → Should succeed

### Verification

- Check Firestore `users` collection for `paypalAccount` field
- Verify `isConnected: true` after connection
- Test listing creation with/without PayPal connection

## Security Considerations

1. **Client-Side Only**: Current implementation is simplified for sandbox
2. **Production**: Should implement proper OAuth flow with backend
3. **Verification**: Should verify PayPal account status server-side
4. **Token Storage**: Don't store sensitive PayPal tokens client-side

## Future Enhancements

1. **OAuth Flow**: Implement proper PayPal OAuth for production
2. **Backend Verification**: Server-side PayPal account verification
3. **Webhook Integration**: Handle PayPal webhooks for account status
4. **Multiple Payment Methods**: Support other payment processors
5. **Account Status Monitoring**: Check PayPal account health periodically

## Files Modified

- `src/services/paypalAccountService.js` (new)
- `src/pages/guest/AccountSettings.jsx` (updated)
- `src/pages/host/CreateListing.jsx` (updated)
- `src/models/dataModels.js` (updated)
- `PAYPAL_SETUP.md` (updated)

## Notes

- Current implementation uses simplified connection for sandbox testing
- In production, implement proper PayPal Onboarding API
- Consider adding email verification for PayPal accounts
- Add admin panel to view/manage PayPal connections

