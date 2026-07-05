# Firebase Connection Status

This document describes how Solora StayCo connects to Firebase and how to verify the connection for **Auth** and **Roles**.

## Services Connected

| Service | Purpose | Status |
|---------|---------|--------|
| **Firebase Auth** | User sign-up, sign-in, email verification | ✅ Configured |
| **Firestore** | Users, roles, moods, listings, bookings | ✅ Configured |
| **Firebase Storage** | Optional: profile photos, listing uploads (listings default to base64 in Firestore) | ✅ Configured |
| **Firebase Analytics** | Usage tracking | ✅ Configured |

## Auth & Roles Flow

### Authentication
- **Config**: `src/firebase/firebaseConfig.js`
- **Auth Service**: `src/auth/authService.js` – `signUp`, `signIn`, `signOut`, `onAuthStateChanged`
- **Auth Context**: `src/contexts/AuthContext.jsx` – provides `currentUser`, `userData`, `isAuthenticated`

### User Roles (Firestore)
- **Collection**: `users`
- **Document ID**: Firebase Auth UID
- **Role field**: `role` – `'guest'`, `'host'`, or `'admin'`
- **Role service**: `src/firebase/roleService.js` – `isAdmin`, `isHost`, `updateUserRole`

### Collections Used
| Collection | Purpose |
|------------|---------|
| `users` | User profiles, roles, preferences, wallet |
| `moods` | Mood categories (Relaxed, Romantic, etc.) |
| `listings` | Staycation listings |
| `bookings` | Reservations |
| `bookings` (status: completed) | Used for "Happy Guests" count on landing |

## Verify Firebase Connection

### 1. Run the test script
In the browser console (after the app is loaded):

```javascript
import('./src/firebase/testConnection.js').then(({ testFirebaseConnection, displayTestResults }) => {
  testFirebaseConnection().then(displayTestResults);
});
```

### 2. Manual checks
- **Sign up** a new user → should create a document in Firestore `users` with `role: 'guest'`
- **Sign in** → `currentUser` and `userData` should be populated in AuthContext
- **Admin panel** → Sign in as admin, go to `/admin/dashboard` – if you see it, auth + roles work

### 3. Firestore rules
Ensure your `firestore.rules` allow:
- Read/write `users/{userId}` for the authenticated user
- Read `moods` (public)
- Read `listings` where status is active
- Write to `bookings` for authenticated users

## Seeding Data

### Mood categories
1. Sign in as **admin**
2. Go to **Admin → Moods** (`/admin/moods`)
3. Click **Seed Default Moods** to add the 8 mood categories (Relaxed, Romantic, etc.) to Firestore
4. The landing page "Mood Types" count and Explore mood pills will reflect this

### Admin user
Use the browser console script (see `scripts/createAdmin.js`):
```javascript
makeCurrentUserAdmin();  // Makes the currently signed-in user an admin
```

### Home stats (Happy Guests count)
The landing "Happy Guests" number reads from `settings/homeStats.completedBookingsCount` (public read) to avoid permission errors for unauthenticated users. Create this document in Firebase Console:

1. Go to **Firestore** → **settings** collection
2. Add document with ID `homeStats` and field: `completedBookingsCount` (number)
3. Set the value to your completed bookings count (you can update it manually or via a Cloud Function when bookings complete)

If the document does not exist, the app shows 0.

## Security & npm audit

- **Firebase** is pinned to **v12.9.0** so `npm audit` reports 0 vulnerabilities (older 10.x had transitive `undici` issues).
- **Config**: Keep `firebaseConfig` in sync with the Firebase Console (and any CDN snippet). `storageBucket` is part of the project and stays in config even if you only use base64 for listing photos.
- **Backend**: Auth, Firestore, Storage, Analytics, and Functions all use the same `firebaseConfig`; deploy indexes with `firebase deploy --only firestore:indexes` when needed.
