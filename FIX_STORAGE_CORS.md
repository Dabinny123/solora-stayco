# Fix CORS Error - Enable Firebase Storage

## Issue
The CORS error is happening because **Firebase Storage hasn't been set up** in your Firebase project yet.

## Solution

### Step 1: Enable Firebase Storage

1. Go to Firebase Console: https://console.firebase.google.com/project/solora-stayco/storage
2. Click **"Get Started"** button
3. Choose **"Start in production mode"** (we have security rules ready)
4. Select the same location as your Firestore database
5. Click **"Done"**

### Step 2: Deploy Storage Rules

After enabling Storage, run:

```bash
firebase deploy --only storage:rules
```

### Step 3: Verify

1. Refresh your browser
2. Try uploading a photo again
3. The CORS error should be gone!

## Alternative: Quick Setup via Firebase Console

If you prefer to set up Storage manually:

1. Go to: https://console.firebase.google.com/project/solora-stayco/storage
2. Click "Get Started"
3. Choose "Start in production mode"
4. Select location (same as Firestore)
5. Click "Done"
6. Then deploy rules: `firebase deploy --only storage:rules`

## What's Fixed

✅ **Firestore Indexes**: Added indexes for:
- `moods` collection (isActive, sortOrder)
- `notifications` collection (userId, isRead, createdAt)
- `listings` collection (hostId, status, createdAt)

✅ **Storage Rules**: Already configured to allow authenticated uploads

⏳ **Storage Setup**: Needs to be enabled in Firebase Console (one-time setup)

---

**After enabling Storage and deploying rules, photo uploads will work!**

