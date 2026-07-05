# How to Access Admin Panel

## Quick Guide

Admin access requires a user account with `role: "admin"` in Firestore. The signup form only allows creating 'guest' or 'host' accounts for security reasons.

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

## Method 2: Using Browser Console (Development)

If you're in development mode and have access to the browser console:

1. **Sign in** to your account
2. **Open browser console** (F12 or Right-click → Inspect → Console)
3. **Run this command**:
   ```javascript
   // Import the function
   import { updateDocument } from './src/firebase/firestoreService.js';
   import { getCurrentUser } from './src/auth/authService.js';
   
   // Get current user
   const user = getCurrentUser();
   
   // Update role
   await updateDocument('users', user.uid, { role: 'admin' });
   console.log('Admin role assigned! Refresh the page.');
   ```

4. **Refresh the page** to see admin access

---

## Method 3: Using Admin Panel (If You Already Have Admin Access)

If you already have an admin account, you can promote other users:

1. Sign in as admin
2. Go to **Admin Dashboard** → **User Management**
3. Search for the user by email or name
4. Use the role dropdown to change their role to **Admin**
5. Click to confirm

---

## Verify Admin Access

After updating the role, verify admin access:

1. **Check Navigation**: You should see "Admin Panel" link in the header
2. **Access Dashboard**: Navigate to `/admin/dashboard`
3. **View Features**: You should see:
   - User Management
   - Payment Review
   - Service Fee Control
   - Reports Generation

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

---

**Last Updated**: December 2024

