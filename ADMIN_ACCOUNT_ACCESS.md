# How to Access Admin Account

## Quick Guide

To access the admin panel, you need to set your user account's role to `"admin"` in Firestore.

---

## Method 1: Using Firebase Console (Recommended)

### Step 1: Create a Regular Account
1. Sign up on the website as either Guest or Host
2. Note the email address you used

### Step 2: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **solora-stayco**
3. Navigate to **Firestore Database**

### Step 3: Update User Role
1. Click on the **users** collection
2. Find the user document (the document ID is the Firebase Auth UID)
   - You can identify it by the `email` field matching your signup email
3. Click on the document to open it
4. Click the **Edit** button (pencil icon)
5. Find the `role` field
6. Change the value from `"guest"` or `"host"` to `"admin"`
7. Click **Update**

### Step 4: Access Admin Panel
1. Sign out and sign back in (or refresh the page)
2. You should now see "Admin Panel" in the navigation menu
3. Navigate to `/admin/dashboard` or click "Admin Panel" in the header

---

## Method 2: Using Browser Console (Development Only)

If you're in development mode and have access to the browser console:

1. **Sign in** to your account
2. **Open browser console** (F12 or Right-click → Inspect → Console)
3. **Run this command**:
   ```javascript
   // Get current user
   const user = firebase.auth().currentUser;
   
   // Update role in Firestore
   import { updateDocument } from './src/firebase/firestoreService.js';
   await updateDocument('users', user.uid, { role: 'admin' });
   console.log('Admin role assigned! Refresh the page.');
   ```

4. **Refresh the page** to see admin access

---

## Admin Features

Once you have admin access, you can:

1. **Admin Dashboard** (`/admin/dashboard`)
   - View platform statistics
   - Monitor bookings and payments
   - Manage users

2. **Service Fee Control** (`/admin/service-fee`)
   - Set the platform commission percentage
   - Default is 10% of booking amount
   - This percentage goes to the admin account

3. **Payment Management** (`/admin/payments`)
   - View all payments
   - Track commission earnings
   - Monitor payment status

4. **User Management** (`/admin/users`)
   - View all users
   - Change user roles
   - Manage user accounts

5. **Reports** (`/admin/reports`)
   - Generate platform reports
   - View analytics

---

## Commission/Payment Split

### How It Works

When a guest makes a booking:
1. **Total Amount**: Guest pays the full booking amount (base price + cleaning fee + service fee)
2. **Service Fee**: A percentage (default 10%) goes to the admin account
3. **Host Earnings**: Base price + cleaning fee goes to the host

### Example

For a booking of $100 per night for 3 nights:
- Base Price: $300 (3 nights × $100)
- Cleaning Fee: $50
- Service Fee (10%): $30 (10% of $300)
- **Total Guest Pays**: $380
- **Host Receives**: $350 (base + cleaning fee)
- **Admin Receives**: $30 (service fee)

### Setting Service Fee

1. Sign in as admin
2. Go to **Admin Panel** → **Service Fee Control**
3. Set the percentage (e.g., 10%)
4. Click **Save Changes**

---

## Admin PayPal Account

The admin business account PayPal credentials:
- **Email**: `sb-wvhfn47985802@business.example.com`
- **Password**: `1kBI+zc?`
- **Client ID**: `AXwUw5NDhKtem6HJg4XJXuMOpawav07bL2st4QHO2alMoVS_uZYtMcd4dEh5JFhf5_F-scS_wcZ_omkW`

**Note**: This is a sandbox account for testing. In production, use your actual PayPal business account.

---

## Troubleshooting

### Admin Panel Not Showing
- **Solution**: Sign out and sign back in to refresh auth state
- **Alternative**: Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)

### Can't Access Admin Routes
- **Check**: Verify `role: "admin"` in Firestore user document
- **Check**: Ensure you're signed in with the correct account
- **Check**: Clear browser cache and cookies

### Permission Denied Errors
- **Check**: Firestore security rules allow role updates
- **Check**: You have proper Firebase permissions
- **Check**: User document exists in Firestore

---

## Security Note

⚠️ **Important**: Admin access should be restricted. Only assign admin role to trusted users. The signup form intentionally does not allow creating admin accounts directly.

---

## Quick Reference

**Firestore Path**: `users/{userId}/role = "admin"`

**Admin Routes**:
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - User management
- `/admin/payments` - Payment review
- `/admin/service-fee` - Service fee control
- `/admin/reports` - Reports generation
- `/admin/moods` - Mood management

**Last Updated**: December 2024

